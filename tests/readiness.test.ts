import { readScenarioFromFile } from "../src/export/json";
import { describe, it, expect, vi } from "vitest";
import {
  fresh,
  parseScenario,
  validate,
  restoreScenarios,
  reportErrors,
  examples,
  parameters,
  type Scenario,
} from "../src/engine/model";
import { calculate, sensitivity, evaluate } from "../src/engine/calculate";
import {
  emptyOutcomes,
  calculateOutcomes,
  validateOutcomes,
} from "../src/engine/outcomes";
import { createScenarioWorkbook } from "../src/export/excel";
import ExcelJS from "exceljs";
function reference(): Scenario {
  const s = fresh();
  s.name = "Hand reference";
  s.confirmed = { substitutionRate: true, reboundFactor: true };
  s.inputs = {
    ...s.inputs,
    itemsSold: 1000,
    avgWeightKg: 1,
    baselineCollectionRate: 0.2,
    baselineRecyclingYield: 0.5,
    participatingCustomers: 100,
    shareOfRangeAffected: 0.5,
    lifetimeIncreasePct: 1,
    substitutionRate: 0.8,
    reboundFactor: 0.1,
    itemsPerPerson: 10,
    unwornShare: 0.5,
    shareOfUnwornBroughtIntoUse: 0.2,
    shareDesignedForRecycling: 1,
    newCollectionRate: 0.5,
    fibreToFibreYield: 0.8,
    itemsDisposedPerPersonPerYear: 2,
    deltaCollectionRate: 0.5,
    yield: 0.5,
    pctMaterialSavedPerGarment: 0.1,
    preConsumerWasteRate: 0.2,
    pctManufacturingWasteAvoided: 0.5,
  };
  for (const key in s.confidence) s.confidence[key] = "medium";
  return s;
}
describe("scenario safety and report review", () => {
  for (const value of [
    null,
    { ...examples[0], region: { toString: null } },
    {
      ...examples[0],
      confidence: {
        ...examples[0].confidence,
        slowingFlows: { toString: null },
      },
    },
    [],
    4,
    "text",
    {},
    { ...examples[0], notes: [null, ...examples[0].notes.slice(1)] },
    { ...examples[0], notes: [false, ...examples[0].notes.slice(1)] },
  ])
    it(
      "rejects malformed data without throwing " +
        JSON.stringify(value)?.slice(0, 20),
      () => {
        expect(() => validate(value)).not.toThrow();
        expect(validate(value).length).toBeGreaterThan(0);
      },
    );
  it("retains valid stored scenarios alongside invalid entries", () => {
    const r = restoreScenarios(
      JSON.stringify([
        examples[0],
        null,
        { ...examples[0], notes: [null, ...examples[0].notes.slice(1)] },
        examples[1],
      ]),
    );
    expect(r.scenarios).toHaveLength(2);
    expect(r.rejected).toBe(2);
  });
  it("round trips old scenarios with explicit baseline confidence", () => {
    const { baselineConfidence, ...old } = examples[0];
    expect(parseScenario(JSON.stringify(old)).baselineConfidence).toBe(
      "medium",
    );
  });
  it("keeps draft calculation available but blocks final workbooks", () => {
    const s = fresh();
    expect(validate(s)).toEqual([]);
    expect(calculate(s).total.central).toBe(0);
    expect(reportErrors(s)).toHaveLength(2);
    expect(() => createScenarioWorkbook(s)).toThrow(/confirm/);
  });
  it("starts with no example interventions or personal notes", () => {
    const s = fresh();
    expect(calculate(s).total.central).toBe(0);
    expect(s.checklist).toEqual([0, 0, 0]);
    expect(s.notes.every((n) => n.text === "")).toBe(true);
    expect(s.inputs.itemsSold).toBe(0);
  });
  it("rejects reversed confidence bands", () => {
    expect(
      validate({
        ...reference(),
        bands: { low: 0.1, medium: 0.25, high: 0.5 },
      }),
    ).toContain("Confidence bands must satisfy high ≤ medium ≤ low.");
  });
  it("rejects unknown formula characters and prototype names", () => {
    expect(() => evaluate("1;2", {})).toThrow();
    expect(() => evaluate("constructor", {})).toThrow();
  });
});
describe("independent hand-derived material references", () => {
  it("matches each mechanism including overlap corrections", () => {
    const r = calculate(reference());
    expect(r.baseline.central).toBeCloseTo(0.9);
    expect(r.cells.map((c) => c.central)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0.18),
        expect.closeTo(0.072),
        expect.closeTo(0.216),
        expect.closeTo(0.027),
        expect.closeTo(0.1),
      ]),
    );
    expect(r.total.central).toBeCloseTo(0.595);
    expect(r.total.low).toBeCloseTo(0.44625);
    expect(r.total.high).toBeCloseTo(0.74375);
    expect(r.after.central).toBeCloseTo(0.305);
    expect(r.percent.central).toBeCloseTo(66.111111);
  });
  it("matches quadrature uncertainty independently", () => {
    const r = calculate({ ...reference(), mode: "independent" });
    const deviation =
      0.25 *
      Math.sqrt(0.18 ** 2 + 0.072 ** 2 + 0.216 ** 2 + 0.027 ** 2 + 0.1 ** 2);
    expect(r.total.high).toBeCloseTo(0.595 + deviation);
    expect(r.total.low).toBeCloseTo(0.595 - deviation);
  });
  it("exposes baseline confidence in sensitivity and a hand-derived linear response", () => {
    const s = reference();
    s.baselineConfidence = "high";
    const v = sensitivity(s).find((p) => p.id === "itemsSold")!;
    expect(v.confidence).toBe("high");
    expect(v.low).toBe(800);
    expect(v.high).toBe(1200);
    expect(v.impact).toBeCloseTo((0.18 + 0.216 + 0.1) * 0.2);
  });
  it("ranks sensitivity by the documented score and probes zero inputs", () => {
    const r = sensitivity(reference());
    for (let i = 1; i < r.length; i++)
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
    const s = fresh();
    s.inputs.itemsSold = 1000;
    expect(
      sensitivity(s).find((p) => p.id === "pctMaterialSavedPerGarment")!.high,
    ).toBeGreaterThan(0);
  });
  it("keeps all configured parameter bounds evaluable", () => {
    for (const p of parameters) {
      const s = reference();
      for (const n of [p.min, p.max])
        expect(
          Number.isFinite(
            calculate({ ...s, inputs: { ...s.inputs, [p.id]: n } }).total
              .central,
          ),
        ).toBe(true);
    }
  });
});
describe("additional outcome models", () => {
  function scenario() {
    const s = reference();
    s.outcomes = emptyOutcomes();
    s.outcomes.uncertainty = 0;
    return s;
  }
  it("does not treat unassessed modules as zero benefit", () => {
    expect(
      calculateOutcomes(reference(), calculate(reference()).total),
    ).toEqual([]);
  });
  it("matches freight energy and carbon arithmetic, including negative impacts", () => {
    const s = scenario(),
      o = s.outcomes!;
    o.enabled.transport = true;
    o.sources.transport = "Measured freight, 2026, UK, all returns included";
    Object.assign(o.values, {
      baselineTonneKm: 1000,
      interventionTonneKm: 1500,
      baselineTransportCo2: 0.1,
      interventionTransportCo2: 0.2,
      baselineTransportEnergy: 0.5,
      interventionTransportEnergy: 0.4,
    });
    const m = calculateOutcomes(s, calculate(s).total);
    expect(m.find((x) => x.id === "transportCarbon")!.range.central).toBe(-200);
    expect(m.find((x) => x.id === "transportEnergy")!.range.central).toBe(-100);
  });
  it("matches washing, drying, ironing and water references", () => {
    const s = scenario(),
      o = s.outcomes!;
    o.enabled.care = true;
    Object.assign(o.values, {
      baselineWashCycles: 100,
      interventionWashCycles: 80,
      baselineWashKwh: 1,
      interventionWashKwh: 0.5,
      baselineDryCycles: 50,
      interventionDryCycles: 20,
      baselineDryKwh: 2,
      interventionDryKwh: 2,
      baselineIronHours: 10,
      interventionIronHours: 5,
      baselineIronKw: 1,
      interventionIronKw: 1,
      baselineGridCo2: 0.2,
      interventionGridCo2: 0.1,
      baselineWaterLitres: 50,
      interventionWaterLitres: 40,
    });
    const m = calculateOutcomes(s, calculate(s).total);
    expect(m.find((x) => x.id === "careEnergy")!.range.central).toBe(125);
    expect(m.find((x) => x.id === "careCarbon")!.range.central).toBeCloseTo(
      33.5,
    );
    expect(m.find((x) => x.id === "water")!.range.central).toBe(1800);
  });
  it("caps production credits and deducts processing burdens", () => {
    const s = scenario(),
      o = s.outcomes!;
    o.enabled.production = true;
    Object.assign(o.values, {
      materialCo2: 2,
      materialEnergy: 3,
      circularProcessKwh: 100,
      processGridCo2: 0.2,
      otherProcessCo2: 50,
    });
    const m = calculateOutcomes(s, { low: 1, central: 2, high: 3 });
    expect(m.find((x) => x.id === "productionCarbon")!.range.central).toBe(
      1730,
    );
    expect(m.find((x) => x.id === "productionEnergy")!.range.central).toBe(
      2600,
    );
  });
  it("keeps worker indicators separate from environmental totals", () => {
    const s = scenario(),
      o = s.outcomes!;
    o.enabled.social = true;
    Object.assign(o.values, {
      jobsCreated: 5,
      jobsDisplaced: 7,
      trainingHours: 100,
      workersAffected: 10,
      baselinePaidHours: 1000,
      interventionPaidHours: 900,
      baselineHourlyWage: 10,
      interventionHourlyWage: 12,
    });
    const m = calculateOutcomes(s, calculate(s).total);
    expect(m.find((x) => x.id === "jobs")!.range.central).toBe(-2);
    expect(m.find((x) => x.id === "income")!.range.central).toBe(800);
    expect(m.some((x) => x.id === "totalCarbon")).toBe(false);
  });
  it("propagates conservative bounds and requires evidence before reporting", () => {
    const s = scenario(),
      o = s.outcomes!;
    o.enabled.transport = true;
    o.uncertainty = 0.1;
    Object.assign(o.values, {
      baselineTonneKm: 100,
      baselineTransportCo2: 2,
      interventionTonneKm: 50,
      interventionTransportCo2: 1,
    });
    const r = calculateOutcomes(s, calculate(s).total).find(
      (m) => m.id === "transportCarbon",
    )!.range;
    expect(r.central).toBe(150);
    expect(r.low).toBeCloseTo(101.5);
    expect(r.high).toBeCloseTo(201.5);
    expect(reportErrors(s).join()).toMatch(/sources/);
    o.sources.transport = "Measured activities; factor source and boundary";
    expect(reportErrors(s)).toEqual([]);
  });
  it("rejects malformed and negative outcome inputs", () => {
    expect(validateOutcomes(null).length).toBeGreaterThan(0);
    const o = emptyOutcomes();
    o.values.jobsCreated = -1;
    expect(validateOutcomes(o).join()).toMatch(/Jobs created/);
  });
  it("round trips extended outcomes through JSON and XLSX", async () => {
    const s = scenario();
    s.outcomes!.enabled.social = true;
    s.outcomes!.sources.social = "Payroll 2026";
    s.outcomes!.values.jobsCreated = 3;
    const restored = parseScenario(JSON.stringify(s));
    expect(restored).toEqual(s);
    const workbook = createScenarioWorkbook(restored);
    const bytes = await workbook.xlsx.writeBuffer();
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(bytes);
    expect(loaded.worksheets).toHaveLength(6);
    expect(
      loaded.getWorksheet("Executive Summary")!.getCell("B13").value,
    ).toBeCloseTo(0.9);
    expect(
      loaded.getWorksheet("Additional Outcomes")!.getCell("B2").value,
    ).toBe(3);
    expect(
      loaded.getWorksheet("Outcome Assumptions")!.getCell("C5").value,
    ).toBe("Payroll 2026");
  });
});

describe("bounded scenario input", () => {
  it("rejects an oversized file before reading it", async () => {
    const text = vi.fn();
    const result = await readScenarioFromFile({
      size: 1024 * 1024 + 1,
      text,
    } as unknown as File);
    expect(result.errors?.join()).toMatch(/1 MB/);
    expect(text).not.toHaveBeenCalled();
  });
  it("bounds parser input even outside file uploads", () => {
    expect(() => parseScenario(" ".repeat(1024 * 1024 + 1))).toThrow(/1 MB/);
  });
});

it("bounds editable text so normal backups remain importable", () => {
  const s = reference();
  s.name = "a".repeat(201);
  expect(validate(s).join()).toMatch(/200 characters/);
  s.name = "Valid";
  s.notes[0].text = "a".repeat(20001);
  expect(validate(s).join()).toMatch(/Systems notes/);
});
