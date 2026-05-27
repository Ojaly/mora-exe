"use client";

import { StructureMode, StructurePreset } from "@/types";
import {
  STRUCTURE_PRESET_LABELS,
  STRUCTURE_PRESET_HINTS,
} from "@/lib/structureVariation";

// ─── Ordered list of preset options ──────────────────────────────────────────

const PRESET_ORDER: StructurePreset[] = [
  "chorus-first",
  "dance-drop",
  "hook-loop",
  "ballad-narrative",
  "rap-hook",
  "theatrical",
  "short-viral",
  "verse-first",
  "spoken-intro",
  "final-chorus-build",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  mode: StructureMode;
  onModeChange: (m: StructureMode) => void;
  preset: StructurePreset;
  onPresetChange: (p: StructurePreset) => void;
  customBlueprint: string;
  onCustomBlueprintChange: (v: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StructureBlueprint({
  mode,
  onModeChange,
  preset,
  onPresetChange,
  customBlueprint,
  onCustomBlueprintChange,
}: Props) {
  const hint = STRUCTURE_PRESET_HINTS[preset];

  return (
    <div className="space-y-2 py-1">

      {/* ── Mode toggle ────────────────────────────────────────────────────── */}
      <div className="flex gap-1">
        {(["auto", "preset", "custom"] as StructureMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 h-7 text-[11px] font-mono rounded border transition-colors uppercase tracking-wider ${
              mode === m
                ? "border-blue-400 text-blue-700 bg-blue-50 font-semibold"
                : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Auto ───────────────────────────────────────────────────────────── */}
      {mode === "auto" && (
        <p className="text-[10px] font-mono text-zinc-400 leading-snug">
          ジャンル・ムードから自動選択。毎回異なる構成。
        </p>
      )}

      {/* ── Preset ─────────────────────────────────────────────────────────── */}
      {mode === "preset" && (
        <div className="space-y-1.5">
          <select
            value={preset}
            onChange={(e) => onPresetChange(e.target.value as StructurePreset)}
            className="w-full border border-[#d0d7de] rounded px-2 h-8 bg-white text-[12px] font-mono text-zinc-800 focus:outline-none focus:border-blue-400 transition-colors"
            style={{ background: "#fafbfc" }}
          >
            {PRESET_ORDER.map((p) => (
              <option key={p} value={p}>
                {STRUCTURE_PRESET_LABELS[p]}
              </option>
            ))}
          </select>
          <p className="text-[10px] font-mono text-zinc-400 leading-snug break-words">
            {hint}
          </p>
        </div>
      )}

      {/* ── Custom ─────────────────────────────────────────────────────────── */}
      {mode === "custom" && (
        <div className="space-y-1">
          <textarea
            value={customBlueprint}
            onChange={(e) => onCustomBlueprintChange(e.target.value)}
            placeholder={
              "[Spoken Intro]\n[Verse 1]\n[Build]\n[Drop]\n[Verse 2]\n[Bridge]\n[Final Chorus]\n[Outro]"
            }
            rows={7}
            spellCheck={false}
            className="w-full border border-[#d0d7de] rounded px-2.5 py-1.5 text-[11px] font-mono text-zinc-700 placeholder-zinc-300 focus:outline-none focus:border-blue-400 transition-colors resize-none leading-relaxed"
            style={{ background: "#fafbfc" }}
          />
          <p className="text-[10px] font-mono text-zinc-400 leading-snug">
            1行1セクション。[Bracket] 形式で記入。この順番通りに生成されます。
          </p>
          {customBlueprint.trim() && (
            <button
              onClick={() => onCustomBlueprintChange("")}
              className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              ✕ clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
