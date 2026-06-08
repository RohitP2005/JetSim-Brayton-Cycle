import type { CycleOutputs } from "@/lib/brayton";

interface Props {
  out: CycleOutputs;
  T1: number;
  T3: number;
}

function tempColor(T: number, alpha = 1) {
  const t = Math.min(1, Math.max(0, (T - 250) / 1800));
  const hue = 220 - t * 200;
  const light = 50 + t * 22;
  return `hsl(${hue} 92% ${light}% / ${alpha})`;
}

export function EngineDiagram({ out, T1, T3 }: Props) {
  const W = 980, H = 420;
  const cy = 210;

  // Stage X positions
  const sx = {
    inletLip: 70,
    fan: 150,
    lpc: 230,        // low-pressure compressor
    hpc: 320,        // high-pressure compressor
    diffuser: 430,
    combStart: 460,
    combEnd: 580,
    hpt: 620,        // high-pressure turbine
    lpt: 720,        // low-pressure turbine
    nozStart: 820,
    nozExit: 940,
  };

  // Core (hot section) duct profile
  const coreUpper: [number, number][] = [
    [sx.fan, cy - 38],
    [sx.lpc, cy - 44],
    [sx.hpc, cy - 40],
    [sx.diffuser, cy - 36],
    [sx.combStart, cy - 50],
    [sx.combEnd, cy - 50],
    [sx.hpt, cy - 48],
    [sx.lpt, cy - 44],
    [sx.nozStart, cy - 38],
    [sx.nozExit, cy - 18],
  ];
  const coreLower = coreUpper.map(([x, y]) => [x, cy + (cy - y)] as [number, number]);
  const corePath =
    `M ${coreUpper.map((p) => p.join(" ")).join(" L ")} ` +
    `L ${[...coreLower].reverse().map((p) => p.join(" ")).join(" L ")} Z`;

  // Outer fan cowl (bypass duct)
  const fanUpper: [number, number][] = [
    [40, cy - 60],
    [sx.inletLip, cy - 92],
    [sx.fan, cy - 110],
    [sx.lpc + 20, cy - 108],
    [sx.hpc, cy - 100],
    [sx.diffuser, cy - 92],
    [sx.combEnd, cy - 86],
    [sx.lpt, cy - 82],
    [sx.nozStart, cy - 76],
  ];
  const fanLower = fanUpper.map(([x, y]) => [x, cy + (cy - y)] as [number, number]);
  const fanPath =
    `M ${fanUpper.map((p) => p.join(" ")).join(" L ")} ` +
    `L ${[...fanLower].reverse().map((p) => p.join(" ")).join(" L ")} Z`;

  const stations = [
    { x: sx.fan - 6, T: T1, n: "1", name: "Inlet" },
    { x: sx.hpc + 70, T: out.T2, n: "2", name: "Comp exit" },
    { x: sx.combEnd - 4, T: T3, n: "3", name: "Turb inlet" },
    { x: sx.lpt + 30, T: out.T4, n: "4", name: "Turb exit" },
    { x: sx.nozExit - 8, T: out.T5, n: "5", name: "Nozzle exit" },
  ];

  const plumeI = Math.min(1, out.v5 / 1200);

  // Helper: blade stack
  const blade = (x: number, y: number, r: number, fill: string) => (
    <ellipse cx={x} cy={y} rx={2.4} ry={r} fill={fill} opacity="0.95" />
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="oklch(0.32 0.03 250 / 0.3)" strokeWidth="0.5" />
        </pattern>

        <linearGradient id="fanFill" x1="0" x2="1">
          <stop offset="0%" stopColor={tempColor(T1, 0.4)} />
          <stop offset="100%" stopColor={tempColor(T1 + 30, 0.45)} />
        </linearGradient>

        <linearGradient id="coreFill" x1="0" x2="1">
          <stop offset="0%" stopColor={tempColor(T1, 0.5)} />
          <stop offset={`${((sx.hpc - sx.fan) / (sx.nozExit - sx.fan)) * 100}%`} stopColor={tempColor(out.T2, 0.7)} />
          <stop offset={`${((sx.combStart - sx.fan) / (sx.nozExit - sx.fan)) * 100}%`} stopColor={tempColor((out.T2 + T3) / 2, 0.78)} />
          <stop offset={`${((sx.combEnd - sx.fan) / (sx.nozExit - sx.fan)) * 100}%`} stopColor={tempColor(T3, 0.9)} />
          <stop offset={`${((sx.lpt - sx.fan) / (sx.nozExit - sx.fan)) * 100}%`} stopColor={tempColor(out.T4, 0.8)} />
          <stop offset="100%" stopColor={tempColor(out.T5, 0.75)} />
        </linearGradient>

        <linearGradient id="shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.55 0.02 250)" />
          <stop offset="50%" stopColor="oklch(0.32 0.02 250)" />
          <stop offset="100%" stopColor="oklch(0.18 0.02 250)" />
        </linearGradient>

        <linearGradient id="coreShell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.6 0.03 60)" />
          <stop offset="50%" stopColor="oklch(0.4 0.04 40)" />
          <stop offset="100%" stopColor="oklch(0.25 0.03 30)" />
        </linearGradient>

        <radialGradient id="flameCore" cx="0.15" cy="0.5" r="0.85">
          <stop offset="0%" stopColor="oklch(0.98 0.16 90)" />
          <stop offset="35%" stopColor="oklch(0.85 0.22 65)" />
          <stop offset="75%" stopColor="oklch(0.65 0.24 35 / 0.55)" />
          <stop offset="100%" stopColor="oklch(0.5 0.2 25 / 0)" />
        </radialGradient>

        <radialGradient id="plume" cx="0" cy="0.5" r="1">
          <stop offset="0%" stopColor="oklch(0.95 0.18 75)" />
          <stop offset="40%" stopColor="oklch(0.78 0.22 45 / 0.85)" />
          <stop offset="100%" stopColor="oklch(0.5 0.2 25 / 0)" />
        </radialGradient>

        <radialGradient id="bypassPlume" cx="0" cy="0.5" r="1">
          <stop offset="0%" stopColor="oklch(0.75 0.13 220 / 0.6)" />
          <stop offset="100%" stopColor="oklch(0.5 0.1 230 / 0)" />
        </radialGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <clipPath id="fanClip"><path d={fanPath} /></clipPath>
        <clipPath id="coreClip"><path d={corePath} /></clipPath>
      </defs>

      {/* Background grid */}
      <rect width={W} height={H} fill="url(#grid)" opacity="0.5" />

      {/* Centerline */}
      <line x1="0" y1={cy} x2={W} y2={cy}
        stroke="oklch(0.5 0.03 250 / 0.45)" strokeWidth="0.5" strokeDasharray="10 4 2 4" />

      {/* Inlet streamlines */}
      {[-70, -45, -25, 25, 45, 70].map((dy) => (
        <path key={dy}
          d={`M 0 ${cy + dy * 1.4} Q ${sx.inletLip - 30} ${cy + dy * 1.1} ${sx.inletLip} ${cy + dy * 0.95}`}
          fill="none" stroke="var(--color-ice)" strokeWidth="1" opacity="0.5" className="flow-line" />
      ))}

      {/* === FAN COWL (bypass) === */}
      <path d={fanPath} fill="url(#fanFill)" />

      {/* Bypass duct flow indicators */}
      <g clipPath="url(#fanClip)">
        {[-78, -68, 68, 78].map((dy) => (
          <line key={dy} x1={sx.fan + 30} y1={cy + dy} x2={sx.nozStart - 20} y2={cy + dy}
            stroke="oklch(0.75 0.13 220 / 0.5)" strokeWidth="1" strokeDasharray="6 6" className="flow-line" />
        ))}
        <text x={(sx.lpc + sx.hpc) / 2} y={cy - 72} textAnchor="middle"
          className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}>
          BYPASS AIR
        </text>
        <text x={(sx.lpc + sx.hpc) / 2} y={cy + 80} textAnchor="middle"
          className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}>
          BYPASS AIR
        </text>
      </g>

      {/* === CORE DUCT === */}
      <path d={corePath} fill="url(#coreFill)" />

      {/* Core internals */}
      <g clipPath="url(#coreClip)">
        {/* Inlet guide vanes */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${sx.fan - 10} ${cy + s * 40} L ${sx.fan - 4} ${cy + s * 20}`}
            stroke="oklch(0.55 0.05 220)" strokeWidth="2" />
        ))}

        {/* LP Compressor (booster) — 3 stages */}
        {[0, 1, 2].map((i) => {
          const x = sx.lpc + i * 18;
          const r = 38 - i * 2;
          return (
            <g key={i} className="spin-slow">
              {blade(x, cy, r, `oklch(0.72 0.08 ${220 - i * 4})`)}
            </g>
          );
        })}

        {/* HP Compressor — 7 stages, shrinking */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = sx.hpc + i * 14;
          const r = 34 - i * 3;
          return (
            <g key={i} className="spin-slow">
              {blade(x, cy, r, `oklch(0.78 0.1 ${200 - i * 6})`)}
            </g>
          );
        })}

        {/* Stator vanes between HPC stages (static) */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = sx.hpc + i * 14 + 7;
          const r = 32 - i * 3;
          return (
            <line key={i} x1={x} y1={cy - r} x2={x} y2={cy + r}
              stroke="oklch(0.45 0.03 250)" strokeWidth="1" opacity="0.7" />
          );
        })}

        {/* Diffuser */}
        <path d={`M ${sx.diffuser - 6} ${cy - 26} L ${sx.diffuser + 18} ${cy - 38} 
                  M ${sx.diffuser - 6} ${cy + 26} L ${sx.diffuser + 18} ${cy + 38}`}
          stroke="oklch(0.5 0.04 60)" strokeWidth="1.5" />

        {/* LP Shaft (long, thinner, inside HP shaft) */}
        <rect x={sx.lpc + 8} y={cy - 3} width={sx.lpt + 40 - sx.lpc} height="6"
          fill="oklch(0.55 0.03 220)" />

        {/* HP Shaft (shorter, thicker, around LP) */}
        <rect x={sx.hpc + 4} y={cy - 9} width={sx.hpt + 40 - sx.hpc} height="18"
          fill="oklch(0.42 0.03 250)" stroke="oklch(0.28 0.02 250)" />
        <rect x={sx.hpc + 4} y={cy - 9} width={sx.hpt + 40 - sx.hpc} height="2.5"
          fill="oklch(0.65 0.03 250)" />
        <rect x={sx.hpc + 4} y={cy + 6.5} width={sx.hpt + 40 - sx.hpc} height="2.5"
          fill="oklch(0.22 0.02 250)" />

        {/* Combustor — annular liner top/bottom */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <path
              d={`M ${sx.combStart} ${cy + s * 22} 
                  Q ${(sx.combStart + sx.combEnd) / 2} ${cy + s * 44} 
                  ${sx.combEnd} ${cy + s * 22}`}
              fill="none" stroke="oklch(0.5 0.05 30)" strokeWidth="2.5" />
            <path
              d={`M ${sx.combStart + 4} ${cy + s * 34} 
                  Q ${(sx.combStart + sx.combEnd) / 2} ${cy + s * 50} 
                  ${sx.combEnd - 4} ${cy + s * 34}`}
              fill="none" stroke="oklch(0.4 0.04 30)" strokeWidth="1.5" opacity="0.75" />
            {/* Dilution holes */}
            {[0.25, 0.5, 0.75].map((t) => {
              const x = sx.combStart + (sx.combEnd - sx.combStart) * t;
              const y = cy + s * (22 + Math.sin(t * Math.PI) * 22);
              return <circle key={t} cx={x} cy={y} r="1.5" fill="oklch(0.2 0.02 30)" />;
            })}
            {/* Fuel injector */}
            <g>
              <rect x={sx.combStart - 6} y={cy + s * 28 - 2} width="10" height="4"
                fill="oklch(0.5 0.03 250)" />
              <circle cx={sx.combStart + 6} cy={cy + s * 28} r="3" fill="oklch(0.75 0.12 250)" />
              <circle cx={sx.combStart + 6} cy={cy + s * 28} r="1.2" fill="oklch(0.98 0.15 80)" />
            </g>
          </g>
        ))}

        {/* Flame */}
        <g transform={`translate(${sx.combStart + 18} ${cy})`} className="flame">
          <ellipse cx="44" cy="0" rx="68" ry="26" fill="url(#flameCore)" filter="url(#glow)" />
          <ellipse cx="34" cy="0" rx="40" ry="15" fill="oklch(0.98 0.15 85 / 0.85)" />
          <ellipse cx="22" cy="0" rx="16" ry="6" fill="oklch(1 0.05 95)" />
        </g>

        {/* HP Turbine — 2 stages, large blades */}
        {[0, 1].map((i) => {
          const x = sx.hpt + i * 20;
          const r = 42 + i * 2;
          return (
            <g key={i} className="spin-slow">
              {blade(x, cy, r, `oklch(0.7 0.2 ${45 - i * 4})`)}
            </g>
          );
        })}

        {/* LP Turbine — 4 stages, growing */}
        {[0, 1, 2, 3].map((i) => {
          const x = sx.lpt + i * 16;
          const r = 38 + i * 3;
          return (
            <g key={i} className="spin-slow">
              {blade(x, cy, r, `oklch(0.68 0.16 ${55 - i * 3})`)}
            </g>
          );
        })}

        {/* Turbine stators */}
        {[0, 1, 2].map((i) => {
          const x = sx.lpt + i * 16 + 8;
          const r = 40 + i * 3;
          return (
            <line key={i} x1={x} y1={cy - r} x2={x} y2={cy + r}
              stroke="oklch(0.5 0.05 40)" strokeWidth="1" opacity="0.65" />
          );
        })}

        {/* Nozzle plug (centerbody) */}
        <path
          d={`M ${sx.nozStart} ${cy - 10} 
              Q ${sx.nozStart + 30} ${cy - 8} ${sx.nozExit - 30} ${cy} 
              Q ${sx.nozStart + 30} ${cy + 8} ${sx.nozStart} ${cy + 10} Z`}
          fill="oklch(0.32 0.03 30)" stroke="oklch(0.45 0.04 30)" strokeWidth="1" />
      </g>

      {/* FAN BLADES (drawn over fan cowl, visible at intake) */}
      <g transform={`translate(${sx.fan} ${cy})`}>
        {/* Spinner cone */}
        <path d={`M -22 -16 Q -10 0 -22 16 L -6 14 L -6 -14 Z`}
          fill="oklch(0.55 0.04 250)" stroke="oklch(0.3 0.02 250)" />
        {/* Blade silhouette */}
        {Array.from({ length: 18 }).map((_, i) => {
          const ang = (i / 18) * Math.PI * 2;
          const r1 = 18, r2 = 96;
          const x1 = Math.cos(ang) * r1, y1 = Math.sin(ang) * r1;
          const x2 = Math.cos(ang) * r2, y2 = Math.sin(ang) * r2;
          return (
            <g key={i} className="spin-slow">
              <path
                d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 - y2 * 0.06} ${(y1 + y2) / 2 + x2 * 0.06} ${x2} ${y2}`}
                stroke="oklch(0.78 0.06 220)" strokeWidth="3.5" strokeLinecap="round" opacity="0.85"
              />
            </g>
          );
        })}
        {/* Fan hub disc */}
        <circle r="14" fill="oklch(0.45 0.03 250)" stroke="oklch(0.25 0.02 250)" />
        <circle r="5" fill="oklch(0.7 0.03 250)" />
      </g>

      {/* Duct shell outlines */}
      <path d={fanPath} fill="none" stroke="url(#shell)" strokeWidth="2.5" />
      <path d={corePath} fill="none" stroke="url(#coreShell)" strokeWidth="2" />

      {/* Pylon stub (mount) */}
      <path d={`M ${sx.hpc - 10} ${cy - 102} L ${sx.hpc + 60} ${cy - 102} L ${sx.hpc + 50} ${cy - 124} L ${sx.hpc} ${cy - 124} Z`}
        fill="oklch(0.3 0.02 250)" stroke="oklch(0.5 0.03 250)" strokeWidth="1" />

      {/* === EXHAUST === */}
      {/* Core hot plume */}
      <g transform={`translate(${sx.nozExit} ${cy})`}>
        <path d={`M -10 -20 Q 70 -6 ${W - sx.nozExit + 20} 0 Q 70 6 -10 20 Z`}
          fill="url(#plume)" opacity={0.45 + plumeI * 0.5} className="flame" />
        <path d={`M -10 -10 Q 50 -3 ${(W - sx.nozExit) * 0.7} 0 Q 50 3 -10 10 Z`}
          fill="oklch(0.95 0.16 80 / 0.55)" className="flame" />
      </g>
      {/* Bypass cool plume (above + below) */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${sx.nozStart} ${cy + s * 76})`}>
          <path d={`M 0 -10 Q 40 -3 100 0 Q 40 3 0 10 Z`}
            fill="url(#bypassPlume)" opacity="0.7" />
        </g>
      ))}

      {/* === LABELS (callouts above) === */}
      {[
        { x: sx.fan, dy: -140, label: "FAN" },
        { x: sx.lpc + 18, dy: -132, label: "LPC" },
        { x: sx.hpc + 42, dy: -150, label: "HPC" },
        { x: (sx.combStart + sx.combEnd) / 2, dy: -118, label: "COMBUSTOR" },
        { x: sx.hpt + 10, dy: -130, label: "HPT" },
        { x: sx.lpt + 24, dy: -122, label: "LPT" },
        { x: sx.nozStart + 30, dy: -110, label: "NOZZLE" },
      ].map((c) => (
        <g key={c.label}>
          <line x1={c.x} y1={cy + c.dy + 8} x2={c.x} y2={cy - 60}
            stroke="oklch(0.55 0.03 250 / 0.6)" strokeWidth="0.75" strokeDasharray="2 2" />
          <text x={c.x} y={cy + c.dy} textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.2em", fontWeight: 500 }}>
            {c.label}
          </text>
        </g>
      ))}

      {/* Station markers (bottom) */}
      {stations.map((s) => (
        <g key={s.n}>
          <line x1={s.x} y1={cy + 102} x2={s.x} y2={cy + 130}
            stroke="oklch(0.55 0.03 250)" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx={s.x} cy={cy + 142} r="11"
            fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="1.5" />
          <text x={s.x} y={cy + 146} textAnchor="middle"
            className="fill-primary"
            style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {s.n}
          </text>
          <text x={s.x} y={cy + 168} textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 8.5, fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
            {s.name.toUpperCase()}
          </text>
          <text x={s.x} y={cy + 182} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: tempColor(s.T) }}>
            {Math.round(s.T)} K
          </text>
        </g>
      ))}

      {/* Shaft legend (top-left) */}
      <g transform="translate(20 18)">
        <g>
          <rect x="0" y="0" width="14" height="6" fill="oklch(0.42 0.03 250)" />
          <text x="20" y="6" className="fill-muted-foreground"
            style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            HP SPOOL  (HPC ↔ HPT)
          </text>
        </g>
        <g transform="translate(0 14)">
          <rect x="0" y="0" width="14" height="3" fill="oklch(0.55 0.03 220)" />
          <text x="20" y="4" className="fill-muted-foreground"
            style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            LP SPOOL  (FAN+LPC ↔ LPT)
          </text>
        </g>
      </g>

      {/* Temp legend (top-right) */}
      <g transform={`translate(${W - 180} 14)`}>
        <text x="0" y="8" className="fill-muted-foreground"
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

      {/* Flow arrow */}
      <g transform={`translate(20 ${cy})`}>
        <text x="0" y="-8" className="fill-muted-foreground"
          style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}>FLOW</text>
        <path d="M 0 0 L 28 0 M 22 -4 L 28 0 L 22 4"
          stroke="var(--color-ice)" strokeWidth="1.5" fill="none" />
      </g>

      {/* Bottom right: engine designation */}
      <text x={W - 20} y={H - 12} textAnchor="end"
        className="fill-muted-foreground"
        style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.25em", opacity: 0.6 }}>
        TWO-SPOOL HIGH-BYPASS TURBOFAN · CUTAWAY VIEW
      </text>
    </svg>
  );
}
