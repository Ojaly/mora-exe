"use client";

import { BuilderSection, StructureMode, StructurePreset } from "@/types";
import {
  BUILDER_SECTIONS,
  STRUCTURE_PRESET_LABELS,
  STRUCTURE_PRESET_HINTS,
} from "@/lib/structureVariation";

// ─── Preset order ─────────────────────────────────────────────────────────────

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

const MAX_SECTIONS = 15;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  mode: StructureMode;
  onModeChange: (m: StructureMode) => void;
  preset: StructurePreset;
  onPresetChange: (p: StructurePreset) => void;
  builderSections: BuilderSection[];
  onBuilderSectionsChange: (s: BuilderSection[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StructureBlueprint({
  mode,
  onModeChange,
  preset,
  onPresetChange,
  builderSections,
  onBuilderSectionsChange,
}: Props) {
  const hint = STRUCTURE_PRESET_HINTS[preset];

  // ── Builder handlers ────────────────────────────────────────────────────────

  const addSection = () => {
    if (builderSections.length >= MAX_SECTIONS) return;
    onBuilderSectionsChange([...builderSections, "Verse 1"]);
  };

  const removeSection = (idx: number) => {
    onBuilderSectionsChange(builderSections.filter((_, i) => i !== idx));
  };

  const changeSection = (idx: number, val: BuilderSection) => {
    const next = [...builderSections];
    next[idx] = val;
    onBuilderSectionsChange(next);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...builderSections];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onBuilderSectionsChange(next);
  };

  const moveDown = (idx: number) => {
    if (idx === builderSections.length - 1) return;
    const next = [...builderSections];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onBuilderSectionsChange(next);
  };

  const validSections = builderSections.filter(Boolean);
  const preview = validSections.map((s) => `[${s}]`).join(" → ");

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2 py-1">

      {/* ── Mode toggle ───────────────────────────────────────────────────── */}
      <div className="flex gap-1">
        {(["preset", "builder"] as StructureMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 h-7 text-[11px] font-mono rounded border transition-colors uppercase tracking-wider ${
              mode === m
                ? "border-blue-400 text-blue-700 bg-blue-50 font-semibold"
                : "border-[#E2E8F0] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Preset mode ───────────────────────────────────────────────────── */}
      {mode === "preset" && (
        <div className="space-y-1.5">
          <select
            value={preset}
            onChange={(e) => onPresetChange(e.target.value as StructurePreset)}
            className="w-full border border-[#E2E8F0] rounded px-2 h-8 bg-white text-[12px] font-mono text-zinc-800 focus:outline-none focus:border-blue-400 transition-colors"
          >
            {PRESET_ORDER.map((p) => (
              <option key={p} value={p}>
                {STRUCTURE_PRESET_LABELS[p]}
              </option>
            ))}
          </select>
          <p className="text-[11px] font-mono text-zinc-500 leading-snug break-words">
            {hint}
          </p>
        </div>
      )}

      {/* ── Builder mode ──────────────────────────────────────────────────── */}
      {mode === "builder" && (
        <div className="space-y-1.5">

          {/* Counter + empty warning */}
          <div className="flex items-center justify-between min-h-[18px]">
            <span className="text-[11px] font-mono text-zinc-500">
              {builderSections.length} / {MAX_SECTIONS}
            </span>
            {builderSections.length === 0 && (
              <span className="text-[10px] font-mono text-amber-600 leading-none">
                ⚠ 1件以上選択してください
              </span>
            )}
          </div>

          {/* Section rows */}
          {builderSections.length > 0 && (
            <div className="space-y-1">
              {builderSections.map((sec, idx) => (
                <div key={idx} className="flex items-center gap-1">

                  {/* Move up/down */}
                  <div className="flex flex-col shrink-0">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      title="上へ"
                      className="h-3.5 w-5 text-[9px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === builderSections.length - 1}
                      title="下へ"
                      className="h-3.5 w-5 text-[9px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center leading-none"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Dropdown */}
                  <select
                    value={sec}
                    onChange={(e) => changeSection(idx, e.target.value as BuilderSection)}
                    className="flex-1 border border-[#E2E8F0] rounded px-2 h-7 bg-white text-[12px] font-mono text-zinc-800 focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    {BUILDER_SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {/* Delete */}
                  <button
                    onClick={() => removeSection(idx)}
                    title="削除"
                    className="shrink-0 w-6 h-7 text-[12px] font-mono text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add section button */}
          <button
            onClick={addSection}
            disabled={builderSections.length >= MAX_SECTIONS}
            className="w-full h-7 text-[11px] font-mono border border-dashed border-[#E2E8F0] rounded text-zinc-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Section
          </button>

          {/* Preview (valid sections only) */}
          {validSections.length > 0 && (
            <p className="text-[11px] font-mono text-zinc-500 leading-snug break-words">
              {preview}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
