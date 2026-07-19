import { describe, expect, it } from "vitest";
import { detectLang, fallbackRespond, resolveIntent } from "@/lib/fallback";
import type { ChatEvent } from "@/lib/types";

const textOf = (events: ChatEvent[]) =>
  events.filter((e): e is Extract<ChatEvent, { type: "text" }> => e.type === "text").map((e) => e.text).join("");

const hasRoute = (events: ChatEvent[]) => events.some((e) => e.type === "route");

describe("detectLang", () => {
  it("detects all six demo languages", () => {
    expect(detectLang("Where is my seat?")).toBe("en");
    expect(detectLang("¿Dónde está mi asiento?")).toBe("es");
    expect(detectLang("Où sont les toilettes ?")).toBe("fr");
    expect(detectLang("أين مقعدي؟")).toBe("ar");
    expect(detectLang("Onde fica o banheiro?")).toBe("pt");
    expect(detectLang("मेरी सीट कहाँ है?")).toBe("hi");
  });
});

describe("resolveIntent", () => {
  it("maps chip intents", () => {
    expect(resolveIntent("Take me to my seat 214 from gate A").kind).toBe("route");
    expect(resolveIntent("Where is the nearest halal food?")).toEqual({
      kind: "nearest", poi: "food", tags: ["halal"], accessible: false,
    });
    expect(resolveIntent("I use a wheelchair. Route to restroom please")).toMatchObject({
      kind: "nearest", accessible: true,
    });
    expect(resolveIntent("Best way to get back to the city?").kind).toBe("transport");
    expect(resolveIntent("Which exit is least crowded?").kind).toBe("crowd");
    expect(resolveIntent("qwxyz zzz").kind).toBe("unknown");
  });
});

describe("fallbackRespond (degraded mode, no AI)", () => {
  it("answers a seat route with degraded badge + route event", () => {
    const events = fallbackRespond("Take me to seat 214", { reason: "no-api-key" });
    expect(events[0]).toEqual({ type: "degraded", reason: "no-api-key" });
    expect(hasRoute(events)).toBe(true);
    expect(events[events.length - 1]).toEqual({ type: "done" });
  });

  it("answers in Spanish for a Spanish question", () => {
    const events = fallbackRespond("¿Dónde está el baño más cercano?", { reason: "x" });
    expect(textOf(events)).toContain("más cercano");
    expect(hasRoute(events)).toBe(true);
  });

  it("answers in Arabic for an Arabic question", () => {
    const events = fallbackRespond("أين أقرب طعام حلال؟", { reason: "x" });
    expect(textOf(events)).toContain("حلال".length > 0 ? "أقرب" : "");
    expect(hasRoute(events)).toBe(true);
  });

  it("uses the fan's seat as start point when provided", () => {
    const events = fallbackRespond("nearest restroom", { seat: "214", reason: "x" });
    const routeEvent = events.find((e) => e.type === "route");
    expect(routeEvent && routeEvent.type === "route" && routeEvent.route.from).toBe("n-up-e");
  });

  it("wheelchair route avoids stairs", () => {
    const events = fallbackRespond("wheelchair route to seat 214", { reason: "x" });
    const routeEvent = events.find((e) => e.type === "route");
    expect(
      routeEvent && routeEvent.type === "route" && routeEvent.route.steps.every((s) => s.kind !== "stairs"),
    ).toBe(true);
  });

  it("gracefully handles unknown/gibberish/empty-ish input", () => {
    for (const q of ["qwxyz zzz", "???", "tell me about quantum physics"]) {
      const events = fallbackRespond(q, { reason: "x" });
      expect(textOf(events).length).toBeGreaterThan(10);
      expect(events[events.length - 1]).toEqual({ type: "done" });
    }
  });
});
