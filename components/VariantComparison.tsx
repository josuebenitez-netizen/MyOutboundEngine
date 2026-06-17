"use client";

import { StepVariants, Email } from "@/lib/types";

interface Props {
  stepVariants: StepVariants;
  onSelect: (selection: StepVariants["selected"]) => void;
}

function EmailCard({
  email,
  label,
  strategy,
  isSelected,
  onSelect,
  colorClass,
}: {
  email: Email;
  label: string;
  strategy?: string;
  isSelected: boolean;
  onSelect: () => void;
  colorClass: string;
}) {
  const wordCount = email.body.split(/\s+/).filter(Boolean).length;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? `${colorClass} shadow-lg`
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            isSelected ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
          }`}>
            {label}
          </span>
          {strategy && (
            <span className="text-[10px] text-white/30">{strategy}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20">{wordCount}w</span>
          {isSelected && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
              Selected
            </span>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Subject</p>
        <p className="text-sm font-medium text-white">{email.subject}</p>
      </div>

      {/* Preview */}
      <div className="px-4 py-1">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Preview</p>
        <p className="text-xs text-white/40">{email.previewText}</p>
      </div>

      {/* Body */}
      <div className="px-4 py-2">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Body</p>
        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed line-clamp-6">
          {email.body}
        </p>
      </div>

      {/* CTA */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">CTA</p>
        <p className="text-sm text-violet-400">{email.cta}</p>
      </div>
    </div>
  );
}

export default function VariantComparison({ stepVariants, onSelect }: Props) {
  const { original, variants, selected } = stepVariants;

  return (
    <div className="space-y-4">
      {/* Selection bar */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2">
        <span className="text-xs text-white/40 px-2">Use:</span>
        {(["original", "A", "B", "random"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selected === opt
                ? opt === "original"
                  ? "bg-white/15 text-white"
                  : opt === "A"
                  ? "bg-blue-600/30 text-blue-300"
                  : opt === "B"
                  ? "bg-amber-600/30 text-amber-300"
                  : "bg-violet-600/30 text-violet-300"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            {opt === "random" ? "🎲 Random" : opt === "original" ? "Original" : `Variant ${opt}`}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-4">
        <EmailCard
          email={original}
          label="Original"
          isSelected={selected === "original"}
          onSelect={() => onSelect("original")}
          colorClass="border-white/30 bg-white/[0.03]"
        />
        {variants[0] && (
          <EmailCard
            email={variants[0]}
            label="Variant A"
            strategy={variants[0].variantStrategy}
            isSelected={selected === "A"}
            onSelect={() => onSelect("A")}
            colorClass="border-blue-500/40 bg-blue-500/[0.05]"
          />
        )}
        {variants[1] && (
          <EmailCard
            email={variants[1]}
            label="Variant B"
            strategy={variants[1].variantStrategy}
            isSelected={selected === "B"}
            onSelect={() => onSelect("B")}
            colorClass="border-amber-500/40 bg-amber-500/[0.05]"
          />
        )}
      </div>

      {selected === "random" && (
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-lg p-3 text-center">
          <p className="text-xs text-violet-300">
            On export, each prospect will randomly receive one of the three versions for this step.
            This lets you A/B test at scale.
          </p>
        </div>
      )}
    </div>
  );
}
