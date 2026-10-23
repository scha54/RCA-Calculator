import React from 'react';
import type { Scenario } from '../engine/model';
import { OutcomeResults } from '../components/OutcomeResults';
import { calculate } from '../engine/calculate';
import { RadarProfile } from '../components/RadarProfile';
import { SensitivityTornado } from '../components/SensitivityTornado';
import {
  BarChart3,
  TrendingDown,
  RefreshCw,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Download,
} from '../components/Icons';

interface ResultsStepProps {
  scenario: Scenario;
  onNext: () => void;
  onNavigateStep: (stepIndex: number) => void;
}

export const ResultsStep: React.FC<ResultsStepProps> = ({
  scenario,
  onNext,
  onNavigateStep,
}) => {
  const calc = React.useMemo(() => {
    try {
      return calculate(scenario);
    } catch {
      return null;
    }
  }, [scenario]);

  if (!calc) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-rose-400 bg-rose-950/40 rounded-2xl border border-rose-800">
        Unable to calculate scenario results. Please review parameters in previous steps.
      </div>
    );
  }

  const mechanismLabels: Record<string, { label: string; desc: string; icon: React.FC<{ size?: number; className?: string }> }> = {
    slowingFlows: {
      label: 'Slowing Loops (Flows)',
      desc: 'Extended product lifetime & durability',
      icon: TrendingDown,
    },
    slowingStocks: {
      label: 'Slowing Loops (Stocks)',
      desc: 'Wardrobe activation & displaced purchases',
      icon: TrendingDown,
    },
    closingFlows: {
      label: 'Closing Loops (Flows)',
      desc: 'Design for recyclability & mono-materials',
      icon: RefreshCw,
    },
    closingStocks: {
      label: 'Closing Loops (Stocks)',
      desc: 'Post-consumer collection & recycling yield',
      icon: RefreshCw,
    },
    lifeFlows: {
      label: 'Life Cycle (Flows)',
      desc: 'Material saving & zero-waste cutting',
      icon: Activity,
    },
  };

  // Systems risk counts
  const riskCounts = {
    high: scenario.notes.filter(n => n.risk === 'high').length,
    medium: scenario.notes.filter(n => n.risk === 'medium').length,
    low: scenario.notes.filter(n => n.risk === 'low').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <BarChart3 size={14} />
            <span>Step 7: Assessment Synthesis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Circularity Results & Impact Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Synthesized net virgin textile savings, uncertainty bounds, circularity profile, and sensitivity leverage.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <Download size={16} />
          <span>Proceed to Export & Reports</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Exceeds Baseline Warning Banner */}
      {calc.exceedsBaseline && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/60 flex items-start gap-3 shadow-lg">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-bold text-amber-300">
              Notice: Upper Uncertainty Bound Exceeds 100% Baseline (
              {Math.round(calc.total.high).toLocaleString()} t &gt;{' '}
              {Math.round(calc.baseline.central).toLocaleString()} t).
            </span>
            <p className="mt-1 text-slate-300">
              Under extreme upside assumptions, the theoretical savings exceed current virgin production.
              Review your substitution rate, lifetime increase, or high-confidence bands to calibrate extreme scenarios.
            </p>
          </div>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            1. Baseline Footprint
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {Math.round(calc.baseline.central).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">tonnes/yr</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Annual virgin textile input under conventional operations.
          </p>
        </div>

        {/* Avoided Virgin Material */}
        <div className="bg-gradient-to-b from-emerald-950/50 to-slate-900/80 border border-emerald-500/40 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1">
            <TrendingDown size={14} />
            <span>2. Net Avoided Material</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {Math.round(calc.total.central).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">tonnes/yr</span>
          </div>
          <div className="text-xs font-mono font-medium text-emerald-300 mt-1">
            Range: [{Math.round(calc.total.low).toLocaleString()} – {Math.round(calc.total.high).toLocaleString()}]
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Net material saved after accounting for rebound erosion.
          </p>
        </div>

        {/* Relative Reduction */}
        <div className="bg-gradient-to-b from-teal-950/50 to-slate-900/80 border border-teal-500/40 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
            3. Material Reduction %
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-300">
            {calc.percent.central.toFixed(1)}%
          </div>
          <div className="text-xs font-mono font-medium text-teal-400 mt-1">
            Confidence: [{calc.percent.low.toFixed(1)}% – {calc.percent.high.toFixed(1)}%]
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Percentage displacement of baseline virgin textiles.
          </p>
        </div>

        {/* Post-Intervention Net Footprint */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            4. Residual Footprint
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-200">
            {Math.round(calc.after.central).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">tonnes/yr</span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-400 mt-1">
            Bounds: [{Math.round(calc.after.low).toLocaleString()} – {Math.round(calc.after.high).toLocaleString()}]
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Remaining virgin material demand after circular intervention.
          </p>
        </div>
      </div>

      {/* Mechanism Breakdown Cards */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Circular Strategy Mechanism Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Contribution of each circular vector to total material displacement
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Mode: {scenario.mode.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {calc.cells.map(cell => {
            const meta = mechanismLabels[cell.id] || {
              label: cell.id,
              desc: 'Circular mechanism',
              icon: Activity,
            };
            const Icon = meta.icon;
            const confidence = scenario.confidence[cell.id] ?? 'medium';
            const shareOfTotal = calc.total.central > 0 ? (cell.central / calc.total.central) * 100 : 0;

            return (
              <div
                key={cell.id}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <Icon size={14} className="text-emerald-400" />
                      <span>{meta.label}</span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded ${
                        confidence === 'high'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : confidence === 'medium'
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {confidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">{meta.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-extrabold text-white font-mono">
                      {Math.round(cell.central).toLocaleString()} t
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono ml-1.5">
                      [{Math.round(cell.low).toLocaleString()} – {Math.round(cell.high).toLocaleString()}]
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {shareOfTotal.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OutcomeResults scenario={scenario} />
      {/* Visual Analytics: Radar Profile & Sensitivity Tornado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Profile */}
        <RadarProfile data={calc.radar} scenarioName={scenario.name} />

        {/* Sensitivity Tornado */}
        <SensitivityTornado scenario={scenario} maxDisplay={7} />
      </div>

      {/* Systemic Risk Qualitative Heatmap */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              <span>Systemic Risk & Feasibility Evaluation</span>
            </h3>
            <p className="text-xs text-slate-400">
              Summary of the 6 unintended consequences and market transition risk dimensions
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {riskCounts.high} High
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {riskCounts.medium} Medium
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {riskCounts.low} Low
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenario.notes.map((note, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Dimension {idx + 1}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    note.risk === 'high'
                      ? 'bg-rose-500/20 text-rose-300'
                      : note.risk === 'medium'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {note.risk} Risk
                </span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-3">
                {note.text || 'No specific notes logged.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
