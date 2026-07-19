/**
 * Single Gemini gateway (D-05): hand-rolled streaming + function-calling loop
 * so the SSE protocol can carry structured map events, and so degraded mode
 * has one switch to flip. All calls are server-side only.
 *
 * Failure policy (see docs/ARCHITECTURE.md):
 *  - missing key            → throw GeminiUnavailable immediately (caller falls back)
 *  - first-token timeout 8s → abort + throw
 *  - initial call error     → one retry after 300ms, then throw
 *  - tool loop              → max 3 rounds, then final no-tools pass
 */

import {
  GoogleGenAI,
  type Content,
  type GenerateContentResponse,
  type Part,
} from "@google/genai";
import type { ChatEvent, ChatMessage } from "@/lib/types";
import { MODEL_ID, fewShot, systemPrompt, toolDeclarations } from "@/lib/prompts";
import { executeTool } from "@/lib/tools";

export class GeminiUnavailable extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "GeminiUnavailable";
  }
}

const FIRST_TOKEN_TIMEOUT_MS = 8_000;
const MAX_TOOL_ROUNDS = 3;
const MAX_INPUT_CHARS = 2_000;

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiUnavailable("GEMINI_API_KEY not set");
  return new GoogleGenAI({ apiKey });
}

function toContents(messages: ChatMessage[]): Content[] {
  return messages.slice(-12).map((m) => ({
    role: m.role,
    parts: [{ text: m.text.slice(0, MAX_INPUT_CHARS) }],
  }));
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new GeminiUnavailable(label)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

interface StreamOpts {
  messages: ChatMessage[];
  accessibilityMode?: boolean;
  seat?: string;
}

async function startStream(ai: GoogleGenAI, contents: Content[], opts: StreamOpts) {
  return ai.models.generateContentStream({
    model: MODEL_ID,
    contents,
    config: {
      systemInstruction: systemPrompt({
        accessibilityMode: opts.accessibilityMode,
        seat: opts.seat,
      }),
      tools: [{ functionDeclarations: toolDeclarations }],
      temperature: 0.4,
    },
  });
}

/**
 * Stream a grounded, tool-using chat turn as ChatEvents.
 * Throws GeminiUnavailable when the caller should switch to lib/fallback.ts.
 */
export async function* streamChat(opts: StreamOpts): AsyncGenerator<ChatEvent> {
  const ai = client();
  const contents: Content[] = [...fewShot, ...toContents(opts.messages)];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    // Initial network call: one retry with short backoff, 8s first-token cap.
    let stream: Awaited<ReturnType<typeof startStream>>;
    try {
      stream = await withTimeout(startStream(ai, contents, opts), FIRST_TOKEN_TIMEOUT_MS, "connect timeout");
    } catch (e) {
      if (e instanceof GeminiUnavailable) throw e;
      await new Promise((r) => setTimeout(r, 300));
      try {
        stream = await withTimeout(startStream(ai, contents, opts), FIRST_TOKEN_TIMEOUT_MS, "connect timeout (retry)");
      } catch {
        throw new GeminiUnavailable("Gemini call failed after retry");
      }
    }

    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const modelParts: Part[] = [];
    let sawText = false;

    const iterator = stream[Symbol.asyncIterator]();
    let first = true;
    while (true) {
      let result: IteratorResult<GenerateContentResponse>;
      try {
        result = first
          ? await withTimeout(iterator.next(), FIRST_TOKEN_TIMEOUT_MS, "first token timeout")
          : await iterator.next();
      } catch (e) {
        if (e instanceof GeminiUnavailable && first) throw e;
        throw new GeminiUnavailable("stream interrupted");
      }
      first = false;
      if (result.done) break;
      const chunk = result.value;
      const parts = chunk.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.text) {
          sawText = true;
          modelParts.push({ text: part.text });
          yield { type: "text", text: part.text };
        }
        if (part.functionCall?.name) {
          calls.push({
            name: part.functionCall.name,
            args: (part.functionCall.args ?? {}) as Record<string, unknown>,
          });
          modelParts.push({ functionCall: part.functionCall });
        }
      }
    }

    if (calls.length === 0) {
      if (!sawText) yield { type: "text", text: "…" };
      return; // finished a normal text turn
    }

    if (round === MAX_TOOL_ROUNDS) {
      // Safety valve: model keeps asking for tools — stop the loop.
      yield {
        type: "text",
        text: " I have the details above — ask me anything else about the stadium!",
      };
      return;
    }

    // Execute tools, surface structured events, then continue the loop.
    const responseParts: Part[] = [];
    for (const call of calls) {
      const outcome = executeTool(call.name, call.args);
      if (outcome.event) yield outcome.event;
      responseParts.push({
        functionResponse: { name: call.name, response: outcome.forModel },
      });
    }
    contents.push({ role: "model", parts: modelParts });
    contents.push({ role: "user", parts: responseParts });
  }
}
