import React from 'react';
import type { Scenario } from '../engine/model';
import { examples } from '../engine/model';
import { Layers, Sliders, ShieldCheck, ChevronRight, Info } from '../components/Icons';

interface BusinessModelStepProps {
  scenario: Scenario;
  onUpdateScenario: (updated: Partial<Scenario>) => void;
  onNext: () => void;
}

export const BusinessModelStep: React.FC<BusinessModelStepProps> = ({
  scenario,
  onUpdateScenario,
  onNext,
}) => {
  const handleArchetypeSelect = (presetName: string) => {
    const found = examples.find(e => e.name === presetName);
    if (found) {
      onUpdateScenario({
        name: found.name,
        description: found.description,
        inputs: { ...scenario.inputs, ...found.inputs },
        confidence: { ...scenario.confidence, ...(found.confidence as Record<string, 'low' | 'medium' | 'high'>) },
        checklist: [...found.checklist],
      });
    }
  };

  const handleBandChange = (level: 'low' | 'medium' | 'high', val: number) => {
    const clamped = Math.max(0.01, Math.min(1, val));
    onUpdateScenario({
      bands: {
        ...scenario.bands,
        [level]: clamped,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Layers size={14} />
            <span>Step 2: Strategy Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Business Model & Analytical Assumptions
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Specify the circular strategy name, geographic scope, and uncertainty propagation mathematics.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Next: Slowing Loops</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Scenario Profile Details */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Scenario Metadata</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scenario-name-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Assessment Name
            </label>
            <input
              id="scenario-name-input"
              type="text"
              value={scenario.name}
              onChange={e => onUpdateScenario({ name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              placeholder="e.g. Autumn 2026 Knitwear Resale & Repair"
            />
          </div>

          <div>
            <label htmlFor="scenario-desc-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Description & Notes
            </label>
            <input
              id="scenario-desc-input"
              type="text"
              value={scenario.description}
              onChange={e => onUpdateScenario({ description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              placeholder="e.g. Pilot circular service launched across 12 flagship stores"
            />
          </div>
        </div>

        {/* Quick Archetype Preset Switcher */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-2">
            Preset Archetypes (applies default parameter mix):
          </span>
          <div className="flex flex-wrap gap-2">
            {examples.map(ex => (
              <button
                key={ex.name}
                type="button"
                onClick={() => handleArchetypeSelect(ex.name)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                  scenario.name === ex.name
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Region & Propagation Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geographic Region */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Geographic Market</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {scenario.region}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Regional benchmarks adjust wardrobe retention, recycling context, and consumption estimates.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {(['UK', 'EU', 'US'] as const).map(reg => (
              <button
                key={reg}
                type="button"
                onClick={() => onUpdateScenario({ region: reg })}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  scenario.region === reg
                    ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm">{reg}</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                  {reg === 'UK' ? 'WRAP Data' : reg === 'EU' ? 'EU Textile Hub' : 'US EPA Data'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Propagation Mode */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Uncertainty Propagation</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono capitalize">
              {scenario.mode}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Controls how uncertainty across distinct formulas combines into total confidence intervals.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateScenario({ mode: 'conservative' })}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                scenario.mode === 'conservative'
                  ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold">Conservative</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Linear sum of bounds. Ideal for corporate risk screening.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onUpdateScenario({ mode: 'independent' })}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                scenario.mode === 'independent'
                  ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold">Independent</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Quadrature sum (RSS). Narrower, realistic for uncorrelated trials.
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Uncertainty Band Intervals Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-white">Uncertainty Band Percentages (±%)</h3>
          </div>
          <button
            type="button"
            onClick={() => onUpdateScenario({ bands: { high: 0.1, medium: 0.25, low: 0.5 } })}
            className="text-xs text-emerald-400 hover:underline cursor-pointer"
          >
            Reset Defaults (±10%, ±25%, ±50%)
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Configure the percentage variance applied when picking High, Medium, or Low confidence on individual assessment questions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['high', 'medium', 'low'] as const).map(level => {
            const currentPct = Math.round(scenario.bands[level] * 100);
            return (
              <div key={level} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-300">
                    {level} Confidence Band
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ±{currentPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={currentPct}
                  onChange={e => handleBandChange(level, parseFloat(e.target.value) / 100)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
