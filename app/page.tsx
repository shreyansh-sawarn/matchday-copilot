"use client";

import { useState } from "react";
import type { CrowdReading, RouteResult } from "@/lib/types";
import Chat from "@/components/Chat";

export default function Home() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [crowd, setCrowd] = useState<CrowdReading[]>([]);
  const [advisory, setAdvisory] = useState<string | undefined>();
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [seat, setSeat] = useState<string | undefined>(undefined);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold">⚽ MatchDay Copilot</h1>
          <p className="text-xs text-slate-400">Estadio Aurora · Final · France vs Brazil</p>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Chat
          accessibilityMode={accessibilityMode}
          seat={seat}
          onRoute={setRoute}
          onCrowd={(r, a) => {
            setCrowd(r);
            setAdvisory(a);
          }}
        />
      </main>
    </div>
  );
}
