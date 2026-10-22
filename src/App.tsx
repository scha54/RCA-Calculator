import React, { useState, useEffect } from 'react';
import type { Scenario, Inputs, Confidence } from './engine/model';
import { examples, fresh, validate } from './engine/model';
import settings from '../data/settings.json';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { LiveSummaryBar } from './components/LiveSummaryBar';
import { WelcomeStep } from './pages/WelcomeStep';
import { SetupStep } from './pages/SetupStep';
import { BusinessModelStep } from './pages/BusinessModelStep';
import { SlowingStep } from './pages/SlowingStep';
import { ClosingStep } from './pages/ClosingStep';
import { LifeCycleStep } from './pages/LifeCycleStep';
import { SystemsStep } from './pages/SystemsStep';
import { ResultsStep } from './pages/ResultsStep';
import { ExportStep } from './pages/ExportStep';
import { CompareView } from './pages/CompareView';

const STORAGE_KEY = 'rca_calculator_scenarios_v1';

export const App: React.FC = () => {
  // Load initial scenarios from localStorage or examples
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validList = parsed.filter(s => validate(s).length === 0);
          if (validList.length > 0) return validList as Scenario[];
        }
      }
    } catch {
      // Fallback to examples
    }
    return examples.slice(0, 3) as Scenario[];
  });

  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch (err) {
      console.warn('Unable to persist scenarios to localStorage:', err);
    }
  }, [scenarios]);

  // Ensure activeScenarioIndex is valid
  const safeIndex = Math.min(activeScenarioIndex, scenarios.length - 1);
  const currentScenario = scenarios[safeIndex] || (examples[0] as Scenario);

  // Updaters
  const handleUpdateScenario = (updated: Partial<Scenario>) => {
    setScenarios(prev => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        ...updated,
      };
      return copy;
    });
  };

  const handleUpdateInputs = (updated: Partial<Inputs>) => {
    setScenarios(prev => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        inputs: {
          ...copy[safeIndex].inputs,
          ...updated,
        },
      };
      return copy;
    });
  };

  const handleUpdateConfidence = (dimensionId: string, level: Confidence) => {
    setScenarios(prev => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        confidence: {
          ...copy[safeIndex].confidence,
          [dimensionId]: level,
        },
      };
      return copy;
    });
  };

  const handleConfirmChange = (key: 'substitutionRate' | 'reboundFactor', confirmed: boolean) => {
    setScenarios(prev => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        confirmed: {
          ...copy[safeIndex].confirmed,
          [key]: confirmed,
        },
      };
      return copy;
    });
  };

  const handleUpdateChecklist = (index: number, val: number) => {
    setScenarios(prev => {
      const copy = [...prev];
      const list = [...copy[safeIndex].checklist];
      list[index] = val;
      copy[safeIndex] = {
        ...copy[safeIndex],
        checklist: list,
      };
      return copy;
    });
  };

  const handleUpdateNote = (index: number, text: string, risk: 'low' | 'medium' | 'high') => {
    setScenarios(prev => {
      const copy = [...prev];
      const notes = [...copy[safeIndex].notes];
      notes[index] = { text, risk };
      copy[safeIndex] = {
        ...copy[safeIndex],
        notes,
      };
      return copy;
    });
  };

  // Scenario operations
  const handleNewScenario = () => {
    if (scenarios.length >= settings.maxScenarios) {
      alert(`Maximum of ${settings.maxScenarios} scenarios reached. Please delete or overwrite one.`);
      return;
    }
    const newScen = fresh();
    newScen.name = `Scenario ${scenarios.length + 1}`;
    setScenarios(prev => [...prev, newScen]);
    setActiveScenarioIndex(scenarios.length);
    setCurrentStepIndex(1); // Jump to setup
  };

  const handleDuplicateScenario = () => {
    if (scenarios.length >= settings.maxScenarios) {
      alert(`Maximum of ${settings.maxScenarios} scenarios reached.`);
      return;
    }
    const dup = structuredClone(currentScenario);
    dup.name = `${currentScenario.name} (Copy)`;
    setScenarios(prev => [...prev, dup]);
    setActiveScenarioIndex(scenarios.length);
  };

  const handleDeleteScenario = () => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter((_, i) => i !== safeIndex));
    setActiveScenarioIndex(0);
  };

  const handleSelectScenario = (index: number) => {
    setActiveScenarioIndex(index);
  };

  const handleImportScenario = (scen: Scenario) => {
    setScenarios(prev => {
      const copy = [...prev];
      copy[safeIndex] = scen;
      return copy;
    });
  };

  // Step navigation
  const handleNextStep = () => {
    if (currentStepIndex < settings.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectStep = (idx: number) => {
    setCurrentStepIndex(idx);
    setIsComparing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Sticky Header */}
      <Header
        scenarios={scenarios}
        activeScenarioIndex={safeIndex}
        onSelectScenario={handleSelectScenario}
        onNewScenario={handleNewScenario}
        onDuplicateScenario={handleDuplicateScenario}
        onDeleteScenario={handleDeleteScenario}
        onUpdateScenario={handleUpdateScenario}
        isComparing={isComparing}
        onToggleCompare={() => setIsComparing(!isComparing)}
      />

      {/* Stepper Navigation (hidden in compare view) */}
      {!isComparing && (
        <Stepper
          currentStepIndex={currentStepIndex}
          onSelectStep={handleSelectStep}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-24">
        {isComparing ? (
          <CompareView
            scenarios={scenarios}
            onSelectScenario={handleSelectScenario}
            onClose={() => setIsComparing(false)}
          />
        ) : (
          <>
            {currentStepIndex === 0 && (
              <WelcomeStep
                currentScenario={currentScenario}
                onSelectScenario={scen => {
                  handleUpdateScenario(scen);
                }}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 1 && (
              <SetupStep
                scenario={currentScenario}
                onUpdateInputs={handleUpdateInputs}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 2 && (
              <BusinessModelStep
                scenario={currentScenario}
                onUpdateScenario={handleUpdateScenario}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 3 && (
              <SlowingStep
                scenario={currentScenario}
                onUpdateInputs={handleUpdateInputs}
                onUpdateConfidence={handleUpdateConfidence}
                onConfirmChange={handleConfirmChange}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 4 && (
              <ClosingStep
                scenario={currentScenario}
                onUpdateInputs={handleUpdateInputs}
                onUpdateConfidence={handleUpdateConfidence}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 5 && (
              <LifeCycleStep
                scenario={currentScenario}
                onUpdateInputs={handleUpdateInputs}
                onUpdateConfidence={handleUpdateConfidence}
                onUpdateChecklist={handleUpdateChecklist}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 6 && (
              <SystemsStep
                scenario={currentScenario}
                onUpdateInputs={handleUpdateInputs}
                onUpdateConfidence={handleUpdateConfidence}
                onConfirmChange={handleConfirmChange}
                onUpdateNote={handleUpdateNote}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 7 && (
              <ResultsStep
                scenario={currentScenario}
                onNext={handleNextStep}
                onNavigateStep={handleSelectStep}
              />
            )}

            {currentStepIndex === 8 && (
              <ExportStep
                scenario={currentScenario}
                onImportScenario={handleImportScenario}
                onBackToResults={() => handleSelectStep(7)}
              />
            )}
          </>
        )}
      </main>

      {/* Pinned Bottom Live Summary Bar */}
      {!isComparing && (
        <LiveSummaryBar
          scenario={currentScenario}
          currentStepIndex={currentStepIndex}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
        />
      )}
    </div>
  );
};
