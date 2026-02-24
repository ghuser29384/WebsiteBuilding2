import React, { useMemo, useState } from "react";
import type { Principle, PrincipleScope } from "../lib/wreClient";

interface PrincipleListProps {
  principles: Principle[];
  selectedPrincipleId?: string;
  onSelectPrinciple: (principleId: string) => void;
  onAddPrinciple: (draft: {
    text: string;
    scope: PrincipleScope;
    plausibility: number;
  }) => Promise<void> | void;
  onUpdatePrinciple: (principleId: string, patch: Partial<Principle>) => void;
  onDeletePrinciple: (principleId: string) => void;
}

interface NewPrincipleDraft {
  text: string;
  scope: PrincipleScope;
  plausibility: number;
}

const defaultDraft: NewPrincipleDraft = {
  text: "",
  scope: "universal",
  plausibility: 0.7,
};

export const PrincipleList: React.FC<PrincipleListProps> = ({
  principles,
  selectedPrincipleId,
  onSelectPrinciple,
  onAddPrinciple,
  onUpdatePrinciple,
  onDeletePrinciple,
}) => {
  const [draft, setDraft] = useState<NewPrincipleDraft>(defaultDraft);

  const orderedPrinciples = useMemo(() => {
    return [...principles].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [principles]);

  const submitDraft = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!draft.text.trim()) return;

    await onAddPrinciple({
      text: draft.text.trim(),
      scope: draft.scope,
      plausibility: Math.max(0, Math.min(1, draft.plausibility)),
    });

    setDraft(defaultDraft);
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white" aria-label="Principles list pane">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold text-slate-900">Principles</h2>
        <p className="mt-1 text-xs text-slate-600">Maintain candidate principles with scope and plausibility.</p>
      </header>

      <form className="space-y-2 border-b border-slate-200 p-3" onSubmit={submitDraft} aria-label="Add principle form">
        <label className="block text-xs font-medium text-slate-700">
          Text
          <textarea
            aria-label="New principle text"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
            rows={2}
            value={draft.text}
            onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
            placeholder="E.g., One must not intentionally kill an innocent person."
          />
        </label>

        <label className="block text-xs font-medium text-slate-700">
          Scope
          <select
            aria-label="New principle scope"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
            value={draft.scope}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, scope: event.target.value as PrincipleScope }))
            }
          >
            <option value="universal">Universal</option>
            <option value="contextual">Contextual</option>
            <option value="defeasible">Defeasible</option>
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-700">
          Plausibility: {draft.plausibility.toFixed(2)}
          <input
            aria-label="New principle plausibility"
            className="mt-1 w-full"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={draft.plausibility}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, plausibility: Number(event.target.value) || 0 }))
            }
          />
        </label>

        <button
          aria-label="Add principle"
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          type="submit"
        >
          Add Principle
        </button>
      </form>

      <ul className="min-h-0 flex-1 space-y-2 overflow-auto p-3" aria-label="Principle items">
        {orderedPrinciples.length === 0 ? (
          <li className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">
            No principles yet.
          </li>
        ) : null}

        {orderedPrinciples.map((principle) => {
          const isSelected = principle.id === selectedPrincipleId;
          return (
            <li
              key={principle.id}
              className={`rounded-lg border p-2 ${
                isSelected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  aria-label={`Select principle ${principle.id}`}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                  type="button"
                  onClick={() => onSelectPrinciple(principle.id)}
                >
                  {isSelected ? "Selected" : "Select"}
                </button>

                <button
                  aria-label={`Delete principle ${principle.id}`}
                  className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                  type="button"
                  onClick={() => onDeletePrinciple(principle.id)}
                >
                  Delete
                </button>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                Text
                <textarea
                  aria-label={`Principle text ${principle.id}`}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  rows={2}
                  value={principle.text}
                  onChange={(event) => onUpdatePrinciple(principle.id, { text: event.target.value })}
                />
              </label>

              <label className="mt-2 block text-xs font-medium text-slate-700">
                Scope
                <select
                  aria-label={`Principle scope ${principle.id}`}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  value={principle.scope}
                  onChange={(event) =>
                    onUpdatePrinciple(principle.id, {
                      scope: event.target.value as PrincipleScope,
                    })
                  }
                >
                  <option value="universal">Universal</option>
                  <option value="contextual">Contextual</option>
                  <option value="defeasible">Defeasible</option>
                </select>
              </label>

              <label className="mt-2 block text-xs font-medium text-slate-700">
                Plausibility: {principle.plausibility.toFixed(2)}
                <input
                  aria-label={`Principle plausibility ${principle.id}`}
                  className="mt-1 w-full"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={principle.plausibility}
                  onChange={(event) =>
                    onUpdatePrinciple(principle.id, {
                      plausibility: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PrincipleList;
