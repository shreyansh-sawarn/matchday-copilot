/**
 * POST /api/ops/announce — one announcement in, six languages out
 * (Gemini JSON mode). Canned template fallback keeps the demo alive.
 */

import { generateJson } from "@/lib/gemini";
import { announcePrompt, announceSchema } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

type Announcement = Record<"en" | "es" | "fr" | "ar" | "pt" | "hi", string>;

const LANGS = ["en", "es", "fr", "ar", "pt", "hi"] as const;

function isAnnouncement(x: unknown): x is Announcement {
  if (typeof x !== "object" || x === null) return false;
  const a = x as Record<string, unknown>;
  return LANGS.every((l) => typeof a[l] === "string" && (a[l] as string).length > 0);
}

/** Fallback: pre-translated template for the most common demo announcement. */
function cannedAnnouncement(message: string): Announcement {
  return {
    en: message,
    es: `Atención: ${message} (Sigan las indicaciones del personal.)`,
    fr: `Attention : ${message} (Suivez les instructions du personnel.)`,
    ar: `تنبيه: ${message} (يرجى اتباع تعليمات الطاقم.)`,
    pt: `Atenção: ${message} (Sigam as orientações da equipe.)`,
    hi: `ध्यान दें: ${message} (कृपया स्टाफ़ के निर्देशों का पालन करें।)`,
  };
}

export async function POST(req: Request): Promise<Response> {
  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.slice(0, 300) : "";
  if (!message) return Response.json({ error: "Missing message" }, { status: 400 });

  try {
    const result = await generateJson<Announcement>(announcePrompt(message), announceSchema, isAnnouncement);
    return Response.json({ translations: result, degraded: false });
  } catch {
    return Response.json({ translations: cannedAnnouncement(message), degraded: true });
  }
}
