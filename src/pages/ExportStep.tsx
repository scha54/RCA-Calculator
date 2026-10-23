import React, { useRef, useState } from "react";
import type { Scenario } from "../engine/model";
import { reportErrors } from "../engine/model";
import { OutcomeResults } from "../components/OutcomeResults";
import { calculateOutcomes, type OutcomeGroup } from "../engine/outcomes";
import { calculate, sensitivity } from "../engine/calculate";
import { downloadScenarioAsJson, readScenarioFromFile } from "../export/json";
import {
  Download,
  FileSpreadsheet,
  Upload,
  Copy,
  Check,
  ChevronLeft,
  Sparkles,
} from "../components/Icons";

interface ExportStepProps {
  scenario: Scenario;
  onImportScenario: (scenario: Scenario) => void;
  onBackToResults: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  scenario,
  onImportScenario,
  onBackToResults,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const blockers = reportErrors(scenario);
  const canReport = blockers.length === 0;

  const calc = React.useMemo(() => {
    try {
      return calculate(scenario);
    } catch {
      return null;
    }
  }, [scenario]);

  const sens = React.useMemo(() => {
    try {
      return sensitivity(scenario);
    } catch {
      return [];
    }
  }, [scenario]);

  const handleExcelExport = async () => {
    try {
      if (!canReport) throw Error(blockers.join(" "));
      setExportError(null);
      setIsExportingExcel(true);
      const { exportScenarioToExcel } = await import("../export/excel");
      await exportScenarioToExcel(scenario);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "Excel export failed. Please retry.",
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const res = await readScenarioFromFile(file);
    e.target.value = "";
    if (res.scenario) {
      onImportScenario(res.scenario);
    } else if (res.errors) {
      setUploadError(res.errors.join(" "));
    }
  };

  const generateMarkdownSummary = (): string => {
    if (!calc || !canReport) return "";
    return `# Rapid Circularity Assessment (RCA) - ${scenario.name}
**Region**: ${scenario.region} | **Mode**: ${scenario.mode.toUpperCase()}
**Generated**: ${new Date().toLocaleDateString()}

## Executive Summary
- **Baseline Virgin Material**: ${Math.round(calc.baseline.central).toLocaleString()} tonnes/yr
- **Avoided Virgin Material**: ${Math.round(calc.total.central).toLocaleString()} tonnes/yr [${Math.round(calc.total.low).toLocaleString()} – ${Math.round(calc.total.high).toLocaleString()}]
- **Relative Material Reduction**: ${calc.percent.central.toFixed(1)}% [${calc.percent.low.toFixed(1)}% – ${calc.percent.high.toFixed(1)}%]
- **Residual Footprint**: ${Math.round(calc.after.central).toLocaleString()} tonnes/yr

## Mechanism Breakdown
${calc.cells
  .map(
    (c) =>
      `- **${c.id}**: ${Math.round(c.central).toLocaleString()} tonnes (${scenario.confidence[c.id]?.toUpperCase()} confidence)`,
  )
  .join("\n")}

## Additional outcomes (annual screening estimates)
${
  calculateOutcomes(scenario, calc.total)
    .map(
      (m) =>
        `- **${m.label}**: ${m.range.central.toFixed(2)} [${m.range.low.toFixed(2)} – ${m.range.high.toFixed(2)}] ${m.unit}`,
    )
    .join("\n") || "Not assessed."
}
${Object.entries(scenario.outcomes?.enabled ?? {})
  .filter(([, enabled]) => enabled)
  .map(
    ([g]) =>
      `- ${g} sources and boundary: ${scenario.outcomes!.sources[g as OutcomeGroup]}`,
  )
  .join("\n")}
Screening estimates; positive savings mean avoided burdens, negative savings mean increased burdens. Bounds are not statistical confidence intervals. Totals cover enabled modules only.

## Top 3 Sensitivity Leverage Drivers
${sens
  .slice(0, 3)
  .map(
    (s) =>
      `- **${s.label}**: ±${Math.round(s.impact).toLocaleString()} t swing (${s.share.toFixed(1)}% of total savings)`,
  )
  .join("\n")}
`;
  };

  const handleCopyMarkdown = async () => {
    if (!canReport) return;
    setCopiedMarkdown(false);
    setExportError(null);
    try {
      await navigator.clipboard.writeText(generateMarkdownSummary());
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2500);
    } catch {
      setExportError(
        "Copy failed. Allow clipboard access or use a JSON/Excel download.",
      );
    }
  };

  const handlePrint = () => {
    if (canReport) window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Download size={14} />
            <span>Step 8: Export & Deliverables</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Export Assessment & Reports
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Generate screening-model Excel workbooks, backup JSON scenarios,
            copy markdown briefings, or print assessment report cards.
          </p>
        </div>

        <button
          onClick={onBackToResults}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Back to Results Dashboard</span>
        </button>
      </div>

      {!canReport && (
        <div
          role="alert"
          className="p-4 bg-amber-950 text-amber-100 rounded-xl"
        >
          Final reports require review: {blockers.join(" ")} JSON backup remains
          available for drafts.
        </div>
      )}
      {exportError && (
        <div role="alert" className="p-4 bg-rose-950 text-rose-100 rounded-xl">
          {exportError}
        </div>
      )}
      {/* Export Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Excel Export */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-emerald-500/50 transition flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="font-bold text-white text-base">
              Excel Workbook (.xlsx)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Formatted multi-tab workbook with Executive Summary, Model Inputs,
              Sensitivity Analysis, and Risk Logs.
            </p>
          </div>
          <button
            id="export-excel-btn"
            onClick={handleExcelExport}
            disabled={isExportingExcel || !canReport}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Download size={14} />
            <span>{isExportingExcel ? "Generating..." : "Download .xlsx"}</span>
          </button>
        </div>

        {/* JSON Download */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-teal-500/50 transition flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
              <Download size={24} />
            </div>
            <h3 className="font-bold text-white text-base">Scenario JSON</h3>
            <p className="text-xs text-slate-400 mt-1">
              Full machine-readable backup of inputs, uncertainty bands,
              checklist, and strategic notes.
            </p>
          </div>
          <button
            id="export-json-btn"
            onClick={() => downloadScenarioAsJson(scenario)}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Download size={14} />
            <span>Save .json</span>
          </button>
        </div>

        {/* JSON Upload */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-cyan-500/50 transition flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Upload size={24} />
            </div>
            <h3 className="font-bold text-white text-base">
              Load Scenario JSON
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Restore a previously saved RCA assessment file or import corporate
              assumptions.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload size={14} />
            <span>Upload .json</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Print / Report */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-amber-500/50 transition flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-white text-base">Print / PDF Card</h3>
            <p className="text-xs text-slate-400 mt-1">
              Printable executive memo for stakeholder review.
            </p>
          </div>
          <button
            onClick={handlePrint}
            disabled={!canReport}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs"
        >
          {uploadError}
        </div>
      )}

      {/* Printable / Copyable Report Card Preview */}
      <div
        className={`report-card ${canReport ? "report-ready" : "report-draft"} bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
              Assessment Summary Memo
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              {scenario.name}
            </h3>
            <p className="text-xs text-slate-400">
              Region: {scenario.region} • Propagation:{" "}
              {scenario.mode.toUpperCase()} • Date:{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={handleCopyMarkdown}
            disabled={!canReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            {copiedMarkdown ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm">
          {canReport
            ? "Reviewed assumptions: substitution and rebound confirmed."
            : "DRAFT — assumptions require review."}{" "}
          Screening estimates; not an audited life cycle assessment.
        </p>
        {/* Formatted Summary Box */}
        {calc && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">
                Baseline Requirement
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {Math.round(calc.baseline.central).toLocaleString()} tonnes/yr
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">
                Avoided Virgin Material
              </span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {Math.round(calc.total.central).toLocaleString()} tonnes/yr
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                [{Math.round(calc.total.low).toLocaleString()} –{" "}
                {Math.round(calc.total.high).toLocaleString()}]
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">
                Virgin Material Reduction
              </span>
              <span className="text-lg font-bold text-teal-300 font-mono">
                {calc.percent.central.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                [{calc.percent.low.toFixed(1)}% – {calc.percent.high.toFixed(1)}
                %]
              </span>
            </div>
          </div>
        )}
        {calc && <OutcomeResults scenario={scenario} />}
      </div>
    </div>
  );
};
