"use client";

import { SongInput, WorldPresetKey } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";

interface Props {
  input: SongInput;
  onChange: (next: SongInput) => void;
  preset: WorldPresetKey | "";
  onPresetChange: (p: WorldPresetKey | "") => void;
  onGenerate: () => void;
  compact?: boolean;
  isGenerating?: boolean;
}

const GENRES = [
  ["jpop", "J-Pop"], ["jrock", "J-Rock"], ["city", "City Pop"],
  ["anime", "Anime"], ["vocaloid", "Vocaloid"], ["electronic", "Electronic"],
  ["rnb", "R&B"], ["hiphop", "Hip-Hop"], ["folk", "Folk"],
  ["metal", "Metal"], ["jazz", "Jazz"], ["ambient", "Ambient"],
] as const;

const MOODS = [
  ["melancholic", "Melancholic"], ["energetic", "Energetic"], ["dreamy", "Dreamy"],
  ["dark", "Dark"], ["uplifting", "Uplifting"], ["nostalgic", "Nostalgic"],
  ["aggressive", "Aggressive"], ["romantic", "Romantic"], ["epic", "Epic"],
  ["chill", "Chill"],
] as const;

const VOCALS = [
  ["female", "Female"], ["male", "Male"], ["duet", "Duet"],
  ["choir", "Choir"], ["falsetto", "Falsetto"], ["rap", "Rap"],
  ["vocaloid", "Vocaloid"],
] as const;

const KEYS = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
  "Cm","C#m","Dm","D#m","Em","Fm","F#m","Gm","G#m","Am","A#m","Bm",
];

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls = [
  "w-full border border-[#d0d7de] rounded px-2.5",
  "text-[13px] font-mono text-zinc-800 placeholder-zinc-400",
  "focus:outline-none focus:border-blue-400 transition-colors",
  "h-8",
].join(" ");

const selectCls = [
  "w-full border border-[#d0d7de] rounded px-2",
  "text-[13px] font-mono text-zinc-800",
  "focus:outline-none focus:border-blue-400 transition-colors",
  "h-8 bg-white",
].join(" ");

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-h-[32px]">
      <span className="text-[12px] font-mono text-zinc-500 w-[4.5rem] shrink-0 tracking-wide">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Inp({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
      style={{ background: "#fafbfc" }}
    />
  );
}

function Sel<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void;
  options: readonly (readonly [T, string])[] | string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={selectCls}
    >
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-[11px] font-mono text-zinc-400 tracking-widest uppercase font-semibold">{children}</span>
      <div className="flex-1 border-t border-[#d0d7de]" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConceptInput({
  input, onChange, preset, onPresetChange, onGenerate, compact = false, isGenerating = false,
}: Props) {
  const set = <K extends keyof SongInput>(key: K, value: SongInput[K]) =>
    onChange({ ...input, [key]: value });

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 space-y-1 ${compact ? "text-[13px]" : "text-sm"}`}>

        {/* World Preset */}
        <SectionLabel>World Preset</SectionLabel>
        <div className="flex flex-wrap gap-1.5 pb-1">
          {(Object.keys(WORLD_PRESETS) as WorldPresetKey[]).map((key) => {
            const p = WORLD_PRESETS[key];
            const active = preset === key;
            return (
              <button
                key={key}
                onClick={() => onPresetChange(active ? "" : key)}
                title={p.description}
                className={`px-2 py-1 text-[12px] font-mono font-bold rounded border transition-all ${
                  active ? "text-zinc-900" : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                }`}
                style={active ? { borderColor: p.accentColor, color: p.accentColor, background: p.accentColor + "18" } : {}}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {preset && (
          <p className="text-[12px] font-mono text-zinc-500 pb-1 leading-snug">
            ▸ {WORLD_PRESETS[preset as WorldPresetKey].description}
          </p>
        )}

        {/* Concept */}
        <SectionLabel>Concept</SectionLabel>
        <div className="space-y-1.5 pb-1">
          <Row label="TITLE">
            <Inp value={input.title} onChange={(v) => set("title", v)} placeholder="曲タイトル" />
          </Row>
          <Row label="THEME">
            <Inp value={input.theme} onChange={(v) => set("theme", v)} placeholder="深夜、孤独、再生" />
          </Row>
        </div>

        {/* Music */}
        <SectionLabel>Music</SectionLabel>
        <div className="space-y-1.5 pb-1">
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
        </div>

        {/* Creative */}
        <SectionLabel>Creative</SectionLabel>
        <div className="space-y-1.5 pb-2">
          <Row label="REF">
            <Inp value={input.referenceVibe} onChange={(v) => set("referenceVibe", v)} placeholder="宇多田ヒカル、Portishead" />
          </Row>
          <Row label="AVOID">
            <Inp value={input.avoidExpressions} onChange={(v) => set("avoidExpressions", v)} placeholder="過度なピッチ補正" />
          </Row>
          <div className="pl-0.5 space-y-0.5 pt-1">
            <Toggle checked={input.startWithChorus} onChange={(v) => set("startWithChorus", v)} label="サビ始まり" />
            <Toggle checked={input.avoidAiCliche} onChange={(v) => set("avoidAiCliche", v)} label="AI臭さ回避" />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="pt-2.5 border-t border-[#d0d7de] mt-1">
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
