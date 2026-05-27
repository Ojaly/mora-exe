"use client";

import { useState } from "react";
import { SongInput, WorldPresetKey, WorldExpansion, StructureMode, StructurePreset } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { QUICK_QUESTIONS, DEEP_QUESTIONS } from "@/lib/wizardData";
import { buildWizardPrompt, WizardAnswers } from "@/lib/wizardBuilder";
import WorldForge from "@/components/WorldForge";
import SourceAlchemy from "@/components/SourceAlchemy";
import StructureBlueprint from "@/components/StructureBlueprint";
import { getPromptItemById, PromptLibraryItem } from "@/lib/promptLibrary";

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
  customBlueprint: string;
  onCustomBlueprintChange: (v: string) => void;
  /**
   * True only after the client has mounted and localStorage has been restored.
   * Dynamic labels that depend on localStorage values must be gated behind this
   * to prevent SSR/client hydration mismatches.
   */
  mounted?: boolean;
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
  "w-full border border-[#d0d7de] rounded px-2.5",
  "text-[13px] font-mono text-zinc-800 placeholder-zinc-400",
  "focus:outline-none focus:border-blue-400 transition-colors h-8",
].join(" ");

const selectCls = [
  "w-full border border-[#d0d7de] rounded px-2 h-8 bg-white",
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
  open,
  onToggle,
  children,
  dim,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="border-t border-[#d0d7de]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 pt-2.5 pb-1.5 px-0 text-left hover:text-zinc-700 transition-colors"
      >
        <span className={`text-[10px] font-mono tracking-[0.18em] uppercase font-semibold shrink-0 ${dim ? "text-zinc-400" : "text-zinc-500"}`}>
          {open ? "▾" : "▸"} {label}
        </span>
        <div className="flex-1 border-t border-[#d0d7de]" />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

// ─── Nudge chips ──────────────────────────────────────────────────────────────

const NUDGE_OPTIONS = [
  // Vibe direction
  "more aggressive", "more intimate", "more epic", "darker", "brighter",
  // Tempo / energy
  "slower", "faster",
  // Texture
  "more analog", "drier mix", "more reverb", "noisier", "lo-fi",
  // Cinematic
  "less cinematic", "minimal production",
  // Vocal
  "male vocal", "female vocal",
] as const;

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
  customBlueprint,
  onCustomBlueprintChange,
  mounted = false,
}: Props) {
  const [alchemyOpen,    setAlchemyOpen]    = useState(false);
  const [fineTuneOpen,   setFineTuneOpen]   = useState(false);
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

  // ─── Wizard helpers ─────────────────────────────────────────────────────────

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
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-0.5">

        {/* ══ 0. SOURCE ALCHEMY ════════════════════════════════════════════════ */}
        <div className="pt-2.5">
          <button
            onClick={() => setAlchemyOpen((v) => !v)}
            className="w-full flex items-center gap-2 pb-1 text-left group"
          >
            <span className="text-[10px] font-mono tracking-[0.18em] uppercase font-semibold shrink-0 text-violet-500 group-hover:text-violet-700 transition-colors">
              {alchemyOpen ? "▾" : "▸"} ⚗ Source Alchemy
            </span>
            <div className="flex-1 border-t border-violet-200" />
          </button>
          {!alchemyOpen && (
            <p className="text-[10px] font-mono text-zinc-400 pb-1.5 leading-none">
              現実素材を世界観に変換
            </p>
          )}
          {alchemyOpen && (
            <div className="pb-3 pt-1">
              <SourceAlchemy onSetWorldSeed={(seed) => set("theme", seed)} />
            </div>
          )}
        </div>

        {/* Divider before World Forge */}
        <div className="border-t border-[#d0d7de]" />

        {/* ══ 1. WORLD FORGE (primary) ══════════════════════════════════════════ */}
        <div className="pt-3">
          <WorldForge
            worldSeed={input.theme}
            onWorldSeedChange={(v) => set("theme", v)}
            onApplyToPrompt={onApplyExpansion}
            expansion={expansion}
            onExpansionChange={onExpansionChange}
          />
        </div>

        {/* ══ 2. FINE TUNE (collapsible) ════════════════════════════════════════ */}
        <CollapseSection
          label="Fine Tune"
          open={fineTuneOpen}
          onToggle={() => setFineTuneOpen((v) => !v)}
        >
          {/* Direction adjust chips */}
          <div className="space-y-1.5 py-1">
            <span className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase font-semibold">
              Direction Adjust
            </span>
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
                        : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    {active ? "· " : ""}{n}
                  </button>
                );
              })}
            </div>
            {activeNudges.length > 0 && (
              <button
                onClick={() => set("nudges", [])}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                ✕ clear all
              </button>
            )}
          </div>

          {/* Output settings */}
          <div className="space-y-1.5 border-t border-[#d0d7de] pt-2 mt-1">
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
                        : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
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
                        : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
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
          <div className="border-t border-[#d0d7de] pt-2 mt-1 space-y-1.5">
            <span className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase font-semibold">
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
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border transition-all ${
                      active ? "" : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
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
              <p className="text-[11px] font-mono text-zinc-500 leading-snug">
                ▸ {WORLD_PRESETS[preset as WorldPresetKey].description}
              </p>
            )}
          </div>
        </CollapseSection>

        {/* ══ 3. STRUCTURE BLUEPRINT ══════════════════════════════════════════ */}
        <CollapseSection
          label={
            !mounted
              ? "Structure"
              : structureMode === "preset"
                ? "Structure · preset"
                : structureMode === "custom" && customBlueprint.trim()
                  ? "Structure · custom ✎"
                  : "Structure"
          }
          open={structureOpen}
          onToggle={() => setStructureOpen((v) => !v)}
        >
          <StructureBlueprint
            mode={structureMode}
            onModeChange={onStructureModeChange}
            preset={structurePreset}
            onPresetChange={onStructurePresetChange}
            customBlueprint={customBlueprint}
            onCustomBlueprintChange={onCustomBlueprintChange}
          />
        </CollapseSection>

        {/* ══ 4. PROMPT LIBRARY (compact summary) ════════════════════════════ */}
        <CollapseSection
          label={
            !mounted
              ? "Prompt Library"
              : selectedLibraryItems.length > 0
                ? `Prompt Library · ${selectedLibraryItems.length}`
                : recommendations.length > 0
                  ? `Prompt Library · ◆${recommendations.length}`
                  : "Prompt Library"
          }
          open={libraryOpen}
          onToggle={() => setLibraryOpen((v) => !v)}
        >
          <div className="pb-2 pt-0.5 space-y-1.5">

            {/* Recommendation hint */}
            {recommendations.length > 0 && selectedLibraryItems.length === 0 && (
              <p className="text-[10px] font-mono text-amber-600 leading-snug">
                ◆ {recommendations.length}件のおすすめ候補あり
              </p>
            )}

            {/* Selected item chips (up to 6, then +N more) */}
            {selectedLibraryItems.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedLibraryItems.slice(0, 6).map((item) => (
                  <span
                    key={item.id}
                    className="px-1.5 py-[2px] text-[11px] font-mono rounded border border-[#d0d7de] text-zinc-600 bg-zinc-50 leading-tight"
                  >
                    {item.label}
                  </span>
                ))}
                {selectedLibraryItems.length > 6 && (
                  <span className="text-[10px] font-mono text-zinc-400 self-center">
                    +{selectedLibraryItems.length - 6}
                  </span>
                )}
              </div>
            )}

            {/* Empty state */}
            {selectedLibraryItems.length === 0 && recommendations.length === 0 && (
              <p className="text-[10px] font-mono text-zinc-400 leading-snug">
                タグなし — Forgeでおすすめを取得
              </p>
            )}

            {/* Open library button */}
            <button
              onClick={onOpenLibrary}
              className="w-full h-7 text-[11px] font-mono border border-[#c8cdd4] rounded text-zinc-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
            >
              OPEN LIBRARY →
            </button>
          </div>
        </CollapseSection>

        {/* ══ 5. AVOID / NEGATIVE ══════════════════════════════════════════════ */}
        <CollapseSection
          label="Avoid / Negative"
          open={avoidOpen}
          onToggle={() => setAvoidOpen((v) => !v)}
        >
          <p className="text-[10px] font-mono text-zinc-400 pb-1.5 leading-snug">
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

        {/* ══ 6. GUIDED MODE (legacy, deeply collapsed) ════════════════════════ */}
        <CollapseSection
          label="Guided Mode"
          open={guidedOpen}
          onToggle={() => setGuidedOpen((v) => !v)}
          dim
        >
          <p className="text-[10px] font-mono text-zinc-400 pb-2 leading-snug">
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
                    : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                }`}
              >
                {m === "quick" ? "QUICK  5問" : "DEEP  12問"}
              </button>
            ))}
          </div>

          {/* Inline wizard questions */}
          {currentQ && !appliedFlash && (
            <div
              className="border border-[#d0d7de] rounded-lg p-3 space-y-2.5"
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
                        sel ? accentActive : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
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
                className="w-full h-8 border border-[#d0d7de] rounded px-2.5 text-[12px] font-mono text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors"
                style={{ background: "white" }}
              />

              {/* Navigation */}
              <div className="flex gap-1.5">
                {wizardStep > 0 && (
                  <button
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="h-8 px-3 text-[12px] font-mono border border-[#c8cdd4] text-zinc-600 rounded hover:border-zinc-400 hover:text-zinc-900 transition-colors"
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

      </div>

      {/* ══ GENERATE (sticky footer) ══════════════════════════════════════════ */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-[#d0d7de]">
        {/* Active nudges hint */}
        {activeNudges.length > 0 && (
          <p className="text-[10px] font-mono text-blue-500 mb-1.5 leading-snug truncate">
            ↳ {activeNudges.join(" · ")}
          </p>
        )}
        {expansion && (
          <p className="text-[10px] font-mono text-emerald-600 mb-1.5 leading-snug">
            ↳ World Forge active — ▶ GENERATE DRAFT でまとめて生成
          </p>
        )}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-2.5 font-mono font-bold text-[13px] tracking-widest rounded transition-colors disabled:cursor-wait ${
            isGenerating
              ? "bg-blue-200 text-blue-500 animate-pulse"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
          }`}
        >
          {isGenerating ? "… GENERATING" : expansion ? "↺ RE-GENERATE" : "▶  GENERATE"}
        </button>
      </div>
    </div>
  );
}
