"use client";

import { useState, useCallback, useEffect } from "react";
import Papa from "papaparse";
import ColumnMapper from "@/components/ColumnMapper";
import { Prospect, REQUIRED_FIELDS } from "@/lib/types";
import ProspectTable from "@/components/ProspectTable";

type Step = "upload" | "map" | "review";

export default function ProspectsPage() {
  const [step, setStep] = useState<Step>("upload");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");

  // Load saved prospects on mount
  useEffect(() => {
    const saved = localStorage.getItem("prospects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setProspects(parsed);
          setStep("review");
        }
      } catch {}
    }
  }, []);

  // Save prospects when they change
  useEffect(() => {
    if (prospects.length > 0) {
      localStorage.setItem("prospects", JSON.stringify(prospects));
    }
  }, [prospects]);

  const handleCSV = useCallback((file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        setRawHeaders(headers);
        setRawRows(rows);

        // Auto-map obvious column names
        const autoMap: Record<string, string> = {};
        const aliases: Record<string, string[]> = {
          first_name: ["first_name", "firstname", "first name", "first", "given name"],
          last_name: ["last_name", "lastname", "last name", "last", "surname", "family name"],
          email: ["email", "email address", "e-mail", "emailaddress", "work email", "contact email"],
          title: ["title", "job title", "jobtitle", "role", "position", "job_title"],
          company: ["company", "company name", "companyname", "organization", "org", "company_name"],
          industry: ["industry", "sector", "vertical", "industry_name"],
          linkedin_url: ["linkedin_url", "linkedin", "linkedin url", "linkedin_profile", "profile url", "li url", "person linkedin url"],
        };

        for (const [field, alts] of Object.entries(aliases)) {
          for (const header of headers) {
            if (alts.includes(header.toLowerCase().trim())) {
              autoMap[field] = header;
              break;
            }
          }
        }

        setMapping(autoMap);
        setStep("map");
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".tsv"))) {
        handleCSV(file);
      }
    },
    [handleCSV]
  );

  const applyMapping = () => {
    const mapped: Prospect[] = rawRows.map((row) => {
      const prospect: Record<string, string> = {};
      for (const field of REQUIRED_FIELDS) {
        const sourceCol = mapping[field.key];
        prospect[field.key] = sourceCol ? (row[sourceCol] || "").trim() : "";
      }
      return prospect as Prospect;
    });

    // Filter out rows with no email
    const valid = mapped.filter((p) => p.email && p.email.includes("@"));
    setProspects(valid);
    setStep("review");
  };

  const handleReset = () => {
    setStep("upload");
    setRawHeaders([]);
    setRawRows([]);
    setMapping({});
    setProspects([]);
    setFileName("");
    localStorage.removeItem("prospects");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 3
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Prospects</h1>
        <p className="text-white/50">
          Upload a CSV of contacts. Map columns to standard fields. Review before enrichment.
        </p>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all ${
            dragActive
              ? "border-violet-500 bg-violet-600/10"
              : "border-white/10 hover:border-white/20 bg-white/[0.02]"
          }`}
        >
          <input
            type="file"
            accept=".csv,.tsv"
            onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-4xl mb-3">📊</div>
          <p className="text-lg text-white/60 mb-1">
            Drop your CSV here, or <span className="text-violet-400">click to browse</span>
          </p>
          <p className="text-xs text-white/30">
            Supports CSV and TSV. Must include at least an email column.
          </p>
        </div>
      )}

      {/* Step: Map columns */}
      {step === "map" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-white/70">
                Uploaded: <span className="text-white font-medium">{fileName}</span>
                {" · "}
                <span className="text-white/40">{rawRows.length} rows, {rawHeaders.length} columns</span>
              </p>
            </div>
            <button
              onClick={() => setStep("upload")}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              ← Re-upload
            </button>
          </div>

          <ColumnMapper
            rawHeaders={rawHeaders}
            mapping={mapping}
            onMappingChange={setMapping}
            sampleRow={rawRows[0]}
          />

          <button
            onClick={applyMapping}
            disabled={!mapping.email}
            className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              mapping.email
                ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {mapping.email
              ? `Map & Import ${rawRows.length} Contacts`
              : "Map at least the Email column to continue"}
          </button>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                <span className="text-emerald-400 text-sm font-semibold">{prospects.length}</span>
                <span className="text-emerald-400/60 text-sm ml-1">contacts imported</span>
              </div>
              {prospects.filter((p) => !p.title).length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  <span className="text-amber-400 text-sm font-semibold">
                    {prospects.filter((p) => !p.title).length}
                  </span>
                  <span className="text-amber-400/60 text-sm ml-1">missing title</span>
                </div>
              )}
              {prospects.filter((p) => !p.company).length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  <span className="text-amber-400 text-sm font-semibold">
                    {prospects.filter((p) => !p.company).length}
                  </span>
                  <span className="text-amber-400/60 text-sm ml-1">missing company</span>
                </div>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Clear & re-upload
            </button>
          </div>

          <ProspectTable prospects={prospects} />
        </div>
      )}
    </div>
  );
}
