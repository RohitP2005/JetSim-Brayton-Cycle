import type { CycleOutputs } from "@/lib/brayton";

interface Props {
  out: CycleOutputs;
}

function tempColor(T: number) {
  const t = Math.min(1, Math.max(0, (T - 250) / 1600));
  const hue = 220 - t * 185;
  const light = 55 + t * 15;
  return `hsl(${hue} 85% ${light}%)`;
}

// Outer cowling y-coordinate as a function of x (top half).
// Mirror around y=140 for bottom. Shapes the nacelle: intake lip, fan bulge,
// core waist, turbine bulge, converging nozzle.
function cowlTop(x: number) {
  // piecewise via control points
  const pts: [number, number][] = [
    [20, 118],
    [60, 96],
    [110, 78],
    [180, 70],
    [260, 76],
    [340, 82],
    [430, 82],
    [520, 78],
    [600, 82],
    [680, 96],
    [740, 108],
    [780, 118],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return 120;
}

function nacellePath() {
  const xs: number[] = [];
  for (let x = 20; x <= 780; x += 10) xs.push(x);
  const top = xs.map((x) => `${x},${cowlTop(x).toFixed(1)}`).join(" L ");
  const bot = xs
    .slice()
    .reverse()
    .map((x) => `${x},${(280 - cowlTop(x)).toFixed(1)}`)
    .join(" L ");
  return `M ${top} L ${bot} Z`;
}

export function EngineDiagram({ out }: Props) {
  const stations = [
    { x: 60, T: 288, label: "1 · Intake" },
    { x: 200, T: out.T2, label: "2 · Compressor" },
    { x: 380, T: (out.T2 + out.T4) / 2 + 400, label: "3 · Combustor" },
    { x: 540, T: out.T4, label: "4 · Turbine" },
    { x: 700, T: out.T5, label: "5 · Nozzle" },
  ];

  // Compressor stages: increasing pressure → shorter blades downstream
  const compressorStages = [
    { x: 150, h: 56 },
    { x: 175, h: 50 },
    { x: 200, h: 44 },
    { x: 225, h: 39 },
    { x: 250, h: 34 },
    { x: 275, h: 30 },
  ];

  // Turbine stages: expanding gas → longer blades downstream
  const turbineStages = [
    { x: 500, h: 36 },
    { x: 530, h: 44 },
    { x: 560, h: 52 },
    { x: 590, h: 60 },
  ];

  return (
    <svg viewBox="0 0 800 280" className="w-full h-auto">
      <defs>
        <linearGradient id="duct" x1="0" x2="1">
          {stations.map((s, i) => (
            <stop key={i} offset={`${(s.x / 800) * 100}%`} stopColor={tempColor(s.T)} />
          ))}
        </linearGradient>
        <radialGradient id="flameGrad" cx="0.3" cy="0.5" r="0.7">
          <stop offset="0%" stopColor="oklch(0.97 0.18 90)" />
          <stop offset="40%" stopColor="oklch(0.82 0.22 55)" />
          <stop offset="80%" stopColor="oklch(0.62 0.22 35 / 0.6)" />
          <stop offset="100%" stopColor="oklch(0.5 0.2 25 / 0)" />
        </radialGradient>
        <linearGradient id="bladeCool" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.08 220)" />
          <stop offset="100%" stopColor="oklch(0.55 0.12 230)" />
        </linearGradient>
        <linearGradient id="bladeHot" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.15 60)" />
          <stop offset="100%" stopColor="oklch(0.55 0.18 35)" />
        </linearGradient>
        <linearGradient id="shaftGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.45 0.02 250)" />
          <stop offset="50%" stopColor="oklch(0.7 0.03 250)" />
          <stop offset="100%" stopColor="oklch(0.45 0.02 250)" />
        </linearGradient>
      </defs>

      {/* Hot gas path fill (inside nacelle) */}
      <path d={nacellePath()} fill="url(#duct)" opacity="0.22" />

      {/* Nacelle outline */}
      <path
        d={nacellePath()}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />

      {/* Section dividers */}
      {[130, 295, 470, 615, 720].map((x) => (
        <line
          key={x}
          x1={x}
          y1={cowlTop(x)}
          x2={x}
          y2={280 - cowlTop(x)}
          stroke="var(--color-border)"
          strokeDasharray="2 3"
          strokeWidth="1"
          opacity="0.6"
        />
      ))}

      {/* Intake flow lines */}
      {[105, 125, 140, 155, 175].map((y, i) => (
        <line
          key={y}
          x1={0}
          y1={y}
          x2={50}
          y2={y}
          stroke="var(--color-ice)"
          strokeWidth="1.2"
          className="flow-line"
          opacity="0.55"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}

      {/* === COMPRESSOR === */}
      <g>
        {/* Stator rings (thin grey lines between stages) */}
        {compressorStages.map((s, i) => (
          <g key={`cs-${i}`}>
            <rect
              x={s.x - 1.5}
              y={140 - s.h}
              width={3}
              height={s.h * 2}
              fill="oklch(0.4 0.02 250)"
              opacity="0.5"
            />
          </g>
        ))}
        {/* Rotor blades (spinning) */}
        {compressorStages.map((s, i) => (
          <g key={`cr-${i}`} transform={`translate(${s.x + 10} 140)`} className="spin-slow">
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <rect
                key={deg}
                x={-1.5}
                y={-s.h}
                width={3}
                height={s.h * 2}
                fill="url(#bladeCool)"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="6" fill="oklch(0.5 0.02 250)" />
          </g>
        ))}
      </g>

      {/* === COMBUSTOR === */}
      <g>
        {/* Inner liner */}
        <rect
          x={310}
          y={110}
          width={150}
          height={60}
          rx={10}
          fill="oklch(0.25 0.02 40)"
          stroke="oklch(0.6 0.08 40)"
          strokeWidth="1.2"
          opacity="0.7"
        />
        {/* Fuel injectors */}
        {[325, 355, 385, 415, 445].map((x) => (
          <g key={x}>
            <line x1={x} y1={108} x2={x} y2={120} stroke="oklch(0.7 0.05 250)" strokeWidth="1.5" />
            <circle cx={x} cy={107} r={2} fill="oklch(0.8 0.05 250)" />
          </g>
        ))}
        {/* Flames */}
        {[330, 370, 410, 450].map((x, i) => (
          <ellipse
            key={x}
            cx={x}
            cy={140}
            rx={32}
            ry={22}
            fill="url(#flameGrad)"
            className="flame"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </g>

      {/* === TURBINE === */}
      <g>
        {turbineStages.map((s, i) => (
          <rect
            key={`ts-${i}`}
            x={s.x - 1.5}
            y={140 - s.h}
            width={3}
            height={s.h * 2}
            fill="oklch(0.35 0.05 40)"
            opacity="0.6"
          />
        ))}
        {turbineStages.map((s, i) => (
          <g key={`tr-${i}`} transform={`translate(${s.x + 12} 140)`} className="spin-slow">
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <rect
                key={deg}
                x={-2}
                y={-s.h}
                width={4}
                height={s.h * 2}
                fill="url(#bladeHot)"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="7" fill="oklch(0.45 0.08 40)" />
          </g>
        ))}
      </g>

      {/* Shaft connecting compressor and turbine */}
      <rect x={130} y={137} width={480} height={6} fill="url(#shaftGrad)" rx={2} />

      {/* === NOZZLE === */}
      <g>
        {/* Convergent inner cone */}
        <path
          d="M 615 110 L 720 128 L 720 152 L 615 170 Z"
          fill="oklch(0.3 0.02 40)"
          opacity="0.5"
          stroke="oklch(0.5 0.05 40)"
          strokeWidth="1"
        />
        {/* Exhaust plume */}
        <path
          d="M 720 125 Q 770 135 800 140 Q 770 145 720 155 Z"
          fill="url(#flameGrad)"
          opacity={Math.min(1, out.v5 / 900)}
          className="flame"
        />
        {/* Speed-line streaks */}
        {[130, 140, 150].map((y, i) => (
          <line
            key={y}
            x1={725}
            y1={y}
            x2={795}
            y2={y}
            stroke="oklch(0.9 0.15 60)"
            strokeWidth="1"
            opacity={Math.min(0.7, out.v5 / 1200)}
            className="flow-line"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </g>

      {/* Section labels (top) */}
      {[
        { x: 75, label: "INTAKE" },
        { x: 212, label: "COMPRESSOR" },
        { x: 382, label: "COMBUSTOR" },
        { x: 542, label: "TURBINE" },
        { x: 667, label: "NOZZLE" },
      ].map((s) => (
        <text
          key={s.label}
          x={s.x}
          y={50}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 9, letterSpacing: 1.5, fontFamily: "var(--font-mono)" }}
        >
          {s.label}
        </text>
      ))}

      {/* Station markers (bottom) */}
      {stations.map((s) => (
        <g key={s.label}>
          <line
            x1={s.x}
            y1={215}
            x2={s.x}
            y2={228}
            stroke="var(--color-muted-foreground)"
            strokeWidth="1"
          />
          <text
            x={s.x}
            y={244}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
          >
            {s.label}
          </text>
          <text
            x={s.x}
            y={260}
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            {Math.round(s.T)} K
          </text>
        </g>
      ))}
    </svg>
  );
}
