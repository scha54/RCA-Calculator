import React from 'react';
import benchmarks from '../../data/benchmarks.json';
import { Info, AlertTriangle, Check, ExternalLink } from './Icons';

interface InputCardProps {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  help: string;
  benchmarkId: string | null;
  region: 'UK' | 'EU' | 'US';
  onChange: (value: number) => void;
  confirmed?: boolean;
  onConfirmChange?: (confirmed: boolean) => void;
}

export const InputCard: React.FC<InputCardProps> = ({
  id,
  label,
  value,
  unit,
  min,
  max,
  help,
  benchmarkId,
  region,
  onChange,
  confirmed,
  onConfirmChange,
}) => {
  const [showHelp, setShowHelp] = React.useState(false);

  // Find regional benchmark if exists
  const benchmark = React.useMemo(() => {
    if (!benchmarkId) return null;
    return benchmarks.find(b => b.id === benchmarkId && b.region === region) ||
      benchmarks.find(b => b.id === benchmarkId);
  }, [benchmarkId, region]);

  const isShare = unit === 'share';
  const displayValue = isShare ? Math.round(value * 1000) / 10 : value;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    if (!isNaN(rawVal)) {
      onChange(rawVal);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const clamped = Math.max(min, Math.min(max, val));
      onChange(clamped);
    }
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value);
    if (!isNaN(pct)) {
      const fraction = Math.max(min, Math.min(max, pct / 100));
      onChange(fraction);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all duration-200 shadow-sm relative group">
      {/* Title & Unit Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <label htmlFor={`input-${id}`} className="font-semibold text-slate-100 text-sm sm:text-base">
              {label}
            </label>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-slate-400 hover:text-emerald-400 p-0.5 rounded transition"
              title="Toggle parameter explanation"
            >
              <Info size={15} />
            </button>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
              {unit}
            </span>
            <span>Range: {min} – {max}{isShare ? ` (${min * 100}% – ${max * 100}%)` : ''}</span>
          </div>
        </div>

        {/* Input box */}
        <div className="flex items-center gap-1.5">
          {isShare ? (
            <div className="relative flex items-center">
              <input
                id={`input-${id}`}
                type="number"
                step="0.1"
                min={min * 100}
                max={max * 100}
                value={displayValue}
                onChange={handlePercentageChange}
                className="w-24 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-right pr-6 pl-2 py-1.5 rounded-lg text-slate-100 font-mono text-sm font-semibold transition"
              />
              <span className="absolute right-2 text-slate-400 text-xs font-semibold pointer-events-none">
                %
              </span>
            </div>
          ) : (
            <input
              id={`input-${id}`}
              type="number"
              step={max <= 10 ? '0.01' : max <= 1000 ? '1' : '100'}
              min={min}
              max={max}
              value={value}
              onChange={handleNumberChange}
              className="w-28 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-right px-2.5 py-1.5 rounded-lg text-slate-100 font-mono text-sm font-semibold transition"
            />
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="my-3">
        <input
          type="range"
          id={`slider-${id}`}
          min={min}
          max={max}
          step={isShare ? (max <= 1 ? 0.01 : 0.05) : (max <= 20 ? 0.01 : max <= 1000 ? 1 : 1000)}
          value={value}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
        />
      </div>

      {/* Benchmark Banner if applicable */}
      {benchmark && (
        <div className="mt-2.5 flex items-center justify-between text-xs bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-3 py-2 text-emerald-200">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-semibold text-emerald-400 whitespace-nowrap">
              {benchmark.region} Benchmark:
            </span>
            <span className="truncate text-slate-300">
              {benchmark.sourceName} ({isShare ? `${Math.round(benchmark.value * 100)}%` : `${benchmark.value} ${unit}`})
            </span>
            {benchmark.sourceUrl && (
              <a
                href={benchmark.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 ml-1 inline-flex"
                title="View evidence source"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(benchmark.value)}
            className="ml-2 px-2 py-0.5 rounded-md bg-emerald-600/40 hover:bg-emerald-600 text-white font-medium text-[11px] whitespace-nowrap transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Confirmation box if substitutionRate or reboundFactor */}
      {onConfirmChange !== undefined && (
        <div
          className={`mt-3 p-3 rounded-xl border transition-all ${
            confirmed
              ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-600/40 text-amber-200'
          }`}
        >
          <label className="flex items-start gap-2.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              id={`confirm-${id}`}
              checked={confirmed}
              onChange={e => onConfirmChange(e.target.checked)}
              className="mt-0.5 rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-400"
            />
            <div className="leading-snug">
              <div className="font-semibold flex items-center gap-1.5">
                {confirmed ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
                <span>Assumption Review & Sign-Off Required</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {id === 'substitutionRate'
                  ? 'I confirm this substitution rate realistically reflects customer displacement of new garments (not just supplemental shopping).'
                  : 'I confirm this rebound factor reflects potential consumer re-spending, increased cleaning, or lower care that could erode circular savings.'}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Help disclosure */}
      {showHelp && (
        <div className="mt-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 animate-fadeIn">
          <p className="font-medium text-slate-200 mb-1">Methodology & Guidance:</p>
          <p>{help}</p>
          {benchmark?.notes && (
            <p className="mt-1.5 text-slate-400 italic">
              Note: {benchmark.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
