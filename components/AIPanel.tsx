"use client";

import { AIImprovement } from "@/types";
import { hasAnyProvider } from "@/lib/aiProvider";

interface Props {
  onGenerate: () => Promise<void>;
  result: AIImprovement | null;
  loading: boolean;
}

export default function AIPanel({ onGenerate, result, loading }: Props) {
  const available = hasAnyProvider();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-mono tracking-widest">// AI IMPROVEMENT</p>
        {!available && (
          <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
            NO_KEY
          </span>
        )}
      </div>

      <button
        onClick={available ? onGenerate : undefined}
        disabled={!available || loading}
        className={`w-full py-2 text-xs font-mono font-bold rounded border transition-colors ${
          !available
            ? "border-zinc-800 text-zinc-600 cursor-not-allowed"
            : loading
            ? "border-zinc-700 text-zinc-500 cursor-wait"
            : "border-cyan-800 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-600"
        }`}
      >
        {loading ? "[ GENERATING... ]" : !available ? "[ AI改善案を生成 — APIキー未設定 ]" : "[ AI改善案を生成 ]"}
      </button>

      {!available && (
        <p className="text-[10px] font-mono text-zinc-700 leading-relaxed">
          .env.local に CLAUDE_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY を設定すると有効になります。
          lib/providers/ に実装クラスを追加して providerRegistry に登録してください。
        </p>
      )}

      {result && available && (
        <div className="space-y-2 pt-1">
          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px] text-zinc-300 bg-zinc-900/60 border border-cyan-900/40 rounded px-2 py-1.5"
            >
              <span className="text-cyan-600 shrink-0 font-mono">✦</span>
              {s}
            </div>
          ))}
          {result.rewrittenLines?.map((r, i) => (
            <div key={i} className="text-[10px] font-mono border border-zinc-800 rounded p-2 space-y-1">
              <p className="text-zinc-600 line-through">{r.original}</p>
              <p className="text-zinc-200">{r.rewritten}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
