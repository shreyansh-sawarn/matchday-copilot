/**
 * Simulated incident feed for the ops dashboard — deterministic (seeded from
 * time buckets like the crowd sim), so every control-room screen agrees.
 * One new incident every ~2 minutes, most recent first.
 */

import type { Incident } from "@/lib/types";
import { mulberry32 } from "@/lib/simulation";
import { zones } from "@/lib/venue";

const TEMPLATES: string[] = [
  "Spilled drinks near the food stand, floor is slippery",
  "Fan reporting chest pain, conscious and seated",
  "Two supporters arguing loudly, stewards watching",
  "Child separated from parents, wearing a France shirt",
  "Broken glass reported next to the restroom entrance",
  "Turnstile jammed, queue building",
  "Fan attempting to bring in an oversized flagpole",
  "Wheelchair user needs lift assistance to the upper tier",
  "Smoke smell reported near a food unit",
  "Overcrowding at the concourse corner, movement slowing",
  "Lost wallet handed in to a steward",
  "Speaker crackling and cutting out intermittently",
];

const INCIDENT_BUCKET_MS = 120_000; // one incident per 2 minutes

export function incidentsAt(t: number = Date.now(), count = 5): Incident[] {
  const bucket = Math.floor(t / INCIDENT_BUCKET_MS);
  const zoneIds = zones().filter((z) => z.id !== "pitch").map((z) => z.id);
  const out: Incident[] = [];
  for (let i = 0; i < count; i++) {
    const b = bucket - i;
    const rand = mulberry32((b * 2654435761) >>> 0);
    const template = TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
    const zoneId = zoneIds[Math.floor(rand() * zoneIds.length)];
    out.push({
      id: `inc-${b}`,
      time: new Date(b * INCIDENT_BUCKET_MS).toISOString(),
      zoneId,
      report: template,
    });
  }
  return out;
}
