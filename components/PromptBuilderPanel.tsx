"use client";

import { useState } from "react";

interface Props {
  stylePrompt: string;
  negativePrompt: string;
  onStyleChange: (v: string) => void;
  onNegativeChange: (v: string) => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="text-[10px] font-mono px-2 py-0.5 border border-zinc-700 rounded hover:border-cyan-700 text-zinc-400 hover:text-cyan-400 transition-colors"
    >
      {copied ? "[COPIED]" : `[COPY ${label}]`}
    </button>
  );
}

export default function PromptBuilderPanel({
  stylePrompt,
  negativePrompt,
  onStyleChange,
  onNegativeChange,
}: Props) {
  if (!stylePrompt) {
    return (
      <div className="text-center text-zinc-700 text-xs font-mono py-12">
        CONCEPTを入力して [ GENERATE ] を押してください
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Style Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest">// STYLE PROMPT</p>
          <CopyButton text={stylePrompt} label="STYLE" />
        </div>
        <textarea
          value={stylePrompt}
          onChange={(e) => onStyleChange(e.target.value)}
          rows={11}
          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-200 resize-none focus:outline-none focus:border-cyan-800 leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Negative Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest">
            // NEGATIVE PROMPT
          </p>
          <CopyButton text={negativePrompt} label="NEG" />
        </div>
        <textarea
          value={negativePrompt}
          onChange={(e) => onNegativeChange(e.target.value)}
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-500 resize-none focus:outline-none focus:border-zinc-700 leading-relaxed"
          spellCheck={false}
        />
        <p className="text-[10px] text-zinc-700 font-mono mt-1">
          ※ Suno の「Style of Music」欄の末尾に追加してください
        </p>
      </div>
    </div>
  );
}
