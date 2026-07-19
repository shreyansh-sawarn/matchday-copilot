"use client";

/**
 * Hand-authored schematic SVG of Estadio Aurora (D-06).
 * Concentric ellipse bands = zones (shaded by live crowd level); the graph's
 * SVG coordinates drive both the shapes and the route polyline, so the map
 * and the routing engine can never disagree.
 */

import { useMemo } from "react";
import type { CrowdLevel, CrowdReading, RouteResult } from "@/lib/types";
import { nodeById } from "@/lib/venue";

const CX = 500;
const CY = 350;

/** Point on an axis-aligned ellipse at parametric angle t (degrees). */
function pt(a: number, b: number, t: number): [number, number] {
  const rad = (t * Math.PI) / 180;
  return [CX + a * Math.cos(rad), CY + b * Math.sin(rad)];
}

/** Closed band segment between two concentric ellipses, from t1..t2 degrees. */
function band(a1: number, b1: number, a2: number, b2: number, t1: number, t2: number): string {
  const [x1, y1] = pt(a2, b2, t1);
  const [x2, y2] = pt(a2, b2, t2);
  const [x3, y3] = pt(a1, b1, t2);
  const [x4, y4] = pt(a1, b1, t1);
  const large = t2 - t1 > 180 ? 1 : 0;
  return [
    `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    `A ${a2} ${b2} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    `L ${x3.toFixed(1)} ${y3.toFixed(1)}`,
    `A ${a1} ${b1} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)}`,
    "Z",
  ].join(" ");
}

/** Full ring between two concentric ellipses (even-odd fill). */
function ring(a1: number, b1: number, a2: number, b2: number): string {
  return (
    `M ${CX + a2} ${CY} A ${a2} ${b2} 0 1 0 ${CX - a2} ${CY} A ${a2} ${b2} 0 1 0 ${CX + a2} ${CY} Z ` +
    `M ${CX + a1} ${CY} A ${a1} ${b1} 0 1 0 ${CX - a1} ${CY} A ${a1} ${b1} 0 1 0 ${CX + a1} ${CY} Z`
  );
}

const LEVEL_FILL: Record<CrowdLevel, string> = {
  low: "rgba(16,185,129,0.35)",
  moderate: "rgba(245,158,11,0.40)",
  high: "rgba(249,115,22,0.50)",
  critical: "rgba(239,68,68,0.55)",
};

const QUADRANTS: Record<string, [number, number]> = {
  "concourse-north": [-135, -45],
  "concourse-east": [-45, 45],
  "concourse-south": [45, 135],
  "concourse-west": [135, 225],
};

interface StadiumMapProps {
  route?: RouteResult | null;
  crowd?: CrowdReading[];
}

export default function StadiumMap({ route, crowd }: StadiumMapProps) {
  const levelOf = useMemo(() => {
    const m = new Map<string, CrowdLevel>();
    for (const r of crowd ?? []) m.set(r.zoneId, r.level);
    return (zoneId: string) => m.get(zoneId);
  }, [crowd]);

  const fill = (zoneId: string, fallback: string) => {
    const level = levelOf(zoneId);
    return level ? LEVEL_FILL[level] : fallback;
  };

  const polyPoints = useMemo(() => {
    if (!route?.found) return "";
    return route.polyline
      .map((id) => nodeById(id))
      .filter((n): n is NonNullable<typeof n> => Boolean(n))
      .map((n) => `${n.x},${n.y}`)
      .join(" ");
  }, [route]);

  const start = route?.found ? nodeById(route.polyline[0]) : undefined;
  const end = route?.found ? nodeById(route.polyline[route.polyline.length - 1]) : undefined;

  const mapLabel = route?.found
    ? `Stadium map showing a ${route.totalDistance} metre route with ${route.steps.length} steps`
    : "Stadium map of Estadio Aurora";

  return (
    <svg
      viewBox="0 0 1000 700"
      role="img"
      aria-label={mapLabel}
      className="h-full w-full select-none"
    >
      {/* Outer plaza */}
      <path d={ring(430, 285, 468, 312)} fillRule="evenodd" fill={fill("outer-plaza", "rgba(51,65,85,0.35)")} stroke="#334155" strokeWidth="1.5" />
      {/* Upper tier ring */}
      <path d={ring(390, 245, 430, 285)} fillRule="evenodd" fill={fill("seating-upper", "rgba(71,85,105,0.30)")} stroke="#334155" strokeWidth="1" />
      {/* Concourse quadrants */}
      {Object.entries(QUADRANTS).map(([zoneId, [t1, t2]]) => (
        <path
          key={zoneId}
          d={band(330, 185, 390, 245, t1, t2)}
          fill={fill(zoneId, "rgba(30,41,59,0.55)")}
          stroke="#334155"
          strokeWidth="1"
        />
      ))}
      {/* Lower bowl */}
      <path d={ring(240, 125, 330, 185)} fillRule="evenodd" fill={fill("seating-lower", "rgba(71,85,105,0.35)")} stroke="#334155" strokeWidth="1" />
      {/* Pitch */}
      <ellipse cx={CX} cy={CY} rx={210} ry={108} fill={fill("pitch", "#14532d")} stroke="#166534" strokeWidth="3" />
      <rect x={CX - 60} y={CY - 40} width={120} height={80} fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />
      <circle cx={CX} cy={CY} r={24} fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />
      <line x1={CX} y1={CY - 40} x2={CX} y2={CY + 40} stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />

      {/* Gates */}
      {(["a", "b", "c", "d"] as const).map((g) => {
        const n = nodeById(`n-gate-${g}`);
        if (!n) return null;
        return (
          <g key={g}>
            <circle cx={n.x} cy={n.y} r={17} fill="#0f172a" stroke="#7cc4ff" strokeWidth="2" />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="16" fontWeight="700" fill="#e6edf6">
              {g.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Landmarks (subtle) */}
      {["n-info", "n-medical", "n-prayer"].map((id) => {
        const n = nodeById(id);
        if (!n) return null;
        const icon = id === "n-info" ? "i" : id === "n-medical" ? "+" : "☪";
        return (
          <g key={id} opacity="0.85">
            <circle cx={n.x} cy={n.y} r={10} fill="#1e293b" stroke="#64748b" strokeWidth="1" />
            <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize="10" fill="#cbd5e1">
              {icon}
            </text>
          </g>
        );
      })}

      {/* Route */}
      {polyPoints && (
        <>
          <polyline
            points={polyPoints}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />
          <polyline
            className="route-path"
            points={polyPoints}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {start && (
        <g>
          <circle cx={start.x} cy={start.y} r={12} fill="#38bdf8" opacity="0.3">
            <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={start.x} cy={start.y} r={7} fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2" />
        </g>
      )}
      {end && (
        <g>
          <circle cx={end.x} cy={end.y} r={9} fill="#f43f5e" stroke="#ffe4e6" strokeWidth="2" />
          <text x={end.x} y={end.y - 16} textAnchor="middle" fontSize="14" fill="#fecdd3" fontWeight="600">
            ●
          </text>
        </g>
      )}
    </svg>
  );
}
