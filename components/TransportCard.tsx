"use client";

/**
 * Transport options card (F-10) — rendered when chat emits a `transport`
 * event or the fan opens the card manually.
 */

import type { TransportOption } from "@/lib/types";

const ICON: Record<TransportOption["mode"], string> = {
  metro: "🚇",
  bus: "🚌",
  parking: "🅿️",
};

interface TransportCardProps {
  options: TransportOption[];
  suggestion?: string;
  onClose?: () => void;
}

export default function TransportCard({ options, suggestion, onClose }: TransportCardProps) {
  if (options.length === 0) return null;
  return (
    <section
      aria-label="Transport options"
      className="border-b border-slate-800 bg-slate-900/70 px-4 py-3"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Getting home</h2>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close transport options"
            className="rounded px-1.5 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
      {suggestion && <p className="mb-2 text-xs text-sky-300">💡 {suggestion}</p>}
      <ul className="space-y-1.5">
        {options.map((o) => (
          <li key={o.id} className="flex items-start gap-2 text-xs text-slate-300">
            <span aria-hidden="true">{ICON[o.mode]}</span>
            <span>
              <strong className="text-slate-100">{o.name}</strong> · {o.walkMinutesFromGate} min walk from{" "}
              {o.nearestGate}
              {o.frequencyMin ? ` · every ${o.frequencyMin} min` : ""}
              <span className="block text-slate-500">{o.surgeNote}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
