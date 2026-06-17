"use client";

import { useState, useEffect } from "react";
import {
  EnrichedProspect,
  KnowledgeBase,
  SequenceConfig,
  ProspectSequence,
  Email,
  DEFAULT_SEQUENCE_CONFIG,
} from "@/lib/types";
import SequenceConfigurator from "@/components/SequenceConfigurator";
import EmailViewer from "@/components/EmailViewer";

export default function SequencesPage() {
  const [config, setConfig] = useState<SequenceConfig>(DEFAULT_SEQUENCE_CONFIG);
  const [prospects, setProspects] = useState<EnrichedProspect[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [sequences, setSequences] = useState<ProspectSequence[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const savedKB = localStorage.getItem("knowledgeBase");
    const savedEnriched = localStorage.getItem("enrichedProspects");
    const savedSequences = localStorage.getItem("sequences");
    const savedConfig = localStorage.getItem("sequenceConfig");

    if (savedKB) {
      try { setKnowledgeBase(JSON.parse(savedKB)); } catch {}
    }
    if (savedEnriched) {
      try {
        const parsed = JSON.parse(savedEnriched);
        setProspects(parsed);
        setHasData(true);
      } catch {}
    }
    if (savedSequences) {
      try { setSequences(JSON.parse(savedSequences)); } catch {}
    }
    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (sequences.length > 0) {
      localStorage.setItem("sequences", JSON.stringify(sequences));
    }
  }, [sequences]);

  useEffect(() => {
    localStorage.setItem("sequenceConfig", JSON.stringify(config));
  }, [config]);

  const enrichedProspects = prospects.filter((p) => p.enrichment);
  const generatedEmails = sequences.reduce((acc, s) => acc + s.steps.length, 0);

  const generateAll = async () => {
    setIsGenerating(true);
    const toGenerate = enrichedProspects;
    setProgress({ done: 0, total: toGenerate.length });
    const results: ProspectSequence[] = [...sequences];

    for (let i = 0; i < toGenerate.length; i++) {
      const p = toGenerate[i];

      // Skip if already generated
      if (results.find((r) => r.prospectEmail === p.email)) {
        setProgress({ done: i + 1, total: toGenerate.length });
        continue;
      }

      try {
        const res = await fetch("/api/generate-sequence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospect: p,
            enrichment: p.enrichment,
            knowledgeBase,
            config,
          }),
        });

        const data = await res.json();
        if (data.steps) {
          results.push({
            prospectEmail: p.email,
            prospectName: `${p.first_name} ${p.last_name}`,
            steps: data.steps,
          });
          setSequences([...results]);
        }
      } catch (err) {
        console.error(`Failed for ${p.email}:`, err);
      }

      setProgress({ done: i + 1, total: toGenerate.length });
    }

    setIsGenerating(false);
  };

  const generateSingle = async (prospectIdx: number) => {
    const p = enrichedProspects[prospectIdx];
    if (!p) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect: p,
          enrichment: p.enrichment,
          knowledgeBase,
          config,
        }),
      });

      const data = await res.json();
      if (data.steps) {
        const updated = sequences.filter((s) => s.prospectEmail !== p.email);
        updated.push({
          prospectEmail: p.email,
          prospectName: `${p.first_name} ${p.last_name}`,
          steps: data.steps,
        });
        setSequences(updated);
      }
    } catch (err) {
      console.error("Failed:", err);
    }
    setIsGenerating(false);
  };

  const updateEmail = (seqIdx: number, stepIdx: number, updated: Email) => {
    const newSeqs = [...sequences];
    newSeqs[seqIdx] = {
      ...newSeqs[seqIdx],
      steps: newSeqs[seqIdx].steps.map((s, i) => (i === stepIdx ? updated : s)),
    };
    setSequences(newSeqs);
  };

  const clearAll = () => {
    setSequences([]);
    localStorage.removeItem("sequences");
    setSelectedIdx(null);
  };

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 5
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Sequences</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/50 mb-2">No enriched prospects yet.</p>
          <a href="/enrichment" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Go to Enrichment first
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 5
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Email Sequences</h1>
        <p className="text-white/50">
          Configure your sequence, then generate personalized emails for every prospect.
        </p>
      </div>

      {/* Sequence Config */}
      <SequenceConfigurator config={config} onChange={setConfig} />

      {/* Stats + Actions */}
      <div className="flex items-center gap-4 mt-8 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <span className="text-white font-semibold text-sm">{enrichedProspects.length}</span>
          <span className="text-white/40 text-sm ml-1">enriched prospects</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          <span className="text-emerald-400 font-semibold text-sm">{sequences.length}</span>
          <span className="text-emerald-400/60 text-sm ml-1">sequences generated</span>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2">
          <span className="text-indigo-400 font-semibold text-sm">{generatedEmails}</span>
          <span className="text-indigo-400/60 text-sm ml-1">total emails</span>
        </div>

        <div className="ml-auto flex gap-3">
          {sequences.length > 0 && (
            <button onClick={clearAll} className="text-xs text-white/30 hover:text-red-400 transition-colors px-3 py-2">
              Clear all
            </button>
          )}
          <button
            onClick={generateAll}
            disabled={isGenerating || enrichedProspects.length === 0 || !config.senderName}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isGenerating && enrichedProspects.length > 0 && config.senderName
                ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {isGenerating
              ? `Generating... ${progress.done}/${progress.total}`
              : !config.senderName
              ? "Set sender name above"
              : `Generate All (${enrichedProspects.length - sequences.length} remaining)`}
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
          <p className="text-xs text-white/30 mt-2">{progress.done} of {progress.total} prospects</p>
        </div>
      )}

      {/* Prospect list + sequence viewer */}
      {sequences.length > 0 && (
        <div className="flex gap-6">
          {/* List */}
          <div className="w-[35%] space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {enrichedProspects.map((p, i) => {
              const seq = sequences.find((s) => s.prospectEmail === p.email);
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={p.email}
                  onClick={() => { setSelectedIdx(isSelected ? null : i); setActiveStep(0); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-violet-600/15 border-violet-500/30"
                      : seq
                      ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30"
                      : "bg-white/[0.02] border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-white/40 truncate">{p.title} · {p.company}</p>
                    </div>
                    {seq ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                        {seq.steps.length} emails
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); generateSingle(i); }}
                        className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full flex-shrink-0 ml-2 hover:bg-violet-500/30"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Email viewer */}
          <div className="flex-1">
            {selectedIdx !== null && (() => {
              const p = enrichedProspects[selectedIdx];
              const seqIdx = sequences.findIndex((s) => s.prospectEmail === p?.email);
              const seq = seqIdx >= 0 ? sequences[seqIdx] : null;

              if (!seq) {
                return (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center">
                    <p className="text-white/30 text-sm">No sequence generated for this prospect yet.</p>
                  </div>
                );
              }

              return (
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
                        <span className="ml-2 text-white/30">Day {step.dayDelay}</span>
                      </button>
                    ))}
                  </div>

                  {/* Email */}
                  {seq.steps[activeStep] && (
                    <EmailViewer
                      email={seq.steps[activeStep]}
                      stepLabel={config.steps[activeStep]?.label || ""}
                      onUpdate={(updated) => updateEmail(seqIdx, activeStep, updated)}
                    />
                  )}
                </div>
              );
            })()}

            {selectedIdx === null && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center h-full flex items-center justify-center">
                <p className="text-white/30 text-sm">Select a prospect to view their sequence</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
