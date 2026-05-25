"use client";

import { useState } from "react";
import ConceptInput from "@/components/ConceptInput";
import MoraTunerPanel from "@/components/MoraTunerPanel";
import {
  SongInput, WorldPresetKey,
  MoraLine, MoraSuggestion, PhraseMatch, SyntaxMatch, CollapseRisk, SongStats, RewriteMode,
} from "@/types";
import { buildStylePrompt, buildNegativePrompt, buildRegeneratePrompt } from "@/lib/promptBuilder";
import { buildLyricsDraft, draftToRaw } from "@/lib/lyricsBuilder";
import { analyzeLyrics, calcSongStats } from "@/lib/moraAnalyzer";
import { detectAiPhrases, detectSyntaxPatterns } from "@/lib/phraseDetector";
import { predictCollapse } from "@/lib/collapsePredictor";
import { generateMoraSuggestions, applyLineFix } from "@/lib/moraTuner";
import { applyRewriteMode } from "@/lib/rewriteModes";

type RightView = "lyrics" | "tuner";
type MobileTab = "concept" | "prompt" | "lyrics" | "tuner";

const defaultInput: SongInput = {
  title: "", theme: "", genre: "jpop", bpm: "", key: "", mood: "melancholic",
  vocalType: "female", songLength: "full", englishRatio: "low",
  worldPreset: "", referenceVibe: "", avoidExpressions: "",
  startWithChorus: false, avoidAiCliche: false, lyrics: "",
};

const REWRITE_MODES: Array<[RewriteMode, string]> = [
  ["catchy", "キャッチー"], ["remove-ai", "AI臭除去"], ["shorten-mora", "短縮"],
  ["strengthen-chorus", "サビ強化"], ["more-japanese", "JP多め"], ["more-english", "EN多め"],
  ["darker", "ダーク"], ["danceable", "ダンサブル"], ["ojaly", "ojaly."],
];

// ─── Micro-components ─────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (!text) return; navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      disabled={!text}
      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all disabled:opacity-20 disabled:cursor-default ${
        copied ? "border-emerald-700 text-emerald-400 bg-emerald-950" : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
      }`}
    >
      {copied ? `✓ ${label}` : label}
    </button>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-full text-[10px] font-mono tracking-wider border-b-2 transition-colors ${
        active ? "border-cyan-500 text-zinc-200 bg-zinc-900/60" : "border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/40"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput]       = useState<SongInput>(defaultInput);
  const [preset, setPreset]     = useState<WorldPresetKey | "">("");
  const [rightView, setRight]   = useState<RightView>("lyrics");
  const [mobileTab, setMobile]  = useState<MobileTab>("concept");

  const [stylePrompt, setStyle]    = useState("");
  const [negPrompt, setNeg]        = useState("");
  const [regenPrompt, setRegen]    = useState("");
  const [lyrics, setLyricsRaw]     = useState("");

  const [moraLines, setLines]      = useState<MoraLine[]>([]);
  const [suggestions, setSugs]     = useState<MoraSuggestion[]>([]);
  const [phraseMatches, setPhrases]= useState<PhraseMatch[]>([]);
  const [syntaxMatches, setSyntax] = useState<SyntaxMatch[]>([]);
  const [collapseRisks, setRisks]  = useState<CollapseRisk[]>([]);
  const [songStats, setStats]      = useState<SongStats | null>(null);

  // ─── Core handlers ──────────────────────────────────────────────────────

  const analyse = (txt: string) => {
    const lines = analyzeLyrics(txt);
    setLines(lines);
    setStats(calcSongStats(lines, txt));
    setPhrases(detectAiPhrases(txt));
    setSyntax(detectSyntaxPatterns(txt));
    setRisks(predictCollapse(txt, lines));
    setSugs(generateMoraSuggestions(txt));
  };

  const handleGenerate = () => {
    const sp = buildStylePrompt(input, preset);
    const np = buildNegativePrompt(input);
    const rp = buildRegeneratePrompt(input);
    const ly = draftToRaw(buildLyricsDraft(input));
    setStyle(sp); setNeg(np); setRegen(rp);
    setLyricsRaw(ly); analyse(ly);
    setMobile("prompt"); setRight("lyrics");
  };

  const handleLyrics = (v: string) => { setLyricsRaw(v); analyse(v); };

  const handleRewrite = (mode: RewriteMode) => {
    const v = applyRewriteMode(lyrics, mode);
    setLyricsRaw(v); analyse(v);
  };

  const handleFix = (ln: number, rep: string | string[]) => {
    const v = applyLineFix(lyrics, ln, rep);
    setLyricsRaw(v); analyse(v);
  };

  const handleFixAll = () => {
    let v = lyrics;
    for (const s of suggestions)
      if (s.danger === "long" && s.alternatives.length === 2)
        v = applyLineFix(v, s.lineNumber, s.alternatives);
    setLyricsRaw(v); analyse(v);
  };

  const copyAll = () => {
    const p = [
      stylePrompt && `=== STYLE PROMPT ===\n${stylePrompt}`,
      negPrompt   && `=== NEGATIVE PROMPT ===\n${negPrompt}`,
      lyrics      && `=== LYRICS ===\n${lyrics}`,
      regenPrompt && `=== REGENERATE PROMPT ===\n${regenPrompt}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(p.join("\n\n"));
  };

  // ─── Derived ────────────────────────────────────────────────────────────

  const score = songStats?.riskScore ?? null;
  const scoreColor = score === null ? "text-zinc-700" : score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const dangers = suggestions.length;
  const issues  = phraseMatches.length + syntaxMatches.length + collapseRisks.length;

  // ─── Shared styles ───────────────────────────────────────────────────────

  // Textarea: fills its flex container, no resize, IDE font
  const TA = "flex-1 min-h-0 w-full bg-transparent resize-none px-4 py-3 font-mono text-[13px] leading-[1.75] text-zinc-100 focus:outline-none placeholder-zinc-800 selection:bg-cyan-900/60";

  // Tuner panel used in both desktop right-col and mobile
  const tunerPanel = (
    <div className="flex-1 min-h-0 overflow-y-auto p-3">
      <MoraTunerPanel
        lyrics={lyrics} moraLines={moraLines} suggestions={suggestions}
        phraseMatches={phraseMatches} syntaxMatches={syntaxMatches}
        collapseRisks={collapseRisks} songStats={songStats}
        onApplyFix={handleFix} onApplyAll={handleFixAll}
      />
    </div>
  );

  const rewriteBar = (
    <div className="shrink-0 border-t border-zinc-800/60 px-3 py-2 bg-zinc-950">
      <div className="flex flex-wrap gap-1">
        {REWRITE_MODES.map(([mode, label]) => (
          <button key={mode} onClick={() => handleRewrite(mode)} disabled={!lyrics}
            className="px-2 py-0.5 text-[10px] font-mono border border-zinc-800 text-zinc-500 rounded hover:border-zinc-600 hover:text-zinc-200 transition-colors disabled:opacity-20 disabled:cursor-default">
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Empty state shown before first generate ────────────────────────────

  const EmptyPromise = ({ msg }: { msg: string }) => (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-zinc-800 font-mono text-xs text-center leading-loose">{msg}</p>
    </div>
  );

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <div className="fixed inset-0 scanlines pointer-events-none z-0 opacity-[0.15]" />

      {/* ── Titlebar ──────────────────────────────────────────────────────── */}
      <header className="relative z-20 shrink-0 h-9 border-b border-zinc-800 bg-[#0c0c0e] flex items-center px-4 gap-4 select-none">
        <span className="font-mono font-bold text-[13px] text-cyan-400 neon-cyan tracking-widest">
          MORA<span className="text-zinc-700">.</span>exe
        </span>
        <span className="text-zinc-700 font-mono text-[9px] tracking-[0.2em] hidden sm:block">
          SUNO PROMPT FORGE
        </span>

        {/* Status pills */}
        {songStats && (
          <div className="hidden sm:flex items-center gap-3 ml-2">
            <Pill label="LINES" value={String(songStats.contentLines)} />
            <Pill label="AVG"   value={`${songStats.avgMora.toFixed(1)}M`} warn={songStats.avgMora > 12} />
            <Pill label="MAX"   value={`${songStats.maxMora}M`}            warn={songStats.maxMora >= 15} />
            {dangers > 0 && <Pill label="FIX" value={String(dangers)} warn />}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {score !== null && (
            <span className={`text-[11px] font-mono font-bold tabular-nums ${scoreColor}`}>
              SCORE {score}
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        </div>
      </header>

      {/* ── Mobile tab strip ──────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 flex h-8 border-b border-zinc-800 bg-[#0c0c0e] lg:hidden">
        {(["concept", "prompt", "lyrics", "tuner"] as MobileTab[]).map((t) => (
          <TabBtn key={t} active={mobileTab === t} onClick={() => setMobile(t)}>
            {t === "tuner" && dangers > 0 ? `TUNER ▲${dangers}` : t.toUpperCase()}
          </TabBtn>
        ))}
      </div>

      {/* ── Desktop 3-column IDE ──────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 hidden lg:flex">

        {/* LEFT — sidebar */}
        <aside className="w-[252px] shrink-0 flex flex-col border-r border-zinc-800 bg-[#0f0f11] overflow-hidden">
          <div className="shrink-0 h-8 border-b border-zinc-800 flex items-center px-3">
            <span className="text-[9px] font-mono text-zinc-600 tracking-[0.2em] uppercase">Concept</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <ConceptInput
              input={input} onChange={setInput}
              preset={preset} onPresetChange={setPreset}
              onGenerate={handleGenerate} compact
            />
          </div>
        </aside>

        {/* CENTER — Style Prompt */}
        <section className="flex-1 flex flex-col border-r border-zinc-800 bg-zinc-950 min-w-0">
          <div className="shrink-0 h-8 border-b border-zinc-800 flex items-center px-3 gap-2 bg-[#0f0f11]">
            <span className="text-[9px] font-mono text-zinc-500 tracking-[0.2em] uppercase">Style Prompt</span>
            <div className="ml-auto flex gap-1.5">
              <CopyBtn text={stylePrompt} label="COPY" />
            </div>
          </div>

          {stylePrompt
            ? <textarea value={stylePrompt} onChange={(e) => setStyle(e.target.value)} className={TA} spellCheck={false} />
            : <EmptyPromise msg={"← CONCEPT を設定して\n▶ GENERATE を押してください"} />
          }

          {/* Negative prompt dock */}
          <div className="shrink-0 border-t border-zinc-800/60 bg-[#0c0c0e]">
            <div className="flex items-center px-3 py-1 gap-2">
              <span className="text-[9px] font-mono text-zinc-700 tracking-[0.15em] uppercase">Negative</span>
              <div className="ml-auto"><CopyBtn text={negPrompt} label="COPY NEG" /></div>
            </div>
            <textarea
              value={negPrompt}
              onChange={(e) => setNeg(e.target.value)}
              rows={2}
              className="w-full bg-transparent resize-none px-3 pb-2 font-mono text-[11px] text-zinc-600 focus:outline-none leading-relaxed"
              placeholder="(negative prompt — 自動生成されます)"
              spellCheck={false}
            />
          </div>
        </section>

        {/* RIGHT — Lyrics / Tuner */}
        <section className="flex-1 flex flex-col bg-zinc-950 min-w-0">
          <div className="shrink-0 h-8 border-b border-zinc-800 flex items-stretch bg-[#0f0f11]">
            <TabBtn active={rightView === "lyrics"} onClick={() => setRight("lyrics")}>LYRICS</TabBtn>
            <TabBtn active={rightView === "tuner"} onClick={() => setRight("tuner")}>
              TUNER{dangers > 0 ? ` ▲${dangers}` : issues > 0 ? ` (${issues})` : ""}
            </TabBtn>
            <div className="ml-auto flex items-center pr-3">
              <CopyBtn text={lyrics} label="COPY" />
            </div>
          </div>

          {rightView === "lyrics" ? (
            <>
              {lyrics
                ? <textarea value={lyrics} onChange={(e) => handleLyrics(e.target.value)} className={TA} spellCheck={false} />
                : <EmptyPromise msg={"← GENERATE を押すと\n歌詞ドラフトが生成されます"} />
              }
              {rewriteBar}
            </>
          ) : tunerPanel}
        </section>
      </div>

      {/* ── Mobile single-col view ────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">
        {mobileTab === "concept" && (
          <div className="flex-1 overflow-y-auto p-3">
            <ConceptInput input={input} onChange={setInput} preset={preset} onPresetChange={setPreset} onGenerate={handleGenerate} compact />
          </div>
        )}
        {mobileTab === "prompt" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 h-8 border-b border-zinc-800 flex items-center px-3 gap-2 bg-[#0f0f11]">
              <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Style Prompt</span>
              <div className="ml-auto"><CopyBtn text={stylePrompt} label="COPY" /></div>
            </div>
            {stylePrompt
              ? <textarea value={stylePrompt} onChange={(e) => setStyle(e.target.value)} className={TA} spellCheck={false} />
              : <EmptyPromise msg="CONCEPT → GENERATE" />
            }
          </div>
        )}
        {mobileTab === "lyrics" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 h-8 border-b border-zinc-800 flex items-center px-3 gap-2 bg-[#0f0f11]">
              <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Lyrics</span>
              <div className="ml-auto"><CopyBtn text={lyrics} label="COPY" /></div>
            </div>
            {lyrics
              ? <textarea value={lyrics} onChange={(e) => handleLyrics(e.target.value)} className={TA} spellCheck={false} />
              : <EmptyPromise msg="CONCEPT → GENERATE" />
            }
            {rewriteBar}
          </div>
        )}
        {mobileTab === "tuner" && tunerPanel}
      </div>

      {/* ── Final output bar ──────────────────────────────────────────────── */}
      <footer className="relative z-20 shrink-0 h-9 border-t border-zinc-800 bg-[#0c0c0e] flex items-center px-4 gap-2">
        <span className="text-[9px] font-mono text-zinc-700 tracking-[0.2em] uppercase shrink-0">Output</span>
        <div className="w-px h-3 bg-zinc-800 mx-1" />
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <CopyBtn text={stylePrompt} label="STYLE" />
          <CopyBtn text={lyrics}      label="LYRICS" />
          <CopyBtn text={negPrompt}   label="NEG" />
          {regenPrompt && <CopyBtn text={regenPrompt} label="REGEN" />}
        </div>
        <div className="ml-auto shrink-0">
          <CopyAllBtn onCopy={copyAll} hasContent={!!(stylePrompt || lyrics)} />
        </div>
      </footer>
    </div>
  );
}

// ─── Footer helpers ───────────────────────────────────────────────────────────

function Pill({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-[9px] font-mono text-zinc-700">{label}</span>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${warn ? "text-amber-400" : "text-zinc-400"}`}>{value}</span>
    </span>
  );
}

function CopyAllBtn({ onCopy, hasContent }: { onCopy: () => void; hasContent: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (!hasContent) return; onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      disabled={!hasContent}
      className={`text-[10px] font-mono px-3 py-1 rounded border font-bold transition-all disabled:opacity-20 disabled:cursor-default ${
        copied ? "border-emerald-700 text-emerald-400 bg-emerald-950" : "border-zinc-700 text-zinc-400 hover:border-cyan-700 hover:text-cyan-400"
      }`}
    >
      {copied ? "COPIED ✓" : "COPY ALL"}
    </button>
  );
}
