"use client";

import { SequenceConfig } from "@/lib/types";

interface Props {
  config: SequenceConfig;
  onChange: (config: SequenceConfig) => void;
}

export default function SequenceConfigurator({ config, onChange }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Sequence Configuration</h3>
      </div>

      {/* Sender info */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-1">Your Name *</label>
          <input
            value={config.senderName}
            onChange={(e) => onChange({ ...config, senderName: e.target.value })}
            placeholder="Jane Smith"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Your Title</label>
          <input
            value={config.senderTitle}
            onChange={(e) => onChange({ ...config, senderTitle: e.target.value })}
            placeholder="Head of Growth"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Company Name</label>
          <input
            value={config.companyName}
            onChange={(e) => onChange({ ...config, companyName: e.target.value })}
            placeholder="Acme Inc"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs text-white/40 mb-3">Sequence Steps</label>
        <div className="space-y-2">
          {config.steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                {step.stepNumber}
              </div>
              <div className="flex-1 grid grid-cols-[140px_60px_1fr] gap-3 items-center">
                <input
                  value={step.label}
                  onChange={(e) => {
                    const updated = [...config.steps];
                    updated[i] = { ...updated[i], label: e.target.value };
                    onChange({ ...config, steps: updated });
                  }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/30">Day</span>
                  <input
                    type="number"
                    value={step.dayDelay}
                    onChange={(e) => {
                      const updated = [...config.steps];
                      updated[i] = { ...updated[i], dayDelay: parseInt(e.target.value) || 0 };
                      onChange({ ...config, steps: updated });
                    }}
                    className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <input
                  value={step.goal}
                  onChange={(e) => {
                    const updated = [...config.steps];
                    updated[i] = { ...updated[i], goal: e.target.value };
                    onChange({ ...config, steps: updated });
                  }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 focus:outline-none focus:border-violet-500/50"
                  placeholder="Goal for this step"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
