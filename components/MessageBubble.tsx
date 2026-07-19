"use client";

/**
 * One chat bubble. dir="auto" lets the browser render RTL languages (Arabic)
 * correctly per-message without a global direction switch.
 */

export interface BubbleProps {
  role: "user" | "model";
  text: string;
  degraded?: boolean;
  streaming?: boolean;
}

export default function MessageBubble({ role, text, degraded, streaming }: BubbleProps) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        dir="auto"
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-sky-600 text-white"
            : "rounded-bl-sm bg-slate-800 text-slate-100"
        }`}
      >
        {text}
        {streaming && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-slate-400 align-text-bottom" aria-hidden="true" />
        )}
        {degraded && !streaming && (
          <span className="mt-1 block text-xs font-medium text-amber-400">
            ⚡ demo mode
          </span>
        )}
      </div>
    </div>
  );
}
