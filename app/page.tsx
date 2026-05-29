"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import HeaderIcon from "@/components/HeaderIcon";
import PromptEditor from "@/components/PromptEditor";
import PromptLibraryPanel from "@/components/PromptLibraryPanel";
import PromptBuilder12Panel from "@/components/PromptBuilder12Panel";
import LyricsEditor from "@/components/LyricsEditor";
import MoraTunerPanel from "@/components/MoraTunerPanel";
import {
  SongInput, WorldPresetKey, WorldExpansion,
  MoraLine, MoraSuggestion, PhraseMatch, SyntaxMatch, CollapseRisk, SongStats,
  RewriteMode, RewriteIntensity, SectionTarget, HistoryEntry,
  StructureMode, StructurePreset, BuilderSection,
  SongProject, SongProjectMeta, BuilderPresetStep,
} from "@/types";
import { saveProject, loadProject, deleteProject, listProjects, generateProjectId } from "@/lib/songProject";
import { getPresetStructure } from "@/lib/structureVariation";
import {
  buildStylePrompt, buildNegativePrompt, buildRegeneratePrompt,
  buildStylePromptFromExpansion, buildNegativePromptFromExpansion,
} from "@/lib/promptBuilder";
import { buildLyricsDraft, draftToRaw, buildExpansionLyricsFallback } from "@/lib/lyricsBuilder";
import { analyzeLyrics, calcSongStats } from "@/lib/moraAnalyzer";
import { detectAiPhrases, detectSyntaxPatterns } from "@/lib/phraseDetector";
import { predictCollapse } from "@/lib/collapsePredictor";
import { generateMoraSuggestions, applyLineFix } from "@/lib/moraTuner";
import { applyRewriteMode, mergeSections } from "@/lib/rewriteModes";
import { callClaudeRewrite } from "@/lib/claudeRewrite";
import { loadMemories, saveMemory, deleteMemory, PromptMemory } from "@/lib/promptMemory";
import {
  getPromptItemById,
  buildLibraryStyleAddition,
  buildLibraryStructureHint,
  buildLibraryMetaTagHint,
  recommendFromExpansion,
  PromptLibraryItem,
} from "@/lib/promptLibrary";

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
type CenterTab = "prompt" | "library" | "builder";
type MobileTab = "concept" | "prompt" | "lyrics" | "tuner" | "library" | "builder";

const defaultInput: SongInput = {
  title: "", theme: "", genre: "jpop", bpm: "", key: "", mood: "",
  vocalType: "", songLength: "full", englishRatio: "low",
  worldPreset: "", referenceVibe: "", avoidExpressions: "",
  startWithChorus: false, avoidAiCliche: false, lyrics: "", nudges: [],
  genreLock: "",    // Phase 1: "" = AI decides, e.g. "jpop" = [GENRE LOCK: J-Pop]
  subStyles: [],    // Phase 2 (reserved): sub-style modifier chips
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
      className={`text-[13px] font-mono px-3 py-1.5 rounded border transition-all disabled:opacity-20 disabled:cursor-default ${
        copied
          ? "border-emerald-500 text-emerald-700 bg-emerald-50"
          : dim
          ? "border-[#94A3B8] text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 hover:bg-slate-50"
          : "border-[#94A3B8] text-zinc-700 hover:border-zinc-600 hover:text-zinc-900 hover:bg-slate-50"
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
      className={`px-4 h-full text-[13px] ui-sans border-b-2 transition-colors ${
        active
          ? "border-[#2563EB] text-[#1D4ED8] font-bold bg-[#EFF6FF]"
          : "border-transparent text-[#64748B] font-semibold hover:text-[#1E293B] hover:bg-white/60"
      }`}
    >
      {children}
    </button>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 h-11 border-b border-[#E2E8F0] flex items-stretch" style={{ background: "var(--bg-panel-hdr)" }}>
      {children}
    </div>
  );
}

function SampleBadge() {
  return (
    <span className="self-center ml-auto mr-2 text-[12px] font-mono border px-2 py-0.5 rounded tracking-wider" style={{ color: "var(--accent-warning-strong)", borderColor: "var(--accent-warning-border)", background: "var(--accent-warning-bg)" }}>
      SAMPLE
    </span>
  );
}

function Pill({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-[13px] font-mono text-zinc-500">{label}</span>
      <span className={`text-[13px] font-mono font-bold tabular-nums ${warn ? "text-[var(--accent-warning-strong)]" : "text-zinc-800"}`}>{value}</span>
    </span>
  );
}

function CopyAllBtn({ onCopy, hasContent }: { onCopy: () => void; hasContent: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (!hasContent) return; onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      disabled={!hasContent}
      className={`text-[13px] ui-sans px-4 py-1.5 font-bold transition-all disabled:opacity-30 disabled:cursor-default ${
        copied
          ? "rounded-[10px] border border-emerald-500 text-emerald-700 bg-emerald-50"
          : "rounded-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm"
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
      <div className="shrink-0 h-11 border-b border-[#E2E8F0] flex items-center px-4 gap-3" style={{ background: "var(--bg-panel-hdr)" }}>
        <span className="text-[13px] font-mono text-zinc-800 font-semibold tracking-widest">MEMORY</span>
        <span className="text-[12px] font-mono text-zinc-500">{memories.length} / 20 saved</span>
        <button
          onClick={onClose}
          className="ml-auto text-xs font-mono text-zinc-600 hover:text-zinc-900 border border-[#c8cdd4] hover:border-zinc-400 px-2 py-0.5 rounded transition-colors"
        >
          ✕ CLOSE
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[12px] font-mono text-zinc-500">No saved memories. Use SAVE in the footer.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {memories.map((m, i) => (
            <div
              key={m.id}
              className="border border-[#E2E8F0] rounded-lg p-3 hover:border-slate-300 transition-colors group"
              style={{ background: "#ffffff" }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-mono font-bold text-zinc-800 truncate">{m.title || "(untitled)"}</span>
                    {m.score !== null && (
                      <span className={`text-[12px] font-mono font-bold tabular-nums ${m.score >= 80 ? "text-emerald-600" : m.score >= 50 ? "text-[var(--accent-warning)]" : "text-[var(--accent-danger)]"}`}>
                        {m.score}
                      </span>
                    )}
                    {m.worldPreset && (
                      <span className="text-[11px] font-mono text-zinc-500 border border-[#c4cdd6] px-1 rounded">{m.worldPreset}</span>
                    )}
                  </div>
                  {m.memo && (
                    <p className="text-[12px] font-mono text-zinc-600 mb-1 line-clamp-1">{m.memo}</p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {i === 0 && (
                      <span className="text-[10px] font-mono font-bold px-1 py-px rounded border border-emerald-300 text-emerald-700 bg-emerald-50 leading-tight">
                        LATEST
                      </span>
                    )}
                    <span className="text-[12px] font-mono text-zinc-500 font-medium">
                      保存: {new Date(m.ts).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { onRestore(m); onClose(); }}
                    className="text-[12px] font-mono px-2 py-0.5 rounded border border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800 transition-colors"
                  >
                    RESTORE
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-[12px] font-mono px-2 py-0.5 rounded border border-[#c4cdd6] text-zinc-500 hover:border-red-400 hover:text-red-600 transition-colors"
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

// ─── Project List Panel ───────────────────────────────────────────────────────

function ProjectListPanel({
  onClose,
  onLoad,
  onDelete,
  onRename,
  refreshKey,
  currentProjectId,
}: {
  onClose: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  refreshKey: number;
  currentProjectId: string | null;
}) {
  const [projects, setProjects] = useState<SongProjectMeta[]>(() => listProjects());
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [editingName,     setEditingName]     = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(listProjects());
  }, [refreshKey]);

  const startEditing = (id: string, name: string) => {
    setConfirmDeleteId(null); // cancel any pending delete confirm
    setEditingId(id);
    setEditingName(name);
  };

  const commitRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  const cancelRename = () => setEditingId(null);

  const startConfirmDelete = (id: string) => {
    setEditingId(null); // cancel any active rename
    setEditingName("");
    setConfirmDeleteId(id);
  };

  const cancelConfirmDelete = () => setConfirmDeleteId(null);

  const commitDelete = (id: string) => {
    setConfirmDeleteId(null);
    onDelete(id);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(246,248,250,0.97)" }}
    >
      <div
        className="shrink-0 h-11 border-b border-[#E2E8F0] flex items-center px-4 gap-3"
        style={{ background: "var(--bg-panel-hdr)" }}
      >
        <span className="text-[13px] font-mono text-zinc-800 font-semibold tracking-widest">PROJECTS</span>
        <span className="text-[12px] font-mono text-zinc-500">{projects.length} saved</span>
        <button
          onClick={onClose}
          className="ml-auto text-xs font-mono text-zinc-600 hover:text-zinc-900 border border-[#c8cdd4] hover:border-zinc-400 px-2 py-0.5 rounded transition-colors"
        >
          ✕ CLOSE
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[12px] font-mono text-zinc-500">No saved projects.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {projects.map((p) => {
            const isEditing         = editingId       === p.id;
            const isConfirmingDelete = confirmDeleteId === p.id;
            return (
              <div
                key={p.id}
                className="border border-[#E2E8F0] rounded-lg p-3 hover:border-slate-300 transition-colors"
                style={{ background: "#ffffff" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")  commitRename(p.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                        className="w-full text-[13px] font-mono font-bold text-zinc-800 border border-blue-300 rounded px-1.5 py-0.5 outline-none focus:border-blue-500 bg-white"
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-[13px] font-mono font-bold truncate ${isConfirmingDelete ? "text-red-600" : "text-zinc-800"}`}>
                            {p.name || "(untitled)"}
                          </p>
                          {p.id === currentProjectId && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-px rounded border border-emerald-300 text-emerald-700 bg-emerald-50 leading-tight shrink-0">
                              · ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] font-mono text-zinc-500 mt-0.5">
                          {isConfirmingDelete
                            ? "Delete this project? This cannot be undone."
                            : new Date(p.updatedAt).toLocaleDateString("ja-JP", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => commitRename(p.id)}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800 transition-colors"
                        >
                          OK
                        </button>
                        <button
                          onClick={cancelRename}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-[#c4cdd6] text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 transition-colors"
                        >
                          ✕
                        </button>
                      </>
                    ) : isConfirmingDelete ? (
                      <>
                        <button
                          onClick={() => commitDelete(p.id)}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-red-400 text-red-600 hover:border-red-600 hover:bg-red-50 transition-colors"
                        >
                          YES, DELETE
                        </button>
                        <button
                          onClick={cancelConfirmDelete}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-[#c4cdd6] text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 transition-colors"
                        >
                          CANCEL
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (!window.confirm("Load this project? Unsaved changes will be lost.")) return;
                            onLoad(p.id);
                          }}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800 transition-colors"
                        >
                          LOAD
                        </button>
                        <button
                          onClick={() => startEditing(p.id, p.name)}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-[#c4cdd6] text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 transition-colors"
                        >
                          REN
                        </button>
                        <button
                          onClick={() => startConfirmDelete(p.id)}
                          className="text-[12px] font-mono px-2 py-0.5 rounded border border-[#c4cdd6] text-zinc-500 hover:border-red-400 hover:text-red-600 transition-colors"
                        >
                          DEL
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Diff helper ─────────────────────────────────────────────────────────────

/**
 * Compute 1-indexed content line numbers that differ between two lyric strings.
 * Section tags ([Chorus] etc.) and blank-blank pairs are excluded from counting,
 * matching LyricsEditor's lineNum increment logic exactly.
 */
function computeLineDiff(original: string, merged: string): number[] {
  const origLines  = original.split("\n");
  const mergedLines = merged.split("\n");
  const changed: number[] = [];
  let contentLineNum = 0;
  const maxLen = Math.max(origLines.length, mergedLines.length);
  for (let i = 0; i < maxLen; i++) {
    const a = (origLines[i]  ?? "").trim();
    const b = (mergedLines[i] ?? "").trim();
    if (/^\[[^\]]+\]$/.test(a) || /^\[[^\]]+\]$/.test(b)) continue; // skip tags
    if (!a && !b) continue;                                           // skip blank-blank
    contentLineNum++;
    if (a !== b) changed.push(contentLineNum);
  }
  return changed;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput]         = useState<SongInput>(defaultInput);
  const [preset, setPreset]       = useState<WorldPresetKey | "">("");
  const [expansion, setExpansion] = useState<WorldExpansion | null>(null);
  const [rightView, setRight]     = useState<RightView>("lyrics");
  const [mobileTab, setMobile]    = useState<MobileTab>("concept");
  const [centerTab, setCenterTab] = useState<CenterTab>("prompt");
  const [isSample, setIsSample]   = useState(false);

  const [stylePrompt, setStyle]   = useState("");
  const [negPrompt, setNeg]       = useState("");
  const [regenPrompt, setRegen]   = useState("");
  const [lyrics, setLyricsRaw]    = useState("");

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

  // 12-Step Prompt Builder override
  // When set, this prompt replaces buildStylePrompt / buildStylePromptFromExpansion in generate.
  const [stylePromptOverride, setStylePromptOverride] = useState("");

  // Project save / load
  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectSaveFlash, setProjectSaveFlash] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [builderReloadKey, setBuilderReloadKey] = useState(0);
  const [projectListRefreshKey, setProjectListRefreshKey] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  // Memory panel
  const [showMemory, setShowMemory] = useState(false);
  const [saveMemo, setSaveMemo] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);

  // Prompt Library — persisted in localStorage
  // ⚠ Do NOT read localStorage in useState initializer — causes SSR/client
  //   hydration mismatch. All localStorage reads happen in the mount effect below.
  const [libraryIds, setLibraryIds] = useState<string[]>([]);

  // ── Structure Blueprint state (persisted in localStorage) ────────────────
  const [structureMode,   setStructureMode]   = useState<StructureMode>("preset");
  const [structurePreset, setStructurePreset] = useState<StructurePreset>("chorus-first");
  const [builderSections, setBuilderSections] = useState<BuilderSection[]>([]);

  // Becomes true after first client-side render — gates localStorage-derived UI labels
  const [mounted, setMounted] = useState(false);

  // Single mount effect: restore all localStorage state then flip mounted.
  // This runs only on the client, after hydration is complete — no mismatch.
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem("mora-library-ids");
      if (storedIds) setLibraryIds(JSON.parse(storedIds) as string[]);
    } catch { /* ignore corrupt data */ }

    const storedMode    = localStorage.getItem("mora-structure-mode");
    const storedPreset  = localStorage.getItem("mora-structure-preset");
    const storedBuilder = localStorage.getItem("mora-structure-custom"); // キーを流用

    // 旧値 "auto"/"custom" は "preset" にフォールバック
    if (storedMode === "preset" || storedMode === "builder") {
      setStructureMode(storedMode);
    }
    if (storedPreset) setStructurePreset(storedPreset as StructurePreset);
    // 旧テキスト値は JSON.parse 失敗 → [] で無視
    try {
      const parsed = JSON.parse(storedBuilder ?? "[]");
      if (Array.isArray(parsed)) setBuilderSections(parsed as BuilderSection[]);
    } catch { /* 旧 custom テキストは破棄 */ }

    // Restore centerTab
    const storedCenterTab = localStorage.getItem("mora-center-tab");
    if (storedCenterTab === "prompt" || storedCenterTab === "library" || storedCenterTab === "builder") {
      setCenterTab(storedCenterTab);
    }

    // Restore genreLock / subStyles
    const storedGenreLock = localStorage.getItem("mora-genre-lock");
    const restoredGenreLock = typeof storedGenreLock === "string" ? storedGenreLock : "";

    let restoredSubStyles: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("mora-sub-styles") ?? "[]");
      if (Array.isArray(parsed)) {
        restoredSubStyles = parsed.filter((v): v is string => typeof v === "string");
      }
    } catch { /* ignore corrupt data */ }

    if (restoredGenreLock !== "" || restoredSubStyles.length > 0) {
      setInput(prev => ({
        ...prev,
        genreLock: restoredGenreLock,
        subStyles: restoredSubStyles,
      }));
    }

    try {
      const storedOverride = localStorage.getItem("mora-style-override");
      if (storedOverride && storedOverride.trim().length > 0) setStylePromptOverride(storedOverride);
    } catch { /* ignore */ }

    try {
      const storedNeg = localStorage.getItem("mora-negative-prompt");
      if (storedNeg && storedNeg.trim().length > 0) setNeg(storedNeg);
    } catch { /* ignore */ }

    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes back to localStorage (runs after each value change, post-mount)
  useEffect(() => { if (mounted) localStorage.setItem("mora-library-ids",     JSON.stringify(libraryIds));           }, [libraryIds,       mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("mora-structure-mode",   structureMode);                        }, [structureMode,    mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("mora-structure-preset", structurePreset);                      }, [structurePreset,  mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("mora-structure-custom", JSON.stringify(builderSections));      }, [builderSections,  mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("mora-genre-lock",       input.genreLock ?? "");                }, [input.genreLock,  mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("mora-sub-styles",       JSON.stringify(input.subStyles ?? [])); }, [input.subStyles,  mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("mora-center-tab",       centerTab);                             }, [centerTab,         mounted]);
  useEffect(() => {
    if (!mounted) return;
    try {
      if (stylePromptOverride.trim().length > 0) {
        localStorage.setItem("mora-style-override", stylePromptOverride);
      } else {
        localStorage.removeItem("mora-style-override");
      }
    } catch { /* ignore */ }
  }, [stylePromptOverride, mounted]);
  useEffect(() => {
    if (!mounted) return;
    try {
      if (negPrompt.trim().length > 0) {
        localStorage.setItem("mora-negative-prompt", negPrompt);
      } else {
        localStorage.removeItem("mora-negative-prompt");
      }
    } catch { /* ignore */ }
  }, [negPrompt, mounted]);

  // Derived: whether the 12-Step Builder override is currently active
  const hasOverride = stylePromptOverride.trim().length > 0;
  // Display-time effective style prompt — override takes priority over generated value
  const effectiveStylePrompt = hasOverride ? stylePromptOverride : stylePrompt;

  // Unsaved changes detection — snapshot of fields captured by handleSaveProject
  const currentSnapshot = useMemo(() =>
    JSON.stringify({
      input, preset, expansion, lyrics, stylePrompt, stylePromptOverride,
      negPrompt, regenPrompt, structureMode, structurePreset, builderSections, libraryIds,
    }),
    [input, preset, expansion, lyrics, stylePrompt, stylePromptOverride,
     negPrompt, regenPrompt, structureMode, structurePreset, builderSections, libraryIds]
  );
  const isDirty = currentProjectId !== null && savedSnapshot !== null && currentSnapshot !== savedSnapshot;

  /**
   * Returns the structure string to send to the API.
   * - preset: preset 構成文字列を返す
   * - builder: 選択済みセクションを [Bracket] 改行区切りで返す（0件なら undefined）
   */
  const resolvedStructureOverride = (): string | undefined => {
    if (structureMode === "builder") {
      const valid = builderSections.filter(Boolean);
      if (valid.length === 0) return undefined;
      return valid.map((s) => `[${s}]`).join("\n");
    }
    // preset
    return getPresetStructure(structurePreset, input.songLength);
  };

  /**
   * Builderモードで有効セクションが0件の場合は Generate 不可。
   * Autoフォールバックはしない方針。
   */
  const builderIsEmpty = structureMode === "builder" && builderSections.filter(Boolean).length === 0;

  // Forge-driven recommendations (recomputed only when expansion changes)
  const recommendations = useMemo(
    () => (expansion ? recommendFromExpansion(expansion, input.theme) : []),
    [expansion, input.theme]
  );

  // Auto-switch CENTER to Library tab when a new Forge result arrives
  const prevExpansionRef = useRef<WorldExpansion | null>(null);
  useEffect(() => {
    if (expansion && expansion !== prevExpansionRef.current) {
      setCenterTab("library");
      prevExpansionRef.current = expansion;
    }
  }, [expansion]);

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

  /** Resolve current libraryIds to items and build API payloads */
  const buildLibraryContext = () => {
    const items = libraryIds
      .map((id) => getPromptItemById(id))
      .filter((x): x is PromptLibraryItem => x !== undefined);
    return {
      items,
      styleAddition:  buildLibraryStyleAddition(items),
      structureHint:  buildLibraryStructureHint(items),
      metaTagHint:    buildLibraryMetaTagHint(items),
      chorusFirst:    items.some(
        (i) => i.category === "structure" && i.label === "chorus first"
      ),
    };
  };

  const handleGenerate = async () => {
    const rp = buildRegeneratePrompt(input);
    setRegen(rp);
    setIsSample(false);
    setMobile("prompt"); setRight("lyrics");
    setChangedLines([]);
    setRewriteNotes("");
    setRewriteSource(null);
    setHistory([]);
    setLyricsRaw("");   // 前回lyrics即クリア — 同じWorldから引きずらないように
    setIsGenerating(true);

    // ── PATH A: Expansion-first (World Forge was used) ──────────────────────
    // When expansion is present EVERY stage uses expansion data.
    // This path always returns — the legacy path below can never run.
    if (expansion) {
      const lib = buildLibraryContext();
      // 12-Step Prompt Builder override takes priority when set
      const sp = hasOverride ? stylePromptOverride : buildStylePromptFromExpansion(expansion, input, input.theme);
      const np = buildNegativePromptFromExpansion(expansion, input);
      // Append library style additions to displayed style prompt
      setStyle(lib.styleAddition ? `${sp}, ${lib.styleAddition}` : sp);
      setNeg(np);

      // Override startWithChorus if "chorus first" was selected in library
      const apiInput = lib.chorusFirst ? { ...input, startWithChorus: true } : input;

      const structOvr = resolvedStructureOverride();
      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            songInput: apiInput,
            expansion,
            libraryStyleAddition: lib.styleAddition,
            libraryStructureHint: lib.structureHint,
            libraryMetaTagHint:   lib.metaTagHint,
            structureOverride:    structOvr,
            isCustomBlueprint:    structureMode === "builder" && !!structOvr,
          }),
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
      } catch { /* fallthrough to expansion fallback */ }

      // Expansion fallback: Claude unavailable — build lyrics from expansion data,
      // NOT from generic mood pools. Style prompt is already expansion-based above.
      const ly = buildExpansionLyricsFallback(expansion, input);
      setLyricsRaw(ly);
      analyse(ly);
      setIsGenerating(false);
      return; // ← hard return: expansion path never falls through to legacy
    }

    // ── PATH B: Legacy (no expansion — form input / manual settings) ────────
    const lib = buildLibraryContext();
    // 12-Step Prompt Builder override takes priority when set
    const sp  = hasOverride ? stylePromptOverride : buildStylePrompt(input, preset);
    const np  = buildNegativePrompt(input);
    setStyle(lib.styleAddition ? `${sp}, ${lib.styleAddition}` : sp);
    setNeg(np);

    const apiInput = lib.chorusFirst ? { ...input, startWithChorus: true } : input;

    const structOvrB = resolvedStructureOverride();
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songInput: apiInput,
          expansion: null,
          libraryStyleAddition: lib.styleAddition,
          libraryStructureHint: lib.structureHint,
          libraryMetaTagHint:   lib.metaTagHint,
          structureOverride:    structOvrB,
          isCustomBlueprint:    structureMode === "builder" && !!structOvrB,
        }),
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
    setLyricsRaw(ly);
    analyse(ly);
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

    const result = await callClaudeRewrite(mode, lyrics, effectiveStylePrompt, input, moraLines, intensity, sectionTarget);

    if (result) {
      // Enforce section target: only accept Claude's edits for the target section.
      // Non-target sections are always restored from the original to prevent
      // Claude from silently modifying sections it was told to leave alone.
      const merged = mergeSections(lyrics, result.rewrittenLyrics, sectionTarget);
      setLyricsRaw(merged);
      analyse(merged);
      setRewriteNotes(result.notes ?? "");
      setRewriteSource("claude");
      // Compute actual diff from original → merged so highlights are always accurate,
      // regardless of whether Claude's changedLines array was for "all" or a sub-section.
      setChangedLines(computeLineDiff(lyrics, merged));
    } else {
      const v = applyRewriteMode(lyrics, mode, sectionTarget);
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

  const handleRegenLyrics = async () => {
    if (isGenerating || loadingMode) return;
    // Push current lyrics to history before overwriting
    setHistory((prev) => [{ lyrics, label: "regen", ts: Date.now() }, ...prev].slice(0, 10));
    setChangedLines([]);
    setRewriteNotes("");
    setRewriteSource(null);
    setLyricsRaw("");
    setIsGenerating(true);

    const regenLib = buildLibraryContext();
    const regenInput = regenLib.chorusFirst ? { ...input, startWithChorus: true } : input;
    const regenStructOvr = resolvedStructureOverride();

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songInput: regenInput,
          expansion,
          libraryStyleAddition: regenLib.styleAddition,
          libraryStructureHint: regenLib.structureHint,
          libraryMetaTagHint:   regenLib.metaTagHint,
          structureOverride:    regenStructOvr,
          isCustomBlueprint:    structureMode === "builder" && !!regenStructOvr,
        }),
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

    // Fallback: rule-based draft
    const ly = expansion
      ? buildExpansionLyricsFallback(expansion, input)
      : draftToRaw(buildLyricsDraft(input));
    setLyricsRaw(ly);
    analyse(ly);
    setIsGenerating(false);
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
      stylePrompt: effectiveStylePrompt,
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

  const handleLoadSample = () => {
    setStyle(SAMPLE_PROMPT);
    setNeg("generic AI vocal phrases, over-polished production, synthetic timbre");
    setLyricsRaw(SAMPLE_LYRICS);
    setIsSample(true);
    analyse(SAMPLE_LYRICS);
    setChangedLines([]);
    setRewriteNotes("");
    setRewriteSource(null);
    setHistory([]);
  };

  const copyAll = () => {
    const p = [
      effectiveStylePrompt && `=== STYLE PROMPT ===\n${effectiveStylePrompt}`,
      negPrompt    && `=== NEGATIVE PROMPT ===\n${negPrompt}`,
      lyrics       && `=== LYRICS ===\n${lyrics}`,
      regenPrompt  && `=== REGENERATE PROMPT ===\n${regenPrompt}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(p.join("\n\n"));
  };

  const handleClearSession = () => {
    setStylePromptOverride(""); // persist effect will removeItem("mora-style-override")
    setStyle("");
    setNeg("");
    setRegen("");
    setLyricsRaw("");
    setIsSample(false);
    setLines([]);
    setPhrases([]);
    setSyntax([]);
    setRisks([]);
    setStats(null);
    setRewriteNotes("");
    setRewriteSource(null);
    setChangedLines([]);
    setHistory([]);
    setExpansion(null);
  };

  // Read 12-Step Builder steps from localStorage (shared by SAVE and SAVE AS)
  const readBuilderSteps = (): BuilderPresetStep[] => {
    try {
      const raw = localStorage.getItem("mora-builder-12");
      if (raw) {
        const parsed = JSON.parse(raw) as { steps?: unknown[] };
        if (Array.isArray(parsed?.steps)) {
          return (parsed.steps as { id?: unknown; selected?: unknown; custom?: unknown }[])
            .filter((s) => typeof s?.id === "string")
            .map((s) => ({
              id: s.id as string,
              selected: typeof s.selected === "string" ? s.selected : null,
              custom: typeof s.custom === "string" ? s.custom : "",
            }));
        }
      }
    } catch { /* fallback to [] */ }
    return [];
  };

  const handleSaveProject = () => {
    const now = new Date().toISOString();
    const id = currentProjectId ?? generateProjectId();

    // Preserve original createdAt when overwriting an existing project
    let createdAt = now;
    if (currentProjectId) {
      try {
        const existing = loadProject(currentProjectId);
        if (existing) createdAt = existing.createdAt;
      } catch { /* use now */ }
    }

    const project: SongProject = {
      id,
      name: projectName.trim() || "Untitled Project",
      createdAt,
      updatedAt: now,
      input,
      worldPreset: preset,
      expansion,
      lyrics,
      stylePrompt,
      stylePromptOverride,
      negPrompt,
      regenPrompt,
      builderSteps: readBuilderSteps(),
      structureMode,
      structurePreset,
      builderSections,
      libraryIds,
      history: history.slice(-10),
      notes: "",
    };

    saveProject(project);
    setCurrentProjectId(id);
    setSavedSnapshot(currentSnapshot);
    setProjectSaveFlash(true);
    setTimeout(() => setProjectSaveFlash(false), 1800);
    setProjectListRefreshKey((k) => k + 1);
  };

  const handleSaveAsProject = () => {
    // Existing project → suggest "(copy)". Unsaved state → use current name as-is.
    const baseName = projectName.trim() || "Untitled Project";
    const defaultName = currentProjectId ? `${baseName} (copy)` : baseName;
    const newName = window.prompt("Save as new project:", defaultName);
    if (newName === null || newName.trim() === "") return;

    const now = new Date().toISOString();
    const id = generateProjectId(); // always a fresh ID

    const project: SongProject = {
      id,
      name: newName.trim(),
      createdAt: now,
      updatedAt: now,
      input,
      worldPreset: preset,
      expansion,
      lyrics,
      stylePrompt,
      stylePromptOverride,
      negPrompt,
      regenPrompt,
      builderSteps: readBuilderSteps(),
      structureMode,
      structurePreset,
      builderSections,
      libraryIds,
      history: history.slice(-10),
      notes: "",
    };

    saveProject(project);
    setCurrentProjectId(id);
    setProjectName(newName.trim());
    setSavedSnapshot(currentSnapshot);
    setProjectSaveFlash(true);
    setTimeout(() => setProjectSaveFlash(false), 1800);
    setProjectListRefreshKey((k) => k + 1);
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    if (id === currentProjectId) {
      setCurrentProjectId(null);
      setProjectName("");
      setSavedSnapshot(null);
    }
    setProjectListRefreshKey((k) => k + 1);
  };

  const handleRenameProject = (id: string, newName: string) => {
    try {
      const project = loadProject(id);
      if (!project) return;
      saveProject({ ...project, name: newName, updatedAt: new Date().toISOString() });
      if (id === currentProjectId) setProjectName(newName);
      setProjectListRefreshKey((k) => k + 1);
    } catch { /* ignore */ }
  };

  const handleNewProject = () => {
    if (!window.confirm("Start a new project? Current unsaved changes will be cleared.")) return;
    setCurrentProjectId(null);
    setProjectName("");
    setSavedSnapshot(null);
    handleClearSession();
  };

  const handleLoadProject = (id: string) => {
    try {
      const project = loadProject(id);
      if (!project) return;

      setInput(project.input);
      setPreset(project.worldPreset);
      setExpansion(project.expansion);
      setLyricsRaw(project.lyrics);
      setStyle(project.stylePrompt);
      setStylePromptOverride(project.stylePromptOverride);
      setNeg(project.negPrompt);
      setRegen(project.regenPrompt);
      setStructureMode(project.structureMode);
      setStructurePreset(project.structurePreset);
      setBuilderSections(project.builderSections);
      setLibraryIds(project.libraryIds);
      setHistory(project.history ?? []);

      // Clear transient state
      setIsSample(false);
      setChangedLines([]);
      setRewriteNotes("");
      setRewriteSource(null);

      // Update project tracking
      setProjectName(project.name);
      setCurrentProjectId(project.id);
      setSavedSnapshot(JSON.stringify({
        input: project.input,
        preset: project.worldPreset,
        expansion: project.expansion,
        lyrics: project.lyrics,
        stylePrompt: project.stylePrompt,
        stylePromptOverride: project.stylePromptOverride,
        negPrompt: project.negPrompt,
        regenPrompt: project.regenPrompt,
        structureMode: project.structureMode,
        structurePreset: project.structurePreset,
        builderSections: project.builderSections,
        libraryIds: project.libraryIds,
      }));

      // Write builder steps back to localStorage and remount the panel
      try {
        localStorage.setItem("mora-builder-12", JSON.stringify({ steps: project.builderSteps }));
      } catch { /* ignore */ }
      setBuilderReloadKey((k) => k + 1);

      // Re-run analysis on loaded lyrics
      if (project.lyrics) analyse(project.lyrics);

      setShowProjectList(false);
    } catch { /* ignore corrupt project */ }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const score   = songStats?.riskScore ?? null;
  const sColor  = score === null ? "text-zinc-700" : score >= 80 ? "text-emerald-500" : score >= 50 ? "text-[var(--accent-warning)]" : "text-[var(--accent-danger)]";
  const dangers = suggestions.length;
  const issues  = phraseMatches.length + syntaxMatches.length + collapseRisks.length;

  // ─── Rewrite bar ──────────────────────────────────────────────────────────

  const rewriteBar = (
    <div className="mora-card shrink-0">

      {/* REWRITE TOOLS header */}
      <div className="mora-card-hdr">
        <HeaderIcon name="refresh-cw" />
        <span>REWRITE TOOLS</span>
      </div>

      {/* Row 1: SECTION + INTENSITY (compact combined row) */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 px-4 pt-2 pb-2 border-b border-[#E2E8F0]">
        <span className="text-[11px] ui-sans text-zinc-600 tracking-widest uppercase font-bold shrink-0">SECTION</span>
        <div className="flex gap-1">
          {SECTION_OPTS.map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setSectionTarget(val)}
              className={`px-2 py-0.5 text-[12px] font-mono rounded border transition-colors ${
                sectionTarget === val
                  ? "border-violet-400 text-violet-700 bg-violet-50"
                  : "border-[#c4cdd6] text-zinc-600 hover:border-zinc-500 hover:text-zinc-800"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="w-px h-3 bg-[#c4cdd6] shrink-0 mx-0.5" />
        <span className="text-[11px] ui-sans text-zinc-600 tracking-widest uppercase font-bold shrink-0">INTENSITY</span>
        <div className="flex gap-1">
          {INTENSITY_OPTS.map(([lv, lbl]) => (
            <button
              key={lv}
              onClick={() => setIntensity(lv)}
              className={`px-2 py-0.5 text-[12px] font-mono rounded border transition-colors ${
                intensity === lv
                  ? "border-blue-400 text-blue-700 bg-blue-50"
                  : "border-[#c4cdd6] text-zinc-600 hover:border-zinc-500 hover:text-zinc-800"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Categorized rewrite buttons */}
      <div className="px-4 pt-2 pb-1.5 space-y-1.5">
        {REWRITE_CATS.map(({ label, modes }) => (
          <div key={label} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] ui-sans font-bold text-zinc-500 tracking-[0.08em] uppercase w-12 shrink-0">
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
                  className={`px-2.5 py-0.5 text-[12px] font-mono border rounded transition-all disabled:cursor-not-allowed ${
                    isLoading
                      ? "border-blue-400 text-blue-600 bg-blue-50 animate-pulse"
                      : isDisabled
                      ? "border-[#c4cdd6] text-zinc-400"
                      : mode === "ojaly"
                      ? "border-violet-300 text-violet-700 hover:border-violet-500 hover:bg-violet-50 active:scale-95"
                      : "border-[#c4cdd6] text-zinc-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 active:scale-95"
                  }`}
                >
                  {isLoading ? "…" : display}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Row 3: Undo + REGEN LYRICS + source badge */}
      <div className="flex items-center gap-2 px-4 pt-1.5 pb-2 flex-wrap border-t border-[#E2E8F0]">
        {history.length > 0 && (
          <button
            onClick={handleUndo}
            title={`Undo: ${history[0]?.label}`}
            className="shrink-0 text-[12px] font-mono px-2.5 py-0.5 rounded border border-[#c4cdd6] text-zinc-700 hover:border-blue-400 hover:text-blue-700 transition-colors active:scale-95"
          >
            ↩ UNDO{history.length > 1 ? ` (${history.length})` : ""}
          </button>
        )}
        <button
          onClick={handleRegenLyrics}
          disabled={isGenerating || !!loadingMode || builderIsEmpty}
          className={`shrink-0 text-[12px] font-mono px-2.5 py-0.5 rounded border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
            isGenerating
              ? "border-[var(--accent-warning-border)] text-[var(--accent-warning)] bg-[var(--accent-warning-bg)] animate-pulse"
              : "border-[#c4cdd6] text-zinc-700 hover:border-[var(--accent-warning-border)] hover:text-[var(--accent-warning-strong)]"
          }`}
        >
          {isGenerating ? "…" : "↺ REGEN LYRICS"}
        </button>
        {rewriteSource && (
          <span className={`shrink-0 text-[12px] font-mono font-bold px-2.5 py-0.5 rounded border ${
            rewriteSource === "claude"
              ? "border-blue-300 text-blue-700 bg-blue-50"
              : "border-[#c4cdd6] text-zinc-700 bg-zinc-100"
          }`}>
            {rewriteSource === "claude" ? "Claude AI" : "ルールベース"}
          </span>
        )}
      </div>

      {/* Row 4: Claude変更理由コメント (bordered box, only when present) */}
      {rewriteNotes && (
        <div className="px-4 pb-3">
          <div className="border border-[#E2E8F0] rounded-lg px-3 py-2" style={{ background: "#F8FAFC" }}>
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase font-semibold block mb-0.5">
              {sectionTarget !== "all" ? `${sectionTarget.toUpperCase()} · ` : ""}変更メモ
            </span>
            <p className="text-[12px] font-mono text-zinc-700 leading-relaxed overflow-y-auto" style={{ maxHeight: "4.5rem" }}>
              {rewriteNotes}
            </p>
          </div>
        </div>
      )}
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
        className="relative z-20 shrink-0 h-11 border-b border-[#E2E8F0] flex items-center px-5 gap-4 select-none"
        style={{ background: "var(--bg-titlebar)" }}
      >
        <span className="font-mono font-bold text-[15px] text-blue-600 tracking-widest">
          MORA<span className="text-zinc-400">.</span>exe
        </span>
        <span className="text-zinc-500 font-mono text-[13px] tracking-[0.2em] hidden sm:block">
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
              SAMPLE MODE
            </span>
          )}
          {score !== null && (
            <span className={`text-sm font-mono font-bold tabular-nums ${sColor}`}>
              SCORE {score}
            </span>
          )}
          <button
            onClick={handleLoadSample}
            title="サンプルのStyle / Lyrics / Negativeを読み込む"
            className={`text-[12px] font-mono px-2.5 py-1 rounded border transition-colors ${
              isSample
                ? "border-[var(--accent-warning-border)] text-[var(--accent-warning-strong)] bg-[var(--accent-warning-bg)]"
                : "border-[#E2E8F0] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
            }`}
          >
            SAMPLE
          </button>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </header>

      {/* ── Mobile tab strip ────────────────────────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex h-9 border-b border-[#E2E8F0] lg:hidden"
        style={{ background: "var(--bg-panel-hdr)" }}
      >
        {(["concept", "prompt", "library", "lyrics", "tuner", "builder"] as MobileTab[]).map((t) => (
          <TabBtn key={t} active={mobileTab === t} onClick={() => setMobile(t)}>
            {t === "tuner"   && dangers > 0          ? `TUNER ▲${dangers}` :
             t === "library" && libraryIds.length > 0 ? `LIB·${libraryIds.length}` :
             t === "library" && recommendations.length > 0 ? `LIB◆${recommendations.length}` :
             t === "builder"                           ? "BLDR" :
             t.toUpperCase()}
          </TabBtn>
        ))}
      </div>

      {/* ── Desktop 3-column IDE ────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 hidden lg:flex">

        {/* LEFT: Sidebar */}
        <aside
          className="w-[300px] shrink-0 flex flex-col border-r border-[#E2E8F0]"
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
              // Create Draft: Forge済みWorldExpansionからStyle / Lyrics / Negativeをまとめて生成
              if (!expansion) return;
              handleGenerate();
            }}
            expansion={expansion}
            onExpansionChange={setExpansion}
            libraryIds={libraryIds}
            onLibraryIdsChange={setLibraryIds}
            recommendations={recommendations}
            onOpenLibrary={() => setCenterTab("library")}
            structureMode={structureMode}
            onStructureModeChange={setStructureMode}
            structurePreset={structurePreset}
            onStructurePresetChange={setStructurePreset}
            builderSections={builderSections}
            onBuilderSectionsChange={setBuilderSections}
            builderIsEmpty={builderIsEmpty}
            mounted={mounted}
            stylePromptOverride={stylePromptOverride}
            onClearStylePromptOverride={() => setStylePromptOverride("")}
            onClearSession={handleClearSession}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onSaveProject={handleSaveProject}
            projectSaveFlash={projectSaveFlash}
            isProjectDirty={isDirty}
            onSaveAsProject={handleSaveAsProject}
            onOpenProjectList={() => setShowProjectList(true)}
            onNewProject={handleNewProject}
          />
        </aside>

        {/* CENTER: Style Workspace */}
        <section
          className="relative flex flex-col border-r border-[#E2E8F0] min-w-0 overflow-hidden"
          style={{ flex: "8 1 0%", background: "var(--bg-center)" }}
        >
          {showProjectList && (
            <ProjectListPanel
              onClose={() => setShowProjectList(false)}
              onLoad={handleLoadProject}
              onDelete={handleDeleteProject}
              onRename={handleRenameProject}
              refreshKey={projectListRefreshKey}
              currentProjectId={currentProjectId}
            />
          )}
          {/* Mini tab pills */}
          <div className="shrink-0 flex items-center gap-2 px-4 pt-3 pb-2">
            <button
              onClick={() => setCenterTab("prompt")}
              className={`text-[12px] ui-sans px-3 py-1 rounded-md border transition-colors ${
                centerTab === "prompt"
                  ? "bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] font-bold"
                  : "border-[#CBD5E1] text-[#64748B] font-semibold hover:border-[#94A3B8] hover:text-[#1E293B]"
              }`}
            >
              STYLE PROMPT
            </button>
            <button
              onClick={() => setCenterTab("library")}
              className={`text-[12px] ui-sans px-3 py-1 rounded-md border transition-colors ${
                centerTab === "library"
                  ? "bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] font-bold"
                  : "border-[#CBD5E1] text-[#64748B] font-semibold hover:border-[#94A3B8] hover:text-[#1E293B]"
              }`}
            >
              {libraryIds.length > 0
                ? `LIBRARY · ${libraryIds.length}`
                : recommendations.length > 0
                  ? `LIBRARY ◆${recommendations.length}`
                  : "LIBRARY"}
            </button>
            <button
              onClick={() => setCenterTab("builder")}
              className={`text-[12px] ui-sans px-3 py-1 rounded-md border transition-colors ${
                centerTab === "builder"
                  ? "bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] font-bold"
                  : "border-[#CBD5E1] text-[#64748B] font-semibold hover:border-[#94A3B8] hover:text-[#1E293B]"
              }`}
            >
              {hasOverride ? "BUILDER · active" : "BUILDER"}
            </button>
            {centerTab === "prompt" && isSample && <SampleBadge />}
          </div>

          {centerTab === "prompt" && (
            <div className="flex-1 min-h-0 flex flex-col gap-3.5 px-4 pb-4 overflow-hidden">
              {/* STYLE PROMPT card */}
              <div className="mora-card flex-1 min-h-0">
                <div className="mora-card-hdr">
                  <HeaderIcon name="file-text" />
                  <span>STYLE PROMPT</span>
                  {hasOverride && (
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-[1px] leading-none">
                        Builder override active
                      </span>
                      <button
                        onClick={() => setStylePromptOverride("")}
                        className="text-[10px] font-mono text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 rounded px-1.5 py-[1px] bg-amber-50 hover:bg-amber-100 transition-colors leading-none"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  )}
                  <div className="ml-auto"><CopyBtn text={effectiveStylePrompt} label="COPY" /></div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <PromptEditor
                    value={effectiveStylePrompt}
                    onChange={handleStyleEdit}
                    isSample={isSample}
                    placeholder="Generate後にStyle Promptがここに表示されます"
                  />
                </div>
              </div>

              {/* NEGATIVE card */}
              <div className="mora-card shrink-0">
                <div className="mora-card-hdr">
                  <HeaderIcon name="ban" />
                  <span>NEGATIVE</span>
                  <div className="ml-auto"><CopyBtn text={negPrompt} label="COPY NEG" dim /></div>
                </div>
                <textarea
                  value={negPrompt}
                  onChange={(e) => setNeg(e.target.value)}
                  rows={6}
                  className="w-full bg-white resize-none px-4 py-3 font-mono leading-relaxed focus:outline-none"
                  style={{ color: "#44505c", fontSize: "14px" }}
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {centerTab === "library" && (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-1">
              <div className="mora-card">
                <div className="mora-card-hdr">
                  <HeaderIcon name="library" />
                  <span>
                    {libraryIds.length > 0
                      ? `LIBRARY · ${libraryIds.length}`
                      : recommendations.length > 0
                        ? `LIBRARY ◆${recommendations.length}`
                        : "LIBRARY"}
                  </span>
                </div>
                <div className="p-4">
                  <PromptLibraryPanel
                    selectedIds={libraryIds}
                    onSelectionChange={setLibraryIds}
                    recommendedItems={recommendations}
                  />
                </div>
              </div>
            </div>
          )}

          {centerTab === "builder" && (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-2">
              <div className="max-w-2xl mx-auto">
                <PromptBuilder12Panel
                  key={builderReloadKey}
                  onApply={(p) => {
                    setStylePromptOverride(p);
                    setCenterTab("prompt");
                  }}
                  onReplaceNegative={(neg) => setNeg(neg)}
                  onAppendNegative={(neg) => {
                    setNeg((prev) => {
                      const existing = prev.trim() === "" || prev.trim().toLowerCase() === "none" ? "" : prev.trim();
                      if (existing && existing.includes(neg)) return existing;
                      return existing ? `${existing}, ${neg}` : neg;
                    });
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: Lyrics / Tuner — flex 10 (≈44% of total) */}
        <section
          className="flex flex-col min-w-0 relative"
          style={{ flex: "10 1 0%", background: "var(--bg-right)" }}
        >
          {showMemory && (
            <MemoryPanel
              onClose={() => setShowMemory(false)}
              onRestore={handleRestoreMemory}
            />
          )}

          <div className="flex-1 min-h-0 flex flex-col gap-3.5 px-4 pt-3 pb-4 overflow-hidden">
            {rightView === "lyrics" ? (
              <>
                {/* LYRICS card */}
                <div className="mora-card flex-1 min-h-0">
                  <div className="mora-card-hdr">
                    <HeaderIcon name="music" />
                    <button
                      onClick={() => setRight("lyrics")}
                      className="text-[12px] ui-sans px-3 py-1 rounded-md border bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] font-bold"
                    >LYRICS</button>
                    <button
                      onClick={() => setRight("tuner")}
                      className={`text-[12px] ui-sans font-semibold px-3 py-1 rounded-md border transition-colors ${
                        dangers > 0
                          ? "border-[var(--accent-warning-border)] text-[var(--accent-warning-strong)]"
                          : "border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8] hover:text-[#1E293B]"
                      }`}
                    >
                      TUNER{dangers > 0 ? ` ▲${dangers}` : issues > 0 ? ` (${issues})` : ""}
                    </button>
                    {isSample && <SampleBadge />}
                    <div className="ml-auto"><CopyBtn text={lyrics} label="COPY" /></div>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <LyricsEditor
                      value={lyrics}
                      onChange={handleLyricsEdit}
                      isSample={isSample}
                      changedLines={changedLines}
                      placeholder="Generate後に歌詞がここに表示されます"
                    />
                  </div>
                </div>
                {rewriteBar}
              </>
            ) : (
              /* TUNER card */
              <div className="mora-card flex-1 min-h-0">
                <div className="mora-card-hdr">
                  <HeaderIcon name="music" />
                  <button
                    onClick={() => setRight("lyrics")}
                    className="text-[12px] ui-sans font-semibold px-3 py-1 rounded-md border border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8] hover:text-[#1E293B] transition-colors"
                  >LYRICS</button>
                  <button
                    onClick={() => setRight("tuner")}
                    className="text-[12px] ui-sans px-3 py-1 rounded-md border bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] font-bold"
                  >
                    TUNER{dangers > 0 ? ` ▲${dangers}` : issues > 0 ? ` (${issues})` : ""}
                  </button>
                </div>
                {tunerPanel}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Mobile single-col ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">
        {showProjectList && (
          <ProjectListPanel
            onClose={() => setShowProjectList(false)}
            onLoad={handleLoadProject}
            onDelete={handleDeleteProject}
            onRename={handleRenameProject}
            refreshKey={projectListRefreshKey}
            currentProjectId={currentProjectId}
          />
        )}
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
                // Create Draft: Forge済みWorldExpansionからStyle / Lyrics / Negativeをまとめて生成
                if (!expansion) return;
                handleGenerate();
              }}
              expansion={expansion}
              onExpansionChange={setExpansion}
              libraryIds={libraryIds}
              onLibraryIdsChange={setLibraryIds}
              recommendations={recommendations}
              onOpenLibrary={() => setMobile("library")}
              structureMode={structureMode}
              onStructureModeChange={setStructureMode}
              structurePreset={structurePreset}
              onStructurePresetChange={setStructurePreset}
              builderSections={builderSections}
              onBuilderSectionsChange={setBuilderSections}
              builderIsEmpty={builderIsEmpty}
              mounted={mounted}
              stylePromptOverride={stylePromptOverride}
              onClearStylePromptOverride={() => setStylePromptOverride("")}
              onClearSession={handleClearSession}
              projectName={projectName}
              onProjectNameChange={setProjectName}
              onSaveProject={handleSaveProject}
              projectSaveFlash={projectSaveFlash}
              isProjectDirty={isDirty}
              onOpenProjectList={() => setShowProjectList(true)}
              onNewProject={handleNewProject}
            />
          </div>
        )}
        {mobileTab === "prompt" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-center)" }}>
            <PanelHeader>
              <span className="flex items-center px-3 text-[14px] font-mono font-bold text-[#0F172A] tracking-[0.10em]">STYLE PROMPT</span>
              {isSample && <SampleBadge />}
              {hasOverride && (
                <div className="flex items-center gap-1 px-2">
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-[1px] leading-none">
                    Builder override
                  </span>
                  <button
                    onClick={() => setStylePromptOverride("")}
                    className="text-[10px] font-mono text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 rounded px-1.5 py-[1px] bg-amber-50 hover:bg-amber-100 transition-colors leading-none"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex items-center px-2 ml-auto"><CopyBtn text={effectiveStylePrompt} label="COPY" /></div>
            </PanelHeader>
            <div className="flex-1 min-h-0 px-4 pt-4 pb-4 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 rounded-xl border border-[#CBD5E1] bg-white overflow-hidden flex flex-col" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
                <PromptEditor value={effectiveStylePrompt} onChange={handleStyleEdit} isSample={isSample} />
              </div>
            </div>
          </div>
        )}
        {mobileTab === "library" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-center)" }}>
            <PanelHeader>
              <span className="flex items-center px-3 text-[14px] font-mono font-bold text-[#0F172A] tracking-[0.10em]">
                {libraryIds.length > 0 ? `LIBRARY · ${libraryIds.length}` : "LIBRARY"}
              </span>
            </PanelHeader>
            <div className="flex-1 overflow-y-auto p-3">
              <PromptLibraryPanel
                selectedIds={libraryIds}
                onSelectionChange={setLibraryIds}
                recommendedItems={recommendations}
              />
            </div>
          </div>
        )}
        {mobileTab === "lyrics" && (
          <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "var(--bg-right)" }}>
            {showMemory && (
              <MemoryPanel onClose={() => setShowMemory(false)} onRestore={handleRestoreMemory} />
            )}
            <PanelHeader>
              <span className="flex items-center px-3 text-[14px] font-mono font-bold text-[#0F172A] tracking-[0.10em]">LYRICS</span>
              {isSample && <SampleBadge />}
              <div className="flex items-center px-2 ml-auto"><CopyBtn text={lyrics} label="COPY" /></div>
            </PanelHeader>
            <div className="flex-1 min-h-0 px-4 pt-4 pb-3 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 rounded-xl border border-[#CBD5E1] bg-white overflow-hidden flex flex-col" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
                <LyricsEditor value={lyrics} onChange={handleLyricsEdit} isSample={isSample} changedLines={changedLines} placeholder="Generate後に歌詞がここに表示されます" />
              </div>
            </div>
            {rewriteBar}
          </div>
        )}
        {mobileTab === "tuner" && tunerPanel}
        {mobileTab === "builder" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-center)" }}>
            <PanelHeader>
              <span className="flex items-center px-3 text-[14px] font-mono font-bold text-[#0F172A] tracking-[0.10em]">BUILDER</span>
            </PanelHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <PromptBuilder12Panel
                key={builderReloadKey}
                onApply={(p) => {
                  setStylePromptOverride(p);
                  setMobile("prompt");
                }}
                onReplaceNegative={(neg) => setNeg(neg)}
                onAppendNegative={(neg) => {
                  setNeg((prev) => {
                    const existing = prev.trim() === "" || prev.trim().toLowerCase() === "none" ? "" : prev.trim();
                    if (existing && existing.includes(neg)) return existing;
                    return existing ? `${existing}, ${neg}` : neg;
                  });
                }}
              />
            </div>
          </div>
        )}
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
            <CopyBtn text={effectiveStylePrompt} label="STYLE" />
            <CopyBtn text={lyrics}      label="LYRICS" />
            <CopyBtn text={negPrompt}   label="NEG" />
            {regenPrompt && <CopyBtn text={regenPrompt} label="REGEN" />}
          </div>
          <div className="ml-auto shrink-0">
            <CopyAllBtn onCopy={copyAll} hasContent={!!(effectiveStylePrompt || lyrics)} />
          </div>
        </div>
      </footer>
    </div>
  );
}
