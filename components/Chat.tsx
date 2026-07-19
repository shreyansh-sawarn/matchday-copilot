"use client";

/**
 * Streaming chat client. Parses the SSE ChatEvent protocol from /api/chat and
 * lifts structured events (route/crowd/transport) to the page so the map and
 * cards can render them. aria-live announces streamed replies to screen
 * readers once each message completes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatEvent,
  ChatMessage,
  CrowdReading,
  RouteResult,
  TransportOption,
} from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";

interface ChatProps {
  accessibilityMode: boolean;
  seat?: string;
  matchId?: string;
  onRoute?: (route: RouteResult) => void;
  onCrowd?: (readings: CrowdReading[], advisory?: string) => void;
  onTransport?: (options: TransportOption[], suggestion?: string) => void;
}

interface UiMessage extends ChatMessage {
  degraded?: boolean;
}

const CHIPS = [
  { label: "🎫 Find seat 214", text: "Take me to seat 214 from Gate A" },
  { label: "🥙 Nearest halal food", text: "Where is the nearest halal food?" },
  { label: "♿ Step-free route", text: "I use a wheelchair. How do I get to my seat?" },
  { label: "🚇 Getting home", text: "What's the best way to get back to the city after the match?" },
  { label: "🚻 Baños", text: "¿Dónde está el baño más cercano?" },
  { label: "🚪 Quiet exit", text: "Which exit will be least crowded after the final whistle?" },
];

export default function Chat({ accessibilityMode, seat, matchId, onRoute, onCrowd, onTransport }: ChatProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setInput("");
      const history: ChatMessage[] = [...messages.map(({ role, text }) => ({ role, text })), { role: "user", text: trimmed }];
      setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "model", text: "" }]);

      let reply = "";
      let degraded = false;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, accessibilityMode, seat, matchId }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: ChatEvent;
            try {
              event = JSON.parse(line.slice(6)) as ChatEvent;
            } catch {
              continue;
            }
            switch (event.type) {
              case "text":
                reply += event.text;
                setMessages((m) => {
                  const copy = [...m];
                  copy[copy.length - 1] = { role: "model", text: reply, degraded };
                  return copy;
                });
                break;
              case "route":
                onRoute?.(event.route);
                break;
              case "crowd":
                onCrowd?.(event.readings, event.advisory);
                break;
              case "transport":
                onTransport?.(event.options, event.suggestion);
                break;
              case "degraded":
                degraded = true;
                setMessages((m) => {
                  const copy = [...m];
                  copy[copy.length - 1] = { ...copy[copy.length - 1], degraded: true };
                  return copy;
                });
                break;
              case "error":
                reply += `\n${event.message}`;
                break;
              case "done":
                break;
            }
          }
        }
      } catch {
        reply = reply || "Connection lost — please try again.";
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "model", text: reply, degraded };
          return copy;
        });
      } finally {
        setBusy(false);
        setAnnounce(reply);
      }
    },
    [accessibilityMode, busy, matchId, messages, onCrowd, onRoute, onTransport, seat],
  );

  return (
    <section aria-label="Stadium copilot chat" className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div className="mt-6 text-center text-sm text-slate-400">
            <p className="mb-1 text-2xl" aria-hidden="true">⚽</p>
            <p>
              Ask me anything about the stadium — in <strong>any language</strong>.
            </p>
            <p className="mt-1">English · Español · Français · العربية · Português · हिन्दी</p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role}
            text={m.text || "…"}
            degraded={m.degraded}
            streaming={busy && i === messages.length - 1 && m.role === "model"}
          />
        ))}
      </div>

      {/* aria-live: announce the completed reply once, without interrupting per-token */}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Quick questions">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              role="listitem"
              onClick={() => send(c.text)}
              disabled={busy}
              className="shrink-0 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-200 transition hover:border-sky-500 hover:text-white disabled:opacity-50"
            >
              {c.label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Type your question in any language
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask in any language…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </div>
    </section>
  );
}
