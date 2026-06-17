"use client";

import { useState, useEffect } from "react";
import {
  ProspectSequence,
  ProspectVariants,
  SequenceConfig,
  EnrichedProspect,
  Email,
  DEFAULT_SEQUENCE_CONFIG,
} from "@/lib/types";

type Platform = "instantly" | "lemlist";

function resolveEmail(
  seq: ProspectSequence,
  variants: ProspectVariants | undefined,
  stepIdx: number
): Email {
  if (!variants || !variants.steps[stepIdx]) return seq.steps[stepIdx];

  const sv = variants.steps[stepIdx];
  switch (sv.selected) {
    case "A":
      return sv.variants[0] || sv.original;
    case "B":
      return sv.variants[1] || sv.original;
    case "random": {
      const options = [sv.original, ...sv.variants.filter(Boolean)];
      return options[Math.floor(Math.random() * options.length)];
    }
    default:
      return sv.original;
  }
}

function escapeCSV(val: string): string {
  if (!val) return '""';
  if (val.includes('"') || val.includes(",") || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function generateInstantlyCSV(
  sequences: ProspectSequence[],
  variants: ProspectVariants[],
  prospects: EnrichedProspect[],
  config: SequenceConfig
): string {
  const headers = [
    "email",
    "first_name",
    "last_name",
    "company_name",
    "title",
    "industry",
  ];

  // Add step columns
  config.steps.forEach((step) => {
    headers.push(`step${step.stepNumber}_subject`);
    headers.push(`step${step.stepNumber}_body`);
    headers.push(`step${step.stepNumber}_delay`);
  });

  const rows: string[] = [headers.join(",")];

  for (const seq of sequences) {
    const prospect = prospects.find((p) => p.email === seq.prospectEmail);
    const pv = variants.find((v) => v.prospectEmail === seq.prospectEmail);

    const row: string[] = [
      escapeCSV(seq.prospectEmail),
      escapeCSV(prospect?.first_name || ""),
      escapeCSV(prospect?.last_name || ""),
      escapeCSV(prospect?.company || ""),
      escapeCSV(prospect?.title || ""),
      escapeCSV(prospect?.industry || ""),
    ];

    config.steps.forEach((step, i) => {
      const email = resolveEmail(seq, pv, i);
      const body = email.body
        .replace(/\{\{first_name\}\}/g, "{{firstName}}")
        + "\n\n" + email.cta;
      row.push(escapeCSV(email.subject));
      row.push(escapeCSV(body));
      row.push(String(step.dayDelay));
    });

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

function generateLemlistCSV(
  sequences: ProspectSequence[],
  variants: ProspectVariants[],
  prospects: EnrichedProspect[],
  config: SequenceConfig
): string {
  const headers = [
    "email",
    "firstName",
    "lastName",
    "companyName",
    "jobTitle",
    "industry",
    "linkedinUrl",
    "icebreaker",
  ];

  config.steps.forEach((step) => {
    headers.push(`step${step.stepNumber}Subject`);
    headers.push(`step${step.stepNumber}Body`);
  });

  const rows: string[] = [headers.join(",")];

  for (const seq of sequences) {
    const prospect = prospects.find((p) => p.email === seq.prospectEmail);
    const pv = variants.find((v) => v.prospectEmail === seq.prospectEmail);

    const row: string[] = [
      escapeCSV(seq.prospectEmail),
      escapeCSV(prospect?.first_name || ""),
      escapeCSV(prospect?.last_name || ""),
      escapeCSV(prospect?.company || ""),
      escapeCSV(prospect?.title || ""),
      escapeCSV(prospect?.industry || ""),
      escapeCSV(prospect?.linkedin_url || ""),
      escapeCSV(prospect?.enrichment?.icebreaker || ""),
    ];

    config.steps.forEach((_step, i) => {
      const email = resolveEmail(seq, pv, i);
      const body = email.body
        .replace(/\{\{first_name\}\}/g, "{{firstName}}")
        + "\n\n" + email.cta;
      row.push(escapeCSV(email.subject));
      row.push(escapeCSV(body));
    });

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

export default function ExportPage() {
  const [platform, setPlatform] = useState<Platform>("instantly");
  const [sequences, setSequences] = useState<ProspectSequence[]>([]);
  const [variants, setVariants] = useState<ProspectVariants[]>([]);
  const [prospects, setProspects] = useState<EnrichedProspect[]>([]);
  const [config, setConfig] = useState<SequenceConfig>(DEFAULT_SEQUENCE_CONFIG);
  const [preview, setPreview] = useState<string>("");
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const savedSeqs = localStorage.getItem("sequences");
    const savedVariants = localStorage.getItem("variants");
    const savedProspects = localStorage.getItem("enrichedProspects");
    const savedConfig = localStorage.getItem("sequenceConfig");

    if (savedSeqs) try { setSequences(JSON.parse(savedSeqs)); } catch {}
    if (savedVariants) try { setVariants(JSON.parse(savedVariants)); } catch {}
    if (savedProspects) try { setProspects(JSON.parse(savedProspects)); } catch {}
    if (savedConfig) try { setConfig(JSON.parse(savedConfig)); } catch {}
  }, []);

  useEffect(() => {
    if (sequences.length === 0) return;
    const csv =
      platform === "instantly"
        ? generateInstantlyCSV(sequences, variants, prospects, config)
        : generateLemlistCSV(sequences, variants, prospects, config);
    setPreview(csv);
    setExported(false);
  }, [platform, sequences, variants, prospects, config]);

  const download = () => {
    const blob = new Blob([preview], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outbound_${platform}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const randomCount = variants.reduce(
    (acc, pv) => acc + pv.steps.filter((s) => s.selected === "random").length,
    0
  );

  const variantCount = variants.reduce(
    (acc, pv) => acc + pv.steps.filter((s) => s.selected === "A" || s.selected === "B").length,
    0
  );

  if (sequences.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 7
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Export</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/50 mb-2">No sequences to export yet.</p>
          <a href="/sequences" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Go to Sequences first
          </a>
        </div>
      </div>
    );
  }

  const previewRows = preview.split("\n");
  const headerRow = previewRows[0]?.split(",") || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 7
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Export</h1>
        <p className="text-white/50">
          Download your sequences as a CSV ready to import into your sending platform.
        </p>
      </div>

      {/* Platform toggle */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-white/40">Platform:</span>
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
          {(["instantly", "lemlist"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                platform === p
                  ? "bg-violet-600 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{sequences.length}</p>
          <p className="text-xs text-white/40 mt-1">Prospects</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">
            {sequences.length * config.steps.length}
          </p>
          <p className="text-xs text-white/40 mt-1">Total emails</p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-indigo-400">{variantCount}</p>
          <p className="text-xs text-indigo-400/60 mt-1">Using variants (A/B)</p>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-violet-400">{randomCount}</p>
          <p className="text-xs text-violet-400/60 mt-1">Randomized steps</p>
        </div>
      </div>

      {/* Platform info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">
          {platform === "instantly" ? "Instantly" : "Lemlist"} Import Guide
        </h3>
        {platform === "instantly" ? (
          <div className="text-sm text-white/50 space-y-1">
            <p>1. Go to Instantly → Campaigns → Create Campaign</p>
            <p>2. Click &ldquo;Upload Leads&rdquo; → import the CSV</p>
            <p>3. Map the step columns to your sequence steps</p>
            <p>4. Set the delays between steps to match the day values</p>
            <p>5. Variables: {'{{firstName}}'} auto-maps from the first_name column</p>
          </div>
        ) : (
          <div className="text-sm text-white/50 space-y-1">
            <p>1. Go to Lemlist → Create Campaign → Add Step(s)</p>
            <p>2. Import Leads → upload the CSV</p>
            <p>3. Map columns: firstName, lastName, companyName, etc.</p>
            <p>4. Use custom variables in email templates: {'{{firstName}}'}, {'{{icebreaker}}'}</p>
            <p>5. Step subjects and bodies are in stepNSubject / stepNBody columns</p>
          </div>
        )}
      </div>

      {/* CSV Preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/70">CSV Preview</h3>
          <span className="text-xs text-white/30">{headerRow.length} columns · {previewRows.length - 1} rows</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10 max-h-64">
          <table className="text-xs">
            <thead>
              <tr className="bg-white/5">
                {headerRow.map((h, i) => (
                  <th key={i} className="text-left px-3 py-2 text-white/40 font-semibold whitespace-nowrap border-r border-white/5 last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.slice(1, 6).map((row, i) => {
                const cells = row.match(/(".*?"|[^,]+|(?<=,)(?=,))/g) || [];
                return (
                  <tr key={i} className="border-t border-white/5">
                    {cells.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-white/60 max-w-[200px] truncate whitespace-nowrap border-r border-white/5 last:border-r-0">
                        {cell.replace(/^"|"$/g, "").slice(0, 60)}
                        {cell.length > 60 ? "…" : ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {previewRows.length > 6 && (
          <p className="text-xs text-white/20 mt-2">Showing first 5 of {previewRows.length - 1} rows</p>
        )}
      </div>

      {/* Download */}
      <button
        onClick={download}
        className="w-full py-4 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all"
      >
        {exported ? "✓ Downloaded — Click to re-download" : `Download ${platform === "instantly" ? "Instantly" : "Lemlist"} CSV`}
      </button>

      {exported && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-400">
            Export complete! Import the CSV into {platform === "instantly" ? "Instantly" : "Lemlist"} and launch your campaign.
          </p>
        </div>
      )}
    </div>
  );
}
