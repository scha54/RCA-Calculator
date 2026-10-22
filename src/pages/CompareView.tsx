import React from 'react';
import type { Scenario } from '../engine/model';
import { calculate } from '../engine/calculate';
import { parameters } from '../engine/model';
import { Layers, ChevronLeft, TrendingDown, RefreshCw, Activity, ShieldCheck } from '../components/Icons';

interface CompareViewProps {
  scenarios: Scenario[];
  onSelectScenario: (index: number) => void;
  onClose: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  scenarios,
  onSelectScenario,
  onClose,
}) => {
  const calculations = React.useMemo(() => {
    return scenarios.map(s => {
      try {
        return calculate(s);
      } catch {
        return null;
      }
    });
  }, [scenarios]);

  const keyParamIds = [
    'itemsSold',
    'lifetimeIncreasePct',
    'substitutionRate',
    'shareDesignedForRecycling',
    'newCollectionRate',
    'fibreToFibreYield',
    'reboundFactor',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Layers size={14} />
            <span>Cross-Scenario Benchmarking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Scenario Comparison Matrix ({scenarios.length} Scenarios)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Direct side-by-side comparison of net virgin material savings, circular strategies, and key leverage inputs.
          </p>
        </div>

        <button
          onClick={onClose}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Exit Comparison</span>
        </button>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-[11px] w-64">
                  Assessment Metric
                </th>
                {scenarios.map((s, idx) => (
                  <th key={idx} className="p-4 font-bold text-white text-sm min-w-56">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{s.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectScenario(idx);
                          onClose();
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                      {s.region} • {s.mode.toUpperCase()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {/* Avoided Material Central */}
              <tr className="bg-emerald-950/20">
                <td className="p-4 font-bold text-emerald-300">
                  Net Virgin Material Avoided
                </td>
                {calculations.map((c, idx) => (
                  <td key={idx} className="p-4 font-mono font-extrabold text-base text-emerald-400">
                    {c ? `${Math.round(c.total.central).toLocaleString()} tonnes/yr` : '—'}
                  </td>
                ))}
              </tr>

              {/* Uncertainty Range */}
              <tr>
                <td className="p-4 text-slate-400">
                  Uncertainty Interval [Low – High]
                </td>
                {calculations.map((c, idx) => (
                  <td key={idx} className="p-4 font-mono text-slate-300">
                    {c ? `[${Math.round(c.total.low).toLocaleString()} – ${Math.round(c.total.high).toLocaleString()}]` : '—'}
                  </td>
                ))}
              </tr>

              {/* Percent Reduction */}
              <tr className="bg-teal-950/20">
                <td className="p-4 font-bold text-teal-300">
                  Virgin Material Reduction %
                </td>
                {calculations.map((c, idx) => (
                  <td key={idx} className="p-4 font-mono font-bold text-sm text-teal-300">
                    {c ? `${c.percent.central.toFixed(1)}%` : '—'}
                    {c && (
                      <span className="text-slate-400 font-normal text-[11px] block">
                        [{c.percent.low.toFixed(1)}% – {c.percent.high.toFixed(1)}%]
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Baseline Material */}
              <tr>
                <td className="p-4 text-slate-400">Baseline Virgin Requirement</td>
                {calculations.map((c, idx) => (
                  <td key={idx} className="p-4 font-mono text-slate-200">
                    {c ? `${Math.round(c.baseline.central).toLocaleString()} t/yr` : '—'}
                  </td>
                ))}
              </tr>

              {/* Section Header: Mechanism Breakdown */}
              <tr className="bg-slate-950/50">
                <td colSpan={scenarios.length + 1} className="p-3 font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                  Mechanism Breakdown (Central Tonnes)
                </td>
              </tr>

              {[
                { id: 'slowingFlows', label: 'Slowing Loops - Lifetime Extension (Flows)' },
                { id: 'slowingStocks', label: 'Slowing Loops - Wardrobe Activation (Stocks)' },
                { id: 'closingFlows', label: 'Closing Loops - Design for Recyclability (Flows)' },
                { id: 'closingStocks', label: 'Closing Loops - Take-back & Post-consumer (Stocks)' },
                { id: 'lifeFlows', label: 'Life Cycle - Material & Waste Avoidance (Flows)' },
              ].map(m => (
                <tr key={m.id}>
                  <td className="p-4 text-slate-300 pl-6">{m.label}</td>
                  {calculations.map((c, idx) => {
                    const cell = c?.cells.find(x => x.id === m.id);
                    return (
                      <td key={idx} className="p-4 font-mono text-slate-300">
                        {cell ? `${Math.round(cell.central).toLocaleString()} t` : '0 t'}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Section Header: Key Assumptions */}
              <tr className="bg-slate-950/50">
                <td colSpan={scenarios.length + 1} className="p-3 font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                  Key Strategic Parameter Inputs
                </td>
              </tr>

              {keyParamIds.map(pId => {
                const paramDef = parameters.find(p => p.id === pId);
                if (!paramDef) return null;
                const isShare = paramDef.unit === 'share';

                return (
                  <tr key={pId}>
                    <td className="p-4 text-slate-300 pl-6">
                      {paramDef.label} ({paramDef.unit})
                    </td>
                    {scenarios.map((s, idx) => {
                      const val = (s.inputs as Record<string, number>)[pId];
                      return (
                        <td key={idx} className="p-4 font-mono text-slate-200">
                          {isShare ? `${Math.round(val * 100)}%` : val.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
