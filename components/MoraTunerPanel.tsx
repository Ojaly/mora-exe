"use client";

import { useState } from "react";
import type { MoraLine, MoraSuggestion, PhraseMatch, SyntaxMatch, CollapseRisk, SongStats } from "@/types";
import SongStatsBar from "@/components/SongStats";
import CollapseReport from "@/components/CollapseReport";
import PhraseWarnings from "@/components/PhraseWarnings";

interface Props {
  lyrics: string;
  moraLines: MoraLine[];
  suggestions: MoraSuggestion[];
  phraseMatches: PhraseMatch[];
  syntaxMatches: SyntaxMatch[];
  collapseRisks: CollapseRisk[];
  songStats: SongStats | null;
  onApplyFix: (lineNumber: number, replacement: string | string[]) => void;
  onApplyAll: () => void;
}

function MoraBar({ count }: { count: number }) {
  const pct = Math.min(100, (count / 20) * 100);
  const color =
    count > 14 ? "bg-red-500" : count <= 3 && count > 0 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

type SubTab = "lines" | "collapse" | "phrases";

export default function MoraTunerPanel({
  lyrics,
  moraLines,
  suggestions,
  phraseMatches,
  syntaxMatches,
  collapseRisks,
  songStats,
  onApplyFix,
  onApplyAll,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>("lines");
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());

  if (!lyrics || moraLines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <span className="text-zinc-400 text-2xl">♩</span>
        <p className="text-[13px] font-mono text-zinc-500 text-center">
          歌詞を入力すると<br />モーラ分析が表示されます
        </p>
      </div>
    );
  }

  const toggleSuggestion = (lineNum: number) => {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  const dangerCount = suggestions.length;
  const SUB_TABS: [SubTab, string][] = [
    ["lines", `LINES${dangerCount > 0 ? ` (${dangerCount})` : ""}`],
    ["collapse", `COLLAPSE${collapseRisks.length > 0 ? ` (${collapseRisks.length})` : ""}`],
    ["phrases", `PHRASES${phraseMatches.length + syntaxMatches.length > 0 ? ` (${phraseMatches.length + syntaxMatches.length})` : ""}`],
  ];

  return (
    <div className="space-y-3">
      {/* Stats */}
      {songStats && (
        <div className="pb-2 border-b border-[#E2E8F0]">
          <SongStatsBar stats={songStats} />
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {SUB_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-3 py-1 text-[11px] font-mono rounded border transition-colors ${
              subTab === key
                ? "bg-white border-[#CBD5E1] text-zinc-900 font-semibold shadow-sm"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
        {dangerCount > 0 && (
          <button
            onClick={onApplyAll}
            className="ml-auto px-2 py-1 text-[11px] font-mono border border-amber-300 text-amber-700 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
          >
            AUTO FIX ALL
          </button>
        )}
      </div>

      {/* Lines tab */}
      {subTab === "lines" && (
        <div className="space-y-0.5">
          {moraLines.map((line) => {
            if (!line.text || line.warning === "空行") return null;
            const isTag = line.warning === "メタタグ行";
            if (isTag) {
              return (
                <div key={line.lineNumber} className="py-0.5">
                  <span className="text-[11px] font-mono text-violet-600 font-semibold">{line.text}</span>
                </div>
              );
            }
            const suggestion = suggestions.find((s) => s.lineNumber === line.lineNumber);
            const isExpanded = expandedSuggestions.has(line.lineNumber);
            const dangerColor =
              line.danger === "long"
                ? "text-red-600"
                : line.danger === "short"
                ? "text-amber-600"
                : "text-zinc-700";

            return (
              <div
                key={line.lineNumber}
                className={`rounded ${
                  suggestion ? "bg-amber-50 border border-amber-200" : ""
                }`}
              >
                <div
                  className={`flex items-center gap-2 px-2 py-1 ${
                    suggestion ? "cursor-pointer hover:bg-amber-100/60" : ""
                  }`}
                  onClick={() => suggestion && toggleSuggestion(line.lineNumber)}
                >
                  <span className="text-[10px] font-mono text-zinc-400 w-6 text-right shrink-0">
                    {line.lineNumber}
                  </span>
                  <MoraBar count={line.moraCount} />
                  <span className={`text-[11px] font-mono w-5 shrink-0 font-bold ${dangerColor}`}>
                    {line.moraCount}
                  </span>
                  <span className={`text-[12px] font-mono flex-1 truncate ${dangerColor}`}>
                    {line.text}
                  </span>
                  {suggestion && (
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      {isExpanded ? "▲" : "▼"} fix
                    </span>
                  )}
                </div>

                {/* Inline suggestions */}
                {suggestion && isExpanded && (
                  <div className="px-3 pb-2 space-y-1">
                    <p className="text-[11px] font-mono text-zinc-500 mb-1">
                      {suggestion.danger === "long"
                        ? `▲ ${suggestion.moraCount}モーラ — 以下から選択または分割:`
                        : `▼ ${suggestion.moraCount}モーラ — 行を延長:`}
                    </p>
                    {suggestion.alternatives.map((alt, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          onApplyFix(
                            line.lineNumber,
                            suggestion.danger === "long" && suggestion.alternatives.length === 2
                              ? suggestion.alternatives
                              : alt
                          )
                        }
                        className="block w-full text-left px-2 py-1 text-[12px] font-mono text-zinc-700 bg-white hover:bg-slate-50 rounded border border-[#E2E8F0] hover:border-slate-400 transition-colors"
                      >
                        {Array.isArray(suggestion.alternatives) &&
                        suggestion.danger === "long" &&
                        i === 0 &&
                        suggestion.alternatives.length === 2
                          ? `[↕ 分割] ${suggestion.alternatives[0]}  /  ${suggestion.alternatives[1]}`
                          : `→ ${alt}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Collapse tab */}
      {subTab === "collapse" && (
        <CollapseReport risks={collapseRisks} />
      )}

      {/* Phrases tab */}
      {subTab === "phrases" && (
        <PhraseWarnings phraseMatches={phraseMatches} syntaxMatches={syntaxMatches} />
      )}
    </div>
  );
}
