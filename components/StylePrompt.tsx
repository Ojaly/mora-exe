"use client";

import { useState } from "react";

interface Props {
  prompt: string;
}

export default function StylePrompt({ prompt }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-mono tracking-widest">// STYLE PROMPT</p>
        <button
          onClick={handleCopy}
          className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
            copied
              ? "border-emerald-600 text-emerald-400"
              : "border-zinc-700 text-zinc-500 hover:border-cyan-600 hover:text-cyan-400"
          }`}
        >
          {copied ? "[COPIED]" : "[COPY]"}
        </button>
      </div>
      <pre className="bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
        {prompt}
      </pre>
    </div>
  );
}
