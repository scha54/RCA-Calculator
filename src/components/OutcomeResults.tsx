import React from "react";
import type { Scenario } from "../engine/model";
import { calculate } from "../engine/calculate";
import {
  calculateOutcomes,
  outcomeGroups,
  type OutcomeGroup,
} from "../engine/outcomes";
export function OutcomeResults({ scenario }: { scenario: Scenario }) {
  const metrics = calculateOutcomes(scenario, calculate(scenario).total);
  return (
    <section className="rounded-2xl border border-slate-700 p-5 space-y-3">
      <h3 className="text-lg font-bold">Additional outcome estimates</h3>
      <p className="text-sm text-slate-300">
        Annual screening estimates; positive savings mean avoided burdens,
        negative savings mean increased burdens. Social indicators are not
        included in environmental totals. Bounds are scenario intervals, not
        statistical confidence intervals.
      </p>
      <p className="text-sm">
        Not assessed:{" "}
        {(Object.keys(outcomeGroups) as OutcomeGroup[])
          .filter((g) => !scenario.outcomes?.enabled[g])
          .map((g) => outcomeGroups[g])
          .join(", ") || "none"}
        .
      </p>
      {!!metrics.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Additional annual outcome estimates and bounds
            </caption>
            <thead>
              <tr>
                <th scope="col">Outcome</th>
                <th scope="col">Central</th>
                <th scope="col">Lower</th>
                <th scope="col">Upper</th>
                <th scope="col">Unit</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id}>
                  <th scope="row" className="text-left py-2">
                    {m.label}
                  </th>
                  {[m.range.central, m.range.low, m.range.high].map((v, i) => (
                    <td key={i}>
                      {v.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  ))}
                  <td>{m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {scenario.outcomes &&
        (Object.keys(outcomeGroups) as OutcomeGroup[])
          .filter((g) => scenario.outcomes?.enabled[g])
          .map((g) => (
            <p key={g} className="text-sm">
              <strong>{outcomeGroups[g]} sources & boundary: </strong>
              {scenario.outcomes!.sources[g] || "Not documented — draft only"}
            </p>
          ))}
    </section>
  );
}
