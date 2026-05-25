"use client";

import { useState } from "react";

interface Props {
  stylePrompt: string;
  lyrics: string;
  regeneratePrompt: string;
  negativePrompt: string;
}

function CopyBlock({
  label,
  content,
  rows = 6,
}: {
  label: string;
  content: string;
  rows?: number;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest">{label}</p>
        <button
          onClick={copy}
          className={`text-[10px] font-mono px-2 py-0.5 border rounded transition-colors ${
            copied
              ? "border-emerald-700 text-emerald-400"
              : "border-zinc-700 text-zinc-400 hover:border-cyan-700 hover:text-cyan-400"
          }`}
        >
          {copied ? "[COPIED ✓]" : "[COPY]"}
        </button>
      </div>
      <div
        className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-300 overflow-auto leading-loose"
        style={{ maxHeight: `${rows * 1.6}rem` }}
      >
        <pre className="whitespace-pre-wrap">{content || "—"}</pre>
      </div>
    </div>
  );
}

export default function FinalOutputPanel({
  stylePrompt,
  lyrics,
  regeneratePrompt,
  negativePrompt,
}: Props) {
  const [allCopied, setAllCopied] = useState(false);

  if (!stylePrompt && !lyrics) {
    return (
      <div className="text-center text-zinc-700 text-xs font-mono py-12">
        CONCEPT → PROMPT → LYRICS → TUNER の順に進めてください
      </div>
    );
  }

  const combined =
    [
      stylePrompt && `=== STYLE PROMPT ===\n${stylePrompt}`,
      negativePrompt && `\n=== NEGATIVE PROMPT ===\n${negativePrompt}`,
      lyrics && `\n=== LYRICS ===\n${lyrics}`,
      regeneratePrompt && `\n=== REGENERATE PROMPT ===\n${regeneratePrompt}`,
    ]
      .filter(Boolean)
      .join("\n");

  const copyAll = () => {
    navigator.clipboard.writeText(combined);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Copy All */}
      <button
        onClick={copyAll}
        className={`w-full py-2 font-mono font-bold text-xs tracking-widest rounded border transition-colors ${
          allCopied
            ? "bg-emerald-950 border-emerald-700 text-emerald-400"
            : "bg-cyan-700 hover:bg-cyan-600 border-cyan-600 text-zinc-950"
        }`}
      >
        {allCopied ? "[ COPIED ALL ✓ ]" : "[ COPY ALL ]"}
      </button>

      {stylePrompt && (
        <CopyBlock label="// STYLE PROMPT" content={stylePrompt} rows={11} />
      )}
      {lyrics && (
        <CopyBlock label="// LYRICS" content={lyrics} rows={20} />
      )}
      {regeneratePrompt && (
        <CopyBlock label="// REGENERATE PROMPT" content={regeneratePrompt} rows={3} />
      )}
      {negativePrompt && negativePrompt !== "none" && (
        <CopyBlock label="// NEGATIVE PROMPT" content={negativePrompt} rows={3} />
      )}
    </div>
  );
}
