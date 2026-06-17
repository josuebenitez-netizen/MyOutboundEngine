"use client";

import { REQUIRED_FIELDS } from "@/lib/types";

interface Props {
  rawHeaders: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  sampleRow?: Record<string, string>;
}

export default function ColumnMapper({ rawHeaders, mapping, onMappingChange, sampleRow }: Props) {
  const updateMapping = (field: string, header: string) => {
    const updated = { ...mapping };
    if (header === "") {
      delete updated[field];
    } else {
      updated[field] = header;
    }
    onMappingChange(updated);
  };

  const usedHeaders = new Set(Object.values(mapping));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[200px_1fr_1fr] gap-3 text-xs font-semibold text-white/40 uppercase tracking-wide px-1 mb-1">
        <span>Field</span>
        <span>Map to CSV column</span>
        <span>Sample value</span>
      </div>

      {REQUIRED_FIELDS.map((field) => {
        const mapped = mapping[field.key] || "";
        const isRequired = field.key === "email";
        const isMapped = !!mapped;
        const sampleVal = mapped && sampleRow ? sampleRow[mapped] : "";

        return (
          <div
            key={field.key}
            className={`grid grid-cols-[200px_1fr_1fr] gap-3 items-center p-3 rounded-lg border transition-all ${
              isMapped
                ? "bg-emerald-500/5 border-emerald-500/20"
                : isRequired
                ? "bg-red-500/5 border-red-500/20"
                : "bg-white/[0.02] border-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isMapped ? "text-emerald-400" : "text-white/70"}`}>
                {field.label}
              </span>
              {isRequired && !isMapped && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                  Required
                </span>
              )}
            </div>

            <select
              value={mapped}
              onChange={(e) => updateMapping(field.key, e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-violet-500/50"
            >
              <option value="" className="bg-[#1a1a2e]">
                — Skip —
              </option>
              {rawHeaders.map((h) => (
                <option
                  key={h}
                  value={h}
                  disabled={usedHeaders.has(h) && mapping[field.key] !== h}
                  className="bg-[#1a1a2e]"
                >
                  {h} {usedHeaders.has(h) && mapping[field.key] !== h ? "(used)" : ""}
                </option>
              ))}
            </select>

            <span className="text-sm text-white/40 truncate">
              {sampleVal || "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
