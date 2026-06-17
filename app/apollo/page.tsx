"use client";

import { useState, useEffect } from "react";
import {
  ApolloFilters,
  DEFAULT_APOLLO_FILTERS,
  WeeklyPlan,
  Prospect,
  AssetConfig,
} from "@/lib/types";

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
        />
        <button onClick={add} className="text-xs bg-white/10 hover:bg-white/15 text-white/60 px-3 py-2 rounded-lg transition-colors">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-violet-500/15 text-violet-300 text-xs px-2.5 py-1 rounded-full">
              {tag}
              <button onClick={() => onChange(value.filter((t) => t !== tag))} className="hover:text-white transition-colors">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApolloPage() {
  const [apiKey, setApiKey] = useState("");
  const [filters, setFilters] = useState<ApolloFilters>(DEFAULT_APOLLO_FILTERS);
  const [isSearching, setIsSearching] = useState(false);
  const [pulledProspects, setPulledProspects] = useState<Prospect[]>([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [error, setError] = useState("");
  const [assetConfig, setAssetConfig] = useState<AssetConfig>({ budgetPerOpportunity: 5, reportThreshold: 3, companyName: "", companyUrl: "" });

  // Weekly plan calculation
  const [weeklyBudget, setWeeklyBudget] = useState(500);
  const [targetSuccessRate, setTargetSuccessRate] = useState(0.75);
  const [historicalOpenRate, setHistoricalOpenRate] = useState(45);
  const [historicalReplyRate, setHistoricalReplyRate] = useState(3);

  useEffect(() => {
    const savedKey = localStorage.getItem("apolloApiKey");
    const savedFilters = localStorage.getItem("apolloFilters");
    const savedAssetConfig = localStorage.getItem("assetConfig");
    const savedBudget = localStorage.getItem("weeklyBudget");
    if (savedKey) setApiKey(savedKey);
    if (savedFilters) try { setFilters(JSON.parse(savedFilters)); } catch {}
    if (savedAssetConfig) try { setAssetConfig(JSON.parse(savedAssetConfig)); } catch {}
    if (savedBudget) try { setWeeklyBudget(JSON.parse(savedBudget)); } catch {}
  }, []);

  useEffect(() => {
    if (apiKey) localStorage.setItem("apolloApiKey", apiKey);
    localStorage.setItem("apolloFilters", JSON.stringify(filters));
    localStorage.setItem("weeklyBudget", JSON.stringify(weeklyBudget));
  }, [apiKey, filters, weeklyBudget]);

  const search = async () => {
    setIsSearching(true);
    setError("");
    try {
      const res = await fetch("/api/apollo-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, filters }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPulledProspects(data.prospects || []);
        setTotalAvailable(data.totalAvailable || 0);
      }
    } catch (err) {
      setError("Failed to connect to Apollo");
      console.error(err);
    }
    setIsSearching(false);
  };

  const importToProspects = () => {
    const existing = JSON.parse(localStorage.getItem("prospects") || "[]");
    const existingEmails = new Set(existing.map((p: Prospect) => p.email));
    const newProspects = pulledProspects.filter((p) => !existingEmails.has(p.email));
    const merged = [...existing, ...newProspects];
    localStorage.setItem("prospects", JSON.stringify(merged));
    alert(`Imported ${newProspects.length} new prospects (${pulledProspects.length - newProspects.length} duplicates skipped). Go to Prospects to review.`);
  };

  // Weekly plan calculation
  const costPerProspect = assetConfig.budgetPerOpportunity;
  const maxProspects = costPerProspect > 0 ? Math.floor(weeklyBudget / costPerProspect) : 0;
  const reportQualified = Math.round(maxProspects * 0.2); // ~20% get reports
  const standardOnly = maxProspects - reportQualified;
  const estimatedReplies = Math.round(maxProspects * 4 * (historicalReplyRate / 100)); // 4 steps
  const estimatedPositive = Math.round(estimatedReplies * (targetSuccessRate / 100));
  const estimatedMeetings = Math.round(estimatedPositive * 0.6); // 60% of positives convert

  const plan: WeeklyPlan = {
    totalProspects: maxProspects,
    standardSequence: standardOnly,
    withReport: reportQualified,
    estimatedCost: maxProspects * costPerProspect,
    targetReplies: estimatedReplies,
    estimatedPositiveRate: targetSuccessRate,
    estimatedMeetings,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 10
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Apollo & Budget Automation</h1>
        <p className="text-white/50">
          Pull fresh prospects from Apollo automatically. Set your weekly budget and let the system plan everything.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Apollo */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Apollo Connection</h3>
            <div>
              <label className="block text-xs text-white/40 mb-1">Apollo API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Apollo API key"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
              />
              <p className="text-[10px] text-white/20 mt-1">
                Get it at app.apollo.io → Settings → Integrations → API
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">ICP Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">Job Titles</label>
                <TagInput
                  value={filters.titles}
                  onChange={(v) => setFilters({ ...filters, titles: v })}
                  placeholder="VP of Sales, Head of Marketing..."
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Industries</label>
                <TagInput
                  value={filters.industries}
                  onChange={(v) => setFilters({ ...filters, industries: v })}
                  placeholder="SaaS, Fintech, Healthcare..."
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Locations</label>
                <TagInput
                  value={filters.locations}
                  onChange={(v) => setFilters({ ...filters, locations: v })}
                  placeholder="United States, New York..."
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Keywords</label>
                <TagInput
                  value={filters.keywords}
                  onChange={(v) => setFilters({ ...filters, keywords: v })}
                  placeholder="growth, revenue, pipeline..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Min Employees</label>
                  <input
                    type="number"
                    value={filters.employeeCountMin}
                    onChange={(e) => setFilters({ ...filters, employeeCountMin: Number(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Max Employees</label>
                  <input
                    type="number"
                    value={filters.employeeCountMax}
                    onChange={(e) => setFilters({ ...filters, employeeCountMax: Number(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Results per pull</label>
                <select
                  value={filters.perPage}
                  onChange={(e) => setFilters({ ...filters, perPage: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none appearance-none"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n} className="bg-[#1a1a2e]">{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={search}
              disabled={isSearching || !apiKey}
              className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                !isSearching && apiKey
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              {isSearching ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching Apollo...
                </span>
              ) : !apiKey ? "Enter API key to search" : "Pull Prospects from Apollo"}
            </button>

            {error && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Pulled results */}
          {pulledProspects.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white/70">Apollo Results</h3>
                  <p className="text-xs text-white/30">
                    {pulledProspects.length} with email of {totalAvailable} total matches
                  </p>
                </div>
                <button
                  onClick={importToProspects}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Import to Prospects →
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {pulledProspects.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.03] rounded-lg p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-white/40 truncate">{p.title} · {p.company}</p>
                    </div>
                    <span className="text-xs text-white/20 flex-shrink-0 ml-2">{p.industry}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Budget & Weekly Plan */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Budget Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">Weekly Budget ($)</label>
                <input
                  type="number"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(Number(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Cost per Opportunity ($)</label>
                <input
                  type="number"
                  value={assetConfig.budgetPerOpportunity}
                  onChange={(e) => setAssetConfig({ ...assetConfig, budgetPerOpportunity: Number(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Target Positive Reply Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetSuccessRate}
                  onChange={(e) => setTargetSuccessRate(Number(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Historical Open Rate (%)</label>
                  <input
                    type="number"
                    value={historicalOpenRate}
                    onChange={(e) => setHistoricalOpenRate(Number(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Historical Reply Rate (%)</label>
                  <input
                    type="number"
                    value={historicalReplyRate}
                    onChange={(e) => setHistoricalReplyRate(Number(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Plan */}
          <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-violet-300 mb-5">Weekly Plan</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{plan.totalProspects}</p>
                <p className="text-xs text-white/40 mt-1">Prospects to contact</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">${plan.estimatedCost}</p>
                <p className="text-xs text-white/40 mt-1">Estimated spend</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-2xl font-bold text-emerald-400">{plan.targetReplies}</p>
                <p className="text-xs text-white/40 mt-1">Estimated replies</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-2xl font-bold text-violet-400">{plan.estimatedMeetings}</p>
                <p className="text-xs text-white/40 mt-1">Estimated meetings</p>
              </div>
            </div>

            {/* Allocation breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <span className="text-sm text-white/70">Standard sequence</span>
                </div>
                <span className="text-sm font-semibold text-white">{plan.standardSequence}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  <span className="text-sm text-white/70">Sequence + personalized report</span>
                </div>
                <span className="text-sm font-semibold text-violet-400">{plan.withReport}</span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4">
              <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                {plan.standardSequence > 0 && (
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${(plan.standardSequence / plan.totalProspects) * 100}%` }}
                  />
                )}
                {plan.withReport > 0 && (
                  <div
                    className="h-full bg-violet-500"
                    style={{ width: `${(plan.withReport / plan.totalProspects) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-indigo-400/60">Standard ({plan.totalProspects > 0 ? Math.round((plan.standardSequence / plan.totalProspects) * 100) : 0}%)</span>
                <span className="text-[10px] text-violet-400/60">With report ({plan.totalProspects > 0 ? Math.round((plan.withReport / plan.totalProspects) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* Target check */}
          <div className={`border rounded-xl p-5 ${
            plan.estimatedMeetings >= 10
              ? "bg-emerald-500/10 border-emerald-500/20"
              : plan.estimatedMeetings >= 5
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {plan.estimatedMeetings >= 10
                    ? "✓ On track for 10+ meetings/week"
                    : plan.estimatedMeetings >= 5
                    ? "⚠ Below target — increase budget or improve reply rate"
                    : "✕ Well below target — significant changes needed"}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  At {historicalReplyRate}% reply rate with {plan.totalProspects} prospects × 4 steps
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{plan.estimatedMeetings}</p>
                <p className="text-xs text-white/40">of 10 target</p>
              </div>
            </div>
          </div>

          {/* Workflow summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-3">Weekly Workflow</h3>
            <div className="space-y-2 text-sm text-white/50">
              <p>1. Pull {plan.totalProspects} prospects from Apollo with your ICP filters</p>
              <p>2. Auto-enrich all contacts with AI (Phase 4)</p>
              <p>3. Generate {plan.totalProspects} personalized sequences (Phase 5)</p>
              <p>4. Create A/B variants for testing (Phase 6)</p>
              <p>5. Generate {plan.withReport} personalized reports for top accounts (Phase 8)</p>
              <p>6. Export to Instantly or Lemlist and launch (Phase 7)</p>
              <p>7. After 1 week, import results and optimize (Phase 9)</p>
              <p>8. Repeat with next-gen copy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
