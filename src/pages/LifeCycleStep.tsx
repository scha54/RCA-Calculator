import React from 'react';
import type { Scenario, Inputs, Confidence } from '../engine/model';
import { parameters, questions } from '../engine/model';
import { evaluate } from '../engine/calculate';
import formulas from '../../data/formulas.json';
import { InputCard } from '../components/InputCard';
import { ConfidencePicker } from '../components/ConfidencePicker';
import { Activity, ChevronRight, Check } from '../components/Icons';

interface LifeCycleStepProps {
  scenario: Scenario;
  onUpdateInputs: (updated: Partial<Inputs>) => void;
  onUpdateConfidence: (dimensionId: string, level: Confidence) => void;
  onUpdateChecklist: (index: number, value: number) => void;
  onNext: () => void;
}

export const LifeCycleStep: React.FC<LifeCycleStepProps> = ({
  scenario,
  onUpdateInputs,
  onUpdateConfidence,
  onUpdateChecklist,
  onNext,
}) => {
  const inputs = scenario.inputs as Inputs;

  // Life Cycle questions & parameters
  const qFlows = questions.find(q => q.id === 'lifeFlows');
  const qStocks = questions.find(q => q.id === 'lifeStocks');

  const flowsParams = parameters.filter(p => p.group === 'lifeFlows');

  // Realtime calculation
  const flowsTonnage = React.useMemo(() => {
    try {
      return evaluate(formulas.lifeFlows, inputs);
    } catch {
      return 0;
    }
  }, [inputs]);

  const checklistAvg =
    (scenario.checklist.reduce((a, b) => a + b, 0) / scenario.checklist.length) * 100;

  const checklistQuestions = qStocks?.questions || [
    'Does it lead to any transportation savings for handling the current clothing stock?',
    'Does it lead to more efficient or less cleaning for the current clothing stock?',
    'Does it lead to any other efficiency/ savings (e.g. ironing, tumble drying) not yet captured for current clothing stocks?',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Activity size={14} />
            <span>Step 5: Life Cycle Efficiencies</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Life Cycle: Design, Manufacturing & Care
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upstream material reduction, cutting waste avoidance, and user-phase care improvements.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Next: Systems & Rebound</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
            Life Cycle Upstream Savings
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
            {Math.round(flowsTonnage).toLocaleString()}{' '}
            <span className="text-base font-normal text-slate-400">tonnes/yr</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Upstream Material Avoidance</span>
            <span className="text-cyan-300 font-mono font-bold text-sm">
              {Math.round(flowsTonnage).toLocaleString()} t
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Use-Phase Care Index</span>
            <span className="text-emerald-300 font-mono font-bold text-sm">
              {Math.round(checklistAvg)} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Life Cycle Flows */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>1. Life Cycle Flows: Material & Manufacturing Waste</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Savings achieved through smarter pattern engineering, lighter fabrics, and zero-waste cutting.
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
          id="lifeFlows"
          dimensionName="Life Cycle / Flows"
          value={scenario.confidence.lifeFlows ?? 'medium'}
          onChange={lvl => onUpdateConfidence('lifeFlows', lvl)}
          customBands={scenario.bands}
        />

        {/* Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Section 2: Life Cycle Stocks (Care & Use Checklist) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>2. Life Cycle Stocks: User Phase & Garment Care</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              Care Score: {Math.round(checklistAvg)}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consumer laundering, temperature, drying, and maintenance efficiencies for existing stock.
          </p>
        </div>

        {/* Confidence Picker */}
        <ConfidencePicker
          id="lifeStocks"
          dimensionName="Life Cycle / Stocks (Care)"
          value={scenario.confidence.lifeStocks ?? 'medium'}
          onChange={lvl => onUpdateConfidence('lifeStocks', lvl)}
          customBands={scenario.bands}
        />

        {/* Tri-state Checklist Items */}
        <div className="space-y-3">
          {checklistQuestions.map((questionText, idx) => {
            const currentVal = scenario.checklist[idx] ?? 0.5;
            return (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="text-xs text-slate-200 max-w-xl">
                  <span className="font-bold text-cyan-400 mr-2">Q{idx + 1}:</span>
                  <span>{questionText}</span>
                </div>

                {/* Tri-state Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { val: 0, label: 'No / Negative' },
                    { val: 0.5, label: 'Neutral / Partial' },
                    { val: 1, label: 'Yes / Positive' },
                  ].map(opt => {
                    const isSelected = currentVal === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => onUpdateChecklist(idx, opt.val)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                          isSelected
                            ? opt.val === 1
                              ? 'bg-emerald-600/40 border-emerald-500 text-emerald-300 shadow-sm'
                              : opt.val === 0.5
                              ? 'bg-slate-700/60 border-slate-600 text-slate-200 shadow-sm'
                              : 'bg-rose-950/60 border-rose-600 text-rose-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
