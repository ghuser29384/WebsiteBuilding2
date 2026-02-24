import React, { useMemo, useState } from "react";
import type { Judgment, Link, Principle, RelationType } from "../lib/wreClient";

interface WorkspaceCanvasProps {
  judgments: Judgment[];
  principles: Principle[];
  links: Link[];
  selectedJudgmentId?: string;
  selectedPrincipleId?: string;
  onSelectJudgment: (judgmentId: string) => void;
  onSelectPrinciple: (principleId: string) => void;
  onCreateLink: (relation: RelationType) => void;
  onDeleteLink: (linkId: string) => void;
}

const relationStyles: Record<RelationType, string> = {
  supports: "bg-emerald-100 text-emerald-700 border-emerald-300",
  conflicts: "bg-rose-100 text-rose-700 border-rose-300",
};

export const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  judgments,
  principles,
  links,
  selectedJudgmentId,
  selectedPrincipleId,
  onSelectJudgment,
  onSelectPrinciple,
  onCreateLink,
  onDeleteLink,
}) => {
  const [relationType, setRelationType] = useState<RelationType>("supports");

  const graphModel = useMemo(() => {
    const leftX = 120;
    const rightX = 520;
    const topY = 48;
    const bottomY = 236;

    const judgmentNodes = judgments.map((judgment, index) => {
      const y = topY + (index + 1) * ((bottomY - topY) / (judgments.length + 1));
      return { id: judgment.id, x: leftX, y, label: judgment.text, kind: "judgment" as const };
    });

    const principleNodes = principles.map((principle, index) => {
      const y = topY + (index + 1) * ((bottomY - topY) / (principles.length + 1));
      return { id: principle.id, x: rightX, y, label: principle.text, kind: "principle" as const };
    });

    return {
      judgmentNodes,
      principleNodes,
      map: new Map([...judgmentNodes, ...principleNodes].map((node) => [node.id, node])),
    };
  }, [judgments, principles]);

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white" aria-label="Mutual adjustment workspace pane">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold text-slate-900">Mutual Adjustment Workspace</h2>
        <p className="mt-1 text-xs text-slate-600">
          Click a judgment and a principle, choose relation type, then link.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2 border-b border-slate-200 p-3 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-md border border-slate-200 p-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Judgments</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {judgments.map((judgment) => (
              <button
                key={judgment.id}
                aria-label={`Pick judgment ${judgment.id} for linking`}
                className={`rounded border px-2 py-1 text-xs ${
                  selectedJudgmentId === judgment.id
                    ? "border-blue-500 bg-blue-100 text-blue-800"
                    : "border-slate-300 bg-slate-50 text-slate-700"
                }`}
                type="button"
                onClick={() => onSelectJudgment(judgment.id)}
              >
                {judgment.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-700" htmlFor="wre-relation-select">
            Relation
          </label>
          <select
            id="wre-relation-select"
            aria-label="Select relation type"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={relationType}
            onChange={(event) => setRelationType(event.target.value as RelationType)}
          >
            <option value="supports">supports</option>
            <option value="conflicts">conflicts</option>
          </select>
          <button
            aria-label="Create relation link"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!selectedJudgmentId || !selectedPrincipleId}
            type="button"
            onClick={() => onCreateLink(relationType)}
          >
            Link
          </button>
        </div>

        <div className="rounded-md border border-slate-200 p-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Principles</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {principles.map((principle) => (
              <button
                key={principle.id}
                aria-label={`Pick principle ${principle.id} for linking`}
                className={`rounded border px-2 py-1 text-xs ${
                  selectedPrincipleId === principle.id
                    ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                    : "border-slate-300 bg-slate-50 text-slate-700"
                }`}
                type="button"
                onClick={() => onSelectPrinciple(principle.id)}
              >
                {principle.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 p-3">
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50">
          <svg viewBox="0 0 640 280" className="h-72 min-w-[640px] w-full" role="img" aria-label="Judgment principle relation graph">
            {links.map((link) => {
              const fromNode = graphModel.map.get(link.fromId);
              const toNode = graphModel.map.get(link.toId);
              if (!fromNode || !toNode) return null;
              const stroke = link.relation === "supports" ? "#059669" : "#e11d48";
              return (
                <line
                  key={link.id}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={stroke}
                  strokeWidth={2}
                  strokeDasharray={link.relation === "conflicts" ? "5 4" : undefined}
                />
              );
            })}

            {graphModel.judgmentNodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r={14} fill={selectedJudgmentId === node.id ? "#2563eb" : "#60a5fa"} />
                <text x={node.x + 20} y={node.y + 4} className="fill-slate-700 text-[10px]">
                  {node.id}
                </text>
              </g>
            ))}

            {graphModel.principleNodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r={14} fill={selectedPrincipleId === node.id ? "#059669" : "#34d399"} />
                <text x={node.x - 120} y={node.y + 4} className="fill-slate-700 text-[10px]">
                  {node.id}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Current relations</h3>
        <ul className="space-y-2" aria-label="Relation links">
          {links.length === 0 ? (
            <li className="rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-500">
              No links yet.
            </li>
          ) : null}
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2">
              <span className={`rounded border px-2 py-1 text-xs font-medium ${relationStyles[link.relation]}`}>
                {link.fromId} {link.relation} {link.toId}
              </span>
              <button
                aria-label={`Delete link ${link.id}`}
                className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                type="button"
                onClick={() => onDeleteLink(link.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WorkspaceCanvas;
