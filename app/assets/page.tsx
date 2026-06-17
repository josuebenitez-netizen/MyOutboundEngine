"use client";

import { useState, useEffect, useRef } from "react";
import {
  EnrichedProspect,
  KnowledgeBase,
  SyntheticReport,
  AssetConfig,
} from "@/lib/types";

const DEFAULT_ASSET_CONFIG: AssetConfig = {
  budgetPerOpportunity: 5,
  reportThreshold: 3,
  companyName: "",
  companyUrl: "",
};

export default function AssetsPage() {
  const [prospects, setProspects] = useState<EnrichedProspect[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [reports, setReports] = useState<SyntheticReport[]>([]);
  const [config, setConfig] = useState<AssetConfig>(DEFAULT_ASSET_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState<string>("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const savedProspects = localStorage.getItem("enrichedProspects");
    const savedKB = localStorage.getItem("knowledgeBase");
    const savedReports = localStorage.getItem("syntheticReports");
    const savedConfig = localStorage.getItem("assetConfig");

    if (savedProspects) try { setProspects(JSON.parse(savedProspects)); } catch {}
    if (savedKB) try { setKnowledgeBase(JSON.parse(savedKB)); } catch {}
    if (savedReports) try { setReports(JSON.parse(savedReports)); } catch {}
    if (savedConfig) try { setConfig(JSON.parse(savedConfig)); } catch {}
  }, []);

  useEffect(() => {
    if (reports.length > 0) localStorage.setItem("syntheticReports", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem("assetConfig", JSON.stringify(config));
  }, [config]);

  // Determine which prospects qualify based on seniority
  const qualifiedProspects = prospects.filter((p) => {
    if (!p.enrichment) return false;
    const tier = p.enrichment.seniority;
    if (config.budgetPerOpportunity >= config.reportThreshold) return true;
    // If budget is low, only top seniority
    return tier === "C-Suite" || tier === "VP";
  });

  const unreported = qualifiedProspects.filter(
    (p) => !reports.find((r) => r.prospectEmail === p.email)
  );

  const generateSingle = async (prospect: EnrichedProspect) => {
    setIsGenerating(true);
    setGeneratingEmail(prospect.email);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect,
          enrichment: prospect.enrichment,
          knowledgeBase,
          assetConfig: config,
        }),
      });

      const data = await res.json();
      if (data.html) {
        const report: SyntheticReport = {
          prospectEmail: prospect.email,
          prospectName: `${prospect.first_name} ${prospect.last_name}`,
          company: prospect.company,
          industry: prospect.industry,
          title: prospect.title,
          reportHtml: data.html,
          generatedAt: new Date().toISOString(),
        };
        setReports((prev) => [...prev.filter((r) => r.prospectEmail !== prospect.email), report]);
      }
    } catch (err) {
      console.error("Report gen failed:", err);
    }

    setIsGenerating(false);
    setGeneratingEmail("");
  };

  const generateAll = async () => {
    setIsGenerating(true);
    setProgress({ done: 0, total: unreported.length });

    for (let i = 0; i < unreported.length; i++) {
      setGeneratingEmail(unreported[i].email);
      await generateSingle(unreported[i]);
      setProgress({ done: i + 1, total: unreported.length });
    }

    setIsGenerating(false);
    setGeneratingEmail("");
  };

  const downloadReport = (report: SyntheticReport) => {
    const blob = new Blob([report.reportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = report.prospectName.toLowerCase().replace(/\s+/g, "-");
    a.download = `report-${slug}-${report.company.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    reports.forEach((r) => downloadReport(r));
  };

  const clearAll = () => {
    setReports([]);
    localStorage.removeItem("syntheticReports");
    setPreviewIdx(null);
  };

  // Write HTML to iframe for preview
  useEffect(() => {
    if (previewIdx !== null && reports[previewIdx] && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(reports[previewIdx].reportHtml);
        doc.close();
      }
    }
  }, [previewIdx, reports]);

  if (prospects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 8
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Synthetic Assets</h1>
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
          Phase 8
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Synthetic Assets</h1>
        <p className="text-white/50">
          Generate personalized diagnostic reports for high-value prospects. Link them in your email sequences to stand out.
        </p>
      </div>

      {/* Budget Config */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Budget & Targeting</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">Budget per opportunity ($)</label>
            <input
              type="number"
              value={config.budgetPerOpportunity}
              onChange={(e) => setConfig({ ...config, budgetPerOpportunity: Number(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Report threshold ($)</label>
            <input
              type="number"
              value={config.reportThreshold}
              onChange={(e) => setConfig({ ...config, reportThreshold: Number(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
            <p className="text-[10px] text-white/20 mt-1">Prospects get reports when budget ≥ threshold</p>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Your Company Name</label>
            <input
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="Acme Inc"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Your Website URL</label>
            <input
              value={config.companyUrl}
              onChange={(e) => setConfig({ ...config, companyUrl: e.target.value })}
              placeholder="https://acme.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <span className="text-white font-semibold text-sm">{qualifiedProspects.length}</span>
          <span className="text-white/40 text-sm ml-1">qualify for reports</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          <span className="text-emerald-400 font-semibold text-sm">{reports.length}</span>
          <span className="text-emerald-400/60 text-sm ml-1">reports generated</span>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-4 py-2">
          <span className="text-violet-400 font-semibold text-sm">
            ${(qualifiedProspects.length * config.budgetPerOpportunity).toFixed(0)}
          </span>
          <span className="text-violet-400/60 text-sm ml-1">total budget</span>
        </div>

        <div className="ml-auto flex gap-3">
          {reports.length > 0 && (
            <>
              <button onClick={downloadAll} className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-3 py-2">
                Download all HTML
              </button>
              <button onClick={clearAll} className="text-xs text-white/30 hover:text-red-400 transition-colors px-3 py-2">
                Clear all
              </button>
            </>
          )}
          <button
            onClick={generateAll}
            disabled={isGenerating || unreported.length === 0}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isGenerating && unreported.length > 0
                ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {isGenerating
              ? `Generating... ${progress.done}/${progress.total}`
              : unreported.length === 0
              ? "All reports generated ✓"
              : `Generate ${unreported.length} Reports`}
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
            Generating report for {generatingEmail}... {progress.done} of {progress.total}
          </p>
        </div>
      )}

      {/* Prospect list + Preview */}
      <div className="flex gap-6">
        {/* List */}
        <div className="w-[35%] space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {qualifiedProspects.map((p) => {
            const report = reports.find((r) => r.prospectEmail === p.email);
            const reportIdx = reports.findIndex((r) => r.prospectEmail === p.email);
            const isSelected = previewIdx === reportIdx;
            const isCurrentlyGenerating = generatingEmail === p.email;

            return (
              <div
                key={p.email}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-violet-600/15 border-violet-500/30"
                    : report
                    ? "bg-emerald-500/5 border-emerald-500/10"
                    : "bg-white/[0.02] border-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-white/40 truncate">{p.title} · {p.company}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded">
                        {p.enrichment?.seniority}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0 ml-3">
                    {report ? (
                      <>
                        <button
                          onClick={() => setPreviewIdx(reportIdx)}
                          className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => downloadReport(report)}
                          className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded hover:bg-white/20 transition-colors"
                        >
                          Download
                        </button>
                      </>
                    ) : isCurrentlyGenerating ? (
                      <span className="text-[10px] text-violet-300 flex items-center gap-1">
                        <span className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                        Generating
                      </span>
                    ) : (
                      <button
                        onClick={() => generateSingle(p)}
                        disabled={isGenerating}
                        className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-1 rounded hover:bg-violet-500/30 transition-colors disabled:opacity-30"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview */}
        <div className="flex-1">
          {previewIdx !== null && reports[previewIdx] ? (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">{reports[previewIdx].prospectName}</p>
                  <p className="text-xs text-white/40">
                    {reports[previewIdx].title} · {reports[previewIdx].company}
                  </p>
                </div>
                <button
                  onClick={() => downloadReport(reports[previewIdx])}
                  className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Download HTML
                </button>
              </div>
              <iframe
                ref={iframeRef}
                className="w-full h-[600px] bg-white"
                sandbox="allow-same-origin"
                title="Report preview"
              />
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center h-[400px] flex items-center justify-center">
              <div>
                <p className="text-white/30 text-sm mb-1">Select a prospect to preview their report</p>
                <p className="text-white/15 text-xs">
                  Reports are standalone HTML files you can host anywhere and link in emails
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
