/**
 * GET /api/transport — transport options + departure suggestion.
 * Pure data (also exposed to the model as the getTransport tool).
 */

import { transportOptions } from "@/lib/venue";
import { transportSuggestion } from "@/lib/tools";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return Response.json(
    { options: transportOptions(), suggestion: transportSuggestion() },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
