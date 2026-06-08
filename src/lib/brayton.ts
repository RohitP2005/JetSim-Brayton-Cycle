// Ideal Brayton cycle for a turbojet — air-standard analysis.
// Stations: 1 inlet, 2 compressor exit, 3 turbine inlet (after combustor), 4 turbine exit, 5 nozzle exit.

export interface CycleInputs {
  pressureRatio: number;   // p2/p1
  T1: number;              // ambient temp, K
  T3: number;              // turbine inlet temp, K
  M0: number;              // flight Mach
  etaC: number;            // compressor isentropic eff
  etaT: number;            // turbine isentropic eff
  etaN: number;            // nozzle eff
  mdot: number;            // kg/s air mass flow
}

export interface CycleOutputs {
  T2: number; T4: number; T5: number;
  v0: number; v5: number;
  specificThrust: number;  // N per kg/s
  thrust: number;          // N
  thermalEff: number;
  propulsiveEff: number;
  overallEff: number;
  qIn: number;             // J/kg
  wNet: number;            // J/kg
  tsfc: number;            // kg/(N·s)
}

const GAMMA = 1.4;
const CP = 1004;          // J/(kg·K)
const R = 287;
const LHV = 43e6;         // J/kg fuel

export function simulate(i: CycleInputs): CycleOutputs {
  const { pressureRatio: pr, T1, T3, M0, etaC, etaT, etaN, mdot } = i;
  const a0 = Math.sqrt(GAMMA * R * T1);
  const v0 = M0 * a0;

  // Compressor
  const T2s = T1 * Math.pow(pr, (GAMMA - 1) / GAMMA);
  const T2 = T1 + (T2s - T1) / etaC;
  const wC = CP * (T2 - T1);

  // Combustor heat addition
  const qIn = CP * (T3 - T2);

  // Turbine drives compressor: wT = wC
  const T4 = T3 - wC / CP;
  // turbine pressure ratio via isentropic eff
  const T4s = T3 - (T3 - T4) / etaT;
  const turbPR = Math.pow(T4s / T3, GAMMA / (GAMMA - 1)); // p4/p3 < 1
  const p3_p1 = pr; // combustor approx isobaric
  const p4_p1 = p3_p1 * turbPR;

  // Nozzle expands to p1 (ambient)
  const T5s = T4 * Math.pow(1 / p4_p1, (GAMMA - 1) / GAMMA);
  const T5 = T4 - etaN * (T4 - T5s);
  const v5 = Math.sqrt(Math.max(0, 2 * CP * (T4 - T5)));

  const specificThrust = v5 - v0;
  const thrust = mdot * specificThrust;
  const wNet = 0.5 * (v5 * v5 - v0 * v0);

  const thermalEff = Math.max(0, wNet / qIn);
  const propulsiveEff = thrust > 0
    ? (2 * v0) / (v0 + v5 || 1)
    : 0;
  const overallEff = thermalEff * propulsiveEff;

  const fuelFrac = qIn / LHV;
  const tsfc = thrust > 0 ? (fuelFrac * mdot) / thrust : 0;

  return { T2, T4, T5, v0, v5, specificThrust, thrust, thermalEff, propulsiveEff, overallEff, qIn, wNet, tsfc };
}
