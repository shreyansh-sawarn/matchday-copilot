"use client";

/**
 * Accessibility mode toggle (F-09):
 *  - large text (root class, 120% base font)
 *  - simple-language flag → server switches to the simple-language prompt variant
 *  - step-free routing default (accessible=true passed to tools)
 */

import { useEffect } from "react";

interface AccessibilityToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function AccessibilityToggle({ enabled, onChange }: AccessibilityToggleProps) {
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-large", enabled);
  }, [enabled]);

  return (
    <button
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      aria-label="Accessibility mode: large text, simple language, step-free routes"
      title="Accessibility mode: large text, simple language, step-free routes"
      className={`rounded-lg border px-2.5 py-1.5 text-sm transition ${
        enabled
          ? "border-sky-400 bg-sky-500/20 text-sky-300"
          : "border-slate-700 text-slate-300 hover:border-slate-500"
      }`}
    >
      ♿ <span className="sr-only">{enabled ? "On" : "Off"}</span>
    </button>
  );
}
