import React from 'react';
import type { Scenario, Inputs } from '../engine/model';
import { parameters } from '../engine/model';
import { evaluate } from '../engine/calculate';
import formulas from '../../data/formulas.json';
import { InputCard } from '../components/InputCard';
import { Sliders, Info, ChevronRight, Compass } from '../components/Icons';

interface SetupStepProps {
  scenario: Scenario;
  onUpdateInputs: (updated: Partial<Inputs>) => void;
  onNext: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  scenario,
  onUpdateInputs,
  onNext,
}) => {
  const inputs = scenario.inputs as Inputs;

  // Setup parameters (group: 'setup')
  const setupParams = parameters.filter(p => p.group === 'setup');

  // Baseline calculation
  const baselineTonnage = React.useMemo(() => {
    try {
      return evaluate(formulas.baseline, inputs);
    } catch {
      return 0;
    }
  }, [inputs]);

  const grossManufacturedTonnage = (inputs.itemsSold * inputs.avgWeightKg) / 1000;
  const currentRecycledTonnage =
    grossManufacturedTonnage * inputs.baselineCollectionRate * inputs.baselineRecyclingYield;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Step Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Sliders size={14} />
            <span>Step 1: Baseline Context</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Baseline Company Scope & Parameters
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Define your company's existing production volume, product characteristics, and current post-consumer collection rates.
          </p>
        </div>

        <button
          onClick={onNext}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Next: Business Model</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calculated Baseline Impact Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Computed Baseline Footprint
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {Math.round(baselineTonnage).toLocaleString()}{' '}
              <span className="text-lg font-normal text-slate-400">tonnes/yr</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              This represents your annual virgin textile requirement under current operations,
              accounting for standard garment weight and baseline recycling loops.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Gross Fabric Produced</span>
              <span className="text-slate-100 font-mono font-bold text-sm">
                {Math.round(grossManufacturedTonnage).toLocaleString()} t
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Baseline Recycled Fabric</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {Math.round(currentRecycledTonnage).toLocaleString()} t
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {setupParams.map(param => (
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

      {/* Methodology Explainer */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info size={16} className="text-emerald-400" />
          <span>Why is Baseline Collection & Recycling Yield Included?</span>
        </div>
        <p className="leading-relaxed">
          The RCA formula prevents double-counting by measuring <em>additional</em> material circularity.
          If 20% of your current production is already collected and 50% recycled into secondary yarn,
          those existing 10% virgin material savings are credited to the baseline, not as new circular savings.
        </p>
      </div>
    </div>
  );
};
