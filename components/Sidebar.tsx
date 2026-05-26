"use client";

import { useState } from "react";
import { SongInput, WorldPresetKey } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { QUICK_QUESTIONS, DEEP_QUESTIONS } from "@/lib/wizardData";
import { buildWizardPrompt, WizardAnswers } from "@/lib/wizardBuilder";

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

    // genre
    if (base.includes("electronic") || base.includes("synth")) partial.genre = "electronic";
    else if (base.includes("rock"))       partial.genre = "jrock";
    else if (base.includes("jazz"))       partial.genre = "jazz";
    else if (base.includes("hip-hop") || base.includes("trap")) partial.genre = "hiphop";
    else if (base.includes("ambient"))    partial.genre = "ambient";
    else if (base.includes("acoustic") || base.includes("folk")) partial.genre = "folk";
    else if (base.includes("orchestral") || base.includes("cinematic")) partial.genre = "ambient";

    // vocalType
    if (vocal.includes("female"))      partial.vocalType = "female";
    else if (vocal.includes("male"))   partial.vocalType = "male";
    else if (vocal.includes("choir"))  partial.vocalType = "choir";
    else if (vocal.includes("instrumental")) partial.vocalType = "female";

    // mood
    if (emotion.includes("euphoric") || emotion.includes("uplifting")) partial.mood = "uplifting";
    else if (emotion.includes("melanchol") || emotion.includes("bittersweet")) partial.mood = "melancholic";
    else if (emotion.includes("mysterious") || emotion.includes("ethereal") || emotion.includes("hazy")) partial.mood = "dreamy";
    else if (emotion.includes("unsettling") || emotion.includes("dark") || emotion.includes("tense")) partial.mood = "dark";
    else if (emotion.includes("aggressive")) partial.mood = "aggressive";
    else if (emotion.includes("intoxicating") || emotion.includes("hypnotic")) partial.mood = "dreamy";

    // world → preset
    if (world.includes("cyberpunk") || world.includes("neon"))       preset = "neon";
    else if (world.includes("dystop") || world.includes("surveillance")) preset = "corporate";
    else if (world.includes("mythic") || world.includes("ancient"))  preset = "mythic";
    else if (world.includes("gospel") || world.includes("glitch"))   preset = "gospel-irony";
    else if (world.includes("baroque") || world.includes("waltz"))   preset = "electro-waltz";
  }

  if (mode === "deep") {
    const genre  = v("genre").toLowerCase();
    const vocal  = v("vocal_texture").toLowerCase();
    const tempo  = v("tempo").toLowerCase();
    const world  = v("world").toLowerCase();

    // genre
    if (genre.includes("j-pop") || genre.includes("jpop")) partial.genre = "jpop";
    else if (genre.includes("j-rock"))   partial.genre = "jrock";
    else if (genre.includes("city pop")) partial.genre = "city";
    else if (genre.includes("electronic") || genre.includes("synth")) partial.genre = "electronic";
    else if (genre.includes("hip-hop") || genre.includes("trap")) partial.genre = "hiphop";
    else if (genre.includes("r&b") || genre.includes("soul")) partial.genre = "rnb";
    else if (genre.includes("ambient"))  partial.genre = "ambient";
    else if (genre.includes("acoustic") || genre.includes("folk")) partial.genre = "folk";

    // vocalType
    if (vocal.includes("no vocal") || vocal.includes("instrumental")) { /* keep */ }
    else if (vocal.includes("powerful") || vocal.includes("breathy") || vocal.includes("clear") || vocal.includes("warm") || vocal.includes("fragile") || vocal.includes("husky")) partial.vocalType = "female";

    // bpm from tempo feel
    if (tempo.includes("slow") || tempo.includes("heavy")) partial.bpm = "72";
    else if (tempo.includes("laid-back") || tempo.includes("unhurried")) partial.bpm = "88";
    else if (tempo.includes("steady") || tempo.includes("forward")) partial.bpm = "108";
    else if (tempo.includes("upbeat") || tempo.includes("bouncy")) partial.bpm = "124";
    else if (tempo.includes("fast") || tempo.includes("intense")) partial.bpm = "145";

    // world → preset
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-2.5 pb-0.5">
      <span className="text-[11px] font-mono text-zinc-400 tracking-widest uppercase font-semibold shrink-0">
        {children}
      </span>
      <div className="flex-1 border-t border-[#d0d7de]" />
    </div>
  );
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  ["jpop", "J-Pop"], ["jrock", "J-Rock"], ["city", "City Pop"], ["anime", "Anime"],
  ["vocaloid", "Vocaloid"], ["electronic", "Electronic"], ["rnb", "R&B"],
  ["hiphop", "Hip-Hop"], ["folk", "Folk"], ["metal", "Metal"], ["jazz", "Jazz"], ["ambient", "Ambient"],
] as const;

const MOODS = [
  ["melancholic", "Melancholic"], ["energetic", "Energetic"], ["dreamy", "Dreamy"],
  ["dark", "Dark"], ["uplifting", "Uplifting"], ["nostalgic", "Nostalgic"],
  ["aggressive", "Aggressive"], ["romantic", "Romantic"], ["epic", "Epic"], ["chill", "Chill"],
] as const;

const VOCALS = [
  ["female", "Female"], ["male", "Male"], ["duet", "Duet"],
  ["choir", "Choir"], ["falsetto", "Falsetto"], ["rap", "Rap"], ["vocaloid", "Vocaloid"],
] as const;

const KEYS = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
  "Cm","C#m","Dm","D#m","Em","Fm","F#m","Gm","G#m","Am","A#m","Bm",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Sidebar({
  input, onInputChange, preset, onPresetChange, onGenerate, isGenerating = false, onWizardApply,
}: Props) {
  const [wizardMode, setWizardMode]     = useState<WizardMode>("off");
  const [wizardStep, setWizardStep]     = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers>({});
  const [appliedFlash, setAppliedFlash] = useState(false);

  const set = <K extends keyof SongInput>(key: K, val: SongInput[K]) =>
    onInputChange({ ...input, [key]: val });

  // ─── Wizard helpers ─────────────────────────────────────────────────────────

  const questions = wizardMode === "quick" ? QUICK_QUESTIONS : wizardMode === "deep" ? DEEP_QUESTIONS : [];
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

    // Last step → apply
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-0.5">

        {/* ── 1. Quick Idea ──────────────────────────────────────────────────── */}
        <SectionLabel>Quick Idea</SectionLabel>
        <textarea
          value={input.theme}
          onChange={(e) => set("theme", e.target.value)}
          placeholder="退廃的なFuture Bass、春っぽいJ-Pop、深夜3時の孤独..."
          rows={2}
          className="w-full border border-[#d0d7de] rounded px-2.5 py-2 text-[13px] font-mono text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors resize-none leading-relaxed"
          style={{ background: "#fafbfc" }}
        />

        {/* ── 2. Wizard Mode ─────────────────────────────────────────────────── */}
        <SectionLabel>Wizard</SectionLabel>
        <div className="flex gap-1 pb-0.5">
          {(["off", "quick", "deep"] as WizardMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleWizardMode(m)}
              className={`flex-1 h-8 text-[12px] font-mono rounded border transition-all ${
                wizardMode === m
                  ? m === "off"
                    ? "border-zinc-400 text-zinc-700 bg-zinc-100"
                    : m === "quick"
                    ? "border-blue-400 text-blue-700 bg-blue-50"
                    : "border-violet-400 text-violet-700 bg-violet-50"
                  : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              {m === "off" ? "OFF" : m === "quick" ? "QUICK" : "DEEP"}
            </button>
          ))}
        </div>
        {wizardMode !== "off" && (
          <p className="text-[11px] font-mono text-zinc-400 pb-0.5">
            {wizardMode === "quick" ? "5問で素早くスタイルを組む" : "12問で世界観を細かく設計する"}
          </p>
        )}

        {/* ── 3. Inline Wizard ───────────────────────────────────────────────── */}
        {wizardMode !== "off" && currentQ && !appliedFlash && (
          <div
            className="border border-[#d0d7de] rounded-lg p-3 space-y-2.5 mt-1"
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

            {/* Option chips */}
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
            <p className="text-[10px] font-mono text-zinc-400 text-center">
              スキップ可 — 後で修正できます
            </p>
          </div>
        )}

        {/* Applied flash */}
        {appliedFlash && (
          <div className="border border-emerald-300 rounded-lg p-2.5 text-[12px] font-mono text-emerald-700 bg-emerald-50 text-center font-semibold mt-1">
            ✓ Applied to Style Prompt &amp; Concept
          </div>
        )}

        {/* ── 4. Concept Fields ──────────────────────────────────────────────── */}
        <SectionLabel>Concept</SectionLabel>

        {/* World Preset */}
        <div className="flex flex-wrap gap-1.5 py-0.5">
          {(Object.keys(WORLD_PRESETS) as WorldPresetKey[]).map((key) => {
            const p = WORLD_PRESETS[key];
            const active = preset === key;
            return (
              <button
                key={key}
                onClick={() => onPresetChange(active ? "" : key)}
                title={p.description}
                className={`px-2 py-0.5 text-[12px] font-mono font-bold rounded border transition-all ${
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
          <p className="text-[11px] font-mono text-zinc-500 pb-0.5 leading-snug">
            ▸ {WORLD_PRESETS[preset as WorldPresetKey].description}
          </p>
        )}

        <div className="space-y-1.5 pt-0.5">
          <Row label="TITLE">
            <Inp value={input.title} onChange={(v) => set("title", v)} placeholder="曲タイトル" />
          </Row>
          <Row label="GENRE">
            <Sel value={input.genre} onChange={(v) => set("genre", v)} options={GENRES} />
          </Row>
          <Row label="MOOD">
            <Sel value={input.mood} onChange={(v) => set("mood", v)} options={MOODS} />
          </Row>
          <Row label="VOCAL">
            <Sel value={input.vocalType} onChange={(v) => set("vocalType", v)} options={VOCALS} />
          </Row>
          <div className="flex gap-2">
            <Row label="BPM">
              <Inp value={input.bpm} onChange={(v) => set("bpm", v)} placeholder="120" />
            </Row>
            <Row label="KEY">
              <Sel
                value={input.key}
                onChange={(v) => set("key", v)}
                options={[["", "auto"], ...KEYS.map((k) => [k, k] as const)] as readonly (readonly [string, string])[]}
              />
            </Row>
          </div>
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
          <Row label="EN RATIO">
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

          <SectionLabel>Creative</SectionLabel>
          <Row label="REF">
            <Inp value={input.referenceVibe} onChange={(v) => set("referenceVibe", v)} placeholder="宇多田ヒカル、Portishead" />
          </Row>
          <Row label="AVOID">
            <Inp value={input.avoidExpressions} onChange={(v) => set("avoidExpressions", v)} placeholder="過度なピッチ補正" />
          </Row>
          <div className="pl-0.5 space-y-0.5 pt-0.5 pb-2">
            <Toggle checked={input.startWithChorus} onChange={(v) => set("startWithChorus", v)} label="サビ始まり" />
            <Toggle checked={input.avoidAiCliche} onChange={(v) => set("avoidAiCliche", v)} label="AI臭さ回避" />
          </div>
        </div>
      </div>

      {/* ── 5. Generate ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-[#d0d7de]">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-2.5 font-mono font-bold text-[13px] tracking-widest rounded transition-colors disabled:cursor-wait ${
            isGenerating
              ? "bg-blue-200 text-blue-500 animate-pulse"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
          }`}
        >
          {isGenerating ? "… GENERATING" : "▶  GENERATE"}
        </button>
      </div>
    </div>
  );
}
