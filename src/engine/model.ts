import parameters from "../../data/parameters.json";
import questions from "../../data/questions.json";
import benchmarks from "../../data/benchmarks.json";
import bands from "../../data/confidence.json";
import examples from "../../data/examples.json";
import {
  validateOutcomes,
  outcomeReportErrors,
  type OutcomeInputs,
} from "./outcomes";
export { parameters, questions, benchmarks, bands, examples };
export type Confidence = keyof typeof bands;
export type Inputs = Record<string, number>;
export type Range = { central: number; low: number; high: number };
export interface Scenario {
  version: 1;
  name: string;
  description: string;
  region: "UK" | "EU" | "US";
  mode: "conservative" | "independent";
  inputs: Inputs;
  confidence: Record<string, Confidence>;
  bands: Record<Confidence, number>;
  checklist: number[];
  notes: Array<{ text: string; risk: "low" | "medium" | "high" }>;
  confirmed: { substitutionRate: boolean; reboundFactor: boolean };
  baselineConfidence?: Confidence;
  outcomes?: OutcomeInputs;
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const levels = Object.keys(bands);
export function fresh(): Scenario {
  return {
    version: 1,
    name: "Untitled assessment",
    description: "",
    region: "UK",
    mode: "conservative",
    inputs: Object.fromEntries(
      parameters.map((p) => [p.id, p.id === "avgWeightKg" ? p.default : p.min]),
    ),
    confidence: Object.fromEntries(questions.map((q) => [q.id, "low"])),
    baselineConfidence: "low",
    bands: { ...bands },
    checklist: [0, 0, 0],
    notes: Array.from({ length: 6 }, () => ({ text: "", risk: "medium" })),
    confirmed: { substitutionRate: false, reboundFactor: false },
  };
}
// Validate unknown data before treating it as a Scenario. Never dereference unvalidated entries.
export function validate(value: unknown): string[] {
  if (!record(value))
    return ["Please choose a valid RCA scenario (version 1)."];
  const s = value,
    errors: string[] = [];
  if (
    s.version !== 1 ||
    typeof s.name !== "string" ||
    !s.name.trim() ||
    typeof s.description !== "string" ||
    typeof s.region !== "string" ||
    !["UK", "EU", "US"].includes(s.region) ||
    typeof s.mode !== "string" ||
    !["conservative", "independent"].includes(s.mode)
  )
    errors.push("Please choose a valid RCA scenario (version 1) with a name.");
  if (typeof s.name === "string" && s.name.length > 200)
    errors.push("Scenario names must be at most 200 characters.");
  if (typeof s.description === "string" && s.description.length > 20000)
    errors.push("Scenario descriptions must be at most 20000 characters.");
  const inputs = record(s.inputs) ? s.inputs : {};
  for (const p of parameters) {
    const v = inputs[p.id];
    if (typeof v !== "number" || !Number.isFinite(v) || v < p.min || v > p.max)
      errors.push(`${p.label}: enter a number between ${p.min} and ${p.max}.`);
  }
  const confidence = record(s.confidence) ? s.confidence : {};
  for (const q of questions)
    if (
      typeof confidence[q.id] !== "string" ||
      !levels.includes(confidence[q.id] as string)
    )
      errors.push(`Choose confidence for ${q.effect} / ${q.column}.`);
  if (
    s.baselineConfidence !== undefined &&
    (typeof s.baselineConfidence !== "string" ||
      !levels.includes(s.baselineConfidence))
  )
    errors.push("Choose valid baseline input confidence.");
  const b = record(s.bands) ? s.bands : {};
  for (const k of levels)
    if (
      typeof b[k] !== "number" ||
      !Number.isFinite(b[k]) ||
      (b[k] as number) < 0 ||
      (b[k] as number) > 1
    )
      errors.push("Uncertainty bands must be between 0 and 1.");
  if (
    typeof b.high === "number" &&
    typeof b.medium === "number" &&
    typeof b.low === "number" &&
    !(b.high <= b.medium && b.medium <= b.low)
  )
    errors.push("Confidence bands must satisfy high ≤ medium ≤ low.");
  if (
    !Array.isArray(s.checklist) ||
    s.checklist.length !== 3 ||
    s.checklist.some((v) => ![0, 0.5, 1].includes(v))
  )
    errors.push("Please complete the care checklist.");
  if (
    !Array.isArray(s.notes) ||
    s.notes.length !== 6 ||
    s.notes.some(
      (n) =>
        !record(n) ||
        typeof n.text !== "string" ||
        n.text.length > 20000 ||
        typeof n.risk !== "string" ||
        !["low", "medium", "high"].includes(n.risk),
    )
  )
    errors.push("Please provide valid Systems notes.");
  if (
    !record(s.confirmed) ||
    typeof s.confirmed.substitutionRate !== "boolean" ||
    typeof s.confirmed.reboundFactor !== "boolean"
  )
    errors.push("Please provide assumption confirmation flags.");
  if (s.outcomes !== undefined) errors.push(...validateOutcomes(s.outcomes));
  return errors;
}
export function reportErrors(s: Scenario): string[] {
  const errors = validate(s);
  if (!s.confirmed?.substitutionRate)
    errors.push("Review and confirm the substitution assumption in Slowing.");
  if (!s.confirmed?.reboundFactor)
    errors.push("Review and confirm the rebound assumption in Systems.");
  if (!errors.length) errors.push(...outcomeReportErrors(s));
  return errors;
}
export function assertReportReady(s: Scenario): void {
  const errors = reportErrors(s);
  if (errors.length) throw Error(errors.join(" "));
}
export const MAX_SCENARIO_BYTES = 1024 * 1024;
export function parseScenario(text: string): Scenario {
  if (new TextEncoder().encode(text).byteLength > MAX_SCENARIO_BYTES)
    throw Error("Scenario files must be no larger than 1 MB.");
  let s: unknown;
  try {
    s = JSON.parse(text);
  } catch {
    throw Error("This file is not valid JSON.");
  }
  const errors = validate(s);
  if (errors.length) throw Error(errors.join(" "));
  return {
    ...(s as Scenario),
    baselineConfidence: (s as Scenario).baselineConfidence ?? "medium",
  };
}
export function restoreScenarios(text: string | null): {
  scenarios: Scenario[];
  rejected: number;
} {
  if (!text) return { scenarios: [], rejected: 0 };
  try {
    const values: unknown = JSON.parse(text);
    if (!Array.isArray(values)) return { scenarios: [], rejected: 1 };
    const scenarios: Scenario[] = [];
    let rejected = 0;
    for (const value of values) {
      try {
        scenarios.push(parseScenario(JSON.stringify(value)));
      } catch {
        rejected++;
      }
    }
    return { scenarios, rejected };
  } catch {
    return { scenarios: [], rejected: 1 };
  }
}
