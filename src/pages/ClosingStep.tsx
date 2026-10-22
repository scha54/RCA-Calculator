import React from 'react';
import type { Scenario, Inputs, Confidence } from '../engine/model';
import { parameters, questions } from '../engine/model';
import { evaluate } from '../engine/calculate';
import formulas from '../../data/formulas.json';
import { InputCard } from '../components/InputCard';
import { ConfidencePicker } from '../components/ConfidencePicker';
import { RefreshCw, ChevronRight } from '../components/Icons';

interface ClosingStepProps {
  scenario: Scenario;
  onUpdateInputs: (updated: Partial<Inputs>) => void;
  onUpdateConfidence: (dimensionId: string, level: Confidence) => void;
  onNext: () => void;
}

export const ClosingStep: React.FC<ClosingStepProps> = ({
  scenario,
  onUpdateInputs,
  onUpdateConfidence,
  onNext,
}) => {
  const inputs = scenario.inputs as Inputs;

  // Closing questions & parameters
  const qFlows = questions.find(q => q.id === 'closingFlows');
  const qStocks = questions.find(q => q.id === 'closingStocks');

  const flowsParams = parameters.filter(p => p.group === 'closingFlows');
  const stocksParams = parameters.filter(p => p.group === 'closingStocks');

  // Realtime calculation
  const flowsTonnage = React.useMemo(() => {
    try {
      return evaluate(formulas.closingFlows, inputs);
    } catch {
      return 0;
    }
  }, [inputs]);

  const stocksTonnage = React.useMemo(() => {
    try {
      return evaluate(formulas.closingStocks, inputs);
    } catch {
      return 0;
    }
  }, [inputs]);

  const totalClosing = flowsTonnage + stocksTonnage;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <RefreshCw size={14} />
            <span>Step 4: Closing Resource Loops</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Closing Loops: Recyclability & Take-Back
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Designing mono-material garments for recycling, expanding collection, and high-yield fibre-to-fibre recycling.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Next: Life Cycle</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tonnage Summary Banner */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-800/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
            Total Closing Avoided Material
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
            {Math.round(totalClosing).toLocaleString()}{' '}
            <span className="text-base font-normal text-slate-400">tonnes/yr</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Design for Recycling (Flows)</span>
            <span className="text-teal-300 font-mono font-bold text-sm">
              {Math.round(flowsTonnage).toLocaleString()} t
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Post-Consumer Take-back (Stocks)</span>
            <span className="text-emerald-300 font-mono font-bold text-sm">
              {Math.round(stocksTonnage).toLocaleString()} t
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Closing Flows */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>1. Closing Flows: Design for Recyclability & Collection</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Manufacturing new garments designed specifically for high-efficiency fibre recovery.
          </p>
        </div>

        {/* Qualitative Questions */}
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
          id="closingFlows"
          dimensionName="Closing / Flows"
          value={scenario.confidence.closingFlows ?? 'medium'}
          onChange={lvl => onUpdateConfidence('closingFlows', lvl)}
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
            />
          ))}
        </div>
      </div>

      {/* Section 2: Closing Stocks */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>2. Closing Stocks: Take-Back & Disposed Clothing Recovery</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Diverting garments that would otherwise head to municipal landfill or low-grade incineration.
          </p>
        </div>

        {/* Qualitative Questions */}
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
          id="closingStocks"
          dimensionName="Closing / Stocks"
          value={scenario.confidence.closingStocks ?? 'medium'}
          onChange={lvl => onUpdateConfidence('closingStocks', lvl)}
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
