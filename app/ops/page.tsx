"use client";

/**
 * Ops dashboard (stretch F-12..F-14) — desktop-first control-room view.
 * Reuses the fan map as a live heatmap (10s refresh = one sim bucket),
 * simulated incident feed with Gemini JSON-mode triage, one-click shift
 * briefing and six-language announcements.
 */

import { useCallback, useEffect, useState } from "react";
import type { CrowdReading, Incident, TriageResult } from "@/lib/types";
import StadiumMap from "@/components/StadiumMap";

interface IncidentRow extends Incident {
  zoneName: string;
  triage?: TriageResult & { degraded?: boolean };
  triaging?: boolean;
}

interface Briefing {
  headline: string;
  bullets: string[];
  watchouts: string[];
  degraded?: boolean;
}

const SEV_STYLE: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  high: "bg-orange-500/20 text-orange-300",
  critical: "bg-red-500/20 text-red-300",
};

export default function OpsPage() {
  const [crowd, setCrowd] = useState<CrowdReading[]>([]);
  const [phase, setPhase] = useState("");
  const [advisory, setAdvisory] = useState("");
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingBusy, setBriefingBusy] = useState(false);
  const [announceMsg, setAnnounceMsg] = useState(
    "Gate B is congested after the match. Please use Gate D for a faster exit.",
  );
  const [announcement, setAnnouncement] = useState<Record<string, string> | null>(null);
  const [announceBusy, setAnnounceBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [crowdRes, incRes] = await Promise.all([fetch("/api/crowd"), fetch("/api/ops/incidents")]);
      if (crowdRes.ok) {
        const c = await crowdRes.json();
        setCrowd(c.readings);
        setPhase(c.phase);
        setAdvisory(c.advisory);
      }
      if (incRes.ok) {
        const inc = (await incRes.json()) as { incidents: IncidentRow[] };
        setIncidents((prev) => {
          const known = new Map(prev.map((p) => [p.id, p]));
          return inc.incidents.map((i) => ({ ...i, ...known.get(i.id) }));
        });
      }
    } catch {
      /* keep last state */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  const triage = useCallback(async (row: IncidentRow) => {
    setIncidents((list) => list.map((i) => (i.id === row.id ? { ...i, triaging: true } : i)));
    try {
      const res = await fetch("/api/ops/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: row.report, zoneId: row.zoneId }),
      });
      const t = await res.json();
      setIncidents((list) => list.map((i) => (i.id === row.id ? { ...i, triage: t, triaging: false } : i)));
    } catch {
      setIncidents((list) => list.map((i) => (i.id === row.id ? { ...i, triaging: false } : i)));
    }
  }, []);

  const runBriefing = useCallback(async () => {
    setBriefingBusy(true);
    try {
      const res = await fetch("/api/ops/briefing", { method: "POST" });
      setBriefing(await res.json());
    } catch {
      /* ignore */
    } finally {
      setBriefingBusy(false);
    }
  }, []);

  const runAnnounce = useCallback(async () => {
    setAnnounceBusy(true);
    try {
      const res = await fetch("/api/ops/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: announceMsg }),
      });
      const data = await res.json();
      setAnnouncement(data.translations ?? null);
    } catch {
      /* ignore */
    } finally {
      setAnnounceBusy(false);
    }
  }, [announceMsg]);

  return (
    <div className="mx-auto min-h-dvh max-w-6xl p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">🎛️ MatchDay Ops — Estadio Aurora</h1>
          <p className="text-sm text-slate-400">
            Final · France vs Brazil · phase: <strong className="text-slate-200">{phase || "…"}</strong>
            {advisory ? ` · ${advisory}` : ""}
          </p>
        </div>
        <a href="/" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500">
          ← Fan view
        </a>
      </header>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Heatmap */}
        <section aria-label="Crowd heatmap" className="rounded-xl border border-slate-800 bg-slate-950 p-2 lg:col-span-3">
          <h2 className="px-2 pt-1 text-sm font-semibold text-slate-300">Live crowd heatmap (10s refresh)</h2>
          <div className="h-[420px]">
            <StadiumMap crowd={crowd} />
          </div>
          <div className="flex flex-wrap gap-3 px-2 pb-2 text-xs text-slate-400">
            {crowd.map((r) => (
              <span key={r.zoneId}>
                {r.zoneName}: <strong className="text-slate-200">{Math.round(r.occupancy * 100)}%</strong>
              </span>
            ))}
          </div>
        </section>

        {/* Incidents */}
        <section aria-label="Incident feed" className="rounded-xl border border-slate-800 bg-slate-950 p-3 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Incident feed (simulated) → Gemini triage</h2>
          <ul className="space-y-2">
            {incidents.map((i) => (
              <li key={i.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-slate-200">{i.report}</p>
                    <p className="text-xs text-slate-500">
                      {i.zoneName} · {new Date(i.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={() => triage(i)}
                    disabled={i.triaging}
                    className="shrink-0 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    {i.triaging ? "…" : i.triage ? "Re-triage" : "Triage"}
                  </button>
                </div>
                {i.triage && (
                  <div className="mt-2 rounded-md bg-slate-800/70 p-2 text-xs">
                    <span className={`mr-2 rounded px-1.5 py-0.5 font-bold uppercase ${SEV_STYLE[i.triage.severity]}`}>
                      {i.triage.severity}
                    </span>
                    <span className="font-semibold text-slate-300">→ {i.triage.dispatchRole}</span>
                    {i.triage.degraded && <span className="ml-1 text-amber-400">⚡</span>}
                    <p className="mt-1 text-slate-300">{i.triage.suggestedAction}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Briefing */}
        <section aria-label="Shift briefing" className="rounded-xl border border-slate-800 bg-slate-950 p-3 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Shift briefing (JSON mode)</h2>
            <button
              onClick={runBriefing}
              disabled={briefingBusy}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {briefingBusy ? "Generating…" : "Generate briefing"}
            </button>
          </div>
          {briefing ? (
            <div className="text-sm">
              <p className="font-semibold text-slate-100">
                {briefing.headline} {briefing.degraded && <span className="text-amber-400">⚡</span>}
              </p>
              <ul className="mt-1.5 list-disc pl-5 text-slate-300">
                {briefing.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              {briefing.watchouts.length > 0 && (
                <p className="mt-1.5 text-xs text-amber-300">⚠ {briefing.watchouts.join(" · ")}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Generate a control-room briefing from the current simulation state.</p>
          )}
        </section>

        {/* Announce */}
        <section aria-label="Multilingual announcement" className="rounded-xl border border-slate-800 bg-slate-950 p-3 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">PA / push announcement → 6 languages</h2>
          <label htmlFor="announce-input" className="sr-only">Announcement text</label>
          <textarea
            id="announce-input"
            value={announceMsg}
            onChange={(e) => setAnnounceMsg(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white"
          />
          <button
            onClick={runAnnounce}
            disabled={announceBusy || !announceMsg.trim()}
            className="mt-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {announceBusy ? "Translating…" : "Broadcast in 6 languages"}
          </button>
          {announcement && (
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {Object.entries(announcement).map(([lang, text]) => (
                <li key={lang} dir="auto">
                  <strong className="uppercase text-slate-500">{lang}</strong> {text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
