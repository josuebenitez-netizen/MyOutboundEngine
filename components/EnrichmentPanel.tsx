"use client";

import { EnrichedProspect } from "@/lib/types";

interface Props {
  prospect: EnrichedProspect;
}

const seniorityColors: Record<string, string> = {
  "C-Suite": "bg-amber-500/15 text-amber-300 border-amber-500/20",
  VP: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  Director: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Manager: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  IC: "bg-white/10 text-white/60 border-white/10",
  Unknown: "bg-white/5 text-white/30 border-white/5",
};

const toneColors: Record<string, string> = {
  direct: "bg-red-500/15 text-red-300",
  consultative: "bg-blue-500/15 text-blue-300",
  peer: "bg-emerald-500/15 text-emerald-300",
  respectful: "bg-violet-500/15 text-violet-300",
};

export default function EnrichmentPanel({ prospect }: Props) {
  const p = prospect;
  const e = p.enrichment;

  if (!e) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            {p.first_name} {p.last_name}
          </h3>
          <p className="text-sm text-white/40">
            {p.title} · {p.company} · {p.industry}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
          <p className="text-amber-400 text-sm">Not enriched yet. Run enrichment to analyze this prospect.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          {p.first_name} {p.last_name}
        </h3>
        <p className="text-sm text-white/40">
          {p.title} · {p.company} · {p.industry}
        </p>
        <div className="flex gap-2 mt-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border ${seniorityColors[e.seniority] || seniorityColors.Unknown}`}>
            {e.seniority}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full ${toneColors[e.recommendedTone] || "bg-white/10 text-white/50"}`}>
            {e.recommendedTone} tone
          </span>
        </div>
      </div>

      {/* Best Angle */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-lg p-4">
        <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-1">Best Angle</p>
        <p className="text-sm text-white/90">{e.bestAngle}</p>
      </div>

      {/* Icebreaker */}
      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4">
        <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">Icebreaker</p>
        <p className="text-sm text-white/90 italic">&ldquo;{e.icebreaker}&rdquo;</p>
      </div>

      {/* Likely OKRs */}
      <div>
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">Likely OKRs</p>
        <div className="space-y-1.5">
          {e.likelyOKRs.map((okr, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/[0.03] rounded-lg p-3">
              <span className="text-emerald-400 text-xs mt-0.5">◎</span>
              <p className="text-sm text-white/80">{okr}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      <div>
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">Pain Points</p>
        <div className="space-y-1.5">
          {e.painPoints.map((pain, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/[0.03] rounded-lg p-3">
              <span className="text-red-400/60 text-xs mt-0.5">⚡</span>
              <p className="text-sm text-white/80">{pain}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tone Rationale */}
      <div>
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">Tone Rationale</p>
        <p className="text-sm text-white/50">{e.toneRationale}</p>
      </div>
    </div>
  );
}
