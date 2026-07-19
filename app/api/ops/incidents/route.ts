/**
 * GET /api/ops/incidents — deterministic simulated incident feed.
 */

import { incidentsAt } from "@/lib/incidents";
import { zoneById } from "@/lib/venue";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const incidents = incidentsAt(Date.now(), 5).map((i) => ({
    ...i,
    zoneName: zoneById(i.zoneId)?.name ?? i.zoneId,
  }));
  return Response.json({ incidents });
}
