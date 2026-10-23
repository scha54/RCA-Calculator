import type { Range, Scenario } from "./model";
export const outcomeGroups = {
  transport: "Freight transport",
  care: "Washing, drying & ironing",
  production: "Production & circular processing",
  social: "Employment & worker outcomes",
} as const;
export type OutcomeGroup = keyof typeof outcomeGroups;
type Field = {
  id: string;
  group: OutcomeGroup;
  label: string;
  unit: string;
  max: number;
};
export const outcomeFields: Field[] = [
  [
    "baselineTonneKm",
    "transport",
    "Baseline annual freight activity",
    "tonne-km/year",
    1e12,
  ],
  [
    "interventionTonneKm",
    "transport",
    "Intervention annual freight activity",
    "tonne-km/year",
    1e12,
  ],
  [
    "baselineTransportCo2",
    "transport",
    "Baseline freight emission factor",
    "kg CO₂e/tonne-km",
    100,
  ],
  [
    "interventionTransportCo2",
    "transport",
    "Intervention freight emission factor",
    "kg CO₂e/tonne-km",
    100,
  ],
  [
    "baselineTransportEnergy",
    "transport",
    "Baseline freight energy factor",
    "kWh/tonne-km",
    100,
  ],
  [
    "interventionTransportEnergy",
    "transport",
    "Intervention freight energy factor",
    "kWh/tonne-km",
    100,
  ],
  [
    "baselineWashCycles",
    "care",
    "Baseline annual wash loads",
    "loads/year",
    1e12,
  ],
  [
    "interventionWashCycles",
    "care",
    "Intervention annual wash loads",
    "loads/year",
    1e12,
  ],
  ["baselineWashKwh", "care", "Baseline electricity per wash", "kWh/load", 100],
  [
    "interventionWashKwh",
    "care",
    "Intervention electricity per wash",
    "kWh/load",
    100,
  ],
  [
    "baselineWaterLitres",
    "care",
    "Baseline water per wash",
    "litres/load",
    10000,
  ],
  [
    "interventionWaterLitres",
    "care",
    "Intervention water per wash",
    "litres/load",
    10000,
  ],
  [
    "baselineDryCycles",
    "care",
    "Baseline annual dryer loads",
    "loads/year",
    1e12,
  ],
  [
    "interventionDryCycles",
    "care",
    "Intervention annual dryer loads",
    "loads/year",
    1e12,
  ],
  [
    "baselineDryKwh",
    "care",
    "Baseline electricity per dryer load",
    "kWh/load",
    100,
  ],
  [
    "interventionDryKwh",
    "care",
    "Intervention electricity per dryer load",
    "kWh/load",
    100,
  ],
  ["baselineIronHours", "care", "Baseline annual ironing", "hours/year", 1e12],
  [
    "interventionIronHours",
    "care",
    "Intervention annual ironing",
    "hours/year",
    1e12,
  ],
  ["baselineIronKw", "care", "Baseline iron power", "kW", 100],
  ["interventionIronKw", "care", "Intervention iron power", "kW", 100],
  [
    "baselineGridCo2",
    "care",
    "Baseline grid emission factor",
    "kg CO₂e/kWh",
    10,
  ],
  [
    "interventionGridCo2",
    "care",
    "Intervention grid emission factor",
    "kg CO₂e/kWh",
    10,
  ],
  [
    "materialCo2",
    "production",
    "Avoided virgin production emission factor",
    "kg CO₂e/kg textile",
    1000,
  ],
  [
    "materialEnergy",
    "production",
    "Avoided virgin production energy factor",
    "kWh/kg textile",
    10000,
  ],
  [
    "circularProcessKwh",
    "production",
    "Additional circular processing electricity",
    "kWh/year",
    1e12,
  ],
  [
    "processGridCo2",
    "production",
    "Circular processing grid emission factor",
    "kg CO₂e/kWh",
    10,
  ],
  [
    "otherProcessCo2",
    "production",
    "Additional non-electric process emissions",
    "kg CO₂e/year",
    1e12,
  ],
  ["jobsCreated", "social", "Jobs created", "FTE", 1e9],
  ["jobsDisplaced", "social", "Jobs displaced", "FTE", 1e9],
  [
    "trainingHours",
    "social",
    "Total training delivered",
    "person-hours/year",
    1e12,
  ],
  ["workersAffected", "social", "Workers affected", "people", 1e9],
  [
    "baselinePaidHours",
    "social",
    "Baseline aggregate paid work",
    "person-hours/year",
    1e12,
  ],
  [
    "interventionPaidHours",
    "social",
    "Intervention aggregate paid work",
    "person-hours/year",
    1e12,
  ],
  [
    "baselineHourlyWage",
    "social",
    "Baseline average hourly wage",
    "currency/hour",
    1e6,
  ],
  [
    "interventionHourlyWage",
    "social",
    "Intervention average hourly wage",
    "currency/hour",
    1e6,
  ],
].map(([id, group, label, unit, max]) => ({
  id: id as string,
  group: group as OutcomeGroup,
  label: label as string,
  unit: unit as string,
  max: max as number,
}));
export interface OutcomeInputs {
  enabled: Record<OutcomeGroup, boolean>;
  sources: Record<OutcomeGroup, string>;
  // Absolute activity/factor band for interval bounds; not a statistical confidence interval.
  uncertainty: number;
  currency: string;
  values: Record<string, number>;
}
export function emptyOutcomes(): OutcomeInputs {
  return {
    enabled: {
      transport: false,
      care: false,
      production: false,
      social: false,
    },
    sources: { transport: "", care: "", production: "", social: "" },
    uncertainty: 0.25,
    currency: "GBP",
    values: Object.fromEntries(outcomeFields.map((f) => [f.id, 0])),
  };
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validateOutcomes(data: unknown): string[] {
  if (
    !object(data) ||
    !object(data.enabled) ||
    !object(data.sources) ||
    !object(data.values)
  )
    return ["Invalid additional outcome model."];
  const errors: string[] = [];
  if (
    typeof data.uncertainty !== "number" ||
    !Number.isFinite(data.uncertainty) ||
    data.uncertainty < 0 ||
    data.uncertainty > 1
  )
    errors.push("Outcome uncertainty must be between 0 and 1.");
  if (typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency))
    errors.push("Use a three-letter currency code.");
  for (const group of Object.keys(outcomeGroups) as OutcomeGroup[]) {
    if (
      typeof data.enabled[group] !== "boolean" ||
      typeof data.sources[group] !== "string" ||
      (data.sources[group] as string).length > 20000
    )
      errors.push(`Invalid ${group} model configuration.`);
    // Evidence is checked at reporting time so partially completed drafts remain usable.
  }
  for (const f of outcomeFields) {
    const n = data.values[f.id];
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > f.max)
      errors.push(`${f.label}: enter a number from 0 to ${f.max}.`);
  }
  return errors;
}
export function outcomeReportErrors(s: Scenario): string[] {
  const o = s.outcomes;
  if (!o) return [];
  return (Object.keys(outcomeGroups) as OutcomeGroup[])
    .filter((g) => o.enabled[g] && !o.sources[g].trim())
    .map((g) => `Document sources and boundaries for ${outcomeGroups[g]}.`);
}
export type OutcomeMetric = {
  id: string;
  label: string;
  unit: string;
  group: OutcomeGroup;
  direction: "saved" | "change" | "level";
  range: Range;
};
// Conservative interval arithmetic: independently vary every nonnegative input/factor.
export function calculateOutcomes(
  s: Scenario,
  material: Range,
): OutcomeMetric[] {
  if (!s.outcomes) return [];
  const o = s.outcomes,
    errors = validateOutcomes(o);
  if (errors.length) throw Error(errors.join(" "));
  const b = o.uncertainty;
  type I = { low: number; central: number; high: number };
  const input = (key: string): I => ({
    low: o.values[key] * (1 - b),
    central: o.values[key],
    high: o.values[key] * (1 + b),
  });
  const constant = (n: number): I => ({ low: n, central: n, high: n });
  const mul = (a: I, c: I): I => ({
    low: a.low * c.low,
    central: a.central * c.central,
    high: a.high * c.high,
  });
  const add = (...a: I[]): I => ({
    low: a.reduce((v, x) => v + x.low, 0),
    central: a.reduce((v, x) => v + x.central, 0),
    high: a.reduce((v, x) => v + x.high, 0),
  });
  const sub = (a: I, c: I): I => ({
    low: a.low - c.high,
    central: a.central - c.central,
    high: a.high - c.low,
  });
  const product = (a: string, c: string) => mul(input(a), input(c));
  const result: OutcomeMetric[] = [];
  const emit = (
    group: OutcomeGroup,
    id: string,
    label: string,
    unit: string,
    range: I,
    direction: OutcomeMetric["direction"] = "saved",
  ) => result.push({ group, id, label, unit, range, direction });
  const energy: I[] = [],
    carbon: I[] = [];
  if (o.enabled.transport) {
    const e = sub(
      product("baselineTonneKm", "baselineTransportEnergy"),
      product("interventionTonneKm", "interventionTransportEnergy"),
    );
    const c = sub(
      product("baselineTonneKm", "baselineTransportCo2"),
      product("interventionTonneKm", "interventionTransportCo2"),
    );
    emit(
      "transport",
      "freight",
      "Freight activity avoided",
      "tonne-km/year",
      sub(input("baselineTonneKm"), input("interventionTonneKm")),
    );
    emit(
      "transport",
      "transportEnergy",
      "Transport energy saved",
      "kWh/year",
      e,
    );
    emit(
      "transport",
      "transportCarbon",
      "Transport emissions avoided",
      "kg CO₂e/year",
      c,
    );
    energy.push(e);
    carbon.push(c);
  }
  if (o.enabled.care) {
    const care = (prefix: string) =>
      add(
        product(prefix + "WashCycles", prefix + "WashKwh"),
        product(prefix + "DryCycles", prefix + "DryKwh"),
        product(prefix + "IronHours", prefix + "IronKw"),
      );
    const before = care("baseline"),
      after = care("intervention"),
      e = sub(before, after),
      c = sub(
        mul(before, input("baselineGridCo2")),
        mul(after, input("interventionGridCo2")),
      );
    emit("care", "careEnergy", "Care electricity saved", "kWh/year", e);
    emit("care", "careCarbon", "Care emissions avoided", "kg CO₂e/year", c);
    emit(
      "care",
      "water",
      "Wash water saved",
      "litres/year",
      sub(
        product("baselineWashCycles", "baselineWaterLitres"),
        product("interventionWashCycles", "interventionWaterLitres"),
      ),
    );
    energy.push(e);
    carbon.push(c);
  }
  if (o.enabled.production) {
    // Credit at most baseline virgin demand. Prevent >100% material credits in the carbon extension.
    const baseline =
      (s.inputs.itemsSold *
        s.inputs.avgWeightKg *
        (1 -
          s.inputs.baselineCollectionRate * s.inputs.baselineRecyclingYield)) /
      1000;
    const credited = {
      low: Math.min(baseline, material.low) * 1000,
      central: Math.min(baseline, material.central) * 1000,
      high: Math.min(baseline, material.high) * 1000,
    };
    const e = sub(
      mul(credited, input("materialEnergy")),
      input("circularProcessKwh"),
    );
    const c = sub(
      mul(credited, input("materialCo2")),
      add(
        product("circularProcessKwh", "processGridCo2"),
        input("otherProcessCo2"),
      ),
    );
    emit(
      "production",
      "productionEnergy",
      "Production energy saved, net of processing",
      "kWh/year",
      e,
    );
    emit(
      "production",
      "productionCarbon",
      "Production emissions avoided, net of processing",
      "kg CO₂e/year",
      c,
    );
    energy.push(e);
    carbon.push(c);
  }
  // Totals cover enabled environmental modules only, and preserve negative impacts.
  if (energy.length) {
    emit(
      "production",
      "totalEnergy",
      "Total energy saved (enabled modules)",
      "kWh/year",
      add(...energy),
    );
    emit(
      "production",
      "totalCarbon",
      "Total emissions avoided (enabled modules)",
      "kg CO₂e/year",
      add(...carbon),
    );
  }
  if (o.enabled.social) {
    emit(
      "social",
      "jobs",
      "Net employment change",
      "FTE",
      sub(input("jobsCreated"), input("jobsDisplaced")),
      "change",
    );
    emit(
      "social",
      "training",
      "Training delivered",
      "person-hours/year",
      input("trainingHours"),
      "level",
    );
    emit(
      "social",
      "workers",
      "Workers affected",
      "people",
      input("workersAffected"),
      "level",
    );
    emit(
      "social",
      "income",
      "Aggregate annual wage change",
      o.currency + "/year",
      sub(
        product("interventionPaidHours", "interventionHourlyWage"),
        product("baselinePaidHours", "baselineHourlyWage"),
      ),
      "change",
    );
  }
  return result;
}
