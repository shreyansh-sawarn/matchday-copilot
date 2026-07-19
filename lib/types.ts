/**
 * Shared domain types for MatchDay Copilot.
 * Single source of truth — all data access goes through typed accessors in lib/venue.ts.
 */

/** Crowd density level for a zone at a point in time. */
export type CrowdLevel = "low" | "moderate" | "high" | "critical";

/** A physical area of the stadium (concourse, gates level, seating tier…). */
export interface Zone {
  id: string;
  name: string;
  level: "ground" | "concourse" | "upper" | "pitch";
  /** SVG polygon points or path ref, keyed to StadiumMap shapes. */
  svgId: string;
  adjacentZoneIds: string[];
}

export type PoiKind =
  | "gate"
  | "food"
  | "restroom"
  | "prayer"
  | "medical"
  | "exit"
  | "info"
  | "seating"
  | "shop"
  | "water";

/** Point of interest inside the venue, anchored to a graph node. */
export interface Poi {
  id: string;
  kind: PoiKind;
  name: string;
  zoneId: string;
  nodeId: string;
  /** Free-form tags: "halal", "vegetarian", "accessible", "family"… */
  tags: string[];
}

/** Walkable waypoint with SVG coordinates. */
export interface GraphNode {
  id: string;
  x: number;
  y: number;
  zoneId: string;
  label?: string;
}

/** Undirected walkway between two nodes. */
export interface GraphEdge {
  from: string;
  to: string;
  /** Approximate metres. */
  distance: number;
  /** false = stairs/escalator only (excluded for wheelchair routing). */
  accessible: boolean;
  kind: "walkway" | "stairs" | "lift" | "ramp";
}

/** One step of a computed route, human-readable + map-renderable. */
export interface RouteStep {
  instruction: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  kind: GraphEdge["kind"];
}

export interface RouteResult {
  found: boolean;
  from: string;
  to: string;
  accessible: boolean;
  steps: RouteStep[];
  /** Ordered node ids for the map polyline. */
  polyline: string[];
  totalDistance: number;
}

export interface MatchFixture {
  id: string;
  home: string;
  away: string;
  /** ISO datetime of kickoff. */
  kickoff: string;
  stage: string;
  /** True for the fixture the demo treats as "today's match". */
  isToday: boolean;
}

export interface TransportOption {
  id: string;
  mode: "metro" | "bus" | "parking";
  name: string;
  description: string;
  frequencyMin: number | null;
  walkMinutesFromGate: number;
  nearestGate: string;
  /** Post-match congestion advice. */
  surgeNote: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

/** Crowd reading for one zone. */
export interface CrowdReading {
  zoneId: string;
  zoneName: string;
  level: CrowdLevel;
  /** 0..1 occupancy estimate. */
  occupancy: number;
}

/** SSE events streamed by /api/chat. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "route"; route: RouteResult }
  | { type: "crowd"; readings: CrowdReading[]; advisory?: string }
  | { type: "transport"; options: TransportOption[]; suggestion?: string }
  | { type: "degraded"; reason: string }
  | { type: "done" }
  | { type: "error"; message: string };

/** Chat message shape exchanged with /api/chat. */
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

/** Ops incident (simulated feed). */
export interface Incident {
  id: string;
  time: string;
  zoneId: string;
  report: string;
}

/** JSON-mode triage output contract. */
export interface TriageResult {
  severity: "low" | "medium" | "high" | "critical";
  suggestedAction: string;
  dispatchRole: "steward" | "medical" | "security" | "cleaning" | "engineering";
}
