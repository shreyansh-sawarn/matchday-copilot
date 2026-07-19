/**
 * GET /api/crowd — zone crowd readings at the current simulation tick.
 * Pure function of wall-clock time (D-03): safe on any serverless instance.
 * Used by the fan map shading and the ops heatmap (10s auto-refresh).
 */

import { NextRequest } from "next/server";
import { allCrowd, bestGateAdvice, matchPhase } from "@/lib/simulation";
import { fixtureById } from "@/lib/venue";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const now = Date.now();
  // ?match=m-semi-1 — unknown/absent ids fall back to today's fixture
  const matchId = fixtureById(req.nextUrl.searchParams.get("match") ?? undefined).id;
  return Response.json(
    {
      t: now,
      matchId,
      phase: matchPhase(now, matchId),
      readings: allCrowd(now, matchId),
      advisory: bestGateAdvice(now, matchId),
    },
    { headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=5" } },
  );
}
