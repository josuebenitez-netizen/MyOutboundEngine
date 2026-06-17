"use client";

import { useState, useEffect } from "react";
import { EnrichedProspect, KnowledgeBase, Enrichment } from "@/lib/types";
import EnrichmentPanel from "@/components/EnrichmentPanel";

export default function EnrichmentPage() {
  const [prospects, setProspects] = useState<EnrichedProspect[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const savedProspects = localStorage.getItem("prospects");
    const savedKB = localStorage.getItem("knowledgeBase");
    const savedEnriched = localStorage.getItem("enrichedProspects");

    if (savedEnriched) {
      try {
        const parsed = JSON.parse(savedEnriched);
        setProspects(parsed);
        setHasData(true);
      } catch {}
    } else if (savedProspects) {
      try {
        const parsed = JSON.parse(savedProspects);
        setProspects(parsed.map((p: EnrichedProspect) => ({ ...p, enrichment: undefined })));
        setHasData(true);
      } catch {}
    }

    if (savedKB) {
      try { setKnowledgeBase(JSON.parse(savedKB)); } catch {}
    }
  }, []);

  useEffect(() => {
    const enriched = prospects.filter((p) => p.enrichment);
    if (enriched.length > 0) {
      localStorage.setItem("enrichedProspects", JSON.stringify(prospects));
    }
  }, [prospects]);

  const enrichedCount = prospects.filter((p) => p.enrichment).length;
  const unenrichedCount = prospects.length - enrichedCount;

  const runEnrichment = async () => {
    if (!knowledgeBase) return;
    setIsEnriching(true);

    const unenriched = prospects
      .map((p, i) => ({ prospect: p, index: i }))
      .filter((item) => !item.prospect.enrichment);

    setProgress({ done: 0, total: unenriched.length });
    const batchSize = 5;
    const updated = [...prospects];

    for (let i = 0; i < unenriched.length; i += batchSize) {
      const batch = unenriched.slice(i, i + batchSize);

      try {
        const res = await fetch("/api/enrich-prospects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospects: batch.map((b) => b.prospect),
            knowledgeBase,
          }),
        });

        const data = await res.json();

        if (data.enrichments) {
          data.enrichments.forEach((enrichment: Enrichment, idx: number) => {
            if (batch[idx]) {
              updated[batch[idx].index] = {
                ...updated[batch[idx].index],
                enrichment,
              };
            }
          });
          setProspects([...updated]);
        }
      } catch (err) {
        console.error("Batch enrichment failed:", err);
      }

      setProgress({ done: Math.min(i + batchSize, unenriched.length), total: unenriched.length });
    }

    setIsEnriching(false);
  };

  const clearEnrichment = () => {
    const cleared = prospects.map((p) => ({ ...p, enrichment: undefined }));
    setProspects(cleared);
    localStorage.removeItem("enrichedProspects");
    setSelectedIdx(null);
  };

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 4
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Enrichment</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/50 mb-2">No prospects loaded yet.</p>
          <a href="/prospects" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
            ← Go to Prospects to upload a CSV first
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 4
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Prospect Enrichment</h1>
        <p className="text-white/50">
          Claude analyzes each prospect against your knowledge base to find the best angle, tone, and talking points.
        </p>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <span className="text-white font-semibold text-sm">{prospects.length}</span>
          <span className="text-white/40 text-sm ml-1">total</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          <span className="text-emerald-400 font-semibold text-sm">{enrichedCount}</span>
          <span className="text-emerald-400/60 text-sm ml-1">enriched</span>
        </div>
        {unenrichedCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
            <span className="text-amber-400 font-semibold text-sm">{unenrichedCount}</span>
            <span className="text-amber-400/60 text-sm ml-1">pending</span>
          </div>
        )}

        <div className="ml-auto flex gap-3">
          {enrichedCount > 0 && (
            <button
              onClick={clearEnrichment}
              className="text-xs text-white/30 hover:text-red-400 transition-colors px-3 py-2"
            >
              Clear all
            </button>
          )}
          <button
            onClick={runEnrichment}
            disabled={isEnriching || unenrichedCount === 0 || !knowledgeBase}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isEnriching && unenrichedCount > 0 && knowledgeBase
                ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {isEnriching
              ? `Enriching... ${progress.done}/${progress.total}`
              : unenrichedCount === 0
              ? "All enriched ✓"
              : !knowledgeBase
              ? "Set up Knowledge Base first"
              : `Enrich ${unenrichedCount} Prospects`}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isEnriching && (
        <div className="mb-6">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-2">
            Processing in batches of 5... {progress.done} of {progress.total} complete
          </p>
        </div>
      )}

      {/* Prospect list + detail panel */}
      <div className="flex gap-6">
        {/* List */}
        <div className="w-[45%] space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {prospects.map((p, i) => {
            const isSelected = selectedIdx === i;
            const isEnriched = !!p.enrichment;
            return (
              <button
                key={i}
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-violet-600/15 border-violet-500/30"
                    : isEnriched
                    ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {p.title || "No title"} · {p.company || "No company"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {isEnriched ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        Enriched
                      </span>
                    ) : (
                      <span className="text-[10px] bg-white/10 text-white/30 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {isEnriched && p.enrichment && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="text-[10px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded">
                      {p.enrichment.seniority}
                    </span>
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded">
                      {p.enrichment.recommendedTone}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="flex-1">
          {selectedIdx !== null && prospects[selectedIdx] ? (
            <EnrichmentPanel prospect={prospects[selectedIdx]} />
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center h-full flex items-center justify-center">
              <p className="text-white/30 text-sm">
                Select a prospect to view enrichment details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
