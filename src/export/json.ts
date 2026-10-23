import type { Scenario } from "../engine/model";
import { parseScenario, MAX_SCENARIO_BYTES } from "../engine/model";

export function downloadScenarioAsJson(scenario: Scenario): void {
  const jsonStr = JSON.stringify(scenario, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_rca_scenario.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function readScenarioFromFile(
  file: File,
): Promise<{ scenario?: Scenario; errors?: string[] }> {
  try {
    if (file.size > MAX_SCENARIO_BYTES)
      return { errors: ["Scenario files must be no larger than 1 MB."] };
    const text = await file.text();
    const scenario = parseScenario(text);
    return { scenario };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { errors: [err.message] };
    }
    return {
      errors: ["An unknown error occurred while reading the scenario file."],
    };
  }
}
