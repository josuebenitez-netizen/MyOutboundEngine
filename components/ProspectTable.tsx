"use client";

import { useState } from "react";
import { Prospect } from "@/lib/types";

interface Props {
  prospects: Prospect[];
}

export default function ProspectTable({ prospects }: Props) {
  const [page, setPage] = useState(0);
  const perPage = 25;
  const totalPages = Math.ceil(prospects.length / perPage);
  const slice = prospects.slice(page * perPage, (page + 1) * perPage);

  const cols = [
    { key: "first_name", label: "First" },
    { key: "last_name", label: "Last" },
    { key: "email", label: "Email" },
    { key: "title", label: "Title" },
    { key: "company", label: "Company" },
    { key: "industry", label: "Industry" },
  ];

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3 w-10">
                #
              </th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="text-left text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((p, i) => (
              <tr
                key={i}
                className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-2.5 text-white/20 text-xs">
                  {page * perPage + i + 1}
                </td>
                {cols.map((c) => {
                  const val = p[c.key];
                  const missing = !val;
                  return (
                    <td key={c.key} className="px-4 py-2.5">
                      {missing ? (
                        <span className="text-xs text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded">
                          Missing
                        </span>
                      ) : (
                        <span className="text-white/80">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-white/30">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, prospects.length)} of{" "}
            {prospects.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
