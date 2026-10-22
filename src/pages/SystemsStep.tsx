import React from 'react';
import type { Scenario, Inputs, Confidence } from '../engine/model';
import { parameters, questions } from '../engine/model';
import { calculate } from '../engine/calculate';
import { InputCard } from '../components/InputCard';
import { ConfidencePicker } from '../components/ConfidencePicker';
import { ShieldCheck, ChevronRight, AlertTriangle, Info } from '../components/Icons';

interface SystemsStepProps {
  scenario: Scenario;
  onUpdateInputs: (updated: Partial<Inputs>) => void;
  onUpdateConfidence: (dimensionId: string, level: Confidence) => void;
  onConfirmChange: (key: 'substitutionRate' | 'reboundFactor', confirmed: boolean) => void;
  onUpdateNote: (index: number, text: string, risk: 'low' | 'medium' | 'high') => void;
  onNext: () => void;
}

export const SystemsStep: React.FC<SystemsStepProps> = ({
  scenario,
  onUpdateInputs,
  onUpdateConfidence,
  onConfirmChange,
  onUpdateNote,
  onNext,
}) => {
  const inputs = scenario.inputs as Inputs;

  // Systems questions & parameter
  const qSystems = questions.find(q => q.id === 'systems');
  const reboundParam = parameters.find(p => p.id === 'reboundFactor');

  const calc = React.useMemo(() => {
    try {
      return calculate(scenario);
    } catch {
      return null;
    }
  }, [scenario]);

  const systemQuestions = qSystems?.questions || [
    'Does it lead to negative rebound effects (e.g. consuming more) or positive ones (e.g. from fast to slow fashion)?',
    'Are there any unintended consequences by upcycling the value of waste?',
    'Does it lead to radical changes for stores and employees? What are the impacts on those stakeholders and others? Who are the potential winners/ losers?',
    'What is the effect of multiple co-existing business models?',
    'What is the impact on society of this innovation?',
    'What is required for other companies to follow - is that considered in this new business model?',
  ];

  const reboundPct = Math.round(inputs.reboundFactor * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldCheck size={14} />
            <span>Step 6: Systems, Rebound & Unintended Consequences</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Systemic Effects & Rebound Assessment
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Evaluate rebound behavior, secondary market cannibalization, and organizational risks across 6 systemic dimensions.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Next: View Results</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Rebound Explanation & Parameter Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Quantitative Rebound Factor</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Erosion: {reboundPct}% of savings
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            When consumers save money via rental or resale, do they spend those savings on additional garments?
            A 15% rebound factor means 15% of physical circular gains are cancelled out.
          </p>
        </div>

        {/* Confidence Picker */}
        <ConfidencePicker
          id="systems"
          dimensionName="Systems / Rebound Confidence"
          value={scenario.confidence.systems ?? 'medium'}
          onChange={lvl => onUpdateConfidence('systems', lvl)}
          customBands={scenario.bands}
        />

        {/* Rebound Input Card */}
        {reboundParam && (
          <InputCard
            id={reboundParam.id}
            label={reboundParam.label}
            value={inputs[reboundParam.id] ?? reboundParam.default}
            unit={reboundParam.unit}
            min={reboundParam.min}
            max={reboundParam.max}
            help={reboundParam.help}
            benchmarkId={reboundParam.benchmark}
            region={scenario.region}
            onChange={val => onUpdateInputs({ [reboundParam.id]: val })}
            confirmed={scenario.confirmed?.reboundFactor}
            onConfirmChange={val => onConfirmChange('reboundFactor', val)}
          />
        )}
      </div>

      {/* Qualitative Systems Risk & Unintended Consequences */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Qualitative Systems Risk Evaluation (6 Dimensions)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Log strategic risks, organizational hurdles, and mitigation plans for the circular transition.
          </p>
        </div>

        <div className="space-y-4">
          {systemQuestions.map((qText, idx) => {
            const note = scenario.notes[idx] || { text: '', risk: 'medium' };

            return (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="text-xs text-slate-200">
                    <span className="font-bold text-amber-400 mr-2">Dimension {idx + 1}:</span>
                    <span className="font-medium">{qText}</span>
                  </div>

                  {/* Risk Level Pills */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(['low', 'medium', 'high'] as const).map(level => {
                      const isSelected = note.risk === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => onUpdateNote(idx, note.text, level)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold capitalize transition cursor-pointer ${
                            isSelected
                              ? level === 'low'
                                ? 'bg-emerald-600/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                                : level === 'medium'
                                ? 'bg-amber-600/40 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                                : 'bg-rose-600/40 border-rose-500 text-rose-300 ring-1 ring-rose-500/40'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {level} Risk
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mitigation & Evidence Textarea */}
                <div>
                  <textarea
                    rows={2}
                    value={note.text}
                    onChange={e => onUpdateNote(idx, e.target.value, note.risk as 'low' | 'medium' | 'high')}
                    placeholder="Enter evidence, observed user behavior, employee training plans, or mitigation notes..."
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
