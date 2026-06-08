import type { CycleOutputs } from "@/lib/brayton";

interface Props {
  out: CycleOutputs;
  T1: number;
  T3: number;
}

function tempColor(T: number, alpha = 1) {
  const t = Math.min(1, Math.max(0, (T - 250) / 1700));
  const hue = 220 - t * 195;
  const light = 50 + t * 20;
  return `hsl(${hue} 90% ${light}% / ${alpha})`;
}

export function EngineDiagram({ out, T1, T3 }: Props) {
  const W = 900, H = 340;
  const cy = 160;

  // Section boundaries (x positions along engine)
  const sx = { intake: 60, fan: 160, comp: 240, combStart: 400, combEnd: 520, turb: 580, nozStart: 680, nozExit: 840 };

  // Duct profile (upper edge) — varies through stages
  const upper = [
    [40, cy - 50],   // far inlet
    [sx.intake, cy - 60],
    [sx.fan, cy - 78],
    [sx.comp, cy - 72],
    [sx.combStart, cy - 64],
    [sx.combEnd, cy - 64],
    [sx.turb, cy - 70],
    [sx.nozStart, cy - 58],
    [sx.nozExit, cy - 30],
  ];
  const lower = upper.map(([x, y]) => [x, cy + (cy - y)] as [number, number]);
  const ductPath = `M ${upper.map((p) => p.join(" ")).join(" L ")} L ${[...lower].reverse().map((p) => p.join(" ")).join(" L ")} Z`;

  const stations = [
    { x: sx.intake + 10, T: T1, n: "1", name: "Inlet" },
    { x: sx.comp + 30, T: out.T2, n: "2", name: "Comp exit" },
    { x: sx.combEnd - 10, T: T3, n: "3", name: "Turb inlet" },
    { x: sx.turb + 30, T: out.T4, n: "4", name: "Turb exit" },
    { x: sx.nozExit - 5, T: out.T5, n: "5", name: "Nozzle exit" },
  ];

  const plumeIntensity = Math.min(1, out.v5 / 1200);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        {/* Grid */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.3 0.03 250 / 0.35)" strokeWidth="0.5" />
        </pattern>

        {/* Duct interior gradient: cool blue → orange */}
        <linearGradient id="ductFill" x1="0" x2="1">
          <stop offset="0%" stopColor={tempColor(T1, 0.55)} />
          <stop offset={`${(sx.comp / W) * 100}%`} stopColor={tempColor(out.T2, 0.6)} />
          <stop offset={`${(sx.combStart / W) * 100}%`} stopColor={tempColor((out.T2 + T3) / 2, 0.7)} />
          <stop offset={`${(sx.combEnd / W) * 100}%`} stopColor={tempColor(T3, 0.85)} />
          <stop offset={`${(sx.turb / W) * 100}%`} stopColor={tempColor(out.T4, 0.75)} />
          <stop offset={`${(sx.nozExit / W) * 100}%`} stopColor={tempColor(out.T5, 0.7)} />
        </linearGradient>

        <linearGradient id="metalShell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.42 0.02 250)" />
          <stop offset="50%" stopColor="oklch(0.28 0.02 250)" />
          <stop offset="100%" stopColor="oklch(0.18 0.02 250)" />
        </linearGradient>

        <radialGradient id="flameCore" cx="0.2" cy="0.5" r="0.8">
          <stop offset="0%" stopColor="oklch(0.98 0.16 90)" />
          <stop offset="40%" stopColor="oklch(0.82 0.22 60)" />
          <stop offset="80%" stopColor="oklch(0.65 0.24 30 / 0.6)" />
          <stop offset="100%" stopColor="oklch(0.5 0.2 25 / 0)" />
        </radialGradient>

        <radialGradient id="plume" cx="0" cy="0.5" r="1">
          <stop offset="0%" stopColor="oklch(0.95 0.18 75)" />
          <stop offset="40%" stopColor="oklch(0.78 0.22 45)" />
          <stop offset="100%" stopColor="oklch(0.5 0.2 25 / 0)" />
        </radialGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <clipPath id="ductClip">
          <path d={ductPath} />
        </clipPath>
      </defs>

      {/* Background grid panel */}
      <rect width={W} height={H} fill="url(#grid)" opacity="0.5" />

      {/* Centerline */}
      <line x1="0" y1={cy} x2={W} y2={cy}
        stroke="oklch(0.5 0.03 250 / 0.4)" strokeWidth="0.5" strokeDasharray="8 4 2 4" />

      {/* Intake streamlines */}
      {[-40, -20, 0, 20, 40].map((dy) => (
        <path
          key={dy}
          d={`M 0 ${cy + dy * 1.5} Q ${sx.intake - 20} ${cy + dy * 1.2} ${sx.intake} ${cy + dy * 0.9}`}
          fill="none"
          stroke="var(--color-ice)"
          strokeWidth="1"
          opacity="0.55"
          className="flow-line"
        />
      ))}

      {/* Duct interior */}
      <path d={ductPath} fill="url(#ductFill)" />

      {/* Internals (clipped to duct) */}
      <g clipPath="url(#ductClip)">
        {/* Fan stage */}
        <g transform={`translate(${sx.fan} ${cy})`}>
          {[0, 0, 0].map((_, i) => (
            <ellipse key={i} cx={i * 12} cy="0" rx="3" ry="72"
              fill="oklch(0.78 0.08 220)" opacity="0.85" className="spin-slow" />
          ))}
        </g>

        {/* Compressor (multi-stage shrinking) */}
        <g transform={`translate(${sx.comp} ${cy})`}>
          {[0, 14, 28, 42, 56, 70, 84, 98, 112].map((dx, i) => {
            const r = 64 - i * 3.5;
            return (
              <ellipse key={dx} cx={dx} cy="0" rx="2.5" ry={r}
                fill={`oklch(0.75 0.08 ${220 - i * 6})`} opacity="0.95" className="spin-slow" />
            );
          })}
        </g>

        {/* Shaft */}
        <rect x={sx.comp + 20} y={cy - 6} width={sx.turb - sx.comp - 10} height="12"
          fill="oklch(0.45 0.02 250)" stroke="oklch(0.3 0.02 250)" />
        <rect x={sx.comp + 20} y={cy - 6} width={sx.turb - sx.comp - 10} height="2"
          fill="oklch(0.6 0.02 250)" />

        {/* Combustor liner (annular cans top + bottom) */}
        {[-1, 1].map((side) => (
          <g key={side}>
            <path
              d={`M ${sx.combStart} ${cy + side * 24} 
                  Q ${(sx.combStart + sx.combEnd) / 2} ${cy + side * 50} 
                  ${sx.combEnd} ${cy + side * 24}`}
              fill="none" stroke="oklch(0.5 0.04 30)" strokeWidth="2.5"
            />
            <path
              d={`M ${sx.combStart} ${cy + side * 38} 
                  Q ${(sx.combStart + sx.combEnd) / 2} ${cy + side * 58} 
                  ${sx.combEnd} ${cy + side * 38}`}
              fill="none" stroke="oklch(0.4 0.03 30)" strokeWidth="1.5" opacity="0.7"
            />
            {/* fuel injectors */}
            <circle cx={sx.combStart + 8} cy={cy + side * 32} r="3" fill="oklch(0.7 0.1 250)" />
            <circle cx={sx.combStart + 8} cy={cy + side * 32} r="1" fill="oklch(0.95 0.15 80)" />
          </g>
        ))}

        {/* Flame */}
        <g transform={`translate(${sx.combStart + 20} ${cy})`} className="flame">
          <ellipse cx="40" cy="0" rx="70" ry="32" fill="url(#flameCore)" filter="url(#glow)" />
          <ellipse cx="30" cy="0" rx="40" ry="18" fill="oklch(0.98 0.15 85 / 0.85)" />
          <ellipse cx="20" cy="0" rx="18" ry="8" fill="oklch(1 0.05 95)" />
        </g>

        {/* Turbine */}
        <g transform={`translate(${sx.turb} ${cy})`}>
          {[0, 16, 32, 48].map((dx, i) => {
            const r = 60 + i * 4;
            return (
              <ellipse key={dx} cx={dx} cy="0" rx="3" ry={r}
                fill={`oklch(0.7 0.18 ${50 - i * 3})`} opacity="0.95" className="spin-slow" />
            );
          })}
        </g>

        {/* Nozzle cone (center body) */}
        <path
          d={`M ${sx.nozStart} ${cy - 8} L ${sx.nozExit - 30} ${cy} L ${sx.nozStart} ${cy + 8} Z`}
          fill="oklch(0.35 0.03 30)"
        />
      </g>

      {/* Duct shell outline */}
      <path d={ductPath} fill="none" stroke="url(#metalShell)" strokeWidth="2.5" />
      <path d={`M ${upper.map((p) => p.join(" ")).join(" L ")}`}
        fill="none" stroke="oklch(0.6 0.03 250 / 0.6)" strokeWidth="0.5" />
      <path d={`M ${lower.map((p) => p.join(" ")).join(" L ")}`}
        fill="none" stroke="oklch(0.6 0.03 250 / 0.6)" strokeWidth="0.5" />

      {/* Exhaust plume */}
      <g transform={`translate(${sx.nozExit} ${cy})`}>
        <path d={`M -10 -28 Q 80 -8 ${W - sx.nozExit} 0 Q 80 8 -10 28 Z`}
          fill="url(#plume)" opacity={0.4 + plumeIntensity * 0.5} className="flame" />
        <path d={`M -10 -14 Q 50 -4 ${(W - sx.nozExit) * 0.7} 0 Q 50 4 -10 14 Z`}
          fill="oklch(0.95 0.16 80 / 0.55)" className="flame" />
      </g>

      {/* Section bracket labels (top) */}
      {[
        { x1: sx.intake, x2: sx.fan, label: "INTAKE" },
        { x1: sx.fan, x2: sx.combStart, label: "COMPRESSOR" },
        { x1: sx.combStart, x2: sx.combEnd, label: "COMBUSTOR" },
        { x1: sx.combEnd, x2: sx.nozStart, label: "TURBINE" },
        { x1: sx.nozStart, x2: sx.nozExit, label: "NOZZLE" },
      ].map((s) => {
        const mid = (s.x1 + s.x2) / 2;
        return (
          <g key={s.label}>
            <line x1={s.x1 + 4} y1={36} x2={s.x2 - 4} y2={36}
              stroke="oklch(0.55 0.03 250 / 0.7)" strokeWidth="1" />
            <line x1={s.x1 + 4} y1={32} x2={s.x1 + 4} y2={40} stroke="oklch(0.55 0.03 250 / 0.7)" />
            <line x1={s.x2 - 4} y1={32} x2={s.x2 - 4} y2={40} stroke="oklch(0.55 0.03 250 / 0.7)" />
            <text x={mid} y={26} textAnchor="middle"
              className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>
              {s.label}
            </text>
          </g>
        );
      })}

      {/* Station markers (bottom) */}
      {stations.map((s) => (
        <g key={s.n}>
          <line x1={s.x} y1={cy + 80} x2={s.x} y2={cy + 100}
            stroke="oklch(0.55 0.03 250)" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx={s.x} cy={cy + 108} r="11"
            fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="1.5" />
          <text x={s.x} y={cy + 112} textAnchor="middle"
            className="fill-primary" style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {s.n}
          </text>
          <text x={s.x} y={cy + 134} textAnchor="middle"
            className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            {s.name.toUpperCase()}
          </text>
          <text x={s.x} y={cy + 148} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: tempColor(s.T) }}>
            {Math.round(s.T)} K
          </text>
        </g>
      ))}

      {/* Temperature legend (top right) */}
      <g transform={`translate(${W - 180} 10)`}>
        <text x="0" y="10" className="fill-muted-foreground"
          style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>
          GAS TEMPERATURE
        </text>
        <defs>
          <linearGradient id="legendGrad" x1="0" x2="1">
            <stop offset="0%" stopColor={tempColor(300)} />
            <stop offset="50%" stopColor={tempColor(900)} />
            <stop offset="100%" stopColor={tempColor(1900)} />
          </linearGradient>
        </defs>
        <rect x="0" y="14" width="160" height="6" fill="url(#legendGrad)" rx="1" />
        <text x="0" y="32" className="fill-muted-foreground"
          style={{ fontSize: 8, fontFamily: "var(--font-mono)" }}>300K</text>
        <text x="160" y="32" textAnchor="end" className="fill-muted-foreground"
          style={{ fontSize: 8, fontFamily: "var(--font-mono)" }}>1900K</text>
      </g>

      {/* Flow direction indicator */}
      <g transform={`translate(20 ${cy})`}>
        <text x="0" y="-8" className="fill-muted-foreground"
          style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>FLOW</text>
        <path d="M 0 0 L 22 0 M 16 -4 L 22 0 L 16 4"
          stroke="var(--color-ice)" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}
