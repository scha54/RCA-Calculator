import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { reportDiagnostic } from "./platform/diagnostics";
window.addEventListener("error", () => reportDiagnostic("uncaught_error"));
window.addEventListener("unhandledrejection", () =>
  reportDiagnostic("unhandled_rejection"),
);
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
