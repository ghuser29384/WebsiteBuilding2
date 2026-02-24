import React from "react";
import type { CoherenceReport, CoherenceWeights, Suggestion } from "../lib/wreClient";

interface CoherencePanelProps {
  report?: CoherenceReport;
  weights: CoherenceWeights;
  isRunning: boolean;
  onChangeWeight: (key: keyof CoherenceWeights, value: number) => void;
  onRun: () => Promise<void> | void;
  onAcceptSuggestion: (suggestion: Suggestion) => void;
}

export const CoherencePanel: React.FC<CoherencePanelProps> = ({
  report,
  weights,
  isRunning,
  onChangeWeight,
  onRun,
  onAcceptSuggestion,
}) => {
  const formatScore = (value: number): string => value.toFixed(2);

  return (
    <section className="rounded-xl border border-slate-200 bg-white" aria-label="Coherence panel">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold text-slate-900">Coherence Panel</h2>
        <p className="mt-1 text-xs text-slate-600">
          Assistive metric only. Not proof of moral correctness.
        </p>
      </header>

      <div className="space-y-3 p-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Score Weights</h3>
          <p className="mt-1 text-xs text-slate-500">Agreement, support confidence, and parsimony penalty.</p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <label className="text-xs font-medium text-slate-700">
              AgreementRatio ({weights.agreementRatio.toFixed(2)})
              <input
                aria-label="Agreement weight"
                className="mt-1 w-full"
                max={1}
                min={0}
                step={0.01}
                type="range"
                value={weights.agreementRatio}
                onChange={(event) => onChangeWeight("agreementRatio", Number(event.target.value) || 0)}
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              AvgConfidenceSupported ({weights.avgConfidenceSupported.toFixed(2)})
              <input
                aria-label="Supported confidence weight"
                className="mt-1 w-full"
                max={1}
                min={0}
                step={0.01}
                type="range"
                value={weights.avgConfidenceSupported}
                onChange={(event) =>
                  onChangeWeight("avgConfidenceSupported", Number(event.target.value) || 0)
                }
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              ParsimonyPenalty ({weights.parsimonyPenalty.toFixed(2)})
              <input
                aria-label="Parsimony weight"
                className="mt-1 w-full"
                max={1}
                min={0}
                step={0.01}
                type="range"
                value={weights.parsimonyPenalty}
                onChange={(event) => onChangeWeight("parsimonyPenalty", Number(event.target.value) || 0)}
              />
            </label>
          </div>
        </div>

        <button
          aria-label="Run coherence engine"
          className="w-full rounded-md bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={isRunning}
          onClick={() => {
            void onRun();
          }}
          type="button"
        >
          {isRunning ? "Running..." : "Run Coherence Engine (Ctrl/Cmd + Enter)"}
        </button>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Current Report</h3>
          {report ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">Coherence score: {formatScore(report.coherenceScore)} / 100</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>AgreementRatio: {formatScore(report.breakdown.agreementRatio)}</li>
                <li>AvgConfidenceSupported: {formatScore(report.breakdown.avgConfidenceSupported)}</li>
                <li>ParsimonyPenalty: {formatScore(report.breakdown.parsimonyPenalty)}</li>
                <li>
                  Timed out: {report.timedOut ? "yes" : "no"} ({report.durationMs.toFixed(1)} ms)
                </li>
              </ul>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Run the engine to view coherence diagnostics.</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Minimal conflicts</h3>
          <ul className="mt-1 space-y-2 text-xs text-slate-700">
            {!report || report.minimalConflicts.length === 0 ? (
              <li className="rounded-md border border-dashed border-slate-300 p-2 text-slate-500">No explicit conflicts found.</li>
            ) : null}
            {report?.minimalConflicts.map((conflict) => (
              <li key={`${conflict.ids.join("-")}-${conflict.reason}`} className="rounded-md border border-slate-200 bg-white p-2">
                <p className="font-medium text-slate-800">{conflict.ids.join(" + ")}</p>
                <p className="mt-1 text-slate-600">{conflict.reason}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Suggested minimal revisions</h3>
          <p className="mt-1 text-xs text-slate-500">Accept top suggestion with Ctrl/Cmd + 1.</p>
          <ul className="mt-2 space-y-2">
            {!report || report.suggestions.length === 0 ? (
              <li className="rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-500">No revisions suggested.</li>
            ) : null}
            {report?.suggestions.map((suggestion) => (
              <li key={suggestion.id} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-900">{suggestion.title}</h4>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    +{suggestion.effectEstimate.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{suggestion.explanation}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Targets: {suggestion.targetIds.join(", ")} | Predicted score: {suggestion.predictedCoherence.toFixed(2)}
                </p>
                <button
                  aria-label={`Accept suggestion ${suggestion.id}`}
                  className="mt-2 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                  type="button"
                  onClick={() => onAcceptSuggestion(suggestion)}
                >
                  Accept suggestion
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default CoherencePanel;
