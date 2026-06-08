import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { simulate } from "@/lib/brayton";
import { EngineDiagram } from "@/components/EngineDiagram";
import { CycleChart } from "@/components/CycleChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turbojet Cycle Lab — Brayton Simulator" },
      { name: "description", content: "Interactive jet engine thermodynamic cycle simulator. Tune pressure ratio and turbine inlet temperature to see thrust and efficiency." },
    ],
  }),
  component: Index,
});

interface SliderProps {
  label: string; unit: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; hint?: string;
}
function Slider({ label, unit, min, max, step, value, onChange, hint }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
        <span className="font-mono text-sm text-primary">{value.toFixed(step < 1 ? 2 : 0)} <span className="text-muted-foreground">{unit}</span></span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
      {hint && <p className="text-[10px] text-muted-foreground/70 font-mono">{hint}</p>}
    </div>
  );
}

function Metric({ label, value, unit, big, accent }: { label: string; value: string; unit: string; big?: boolean; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono ${big ? "text-3xl" : "text-xl"} ${accent ? "text-primary" : "text-foreground"}`}>
        {value}<span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function Index() {
  const [pr, setPr] = useState(20);
  const [T1, setT1] = useState(288);
  const [T3, setT3] = useState(1500);
  const [M0, setM0] = useState(0.8);
  const [etaC, setEtaC] = useState(0.88);
  const [etaT, setEtaT] = useState(0.9);
  const [mdot, setMdot] = useState(50);

  const out = useMemo(() => simulate({
    pressureRatio: pr, T1, T3, M0, etaC, etaT, etaN: 0.98, mdot,
  }), [pr, T1, T3, M0, etaC, etaT, mdot]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">
            <span className="inline-block w-8 h-px bg-primary" />
            Turbojet Cycle Lab
          </div>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
            Brayton Cycle <span className="text-primary">Simulator</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Compressor → combustor → turbine → nozzle. Tune the cycle and watch thrust, thermal & propulsive efficiency respond in real time.
          </p>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed text-right">
          ideal gas · γ=1.4 · cp=1004 J/kg·K<br/>
          air-standard analysis
        </div>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Controls */}
        <aside className="space-y-5 rounded-2xl border border-border bg-card/30 backdrop-blur p-5 h-fit">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Inputs</h2>
          <Slider label="Pressure Ratio" unit="" min={2} max={50} step={0.5} value={pr} onChange={setPr} hint="π_c = p₂/p₁" />
          <Slider label="Ambient Temp" unit="K" min={216} max={320} step={1} value={T1} onChange={setT1} hint="T₁" />
          <Slider label="Turbine Inlet Temp" unit="K" min={900} max={2000} step={10} value={T3} onChange={setT3} hint="T₃ (TIT)" />
          <Slider label="Flight Mach" unit="M" min={0} max={2.5} step={0.05} value={M0} onChange={setM0} />
          <Slider label="Mass Flow" unit="kg/s" min={5} max={200} step={1} value={mdot} onChange={setMdot} />
          <div className="pt-2 border-t border-border space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Component Efficiency</h3>
            <Slider label="Compressor η" unit="" min={0.6} max={1} step={0.01} value={etaC} onChange={setEtaC} />
            <Slider label="Turbine η" unit="" min={0.6} max={1} step={0.01} value={etaT} onChange={setEtaT} />
          </div>
        </aside>

        {/* Visualization + metrics */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card/30 backdrop-blur p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Engine Schematic</h2>
              <span className="font-mono text-[10px] text-muted-foreground">station temperatures</span>
            </div>
            <EngineDiagram out={out} T1={T1} T3={T3} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Metric label="Thrust" value={(out.thrust / 1000).toFixed(2)} unit="kN" big accent />
            <Metric label="Overall Efficiency" value={(out.overallEff * 100).toFixed(1)} unit="%" big accent />
            <Metric label="Thermal η" value={(out.thermalEff * 100).toFixed(1)} unit="%" />
            <Metric label="Propulsive η" value={(out.propulsiveEff * 100).toFixed(1)} unit="%" />
            <Metric label="Exhaust Velocity" value={out.v5.toFixed(0)} unit="m/s" />
            <Metric label="Specific Thrust" value={out.specificThrust.toFixed(0)} unit="N·s/kg" />
            <Metric label="TSFC" value={(out.tsfc * 1e6).toFixed(1)} unit="mg/N·s" />
            <Metric label="Heat Added" value={(out.qIn / 1000).toFixed(0)} unit="kJ/kg" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 rounded-2xl border border-border bg-card/30 backdrop-blur p-5">
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">T–s Diagram</h2>
              <CycleChart T1={T1} T3={T3} pr={pr} out={out} />
            </div>
            <div className="text-sm text-muted-foreground space-y-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cycle Stations</h2>
              <ul className="font-mono text-xs space-y-1.5">
                <li><span className="text-primary">1→2</span> Compressor: adiabatic compression, T rises to {out.T2.toFixed(0)} K</li>
                <li><span className="text-primary">2→3</span> Combustor: isobaric heat addition to T₃ = {T3} K</li>
                <li><span className="text-primary">3→4</span> Turbine: extracts work to drive compressor, T = {out.T4.toFixed(0)} K</li>
                <li><span className="text-primary">4→5</span> Nozzle: expansion to ambient, exit T = {out.T5.toFixed(0)} K</li>
              </ul>
              <p className="text-xs leading-relaxed pt-2 border-t border-border">
                Thrust = ṁ(v₅ − v₀). Increasing TIT or pressure ratio raises thermal efficiency,
                but real engines are bounded by turbine material limits (~1700 K without cooling).
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 text-center font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase">
        Air-Standard Brayton Cycle · Educational Model
      </footer>
    </main>
  );
}
