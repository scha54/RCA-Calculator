import ExcelJS from "exceljs";
import type { Scenario } from "../engine/model";
import { calculate, sensitivity } from "../engine/calculate";
import { assertReportReady } from "../engine/model";
import {
  calculateOutcomes,
  outcomeFields,
  outcomeGroups,
  type OutcomeGroup,
} from "../engine/outcomes";
import { parameters, questions, benchmarks } from "../engine/model";

export function createScenarioWorkbook(scenario: Scenario): ExcelJS.Workbook {
  assertReportReady(scenario);
  const calc = calculate(scenario);
  const sens = sensitivity(scenario);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RCA Calculator";
  workbook.lastModifiedBy = "RCA Calculator";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color palette: Forest Green & Emerald
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF065F46" }, // emerald-800
  };
  const subHeaderFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD1FAE5" }, // emerald-100
  };
  const headerFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const titleFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FF065F46" },
  };
  const sectionFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: { argb: "FF0F172A" },
  };

  // 1. EXECUTIVE SUMMARY SHEET
  const summarySheet = workbook.addWorksheet("Executive Summary", {
    views: [{ showGridLines: true }],
  });
  summarySheet.columns = [
    { key: "colA", width: 28 },
    { key: "colB", width: 22 },
    { key: "colC", width: 22 },
    { key: "colD", width: 22 },
    { key: "colE", width: 30 },
  ];

  summarySheet.addRow([
    "Rapid Circularity Assessment (RCA) - Scenario Summary",
  ]).font = titleFont;
  summarySheet.addRow([
    "Generated on: " +
      new Date().toLocaleDateString() +
      " " +
      new Date().toLocaleTimeString(),
  ]);
  summarySheet.addRow([]);

  // Metadata Table
  summarySheet.addRow(["Scenario Name", scenario.name]);
  summarySheet.addRow(["Description", scenario.description]);
  summarySheet.addRow(["Target Region", scenario.region]);
  summarySheet.addRow(["Uncertainty Propagation", scenario.mode.toUpperCase()]);
  summarySheet.addRow([
    "Baseline Input Confidence",
    scenario.baselineConfidence ?? "medium",
  ]);
  summarySheet.addRow([
    "Assumptions reviewed",
    "Substitution and rebound confirmed",
  ]);
  summarySheet.addRow([
    "Methodology",
    "Screening model; bounds are not statistical confidence intervals. Not an audited LCA.",
  ]);
  summarySheet.addRow([]);

  // Key Results KPI Block
  const kpiHeader = summarySheet.addRow([
    "METRIC",
    "CENTRAL ESTIMATE",
    "LOWER BOUND (- uncertainty)",
    "UPPER BOUND (+ uncertainty)",
    "UNIT",
  ]);
  kpiHeader.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
  });

  summarySheet.addRow([
    "Baseline Material (Virgin Textile)",
    Math.round(calc.baseline.central * 100) / 100,
    Math.round(calc.baseline.low * 100) / 100,
    Math.round(calc.baseline.high * 100) / 100,
    "tonnes/year",
  ]);

  summarySheet.addRow([
    "Total Avoided / Saved Material",
    Math.round(calc.total.central * 100) / 100,
    Math.round(calc.total.low * 100) / 100,
    Math.round(calc.total.high * 100) / 100,
    "tonnes/year",
  ]);

  summarySheet.addRow([
    "Post-Intervention Net Material Footprint",
    Math.round(calc.after.central * 100) / 100,
    Math.round(calc.after.low * 100) / 100,
    Math.round(calc.after.high * 100) / 100,
    "tonnes/year",
  ]);

  summarySheet.addRow([
    "Relative Virgin Material Reduction",
    `${calc.percent.central.toFixed(1)}%`,
    `${calc.percent.low.toFixed(1)}%`,
    `${calc.percent.high.toFixed(1)}%`,
    "% of baseline",
  ]);

  summarySheet.addRow([]);

  // Strategy Breakdown
  summarySheet.addRow(["CIRCULAR STRATEGY BREAKDOWN"]).font = sectionFont;
  const stratHeader = summarySheet.addRow([
    "Strategy Dimension",
    "Central Savings (tonnes)",
    "Min Savings (tonnes)",
    "Max Savings (tonnes)",
    "Confidence Level",
  ]);
  stratHeader.eachCell((c) => {
    c.fill = subHeaderFill;
    c.font = { bold: true, color: { argb: "FF065F46" } };
  });

  const stratLabels: Record<string, string> = {
    slowingFlows: "Slowing Loops - Product Lifetime Extension (Flows)",
    slowingStocks: "Slowing Loops - Wardrobe Activation (Stocks)",
    closingFlows: "Closing Loops - Design for Recyclability (Flows)",
    closingStocks:
      "Closing Loops - Take-back & Post-consumer Recycling (Stocks)",
    lifeFlows:
      "Life Cycle Efficiencies - Design & Manufacturing Waste Avoidance (Flows)",
  };

  calc.cells.forEach((cell) => {
    summarySheet.addRow([
      stratLabels[cell.id] || cell.id,
      Math.round(cell.central * 100) / 100,
      Math.round(cell.low * 100) / 100,
      Math.round(cell.high * 100) / 100,
      scenario.confidence[cell.id]?.toUpperCase() || "MEDIUM",
    ]);
  });

  summarySheet.addRow([]);

  // Radar circularity scores
  summarySheet.addRow(["CIRCULARITY RADAR DIMENSIONS (0 - 100 INDEX)"]).font =
    sectionFont;
  const radarHeader = summarySheet.addRow([
    "Dimension",
    "Score Index (0-100)",
    "Lower Bound",
    "Upper Bound",
  ]);
  radarHeader.eachCell((c) => {
    c.fill = subHeaderFill;
    c.font = { bold: true, color: { argb: "FF065F46" } };
  });
  calc.radar.forEach((r) => {
    summarySheet.addRow([
      r.label,
      Math.round(r.central * 10) / 10,
      Math.round(r.low * 10) / 10,
      Math.round(r.high * 10) / 10,
    ]);
  });

  // 2. INPUTS & PARAMETERS SHEET
  const inputSheet = workbook.addWorksheet("Model Inputs & Parameters", {
    views: [{ showGridLines: true }],
  });
  inputSheet.columns = [
    { key: "group", width: 16 },
    { key: "id", width: 26 },
    { key: "label", width: 34 },
    { key: "value", width: 16 },
    { key: "unit", width: 18 },
    { key: "default", width: 14 },
    { key: "benchmark", width: 28 },
    { key: "help", width: 44 },
  ];

  const inHeader = inputSheet.addRow([
    "Group",
    "Parameter ID",
    "Parameter Name",
    "Scenario Value",
    "Unit",
    "Default Value",
    "Regional Benchmark",
    "Guidance",
  ]);
  inHeader.eachCell((c) => {
    c.fill = headerFill;
    c.font = headerFont;
  });

  parameters.forEach((p) => {
    const val = (scenario.inputs as Record<string, number>)[p.id];
    const bench = benchmarks.find(
      (b) => b.id === p.benchmark && b.region === scenario.region,
    );
    inputSheet.addRow([
      p.group,
      p.id,
      p.label,
      val,
      p.unit,
      p.default,
      bench ? `${bench.value} (${bench.sourceName})` : "None",
      p.help,
    ]);
  });

  // 3. SENSITIVITY SHEET
  const sensSheet = workbook.addWorksheet("Sensitivity Analysis", {
    views: [{ showGridLines: true }],
  });
  sensSheet.columns = [
    { key: "rank", width: 8 },
    { key: "label", width: 34 },
    { key: "value", width: 14 },
    { key: "lowTest", width: 14 },
    { key: "highTest", width: 14 },
    { key: "impact", width: 22 },
    { key: "share", width: 20 },
    { key: "score", width: 18 },
    { key: "confidence", width: 14 },
  ];

  const sensHead = sensSheet.addRow([
    "Rank",
    "Parameter",
    "Current Value",
    "Low Perturbation",
    "High Perturbation",
    "Tonnes Impact (Central)",
    "Share of Savings (%)",
    "Sensitivity Score",
    "Confidence",
  ]);
  sensHead.eachCell((c) => {
    c.fill = headerFill;
    c.font = headerFont;
  });

  sens.forEach((s, idx) => {
    sensSheet.addRow([
      idx + 1,
      s.label,
      s.value,
      Math.round(s.low * 1000) / 1000,
      Math.round(s.high * 1000) / 1000,
      Math.round(s.impact * 100) / 100,
      `${s.share.toFixed(1)}%`,
      Math.round(s.score * 100) / 100,
      s.confidence.toUpperCase(),
    ]);
  });

  // 4. SYSTEMS & QUALITATIVE RISKS SHEET
  const systemsSheet = workbook.addWorksheet("Systems & Risk Evaluation", {
    views: [{ showGridLines: true }],
  });
  systemsSheet.columns = [
    { key: "num", width: 8 },
    { key: "question", width: 60 },
    { key: "risk", width: 16 },
    { key: "notes", width: 60 },
  ];

  const sysHead = systemsSheet.addRow([
    "#",
    "Systemic Assessment Dimension",
    "Risk Level",
    "Mitigation Notes / Evidence",
  ]);
  sysHead.eachCell((c) => {
    c.fill = headerFill;
    c.font = headerFont;
  });

  const sysQuestions =
    questions.find((q) => q.id === "systems")?.questions || [];
  sysQuestions.forEach((q, idx) => {
    const note = scenario.notes[idx] || { text: "", risk: "medium" };
    systemsSheet.addRow([
      idx + 1,
      q,
      note.risk.toUpperCase(),
      note.text || "No strategic notes logged.",
    ]);
  });

  const outcomesSheet = workbook.addWorksheet("Additional Outcomes");
  outcomesSheet.columns = [
    { width: 55 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
  ];
  outcomesSheet.addRow(["Outcome", "Central", "Lower", "Upper", "Unit"]);
  const metrics = calculateOutcomes(scenario, calc.total);
  for (const m of metrics)
    outcomesSheet.addRow([
      m.label,
      m.range.central,
      m.range.low,
      m.range.high,
      m.unit,
    ]);
  outcomesSheet.addRow([
    "Positive savings = avoided burdens; negative savings = increased burdens.",
  ]);
  outcomesSheet.addRow([
    "Totals include enabled environmental modules only; social indicators are separate.",
  ]);
  const assumptionsSheet = workbook.addWorksheet("Outcome Assumptions");
  assumptionsSheet.columns = [{ width: 50 }, { width: 30 }, { width: 90 }];
  assumptionsSheet.addRow(["Module", "Status", "Sources and boundary"]);
  for (const group of Object.keys(outcomeGroups) as OutcomeGroup[])
    assumptionsSheet.addRow([
      outcomeGroups[group],
      scenario.outcomes?.enabled[group] ? "Modelled" : "Not assessed",
      scenario.outcomes?.sources[group] ?? "",
    ]);
  if (scenario.outcomes) {
    assumptionsSheet.addRow([
      "Activity/factor uncertainty",
      scenario.outcomes.uncertainty,
      "Conservative interval bounds; not statistical confidence intervals",
    ]);
    assumptionsSheet.addRow(["Currency", scenario.outcomes.currency]);
    assumptionsSheet.addRow(["Input", "Value", "Unit"]);
    for (const f of outcomeFields.filter(
      (f) => scenario.outcomes!.enabled[f.group],
    ))
      assumptionsSheet.addRow([
        f.label,
        scenario.outcomes.values[f.id],
        f.unit,
      ]);
  }
  return workbook;
}

export async function exportScenarioToExcel(scenario: Scenario): Promise<void> {
  const workbook = createScenarioWorkbook(scenario);
  // Write workbook to buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_rca_assessment.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
