/**
 * POST /api/ops/triage — Gemini JSON mode + responseSchema (F-13).
 * Body: { report: string, zoneId?: string }
 * Always answers: model output → validated; on any failure → deterministic
 * keyword-based canned triage (degraded flag set).
 */

import type { TriageResult } from "@/lib/types";
import { generateJson } from "@/lib/gemini";
import { triagePrompt, triageSchema } from "@/lib/prompts";
import { crowdAt } from "@/lib/simulation";
import { zoneById } from "@/lib/venue";

export const runtime = "nodejs";
export const maxDuration = 30;

const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const ROLES = ["steward", "medical", "security", "cleaning", "engineering"] as const;

function isTriage(x: unknown): x is TriageResult {
  if (typeof x !== "object" || x === null) return false;
  const t = x as Record<string, unknown>;
  return (
    SEVERITIES.includes(t.severity as (typeof SEVERITIES)[number]) &&
    typeof t.suggestedAction === "string" &&
    t.suggestedAction.length > 0 &&
    ROLES.includes(t.dispatchRole as (typeof ROLES)[number])
  );
}

/** Deterministic fallback triage — keyword table, no AI. */
function cannedTriage(report: string): TriageResult {
  const r = report.toLowerCase();
  if (/child|missing|fire|smoke|weapon|crush|collapse|chest pain|unconscious/.test(r))
    return {
      severity: /child|fire|weapon|crush|collapse/.test(r) ? "critical" : "high",
      suggestedAction: /chest pain|unconscious/.test(r)
        ? "Dispatch nearest medic with defibrillator; clear a corridor to the casualty."
        : "Alert control room supervisor and dispatch nearest team immediately.",
      dispatchRole: /chest pain|unconscious/.test(r) ? "medical" : "security",
    };
  if (/spill|glass|slippery|leak/.test(r))
    return { severity: "medium", suggestedAction: "Send cleaning crew; cone off the area until dry.", dispatchRole: "cleaning" };
  if (/turnstile|speaker|jam|broken|fault/.test(r))
    return { severity: "medium", suggestedAction: "Send engineering to inspect; open adjacent lane meanwhile.", dispatchRole: "engineering" };
  if (/argu|fight|aggress|drunk/.test(r))
    return { severity: "medium", suggestedAction: "Position two stewards nearby; de-escalate and separate groups.", dispatchRole: "security" };
  if (/wheelchair|assist|lift/.test(r))
    return { severity: "low", suggestedAction: "Send a steward to escort via the nearest lift.", dispatchRole: "steward" };
  return { severity: "low", suggestedAction: "Send nearest steward to assess and report back.", dispatchRole: "steward" };
}

export async function POST(req: Request): Promise<Response> {
  let body: { report?: unknown; zoneId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const report = typeof body.report === "string" ? body.report.slice(0, 500) : "";
  if (!report) return Response.json({ error: "Missing report" }, { status: 400 });
  const zoneId = typeof body.zoneId === "string" ? body.zoneId : "concourse-north";
  const zoneName = zoneById(zoneId)?.name ?? zoneId;
  const crowd = crowdAt(zoneId).level;

  try {
    const result = await generateJson<TriageResult>(triagePrompt(report, zoneName, crowd), triageSchema, isTriage);
    return Response.json({ ...result, degraded: false });
  } catch {
    return Response.json({ ...cannedTriage(report), degraded: true });
  }
}
