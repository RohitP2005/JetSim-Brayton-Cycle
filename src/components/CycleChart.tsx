import type { CycleOutputs } from "@/lib/brayton";

interface Props {
  T1: number;
  T3: number;
  pr: number;
  out: CycleOutputs;
}

// T-s diagram of the Brayton cycle (qualitative).
export function CycleChart({ T1, T3, pr, out }: Props) {
  const w = 360, h = 240, pad = 36;
  const Tmax = Math.max(T3, out.T4) * 1.05;
  const Tmin = T1 * 0.9;

  // entropy proxy: ds = cp ln(T/T0) - R ln(p/p0). Use normalized values.
  const cp = 1004, R = 287;
  const s = (T: number, pRel: number) => cp * Math.log(T / T1) - R * Math.log(pRel);

  const s1 = s(T1, 1);
  const s2 = s(out.T2, pr);
  const s3 = s(T3, pr);
  const s4 = s(out.T4, out.T4 / out.T5 ? pr * Math.pow(out.T5 / out.T4, 1.4 / 0.4) : 1);
  const s5 = s(out.T5, 1);

  const sAll = [s1, s2, s3, s4, s5];
  const sMin = Math.min(...sAll) - 30;
  const sMax = Math.max(...sAll) + 30;

  const X = (sv: number) => pad + ((sv - sMin) / (sMax - sMin)) * (w - 2 * pad);
  const Y = (T: number) => h - pad - ((T - Tmin) / (Tmax - Tmin)) * (h - 2 * pad);

  const pts = [
    { s: s1, T: T1, label: "1" },
    { s: s2, T: out.T2, label: "2" },
    { s: s3, T: T3, label: "3" },
    { s: s4, T: out.T4, label: "4" },
    { s: s5, T: out.T5, label: "5" },
  ];

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${X(p.s)} ${Y(p.T)}`).join(" ") +
    ` L ${X(s1)} ${Y(T1)}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {/* axes */}
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--color-border)" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--color-border)" />
      <text x={w - pad} y={h - pad + 22} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>entropy →</text>
      <text x={pad - 6} y={pad + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>T(K)</text>

      <path d={path} fill="oklch(0.78 0.18 60 / 0.12)" stroke="var(--color-primary)" strokeWidth="2" />

      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={X(p.s)} cy={Y(p.T)} r="4" fill="var(--color-primary)" />
          <text x={X(p.s) + 8} y={Y(p.T) - 6} className="fill-foreground" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
