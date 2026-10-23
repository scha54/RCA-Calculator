import React from 'react';
import type { Confidence } from '../engine/model';
import bands from '../../data/confidence.json';
import { ShieldCheck } from './Icons';

interface ConfidencePickerProps {
  id: string;
  dimensionName: string;
  value: Confidence;
  onChange: (level: Confidence) => void;
  customBands?: Record<Confidence, number>;
}

export const ConfidencePicker: React.FC<ConfidencePickerProps> = ({
  id,
  dimensionName,
  value,
  onChange,
  customBands = bands,
}) => {
  const options: Array<{ level: Confidence; label: string; desc: string }> = [
    {
      level: 'high',
      label: 'High Confidence',
      desc: `±${Math.round(customBands.high * 100)}% (Audited primary data or robust trials)`,
    },
    {
      level: 'medium',
      label: 'Medium Confidence',
      desc: `±${Math.round(customBands.medium * 100)}% (Industry benchmarks & pilot data)`,
    },
    {
      level: 'low',
      label: 'Low / Exploratory',
      desc: `±${Math.round(customBands.low * 100)}% (Early screening & expert estimates)`,
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 my-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" />
          <h4 className="text-sm font-bold text-slate-200">
            Uncertainty & Data Confidence: <span className="text-emerald-400">{dimensionName}</span>
          </h4>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          Current: {value.toUpperCase()} (±{Math.round(customBands[value] * 100)}%)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {options.map(opt => {
          const isSelected = value === opt.level;
          return (
            <button
              type="button"
              key={opt.level}
              id={`confidence-${id}-${opt.level}`}
              aria-pressed={isSelected}
              onClick={() => onChange(opt.level)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {opt.label}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    opt.level === 'high'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : opt.level === 'medium'
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  ±{Math.round(customBands[opt.level] * 100)}%
                </span>
              </div>
              <p className="text-[11px] leading-snug text-slate-400">
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
