"use client";

import { useState, useCallback, useEffect } from "react";
import KnowledgeBaseCards from "@/components/KnowledgeBaseCards";

interface KnowledgeBase {
  productSummary: string;
  icp: string;
  valueProps: { persona: string; prop: string }[];
  proofPoints: string[];
  objections: { objection: string; response: string }[];
}

export default function KnowledgeBasePage() {
  const [rawText, setRawText] = useState("");
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("knowledgeBase");
    if (saved) {
      try { setKnowledgeBase(JSON.parse(saved)); } catch {}
    }
    const savedText = localStorage.getItem("knowledgeBaseRawText");
    if (savedText) setRawText(savedText);
  }, []);

  // Save KB to localStorage when it changes
  useEffect(() => {
    if (knowledgeBase) {
      localStorage.setItem("knowledgeBase", JSON.stringify(knowledgeBase));
    }
  }, [knowledgeBase]);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: { name: string; content: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "txt" || ext === "md" || ext === "csv") {
        const text = await readFileAsText(file);
        newFiles.push({ name: file.name, content: text });
      } else if (ext === "pdf" || ext === "pptx" || ext === "docx") {
        const b64 = await readFileAsBase64(file);
        newFiles.push({
          name: file.name,
          content: `[BASE64_FILE:${ext}:${file.name}]\n${b64.slice(0, 500)}...(truncated for preview)`,
        });
      } else {
        newFiles.push({ name: file.name, content: `[Unsupported file type: ${ext}]` });
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleExtract = async () => {
    setIsExtracting(true);
    localStorage.setItem("knowledgeBaseRawText", rawText);

    const contextParts: string[] = [];
    if (rawText.trim()) contextParts.push(rawText.trim());
    files.forEach((f) => contextParts.push(`--- File: ${f.name} ---\n${f.content}`));
    const fullContext = contextParts.join("\n\n");

    try {
      const res = await fetch("/api/extract-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: fullContext }),
      });
      const data = await res.json();
      if (data.knowledgeBase) {
        setKnowledgeBase(data.knowledgeBase);
      }
    } catch (err) {
      console.error("Extraction failed:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const hasInput = rawText.trim().length > 0 || files.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
          Phase 2
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
        <p className="text-white/50">
          Tell us everything about your product or service. Upload files, paste text, or both.
          Claude will extract a structured knowledge base that powers every email.
        </p>
      </div>

      {/* Input section */}
      <div className="space-y-6">
        {/* Text input */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Describe your product / service
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"What do you sell?\nWho do you sell to?\nWhat problems do you solve?\nWhat makes you different?\nAny case studies or proof points?"}
            className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Upload files (PDF, PPTX, TXT, MD)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-violet-500 bg-violet-600/10"
                : "border-white/10 hover:border-white/20 bg-white/[0.02]"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.pptx,.txt,.md,.csv,.docx"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm text-white/50">
              Drag & drop files here, or <span className="text-violet-400">click to browse</span>
            </p>
            <p className="text-xs text-white/30 mt-1">PDF, PPTX, DOCX, TXT, MD</p>
          </div>
        </div>

        {/* Uploaded files list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">Uploaded files</p>
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <span className="text-sm text-white/80">{f.name}</span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-white/30 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Extract button */}
        <button
          onClick={handleExtract}
          disabled={!hasInput || isExtracting}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            hasInput && !isExtracting
              ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          }`}
        >
          {isExtracting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Extracting knowledge base...
            </span>
          ) : (
            "Extract Knowledge Base"
          )}
        </button>
      </div>

      {/* Knowledge base output */}
      {knowledgeBase && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Extracted Knowledge Base</h2>
            <button
              onClick={() => {
                localStorage.removeItem("knowledgeBase");
                setKnowledgeBase(null);
              }}
              className="text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Clear & re-extract
            </button>
          </div>
          <KnowledgeBaseCards
            knowledgeBase={knowledgeBase}
            onUpdate={(updated) => setKnowledgeBase(updated)}
          />
        </div>
      )}
    </div>
  );
}
