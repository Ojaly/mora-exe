"use client";

import { useState } from "react";
import { SongInput, WorldPresetKey, WorldExpansion, StructureMode, StructurePreset, BuilderSection } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { QUICK_QUESTIONS, DEEP_QUESTIONS } from "@/lib/wizardData";
import { buildWizardPrompt, WizardAnswers } from "@/lib/wizardBuilder";
import WorldForge from "@/components/WorldForge";
import SourceAlchemy from "@/components/SourceAlchemy";
import StructureBlueprint from "@/components/StructureBlueprint";
import { getPromptItemById, PromptLibraryItem } from "@/lib/promptLibrary";
import HeaderIcon from "@/components/HeaderIcon";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardMode = "off" | "quick" | "deep";

interface Props {
  input: SongInput;
  onInputChange: (next: SongInput) => void;
  preset: WorldPresetKey | "";
  onPresetChange: (p: WorldPresetKey | "") => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  onWizardApply: (prompt: string, negative: string) => void;
  onApplyExpansion: (stylePrompt: string) => void;
  expansion: WorldExpansion | null;
  onExpansionChange: (e: WorldExpansion | null) => void;
  libraryIds: string[];
  onLibraryIdsChange: (ids: string[]) => void;
  /** Pre-computed Forge recommendations — shown as count badge in compact summary */
  recommendations?: PromptLibraryItem[];
  /** Called when user clicks "OPEN LIBRARY →" to switch to center panel */
  onOpenLibrary?: () => void;
  // ── Structure Blueprint ────────────────────────────────────────────────────
  structureMode: StructureMode;
  onStructureModeChange: (m: StructureMode) => void;
  structurePreset: StructurePreset;
  onStructurePresetChange: (p: StructurePreset) => void;
  builderSections: BuilderSection[];
  onBuilderSectionsChange: (s: BuilderSection[]) => void;
  /** Builder モードで有効セクションが0件のとき true — Generate ボタンを無効化 */
  builderIsEmpty?: boolean;
  /**
   * True only after the client has mounted and localStorage has been restored.
   * Dynamic labels that depend on localStorage values must be gated behind this
   * to prevent SSR/client hydration mismatches.
   */
  mounted?: boolean;
  // ── 12-Step Prompt Builder ─────────────────────────────────────────────────
  /** Non-empty when the 12-Step override is active — shown in Generate footer. */
  stylePromptOverride?: string;
  /** Clears the 12-Step override and restores normal Style Prompt generation. */
  onClearStylePromptOverride?: () => void;
  /** Clears the current generated session (style prompt, lyrics, negatives, analysis). */
  onClearSession?: () => void;
  // ── Project ────────────────────────────────────────────────────────────────
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onSaveProject?: () => void;
  projectSaveFlash?: boolean;
  isProjectDirty?: boolean;
  onSaveAsProject?: () => void;
  onOpenProjectList?: () => void;
  onNewProject?: () => void;
}

// ─── Wizard → SongInput mapping ───────────────────────────────────────────────

function mapWizardToInput(
  answers: WizardAnswers,
  mode: "quick" | "deep"
): { partial: Partial<SongInput>; preset: WorldPresetKey | "" } {
  const v = (key: string) => answers[key]?.free?.trim() || answers[key]?.chip || "";
  const partial: Partial<SongInput> = {};
  let preset: WorldPresetKey | "" = "";

  if (mode === "quick") {
    const base    = v("base").toLowerCase();
    const vocal   = v("vocal").toLowerCase();
    const emotion = v("emotion").toLowerCase();
    const world   = v("world").toLowerCase();
    const tempo   = v("tempo").toLowerCase();

    if (base.includes("electronic") || base.includes("synth")) partial.genre = "electronic";
    else if (base.includes("rock"))       partial.genre = "jrock";
    else if (base.includes("jazz"))       partial.genre = "jazz";
    else if (base.includes("hip-hop") || base.includes("trap")) partial.genre = "hiphop";
    else if (base.includes("ambient"))    partial.genre = "ambient";
    else if (base.includes("acoustic") || base.includes("folk")) partial.genre = "folk";
    else if (base.includes("orchestral") || base.includes("cinematic")) partial.genre = "ambient";

    if (vocal.includes("female"))      partial.vocalType = "female";
    else if (vocal.includes("male"))   partial.vocalType = "male";
    else if (vocal.includes("choir"))  partial.vocalType = "choir";

    if (emotion.includes("euphoric") || emotion.includes("uplifting")) partial.mood = "uplifting";
    else if (emotion.includes("melanchol") || emotion.includes("bittersweet")) partial.mood = "melancholic";
    else if (emotion.includes("mysterious") || emotion.includes("ethereal")) partial.mood = "dreamy";
    else if (emotion.includes("unsettling") || emotion.includes("dark") || emotion.includes("tense")) partial.mood = "dark";
    else if (emotion.includes("aggressive")) partial.mood = "aggressive";
    else if (emotion.includes("intoxicating") || emotion.includes("hypnotic")) partial.mood = "dreamy";

    if (world.includes("cyberpunk") || world.includes("neon"))       preset = "neon";
    else if (world.includes("dystop") || world.includes("surveillance")) preset = "corporate";
    else if (world.includes("mythic") || world.includes("ancient"))  preset = "mythic";
    else if (world.includes("gospel") || world.includes("glitch"))   preset = "gospel-irony";
    else if (world.includes("baroque") || world.includes("waltz"))   preset = "electro-waltz";

    if (tempo.includes("slow"))        partial.bpm = "72";
    else if (tempo.includes("mid"))    partial.bpm = "96";
    else if (tempo.includes("fast"))   partial.bpm = "140";
  }

  if (mode === "deep") {
    const genre  = v("genre").toLowerCase();
    const vocal  = v("vocal_texture").toLowerCase();
    const tempo  = v("tempo").toLowerCase();
    const world  = v("world").toLowerCase();

    if (genre.includes("j-pop") || genre.includes("jpop")) partial.genre = "jpop";
    else if (genre.includes("j-rock"))   partial.genre = "jrock";
    else if (genre.includes("city pop")) partial.genre = "city";
    else if (genre.includes("electronic") || genre.includes("synth")) partial.genre = "electronic";
    else if (genre.includes("hip-hop") || genre.includes("trap")) partial.genre = "hiphop";
    else if (genre.includes("r&b") || genre.includes("soul")) partial.genre = "rnb";
    else if (genre.includes("ambient"))  partial.genre = "ambient";
    else if (genre.includes("acoustic") || genre.includes("folk")) partial.genre = "folk";

    if (!vocal.includes("no vocal") && !vocal.includes("instrumental")) {
      if (vocal.includes("powerful") || vocal.includes("breathy") || vocal.includes("clear") ||
          vocal.includes("warm") || vocal.includes("fragile") || vocal.includes("husky"))
        partial.vocalType = "female";
    }

    if (tempo.includes("slow") || tempo.includes("heavy")) partial.bpm = "72";
    else if (tempo.includes("laid-back") || tempo.includes("unhurried")) partial.bpm = "88";
    else if (tempo.includes("steady") || tempo.includes("forward")) partial.bpm = "108";
    else if (tempo.includes("upbeat") || tempo.includes("bouncy")) partial.bpm = "124";
    else if (tempo.includes("fast") || tempo.includes("intense")) partial.bpm = "145";

    if (world.includes("cyberpunk") || world.includes("neon"))         preset = "neon";
    else if (world.includes("corporate") || world.includes("surveillance")) preset = "corporate";
    else if (world.includes("mythic") || world.includes("ancient"))    preset = "mythic";
    else if (world.includes("gospel") || world.includes("glitch"))     preset = "gospel-irony";
    else if (world.includes("baroque") || world.includes("waltz"))     preset = "electro-waltz";
    else if (world.includes("bedroom") || world.includes("3am"))       preset = "digital-motown";
  }

  return { partial, preset };
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls = [
  "w-full border border-[#E2E8F0] rounded-md px-2.5",
  "text-[13px] font-mono text-zinc-800 placeholder-zinc-400",
  "focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors h-8",
].join(" ");

const selectCls = [
  "w-full border border-[#E2E8F0] rounded-md px-2 h-8 bg-white",
  "text-[13px] font-mono text-zinc-800",
  "focus:outline-none focus:border-blue-400 transition-colors",
].join(" ");

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-h-[32px]">
      <span className="text-[12px] font-mono text-zinc-500 w-[4.5rem] shrink-0 tracking-wide">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Inp({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls} style={{ background: "#fafbfc" }}
    />
  );
}

function Sel<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void;
  options: readonly (readonly [T, string])[] | string[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={selectCls}>
      {(options as (readonly [string, string] | string)[]).map((opt) => {
        const [val, label] = Array.isArray(opt) ? opt : [opt, opt];
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[28px]">
      <div
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors shrink-0 relative ${checked ? "bg-blue-500" : "bg-zinc-300"}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </div>
      <span className="text-[13px] font-mono text-zinc-600">{label}</span>
    </label>
  );
}

function CollapseSection({
  label,
  icon,
  sub,
  open,
  onToggle,
  children,
  dim,
}: {
  label: React.ReactNode;
  icon?: string;
  sub?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="sidebar-card">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-[#EEF3F8] transition-colors"
      >
        <div className="flex-1 min-w-0 flex items-start gap-2">
          {icon && (
            <span className={`mt-[1px] shrink-0 ${dim ? "opacity-40" : "opacity-70"}`}>
              <HeaderIcon name={icon} />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <span
              className={`text-[14px] ui-sans tracking-[0.01em] uppercase font-bold leading-tight ${dim ? "text-zinc-400" : "text-[#0F172A]"}`}
              style={dim ? {} : { textShadow: "0 0 0.4px #0F172A" }}
            >
              {open ? "▾" : "▸"} {label}
            </span>
            {!open && sub && (
              <p className="text-[12px] font-mono text-zinc-600 mt-0.5 font-normal normal-case tracking-normal leading-tight">{sub}</p>
            )}
          </div>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-2.5 border-t border-[#E2E8F0]">
          <div className="pt-2">{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── Genre options ────────────────────────────────────────────────────────────

const GENRE_OPTIONS: Array<[string, string]> = [
  ["jpop",       "J-Pop"],
  ["jrock",      "J-Rock"],
  ["city",       "City Pop"],
  ["electronic", "Electronic"],
  ["hiphop",     "Hip-Hop"],
  ["rnb",        "R&B"],
  ["jazz",       "Jazz"],
  ["ambient",    "Ambient"],
  ["folk",       "Folk"],
  ["metal",      "Rock/Metal"],
  ["anime",      "Anime"],
  ["cinematic",  "Cinematic"],
  ["funk",       "Funk/Soul"],
  ["kpop",       "K-Pop"],
  // Micro genres — Phase 2 (batch 1)
  ["electro-funk",           "Electro Funk"],
  ["corporate-electro-funk", "Corp.E.Funk"],
  ["digital-motown",         "Dig. Motown"],
  ["nu-disco-soul",          "Nu Disco Soul"],
];

// ─── Nudge chips ──────────────────────────────────────────────────────────────

const SUB_STYLE_OPTIONS = [
  "bedroom", "acoustic", "lo-fi", "analog", "retro",
  "minimal", "lush", "cinematic", "distorted", "danceable",
] as const;

const SUB_STYLE_LABELS: Record<string, string> = {
  bedroom:    "bedroom",
  acoustic:   "acoustic",
  "lo-fi":    "lo-fi",
  analog:     "analog",
  retro:      "retro",
  minimal:    "minimal",
  lush:       "lush",
  cinematic:  "cinematic",
  distorted:  "distorted",
  danceable:  "danceable",
};

const NUDGE_OPTIONS = [
  // Vibe direction
  "more aggressive", "more intimate", "more epic", "darker", "brighter",
  // Tempo / energy
  "slower", "faster",
  // Texture (lo-fi / analog / minimal は Sub Style で指定)
  "drier mix", "more reverb", "noisier",
  // Cinematic
  "less cinematic",
  // Vocal
  "male vocal", "female vocal",
] as const;

const NUDGE_LABELS: Record<string, string> = {
  "more aggressive":  "もっと攻撃的に",
  "more intimate":    "もっと親密に",
  "more epic":        "もっと壮大に",
  "darker":           "暗めに",
  "brighter":         "明るめに",
  "slower":           "遅めに",
  "faster":           "速めに",
  "drier mix":        "ドライなミックス",
  "more reverb":      "リバーブ多め",
  "noisier":          "ノイズ感を足す",
  "less cinematic":   "映画っぽさを抑える",
  "male vocal":       "男性ボーカル",
  "female vocal":     "女性ボーカル",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYS = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
  "Cm","C#m","Dm","D#m","Em","Fm","F#m","Gm","G#m","Am","A#m","Bm",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Sidebar({
  input,
  onInputChange,
  preset,
  onPresetChange,
  onGenerate,
  isGenerating = false,
  onWizardApply,
  onApplyExpansion,
  expansion,
  onExpansionChange,
  libraryIds,
  onLibraryIdsChange,
  recommendations = [],
  onOpenLibrary,
  structureMode,
  onStructureModeChange,
  structurePreset,
  onStructurePresetChange,
  builderSections,
  onBuilderSectionsChange,
  builderIsEmpty = false,
  mounted = false,
  stylePromptOverride = "",
  onClearStylePromptOverride,
  onClearSession,
  projectName = "",
  onProjectNameChange,
  onSaveProject,
  projectSaveFlash = false,
  isProjectDirty = false,
  onSaveAsProject,
  onOpenProjectList,
  onNewProject,
}: Props) {
  const [alchemyOpen,        setAlchemyOpen]        = useState(false);
  const [genreLockOpen,      setGenreLockOpen]      = useState(false);
  const [fineTuneOpen,       setFineTuneOpen]       = useState(false);
  const [structureOpen,  setStructureOpen]  = useState(false);
  const [libraryOpen,    setLibraryOpen]    = useState(false);
  const [avoidOpen,      setAvoidOpen]      = useState(false);
  const [guidedOpen,     setGuidedOpen]     = useState(false);

  // Wizard state
  const [wizardMode, setWizardMode]         = useState<WizardMode>("quick");
  const [wizardStep, setWizardStep]         = useState(0);
  const [wizardAnswers, setWizardAnswers]   = useState<WizardAnswers>({});
  const [appliedFlash, setAppliedFlash]     = useState(false);

  // ─── Compact library summary ─────────────────────────────────────────────────

  const selectedLibraryItems = libraryIds
    .map((id) => getPromptItemById(id))
    .filter((x): x is PromptLibraryItem => x !== undefined);

  const set = <K extends keyof SongInput>(key: K, val: SongInput[K]) =>
    onInputChange({ ...input, [key]: val });

  // ─── Nudge toggle ────────────────────────────────────────────────────────────

  const toggleNudge = (n: string) => {
    const current = input.nudges ?? [];
    const next = current.includes(n)
      ? current.filter((x) => x !== n)
      : [...current, n];
    set("nudges", next);
  };

  // ─── SubStyle toggle ─────────────────────────────────────────────────────────

  const toggleSubStyle = (s: string) => {
    const current = input.subStyles ?? [];
    const next = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    set("subStyles", next);
  };

  const activeSubStyles = input.subStyles ?? [];

  // ─── Wizard helpers ─────────────────────────────────────────────────────────
  // Legacy: Guided Mode は Main UI から非表示。将来の 12-Step Prompt Builder に置き換え予定。
  const SHOW_GUIDED_MODE = false;

  const questions = wizardMode === "quick" ? QUICK_QUESTIONS : DEEP_QUESTIONS;
  const currentQ  = questions[wizardStep];
  const isLast    = wizardStep === questions.length - 1;

  const handleWizardMode = (m: WizardMode) => {
    setWizardMode(m); setWizardStep(0); setWizardAnswers({});
  };

  const handleChip = (id: string, value: string) =>
    setWizardAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], chip: prev[id]?.chip === value ? undefined : value },
    }));

  const handleFree = (id: string, value: string) =>
    setWizardAnswers((prev) => ({ ...prev, [id]: { ...prev[id], free: value } }));

  const handleWizardNext = () => {
    if (!isLast) { setWizardStep((s) => s + 1); return; }
    const result = buildWizardPrompt(wizardMode as "quick" | "deep", wizardAnswers);
    onWizardApply(result.prompt, result.negative);
    const { partial, preset: mappedPreset } = mapWizardToInput(wizardAnswers, wizardMode as "quick" | "deep");
    onInputChange({ ...input, ...partial });
    if (mappedPreset) onPresetChange(mappedPreset);
    setAppliedFlash(true);
    setTimeout(() => setAppliedFlash(false), 2500);
    setWizardStep(0);
    setWizardAnswers({});
  };

  const accentActive = wizardMode === "quick"
    ? "border-blue-400 text-blue-700 bg-blue-50"
    : "border-violet-400 text-violet-700 bg-violet-50";
  const accentBtn = wizardMode === "quick"
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-violet-600 hover:bg-violet-700 text-white";

  const activeNudges = input.nudges ?? [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── COMPOSE CONTROL 固定ヘッダー ──────────────────────────────────── */}
      <div className="shrink-0 h-11 border-b border-[#E2E8F0] flex items-center px-4 gap-2.5 select-none" style={{ background: "var(--bg-panel-hdr)" }}>
        <HeaderIcon name="sliders" className="opacity-80" />
        <span className="text-[16px] ui-sans font-bold text-[#0F172A] tracking-[0.01em] uppercase" style={{ textShadow: "0 0 0.4px #0F172A" }}>COMPOSE CONTROL</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-3 space-y-2">

        {/* ══ PROJECT ════════════════════════════════════════════════════════ */}
        <div className="sidebar-card">
          <div className="px-3 py-2 border-b border-[#E2E8F0]">
            <p className="text-[11px] font-mono font-bold text-zinc-700 tracking-[0.12em] uppercase">PROJECT</p>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange?.(e.target.value)}
              placeholder="Untitled Project"
              className={inputCls}
              style={{ background: "#fafbfc" }}
            />
            <div className="flex gap-1.5">
              <button
                onClick={onSaveProject}
                className={`flex-1 h-8 text-[12px] font-mono font-bold rounded border transition-all ${
                  projectSaveFlash
                    ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                    : isProjectDirty
                    ? "border-amber-400 text-amber-700 bg-amber-50 hover:border-amber-500 hover:bg-amber-100"
                    : "border-[var(--border-muted)] text-zinc-700 hover:border-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {projectSaveFlash ? "✓ Saved" : isProjectDirty ? "SAVE CURRENT ●" : "SAVE CURRENT"}
              </button>
              <button
                onClick={onSaveAsProject}
                className="flex-1 h-8 text-[12px] font-mono font-bold rounded border border-[var(--border-muted)] text-zinc-700 hover:border-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
              >
                SAVE AS NEW
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={onOpenProjectList}
                className="flex-1 h-8 text-[12px] font-mono rounded border border-[var(--border-muted)] text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
              >
                LOAD
              </button>
              <button
                onClick={onNewProject}
                className="flex-1 h-8 text-[12px] font-mono rounded border border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all"
              >
                NEW
              </button>
            </div>
            <p className="text-[12px] font-mono text-zinc-600">
              SAVE CURRENT overwrites · SAVE AS NEW creates a copy
            </p>
          </div>
        </div>

        {/* ══ 0. SOURCE ALCHEMY ════════════════════════════════════════════════ */}
        <div className="sidebar-card">
          <button
            onClick={() => setAlchemyOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[14px] ui-sans tracking-[0.01em] uppercase font-bold text-violet-600 flex items-center gap-2" style={{ textShadow: "0 0 0.4px currentColor" }}>
                <HeaderIcon name="sparkles" className="opacity-80" />
                {alchemyOpen ? "▾" : "▸"} Source Alchemy
              </span>
              {!alchemyOpen && (
                <p className="text-[12px] font-mono text-zinc-500 mt-0.5 font-normal normal-case tracking-normal leading-tight pl-1">
                  現実素材を世界観に変換
                </p>
              )}
            </div>
          </button>
          {alchemyOpen && (
            <div className="px-3 pb-2.5 border-t border-[#E2E8F0] pt-2.5">
              <SourceAlchemy onSetWorldSeed={(seed) => set("theme", seed)} />
            </div>
          )}
        </div>

        {/* ══ 1. WORLD SEED + FORGE ═════════════════════════════════════════════ */}
        <div className="sidebar-card">
          <div className="px-3 py-2 border-b border-[#E2E8F0]">
            <p className="text-[11px] font-mono font-bold text-zinc-700 tracking-[0.12em] uppercase">1. WORLD SEED</p>
            <p className="text-[12px] font-mono text-zinc-500 mt-0.5">作りたい世界観の種を書く</p>
          </div>
          <div className="p-2.5">
            <WorldForge
              worldSeed={input.theme}
              onWorldSeedChange={(v) => set("theme", v)}
              onApplyToPrompt={onApplyExpansion}
              expansion={expansion}
              onExpansionChange={onExpansionChange}
            />
          </div>
        </div>

        {/* ══ 2. GENRE / STYLE ══════════════════════════════════════════════════ */}
        <CollapseSection
          label={
            input.genreLock
              ? `2. GENRE / STYLE · ${GENRE_OPTIONS.find(([v]) => v === input.genreLock)?.[1] ?? input.genreLock}${activeSubStyles.length > 0 ? ` +${activeSubStyles.length}` : ""}`
              : activeSubStyles.length > 0
              ? `2. GENRE / STYLE · +${activeSubStyles.length} style`
              : "2. GENRE / STYLE"
          }
          icon="music"
          sub="ジャンル固定・AI推測を上書き"
          open={genreLockOpen}
          onToggle={() => setGenreLockOpen((v) => !v)}
        >
          <div className="space-y-2">
            {/* PRIMARY GENRE chips */}
            <div>
              <span className="text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase font-bold block mb-1.5">
                PRIMARY GENRE
              </span>
              <div className="flex flex-wrap gap-1">
                {GENRE_OPTIONS.map(([val, label]) => {
                  const active = (input.genreLock ?? "") === val;
                  return (
                    <button
                      key={val}
                      onClick={() => set("genreLock", active ? "" : val)}
                      className={`px-2 py-[3px] text-[11px] font-mono rounded border transition-all ${
                        active
                          ? "border-blue-400 text-blue-700 bg-blue-50 font-semibold"
                          : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                      }`}
                    >
                      {active ? "· " : ""}{label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status line */}
            {input.genreLock ? (
              <div className="flex items-center justify-between pt-0.5">
                <p className="text-[11px] font-mono text-blue-600 leading-snug">
                  ↳ [GENRE LOCK: {GENRE_OPTIONS.find(([v]) => v === input.genreLock)?.[1] ?? input.genreLock}] を先頭に固定
                </p>
                <button
                  onClick={() => set("genreLock", "")}
                  className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 ml-2 shrink-0 transition-colors"
                >
                  ✕ クリア
                </button>
              </div>
            ) : (
              <p className="text-[11px] font-mono text-zinc-600 leading-snug pt-0.5">
                未選択 — AIがSeedからジャンルを推測
              </p>
            )}

            {/* SUB STYLE chips */}
            <div className="border-t border-[#E2E8F0] pt-2 mt-0.5">
              <div className="mb-1.5">
                <span className="text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase font-bold block">
                  SUB STYLE
                </span>
                <span className="text-[11px] font-mono text-zinc-500 leading-snug">
                  質感・サブスタイルを複数選択（Style Promptの先頭付近に挿入）
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {SUB_STYLE_OPTIONS.map((s) => {
                  const active = activeSubStyles.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSubStyle(s)}
                      className={`px-2 py-[3px] text-[11px] font-mono rounded border transition-all ${
                        active
                          ? "border-violet-400 text-violet-700 bg-violet-50 font-semibold"
                          : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                      }`}
                    >
                      {active ? "· " : ""}{SUB_STYLE_LABELS[s] ?? s}
                    </button>
                  );
                })}
              </div>
              {activeSubStyles.length > 0 && (
                <button
                  onClick={() => set("subStyles", [])}
                  className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors mt-1"
                >
                  ✕ クリア
                </button>
              )}
            </div>
          </div>
        </CollapseSection>

        {/* ══ 3. FINE TUNE (collapsible) ════════════════════════════════════════ */}
        <CollapseSection
          label="3. FINE TUNE"
          icon="sliders-horizontal"
          sub="方向性・BPM・言語比率などの詳細設定"
          open={fineTuneOpen}
          onToggle={() => setFineTuneOpen((v) => !v)}
        >
          {/* Direction adjust chips */}
          <div className="space-y-1">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase font-bold block">
                Direction Adjust
              </span>
              <span className="text-[11px] font-mono text-zinc-500 leading-snug">
                音像タグではなく、曲の方向性・強度を微調整する
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {NUDGE_OPTIONS.map((n) => {
                const active = activeNudges.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => toggleNudge(n)}
                    className={`px-2 py-[3px] text-[11px] font-mono rounded border transition-all ${
                      active
                        ? "border-blue-400 text-blue-700 bg-blue-50 font-semibold"
                        : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    {active ? "· " : ""}{NUDGE_LABELS[n] ?? n}
                  </button>
                );
              })}
            </div>
            {activeNudges.length > 0 && (
              <button
                onClick={() => set("nudges", [])}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                ✕ クリア
              </button>
            )}
          </div>

          {/* Output settings */}
          <div className="space-y-1.5 border-t border-[#E2E8F0] pt-2 mt-1">
            <Row label="TITLE">
              <Inp value={input.title} onChange={(v) => set("title", v)} placeholder="曲タイトル" />
            </Row>
            <Row label="LENGTH">
              <div className="flex gap-1">
                {(["30s", "90s", "full"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => set("songLength", v)}
                    className={`flex-1 h-8 text-[12px] font-mono rounded border transition-colors ${
                      input.songLength === v
                        ? "border-blue-400 text-blue-700 bg-blue-50"
                        : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="LANG">
              <div className="flex gap-1">
                {(["low", "mixed", "high"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => set("englishRatio", v)}
                    className={`flex-1 h-8 text-[12px] font-mono rounded border transition-colors ${
                      input.englishRatio === v
                        ? "border-blue-400 text-blue-700 bg-blue-50"
                        : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    {v === "low" ? "JP" : v === "mixed" ? "MIX" : "EN"}
                  </button>
                ))}
              </div>
            </Row>
            <div className="flex gap-2">
              <Row label="BPM">
                <Inp value={input.bpm} onChange={(v) => set("bpm", v)} placeholder="auto" />
              </Row>
              <Row label="KEY">
                <Sel
                  value={input.key}
                  onChange={(v) => set("key", v)}
                  options={[["", "auto"], ...KEYS.map((k) => [k, k] as const)] as readonly (readonly [string, string])[]}
                />
              </Row>
            </div>
            <Row label="REF">
              <Inp
                value={input.referenceVibe}
                onChange={(v) => set("referenceVibe", v)}
                placeholder="宇多田ヒカル、Portishead"
              />
            </Row>
            <div className="pl-0.5 pt-1 pb-1">
              <Toggle
                checked={input.startWithChorus}
                onChange={(v) => set("startWithChorus", v)}
                label="サビ始まり"
              />
            </div>
          </div>

          {/* World Presets (secondary) */}
          <div className="border-t border-[#E2E8F0] pt-2 mt-1 space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase font-bold">
              World Lens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(WORLD_PRESETS) as WorldPresetKey[]).map((key) => {
                const p = WORLD_PRESETS[key];
                const active = preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => onPresetChange(active ? "" : key)}
                    title={p.description}
                    className={`px-2 py-0.5 text-[12px] font-mono font-bold rounded border transition-all ${
                      active ? "" : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                    }`}
                    style={active ? {
                      borderColor: p.accentColor,
                      color: p.accentColor,
                      background: p.accentColor + "18",
                    } : {}}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {preset && (
              <p className="text-[11px] font-mono text-zinc-600 leading-snug">
                ▸ {WORLD_PRESETS[preset as WorldPresetKey].description}
              </p>
            )}
          </div>
        </CollapseSection>

        {/* ══ 4. STRUCTURE BLUEPRINT ══════════════════════════════════════════ */}
        <CollapseSection
          label={
            !mounted
              ? "4. STRUCTURE"
              : structureMode === "builder" && builderSections.length > 0
                ? `4. STRUCTURE · ${builderSections.length}P`
                : structureMode === "preset"
                  ? "4. STRUCTURE · preset"
                  : "4. STRUCTURE"
          }
          icon="list-tree"
          sub="曲の流れ・セクション構成を指定"
          open={structureOpen}
          onToggle={() => setStructureOpen((v) => !v)}
        >
          <StructureBlueprint
            mode={structureMode}
            onModeChange={onStructureModeChange}
            preset={structurePreset}
            onPresetChange={onStructurePresetChange}
            builderSections={builderSections}
            onBuilderSectionsChange={onBuilderSectionsChange}
          />
        </CollapseSection>

        {/* ══ 5. PROMPT LIBRARY (compact summary) ════════════════════════════ */}
        <CollapseSection
          label={
            !mounted
              ? "5. PROMPT LIBRARY"
              : selectedLibraryItems.length > 0
                ? `5. PROMPT LIBRARY · ${selectedLibraryItems.length}`
                : recommendations.length > 0
                  ? `5. PROMPT LIBRARY · ◆${recommendations.length}`
                  : "5. PROMPT LIBRARY"
          }
          icon="library"
          sub="音色・質感・構成語彙を追加"
          open={libraryOpen}
          onToggle={() => setLibraryOpen((v) => !v)}
        >
          <div className="pb-2 pt-0.5 space-y-1.5">

            {/* Recommendation hint */}
            {recommendations.length > 0 && selectedLibraryItems.length === 0 && (
              <p className="text-[11px] font-mono leading-snug" style={{ color: "var(--accent-warning)" }}>
                ◆ {recommendations.length}件のおすすめ候補あり
              </p>
            )}

            {/* Selected item chips (up to 6, then +N more) */}
            {selectedLibraryItems.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedLibraryItems.slice(0, 6).map((item) => (
                  <span
                    key={item.id}
                    className="px-1.5 py-[2px] text-[12px] font-mono rounded border border-[var(--border-muted)] text-zinc-600 bg-slate-50 leading-tight"
                  >
                    {item.label}
                  </span>
                ))}
                {selectedLibraryItems.length > 6 && (
                  <span className="text-[11px] font-mono text-zinc-400 self-center">
                    +{selectedLibraryItems.length - 6}
                  </span>
                )}
              </div>
            )}

            {/* Empty state */}
            {selectedLibraryItems.length === 0 && recommendations.length === 0 && (
              <p className="text-[11px] font-mono text-zinc-600 leading-snug">
                タグなし — Forgeでおすすめを取得
              </p>
            )}

            {/* Open library button */}
            <button
              onClick={onOpenLibrary}
              className="w-full h-8 text-[12px] font-mono border border-[var(--border-muted)] rounded-md text-zinc-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
            >
              OPEN LIBRARY →
            </button>
          </div>
        </CollapseSection>

        {/* ══ 6. AVOID / NEGATIVE ══════════════════════════════════════════════ */}
        <CollapseSection
          label="6. AVOID / NEGATIVE"
          sub="避けたい音・表現・AI臭さの指定"
          open={avoidOpen}
          onToggle={() => setAvoidOpen((v) => !v)}
        >
          <p className="text-[12px] font-mono text-zinc-700 pb-2 leading-snug">
            避けたい表現・音像
          </p>
          <div className="space-y-1.5">
            <Row label="AVOID">
              <Inp
                value={input.avoidExpressions}
                onChange={(v) => set("avoidExpressions", v)}
                placeholder="過度なピッチ補正、安いリバーブ"
              />
            </Row>
            <div className="pl-0.5 pb-1">
              <Toggle
                checked={input.avoidAiCliche}
                onChange={(v) => set("avoidAiCliche", v)}
                label="AI臭さ回避"
              />
            </div>
          </div>
        </CollapseSection>

        {/* ══ 6. GUIDED MODE (legacy, hidden — replaced by 12-Step Prompt Builder) ══ */}
        {SHOW_GUIDED_MODE && (
        <CollapseSection
          label="Guided Mode"
          sub="Seedが書きにくい場合に。質問に答えて組み立てる"
          open={guidedOpen}
          onToggle={() => setGuidedOpen((v) => !v)}
          dim
        >
          <p className="text-[12px] font-mono text-zinc-500 pb-2 leading-snug">
            World Seed で語りにくい場合に。質問に答えてWorld Seedを組み立てます。
          </p>

          {/* Mode selector */}
          <div className="flex gap-1 pb-1">
            {(["quick", "deep"] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleWizardMode(m)}
                className={`flex-1 h-8 text-[12px] font-mono rounded border transition-all ${
                  wizardMode === m
                    ? m === "quick"
                      ? "border-blue-400 text-blue-700 bg-blue-50"
                      : "border-violet-400 text-violet-700 bg-violet-50"
                    : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                }`}
              >
                {m === "quick" ? "QUICK  5問" : "DEEP  12問"}
              </button>
            ))}
          </div>

          {/* Inline wizard questions */}
          {currentQ && !appliedFlash && (
            <div
              className="border border-[#E2E8F0] rounded-lg p-3 space-y-2.5"
              style={{ background: "#fafbfc" }}
            >
              {/* Progress */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      wizardMode === "quick" ? "bg-blue-400" : "bg-violet-400"
                    }`}
                    style={{ width: `${((wizardStep + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 shrink-0 tabular-nums">
                  {wizardStep + 1} / {questions.length}
                </span>
              </div>

              {/* Question */}
              <div>
                <p className="text-[13px] font-mono text-zinc-800 font-semibold leading-snug">
                  {currentQ.question}
                </p>
                {currentQ.hint && (
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5 leading-snug">
                    {currentQ.hint}
                  </p>
                )}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-1">
                {currentQ.options.map((opt) => {
                  const sel = wizardAnswers[currentQ.id]?.chip === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleChip(currentQ.id, opt.value)}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-all ${
                        sel ? accentActive : "border-[var(--border-muted)] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Free text */}
              <input
                type="text"
                value={wizardAnswers[currentQ.id]?.free ?? ""}
                onChange={(e) => handleFree(currentQ.id, e.target.value)}
                placeholder={currentQ.placeholder ?? "自由入力..."}
                className="w-full h-8 border border-[#E2E8F0] rounded-md px-2.5 text-[12px] font-mono text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors"
                style={{ background: "white" }}
              />

              {/* Navigation */}
              <div className="flex gap-1.5">
                {wizardStep > 0 && (
                  <button
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="h-8 px-3 text-[12px] font-mono border border-[#E2E8F0] text-zinc-600 rounded-md hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    ←
                  </button>
                )}
                <button
                  onClick={handleWizardNext}
                  className={`flex-1 h-8 text-[12px] font-mono font-bold rounded transition-colors ${accentBtn}`}
                >
                  {isLast ? "APPLY ✓" : "NEXT →"}
                </button>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 text-center">スキップ可</p>
            </div>
          )}

          {appliedFlash && (
            <div className="border border-emerald-300 rounded-lg p-2.5 text-[12px] font-mono text-emerald-700 bg-emerald-50 text-center font-semibold">
              ✓ Applied to Style Prompt &amp; Concept
            </div>
          )}
        </CollapseSection>
        )}

      </div>

      {/* ══ GENERATE (sticky footer) ══════════════════════════════════════════ */}
      <div className="shrink-0 px-3 pb-3 pt-3.5 border-t border-[#E2E8F0]">
        {/* Active nudges hint */}
        {activeNudges.length > 0 && (
          <p className="text-[11px] font-mono text-blue-500 mb-1.5 leading-snug truncate">
            ↳ {activeNudges.map((n) => NUDGE_LABELS[n] ?? n).join(" · ")}
          </p>
        )}
        {expansion && !isGenerating && (
          <p className="text-[11px] font-mono text-emerald-600 mb-1.5 leading-snug">
            ↳ World Forge active
          </p>
        )}
        {stylePromptOverride.trim().length > 0 && (
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-mono text-blue-600 leading-snug">
              ↳ 12-Step Prompt Builder active
            </p>
            <button
              onClick={onClearStylePromptOverride}
              className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 ml-2 shrink-0 transition-colors"
            >
              ✕ クリア
            </button>
          </div>
        )}
        {builderIsEmpty && (
          <p className="text-[11px] font-mono mb-1.5 leading-snug font-semibold" style={{ color: "var(--accent-warning-strong)" }}>
            ⚠ Builderに最低1つのセクションを選択してください
          </p>
        )}
        <button
          onClick={onGenerate}
          disabled={isGenerating || builderIsEmpty}
          className={`w-full py-3 ui-sans font-extrabold text-[15px] rounded-[10px] transition-colors disabled:cursor-not-allowed shadow-sm ${
            isGenerating
              ? "bg-blue-300 text-white animate-pulse"
              : builderIsEmpty
                ? "bg-slate-200 text-slate-400"
                : "bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white"
          }`}
        >
          {isGenerating ? "… GENERATING" : expansion ? "↺ RE-GENERATE" : "▶  GENERATE"}
        </button>
        <p className="text-[11px] font-mono text-zinc-500 text-center mt-2 leading-snug">
          {isGenerating
            ? "生成中…しばらくお待ちください"
            : expansion
            ? "同じ設定でStyle + Lyricsを再生成"
            : "現在の設定でStyle + Lyricsを生成"}
        </p>
        <button
          onClick={() => {
            if (window.confirm("Clear current generated session?")) {
              onClearSession?.();
            }
          }}
          className="w-full mt-2 py-1.5 text-[11px] font-mono font-semibold rounded-lg border border-[var(--border-muted)] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors tracking-[0.08em]"
        >
          CLEAR SESSION
        </button>
      </div>
    </div>
  );
}
