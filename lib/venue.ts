/**
 * Typed accessors over the static venue knowledge base.
 * This module is the ONLY place that reads data/*.json — components and API
 * routes must never import raw JSON (Gate 1 rule).
 *
 * Routing is Dijkstra over the hand-authored waypoint graph. The `accessible`
 * option filters out stairs-only edges, so wheelchair routes automatically
 * divert via ramps and lifts — same algorithm, different edge set.
 */

import venueJson from "@/data/venue.json";
import matchesJson from "@/data/matches.json";
import transportJson from "@/data/transport.json";
import faqsJson from "@/data/faqs.json";
import type {
  Faq,
  GraphEdge,
  GraphNode,
  MatchFixture,
  Poi,
  PoiKind,
  RouteResult,
  RouteStep,
  TransportOption,
  Zone,
} from "@/lib/types";

interface SeatSection {
  from: number;
  to: number;
  nodeId: string;
  label: string;
}

interface VenueData {
  name: string;
  city: string;
  capacity: number;
  note: string;
  zones: Zone[];
  seatSections: SeatSection[];
  pois: Poi[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
}

const venue = venueJson as unknown as VenueData;

export const venueName = venue.name;
export const venueCity = venue.city;

export function zones(): Zone[] {
  return venue.zones;
}

export function pois(): Poi[] {
  return venue.pois;
}

export function faqs(): Faq[] {
  return faqsJson as Faq[];
}

export function matches(): MatchFixture[] {
  return matchesJson as MatchFixture[];
}

export function todayMatch(): MatchFixture {
  const m = matches().find((f) => f.isToday);
  if (!m) throw new Error("matches.json must contain exactly one isToday fixture");
  return m;
}

export function transportOptions(): TransportOption[] {
  return transportJson as TransportOption[];
}

export function nodeById(id: string): GraphNode | undefined {
  return venue.graph.nodes.find((n) => n.id === id);
}

export function zoneById(id: string): Zone | undefined {
  return venue.zones.find((z) => z.id === id);
}

/** Case-insensitive POI lookup by id or (partial) name. */
export function findPoi(ref: string): Poi | undefined {
  const q = ref.trim().toLowerCase();
  return (
    venue.pois.find((p) => p.id === q) ??
    venue.pois.find((p) => p.name.toLowerCase() === q) ??
    venue.pois.find((p) => p.name.toLowerCase().includes(q))
  );
}

/**
 * Resolve a human reference ("gate a", "seat 214", "section 108", "halal food",
 * a poi id, or a raw node id) to a graph node id. Returns undefined when the
 * reference is not in the knowledge base — callers must handle it gracefully
 * (never invent locations).
 */
export function resolveNode(ref: string): string | undefined {
  const q = ref.trim().toLowerCase();
  if (venue.graph.nodes.some((n) => n.id === q)) return q;

  // seat / section numbers, e.g. "seat 214", "section 108", "214"
  const num = q.match(/(?:seat|section|sec\.?|asiento|siège|席|मेरी सीट)?\s*#?\s*(\d{3})/);
  if (num) {
    const section = parseInt(num[1], 10);
    const hit = venue.seatSections.find((s) => section >= s.from && section <= s.to);
    if (hit) return hit.nodeId;
  }

  // gates: "gate a", "puerta b", "porte c", "gate-d"
  const gate = q.match(/(?:gate|puerta|porte|portão|बाब|गेट|بوابة)?[\s-]*\b([a-d])\b\s*$/);
  if (gate) {
    const g = venue.pois.find((p) => p.id === `poi-gate-${gate[1]}`);
    if (g) return g.nodeId;
  }

  const poi = findPoi(q);
  return poi?.nodeId;
}

/** Human label for a seat section number, if it exists. */
export function sectionLabel(section: number): string | undefined {
  const hit = venue.seatSections.find((s) => section >= s.from && section <= s.to);
  return hit ? `${hit.label} (sections ${hit.from}–${hit.to})` : undefined;
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

interface AdjEntry {
  to: string;
  edge: GraphEdge;
}

function buildAdjacency(accessibleOnly: boolean): Map<string, AdjEntry[]> {
  const adj = new Map<string, AdjEntry[]>();
  const push = (from: string, to: string, edge: GraphEdge) => {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from)!.push({ to, edge });
  };
  for (const e of venue.graph.edges) {
    if (accessibleOnly && !e.accessible) continue;
    push(e.from, e.to, e);
    push(e.to, e.from, e);
  }
  return adj;
}

function stepInstruction(edge: GraphEdge, from: GraphNode, to: GraphNode): string {
  switch (edge.kind) {
    case "lift":
      return `Take the lift (${to.label ?? to.id}) to the upper tier`;
    case "stairs":
      return `Take the stairs up to ${to.label ?? "the upper tier"}`;
    case "ramp":
      return `Follow the ramp to ${to.label ?? to.id}`;
    default:
      return `Walk ${edge.distance} m to ${to.label ?? to.id}`;
  }
}

/**
 * Shortest path (Dijkstra by distance). `accessible: true` restricts the graph
 * to step-free edges. Deterministic for identical inputs.
 */
export function route(
  fromRef: string,
  toRef: string,
  opts: { accessible?: boolean } = {},
): RouteResult {
  const accessible = opts.accessible ?? false;
  const fromId = resolveNode(fromRef);
  const toId = resolveNode(toRef);
  const notFound: RouteResult = {
    found: false,
    from: fromRef,
    to: toRef,
    accessible,
    steps: [],
    polyline: [],
    totalDistance: 0,
  };
  if (!fromId || !toId) return notFound;
  if (fromId === toId)
    return { ...notFound, found: true, from: fromId, to: toId };

  const adj = buildAdjacency(accessible);
  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: GraphEdge }>();
  const visited = new Set<string>();
  dist.set(fromId, 0);

  while (true) {
    let current: string | undefined;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < best) {
        best = d;
        current = id;
      }
    }
    if (current === undefined) break;
    if (current === toId) break;
    visited.add(current);
    for (const { to, edge } of adj.get(current) ?? []) {
      const nd = best + edge.distance;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, { node: current, edge });
      }
    }
  }

  if (!dist.has(toId) || !prev.has(toId)) return { ...notFound, from: fromId, to: toId };

  // Reconstruct path
  const polyline: string[] = [toId];
  const steps: RouteStep[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const p = prev.get(cursor)!;
    const fromNode = nodeById(p.node)!;
    const toNode = nodeById(cursor)!;
    steps.unshift({
      instruction: stepInstruction(p.edge, fromNode, toNode),
      fromNodeId: p.node,
      toNodeId: cursor,
      distance: p.edge.distance,
      kind: p.edge.kind,
    });
    polyline.unshift(p.node);
    cursor = p.node;
  }

  return {
    found: true,
    from: fromId,
    to: toId,
    accessible,
    steps,
    polyline,
    totalDistance: steps.reduce((s, x) => s + x.distance, 0),
  };
}

/**
 * Nearest POI of a kind from a node, honoring accessibility and tag filters.
 * Distance is measured over the walking graph (not as-the-crow-flies).
 */
export function nearestPoi(
  kind: PoiKind,
  fromRef: string,
  opts: { accessible?: boolean; tags?: string[] } = {},
): { poi: Poi; route: RouteResult } | undefined {
  const candidates = venue.pois.filter(
    (p) =>
      p.kind === kind &&
      (opts.tags ?? []).every((t) => p.tags.includes(t)),
  );
  let best: { poi: Poi; route: RouteResult } | undefined;
  for (const poi of candidates) {
    const r = route(fromRef, poi.nodeId, { accessible: opts.accessible });
    if (!r.found) continue;
    if (!best || r.totalDistance < best.route.totalDistance) best = { poi, route: r };
  }
  return best;
}

/** Compact KB digest for the system prompt (kept < ~1.5k tokens by design). */
export function kbDigest(): string {
  const gateList = venue.pois
    .filter((p) => p.kind === "gate")
    .map((p) => p.name)
    .join(", ");
  const foodList = venue.pois
    .filter((p) => p.kind === "food")
    .map((p) => `${p.name}${p.tags.length ? ` [${p.tags.join(", ")}]` : ""} — ${zoneById(p.zoneId)?.name}`)
    .join("; ");
  const m = todayMatch();
  const faqDigest = faqs()
    .map((f) => `Q: ${f.question} A: ${f.answer}`)
    .join("\n");
  return [
    `Venue: ${venue.name}, ${venue.city} (capacity ${venue.capacity.toLocaleString("en-US")}). NOTE: simulated demo venue.`,
    `Today's match: ${m.stage} — ${m.home} vs ${m.away}, kickoff ${m.kickoff}.`,
    `Gates: ${gateList}. Gate D has the widest accessible entrance.`,
    `Seating: lower bowl sections 101–130, upper tier sections 201–230. Wheelchair platform: Lower Bowl West (123–130).`,
    `Food: ${foodList}.`,
    `Key services: Prayer & Quiet Room (West Concourse), First Aid (North Concourse), Information Desk (North Concourse near Gate A), Fan Shop (East Concourse), free water refill (South Concourse & Upper West).`,
    `Upper tier access: NE and SW stairs, or step-free NE/SW lifts.`,
    `FAQs:\n${faqDigest}`,
  ].join("\n");
}
