"use client";

/**
 * Advisory strip above the map: worst congestion + best-gate advice.
 * Sourced from getCrowdLevel tool calls in chat or /api/crowd polling.
 */

import type { CrowdReading } from "@/lib/types";

interface CrowdBannerProps {
  readings: CrowdReading[];
  advisory?: string;
}

const DOT: Record<string, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function CrowdBanner({ readings, advisory }: CrowdBannerProps) {
  if (readings.length === 0) return null;
  const worst = [...readings].sort((a, b) => b.occupancy - a.occupancy)[0];
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-300"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[worst.level]}`} aria-hidden="true" />
      <span className="truncate">
        <strong className="font-semibold">{worst.zoneName}:</strong> {worst.level}
        {advisory ? ` — ${advisory}` : ""}
      </span>
    </div>
  );
}
