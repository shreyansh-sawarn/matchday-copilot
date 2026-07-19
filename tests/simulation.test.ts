import { describe, expect, it } from "vitest";
import { allCrowd, bucketOf, crowdAt, matchPhase, mulberry32 } from "@/lib/simulation";

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("crowdAt", () => {
  const t = new Date("2026-07-19T19:30:00-06:00").getTime(); // ingress

  it("is identical for the same zone and time bucket", () => {
    const r1 = crowdAt("concourse-north", t);
    const r2 = crowdAt("concourse-north", t + 3000); // same 10s bucket
    expect(r1).toEqual(r2);
  });

  it("varies across buckets but stays in [0,1]", () => {
    for (let i = 0; i < 50; i++) {
      const r = crowdAt("concourse-north", t + i * 10_000);
      expect(r.occupancy).toBeGreaterThanOrEqual(0);
      expect(r.occupancy).toBeLessThanOrEqual(1);
    }
  });

  it("shows the match narrative: seats fill during first half, concourses at half-time", () => {
    const firstHalf = new Date("2026-07-19T20:20:00-06:00").getTime();
    const halfTime = new Date("2026-07-19T20:50:00-06:00").getTime();
    expect(crowdAt("seating-lower", firstHalf).occupancy).toBeGreaterThan(0.6);
    expect(crowdAt("concourse-north", halfTime).occupancy).toBeGreaterThan(0.5);
  });
});

describe("matchPhase", () => {
  it("maps times around kickoff correctly", () => {
    expect(matchPhase(new Date("2026-07-19T12:00:00-06:00").getTime())).toBe("quiet");
    expect(matchPhase(new Date("2026-07-19T19:00:00-06:00").getTime())).toBe("ingress");
    expect(matchPhase(new Date("2026-07-19T20:30:00-06:00").getTime())).toBe("first-half");
    expect(matchPhase(new Date("2026-07-19T20:50:00-06:00").getTime())).toBe("half-time");
    expect(matchPhase(new Date("2026-07-19T21:30:00-06:00").getTime())).toBe("second-half");
    expect(matchPhase(new Date("2026-07-19T22:30:00-06:00").getTime())).toBe("egress");
  });
});

describe("allCrowd", () => {
  it("returns one reading per zone", () => {
    expect(allCrowd(Date.now())).toHaveLength(8);
  });
});

describe("bucketOf", () => {
  it("buckets at 10s", () => {
    expect(bucketOf(10_000)).toBe(1);
    expect(bucketOf(19_999)).toBe(1);
    expect(bucketOf(20_000)).toBe(2);
  });
});
