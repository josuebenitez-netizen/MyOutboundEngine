"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    section: "Setup",
    items: [
      { label: "Knowledge Base", href: "/knowledge-base", icon: "🧠", phase: "2" },
      { label: "Prospects", href: "/prospects", icon: "👥", phase: "3" },
    ],
  },
  {
    section: "Generate",
    items: [
      { label: "Enrichment", href: "/enrichment", icon: "✨", phase: "4" },
      { label: "Sequences", href: "/sequences", icon: "✉️", phase: "5" },
      { label: "A/B Variants", href: "/variants", icon: "🔀", phase: "6" },
    ],
  },
  {
    section: "Launch",
    items: [
      { label: "Export", href: "/export", icon: "📤", phase: "7" },
      { label: "Assets", href: "/assets", icon: "📄", phase: "8" },
    ],
  },
  {
    section: "Optimize",
    items: [
      { label: "Results", href: "/results", icon: "📊", phase: "9" },
      { label: "Apollo", href: "/apollo", icon: "🚀", phase: "10" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f0f17] border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-white">OutboundEngine</p>
            <p className="text-xs text-white/40">AI-powered outreach</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 px-2">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? "bg-violet-600/20 text-violet-300 font-medium"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px] text-white/20 font-mono">
                        P{item.phase}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="rounded-lg bg-violet-600/10 border border-violet-500/20 p-3">
          <p className="text-xs text-violet-300 font-medium">Phase 1 Complete</p>
          <p className="text-xs text-white/40 mt-0.5">Scaffold & Deploy</p>
        </div>
      </div>
    </aside>
  );
}
