/**
 * GET /api/crowd — zone crowd readings at the current simulation tick.
 * Pure function of wall-clock time (D-03): safe on any serverless instance.
 * Used by the fan map shading and the ops heatmap (10s auto-refresh).
 */

import { allCrowd, bestGateAdvice, matchPhase } from "@/lib/simulation";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const now = Date.now();
  return Response.json(
    {
      t: now,
      phase: matchPhase(now),
      readings: allCrowd(now),
      advisory: bestGateAdvice(now),
    },
    { headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=5" } },
  );
}
