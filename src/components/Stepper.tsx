import React from 'react';
import settings from '../../data/settings.json';
import {
  Sparkles,
  Sliders,
  Layers,
  TrendingDown,
  RefreshCw,
  Activity,
  ShieldCheck,
  BarChart3,
  Download,
  Check,
} from './Icons';

interface StepperProps {
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  completedSteps?: number[];
}

const STEP_ICONS = [
  Sparkles,      // Welcome
  Sliders,       // Setup
  Layers,        // Business model
  TrendingDown,  // Slowing
  RefreshCw,     // Closing
  Activity,      // Life cycle
  ShieldCheck,   // Systems
  BarChart3,     // Results
  Download,      // Export
];

export const Stepper: React.FC<StepperProps> = ({
  currentStepIndex,
  onSelectStep,
  completedSteps = [],
}) => {
  const steps = settings.steps;
  const progressPercent = Math.round((currentStepIndex / (steps.length - 1)) * 100);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 py-3 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Horizontal scrollable stepper */}
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none py-1 gap-2">
          {steps.map((step, idx) => {
            const Icon = STEP_ICONS[idx] || Sparkles;
            const isActive = idx === currentStepIndex;
            const isCompleted = completedSteps.includes(idx);

            return (
              <button
                key={step}
                id={`step-nav-${idx}`}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onSelectStep(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/30 scale-102 ring-1 ring-emerald-400'
                    : isCompleted
                    ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 border border-emerald-900/40'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-700/60 text-slate-400 group-hover:bg-slate-700'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <Check size={12} />
                  ) : (
                    <Icon size={12} />
                  )}
                </div>
                <span>
                  <span className="mr-1">{idx + 1}.</span>
                  {step}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtle Progress Bar */}
        <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
