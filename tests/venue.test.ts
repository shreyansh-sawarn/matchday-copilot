import { describe, expect, it } from "vitest";
import { nearestPoi, pois, resolveNode, route, zones } from "@/lib/venue";

describe("resolveNode", () => {
  it("resolves gates, seats and poi names", () => {
    expect(resolveNode("gate a")).toBe("n-gate-a");
    expect(resolveNode("Gate C")).toBe("n-gate-c");
    expect(resolveNode("seat 214")).toBe("n-up-e");
    expect(resolveNode("section 104")).toBe("n-vom-101");
    expect(resolveNode("Halal Grill House")).toBe("n-food-north");
    expect(resolveNode("the moon")).toBeUndefined();
  });
});

describe("route", () => {
  it("finds a sensible path from gate A to seat 214 (upper east)", () => {
    const r = route("gate a", "seat 214");
    expect(r.found).toBe(true);
    expect(r.polyline[0]).toBe("n-gate-a");
    expect(r.polyline[r.polyline.length - 1]).toBe("n-up-e");
    expect(r.steps.length).toBeGreaterThan(2);
    expect(r.totalDistance).toBeGreaterThan(0);
    // default route uses the (shorter) stairs
    expect(r.steps.some((s) => s.kind === "stairs")).toBe(true);
  });

  it("accessible route avoids stairs and uses the lift", () => {
    const r = route("gate a", "seat 214", { accessible: true });
    expect(r.found).toBe(true);
    expect(r.steps.every((s) => s.kind !== "stairs")).toBe(true);
    expect(r.steps.some((s) => s.kind === "lift")).toBe(true);
  });

  it("returns found:false for unknown destinations instead of inventing one", () => {
    const r = route("gate a", "narnia");
    expect(r.found).toBe(false);
    expect(r.steps).toHaveLength(0);
  });
});

describe("graph integrity", () => {
  it("every POI is reachable from every gate, including step-free", () => {
    for (const gate of ["gate a", "gate b", "gate c", "gate d"]) {
      for (const p of pois()) {
        expect(route(gate, p.nodeId).found, `${gate} -> ${p.id}`).toBe(true);
        expect(
          route(gate, p.nodeId, { accessible: true }).found,
          `${gate} -> ${p.id} (accessible)`,
        ).toBe(true);
      }
    }
  });
});

describe("nearestPoi", () => {
  it("finds nearest halal food with tag filter", () => {
    const hit = nearestPoi("food", "gate a", { tags: ["halal"] });
    expect(hit?.poi.id).toBe("poi-food-halal");
    expect(hit?.route.found).toBe(true);
  });

  it("respects accessibility for restrooms", () => {
    const hit = nearestPoi("restroom", "seat 214", { accessible: true, tags: ["accessible"] });
    expect(hit).toBeDefined();
    expect(hit!.route.steps.every((s) => s.kind !== "stairs")).toBe(true);
  });
});

describe("zones", () => {
  it("has 8 zones with unique svg ids", () => {
    const z = zones();
    expect(z).toHaveLength(8);
    expect(new Set(z.map((x) => x.svgId)).size).toBe(8);
  });
});
