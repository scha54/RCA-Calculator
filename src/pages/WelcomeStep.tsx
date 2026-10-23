import React, { useRef } from 'react';
import type { Scenario } from '../engine/model';
import { examples, fresh } from '../engine/model';
import { readScenarioFromFile } from '../export/json';
import {
  Sparkles,
  TrendingDown,
  RefreshCw,
  Activity,
  ShieldCheck,
  ChevronRight,
  Upload,
  Plus,
} from '../components/Icons';

interface WelcomeStepProps {
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  currentScenario,
  onSelectScenario,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const res = await readScenarioFromFile(file);
    e.target.value = '';
    if (res.scenario) {
      onSelectScenario(res.scenario);
      onNext();
    } else if (res.errors) {
      setUploadError(res.errors.join(' '));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-4">
            <Sparkles size={14} />
            <span>WRAP Circular Fashion Framework</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Rapid Circularity Assessment <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              (RCA Calculator)
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Quantify the net virgin textile material saved by circular business models.
            Explicitly account for consumer substitution, unintended rebound consumption,
            and uncertainty bands across Slowing, Closing, and Life Cycle interventions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              id="start-assessment-btn"
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <span>Continue with Current Scenario</span>
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => {
                onSelectScenario(fresh());
                onNext();
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Start Blank Assessment</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              <Upload size={16} />
              <span>Upload JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {uploadError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs">
              {uploadError}
            </div>
          )}
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Circular Pillars Overview */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          The 4 Pillars of the RCA Methodology
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <TrendingDown size={20} />
            </div>
            <h3 className="font-bold text-white text-base">1. Slowing Loops</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Extending the functional lifespan of garments and activating idle wardrobe stock
              to directly displace new virgin garment production.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-teal-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
              <RefreshCw size={20} />
            </div>
            <h3 className="font-bold text-white text-base">2. Closing Loops</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Designing for recyclability, expanding post-consumer collection, and achieving
              fibre-to-fibre recycling yields over conventional waste pathways.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Activity size={20} />
            </div>
            <h3 className="font-bold text-white text-base">3. Life Cycle</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Material efficiencies in manufacturing, cutting waste avoidance, and user-phase
              laundry & garment care improvements.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-base">4. Systems & Rebound</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Quantifying rebound consumption (where cost savings or convenience spur additional buying)
              and qualitative unintended systemic risks.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Archetypes Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Explore Reference Business Model Archetypes
            </h2>
            <p className="text-xs text-slate-400">
              Load an illustrative preset scenario with benchmarked textile parameters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examples.map((ex, idx) => {
            const isCurrent = currentScenario.name === ex.name;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
                onClick={() => {
                  onSelectScenario(structuredClone(ex) as Scenario);
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-100 text-base">{ex.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {ex.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                      Region: {ex.region}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                      Mode: {ex.mode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectScenario(structuredClone(ex) as Scenario);
                      onNext();
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Load & Configure</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
