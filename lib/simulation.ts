/**
 * Deterministic crowd simulation (D-03).
 *
 * `crowdAt(zoneId, t)` is a pure function of (zone, 10-second time bucket):
 * no server state, so every Vercel serverless instance — and every judge
 * refresh — agrees on the crowd picture. Randomness comes from mulberry32
 * seeded by hash(zoneId, bucket), giving stable-but-organic variation.
 */

import type { CrowdLevel, CrowdReading } from "@/lib/types";
import { todayMatch, zoneById, zones } from "@/lib/venue";

/** Classic mulberry32 PRNG — tiny, fast, deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const BUCKET_MS = 10_000;

export function bucketOf(t: number): number {
  return Math.floor(t / BUCKET_MS);
}

export type MatchPhase =
  | "quiet"
  | "ingress"
  | "first-half"
  | "half-time"
  | "second-half"
  | "egress";

/** Match phase from wall-clock time relative to today's kickoff. */
export function matchPhase(t: number): MatchPhase {
  const kickoff = new Date(todayMatch().kickoff).getTime();
  const mins = (t - kickoff) / 60_000;
  if (mins < -180) return "quiet";
  if (mins < 0) return "ingress";
  if (mins < 45) return "first-half";
  if (mins < 60) return "half-time";
  if (mins < 110) return "second-half";
  if (mins < 180) return "egress";
  return "quiet";
}

/** Base occupancy per zone per phase (0..1). Hand-tuned narrative curves. */
const PHASE_BASE: Record<MatchPhase, Record<string, number>> = {
  quiet: {
    "outer-plaza": 0.15, "concourse-north": 0.1, "concourse-east": 0.1,
    "concourse-south": 0.1, "concourse-west": 0.1, "seating-lower": 0.05,
    "seating-upper": 0.05, pitch: 0,
  },
  ingress: {
    "outer-plaza": 0.75, "concourse-north": 0.7, "concourse-east": 0.55,
    "concourse-south": 0.5, "concourse-west": 0.45, "seating-lower": 0.45,
    "seating-upper": 0.35, pitch: 0,
  },
  "first-half": {
    "outer-plaza": 0.2, "concourse-north": 0.25, "concourse-east": 0.2,
    "concourse-south": 0.2, "concourse-west": 0.18, "seating-lower": 0.92,
    "seating-upper": 0.9, pitch: 0,
  },
  "half-time": {
    "outer-plaza": 0.15, "concourse-north": 0.85, "concourse-east": 0.8,
    "concourse-south": 0.75, "concourse-west": 0.7, "seating-lower": 0.5,
    "seating-upper": 0.5, pitch: 0,
  },
  "second-half": {
    "outer-plaza": 0.2, "concourse-north": 0.22, "concourse-east": 0.18,
    "concourse-south": 0.18, "concourse-west": 0.16, "seating-lower": 0.93,
    "seating-upper": 0.9, pitch: 0,
  },
  egress: {
    "outer-plaza": 0.9, "concourse-north": 0.85, "concourse-east": 0.7,
    "concourse-south": 0.65, "concourse-west": 0.6, "seating-lower": 0.35,
    "seating-upper": 0.3, pitch: 0,
  },
};

function levelOf(occupancy: number): CrowdLevel {
  if (occupancy < 0.3) return "low";
  if (occupancy < 0.6) return "moderate";
  if (occupancy < 0.82) return "high";
  return "critical";
}

/**
 * Crowd reading for one zone at time t (ms since epoch).
 * Deterministic: same zone + same 10s bucket → identical result, across
 * processes and machines.
 */
export function crowdAt(zoneId: string, t: number = Date.now()): CrowdReading {
  const zone = zoneById(zoneId);
  const phase = matchPhase(t);
  const base = PHASE_BASE[phase][zoneId] ?? 0.1;
  const rand = mulberry32(hashString(`${zoneId}:${bucketOf(t)}`));
  // ±12% organic wobble + slow sinusoidal drift within the phase
  const wobble = (rand() - 0.5) * 0.24;
  const drift = Math.sin(bucketOf(t) / 30 + hashString(zoneId) % 7) * 0.06;
  const occupancy = Math.min(1, Math.max(0, base + wobble + drift));
  return {
    zoneId,
    zoneName: zone?.name ?? zoneId,
    level: levelOf(occupancy),
    occupancy: Math.round(occupancy * 100) / 100,
  };
}

/** All zone readings at time t (map shading + ops heatmap). */
export function allCrowd(t: number = Date.now()): CrowdReading[] {
  return zones().map((z) => crowdAt(z.id, t));
}

/** Least-crowded gate right now — powers "which exit should I use?" advice. */
export function bestGateAdvice(t: number = Date.now()): string {
  const gateZones: Array<[string, string]> = [
    ["Gate A (North)", "concourse-north"],
    ["Gate B (East)", "concourse-east"],
    ["Gate C (South)", "concourse-south"],
    ["Gate D (West)", "concourse-west"],
  ];
  const ranked = gateZones
    .map(([gate, zone]) => ({ gate, reading: crowdAt(zone, t) }))
    .sort((a, b) => a.reading.occupancy - b.reading.occupancy);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  return `${worst.gate} area is ${worst.reading.level}; ${best.gate} is the quietest (${best.reading.level}).`;
}
