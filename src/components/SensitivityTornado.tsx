import React, { useState } from 'react';
import type { Scenario } from '../engine/model';
import { sensitivity, calculate } from '../engine/calculate';
import { parameters } from '../engine/model';
import { AlertTriangle, Info, Sliders } from './Icons';

interface SensitivityTornadoProps {
  scenario: Scenario;
  maxDisplay?: number;
}

export const SensitivityTornado: React.FC<SensitivityTornadoProps> = ({
  scenario,
  maxDisplay = 8,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedParamId, setSelectedParamId] = useState<string | null>(null);

  const sensData = React.useMemo(() => {
    try {
      return sensitivity(scenario);
    } catch {
      return [];
    }
  }, [scenario]);

  const baseCalc = React.useMemo(() => {
    try {
      return calculate(scenario);
    } catch {
      return null;
    }
  }, [scenario]);

  if (!sensData.length || !baseCalc) return null;

  const displayList = showAll ? sensData : sensData.slice(0, maxDisplay);
  const maxImpact = Math.max(...sensData.map(d => d.impact), 1);

  // Identify high-priority parameters: high impact (> 10% share) AND low/medium confidence
  const priorityItems = sensData.filter(d => d.share > 10 && d.confidence !== 'high');

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Sensitivity & Leverage Analysis (Tornado)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Impact on total avoided virgin material (tonnes) when perturbing inputs by their uncertainty bands
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium transition cursor-pointer"
        >
          {showAll ? `Show Top ${maxDisplay}` : `View All ${sensData.length} Inputs`}
        </button>
      </div>

      {/* High Leverage Alert if any */}
      {priorityItems.length > 0 && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold text-amber-300">High Leverage Uncertainty Detected: </span>
            <span>
              {priorityItems.map(p => p.label).join(', ')} drive substantial output variance while carrying{' '}
              {priorityItems.map(p => p.confidence).join(' / ')} data confidence. Prioritize empirical data collection on these assumptions.
            </span>
          </div>
        </div>
      )}

      {/* Tornado Diagram Bars */}
      <div className="space-y-3.5">
        {displayList.map(item => {
          const paramDef = parameters.find(p => p.id === item.id);
          const isSelected = selectedParamId === item.id;
          const barWidthPercent = Math.min(100, Math.max(3, (item.impact / maxImpact) * 100));

          return (
            <div
              key={item.id}
              onClick={() => setSelectedParamId(isSelected ? null : item.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              {/* Row Label and Values */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded font-mono ${
                      item.confidence === 'high'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.confidence === 'medium'
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.confidence}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>
                    Current:{' '}
                    <strong className="text-slate-200">
                      {paramDef?.unit === 'share'
                        ? `${Math.round(item.value * 1000) / 10}%`
                        : `${item.value} ${paramDef?.unit || ''}`}
                    </strong>
                  </span>
                  <span>
                    Impact:{' '}
                    <strong className="text-emerald-400">
                      ±{Math.round(item.impact).toLocaleString()} t
                    </strong>
                    <span className="text-slate-500 ml-1">({item.share.toFixed(1)}%)</span>
                  </span>
                </div>
              </div>

              {/* Visual Tornado Bar */}
              <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden flex items-center px-1">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 shadow-sm"
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              {/* Expanded details when clicked */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Perturbation Range
                    </span>
                    <span className="font-mono text-slate-100">
                      {paramDef?.unit === 'share'
                        ? `${(item.low * 100).toFixed(1)}% to ${(item.high * 100).toFixed(1)}%`
                        : `${item.low.toFixed(2)} to ${item.high.toFixed(2)} ${paramDef?.unit || ''}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Total Avoidance Swing
                    </span>
                    <span className="font-mono text-emerald-400">
                      {Math.round(baseCalc.total.central - item.impact).toLocaleString()} t —{' '}
                      {Math.round(baseCalc.total.central + item.impact).toLocaleString()} t
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Combined Risk Score
                    </span>
                    <span className="font-mono text-teal-300">
                      {item.score.toFixed(1)} (impact × uncertainty)
                    </span>
                  </div>
                  {paramDef?.help && (
                    <div className="sm:col-span-3 text-[11px] text-slate-400 bg-slate-800/60 p-2 rounded-lg mt-1">
                      <span className="text-slate-300 font-medium">Guidance: </span>
                      {paramDef.help}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
