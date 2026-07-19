/**
 * Server-side execution of the model's tool calls.
 * Args are validated before touching the data layer; every tool returns
 * BOTH a compact payload for the model and (optionally) a structured
 * ChatEvent the UI renders (route on map, crowd banner, transport card).
 */

import type { ChatEvent, PoiKind, TransportOption } from "@/lib/types";
import { nearestPoi, route, todayMatch, transportOptions } from "@/lib/venue";
import { allCrowd, bestGateAdvice, crowdAt, matchPhase } from "@/lib/simulation";

export interface ToolOutcome {
  /** Compact JSON returned to the model as functionResponse. */
  forModel: Record<string, unknown>;
  /** Structured event for the client (map/banner/card), if any. */
  event?: ChatEvent;
}

const POI_KINDS: PoiKind[] = [
  "gate", "food", "restroom", "prayer", "medical", "exit", "info", "seating", "shop", "water",
];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function bool(v: unknown): boolean {
  return v === true || v === "true";
}

/** Suggested departure strategy from simulated crowd state. */
export function transportSuggestion(t: number = Date.now()): string {
  const m = todayMatch();
  const finalWhistle = new Date(new Date(m.kickoff).getTime() + 110 * 60_000);
  const hhmm = finalWhistle.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City",
  });
  const phase = matchPhase(t);
  if (phase === "egress")
    return `Crowds are leaving now. Metro Línea 1 is at its peak — Línea 3 from Gate D or waiting ~25 minutes is usually faster overall.`;
  return `Full-time is expected around ${hhmm}. Leaving 10 minutes early or 30 minutes late roughly halves your queue time at the metro.`;
}

export function executeTool(name: string, rawArgs: Record<string, unknown>): ToolOutcome {
  switch (name) {
    case "getDirections": {
      const to = str(rawArgs.to).trim();
      if (!to) return { forModel: { error: "Missing required arg 'to'." } };
      const from = str(rawArgs.from, "gate a").trim() || "gate a";
      const accessible = bool(rawArgs.accessible);
      const r = route(from, to, { accessible });
      if (!r.found) {
        return {
          forModel: {
            found: false,
            hint: `Unknown place "${to}". Only use gates A–D, seat sections 101–130/201–230, or exact place names from the venue knowledge. If truly unknown, direct the fan to the Information Desk.`,
          },
        };
      }
      return {
        forModel: {
          found: true,
          accessible,
          totalDistanceMeters: r.totalDistance,
          steps: r.steps.map((s, i) => `${i + 1}. ${s.instruction}`),
        },
        event: { type: "route", route: r },
      };
    }

    case "findNearest": {
      const kind = str(rawArgs.kind).trim().toLowerCase() as PoiKind;
      if (!POI_KINDS.includes(kind))
        return { forModel: { error: `Unknown kind "${kind}". Use one of: ${POI_KINDS.join(", ")}.` } };
      const from = str(rawArgs.from, "gate a").trim() || "gate a";
      const accessible = bool(rawArgs.accessible);
      const tags = str(rawArgs.tags)
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      let hit = nearestPoi(kind, from, { accessible, tags });
      let tagNote: string | undefined;
      if (!hit && tags.length > 0) {
        hit = nearestPoi(kind, from, { accessible });
        tagNote = `No ${kind} matches tags [${tags.join(", ")}]; nearest ${kind} without that filter instead.`;
      }
      if (!hit)
        return {
          forModel: { found: false, hint: `No reachable ${kind} found. Suggest the Information Desk.` },
        };
      return {
        forModel: {
          found: true,
          name: hit.poi.name,
          tags: hit.poi.tags,
          note: tagNote,
          totalDistanceMeters: hit.route.totalDistance,
          steps: hit.route.steps.map((s, i) => `${i + 1}. ${s.instruction}`),
        },
        event: { type: "route", route: hit.route },
      };
    }

    case "getCrowdLevel": {
      const zoneId = str(rawArgs.zoneId).trim();
      const now = Date.now();
      const readings = zoneId ? [crowdAt(zoneId, now)] : allCrowd(now);
      const advisory = bestGateAdvice(now);
      return {
        forModel: {
          phase: matchPhase(now),
          readings: readings.map((r) => ({ zone: r.zoneName, level: r.level, occupancy: r.occupancy })),
          gateAdvice: advisory,
        },
        event: { type: "crowd", readings, advisory },
      };
    }

    case "getTransport": {
      const mode = str(rawArgs.mode).trim().toLowerCase();
      const all = transportOptions();
      const options: TransportOption[] =
        mode === "metro" || mode === "bus" || mode === "parking"
          ? all.filter((o) => o.mode === mode)
          : all;
      const suggestion = transportSuggestion();
      return {
        forModel: {
          options: options.map((o) => ({
            name: o.name, mode: o.mode, nearestGate: o.nearestGate,
            walkMinutes: o.walkMinutesFromGate, frequencyMin: o.frequencyMin, surgeNote: o.surgeNote,
          })),
          suggestion,
        },
        event: { type: "transport", options, suggestion },
      };
    }

    default:
      return { forModel: { error: `Unknown tool ${name}.` } };
  }
}
