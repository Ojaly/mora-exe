"use client";

import { AIImprovement } from "@/types";
import { hasAnyProvider } from "@/lib/aiProvider";

interface Props {
  onGenerate: () => Promise<void>;
  result: AIImprovement | null;
  loading: boolean;
}

export default function AIPanel({ onGenerate, result, loading }: Props) {
  const providerAvailable = hasAnyProvider();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          AI 改善案
        </h2>
        {!providerAvailable && (
          <span className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5">
            APIキー未設定
          </span>
        )}
      </div>

      <button
        onClick={providerAvailable ? onGenerate : undefined}
        disabled={!providerAvailable || loading}
        className={`w-full py-2.5 text-sm font-medium rounded border transition-colors ${
          !providerAvailable
            ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
            : loading
            ? "border-gray-300 text-gray-400 bg-gray-50 cursor-wait"
            : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
        }`}
      >
        {loading ? "生成中..." : !providerAvailable ? "AI改善案を生成（APIキー未設定）" : "AI改善案を生成"}
      </button>

      {!providerAvailable && (
        <p className="text-xs text-gray-400 leading-relaxed">
          Claude / OpenAI / Gemini のAPIキーを設定すると、AIによる歌詞改善案・フレーズ書き換えが利用できます。
          <br />
          設定方法: <code className="bg-gray-100 px-1 rounded">.env.local</code> に{" "}
          <code className="bg-gray-100 px-1 rounded">CLAUDE_API_KEY</code> などを追加してください。
        </p>
      )}

      {result && providerAvailable && (
        <div className="space-y-3 pt-1">
          {result.suggestions.length > 0 && (
            <ul className="space-y-1">
              {result.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50 border border-blue-100 rounded px-3 py-2"
                >
                  <span className="text-blue-400 shrink-0">✦</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
          {result.rewrittenLines && result.rewrittenLines.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                書き換え案
              </h3>
              {result.rewrittenLines.map((r, i) => (
                <div key={i} className="text-xs border border-gray-200 rounded p-2 space-y-1">
                  <p className="text-gray-400 font-mono line-through">{r.original}</p>
                  <p className="text-gray-800 font-mono">{r.rewritten}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
