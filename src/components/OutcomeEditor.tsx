import React from "react";
import type { Scenario } from "../engine/model";
import {
  emptyOutcomes,
  outcomeFields,
  outcomeGroups,
  type OutcomeGroup,
  type OutcomeInputs,
} from "../engine/outcomes";
export function OutcomeEditor({
  scenario,
  onChange,
}: {
  scenario: Scenario;
  onChange: (outcomes: OutcomeInputs) => void;
}) {
  const o = scenario.outcomes ?? emptyOutcomes();
  return (
    <section className="outcome-editor rounded-2xl border border-slate-700 p-5 space-y-4">
      <h2 className="text-xl font-bold">
        Additional environmental & worker outcomes
      </h2>
      <p className="text-sm text-slate-300">
        Optional annual screening estimates. Enter measured activities and
        applicable factors; no benchmark factors are assumed. Positive savings
        mean an improvement, negative savings mean an increase. Modules must
        cover distinct activities to avoid double counting. Employment and
        income are separate indicators, not a social benefit score.
      </p>
      <label className="block">
        Activity and factor uncertainty (0–100%){" "}
        <input
          aria-label="Outcome uncertainty percent"
          type="number"
          min="0"
          max="100"
          value={o.uncertainty * 100}
          onChange={(e) =>
            onChange({
              ...o,
              uncertainty: Math.min(
                1,
                Math.max(0, Number(e.target.value) / 100),
              ),
            })
          }
        />
      </label>
      <p className="text-xs text-slate-300">
        Bounds independently vary each input and factor by this percentage; they
        are conservative scenario bounds, not statistical confidence intervals.
        Material bounds also propagate into production estimates.
      </p>
      {(Object.keys(outcomeGroups) as OutcomeGroup[]).map((group) => (
        <fieldset
          key={group}
          className="border border-slate-700 rounded-xl p-4 space-y-3"
        >
          <legend className="px-2">
            <label>
              <input
                type="checkbox"
                checked={o.enabled[group]}
                onChange={(e) =>
                  onChange({
                    ...o,
                    enabled: { ...o.enabled, [group]: e.target.checked },
                  })
                }
              />{" "}
              Model {outcomeGroups[group]}
            </label>
          </legend>
          {o.enabled[group] && (
            <>
              <label className="block">
                Sources, year, geography & system boundary (required for
                reports)
                <textarea
                  maxLength={20000}
                  aria-label={`${outcomeGroups[group]} sources`}
                  value={o.sources[group]}
                  onChange={(e) =>
                    onChange({
                      ...o,
                      sources: { ...o.sources, [group]: e.target.value },
                    })
                  }
                  className="block w-full"
                />
              </label>
              {group === "production" && (
                <p className="text-sm text-amber-200">
                  Use virgin textile production factors excluding the freight
                  and care activities modelled separately. Enter all additional
                  processing burdens, including recycling and repair. Material
                  credits are capped at baseline virgin demand. These estimates
                  are not a comparative life cycle assessment.
                </p>
              )}
              {group === "transport" && (
                <p className="text-sm text-slate-300">
                  Include all affected freight and reverse logistics. This
                  module does not model passenger travel.
                </p>
              )}
              {group === "social" && (
                <label className="block">
                  Currency code{" "}
                  <input
                    aria-label="Currency code"
                    maxLength={3}
                    value={o.currency}
                    onChange={(e) =>
                      onChange({ ...o, currency: e.target.value.toUpperCase() })
                    }
                  />
                </label>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outcomeFields
                  .filter((f) => f.group === group)
                  .map((f) => (
                    <label
                      key={f.id}
                      className="block text-sm"
                      htmlFor={`outcome-${f.id}`}
                    >
                      {f.label} ({f.unit})
                      <input
                        id={`outcome-${f.id}`}
                        type="number"
                        min={0}
                        max={f.max}
                        step="any"
                        value={o.values[f.id]}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (Number.isFinite(value))
                            onChange({
                              ...o,
                              values: {
                                ...o.values,
                                [f.id]: Math.min(f.max, Math.max(0, value)),
                              },
                            });
                        }}
                        className="block w-full"
                      />
                    </label>
                  ))}
              </div>
            </>
          )}
        </fieldset>
      ))}
    </section>
  );
}
