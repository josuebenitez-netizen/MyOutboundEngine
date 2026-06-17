"use client";

import { useState } from "react";

interface KnowledgeBase {
  productSummary: string;
  icp: string;
  valueProps: { persona: string; prop: string }[];
  proofPoints: string[];
  objections: { objection: string; response: string }[];
}

interface Props {
  knowledgeBase: KnowledgeBase;
  onUpdate: (kb: KnowledgeBase) => void;
}

function EditableField({
  label,
  value,
  onSave,
  multiline = true,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div>
        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1">
          {label}
        </label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-32 bg-white/5 border border-violet-500/30 rounded-lg p-3 text-sm text-white resize-none focus:outline-none"
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full bg-white/5 border border-violet-500/30 rounded-lg p-3 text-sm text-white focus:outline-none"
          />
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-md transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-xs text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit
        </span>
      </div>
      <p className="text-sm text-white/80 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function KnowledgeBaseCards({ knowledgeBase, onUpdate }: Props) {
  const kb = knowledgeBase;

  return (
    <div className="space-y-4">
      {/* Product Summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <EditableField
          label="Product Summary"
          value={kb.productSummary}
          onSave={(v) => onUpdate({ ...kb, productSummary: v })}
        />
      </div>

      {/* ICP */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <EditableField
          label="Ideal Customer Profile (ICP)"
          value={kb.icp}
          onSave={(v) => onUpdate({ ...kb, icp: v })}
        />
      </div>

      {/* Value Props by Persona */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            Value Props by Persona
          </label>
          <button
            onClick={() =>
              onUpdate({
                ...kb,
                valueProps: [...kb.valueProps, { persona: "New Persona", prop: "Value proposition" }],
              })
            }
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {kb.valueProps.map((vp, i) => (
            <div key={i} className="bg-white/[0.03] rounded-lg p-3 flex gap-3">
              <div className="flex-1">
                <EditableField
                  label="Persona"
                  value={vp.persona}
                  multiline={false}
                  onSave={(v) => {
                    const updated = [...kb.valueProps];
                    updated[i] = { ...updated[i], persona: v };
                    onUpdate({ ...kb, valueProps: updated });
                  }}
                />
              </div>
              <div className="flex-[2]">
                <EditableField
                  label="Value Prop"
                  value={vp.prop}
                  onSave={(v) => {
                    const updated = [...kb.valueProps];
                    updated[i] = { ...updated[i], prop: v };
                    onUpdate({ ...kb, valueProps: updated });
                  }}
                />
              </div>
              <button
                onClick={() =>
                  onUpdate({
                    ...kb,
                    valueProps: kb.valueProps.filter((_, idx) => idx !== i),
                  })
                }
                className="text-white/20 hover:text-red-400 text-xs self-start mt-4 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Proof Points */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            Proof Points
          </label>
          <button
            onClick={() =>
              onUpdate({ ...kb, proofPoints: [...kb.proofPoints, "New proof point"] })
            }
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {kb.proofPoints.map((pp, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/[0.03] rounded-lg p-3">
              <span className="text-violet-400 text-xs mt-0.5">✓</span>
              <div className="flex-1">
                <EditableField
                  label={`Proof point ${i + 1}`}
                  value={pp}
                  multiline={false}
                  onSave={(v) => {
                    const updated = [...kb.proofPoints];
                    updated[i] = v;
                    onUpdate({ ...kb, proofPoints: updated });
                  }}
                />
              </div>
              <button
                onClick={() =>
                  onUpdate({
                    ...kb,
                    proofPoints: kb.proofPoints.filter((_, idx) => idx !== i),
                  })
                }
                className="text-white/20 hover:text-red-400 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Objections */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            Common Objections & Responses
          </label>
          <button
            onClick={() =>
              onUpdate({
                ...kb,
                objections: [
                  ...kb.objections,
                  { objection: "New objection", response: "Your response" },
                ],
              })
            }
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {kb.objections.map((obj, i) => (
            <div key={i} className="bg-white/[0.03] rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-red-400/60 text-xs mt-1">⚡</span>
                <div className="flex-1">
                  <EditableField
                    label="Objection"
                    value={obj.objection}
                    multiline={false}
                    onSave={(v) => {
                      const updated = [...kb.objections];
                      updated[i] = { ...updated[i], objection: v };
                      onUpdate({ ...kb, objections: updated });
                    }}
                  />
                </div>
                <button
                  onClick={() =>
                    onUpdate({
                      ...kb,
                      objections: kb.objections.filter((_, idx) => idx !== i),
                    })
                  }
                  className="text-white/20 hover:text-red-400 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="ml-5">
                <EditableField
                  label="Response"
                  value={obj.response}
                  onSave={(v) => {
                    const updated = [...kb.objections];
                    updated[i] = { ...updated[i], response: v };
                    onUpdate({ ...kb, objections: updated });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
