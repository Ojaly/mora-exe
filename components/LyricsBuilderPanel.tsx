"use client";

import { useState } from "react";
import { RewriteMode } from "@/types";
import { REWRITE_MODE_LABELS } from "@/lib/rewriteModes";

interface Props {
  lyrics: string;
  onChange: (v: string) => void;
  onRewrite: (mode: RewriteMode) => void;
  onSendToTuner: () => void;
}

const REWRITE_MODES: RewriteMode[] = [
  "catchy",
  "remove-ai",
  "shorten-mora",
  "strengthen-chorus",
  "more-japanese",
  "more-english",
  "darker",
  "danceable",
  "ojaly",
];

export default function LyricsBuilderPanel({
  lyrics,
  onChange,
  onRewrite,
  onSendToTuner,
}: Props) {
  const [lastMode, setLastMode] = useState<RewriteMode | null>(null);

  if (!lyrics) {
    return (
      <div className="text-center text-zinc-700 text-xs font-mono py-12">
        CONCEPTを入力して [ GENERATE ] を押してください
      </div>
    );
  }

  const handleRewrite = (mode: RewriteMode) => {
    setLastMode(mode);
    onRewrite(mode);
  };

  return (
    <div className="space-y-4">
      {/* Lyrics editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest">// LYRICS DRAFT</p>
          <span className="text-[10px] font-mono text-zinc-600">直接編集可</span>
        </div>
        <textarea
          value={lyrics}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-200 resize-none focus:outline-none focus:border-cyan-800 leading-loose"
          spellCheck={false}
        />
      </div>

      {/* Rewrite modes */}
      <div>
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest mb-2">
          // REWRITE MODE
        </p>
        <div className="flex flex-wrap gap-1.5">
          {REWRITE_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => handleRewrite(mode)}
              className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                lastMode === mode
                  ? "border-cyan-600 text-cyan-400 bg-cyan-950"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {REWRITE_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-700 font-mono mt-1">
          ※ ルールベース変換。適用後も自由に編集できます
        </p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Send to Tuner */}
      <button
        onClick={onSendToTuner}
        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-xs tracking-widest rounded transition-colors border border-zinc-700"
      >
        [ MORA TUNER で分析する → ]
      </button>
    </div>
  );
}
