"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PromptEditor from "@/components/PromptEditor";
import LyricsEditor from "@/components/LyricsEditor";
import MoraTunerPanel from "@/components/MoraTunerPanel";
import {
  SongInput, WorldPresetKey, WorldExpansion,
  MoraLine, MoraSuggestion, PhraseMatch, SyntaxMatch, CollapseRisk, SongStats,
  RewriteMode, RewriteIntensity, SectionTarget, HistoryEntry,
} from "@/types";
import {
  buildStylePrompt, buildNegativePrompt, buildRegeneratePrompt,
  buildStylePromptFromExpansion, buildNegativePromptFromExpansion,
} from "@/lib/promptBuilder";
import { buildLyricsDraft, draftToRaw } from "@/lib/lyricsBuilder";
import { analyzeLyrics, calcSongStats } from "@/lib/moraAnalyzer";
import { detectAiPhrases, detectSyntaxPatterns } from "@/lib/phraseDetector";
import { predictCollapse } from "@/lib/collapsePredictor";
import { generateMoraSuggestions, applyLineFix } from "@/lib/moraTuner";
import { applyRewriteMode } from "@/lib/rewriteModes";
import { callClaudeRewrite } from "@/lib/claudeRewrite";
import { loadMemories, saveMemory, deleteMemory, PromptMemory } from "@/lib/promptMemory";

// ─── Sample content ───────────────────────────────────────────────────────────

const SAMPLE_PROMPT = `J-Pop, melancholic and introspective, bittersweet, 92 BPM, key of Am. Female vocal, clear and expressive. Piano, synth pads, light drums, and fretless bass. Sparse, intimate, wide reverb. Avoid generic AI clichés, over-polished production, synthetic timbre.`;

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

// ─── Types ────────────────────────────────────────────────────────────────────

type RightView = "lyrics" | "tuner";
type MobileTab = "concept" | "prompt" | "lyrics" | "tuner";

const defaultInput: SongInput = {
  title: "", theme: "", genre: "jpop", bpm: "", key: "", mood: "melancholic",
  vocalType: "female", songLength: "full", englishRatio: "low",
  worldPreset: "", referenceVibe: "", avoidExpressions: "",
  startWithChorus: false, avoidAiCliche: false, lyrics: "", nudges: [],
};

// Rewrite button categories — REWRITE / TONE / LANGUAGE
const REWRITE_CATS: Array<{
  label: string;
  modes: Array<[RewriteMode, string, string?]>; // [mode, display, tooltip?]
}> = [
  {
    label: "REWRITE",
    modes: [
      ["catchy",            "キャッチー"],
      ["shorten-mora",      "短縮"],
      ["strengthen-chorus", "サビ強化"],
      ["remove-ai",         "AI臭除去"],
      ["ojaly",             "ojaly.化", "説明を削り、夜・光・余韻・皮肉・ミニマルな比喩に寄せる"],
    ],
  },
  {
    label: "TONE",
    modes: [
      ["darker",    "ダーク"],
      ["danceable", "ダンサブル"],
      ["poetic",    "詩的"],
      ["ironic",    "皮肉"],
    ],
  },
  {
    label: "LANG",
    modes: [
      ["more-japanese", "JP多め"],
      ["more-english",  "EN多め"],
    ],
  },
];

const INTENSITY_OPTS: Array<[RewriteIntensity, string]> = [
  ["subtle", "subtle"], ["medium", "medium"], ["aggressive", "aggressive"],
];

const SECTION_OPTS: Array<[SectionTarget, string]> = [
  ["all", "ALL"], ["chorus", "CHORUS"], ["verse", "VERSE"], ["pre-chorus", "PRE"], ["bridge", "BRIDGE"],
];

// ─── Micro-components ─────────────────────────────────────────────────────────

function CopyBtn({ text, label, dim }: { text: string; label: string; dim?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (!text) return; navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      disabled={!text}
      className={`text-[12px] font-mono px-3 py-1.5 rounded border transition-all disabled:opacity-20 disabled:cursor-default ${
        copied
          ? "border-emerald-500 text-emerald-700 bg-emerald-50"
          : dim
          ? "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
          : "border-[#c8cdd4] text-zinc-600 hover:border-zinc-500 hover:text-zinc-900"
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
      className={`px-4 h-full text-[13px] font-mono tracking-wider border-b-2 transition-colors ${
        active
          ? "border-blue-500 text-zinc-900 bg-black/[0.04]"
          : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-black/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 h-10 border-b border-[#d0d7de] flex items-stretch" style={{ background: "var(--bg-panel-hdr)" }}>
      {children}
    </div>
  );
}

function SampleBadge() {
  return (
    <span className="self-center ml-auto mr-2 text-[12px] font-mono text-zinc-500 border border-[#c8cdd4] px-2 py-0.5 rounded tracking-wider">
      SAMPLE
    </span>
  );
}

function Pill({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-[12px] font-mono text-zinc-500">{label}</span>
      <span className={`text-[13px] font-mono font-bold tabular-nums ${warn ? "text-amber-600" : "text-zinc-700"}`}>{value}</span>
    </span>
  );
}

function CopyAllBtn({ onCopy, hasContent }: { onCopy: () => void; hasContent: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (!hasContent) return; onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      disabled={!hasContent}
      className={`text-[13px] font-mono px-3 py-1.5 rounded border font-bold transition-all disabled:opacity-20 disabled:cursor-default ${
        copied ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-[#c8cdd4] text-zinc-700 hover:border-blue-400 hover:text-blue-700"
      }`}
    >
      {copied ? "COPIED ✓" : "COPY ALL"}
    </button>
  );
}

// ─── Memory Panel ─────────────────────────────────────────────────────────────

function MemoryPanel({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: (m: PromptMemory) => void;
}) {
  const [memories, setMemories] = useState<PromptMemory[]>(() => loadMemories());

  const handleDelete = (id: string) => {
    deleteMemory(id);
    setMemories(loadMemories());
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(246,248,250,0.97)" }}
    >
      <div className="shrink-0 h-9 border-b border-[#d0d7de] flex items-center px-4 gap-3" style={{ background: "var(--bg-panel-hdr)" }}>
        <span className="text-[13px] font-mono text-zinc-700 tracking-widest">MEMORY</span>
        <span className="text-[11px] font-mono text-zinc-500">{memories.length} / 20 saved</span>
        <button
          onClick={onClose}
          className="ml-auto text-xs font-mono text-zinc-600 hover:text-zinc-900 border border-[#c8cdd4] hover:border-zinc-400 px-2 py-0.5 rounded transition-colors"
        >
          ✕ CLOSE
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] font-mono text-zinc-400">No saved memories. Use SAVE in the footer.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {memories.map((m) => (
            <div
              key={m.id}
              className="border border-[#d0d7de] rounded p-3 hover:border-zinc-400 transition-colors group"
              style={{ background: "#ffffff" }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-zinc-800 truncate">{m.title || "(untitled)"}</span>
                    {m.score !== null && (
                      <span className={`text-[10px] font-mono font-bold tabular-nums ${m.score >= 80 ? "text-emerald-600" : m.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {m.score}
                      </span>
                    )}
                    {m.worldPreset && (
                      <span className="text-[10px] font-mono text-zinc-500 border border-[#c8cdd4] px-1 rounded">{m.worldPreset}</span>
                    )}
                  </div>
                  {m.memo && (
                    <p className="text-[11px] font-mono text-zinc-500 mb-1 line-clamp-1">{m.memo}</p>
                  )}
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(m.ts).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { onRestore(m); onClose(); }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800 transition-colors"
                  >
                    RESTORE
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#d0d7de] text-zinc-500 hover:border-red-400 hover:text-red-600 transition-colors"
                  >
                    DEL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput]         = useState<SongInput>(defaultInput);
  const [preset, setPreset]       = useState<WorldPresetKey | "">("");
  const [expansion, setExpansion] = useState<WorldExpansion | null>(null);
  const [rightView, setRight]     = useState<RightView>("lyrics");
  const [mobileTab, setMobile]    = useState<MobileTab>("concept");
  const [isSample, setIsSample]   = useState(true);

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

  const [loadingMode, setLoadingMode] = useState<RewriteMode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rewriteNotes, setRewriteNotes] = useState<string>("");
  const [rewriteSource, setRewriteSource] = useState<"claude" | "rule" | null>(null);
  const [changedLines, setChangedLines] = useState<number[]>([]);

  // Rewrite controls
  const [intensity, setIntensity] = useState<RewriteIntensity>("medium");
  const [sectionTarget, setSectionTarget] = useState<SectionTarget>("all");

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Memory panel
  const [showMemory, setShowMemory] = useState(false);
  const [saveMemo, setSaveMemo] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const analyse = useCallback((txt: string) => {
    const lines = analyzeLyrics(txt);
    setLines(lines);
    setStats(calcSongStats(lines, txt));
    setPhrases(detectAiPhrases(txt));
    setSyntax(detectSyntaxPatterns(txt));
    setRisks(predictCollapse(txt, lines));
    setSugs(generateMoraSuggestions(txt));
  }, []);

  const handleGenerate = async () => {
    // Expansion-first: use World Forge inference if available, fall back to legacy
    const sp = expansion
      ? buildStylePromptFromExpansion(expansion, input, input.theme)
      : buildStylePrompt(input, preset);
    const np = expansion
      ? buildNegativePromptFromExpansion(expansion, input)
      : buildNegativePrompt(input);
    const rp = buildRegeneratePrompt(input);
    setStyle(sp); setNeg(np); setRegen(rp);
    setIsSample(false);
    setMobile("prompt"); setRight("lyrics");
    setChangedLines([]);
    setRewriteNotes("");
    setRewriteSource(null);
    setHistory([]);
    setLyricsRaw("");   // 前回lyrics即クリア — 同じWorldから引きずらないように
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songInput: input, expansion }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lyrics) {
          setLyricsRaw(data.lyrics);
          analyse(data.lyrics);
          if (data.notes) { setRewriteNotes(data.notes); setRewriteSource("claude"); }
          setIsGenerating(false);
          return;
        }
      }
    } catch { /* fallthrough */ }

    const ly = draftToRaw(buildLyricsDraft(input));
    setLyricsRaw(ly); analyse(ly);
    setIsGenerating(false);
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

  const handleRewrite = async (mode: RewriteMode) => {
    if (loadingMode) return;
    // Push current state to history before rewriting
    setHistory((prev) => [{ lyrics, label: mode, ts: Date.now() }, ...prev].slice(0, 10));
    setLoadingMode(mode);
    setRewriteNotes("");

    const result = await callClaudeRewrite(mode, lyrics, stylePrompt, input, moraLines, intensity, sectionTarget);

    if (result) {
      setLyricsRaw(result.rewrittenLyrics);
      analyse(result.rewrittenLyrics);
      setRewriteNotes(result.notes ?? "");
      setRewriteSource("claude");
      setChangedLines(result.changedLines ?? []);
    } else {
      const v = applyRewriteMode(lyrics, mode);
      setLyricsRaw(v);
      analyse(v);
      setRewriteNotes("");
      setRewriteSource("rule");
      setChangedLines([]);
    }

    if (isSample) setIsSample(false);
    setLoadingMode(null);
  };

  const handleUndo = () => {
    const [last, ...rest] = history;
    if (!last) return;
    setLyricsRaw(last.lyrics);
    analyse(last.lyrics);
    setHistory(rest);
    setChangedLines([]);
    setRewriteNotes("");
    setRewriteSource(null);
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

  const handleSaveMemory = () => {
    const m: PromptMemory = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      ts: Date.now(),
      memo: saveMemo,
      title: input.title || input.theme || "(untitled)",
      songInput: input,
      stylePrompt,
      lyrics,
      worldPreset: preset,
      score: songStats?.riskScore ?? null,
    };
    saveMemory(m);
    setSaveMemo("");
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1600);
  };

  const handleRestoreMemory = (m: PromptMemory) => {
    setInput(m.songInput);
    setPreset(m.worldPreset);
    setStyle(m.stylePrompt);
    setLyricsRaw(m.lyrics);
    analyse(m.lyrics);
    setIsSample(false);
    setChangedLines([]);
    setRewriteNotes("");
    setRewriteSource(null);
    setHistory([]);
    setExpansion(null);
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

  // ─── Derived ─────────────────────────────────────────────────────────────

  const score   = songStats?.riskScore ?? null;
  const sColor  = score === null ? "text-zinc-700" : score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const dangers = suggestions.length;
  const issues  = phraseMatches.length + syntaxMatches.length + collapseRisks.length;

  // ─── Rewrite bar ──────────────────────────────────────────────────────────

  const rewriteBar = (
    <div className="shrink-0 border-t border-[#2a2f3a]/80" style={{ background: "var(--bg-rewrite)" }}>

      {/* Row 1: SECTION + INTENSITY (compact combined row) */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 px-4 pt-2 pb-1.5 border-b border-[#d0d7de]">
        <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase shrink-0">SECTION</span>
        <div className="flex gap-1">
          {SECTION_OPTS.map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setSectionTarget(val)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                sectionTarget === val
                  ? "border-violet-400 text-violet-700 bg-violet-50"
                  : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="w-px h-3 bg-[#d0d7de] shrink-0 mx-0.5" />
        <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase shrink-0">INTENSITY</span>
        <div className="flex gap-1">
          {INTENSITY_OPTS.map(([lv, lbl]) => (
            <button
              key={lv}
              onClick={() => setIntensity(lv)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                intensity === lv
                  ? "border-blue-400 text-blue-700 bg-blue-50"
                  : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Categorized rewrite buttons */}
      <div className="px-4 pt-2 pb-1 space-y-1.5">
        {REWRITE_CATS.map(({ label, modes }) => (
          <div key={label} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase w-11 shrink-0">
              {label}
            </span>
            {modes.map(([mode, display, tooltip]) => {
              const isLoading  = loadingMode === mode;
              const isDisabled = !!loadingMode;
              return (
                <button
                  key={mode}
                  onClick={() => handleRewrite(mode)}
                  disabled={isDisabled}
                  title={tooltip}
                  className={`px-2.5 py-1 text-[12px] font-mono border rounded transition-all disabled:cursor-not-allowed ${
                    isLoading
                      ? "border-blue-400 text-blue-600 bg-blue-50 animate-pulse"
                      : isDisabled
                      ? "border-[#d0d7de] text-zinc-400"
                      : mode === "ojaly"
                      ? "border-violet-300 text-violet-700 hover:border-violet-500 hover:bg-violet-50 active:scale-95"
                      : "border-[#c8cdd4] text-zinc-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 active:scale-95"
                  }`}
                >
                  {isLoading ? "…" : display}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Row 3: Undo + status badge + notes */}
      <div className="flex items-center gap-2 px-4 pb-3 min-h-[2rem]">
        {history.length > 0 && (
          <button
            onClick={handleUndo}
            title={`Undo: ${history[0]?.label}`}
            className="shrink-0 text-[12px] font-mono px-2.5 py-1 rounded border border-[#c8cdd4] text-zinc-600 hover:border-blue-400 hover:text-blue-700 transition-colors active:scale-95"
          >
            ↩ UNDO{history.length > 1 ? ` (${history.length})` : ""}
          </button>
        )}
        {rewriteSource && (
          <span className={`shrink-0 text-[12px] font-mono font-bold px-2.5 py-1 rounded border ${
            rewriteSource === "claude"
              ? "border-blue-300 text-blue-700 bg-blue-50"
              : "border-[#c8cdd4] text-zinc-600 bg-zinc-100"
          }`}>
            {rewriteSource === "claude" ? "Claude AI" : "ルールベース"}
          </span>
        )}
        {rewriteNotes && (
          <p className="text-[12px] font-mono text-zinc-600 leading-relaxed line-clamp-2">
            {rewriteNotes}
          </p>
        )}
      </div>
    </div>
  );

  // ─── Tuner panel ─────────────────────────────────────────────────────────

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
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <div className="fixed inset-0 scanlines pointer-events-none z-0 opacity-[0.12]" />

      {/* ── Titlebar ────────────────────────────────────────────────────────── */}
      <header
        className="relative z-20 shrink-0 h-10 border-b border-[#d0d7de] flex items-center px-4 gap-4 select-none"
        style={{ background: "var(--bg-titlebar)" }}
      >
        <span className="font-mono font-bold text-[15px] text-blue-600 tracking-widest">
          MORA<span className="text-zinc-400">.</span>exe
        </span>
        <span className="text-zinc-400 font-mono text-[12px] tracking-[0.2em] hidden sm:block">
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
            <span className="text-[11px] font-mono text-zinc-400 tracking-wider hidden sm:block">
              SAMPLE — ▶ GENERATE でカスタム生成
            </span>
          )}
          {score !== null && (
            <span className={`text-sm font-mono font-bold tabular-nums ${sColor}`}>
              SCORE {score}
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </header>

      {/* ── Mobile tab strip ────────────────────────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex h-9 border-b border-[#d0d7de] lg:hidden"
        style={{ background: "var(--bg-panel-hdr)" }}
      >
        {(["concept", "prompt", "lyrics", "tuner"] as MobileTab[]).map((t) => (
          <TabBtn key={t} active={mobileTab === t} onClick={() => setMobile(t)}>
            {t === "tuner" && dangers > 0 ? `TUNER ▲${dangers}` : t.toUpperCase()}
          </TabBtn>
        ))}
      </div>

      {/* ── Desktop 3-column IDE ────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 hidden lg:flex">

        {/* LEFT: Sidebar */}
        <aside
          className="w-[252px] shrink-0 flex flex-col border-r border-[#d0d7de]"
          style={{ background: "var(--bg-sidebar)" }}
        >
          <Sidebar
            input={input}
            onInputChange={setInput}
            preset={preset}
            onPresetChange={setPreset}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onWizardApply={(prompt, neg) => {
              setStyle(prompt);
              setNeg(neg);
              setIsSample(false);
            }}
            onApplyExpansion={() => {
              // GENERATE と同じ関数で Style Prompt を生成し一本化する
              if (!expansion) return;
              const sp = buildStylePromptFromExpansion(expansion, input, input.theme);
              const np = buildNegativePromptFromExpansion(expansion, input);
              setStyle(sp);
              setNeg(np);
              setIsSample(false);
            }}
            expansion={expansion}
            onExpansionChange={setExpansion}
          />
        </aside>

        {/* CENTER: Style Prompt */}
        <section
          className="flex-1 flex flex-col border-r border-[#d0d7de] min-w-0"
          style={{ background: "var(--bg-center)" }}
        >
          <PanelHeader>
            <span className="flex items-center px-3 text-[13px] font-mono text-zinc-700 tracking-[0.2em]">
              STYLE PROMPT
            </span>
            {isSample && <SampleBadge />}
            <div className="flex items-center gap-1.5 px-2 ml-auto">
              <CopyBtn text={stylePrompt} label="COPY" />
            </div>
          </PanelHeader>

          <PromptEditor value={stylePrompt} onChange={handleStyleEdit} isSample={isSample} />

          <div className="shrink-0 border-t border-[#d0d7de]" style={{ background: "var(--bg-neg)" }}>
            <div className="flex items-center px-4 pt-2 pb-1 gap-2">
              <span className="text-[13px] font-mono text-zinc-500 tracking-[0.15em]">NEGATIVE</span>
              <div className="ml-auto"><CopyBtn text={negPrompt} label="COPY NEG" dim /></div>
            </div>
            <textarea
              value={negPrompt}
              onChange={(e) => setNeg(e.target.value)}
              rows={2}
              className="w-full bg-transparent resize-none px-4 pb-2 font-mono text-[11px] leading-relaxed focus:outline-none"
              style={{ color: "#57606a", fontSize: "13px" }}
              spellCheck={false}
            />
          </div>
        </section>

        {/* RIGHT: Lyrics / Tuner — with Memory panel overlay */}
        <section
          className="flex-1 flex flex-col min-w-0 relative"
          style={{ background: "var(--bg-right)" }}
        >
          {showMemory && (
            <MemoryPanel
              onClose={() => setShowMemory(false)}
              onRestore={handleRestoreMemory}
            />
          )}

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
                changedLines={changedLines}
              />
              {rewriteBar}
            </>
          ) : tunerPanel}
        </section>
      </div>

      {/* ── Mobile single-col ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">
        {mobileTab === "concept" && (
          <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-sidebar)" }}>
            <Sidebar
              input={input}
              onInputChange={setInput}
              preset={preset}
              onPresetChange={setPreset}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onWizardApply={(prompt, neg) => {
                setStyle(prompt);
                setNeg(neg);
                setIsSample(false);
                setMobile("prompt");
              }}
              onApplyExpansion={() => {
                // GENERATE と同じ関数で Style Prompt を生成し一本化する
                if (!expansion) return;
                const sp = buildStylePromptFromExpansion(expansion, input, input.theme);
                const np = buildNegativePromptFromExpansion(expansion, input);
                setStyle(sp);
                setNeg(np);
                setIsSample(false);
                setMobile("prompt");
              }}
              expansion={expansion}
              onExpansionChange={setExpansion}
            />
          </div>
        )}
        {mobileTab === "prompt" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-center)" }}>
            <PanelHeader>
              <span className="flex items-center px-3 text-[13px] font-mono text-zinc-700 tracking-widest">STYLE PROMPT</span>
              {isSample && <SampleBadge />}
              <div className="flex items-center px-2 ml-auto"><CopyBtn text={stylePrompt} label="COPY" /></div>
            </PanelHeader>
            <PromptEditor value={stylePrompt} onChange={handleStyleEdit} isSample={isSample} />
          </div>
        )}
        {mobileTab === "lyrics" && (
          <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "var(--bg-right)" }}>
            {showMemory && (
              <MemoryPanel onClose={() => setShowMemory(false)} onRestore={handleRestoreMemory} />
            )}
            <PanelHeader>
              <span className="flex items-center px-3 text-[13px] font-mono text-zinc-700 tracking-widest">LYRICS</span>
              {isSample && <SampleBadge />}
              <div className="flex items-center px-2 ml-auto"><CopyBtn text={lyrics} label="COPY" /></div>
            </PanelHeader>
            <LyricsEditor value={lyrics} onChange={handleLyricsEdit} isSample={isSample} changedLines={changedLines} />
            {rewriteBar}
          </div>
        )}
        {mobileTab === "tuner" && tunerPanel}
      </div>

      {/* ── Final output footer ─────────────────────────────────────────────── */}
      <footer
        className="relative z-20 shrink-0 border-t border-[#d0d7de]"
        style={{ background: "var(--bg-titlebar)" }}
      >
        {/* Save memo row */}
        <div className="flex items-center gap-2 px-4 pt-1.5 pb-1">
          <input
            type="text"
            value={saveMemo}
            onChange={(e) => setSaveMemo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveMemory(); }}
            placeholder="memo (optional)"
            className="flex-1 min-w-0 bg-transparent font-mono text-[13px] text-zinc-600 placeholder-zinc-400 focus:outline-none"
          />
          <button
            onClick={handleSaveMemory}
            disabled={!lyrics || isSample}
            className={`text-[13px] font-mono px-3 py-1 rounded border transition-all disabled:opacity-20 disabled:cursor-default ${
              saveFlash
                ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                : "border-[#c8cdd4] text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            {saveFlash ? "✓ SAVED" : "SAVE"}
          </button>
          <button
            onClick={() => setShowMemory((v) => !v)}
            className={`text-[13px] font-mono px-3 py-1 rounded border transition-all ${
              showMemory
                ? "border-violet-400 text-violet-700 bg-violet-50"
                : "border-[#c8cdd4] text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            MEM
          </button>
        </div>

        {/* Output copy row */}
        <div className="h-9 flex items-center px-4 gap-2 border-t border-[#d0d7de]">
          <span className="text-[13px] font-mono text-zinc-500 tracking-[0.2em] shrink-0">OUTPUT</span>
          <div className="w-px h-3 bg-[#d0d7de] mx-1 shrink-0" />
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <CopyBtn text={stylePrompt} label="STYLE" />
            <CopyBtn text={lyrics}      label="LYRICS" />
            <CopyBtn text={negPrompt}   label="NEG" />
            {regenPrompt && <CopyBtn text={regenPrompt} label="REGEN" />}
          </div>
          <div className="ml-auto shrink-0">
            <CopyAllBtn onCopy={copyAll} hasContent={!!(stylePrompt || lyrics)} />
          </div>
        </div>
      </footer>
    </div>
  );
}
