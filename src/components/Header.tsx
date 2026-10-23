import React from 'react';
import type { Scenario } from '../engine/model';
import { examples } from '../engine/model';
import { calculate } from '../engine/calculate';
import { RefreshCw, Plus, Copy, Trash2, Sliders, Layers, Sparkles } from './Icons';

interface HeaderProps {
  scenarios: Scenario[];
  activeScenarioIndex: number;
  onSelectScenario: (index: number) => void;
  onNewScenario: () => void;
  onDuplicateScenario: () => void;
  onDeleteScenario: () => void;
  onUpdateScenario: (updated: Partial<Scenario>) => void;
  isComparing: boolean;
  onToggleCompare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  activeScenarioIndex,
  onSelectScenario,
  onNewScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onUpdateScenario,
  isComparing,
  onToggleCompare,
}) => {
  const current = scenarios[activeScenarioIndex];
  const calc = React.useMemo(() => {
    try {
      return calculate(current);
    } catch {
      return null;
    }
  }, [current]);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-4 flex-wrap">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <RefreshCw size={22} className="text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">RCA Calculator</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WRAP / Circular Economy
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Resource Circularity Assessment for Fashion & Textiles
              </p>
            </div>
          </div>

          {/* Scenario Selector & Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Scenario dropdown */}
            <div className="relative flex items-center">
              <select
                id="scenario-selector"
                aria-label="Active scenario"
                value={activeScenarioIndex}
                onChange={e => onSelectScenario(Number(e.target.value))}
                className="max-w-[220px] bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors font-medium cursor-pointer"
              >
                {scenarios.map((s, idx) => (
                  <option key={idx} value={idx}>
                    {s.name} ({s.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <button
              id="new-scenario-btn"
              onClick={onNewScenario}
              title="Create new scenario"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700 transition"
            >
              <Plus size={16} />
            </button>

            <button
              id="duplicate-scenario-btn"
              onClick={onDuplicateScenario}
              title="Duplicate scenario"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-600/30 text-slate-300 hover:text-teal-300 border border-slate-700 transition"
            >
              <Copy size={16} />
            </button>

            {scenarios.length > 1 && (
              <button
                id="delete-scenario-btn"
                onClick={onDeleteScenario}
                title="Delete scenario"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700 transition"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Region Selector */}
            <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
              {(['UK', 'EU', 'US'] as const).map(reg => (
                <button
                  key={reg}
                  onClick={() => onUpdateScenario({ region: reg })}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    current.region === reg
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>

            {/* Propagation Mode */}
            <div className="hidden lg:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => onUpdateScenario({ mode: 'conservative' })}
                title="Conservative mode: sums linear uncertainty bounds (wider)"
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  current.mode === 'conservative'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conservative
              </button>
              <button
                onClick={() => onUpdateScenario({ mode: 'independent' })}
                title="Independent mode: sums variances in quadrature (narrower)"
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  current.mode === 'independent'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Independent
              </button>
            </div>

            {/* Compare Scenarios Button */}
            {scenarios.length > 1 && (
              <button
                id="toggle-compare-btn"
                onClick={onToggleCompare}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isComparing
                    ? 'bg-teal-500 text-slate-900 border-teal-400 shadow-md shadow-teal-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-teal-500/40'
                }`}
              >
                <Layers size={14} />
                <span>Compare ({scenarios.length})</span>
              </button>
            )}

            {/* Realtime KPI Pill */}
            {calc && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 leading-tight">
                    Net Savings
                  </div>
                  <div className="text-sm font-extrabold text-white leading-tight">
                    {Math.round(calc.total.central).toLocaleString()} t{' '}
                    <span className="text-xs text-emerald-300 font-normal">
                      ({calc.percent.central.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
