"use client";

import { useCallback, useEffect, useState } from "react";
import type { CrowdReading, RouteResult, TransportOption } from "@/lib/types";
import Chat from "@/components/Chat";
import StadiumMap from "@/components/StadiumMap";
import CrowdBanner from "@/components/CrowdBanner";
import AccessibilityToggle from "@/components/AccessibilityToggle";
import TransportCard from "@/components/TransportCard";

export default function Home() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [crowd, setCrowd] = useState<CrowdReading[]>([]);
  const [advisory, setAdvisory] = useState<string | undefined>();
  const [transport, setTransport] = useState<TransportOption[]>([]);
  const [transportTip, setTransportTip] = useState<string | undefined>();
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [seat] = useState<string | undefined>(undefined);
  const [mapOpen, setMapOpen] = useState(true);

  // Poll the deterministic crowd simulation every 10s (one tick bucket).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/crowd");
        if (!res.ok) return;
        const data = (await res.json()) as { readings: CrowdReading[]; advisory?: string };
        if (alive) {
          setCrowd(data.readings);
          setAdvisory((a) => a ?? data.advisory);
        }
      } catch {
        /* non-fatal */
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const onCrowd = useCallback((readings: CrowdReading[], adv?: string) => {
    setCrowd(readings);
    if (adv) setAdvisory(adv);
  }, []);

  const onTransport = useCallback((options: TransportOption[], suggestion?: string) => {
    setTransport(options);
    setTransportTip(suggestion);
  }, []);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col md:max-w-2xl">
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-sky-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to chat
      </a>
      <header className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold">⚽ MatchDay Copilot</h1>
          <p className="truncate text-xs text-slate-400">Estadio Aurora · Final · France vs Brazil · 20:00</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AccessibilityToggle enabled={accessibilityMode} onChange={setAccessibilityMode} />
          <button
            onClick={() => setMapOpen((v) => !v)}
            aria-expanded={mapOpen}
            aria-controls="stadium-map"
            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-300 transition hover:border-slate-500"
          >
            {mapOpen ? "Hide map" : "Show map"}
          </button>
        </div>
      </header>

      <CrowdBanner readings={crowd} advisory={advisory} />

      {mapOpen && (
        <div id="stadium-map" className="relative h-[38%] shrink-0 border-b border-slate-800 bg-slate-950">
          <StadiumMap route={route} crowd={crowd} />
          {route?.found && (
            <p className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/90 px-3 py-1 text-xs text-sky-300">
              {route.accessible ? "♿ Step-free route · " : "Route · "}
              {route.totalDistance} m · {route.steps.length} steps
            </p>
          )}
        </div>
      )}

      {transport.length > 0 && (
        <TransportCard options={transport} suggestion={transportTip} onClose={() => setTransport([])} />
      )}

      <main className="min-h-0 flex-1">
        <Chat
          accessibilityMode={accessibilityMode}
          seat={seat}
          onRoute={setRoute}
          onCrowd={onCrowd}
          onTransport={onTransport}
        />
      </main>
    </div>
  );
}
