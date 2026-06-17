"use client";

import { useState, useEffect } from "react";
import {
  ProspectSequence,
  ProspectVariants,
  StepVariants,
  EmailVariant,
  SequenceConfig,
  DEFAULT_SEQUENCE_CONFIG,
} from "@/lib/types";
import VariantComparison from "@/components/VariantComparison";

export default function VariantsPage() {
  const [sequences, setSequences] = useState<ProspectSequence[]>([]);
  const [config, setConfig] = useState<SequenceConfig>(DEFAULT_SEQUENCE_CONFIG);
  const [allVariants, setAllVariants] = useState<ProspectVariants[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const savedSeqs = localStorage.getItem("sequences");
    const savedConfig = localStorage.getItem("sequenceConfig");
    const savedVariants = localStorage.getItem("variants");

    if (savedSeqs) {
      try { setSequences(JSON.parse(savedSeqs)); } catch {}
    }
    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)); } catch {}
    }
    if (savedVariants) {
      try { setAllVariants(JSON.parse(savedVariants)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (allVariants.length > 0) {
      localStorage.setItem("variants", JSON.stringify(allVariants));
    }
  }, [allVariants]);

  const generateAll = async () => {
    setIsGenerating(true);
    const toProcess = sequences.filter(
      (s) => !allVariants.find((v) => v.prospectEmail === s.prospectEmail)
    );
    setProgress({ done: 0, total: toProcess.length });
    const results = [...allVariants];

    for (let i = 0; i < toProcess.length; i++) {
      const seq = toProcess[i];

      try {
        const res = await fetch("/api/generate-variants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails: seq.steps,
            prospectName: seq.prospectName,
            prospectTitle: "",
            prospectCompany: "",
            stepLabels: config.steps.map((s) => s.label),
          }),
        });

        const data = await res.json();

        if (data.stepVariants) {
          const prospectVariant: ProspectVariants = {
            prospectEmail: seq.prospectEmail,
            prospectName: seq.prospectName,
            steps: seq.steps.map((email, stepIdx) => ({
              original: email,
              variants: (data.stepVariants[stepIdx] || []).map(
                (v: EmailVariant) => ({ ...v })
              ),
              selected: "original" as const,
            })),
          };
          results.push(prospectVariant);
          setAllVariants([...results]);
        }
      } catch (err) {
        console.error(`Variant gen failed for ${seq.prospectEmail}:`, err);
      }

      setProgress({ done: i + 1, total: toProcess.length });
    }

    setIsGenerating(false);
  };

  const updateSelection = (
    prospectIdx: number,
    stepIdx: number,
    selection: StepVariants["selected"]
  ) => {
    const updated = [...allVariants];
    updated[prospectIdx] = {
      ...updated[prospectIdx],
      steps: updated[prospectIdx].steps.map((s, i) =>
        i === stepIdx ? { ...s, selected: selection } : s
      ),
    };
    setAllVariants(updated);
  };

  const setAllRandom = () => {
    const updated = allVariants.map((pv) => ({
      ...pv,
      steps: pv.steps.map((s) => ({ ...s, selected: "random" as const })),
    }));
    setAllVariants(updated);
  };

  const clearAll = () => {
    setAllVariants([]);
    localStorage.removeItem("variants");
    setSelectedIdx(null);
  };

  const remaining = sequences.length - allVariants.length;
  const totalVariantEmails = allVariants.reduce(
    (acc, pv) => acc + pv.steps.reduce((a, s) => a + s.variants.length, 0), 0
  );

  if (sequences.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 6
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">A/B Variants</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/50 mb-2">No sequences generated yet.</p>
          <a href="/sequences" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Go to Sequences first
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 6
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">A/B Variants</h1>
        <p className="text-white/50">
          Auto-generate two variants per email that test different subject lines, body lengths, and CTAs.
        </p>
      </div>

      {/* Stats + Actions */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <span className="text-white font-semibold text-sm">{sequences.length}</span>
          <span className="text-white/40 text-sm ml-1">sequences</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          <span className="text-emerald-400 font-semibold text-sm">{allVariants.length}</span>
          <span className="text-emerald-400/60 text-sm ml-1">with variants</span>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2">
          <span className="text-indigo-400 font-semibold text-sm">{totalVariantEmails}</span>
          <span className="text-indigo-400/60 text-sm ml-1">variant emails</span>
        </div>

        <div className="ml-auto flex gap-3">
          {allVariants.length > 0 && (
            <>
              <button onClick={setAllRandom} className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-3 py-2">
                Set all → Random
              </button>
              <button onClick={clearAll} className="text-xs text-white/30 hover:text-red-400 transition-colors px-3 py-2">
                Clear all
              </button>
            </>
          )}
          <button
            onClick={generateAll}
            disabled={isGenerating || remaining === 0}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isGenerating && remaining > 0
                ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {isGenerating
              ? `Generating... ${progress.done}/${progress.total}`
              : remaining === 0
              ? "All variants generated ✓"
              : `Generate Variants (${remaining} remaining)`}
          </button>
        </div>
      </div>

      {/* Progress */}
      {isGenerating && (
        <div className="mb-6">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-2">
            Generating A/B variants for each step... {progress.done} of {progress.total}
          </p>
        </div>
      )}

      {/* List + Comparison */}
      {allVariants.length > 0 && (
        <div className="flex gap-6">
          {/* Prospect list */}
          <div className="w-[30%] space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {allVariants.map((pv, i) => {
              const isSelected = selectedIdx === i;
              const allSelected = pv.steps.every((s) => s.selected !== "original");
              return (
                <button
                  key={pv.prospectEmail}
                  onClick={() => { setSelectedIdx(isSelected ? null : i); setActiveStep(0); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-violet-600/15 border-violet-500/30"
                      : "bg-white/[0.02] border-white/5 hover:border-white/15"
                  }`}
                >
                  <p className="text-sm font-medium text-white truncate">{pv.prospectName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/30">
                      {pv.steps.reduce((a, s) => a + s.variants.length, 0)} variants
                    </span>
                    {allSelected && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                        Choices made
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comparison panel */}
          <div className="flex-1">
            {selectedIdx !== null && allVariants[selectedIdx] ? (
              <div>
                {/* Step tabs */}
                <div className="flex gap-2 mb-4">
                  {config.steps.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeStep === i
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/40 hover:text-white/60"
                      }`}
                    >
                      Step {step.stepNumber}: {step.label}
                    </button>
                  ))}
                </div>

                {/* Comparison */}
                {allVariants[selectedIdx].steps[activeStep] && (
                  <VariantComparison
                    stepVariants={allVariants[selectedIdx].steps[activeStep]}
                    onSelect={(selection) => updateSelection(selectedIdx, activeStep, selection)}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center h-full flex items-center justify-center">
                <p className="text-white/30 text-sm">Select a prospect to compare variants</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
