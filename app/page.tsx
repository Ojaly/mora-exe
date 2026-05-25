"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import StylePrompt from "@/components/StylePrompt";
import MoraTable from "@/components/MoraTable";
import MoraHeatmap from "@/components/MoraHeatmap";
import PhraseWarnings from "@/components/PhraseWarnings";
import ImprovementMemo from "@/components/ImprovementMemo";
import AIPanel from "@/components/AIPanel";
import CollapseReport from "@/components/CollapseReport";
import SongStats from "@/components/SongStats";
import WorldPresetSelector from "@/components/WorldPresetSelector";
import { SongInput, AnalysisResult, AIImprovement, WorldPresetKey } from "@/types";
import { analyzeLyrics, calcSongStats } from "@/lib/moraAnalyzer";
import { detectAiPhrases, detectSyntaxPatterns } from "@/lib/phraseDetector";
import { buildStylePrompt, buildImprovementMemo } from "@/lib/promptBuilder";
import { predictCollapse } from "@/lib/collapsePredictor";

const defaultInput: SongInput = {
  title: "",
  genre: "jpop",
  bpm: "",
  mood: "melancholic",
  vocalType: "female",
  lyrics: "",
  startWithChorus: false,
  englishRatio: "low",
  avoidAiCliche: false,
  worldPreset: "",
};

export default function Home() {
  const [input, setInput] = useState<SongInput>(defaultInput);
  const [preset, setPreset] = useState<WorldPresetKey | "">("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [aiResult, setAiResult] = useState<AIImprovement | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAnalyze = () => {
    const moraLines = analyzeLyrics(input.lyrics);
    const phraseMatches = detectAiPhrases(input.lyrics);
    const syntaxMatches = detectSyntaxPatterns(input.lyrics);
    const collapseRisks = predictCollapse(input.lyrics, moraLines);
    const stylePrompt = buildStylePrompt(input, preset);
    const songStats = calcSongStats(moraLines, input.lyrics);

    const longLines = moraLines.filter((l) => l.danger === "long").length;
    const shortLines = moraLines.filter(
      (l) => l.danger === "short" && l.warning !== "空行" && l.warning !== "メタタグ行"
    ).length;
    const improvementMemo = buildImprovementMemo(input, longLines, shortLines);

    setResult({ stylePrompt, moraLines, phraseMatches, syntaxMatches, collapseRisks, improvementMemo, songStats });
    setAiResult(null);
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanlines pointer-events-none z-0 opacity-40" />

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          <span className="font-mono font-bold text-base text-cyan-400 neon-cyan tracking-widest">
            MORA<span className="text-zinc-600">.</span>exe
          </span>
          <span className="text-zinc-700 font-mono text-xs hidden sm:block">
            Suno Prompt Engineer v0.2
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            {result && <SongStats stats={result.songStats} />}
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-5">
        <div className={`grid gap-4 ${result ? "grid-cols-1 lg:grid-cols-[360px_1fr]" : "grid-cols-1 max-w-sm mx-auto"}`}>

          {/* ── Left: Input ── */}
          <aside className="space-y-3">
            <div className="panel">
              <WorldPresetSelector selected={preset} onChange={setPreset} />
            </div>
            <div className="panel">
              <p className="text-xs text-zinc-500 font-mono tracking-widest mb-3">// INPUT</p>
              <InputForm input={input} onChange={setInput} onAnalyze={handleAnalyze} />
            </div>
          </aside>

          {/* ── Right: Results ── */}
          {result && (
            <section className="space-y-3 min-w-0">
              {/* Style Prompt */}
              <div className="panel">
                <StylePrompt prompt={result.stylePrompt} />
              </div>

              {/* Collapse + Heatmap in 2 col on wide screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="panel">
                  <CollapseReport risks={result.collapseRisks} />
                </div>
                <div className="panel">
                  <MoraHeatmap lines={result.moraLines} />
                </div>
              </div>

              {/* Mora Table */}
              <div className="panel">
                <MoraTable lines={result.moraLines} />
              </div>

              {/* Phrase Detection */}
              <div className="panel">
                <PhraseWarnings
                  phraseMatches={result.phraseMatches}
                  syntaxMatches={result.syntaxMatches}
                />
              </div>

              {/* Improvement Memo */}
              {result.improvementMemo.length > 0 && (
                <div className="panel">
                  <ImprovementMemo memos={result.improvementMemo} />
                </div>
              )}

              {/* AI Panel */}
              <div className="panel">
                <AIPanel
                  onGenerate={handleAiGenerate}
                  result={aiResult}
                  loading={aiLoading}
                />
              </div>
            </section>
          )}
        </div>

        {!result && (
          <p className="mt-5 text-center text-zinc-700 text-xs font-mono">
            ↑ 入力して [ ANALYZE ] を押してください
          </p>
        )}
      </main>

      <footer className="relative z-10 border-t border-zinc-900 mt-10 py-4 text-center">
        <p className="text-zinc-800 text-[10px] font-mono">
          MORA.exe v0.2 — rule-based mora analysis engine + collapse predictor
        </p>
      </footer>
    </div>
  );
}
