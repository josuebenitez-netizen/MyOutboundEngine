"use client";

import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import {
  CampaignResult,
  OptimizationReport,
  KnowledgeBase,
} from "@/lib/types";

type Tab = "import" | "dashboard" | "optimization";

export default function ResultsPage() {
  const [tab, setTab] = useState<Tab>("import");
  const [results, setResults] = useState<CampaignResult[]>([]);
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const savedResults = localStorage.getItem("campaignResults");
    const savedReport = localStorage.getItem("optimizationReport");
    const savedKB = localStorage.getItem("knowledgeBase");
    if (savedResults) try { const p = JSON.parse(savedResults); setResults(p); if (p.length > 0) setTab("dashboard"); } catch {}
    if (savedReport) try { setReport(JSON.parse(savedReport)); } catch {}
    if (savedKB) try { setKnowledgeBase(JSON.parse(savedKB)); } catch {}
  }, []);

  useEffect(() => {
    if (results.length > 0) localStorage.setItem("campaignResults", JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    if (report) localStorage.setItem("optimizationReport", JSON.stringify(report));
  }, [report]);

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const rows = parsed.data as Record<string, string>[];
        const mapped: CampaignResult[] = rows.map((r) => ({
          email: r.email || r.Email || "",
          prospectName: r.prospect_name || r.name || r.Name || "",
          title: r.title || r.Title || "",
          company: r.company || r.Company || "",
          industry: r.industry || r.Industry || "",
          step: parseInt(r.step || r.Step || "1") || 1,
          variant: r.variant || r.Variant || "original",
          subjectLine: r.subject || r.Subject || r.subject_line || "",
          opened: toBool(r.opened || r.Opened || r.open),
          replied: toBool(r.replied || r.Replied || r.reply),
          positiveReply: toBool(r.positive_reply || r.positive || r.Positive || r.interested),
          booked: toBool(r.booked || r.Booked || r.meeting),
          bodyWordCount: parseInt(r.word_count || r.words || "0") || 0,
          ctaType: r.cta_type || r.cta || "",
        }));
        setResults(mapped);
        setTab("dashboard");
      },
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) parseCSV(file);
  }, [parseCSV]);

  const addManualRow = () => {
    setResults((prev) => [...prev, {
      email: "", prospectName: "", title: "", company: "", industry: "",
      step: 1, variant: "original", subjectLine: "",
      opened: false, replied: false, positiveReply: false, booked: false,
      bodyWordCount: 0, ctaType: "",
    }]);
  };

  const updateRow = (idx: number, field: string, value: string | boolean | number) => {
    setResults((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const runOptimization = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, knowledgeBase }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setTab("optimization");
      }
    } catch (err) {
      console.error("Optimization failed:", err);
    }
    setIsAnalyzing(false);
  };

  const clearAll = () => {
    setResults([]);
    setReport(null);
    localStorage.removeItem("campaignResults");
    localStorage.removeItem("optimizationReport");
    setTab("import");
  };

  // Stats
  const total = results.length;
  const opens = results.filter((r) => r.opened).length;
  const replies = results.filter((r) => r.replied).length;
  const positive = results.filter((r) => r.positiveReply).length;
  const booked = results.filter((r) => r.booked).length;
  const openRate = total > 0 ? ((opens / total) * 100).toFixed(1) : "0";
  const replyRate = total > 0 ? ((replies / total) * 100).toFixed(1) : "0";
  const positiveRate = total > 0 ? ((positive / total) * 100).toFixed(2) : "0";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 9
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Results & Optimization</h1>
        <p className="text-white/50">
          Import campaign results, analyze what&apos;s working, and get AI-powered recommendations for next-gen sequences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {([
          { key: "import" as const, label: "Import Results", badge: "" },
          { key: "dashboard" as const, label: "Dashboard", badge: total > 0 ? String(total) : "" },
          { key: "optimization" as const, label: "Optimization", badge: report ? "✓" : "" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key ? "bg-violet-600 text-white" : "bg-white/5 text-white/40 hover:text-white/60"
            }`}
          >
            {t.label}
            {t.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20" : "bg-white/10"
              }`}>{t.badge}</span>
            )}
          </button>
        ))}
        {results.length > 0 && (
          <div className="ml-auto flex gap-3">
            <button onClick={clearAll} className="text-xs text-white/30 hover:text-red-400 transition-colors px-3">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Import Tab */}
      {tab === "import" && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive ? "border-violet-500 bg-violet-600/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && parseCSV(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-3xl mb-2">📊</div>
            <p className="text-white/60 mb-1">
              Drop your results CSV here, or <span className="text-violet-400">click to browse</span>
            </p>
            <p className="text-xs text-white/30">
              Expected columns: email, step, variant, opened, replied, positive_reply, booked, subject
            </p>
          </div>

          <div className="text-center text-white/20 text-sm">or enter manually</div>

          {/* Manual entry table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5">
                  {["Email", "Name", "Step", "Variant", "Subject", "Opened", "Replied", "Positive", "Booked", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-white/40 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-2 py-1">
                      <input value={r.email} onChange={(e) => updateRow(i, "email", e.target.value)}
                        className="w-36 bg-transparent text-white/80 focus:outline-none" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={r.prospectName} onChange={(e) => updateRow(i, "prospectName", e.target.value)}
                        className="w-24 bg-transparent text-white/80 focus:outline-none" />
                    </td>
                    <td className="px-2 py-1">
                      <select value={r.step} onChange={(e) => updateRow(i, "step", parseInt(e.target.value))}
                        className="bg-transparent text-white/80 focus:outline-none">
                        {[1,2,3,4].map((s) => <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select value={r.variant} onChange={(e) => updateRow(i, "variant", e.target.value)}
                        className="bg-transparent text-white/80 focus:outline-none">
                        {["original","A","B"].map((v) => <option key={v} value={v} className="bg-[#1a1a2e]">{v}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input value={r.subjectLine} onChange={(e) => updateRow(i, "subjectLine", e.target.value)}
                        className="w-32 bg-transparent text-white/80 focus:outline-none" />
                    </td>
                    {(["opened","replied","positiveReply","booked"] as const).map((field) => (
                      <td key={field} className="px-3 py-1 text-center">
                        <input type="checkbox" checked={r[field]}
                          onChange={(e) => updateRow(i, field, e.target.checked)}
                          className="accent-violet-500" />
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <button onClick={() => setResults((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-white/20 hover:text-red-400 transition-colors">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addManualRow}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            + Add row
          </button>
        </div>
      )}

      {/* Dashboard Tab */}
      {tab === "dashboard" && (
        <div className="space-y-8">
          {/* Metric cards */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total Sends", value: total, color: "white" },
              { label: "Open Rate", value: `${openRate}%`, color: "blue" },
              { label: "Reply Rate", value: `${replyRate}%`, color: "indigo" },
              { label: "Positive Rate", value: `${positiveRate}%`, color: "emerald" },
              { label: "Meetings Booked", value: booked, color: "violet" },
            ].map((m) => (
              <div key={m.label} className={`bg-${m.color === "white" ? "white/5" : m.color + "-500/10"} border border-${m.color === "white" ? "white/10" : m.color + "-500/20"} rounded-xl p-4`}>
                <p className={`text-2xl font-bold ${m.color === "white" ? "text-white" : `text-${m.color}-400`}`}>{m.value}</p>
                <p className="text-xs text-white/40 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* By Step */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Performance by Step</h3>
            <div className="space-y-3">
              {[1,2,3,4].map((step) => {
                const stepR = results.filter((r) => r.step === step);
                const sTotal = stepR.length;
                const sOpen = stepR.filter((r) => r.opened).length;
                const sReply = stepR.filter((r) => r.replied).length;
                const sPos = stepR.filter((r) => r.positiveReply).length;
                const oRate = sTotal > 0 ? (sOpen / sTotal) * 100 : 0;
                const rRate = sTotal > 0 ? (sReply / sTotal) * 100 : 0;
                return (
                  <div key={step} className="flex items-center gap-4">
                    <span className="text-xs text-white/40 w-14">Step {step}</span>
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${oRate}%` }} />
                        </div>
                        <span className="text-xs text-blue-400 w-12 text-right">{oRate.toFixed(0)}% open</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rRate}%` }} />
                        </div>
                        <span className="text-xs text-emerald-400 w-12 text-right">{rRate.toFixed(0)}% reply</span>
                      </div>
                    </div>
                    <span className="text-xs text-white/20 w-20 text-right">{sTotal} sent · {sPos} pos</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Variant */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Performance by Variant</h3>
            <div className="grid grid-cols-3 gap-4">
              {(["original", "A", "B"] as const).map((v) => {
                const vR = results.filter((r) => r.variant === v);
                const vTotal = vR.length;
                const vOpen = vR.filter((r) => r.opened).length;
                const vReply = vR.filter((r) => r.replied).length;
                const vPos = vR.filter((r) => r.positiveReply).length;
                return (
                  <div key={v} className="bg-white/[0.03] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        v === "original" ? "bg-white/10 text-white/60" :
                        v === "A" ? "bg-blue-500/20 text-blue-300" :
                        "bg-amber-500/20 text-amber-300"
                      }`}>{v === "original" ? "Original" : `Variant ${v}`}</span>
                      <span className="text-xs text-white/20">{vTotal} sends</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/40">Opens</span>
                        <span className="text-white/80">{vTotal > 0 ? ((vOpen / vTotal) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Replies</span>
                        <span className="text-white/80">{vTotal > 0 ? ((vReply / vTotal) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Positive</span>
                        <span className="text-emerald-400 font-semibold">{vTotal > 0 ? ((vPos / vTotal) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimize button */}
          <button
            onClick={runOptimization}
            disabled={isAnalyzing || results.length < 5}
            className={`w-full py-4 rounded-xl text-sm font-semibold transition-all ${
              !isAnalyzing && results.length >= 5
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing patterns...
              </span>
            ) : results.length < 5 ? (
              "Need at least 5 results to analyze"
            ) : (
              "Run Optimization Analysis"
            )}
          </button>
        </div>
      )}

      {/* Optimization Tab */}
      {tab === "optimization" && report && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-6">
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-2">Executive Summary</p>
            <p className="text-sm text-white/90 leading-relaxed">{report.summary}</p>
          </div>

          {/* Winning patterns */}
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <span>📈</span> Winning Patterns
            </h3>
            <div className="space-y-3">
              {report.winningPatterns.map((w, i) => (
                <div key={i} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                      {w.category}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      w.confidence === "high" ? "bg-emerald-500/20 text-emerald-400" :
                      w.confidence === "medium" ? "bg-amber-500/20 text-amber-400" :
                      "bg-white/10 text-white/40"
                    }`}>{w.confidence} conf</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      w.impact === "high" ? "bg-violet-500/20 text-violet-400" :
                      w.impact === "medium" ? "bg-blue-500/20 text-blue-400" :
                      "bg-white/10 text-white/40"
                    }`}>{w.impact} impact</span>
                  </div>
                  <p className="text-sm text-white/80 mb-1">{w.finding}</p>
                  <p className="text-xs text-emerald-400/70">→ {w.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Losing patterns */}
          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span>📉</span> Underperforming Patterns
            </h3>
            <div className="space-y-3">
              {report.losingPatterns.map((l, i) => (
                <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-semibold">
                      {l.category}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      l.confidence === "high" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-white/10 text-white/40"
                    }`}>{l.confidence} conf</span>
                  </div>
                  <p className="text-sm text-white/80 mb-1">{l.finding}</p>
                  <p className="text-xs text-red-400/70">→ {l.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next-gen recommendations */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-violet-400 mb-3">🚀 Next-Gen Recommendations</h3>
            <div className="space-y-2">
              {report.nextGenRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/[0.03] rounded-lg p-3">
                  <span className="text-violet-400 text-xs mt-0.5 font-bold">{i + 1}.</span>
                  <p className="text-sm text-white/80">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retire list */}
          {report.retireList.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-red-400 mb-3">🗑️ Retire These</h3>
              <div className="space-y-2">
                {report.retireList.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-red-500/5 rounded-lg p-3">
                    <span className="text-red-400 text-xs mt-0.5">✕</span>
                    <p className="text-sm text-white/60 line-through">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-run */}
          <button
            onClick={runOptimization}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            Re-run Analysis with Latest Data
          </button>
        </div>
      )}

      {tab === "optimization" && !report && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/50 mb-2">No optimization report yet.</p>
          <button onClick={() => setTab("dashboard")} className="text-violet-400 hover:text-violet-300 text-sm">
            Go to Dashboard → Run Analysis
          </button>
        </div>
      )}
    </div>
  );
}

function toBool(val: string | undefined): boolean {
  if (!val) return false;
  return ["true", "1", "yes", "y"].includes(val.toLowerCase().trim());
}
