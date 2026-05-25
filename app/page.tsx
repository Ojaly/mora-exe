"use client";

import { useState } from "react";
import ConceptInput from "@/components/ConceptInput";
import WizardPanel from "@/components/WizardPanel";
import PromptEditor from "@/components/PromptEditor";
import LyricsEditor from "@/components/LyricsEditor";
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

// ─── Sample content (shown before first Generate) ────────────────────────────

const SAMPLE_PROMPT = `[Style:] J-Pop, melancholic, introspective, bittersweet
[Tempo:] 92 BPM, mid-tempo, laid-back feel
[Key:] Am
[Vocal:] female vocal, clear and expressive
[Groove:] mid-tempo, laid-back feel, rhythmically tight
[Instruments:] piano, synth pads, light drums, fretless bass
[Texture:] sparse, intimate, wide reverb
[Structure:] [verse] → [pre-chorus] → [chorus] → [verse] → [chorus] → [bridge] → [outro]
[Mix Aesthetic:] polished J-Pop mix, clear vocals up front
[Note:] Avoid generic AI clichés — unexpected imagery, raw emotion over polish`;

const SAMPLE_LYRICS = `[Intro]
静寂が　部屋を満たしていく

[Verse 1]
街の灯りが　滲んで消えて
誰かの声が　遠ざかっていく
手を伸ばしても　届かなくて
また一人で　夜を数える

[Pre-Chorus]
もう逃げられない
真実を探して

[Chorus]
消えない痛みを　抱えたまま
どこかにある　答えを探す
君の残した　言葉だけが
今も胸に　刻まれてる

[Verse 2]
古いレコードが　止まったまま
あの日の言葉　忘れられなくて
窓の外には　変わらない空
時間だけが　静かに流れる

[Bridge]
それでも前へ　歩き出す
涙が乾いた後に

[Chorus]
消えない痛みを　抱えたまま
どこかにある　答えを探す
君の残した　言葉だけが
今も胸に　刻まれてる

[Outro]
雨上がりの　光の中で
また始まる　新しい日`;

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Micro-components ────────────────────────────────────────────────────────

function CopyBtn({ text, label, dim }: { text: string; label: string; dim?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (!text) return; navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      disabled={!text}
      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all disabled:opacity-20 disabled:cursor-default ${
        copied
          ? "border-emerald-700 text-emerald-400 bg-emerald-950"
          : dim
          ? "border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
          : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-200"
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
        active
          ? "border-cyan-400 text-white bg-white/5"
          : "border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="shrink-0 h-8 border-b border-zinc-800 flex items-stretch"
      style={{ background: "#17171c" }}
    >
      {children}
    </div>
  );
}

function SampleBadge() {
  return (
    <span className="self-center ml-auto mr-2 text-[9px] font-mono text-zinc-700 border border-zinc-800 px-1.5 py-0.5 rounded tracking-wider">
      SAMPLE
    </span>
  );
}

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

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput]         = useState<SongInput>(defaultInput);
  const [preset, setPreset]       = useState<WorldPresetKey | "">("");
  const [rightView, setRight]     = useState<RightView>("lyrics");
  const [mobileTab, setMobile]    = useState<MobileTab>("concept");
  const [isSample, setIsSample]   = useState(true);
  const [sidebarMode, setSidebar] = useState<"concept" | "wizard">("concept");

  const [stylePrompt, setStyle]   = useState(SAMPLE_PROMPT);
  const [negPrompt, setNeg]       = useState("generic AI vocal phrases, over-polished production, synthetic timbre");
  const [regenPrompt, setRegen]   = useState("");
  const [lyrics, setLyricsRaw]    = useState(SAMPLE_LYRICS);

  const [moraLines, setLines]       = useState<MoraLine[]>([]);
  const [suggestions, setSugs]      = useState<MoraSuggestion[]>([]);
  const [phraseMatches, setPhrases] = useState<PhraseMatch[]>([]);
  const [syntaxMatches, setSyntax]  = useState<SyntaxMatch[]>([]);
  const [collapseRisks, setRisks]   = useState<CollapseRisk[]>([]);
  const [songStats, setStats]       = useState<SongStats | null>(null);

  // ─── Handlers ──────────────────────────────────────────────────────────

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
    setIsSample(false);
    setMobile("prompt"); setRight("lyrics");
  };

  const handleLyrics = (v: string) => {
    setLyricsRaw(v);
    if (!isSample) analyse(v);
  };

  const handleStyleEdit = (v: string) => {
    setStyle(v);
    if (isSample) setIsSample(false);
  };

  const handleLyricsEdit = (v: string) => {
    handleLyrics(v);
    if (isSample) setIsSample(false);
  };

  const handleRewrite = (mode: RewriteMode) => {
    const v = applyRewriteMode(lyrics, mode);
    setLyricsRaw(v); analyse(v);
    if (isSample) setIsSample(false);
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
      stylePrompt  && `=== STYLE PROMPT ===\n${stylePrompt}`,
      negPrompt    && `=== NEGATIVE PROMPT ===\n${negPrompt}`,
      lyrics       && `=== LYRICS ===\n${lyrics}`,
      regenPrompt  && `=== REGENERATE PROMPT ===\n${regenPrompt}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(p.join("\n\n"));
  };

  // ─── Derived ────────────────────────────────────────────────────────────

  const score   = songStats?.riskScore ?? null;
  const sColor  = score === null ? "text-zinc-700" : score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const dangers = suggestions.length;
  const issues  = phraseMatches.length + syntaxMatches.length + collapseRisks.length;

  // ─── Rewrite bar (shared mobile/desktop) ────────────────────────────────

  const rewriteBar = (
    <div className="shrink-0 border-t border-zinc-800/50 px-3 py-2" style={{ background: "#111318" }}>
      <div className="flex flex-wrap gap-1">
        {REWRITE_MODES.map(([mode, label]) => (
          <button key={mode} onClick={() => handleRewrite(mode)}
            className="px-2 py-0.5 text-[10px] font-mono border border-zinc-800 text-zinc-500 rounded hover:border-zinc-600 hover:text-zinc-200 transition-colors">
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Tuner panel ────────────────────────────────────────────────────────

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

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <div className="fixed inset-0 scanlines pointer-events-none z-0 opacity-[0.12]" />

      {/* ── Titlebar ──────────────────────────────────────────────────────── */}
      <header
        className="relative z-20 shrink-0 h-9 border-b border-zinc-800/80 flex items-center px-4 gap-4 select-none"
        style={{ background: "#0f0f14" }}
      >
        <span className="font-mono font-bold text-[13px] text-cyan-400 neon-cyan tracking-widest">
          MORA<span className="text-zinc-700">.</span>exe
        </span>
        <span className="text-zinc-700 font-mono text-[9px] tracking-[0.2em] hidden sm:block">
          SUNO PROMPT FORGE
        </span>

        {songStats && (
          <div className="hidden sm:flex items-center gap-3 ml-2">
            <Pill label="LINES" value={String(songStats.contentLines)} />
            <Pill label="AVG"   value={`${songStats.avgMora.toFixed(1)}M`} warn={songStats.avgMora > 12} />
            <Pill label="MAX"   value={`${songStats.maxMora}M`}            warn={songStats.maxMora >= 15} />
            {dangers > 0 && <Pill label="⚠" value={String(dangers)} warn />}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {isSample && (
            <span className="text-[9px] font-mono text-zinc-700 tracking-wider hidden sm:block">
              SAMPLE — ▶ GENERATE でカスタム生成
            </span>
          )}
          {score !== null && (
            <span className={`text-[11px] font-mono font-bold tabular-nums ${sColor}`}>
              SCORE {score}
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        </div>
      </header>

      {/* ── Mobile tab strip ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex h-8 border-b border-zinc-800 lg:hidden"
        style={{ background: "#111116" }}
      >
        {(["concept", "prompt", "lyrics", "tuner"] as MobileTab[]).map((t) => (
          <TabBtn key={t} active={mobileTab === t} onClick={() => setMobile(t)}>
            {t === "tuner" && dangers > 0 ? `TUNER ▲${dangers}` : t.toUpperCase()}
          </TabBtn>
        ))}
      </div>

      {/* ── Desktop 3-column IDE ──────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 hidden lg:flex">

        {/* ── LEFT: Sidebar ───────────────────────────────────────────────── */}
        <aside
          className="w-[252px] shrink-0 flex flex-col border-r border-zinc-800/80"
          style={{ background: "#141419" }}
        >
          {/* Sidebar header — CONCEPT / WIZARD tabs */}
          <div
            className="shrink-0 h-8 border-b border-zinc-800 flex items-stretch"
            style={{ background: "#17171c" }}
          >
            <button
              onClick={() => setSidebar("concept")}
              className={`px-3 h-full text-[9px] font-mono tracking-[0.2em] border-b-2 transition-colors ${
                sidebarMode === "concept"
                  ? "border-cyan-400 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              CONCEPT
            </button>
            <button
              onClick={() => setSidebar("wizard")}
              className={`px-3 h-full text-[9px] font-mono tracking-[0.2em] border-b-2 transition-colors ${
                sidebarMode === "wizard"
                  ? "border-violet-400 text-violet-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              WIZARD
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {sidebarMode === "concept" ? (
              <ConceptInput
                input={input} onChange={setInput}
                preset={preset} onPresetChange={setPreset}
                onGenerate={handleGenerate} compact
              />
            ) : (
              <WizardPanel
                onApply={(prompt, neg) => {
                  setStyle(prompt);
                  setNeg(neg);
                  setIsSample(false);
                  setSidebar("concept");
                }}
              />
            )}
          </div>
        </aside>

        {/* ── CENTER: Style Prompt ─────────────────────────────────────────── */}
        <section
          className="flex-1 flex flex-col border-r border-zinc-800/60 min-w-0"
          style={{ background: "#13151b" }}
        >
          <PanelHeader>
            <span className="flex items-center px-3 text-[9px] font-mono text-zinc-400 tracking-[0.2em]">
              STYLE PROMPT
            </span>
            {isSample && <SampleBadge />}
            <div className="flex items-center gap-1.5 px-2 ml-auto">
              <CopyBtn text={stylePrompt} label="COPY" />
            </div>
          </PanelHeader>

          {/* Main prompt editor */}
          <PromptEditor
            value={stylePrompt}
            onChange={handleStyleEdit}
            isSample={isSample}
          />

          {/* Negative prompt dock */}
          <div
            className="shrink-0 border-t border-zinc-800/50"
            style={{ background: "#10111a" }}
          >
            <div className="flex items-center px-4 pt-2 pb-1 gap-2">
              <span className="text-[9px] font-mono text-zinc-500 tracking-[0.15em]">NEGATIVE</span>
              <div className="ml-auto"><CopyBtn text={negPrompt} label="COPY NEG" dim /></div>
            </div>
            <textarea
              value={negPrompt}
              onChange={(e) => setNeg(e.target.value)}
              rows={2}
              className="w-full bg-transparent resize-none px-4 pb-2 font-mono text-[11px] leading-relaxed focus:outline-none"
              style={{ color: "#6b7280" }}
              spellCheck={false}
            />
          </div>
        </section>

        {/* ── RIGHT: Lyrics / Tuner ───────────────────────────────────────── */}
        <section
          className="flex-1 flex flex-col min-w-0"
          style={{ background: "#131219" }}
        >
          <PanelHeader>
            <TabBtn active={rightView === "lyrics"} onClick={() => setRight("lyrics")}>LYRICS</TabBtn>
            <TabBtn active={rightView === "tuner"}  onClick={() => setRight("tuner")}>
              TUNER{dangers > 0 ? ` ▲${dangers}` : issues > 0 ? ` (${issues})` : ""}
            </TabBtn>
            {isSample && rightView === "lyrics" && <SampleBadge />}
            <div className="flex items-center gap-1.5 px-2 ml-auto">
              <CopyBtn text={lyrics} label="COPY" />
            </div>
          </PanelHeader>

          {rightView === "lyrics" ? (
            <>
              <LyricsEditor
                value={lyrics}
                onChange={handleLyricsEdit}
                isSample={isSample}
              />
              {rewriteBar}
            </>
          ) : tunerPanel}
        </section>
      </div>

      {/* ── Mobile single-col ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">
        {mobileTab === "concept" && (
          <div className="flex-1 overflow-y-auto p-3" style={{ background: "#141419" }}>
            <ConceptInput input={input} onChange={setInput} preset={preset} onPresetChange={setPreset} onGenerate={handleGenerate} compact />
          </div>
        )}
        {mobileTab === "prompt" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#13151b" }}>
            <PanelHeader>
              <span className="flex items-center px-3 text-[9px] font-mono text-zinc-400 tracking-widest">STYLE PROMPT</span>
              {isSample && <SampleBadge />}
              <div className="flex items-center px-2 ml-auto"><CopyBtn text={stylePrompt} label="COPY" /></div>
            </PanelHeader>
            <PromptEditor value={stylePrompt} onChange={handleStyleEdit} isSample={isSample} />
          </div>
        )}
        {mobileTab === "lyrics" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#131219" }}>
            <PanelHeader>
              <span className="flex items-center px-3 text-[9px] font-mono text-zinc-400 tracking-widest">LYRICS</span>
              {isSample && <SampleBadge />}
              <div className="flex items-center px-2 ml-auto"><CopyBtn text={lyrics} label="COPY" /></div>
            </PanelHeader>
            <LyricsEditor value={lyrics} onChange={handleLyricsEdit} isSample={isSample} />
            {rewriteBar}
          </div>
        )}
        {mobileTab === "tuner" && tunerPanel}
      </div>

      {/* ── Final output footer ────────────────────────────────────────────── */}
      <footer
        className="relative z-20 shrink-0 h-9 border-t border-zinc-800/80 flex items-center px-4 gap-2"
        style={{ background: "#0f0f14" }}
      >
        <span className="text-[9px] font-mono text-zinc-500 tracking-[0.2em] shrink-0">OUTPUT</span>
        <div className="w-px h-3 bg-zinc-800 mx-1 shrink-0" />
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
