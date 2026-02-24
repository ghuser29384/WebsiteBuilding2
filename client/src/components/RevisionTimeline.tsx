import React from "react";
import type { RevisionEntry } from "../lib/wreClient";

interface RevisionTimelineProps {
  entries: RevisionEntry[];
}

export const RevisionTimeline: React.FC<RevisionTimelineProps> = ({ entries }) => {
  const ordered = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <section className="rounded-xl border border-slate-200 bg-white" aria-label="Revision timeline">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold text-slate-900">Revision Log</h2>
        <p className="mt-1 text-xs text-slate-600">Every operation with timestamp and actor placeholder.</p>
      </header>
      <ul className="max-h-64 space-y-2 overflow-auto p-3">
        {ordered.length === 0 ? (
          <li className="rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-500">
            No revisions logged yet.
          </li>
        ) : null}
        {ordered.map((entry) => (
          <li key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
            <p className="text-xs font-semibold text-slate-800">{entry.operation}</p>
            <p className="mt-0.5 text-xs text-slate-600">{entry.details}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {new Date(entry.timestamp).toLocaleString()} · actor: {entry.actorId}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RevisionTimeline;
