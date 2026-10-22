import React from 'react';
import type { Scenario } from '../engine/model';
import { calculate } from '../engine/calculate';
import settings from '../../data/settings.json';
import { ChevronLeft, ChevronRight, AlertTriangle, TrendingDown } from './Icons';

interface LiveSummaryBarProps {
  scenario: Scenario;
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const LiveSummaryBar: React.FC<LiveSummaryBarProps> = ({
  scenario,
  currentStepIndex,
  onNextStep,
  onPrevStep,
}) => {
  const calc = React.useMemo(() => {
    try {
      return calculate(scenario);
    } catch {
      return null;
    }
  }, [scenario]);

  const totalSteps = settings.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  if (!calc) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Real-time calculated KPIs */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center sm:justify-start">
          {/* Baseline */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Baseline Virgin Material
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-200">
              {Math.round(calc.baseline.central).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">tonnes/yr</span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-800" />

          {/* Net Material Saved */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <TrendingDown size={12} />
              <span>Avoided Virgin Material</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white flex items-baseline gap-1.5">
              <span>{Math.round(calc.total.central).toLocaleString()} tonnes</span>
              <span className="text-xs font-medium text-emerald-300">
                [{Math.round(calc.total.low).toLocaleString()} – {Math.round(calc.total.high).toLocaleString()}]
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-800" />

          {/* Percent Reduction */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
              Material Saved %
            </div>
            <div className="text-sm sm:text-base font-bold text-teal-300">
              {calc.percent.central.toFixed(1)}%{' '}
              <span className="text-xs font-normal text-slate-400">
                (range {calc.percent.low.toFixed(1)}% – {calc.percent.high.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Exceeds baseline alert pill */}
          {calc.exceedsBaseline && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>Upper uncertainty bound exceeds 100% baseline</span>
            </div>
          )}
        </div>

        {/* Step Navigation buttons */}
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              id="btn-prev-step"
              onClick={onPrevStep}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back: {settings.steps[currentStepIndex - 1]}</span>
            </button>
          )}

          {!isLastStep ? (
            <button
              id="btn-next-step"
              onClick={onNextStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <span>Next: {settings.steps[currentStepIndex + 1]}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              id="btn-review-results"
              onClick={() => onPrevStep()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <span>Back to Results</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
