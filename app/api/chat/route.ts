/**
 * POST /api/chat — SSE endpoint for the fan copilot.
 * Events: text | route | crowd | transport | degraded | done | error
 * (see ChatEvent in lib/types.ts — one JSON object per `data:` line).
 *
 * The Gemini path and the fallback path emit IDENTICAL event shapes, so the
 * client cannot tell them apart except for the `degraded` badge (D-08).
 */

import { NextRequest } from "next/server";
import type { ChatEvent, ChatMessage } from "@/lib/types";
import { GeminiUnavailable, streamChat } from "@/lib/gemini";
import { fallbackRespond } from "@/lib/fallback";

export const runtime = "nodejs";
export const maxDuration = 30;

// Best-effort per-IP soft cap (module scope survives warm invocations).
const BUCKET_CAPACITY = 20;
const REFILL_PER_MIN = 10;
const buckets = new Map<string, { tokens: number; last: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: BUCKET_CAPACITY, last: now };
  b.tokens = Math.min(BUCKET_CAPACITY, b.tokens + ((now - b.last) / 60_000) * REFILL_PER_MIN);
  b.last = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

function sse(event: ChatEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

interface ChatBody {
  messages: ChatMessage[];
  accessibilityMode?: boolean;
  seat?: string;
}

function validBody(x: unknown): x is ChatBody {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Record<string, unknown>;
  return (
    Array.isArray(b.messages) &&
    b.messages.length > 0 &&
    b.messages.length <= 40 &&
    b.messages.every(
      (m: unknown) =>
        typeof m === "object" && m !== null &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "model") &&
        typeof (m as ChatMessage).text === "string" &&
        (m as ChatMessage).text.length <= 4_000,
    )
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!validBody(body)) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const { messages, accessibilityMode, seat } = body;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return Response.json({ error: "No user message" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimited = !allow(ip);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: ChatEvent) => controller.enqueue(sse(e));
      try {
        if (rateLimited || !process.env.GEMINI_API_KEY) {
          const reason = rateLimited ? "rate-limited" : "no-api-key";
          for (const e of fallbackRespond(lastUser.text, { seat, accessibilityMode, reason })) emit(e);
        } else {
          try {
            for await (const e of streamChat({ messages, accessibilityMode, seat })) emit(e);
            emit({ type: "done" });
          } catch (err) {
            // Any Gemini failure → canned resolver, same event shape.
            const reason = err instanceof GeminiUnavailable ? err.message : "upstream error";
            for (const e of fallbackRespond(lastUser.text, { seat, accessibilityMode, reason })) emit(e);
          }
        }
      } catch {
        emit({ type: "error", message: "Something went wrong. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
