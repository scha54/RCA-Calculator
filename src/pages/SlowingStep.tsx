import React from 'react';
import type { Scenario, Inputs, Confidence } from '../engine/model';
import { parameters, questions } from '../engine/model';
import { evaluate, range } from '../engine/calculate';
import formulas from '../../data/formulas.json';
import { InputCard } from '../components/InputCard';
import { ConfidencePicker } from '../components/ConfidencePicker';
import { TrendingDown, ChevronRight, HelpCircle, CheckCircle2 } from '../components/Icons';

interface SlowingStepProps {
  scenario: Scenario;
  onUpdateInputs: (updated: Partial<Inputs>) => void;
  onUpdateConfidence: (dimensionId: string, level: Confidence) => void;
  onConfirmChange: (key: 'substitutionRate' | 'reboundFactor', confirmed: boolean) => void;
  onNext: () => void;
}

export const SlowingStep: React.FC<SlowingStepProps> = ({
  scenario,
  onUpdateInputs,
  onUpdateConfidence,
  onConfirmChange,
  onNext,
}) => {
  const inputs = scenario.inputs as Inputs;

  // Slowing Flows & Stocks questions & parameters
  const qFlows = questions.find(q => q.id === 'slowingFlows');
  const qStocks = questions.find(q => q.id === 'slowingStocks');

  const flowsParams = parameters.filter(p => p.group === 'slowingFlows');
  const stocksParams = parameters.filter(p => p.group === 'slowingStocks');

  // Realtime calculation of slowing savings
  const flowsTonnage = React.useMemo(() => {
    try {
      return evaluate(formulas.slowingFlows, inputs);
    } catch {
      return 0;
    }
  }, [inputs]);

  const stocksTonnage = React.useMemo(() => {
    try {
      return evaluate(formulas.slowingStocks, inputs);
    } catch {
      return 0;
    }
  }, [inputs]);

  const totalSlowing = flowsTonnage + stocksTonnage;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <TrendingDown size={14} />
            <span>Step 3: Slowing Resource Loops</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Slowing Loops: Flows & Stocks
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Extending product lifetime and activating idle wardrobe stock to displace new virgin production.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Next: Closing Loops</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tonnage Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Total Slowing Avoided Material
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
            {Math.round(totalSlowing).toLocaleString()}{' '}
            <span className="text-base font-normal text-slate-400">tonnes/yr</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Lifetime Extension (Flows)</span>
            <span className="text-emerald-300 font-mono font-bold text-sm">
              {Math.round(flowsTonnage).toLocaleString()} t
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Wardrobe Activation (Stocks)</span>
            <span className="text-teal-300 font-mono font-bold text-sm">
              {Math.round(stocksTonnage).toLocaleString()} t
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Slowing Flows */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>1. Slowing Flows: Extended Product Lifetime</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Rental, resale, repair, and premium durability prolong the functional utility of new garments.
          </p>
        </div>

        {/* Qualitative Questions Checklist */}
        {qFlows && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block mb-2">
              Qualitative Assessment Criteria:
            </span>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              {qFlows.questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Picker */}
        <ConfidencePicker
          id="slowingFlows"
          dimensionName="Slowing / Flows"
          value={scenario.confidence.slowingFlows ?? 'medium'}
          onChange={lvl => onUpdateConfidence('slowingFlows', lvl)}
          customBands={scenario.bands}
        />

        {/* Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flowsParams.map(param => (
            <InputCard
              key={param.id}
              id={param.id}
              label={param.label}
              value={inputs[param.id] ?? param.default}
              unit={param.unit}
              min={param.min}
              max={param.max}
              help={param.help}
              benchmarkId={param.benchmark}
              region={scenario.region}
              onChange={val => onUpdateInputs({ [param.id]: val })}
              confirmed={param.id === 'substitutionRate' ? scenario.confirmed?.substitutionRate : undefined}
              onConfirmChange={
                param.id === 'substitutionRate'
                  ? val => onConfirmChange('substitutionRate', val)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Section 2: Slowing Stocks */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>2. Slowing Stocks: Wardrobe Utilization</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Styling, re-wear campaigns, and wardrobe rotation bring existing unworn items into active rotation.
          </p>
        </div>

        {/* Qualitative Questions Checklist */}
        {qStocks && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block mb-2">
              Qualitative Assessment Criteria:
            </span>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              {qStocks.questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Picker */}
        <ConfidencePicker
          id="slowingStocks"
          dimensionName="Slowing / Stocks"
          value={scenario.confidence.slowingStocks ?? 'medium'}
          onChange={lvl => onUpdateConfidence('slowingStocks', lvl)}
          customBands={scenario.bands}
        />

        {/* Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stocksParams.map(param => (
            <InputCard
              key={param.id}
              id={param.id}
              label={param.label}
              value={inputs[param.id] ?? param.default}
              unit={param.unit}
              min={param.min}
              max={param.max}
              help={param.help}
              benchmarkId={param.benchmark}
              region={scenario.region}
              onChange={val => onUpdateInputs({ [param.id]: val })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
