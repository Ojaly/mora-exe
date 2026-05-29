"use client";

import { useState, useEffect, useMemo } from "react";
import { PromptBuilder12State, PromptBuilderStep } from "@/types";
import {
  createInitialState,
  makeSampleState,
  buildStylePromptFrom12Steps,
  buildNegativeFragmentsFromBuilderState,
  loadPresetState,
  BUILT_IN_PRESETS,
} from "@/lib/promptBuilder12";

const STORAGE_KEY = "mora-builder-12";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onApply: (prompt: string) => void;
  onReplaceNegative?: (neg: string) => void;
  onAppendNegative?: (neg: string) => void;
}

// ─── Step row ────────────────────────────────────────────────────────────────

function StepRow({
  step,
  onToggle,
  onCustom,
}: {
  step: PromptBuilderStep;
  onToggle: (id: string, value: string) => void;
  onCustom: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-1">
      {/* Label */}
      <span className="text-[11px] font-mono text-zinc-600 tracking-[0.1em] uppercase leading-none block font-semibold">
        {step.labelJa}
        <span className="text-zinc-400 mx-1">/</span>
        {step.label}
      </span>

      {/* Option chips */}
      <div className="flex flex-wrap gap-1">
        {step.options.map((opt) => {
          const active = step.selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(step.id, opt.value)}
              className={`px-2 py-[2px] text-[11px] font-mono rounded border transition-all ${
                active
                  ? "border-blue-400 text-blue-700 bg-blue-50 font-semibold"
                  : "border-[var(--border-muted)] text-zinc-700 hover:border-zinc-500 hover:text-zinc-900"
              }`}
            >
              {active ? "· " : ""}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Custom input */}
      <input
        type="text"
        value={step.custom}
        onChange={(e) => onCustom(step.id, e.target.value)}
        placeholder={
          step.id === "genre-foundation"
            ? "例: Corporate Electro Funk / Dark Electro Gospel"
            : "Custom..."
        }
        className={`w-full h-8 border rounded px-2 text-[12px] font-mono text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors ${
          step.id === "genre-foundation"
            ? "border-blue-200 bg-blue-50/30 placeholder-blue-300"
            : "border-[var(--border-muted)] bg-white"
        }`}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PromptBuilder12Panel({ onApply, onReplaceNegative, onAppendNegative }: Props) {
  const [state, setState] = useState<PromptBuilder12State>(createInitialState);
  const [mounted, setMounted] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          steps: { id: string; selected: string | null; custom: string }[];
        };
        if (Array.isArray(parsed?.steps)) {
          setState(loadPresetState({ id: "_wip", name: "", steps: parsed.steps }));
        }
      }
    } catch {
      /* corrupt data: start fresh */
    }
    setMounted(true);
  }, []);

  // Active preset: which built-in preset matches the current state exactly
  const activePresetId = useMemo(() => {
    return (
      BUILT_IN_PRESETS.find((preset) =>
        preset.steps.every((ps) => {
          const cs = state.steps.find((s) => s.id === ps.id);
          return cs && cs.selected === ps.selected && cs.custom === ps.custom;
        })
      )?.id ?? null
    );
  }, [state]);

  // Persist to localStorage on every state change (post-mount only)
  useEffect(() => {
    if (!mounted) return;
    const toStore = {
      steps: state.steps.map((s) => ({ id: s.id, selected: s.selected, custom: s.custom })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state, mounted]);

  // Derived: compute prompt on every render (fast, pure)
  const { prompt, charCount } = buildStylePromptFrom12Steps(state);

  // Derived: negative fragments from current builder state
  const negFragments = useMemo(
    () => buildNegativeFragmentsFromBuilderState(state),
    [state]
  );
  const negPreview = negFragments.join(", ");

  // ── Step updaters ──────────────────────────────────────────────────────────

  /** Toggle option chip: select if not active, deselect if already active. */
  const handleToggle = (stepId: string, value: string) => {
    setState((prev) => ({
      steps: prev.steps.map((s) =>
        s.id === stepId
          ? { ...s, selected: s.selected === value ? null : value }
          : s
      ),
    }));
  };

  /** Update custom text for a step. */
  const handleCustom = (stepId: string, value: string) => {
    setState((prev) => ({
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, custom: value } : s
      ),
    }));
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleApply = () => {
    if (prompt) onApply(prompt);
  };

  const handleClear = () => setState(createInitialState());

  const handleSample = () => setState(makeSampleState());

  // ── Char count color ───────────────────────────────────────────────────────
  const barColor =
    charCount >= 750
      ? "bg-red-400"
      : charCount >= 600
      ? "bg-amber-400"
      : "bg-emerald-400";
  const countColor =
    charCount >= 750
      ? "text-red-500"
      : charCount >= 600
      ? "text-amber-500"
      : "text-zinc-500";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── Preset row ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono text-zinc-500 tracking-[0.1em] uppercase leading-none block">
          PRESET
        </span>
        <div className="flex flex-wrap gap-1">
          {BUILT_IN_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setState(loadPresetState(preset))}
                className={`px-2 py-[2px] text-[11px] font-mono rounded border transition-all ${
                  active
                    ? "border-emerald-400 text-emerald-700 bg-emerald-50 font-semibold"
                    : "border-[var(--border-muted)] text-zinc-700 hover:border-zinc-500 hover:text-zinc-900"
                }`}
              >
                {active ? "· " : ""}
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 12 Steps ──────────────────────────────────────────────────────── */}
      {state.steps.map((step) => (
        <StepRow
          key={step.id}
          step={step}
          onToggle={handleToggle}
          onCustom={handleCustom}
        />
      ))}

      {/* ── Output preview + actions ───────────────────────────────────────── */}
      <div className="border-t border-[#E2E8F0] pt-2.5 space-y-1.5">
        {/* Preview text */}
        <p
          className="text-[12px] font-mono leading-snug text-zinc-700 line-clamp-2 min-h-[2.5rem]"
          title={prompt || undefined}
        >
          {prompt || (
            <span className="text-zinc-400">— 未入力。Step 1 のCustomにジャンル名を入力してください。</span>
          )}
        </p>

        {/* Progress bar + char count */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-150 ${barColor}`}
              style={{ width: `${Math.min(100, (charCount / 800) * 100)}%` }}
            />
          </div>
          <span className={`text-[11px] font-mono tabular-nums shrink-0 ${countColor}`}>
            {charCount} / 800
          </span>
        </div>

        {/* Use as Style Prompt */}
        <button
          onClick={handleApply}
          disabled={!prompt}
          className="w-full h-8 text-[12px] font-mono font-bold rounded border transition-all
            disabled:opacity-30 disabled:cursor-default
            border-blue-400 text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-[0.99]"
        >
          Use as Style Prompt
        </button>

        {/* Builder Negative preview + Replace / Append buttons */}
        {negPreview && (
          <div className="space-y-1 border border-zinc-200 rounded px-2 py-1.5 bg-zinc-50">
            <span className="text-[10px] font-mono text-zinc-500 tracking-[0.1em] uppercase leading-none block">
              BUILDER NEGATIVE
            </span>
            <p
              className="text-[11px] font-mono leading-snug text-zinc-600 line-clamp-1"
              title={negPreview}
            >
              {negPreview}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => onReplaceNegative?.(negPreview)}
                className="flex-1 h-7 text-[11px] font-mono rounded border transition-all
                  border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200 active:scale-[0.99] font-semibold"
              >
                Replace Negative
              </button>
              <button
                onClick={() => onAppendNegative?.(negPreview)}
                className="flex-1 h-7 text-[11px] font-mono rounded border transition-all
                  border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-[0.99]"
              >
                Append to Negative
              </button>
            </div>
          </div>
        )}

        {/* Clear / Sample */}
        <div className="flex gap-1">
          <button
            onClick={handleSample}
            className="flex-1 h-8 text-[11px] font-mono rounded border border-[var(--border-muted)] text-zinc-600
              hover:border-zinc-500 hover:text-zinc-800 transition-colors"
          >
            SAMPLE
          </button>
          <button
            onClick={handleClear}
            className="flex-1 h-8 text-[11px] font-mono rounded border border-[var(--border-muted)] text-zinc-600
              hover:border-zinc-500 hover:text-zinc-800 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}
