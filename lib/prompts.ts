/**
 * All prompt engineering lives in this file (decision D-09) so the craft is
 * visible in one place: system prompts, grounding rules, and tool schemas.
 *
 * Grounding strategy:
 *  - The system prompt carries only a compact KB digest (< ~1.5k tokens).
 *  - Every navigational/crowd/transport FACT must come from a tool call —
 *    the model is explicitly forbidden from inventing directions.
 *  - Unknown = say so + point to the Information Desk. Never guess.
 */

import { Type, type FunctionDeclaration } from "@google/genai";
import { kbDigest } from "@/lib/venue";

export const MODEL_ID = "gemini-2.5-flash";

/** Core steward persona + grounding rules. */
export function systemPrompt(
  opts: { accessibilityMode?: boolean; seat?: string; matchId?: string } = {},
): string {
  const base = `You are MatchDay Copilot, a friendly, calm stadium steward at ${"Estadio Aurora"} helping fans on match day.

LANGUAGE — most important rule:
- ALWAYS reply in the language of the user's LAST message (English, Spanish, French, Arabic, Portuguese, Hindi, or any other). Never switch to English unless the user does.

GROUNDING RULES — never break these:
1. Directions, walking routes, crowd levels and transport facts MUST come from your tools (getDirections, findNearest, getCrowdLevel, getTransport). NEVER invent a route, gate, distance, or crowd state from memory.
2. Venue facts (policies, food stands, services) must come from the VENUE KNOWLEDGE below. If something is not in it, say you don't know and suggest the Information Desk on the North Concourse (near Gate A).
3. This is a demo venue with simulated data — if asked whether data is live, say it is a simulation.
4. Questions unrelated to the stadium, the match, or getting around (politics, coding, homework…): politely decline in the user's language and steer back to match-day help.

STYLE:
- Short, warm, actionable. Use step numbers for routes. Mention distances in metres.
- When a tool returns a route, summarise the steps in the user's language — the app also draws the route on the fan's map.
- If the fan sounds distressed (lost child, medical issue), lead with the nearest steward + First Aid Station and keep instructions very simple.

VENUE KNOWLEDGE (digest — detail lives behind tools):
${kbDigest(opts.matchId)}`;

  const seatCtx = opts.seat
    ? `\n\nCONTEXT: The fan's ticket shows seat section ${opts.seat}. When they say "my seat", use section ${opts.seat}.`
    : "";

  const a11y = opts.accessibilityMode
    ? `\n\nACCESSIBILITY MODE IS ON:
- Use simple, short sentences (max ~12 words each). One instruction per line.
- Always pass accessible=true to getDirections and findNearest so routes avoid stairs.
- Proactively mention lifts, ramps, and the accessible entrance at Gate D.`
    : "";

  return base + seatCtx + a11y;
}

/**
 * Tool declarations. Args are deliberately strings+booleans (no nested
 * objects): flash-class models call flat schemas far more reliably.
 */
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "getDirections",
    description:
      "Compute a walking route inside the stadium between two places. Use for ANY 'how do I get to…' question. Returns numbered steps and total distance.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: {
          type: Type.STRING,
          description:
            "Start point: a gate ('gate a'…'gate d'), seat/section number ('seat 214'), or place name. If the fan does not say where they are, use 'gate a'.",
        },
        to: {
          type: Type.STRING,
          description:
            "Destination: gate, seat/section number, or exact place name from the venue knowledge (e.g. 'Halal Grill House', 'Prayer & Quiet Room').",
        },
        accessible: {
          type: Type.BOOLEAN,
          description: "true = step-free route only (wheelchair, pram, mobility needs).",
        },
      },
      required: ["to"],
    },
  },
  {
    name: "findNearest",
    description:
      "Find the nearest place of a given kind (food, restroom, water, exit, medical, prayer, info, shop) from a start point, optionally filtered by tags like 'halal', 'vegetarian', 'accessible', 'family'. Returns the place plus the route to it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: {
          type: Type.STRING,
          description: "One of: food, restroom, water, exit, medical, prayer, info, shop, gate.",
        },
        from: {
          type: Type.STRING,
          description: "Start point (gate, seat number, or place name). Default 'gate a'.",
        },
        tags: {
          type: Type.STRING,
          description:
            "Optional comma-separated tag filter, e.g. 'halal' or 'vegetarian' or 'accessible'.",
        },
        accessible: {
          type: Type.BOOLEAN,
          description: "true = step-free route only.",
        },
      },
      required: ["kind"],
    },
  },
  {
    name: "getCrowdLevel",
    description:
      "Current crowd level for stadium zones (live simulation). Use for 'is it busy', 'which gate/exit is quietest', congestion advice, and before recommending an exit after the match.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        zoneId: {
          type: Type.STRING,
          description:
            "Optional single zone id (outer-plaza, concourse-north, concourse-east, concourse-south, concourse-west, seating-lower, seating-upper). Omit for all zones + best-gate advice.",
        },
      },
    },
  },
  {
    name: "getTransport",
    description:
      "Public transport and parking options for leaving (or reaching) the stadium, with post-match crowding advice and a suggested departure strategy.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: {
          type: Type.STRING,
          description: "Optional filter: metro, bus, or parking. Omit for all options.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Ops surface (stretch, F-12..F-14): JSON-mode prompts + response schemas.
// responseSchema forces valid JSON; server code still validates before use.
// ---------------------------------------------------------------------------

export const triagePrompt = (report: string, zoneName: string, crowdLevel: string) =>
  `You are the duty operations manager at a 58,000-seat stadium during the FIFA World Cup Final.
Triage this incident report and respond with JSON only.

Incident: "${report}"
Zone: ${zoneName} (current crowd level: ${crowdLevel})

Rules:
- severity: low | medium | high | critical. Anything involving a missing child, fire, structural risk, weapons or crush conditions is critical.
- suggestedAction: ONE concrete first action for the control room, max 25 words.
- dispatchRole: steward | medical | security | cleaning | engineering — the single best first responder.`;

export const triageSchema = {
  type: Type.OBJECT,
  properties: {
    severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
    suggestedAction: { type: Type.STRING },
    dispatchRole: {
      type: Type.STRING,
      enum: ["steward", "medical", "security", "cleaning", "engineering"],
    },
  },
  required: ["severity", "suggestedAction", "dispatchRole"],
};

export const briefingPrompt = (state: string) =>
  `You are the stadium operations chief writing a shift briefing during the FIFA World Cup Final at Estadio Aurora.
Current simulation state:
${state}

Write JSON only: a crisp control-room briefing. No speculation beyond the given state; keep each bullet under 20 words.`;

export const briefingSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    watchouts: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["headline", "bullets", "watchouts"],
};

export const announcePrompt = (message: string) =>
  `Translate this stadium PA/push announcement into all six languages. Keep it calm, clear, and under 30 words per language. Preserve gate letters (A, B, C, D) and numbers exactly. JSON only.

Announcement: "${message}"`;

export const announceSchema = {
  type: Type.OBJECT,
  properties: {
    en: { type: Type.STRING },
    es: { type: Type.STRING },
    fr: { type: Type.STRING },
    ar: { type: Type.STRING },
    pt: { type: Type.STRING },
    hi: { type: Type.STRING },
  },
  required: ["en", "es", "fr", "ar", "pt", "hi"],
};

/**
 * Few-shot nudges appended as the first user/model exchange so flash reliably
 * picks tools over prose. Kept to ONE pair to protect latency.
 */
export const fewShot = [
  {
    role: "user" as const,
    parts: [{ text: "¿Cómo llego a mi asiento 112 desde la puerta B?" }],
  },
  {
    role: "model" as const,
    parts: [
      {
        functionCall: {
          name: "getDirections",
          args: { from: "gate b", to: "seat 112", accessible: false },
        },
      },
    ],
  },
  {
    role: "user" as const,
    parts: [
      {
        functionResponse: {
          name: "getDirections",
          response: {
            found: true,
            totalDistance: 90,
            steps: ["Walk 55 m to East Concourse", "Follow the ramp to Sections 108–115 (35 m)"],
          },
        },
      },
    ],
  },
  {
    role: "model" as const,
    parts: [
      {
        text: "¡Claro! Desde la Puerta B: 1️⃣ Camina 55 m hasta el pasillo este. 2️⃣ Sigue la rampa hasta las secciones 108–115 (35 m). Tu sección 112 está allí — unos 90 m en total. ¡Disfruta el partido!",
      },
    ],
  },
];
