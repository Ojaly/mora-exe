"use client";

import { SongInput, WorldPresetKey } from "@/types";
import WorldPresetSelector from "@/components/WorldPresetSelector";

interface Props {
  input: SongInput;
  onChange: (next: SongInput) => void;
  preset: WorldPresetKey | "";
  onPresetChange: (p: WorldPresetKey | "") => void;
  onGenerate: () => void;
}

const GENRES = [
  ["jpop", "J-Pop"], ["jrock", "J-Rock"], ["city", "City Pop"],
  ["anime", "Anime OST"], ["vocaloid", "Vocaloid"], ["electronic", "Electronic"],
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
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-mono text-zinc-500 tracking-widest block mb-1">
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-cyan-800 ${className}`}
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[] | string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-800"
    >
      {(options as (readonly [string, string] | string)[]).map((opt) => {
        const [val, label] = Array.isArray(opt) ? opt : [opt, opt];
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors ${
          checked ? "bg-cyan-600" : "bg-zinc-700"
        } relative`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-zinc-200 transition-all ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </div>
      <span className="text-[10px] font-mono text-zinc-400">{label}</span>
    </label>
  );
}

export default function ConceptInput({
  input,
  onChange,
  preset,
  onPresetChange,
  onGenerate,
}: Props) {
  const set = <K extends keyof SongInput>(key: K, value: SongInput[K]) =>
    onChange({ ...input, [key]: value });

  return (
    <div className="space-y-4">
      {/* World Preset */}
      <div>
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest mb-2">
          // WORLD PRESET
        </p>
        <WorldPresetSelector selected={preset} onChange={onPresetChange} />
      </div>

      <div className="border-t border-zinc-800" />

      {/* Basic Info */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest">// CONCEPT</p>
        <div>
          <Label>TITLE</Label>
          <Input value={input.title} onChange={(v) => set("title", v)} placeholder="曲タイトル" />
        </div>
        <div>
          <Label>THEME</Label>
          <Input
            value={input.theme}
            onChange={(v) => set("theme", v)}
            placeholder="例：夜の高速道路、別れ、再生"
          />
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Music params */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest">// MUSIC</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>GENRE</Label>
            <Select value={input.genre} onChange={(v) => set("genre", v)} options={GENRES} />
          </div>
          <div>
            <Label>MOOD</Label>
            <Select value={input.mood} onChange={(v) => set("mood", v)} options={MOODS} />
          </div>
          <div>
            <Label>BPM</Label>
            <Input value={input.bpm} onChange={(v) => set("bpm", v)} placeholder="120" />
          </div>
          <div>
            <Label>KEY</Label>
            <Select
              value={input.key}
              onChange={(v) => set("key", v)}
              options={[["", "— (auto)"], ...KEYS.map((k) => [k, k] as const)] as readonly (readonly [string, string])[]}
            />
          </div>
          <div>
            <Label>VOCAL</Label>
            <Select value={input.vocalType} onChange={(v) => set("vocalType", v)} options={VOCALS} />
          </div>
          <div>
            <Label>LENGTH</Label>
            <Select
              value={input.songLength}
              onChange={(v) => set("songLength", v)}
              options={[["30s", "30秒"], ["90s", "90秒"], ["full", "フル"]] as const}
            />
          </div>
        </div>
        <div>
          <Label>EN RATIO</Label>
          <div className="flex gap-1">
            {(["low", "mixed", "high"] as const).map((v) => (
              <button
                key={v}
                onClick={() => set("englishRatio", v)}
                className={`flex-1 py-1 text-[10px] font-mono rounded border transition-colors ${
                  input.englishRatio === v
                    ? "border-cyan-600 text-cyan-400 bg-cyan-950"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {v === "low" ? "JP多め" : v === "mixed" ? "混合" : "EN多め"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Creative params */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest">// CREATIVE</p>
        <div>
          <Label>REFERENCE VIBE</Label>
          <Input
            value={input.referenceVibe}
            onChange={(v) => set("referenceVibe", v)}
            placeholder="例：宇多田ヒカル、Portishead"
          />
        </div>
        <div>
          <Label>AVOID EXPRESSIONS</Label>
          <Input
            value={input.avoidExpressions}
            onChange={(v) => set("avoidExpressions", v)}
            placeholder="例：過度なピッチ補正、ありきたりなサビ"
          />
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Toggle
            checked={input.startWithChorus}
            onChange={(v) => set("startWithChorus", v)}
            label="サビ始まり"
          />
          <Toggle
            checked={input.avoidAiCliche}
            onChange={(v) => set("avoidAiCliche", v)}
            label="AI臭さ回避モード"
          />
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      <button
        onClick={onGenerate}
        className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 text-zinc-950 font-mono font-bold text-xs tracking-widest rounded transition-colors"
      >
        [ GENERATE PROMPT + LYRICS ]
      </button>
    </div>
  );
}
