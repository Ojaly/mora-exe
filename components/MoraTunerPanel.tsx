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
    <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
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
      <div className="text-center text-zinc-700 text-xs font-mono py-12">
        LYRICSタブで歌詞を編集後、「MORA TUNER で分析する」を押してください
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
        <div className="pb-2 border-b border-zinc-800">
          <SongStatsBar stats={songStats} />
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {SUB_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${
              subTab === key
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
        {dangerCount > 0 && (
          <button
            onClick={onApplyAll}
            className="ml-auto px-2 py-1 text-[10px] font-mono border border-amber-800 text-amber-500 rounded hover:bg-amber-950 transition-colors"
          >
            [AUTO FIX ALL]
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
                  <span className="text-[10px] font-mono text-zinc-600">{line.text}</span>
                </div>
              );
            }
            const suggestion = suggestions.find((s) => s.lineNumber === line.lineNumber);
            const isExpanded = expandedSuggestions.has(line.lineNumber);
            const dangerColor =
              line.danger === "long"
                ? "text-red-400"
                : line.danger === "short"
                ? "text-amber-400"
                : "text-zinc-300";

            return (
              <div
                key={line.lineNumber}
                className={`rounded ${
                  suggestion ? "bg-zinc-900/60 border border-zinc-800" : ""
                }`}
              >
                <div
                  className={`flex items-center gap-2 px-2 py-1 ${
                    suggestion ? "cursor-pointer hover:bg-zinc-800/40" : ""
                  }`}
                  onClick={() => suggestion && toggleSuggestion(line.lineNumber)}
                >
                  <span className="text-[10px] font-mono text-zinc-700 w-6 text-right shrink-0">
                    {line.lineNumber}
                  </span>
                  <MoraBar count={line.moraCount} />
                  <span className={`text-[10px] font-mono w-5 shrink-0 ${dangerColor}`}>
                    {line.moraCount}
                  </span>
                  <span className={`text-xs font-mono flex-1 truncate ${dangerColor}`}>
                    {line.text}
                  </span>
                  {suggestion && (
                    <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                      {isExpanded ? "▲" : "▼"} fix
                    </span>
                  )}
                </div>

                {/* Inline suggestions */}
                {suggestion && isExpanded && (
                  <div className="px-3 pb-2 space-y-1">
                    <p className="text-[10px] font-mono text-zinc-600 mb-1">
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
                        className="block w-full text-left px-2 py-1 text-xs font-mono text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 hover:border-cyan-800 transition-colors"
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
