import React from "react";
import { reportDiagnostic, STORAGE_KEY } from "../platform/diagnostics";
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean; backupError: string }
> {
  state = { failed: false, backupError: "" };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    reportDiagnostic("render_failure");
  }
  downloadBackup = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) throw Error("No backup");
      const url = URL.createObjectURL(
        new Blob([data], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "rca_saved_assessments_backup.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      reportDiagnostic("backup_failure");
      this.setState({
        backupError:
          "Saved data could not be downloaded. Browser storage may be unavailable.",
      });
    }
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-4">
        <h1 className="text-2xl font-bold">
          The calculator could not display this screen
        </h1>
        <p role="alert">
          Reload to recover from an application error or an outdated deployment.
          Saved assessments have not been cleared. A backup contains the
          browser’s last saved data and may exclude unsaved changes.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button
            className="rounded border p-3"
            onClick={() => window.location.reload()}
          >
            Reload application
          </button>
          <button className="rounded border p-3" onClick={this.downloadBackup}>
            Download saved assessments
          </button>
        </div>
        {this.state.backupError && <p role="alert">{this.state.backupError}</p>}
        <p className="text-sm">
          Application version {__APP_VERSION__}. Reference revision{" "}
          {__BUILD_REVISION__}.
        </p>
      </main>
    );
  }
}
