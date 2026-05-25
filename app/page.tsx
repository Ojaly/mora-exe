"use client";

import { useState } from "react";
import ConceptInput from "@/components/ConceptInput";
import PromptBuilderPanel from "@/components/PromptBuilderPanel";
import LyricsBuilderPanel from "@/components/LyricsBuilderPanel";
import MoraTunerPanel from "@/components/MoraTunerPanel";
import FinalOutputPanel from "@/components/FinalOutputPanel";
import {
  SongInput,
  WorldPresetKey,
  MoraLine,
  MoraSuggestion,
  PhraseMatch,
  SyntaxMatch,
  CollapseRisk,
  SongStats,
  RewriteMode,
} from "@/types";
import { buildStylePrompt, buildNegativePrompt, buildRegeneratePrompt } from "@/lib/promptBuilder";
import { buildLyricsDraft, draftToRaw } from "@/lib/lyricsBuilder";
import { analyzeLyrics, calcSongStats } from "@/lib/moraAnalyzer";
import { detectAiPhrases, detectSyntaxPatterns } from "@/lib/phraseDetector";
import { predictCollapse } from "@/lib/collapsePredictor";
import { generateMoraSuggestions, applyLineFix } from "@/lib/moraTuner";
import { applyRewriteMode } from "@/lib/rewriteModes";

type TabKey = "concept" | "prompt" | "lyrics" | "tuner" | "final";

const TAB_LABELS: [TabKey, string][] = [
  ["concept", "CONCEPT"],
  ["prompt", "PROMPT"],
  ["lyrics", "LYRICS"],
  ["tuner", "TUNER"],
  ["final", "FINAL"],
];

const defaultInput: SongInput = {
  title: "",
  theme: "",
  genre: "jpop",
  bpm: "",
  key: "",
  mood: "melancholic",
  vocalType: "female",
  songLength: "full",
  englishRatio: "low",
  worldPreset: "",
  referenceVibe: "",
  avoidExpressions: "",
  startWithChorus: false,
  avoidAiCliche: false,
  lyrics: "",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("concept");
  const [input, setInput] = useState<SongInput>(defaultInput);
  const [preset, setPreset] = useState<WorldPresetKey | "">("");

  // Generated outputs
  const [stylePrompt, setStylePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [editableLyrics, setEditableLyrics] = useState("");

  // Tuner state
  const [moraLines, setMoraLines] = useState<MoraLine[]>([]);
  const [suggestions, setSuggestions] = useState<MoraSuggestion[]>([]);
  const [phraseMatches, setPhraseMatches] = useState<PhraseMatch[]>([]);
  const [syntaxMatches, setSyntaxMatches] = useState<SyntaxMatch[]>([]);
  const [collapseRisks, setCollapseRisks] = useState<CollapseRisk[]>([]);
  const [songStats, setSongStats] = useState<SongStats | null>(null);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    const sp = buildStylePrompt(input, preset);
    const np = buildNegativePrompt(input);
    const rp = buildRegeneratePrompt(input);
    const draft = buildLyricsDraft(input);
    const raw = draftToRaw(draft);

    setStylePrompt(sp);
    setNegativePrompt(np);
    setRegeneratePrompt(rp);
    setEditableLyrics(raw);

    // Auto-analyze for tuner
    runTunerAnalysis(raw);

    setActiveTab("prompt");
  };

  const runTunerAnalysis = (lyrics: string) => {
    const lines = analyzeLyrics(lyrics);
    const stats = calcSongStats(lines, lyrics);
    const phrases = detectAiPhrases(lyrics);
    const syntax = detectSyntaxPatterns(lyrics);
    const collapse = predictCollapse(lyrics, lines);
    const sugs = generateMoraSuggestions(lyrics);

    setMoraLines(lines);
    setSongStats(stats);
    setPhraseMatches(phrases);
    setSyntaxMatches(syntax);
    setCollapseRisks(collapse);
    setSuggestions(sugs);
  };

  const handleLyricsChange = (v: string) => {
    setEditableLyrics(v);
    runTunerAnalysis(v);
  };

  const handleRewrite = (mode: RewriteMode) => {
    const rewritten = applyRewriteMode(editableLyrics, mode);
    setEditableLyrics(rewritten);
    runTunerAnalysis(rewritten);
  };

  const handleSendToTuner = () => {
    runTunerAnalysis(editableLyrics);
    setActiveTab("tuner");
  };

  const handleApplyFix = (lineNumber: number, replacement: string | string[]) => {
    const fixed = applyLineFix(editableLyrics, lineNumber, replacement);
    setEditableLyrics(fixed);
    runTunerAnalysis(fixed);
  };

  const handleApplyAllFixes = () => {
    let fixed = editableLyrics;
    // Apply splits for long lines only (safest auto-fix)
    for (const s of suggestions) {
      if (s.danger === "long" && s.alternatives.length === 2) {
        fixed = applyLineFix(fixed, s.lineNumber, s.alternatives);
      }
    }
    setEditableLyrics(fixed);
    runTunerAnalysis(fixed);
  };

  // Derived score badge
  const score = songStats?.riskScore ?? null;
  const scoreColor =
    score === null ? "text-zinc-700" :
    score >= 80 ? "text-emerald-400" :
    score >= 50 ? "text-amber-400" :
    "text-red-400";

  // ─── Tab readiness indicators ──────────────────────────────────────────────

  const tabReady: Record<TabKey, boolean> = {
    concept: true,
    prompt: !!stylePrompt,
    lyrics: !!editableLyrics,
    tuner: moraLines.length > 0,
    final: !!stylePrompt || !!editableLyrics,
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed inset-0 scanlines pointer-events-none z-0 opacity-40" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-0">
          <div className="flex items-center gap-3 py-2">
            <span className="font-mono font-bold text-sm text-cyan-400 neon-cyan tracking-widest">
              MORA<span className="text-zinc-600">.</span>exe
            </span>
            <span className="text-zinc-700 font-mono text-xs hidden sm:block">
              Suno Production Workbench v0.3
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              {score !== null && (
                <span className={`text-xs font-mono font-bold ${scoreColor}`}>
                  SCORE {score}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-t border-zinc-800/50">
            {TAB_LABELS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-colors border-b-2 ${
                  activeTab === key
                    ? "text-cyan-400 border-cyan-500"
                    : tabReady[key]
                    ? "text-zinc-400 border-transparent hover:text-zinc-200"
                    : "text-zinc-700 border-transparent hover:text-zinc-600"
                }`}
              >
                {label}
                {!tabReady[key] && key !== "concept" && (
                  <span className="ml-1 text-zinc-800">○</span>
                )}
                {tabReady[key] && key !== "concept" && (
                  <span className="ml-1 text-zinc-600">●</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-5">
        {/* CONCEPT tab */}
        {activeTab === "concept" && (
          <div className="max-w-lg mx-auto panel">
            <ConceptInput
              input={input}
              onChange={setInput}
              preset={preset}
              onPresetChange={setPreset}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {/* PROMPT tab */}
        {activeTab === "prompt" && (
          <div className="panel">
            <PromptBuilderPanel
              stylePrompt={stylePrompt}
              negativePrompt={negativePrompt}
              onStyleChange={setStylePrompt}
              onNegativeChange={setNegativePrompt}
            />
          </div>
        )}

        {/* LYRICS tab */}
        {activeTab === "lyrics" && (
          <div className="panel">
            <LyricsBuilderPanel
              lyrics={editableLyrics}
              onChange={handleLyricsChange}
              onRewrite={handleRewrite}
              onSendToTuner={handleSendToTuner}
            />
          </div>
        )}

        {/* TUNER tab */}
        {activeTab === "tuner" && (
          <div className="panel">
            <MoraTunerPanel
              lyrics={editableLyrics}
              moraLines={moraLines}
              suggestions={suggestions}
              phraseMatches={phraseMatches}
              syntaxMatches={syntaxMatches}
              collapseRisks={collapseRisks}
              songStats={songStats}
              onApplyFix={handleApplyFix}
              onApplyAll={handleApplyAllFixes}
            />
          </div>
        )}

        {/* FINAL tab */}
        {activeTab === "final" && (
          <div className="panel">
            <FinalOutputPanel
              stylePrompt={stylePrompt}
              lyrics={editableLyrics}
              regeneratePrompt={regeneratePrompt}
              negativePrompt={negativePrompt}
            />
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-zinc-900 mt-10 py-4 text-center">
        <p className="text-zinc-800 text-[10px] font-mono">
          MORA.exe v0.3 — suno production workbench
        </p>
      </footer>
    </div>
  );
}
