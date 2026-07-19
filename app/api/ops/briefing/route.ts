/**
 * POST /api/ops/briefing — shift briefing generated from live sim state
 * via Gemini JSON mode; deterministic canned briefing when AI unavailable.
 */

import { generateJson } from "@/lib/gemini";
import { briefingPrompt, briefingSchema } from "@/lib/prompts";
import { allCrowd, bestGateAdvice, matchPhase } from "@/lib/simulation";
import { incidentsAt } from "@/lib/incidents";
import { todayMatch, zoneById } from "@/lib/venue";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Briefing {
  headline: string;
  bullets: string[];
  watchouts: string[];
}

function isBriefing(x: unknown): x is Briefing {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Record<string, unknown>;
  return (
    typeof b.headline === "string" &&
    Array.isArray(b.bullets) && b.bullets.every((s) => typeof s === "string") &&
    Array.isArray(b.watchouts) && b.watchouts.every((s) => typeof s === "string")
  );
}

function simStateDigest(): string {
  const now = Date.now();
  const m = todayMatch();
  const crowd = allCrowd(now)
    .map((r) => `${r.zoneName}: ${r.level} (${Math.round(r.occupancy * 100)}%)`)
    .join("; ");
  const incidents = incidentsAt(now, 5)
    .map((i) => `[${zoneById(i.zoneId)?.name}] ${i.report}`)
    .join("; ");
  return [
    `Match: ${m.stage} ${m.home} vs ${m.away}, phase: ${matchPhase(now)}.`,
    `Crowd: ${crowd}.`,
    `Gate advice: ${bestGateAdvice(now)}.`,
    `Open incidents: ${incidents}.`,
  ].join("\n");
}

function cannedBriefing(): Briefing {
  const now = Date.now();
  const phase = matchPhase(now);
  const worst = [...allCrowd(now)].sort((a, b) => b.occupancy - a.occupancy)[0];
  return {
    headline: `${todayMatch().stage} — phase: ${phase}, busiest zone ${worst.zoneName} (${worst.level})`,
    bullets: [
      `Crowd phase is ${phase}; monitor ${worst.zoneName}.`,
      bestGateAdvice(now),
      `${incidentsAt(now, 5).length} open incidents in the feed; triage each via the incident panel.`,
    ],
    watchouts: [
      "Post-match egress surge expected at Metro Línea 1.",
      "Keep lift corridors clear for accessible egress.",
    ],
  };
}

export async function POST(): Promise<Response> {
  try {
    const result = await generateJson<Briefing>(briefingPrompt(simStateDigest()), briefingSchema, isBriefing);
    return Response.json({ ...result, degraded: false });
  } catch {
    return Response.json({ ...cannedBriefing(), degraded: true });
  }
}
