import type { CycleOutputs } from "@/lib/brayton";

interface Props {
  out: CycleOutputs;
}

// Map a temperature (K) to a color along ice -> flame.
function tempColor(T: number) {
  const t = Math.min(1, Math.max(0, (T - 250) / 1600));
  // interpolate hue from blue (220) to orange (35)
  const hue = 220 - t * 185;
  const light = 55 + t * 15;
  return `hsl(${hue} 85% ${light}%)`;
}

export function EngineDiagram({ out }: Props) {
  const stations = [
    { x: 60, T: out.v0 ? 288 : 288, label: "Inlet" },
    { x: 200, T: out.T2, label: "Compressor" },
    { x: 360, T: (out.T2 + out.T4) / 2 + 400, label: "Combustor" },
    { x: 520, T: out.T4, label: "Turbine" },
    { x: 680, T: out.T5, label: "Nozzle" },
  ];

  return (
    <svg viewBox="0 0 820 280" className="w-full h-auto">
      <defs>
        <linearGradient id="duct" x1="0" x2="1">
          {stations.map((s, i) => (
            <stop key={i} offset={`${(s.x / 820) * 100}%`} stopColor={tempColor(s.T)} />
          ))}
        </linearGradient>
        <radialGradient id="flameGrad" cx="0" cy="0.5" r="1">
          <stop offset="0%" stopColor="oklch(0.95 0.18 80)" />
          <stop offset="50%" stopColor="oklch(0.78 0.22 50)" />
          <stop offset="100%" stopColor="oklch(0.6 0.2 30 / 0)" />
        </radialGradient>
      </defs>

      {/* Engine outer body */}
      <path
        d="M 40 100 L 120 80 L 620 80 L 760 110 L 760 170 L 620 200 L 120 200 L 40 180 Z"
        fill="url(#duct)"
        opacity="0.25"
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />

      {/* Intake flow lines */}
      {[110, 130, 150].map((y) => (
        <line key={y} x1="0" y1={y} x2="60" y2={y}
          stroke="var(--color-ice)" strokeWidth="1.5" className="flow-line" opacity="0.6" />
      ))}

      {/* Compressor — stacked blades */}
      <g transform="translate(180 140)">
        {[0, 22, 44, 66].map((dx) => (
          <g key={dx} transform={`translate(${dx} 0)`} className="spin-slow">
            <ellipse cx="0" cy="0" rx="4" ry="50" fill="oklch(0.75 0.1 220)" />
          </g>
        ))}
      </g>

      {/* Combustor flame */}
      <g transform="translate(330 140)" className="flame">
        <ellipse cx="40" cy="0" rx="60" ry="38" fill="url(#flameGrad)" />
        <ellipse cx="30" cy="0" rx="35" ry="22" fill="oklch(0.95 0.15 85 / 0.8)" />
      </g>

      {/* Turbine */}
      <g transform="translate(520 140)">
        {[0, 22, 44].map((dx) => (
          <g key={dx} transform={`translate(${dx} 0)`} className="spin-slow">
            <ellipse cx="0" cy="0" rx="4" ry="55" fill="oklch(0.7 0.15 40)" />
          </g>
        ))}
      </g>

      {/* Nozzle exhaust plume */}
      <g transform="translate(760 140)">
        <path d="M 0 -30 Q 60 -10 120 0 Q 60 10 0 30 Z"
          fill="url(#flameGrad)" opacity={Math.min(1, out.v5 / 1000)} className="flame" />
      </g>

      {/* Shaft */}
      <line x1="160" y1="140" x2="580" y2="140" stroke="oklch(0.5 0.02 250)" strokeWidth="3" />

      {/* Labels */}
      {stations.map((s) => (
        <g key={s.label}>
          <line x1={s.x} y1="210" x2={s.x} y2="225" stroke="var(--color-muted-foreground)" />
          <text x={s.x} y="245" textAnchor="middle"
            className="fill-muted-foreground" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
            {s.label}
          </text>
          <text x={s.x} y="262" textAnchor="middle"
            className="fill-foreground" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
            {Math.round(s.T)}K
          </text>
        </g>
      ))}
    </svg>
  );
}
