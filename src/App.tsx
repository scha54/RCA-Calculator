import React, { useState, useEffect, lazy, Suspense } from "react";
import type { Scenario, Inputs, Confidence } from "./engine/model";
import {
  examples,
  fresh,
  restoreScenarios,
  reportErrors,
} from "./engine/model";
import settings from "../data/settings.json";
import { Header } from "./components/Header";
import { Stepper } from "./components/Stepper";
import { LiveSummaryBar } from "./components/LiveSummaryBar";
import { WelcomeStep } from "./pages/WelcomeStep";
import { SetupStep } from "./pages/SetupStep";
import { BusinessModelStep } from "./pages/BusinessModelStep";
import { SlowingStep } from "./pages/SlowingStep";
import { ClosingStep } from "./pages/ClosingStep";
import { LifeCycleStep } from "./pages/LifeCycleStep";
import { SystemsStep } from "./pages/SystemsStep";
const ResultsStep = lazy(() =>
  import("./pages/ResultsStep").then((m) => ({ default: m.ResultsStep })),
);
const ExportStep = lazy(() =>
  import("./pages/ExportStep").then((m) => ({ default: m.ExportStep })),
);
import { OutcomeEditor } from "./components/OutcomeEditor";
const CompareView = lazy(() =>
  import("./pages/CompareView").then((m) => ({ default: m.CompareView })),
);

import { STORAGE_KEY, reportDiagnostic } from "./platform/diagnostics";

export const App: React.FC = () => {
  const [restored] = useState(() => {
    try {
      return restoreScenarios(localStorage.getItem(STORAGE_KEY));
    } catch {
      return { scenarios: [], rejected: 1 };
    }
  });
  const [scenarios, setScenarios] = useState<Scenario[]>(() =>
    restored.scenarios.length
      ? restored.scenarios
      : (structuredClone(
          examples.slice(0, settings.maxScenarios),
        ) as Scenario[]),
  );
  const [storageWarning, setStorageWarning] = useState(
    restored.rejected
      ? `${restored.rejected} invalid saved scenario(s) could not be loaded. Valid scenarios were retained. The original saved data has been left untouched; download any usable scenarios before enabling saving.`
      : "",
  );
  const [savingEnabled, setSavingEnabled] = useState(!restored.rejected);

  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    if (!savingEnabled) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      reportDiagnostic("storage_failure");
      setStorageWarning(
        "Browser storage is unavailable or full. Download a JSON backup to preserve your changes.",
      );
    }
  }, [scenarios, savingEnabled]);

  // Ensure activeScenarioIndex is valid
  const safeIndex = Math.min(activeScenarioIndex, scenarios.length - 1);
  const currentScenario = scenarios[safeIndex] || (examples[0] as Scenario);

  // Updaters
  const handleUpdateScenario = (updated: Partial<Scenario>) => {
    setScenarios((prev) => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        ...updated,
        confirmed:
          updated.inputs ||
          updated.bands ||
          updated.outcomes ||
          updated.region ||
          updated.mode ||
          updated.baselineConfidence
            ? { substitutionRate: false, reboundFactor: false }
            : (updated.confirmed ?? copy[safeIndex].confirmed),
      };
      return copy;
    });
  };

  const handleUpdateInputs = (updated: Partial<Inputs>) => {
    setScenarios((prev) => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        inputs: {
          ...copy[safeIndex].inputs,
          ...Object.fromEntries(
            Object.entries(updated).filter(
              (entry): entry is [string, number] =>
                typeof entry[1] === "number",
            ),
          ),
        },
        confirmed: { substitutionRate: false, reboundFactor: false },
      };
      return copy;
    });
  };

  const handleUpdateConfidence = (dimensionId: string, level: Confidence) => {
    setScenarios((prev) => {
      const copy = [...prev];
      copy[safeIndex] = {
        ...copy[safeIndex],
        confidence: {
          ...copy[safeIndex].confidence,
          [dimensionId]: level,
        },
        confirmed: { substitutionRate: false, reboundFactor: false },
      };
      return copy;
    });
  };

  const handleConfirmChange = (
    key: "substitutionRate" | "reboundFactor",
    confirmed: boolean,
  ) => {
    setScenarios((prev) => {
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
    setScenarios((prev) => {
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

  const handleUpdateNote = (
    index: number,
    text: string,
    risk: "low" | "medium" | "high",
  ) => {
    setScenarios((prev) => {
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
      alert(
        `Maximum of ${settings.maxScenarios} scenarios reached. Please delete or overwrite one.`,
      );
      return;
    }
    const newScen = fresh();
    newScen.name = `Scenario ${scenarios.length + 1}`;
    setScenarios((prev) => [...prev, newScen]);
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
    setScenarios((prev) => [...prev, dup]);
    setActiveScenarioIndex(scenarios.length);
  };

  const handleDeleteScenario = () => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((_, i) => i !== safeIndex));
    setActiveScenarioIndex(0);
  };

  const handleSelectScenario = (index: number) => {
    setActiveScenarioIndex(index);
  };

  const handleImportScenario = (scen: Scenario) => {
    setScenarios((prev) => {
      const copy = [...prev];
      copy[safeIndex] = scen;
      return copy;
    });
  };

  // Step navigation
  const handleNextStep = () => {
    if (currentStepIndex < settings.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectStep = (idx: number) => {
    setCurrentStepIndex(idx);
    setIsComparing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
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

      {storageWarning && (
        <div role="alert" className="p-4 bg-amber-950 text-amber-100">
          {storageWarning}
          {!savingEnabled && (
            <button
              onClick={() => {
                setSavingEnabled(true);
                setStorageWarning("");
              }}
              className="ml-3 underline"
            >
              Enable saving and replace invalid stored data
            </button>
          )}
        </div>
      )}
      {!!reportErrors(currentScenario).length && (
        <div
          role="status"
          className="draft-notice p-3 bg-amber-950 text-amber-100"
        >
          Draft assessment — {reportErrors(currentScenario).join(" ")}
        </div>
      )}
      {/* Stepper Navigation (hidden in compare view) */}
      {!isComparing && (
        <Stepper
          currentStepIndex={currentStepIndex}
          onSelectStep={handleSelectStep}
        />
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-24"
      >
        {isComparing ? (
          <Suspense fallback={<p role="status">Loading comparison…</p>}>
            <CompareView
              scenarios={scenarios}
              onSelectScenario={handleSelectScenario}
              onClose={() => setIsComparing(false)}
            />
          </Suspense>
        ) : (
          <>
            {currentStepIndex === 0 && (
              <WelcomeStep
                currentScenario={currentScenario}
                onSelectScenario={(scen) => {
                  handleUpdateScenario(scen);
                }}
                onNext={handleNextStep}
              />
            )}

            {currentStepIndex === 1 && (
              <>
                <SetupStep
                  scenario={currentScenario}
                  onUpdateInputs={handleUpdateInputs}
                  onNext={handleNextStep}
                />
                <label className="block my-4">
                  Baseline input confidence{" "}
                  <select
                    aria-label="Baseline input confidence"
                    value={currentScenario.baselineConfidence ?? "medium"}
                    onChange={(e) =>
                      handleUpdateScenario({
                        baselineConfidence: e.target.value as Confidence,
                      })
                    }
                  >
                    {["low", "medium", "high"].map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
              </>
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
              <>
                <LifeCycleStep
                  scenario={currentScenario}
                  onUpdateInputs={handleUpdateInputs}
                  onUpdateConfidence={handleUpdateConfidence}
                  onUpdateChecklist={handleUpdateChecklist}
                  onNext={handleNextStep}
                />
                <OutcomeEditor
                  scenario={currentScenario}
                  onChange={(outcomes) => handleUpdateScenario({ outcomes })}
                />
              </>
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
              <Suspense fallback={<p role="status">Loading results…</p>}>
                <ResultsStep
                  scenario={currentScenario}
                  onNext={handleNextStep}
                  onNavigateStep={handleSelectStep}
                />
              </Suspense>
            )}

            {currentStepIndex === 8 && (
              <Suspense fallback={<p role="status">Loading export tools…</p>}>
                <ExportStep
                  scenario={currentScenario}
                  onImportScenario={handleImportScenario}
                  onBackToResults={() => handleSelectStep(7)}
                />
              </Suspense>
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
