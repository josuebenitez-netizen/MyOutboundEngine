"use client";

import { useState } from "react";
import { Email } from "@/lib/types";

interface Props {
  email: Email;
  stepLabel: string;
  onUpdate: (email: Email) => void;
}

export default function EmailViewer({ email, stepLabel, onUpdate }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (field: string, value: string) => {
    setEditing(field);
    setDraft(value);
  };

  const saveEdit = (field: string) => {
    onUpdate({ ...email, [field]: draft });
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const wordCount = email.body.split(/\s+/).filter(Boolean).length;

  const EditableText = ({
    field,
    value,
    label,
    multiline = false,
  }: {
    field: string;
    value: string;
    label: string;
    multiline?: boolean;
  }) => {
    if (editing === field) {
      return (
        <div>
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-40 bg-white/5 border border-violet-500/30 rounded-lg p-3 text-sm text-white resize-none focus:outline-none"
              autoFocus
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full bg-white/5 border border-violet-500/30 rounded-lg p-2 text-sm text-white focus:outline-none"
              autoFocus
            />
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => saveEdit(field)}
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-md transition-colors"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
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
        onClick={() => startEdit(field, value)}
        className="cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{label}</span>
          <span className="text-[10px] text-white/15 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      {/* Email header */}
      <div className="bg-white/5 px-6 py-4 border-b border-white/10">
        <EditableText field="subject" value={email.subject} label="Subject" />
        {editing !== "subject" && (
          <p className="text-white font-medium cursor-pointer hover:text-violet-300 transition-colors"
             onClick={() => startEdit("subject", email.subject)}>
            {email.subject}
          </p>
        )}

        <div className="mt-2">
          <EditableText field="previewText" value={email.previewText} label="Preview text" />
          {editing !== "previewText" && (
            <p className="text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors"
               onClick={() => startEdit("previewText", email.previewText)}>
              {email.previewText}
            </p>
          )}
        </div>
      </div>

      {/* Email body */}
      <div className="px-6 py-5">
        <EditableText field="body" value={email.body} label="Body" multiline />
        {editing !== "body" && (
          <div
            className="cursor-pointer hover:bg-white/[0.02] rounded-lg p-2 -m-2 transition-colors"
            onClick={() => startEdit("body", email.body)}
          >
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{email.body}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 py-4 border-t border-white/5">
        <EditableText field="cta" value={email.cta} label="Call to action" />
        {editing !== "cta" && (
          <p className="text-sm text-violet-400 cursor-pointer hover:text-violet-300 transition-colors"
             onClick={() => startEdit("cta", email.cta)}>
            {email.cta}
          </p>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center gap-4">
        <span className="text-[10px] text-white/20">{wordCount} words</span>
        <span className="text-[10px] text-white/20">{stepLabel}</span>
        <span className="text-[10px] text-white/20">
          {wordCount < 50 ? "Very short" : wordCount < 80 ? "Short" : wordCount < 120 ? "Medium" : "Long"}
        </span>
      </div>
    </div>
  );
}
