import React, { useMemo, useState } from "react";
import type { Judgment } from "../lib/wreClient";

interface NewJudgmentDraft {
  text: string;
  confidence: number;
  tags: string;
  sourceNote: string;
}

interface JudgmentListProps {
  judgments: Judgment[];
  selectedJudgmentId?: string;
  onSelectJudgment: (judgmentId: string) => void;
  onAddJudgment: (draft: {
    text: string;
    confidence: number;
    tags: string[];
    sourceNote: string;
    rejected?: boolean;
  }) => Promise<void> | void;
  onUpdateJudgment: (judgmentId: string, patch: Partial<Judgment>) => void;
  onDeleteJudgment: (judgmentId: string) => void;
}

const defaultDraft: NewJudgmentDraft = {
  text: "",
  confidence: 65,
  tags: "",
  sourceNote: "",
};

const parseTags = (value: string): string[] => {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export const JudgmentList: React.FC<JudgmentListProps> = ({
  judgments,
  selectedJudgmentId,
  onSelectJudgment,
  onAddJudgment,
  onUpdateJudgment,
  onDeleteJudgment,
}) => {
  const [draft, setDraft] = useState<NewJudgmentDraft>(defaultDraft);

  const orderedJudgments = useMemo(() => {
    return [...judgments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [judgments]);

  const submitDraft = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!draft.text.trim()) return;

    await onAddJudgment({
      text: draft.text.trim(),
      confidence: Math.max(0, Math.min(100, draft.confidence)),
      tags: parseTags(draft.tags),
      sourceNote: draft.sourceNote.trim(),
      rejected: false,
    });

    setDraft(defaultDraft);
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white" aria-label="Judgments list pane">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold text-slate-900">Judgments</h2>
        <p className="mt-1 text-xs text-slate-600">Add, revise, or remove considered judgments.</p>
      </header>

      <form className="space-y-2 border-b border-slate-200 p-3" onSubmit={submitDraft} aria-label="Add judgment form">
        <label className="block text-xs font-medium text-slate-700">
          Text
          <textarea
            aria-label="New judgment text"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
            rows={2}
            value={draft.text}
            onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
            placeholder="E.g., Diverting the trolley is permissible."
          />
        </label>

        <label className="block text-xs font-medium text-slate-700">
          Confidence: <span aria-live="polite">{draft.confidence}%</span>
          <input
            aria-label="New judgment confidence"
            className="mt-1 w-full"
            type="range"
            min={0}
            max={100}
            value={draft.confidence}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, confidence: Number(event.target.value) || 0 }))
            }
          />
        </label>

        <label className="block text-xs font-medium text-slate-700">
          Tags (comma separated)
          <input
            aria-label="New judgment tags"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
            type="text"
            value={draft.tags}
            onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="trolley, harming, rescue"
          />
        </label>

        <label className="block text-xs font-medium text-slate-700">
          Source note
          <input
            aria-label="New judgment source note"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
            type="text"
            value={draft.sourceNote}
            onChange={(event) => setDraft((prev) => ({ ...prev, sourceNote: event.target.value }))}
            placeholder="Case intuition after seminar discussion"
          />
        </label>

        <button
          aria-label="Add judgment"
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          type="submit"
        >
          Add Judgment (Ctrl/Cmd + J)
        </button>
      </form>

      <ul className="min-h-0 flex-1 space-y-2 overflow-auto p-3" aria-label="Judgment items">
        {orderedJudgments.length === 0 ? (
          <li className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">
            No judgments yet.
          </li>
        ) : null}

        {orderedJudgments.map((judgment) => {
          const isSelected = judgment.id === selectedJudgmentId;

          return (
            <li
              key={judgment.id}
              className={`rounded-lg border p-2 ${
                isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  aria-label={`Select judgment ${judgment.id}`}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                  type="button"
                  onClick={() => onSelectJudgment(judgment.id)}
                >
                  {isSelected ? "Selected" : "Select"}
                </button>

                <button
                  aria-label={`Delete judgment ${judgment.id}`}
                  className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                  type="button"
                  onClick={() => onDeleteJudgment(judgment.id)}
                >
                  Delete
                </button>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                Text
                <textarea
                  aria-label={`Judgment text ${judgment.id}`}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  rows={2}
                  value={judgment.text}
                  onChange={(event) => onUpdateJudgment(judgment.id, { text: event.target.value })}
                />
              </label>

              <label className="mt-2 block text-xs font-medium text-slate-700">
                Confidence: {judgment.confidence}%
                <input
                  aria-label={`Judgment confidence ${judgment.id}`}
                  className="mt-1 w-full"
                  type="range"
                  min={0}
                  max={100}
                  value={judgment.confidence}
                  onChange={(event) =>
                    onUpdateJudgment(judgment.id, {
                      confidence: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>

              <label className="mt-2 block text-xs font-medium text-slate-700">
                Tags
                <input
                  aria-label={`Judgment tags ${judgment.id}`}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  type="text"
                  value={judgment.tags.join(", ")}
                  onChange={(event) =>
                    onUpdateJudgment(judgment.id, {
                      tags: parseTags(event.target.value),
                    })
                  }
                />
              </label>

              <label className="mt-2 block text-xs font-medium text-slate-700">
                Source note
                <input
                  aria-label={`Judgment source ${judgment.id}`}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  type="text"
                  value={judgment.sourceNote}
                  onChange={(event) =>
                    onUpdateJudgment(judgment.id, {
                      sourceNote: event.target.value,
                    })
                  }
                />
              </label>

              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  aria-label={`Judgment rejected ${judgment.id}`}
                  checked={Boolean(judgment.rejected)}
                  onChange={(event) => onUpdateJudgment(judgment.id, { rejected: event.target.checked })}
                  type="checkbox"
                />
                Mark as rejected
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default JudgmentList;
