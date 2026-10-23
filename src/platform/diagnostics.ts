export const STORAGE_KEY = "rca_calculator_scenarios_v1";
export type DiagnosticEvent =
  | "render_failure"
  | "uncaught_error"
  | "unhandled_rejection"
  | "backup_failure"
  | "storage_failure";
// Never include exception messages, stacks, scenario values, names, URLs, or imported data.
// Hosting access logs and these local browser events are separate streams.
export function reportDiagnostic(event: DiagnosticEvent): void {
  console.error(
    JSON.stringify({
      event,
      version: __APP_VERSION__,
      revision: __BUILD_REVISION__,
    }),
  );
}
