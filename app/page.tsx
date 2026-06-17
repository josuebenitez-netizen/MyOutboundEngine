export default function Home() {
  const phases = [
    { phase: "2", label: "Knowledge Base", desc: "Upload your product context, ICP, and value props", href: "/knowledge-base", status: "next" },
    { phase: "3", label: "Prospect Ingestion", desc: "Upload a CSV of contacts to reach out to", href: "/prospects", status: "locked" },
    { phase: "4", label: "Enrichment", desc: "AI enriches each prospect with OKRs and angles", href: "/enrichment", status: "locked" },
    { phase: "5", label: "Sequence Engine", desc: "Generate personalized 4-step email sequences", href: "/sequences", status: "locked" },
    { phase: "6", label: "A/B Variants", desc: "Auto-generate subject, body, and CTA variants", href: "/variants", status: "locked" },
    { phase: "7", label: "Export", desc: "Export to Instantly or Lemlist, ready to send", href: "/export", status: "locked" },
    { phase: "8", label: "Synthetic Assets", desc: "Generate personalized reports and landing pages", href: "/assets", status: "locked" },
    { phase: "9", label: "Optimization Loop", desc: "Feed in results, get smarter sequences", href: "/results", status: "locked" },
    { phase: "10", label: "Apollo Autopilot", desc: "Auto-pull prospects and run on schedule", href: "/apollo", status: "locked" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Phase 1 complete — scaffold deployed
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          MyOutbound<span className="text-violet-400">Engine</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl">
          An AI-powered outbound machine built to get you 10+ positive replies per week at a 0.5–1% success rate.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: "Target replies/week", value: "10+" },
          { label: "Target success rate", value: "0.5–1%" },
          { label: "Sequence steps", value: "4" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Phase roadmap */}
      <div>
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Build Roadmap</h2>
        <div className="space-y-2">
          {phases.map((p) => (
            <div
              key={p.phase}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                p.status === "next"
                  ? "bg-violet-600/10 border-violet-500/30 cursor-pointer hover:bg-violet-600/20"
                  : "bg-white/[0.02] border-white/5 opacity-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                p.status === "next" ? "bg-violet-600 text-white" : "bg-white/10 text-white/40"
              }`}>
                {p.phase}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${p.status === "next" ? "text-white" : "text-white/50"}`}>
                  {p.label}
                </p>
                <p className="text-xs text-white/30 mt-0.5 truncate">{p.desc}</p>
              </div>
              <div className="flex-shrink-0">
                {p.status === "next" ? (
                  <span className="text-xs bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full">Up next</span>
                ) : (
                  <span className="text-xs text-white/20">Locked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
