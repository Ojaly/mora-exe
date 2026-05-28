"use client";

import { useState, useEffect } from "react";
import { PromptBuilder12State, PromptBuilderStep } from "@/types";
import {
  createInitialState,
  makeSampleState,
  buildStylePromptFrom12Steps,
} from "@/lib/promptBuilder12";

const STORAGE_KEY = "mora-builder-12";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onApply: (prompt: string) => void;
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
      <span className="text-[10px] font-mono text-zinc-400 tracking-[0.1em] uppercase leading-none block">
        {step.labelJa}
        <span className="text-zinc-300 mx-1">/</span>
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
              className={`px-2 py-[2px] text-[10px] font-mono rounded border transition-all ${
                active
                  ? "border-blue-400 text-blue-700 bg-blue-50 font-semibold"
                  : "border-[#E2E8F0] text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
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
        className={`w-full h-7 border rounded px-2 text-[11px] font-mono text-zinc-700 placeholder-zinc-300 focus:outline-none focus:border-blue-400 transition-colors ${
          step.id === "genre-foundation"
            ? "border-blue-200 bg-blue-50/30 placeholder-blue-300"
            : "border-[#E2E8F0] bg-white"
        }`}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PromptBuilder12Panel({ onApply }: Props) {
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
          const map = new Map(parsed.steps.map((s) => [s.id, s]));
          setState({
            steps: createInitialState().steps.map((step) => {
              const stored = map.get(step.id);
              if (!stored) return step;
              const validSelected =
                stored.selected === null ||
                step.options.some((o) => o.value === stored.selected)
                  ? stored.selected
                  : null;
              return {
                ...step,
                selected: validSelected,
                custom: typeof stored.custom === "string" ? stored.custom : "",
              };
            }),
          });
        }
      }
    } catch {
      /* corrupt data: start fresh */
    }
    setMounted(true);
  }, []);

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
          className="text-[11px] font-mono leading-snug text-zinc-600 line-clamp-2 min-h-[2.5rem]"
          title={prompt || undefined}
        >
          {prompt || (
            <span className="text-zinc-300">— 未入力。Step 1 のCustomにジャンル名を入力してください。</span>
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
          <span className={`text-[10px] font-mono tabular-nums shrink-0 ${countColor}`}>
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

        {/* Clear / Sample */}
        <div className="flex gap-1">
          <button
            onClick={handleSample}
            className="flex-1 h-7 text-[10px] font-mono rounded border border-[#E2E8F0] text-zinc-500
              hover:border-zinc-400 hover:text-zinc-700 transition-colors"
          >
            SAMPLE
          </button>
          <button
            onClick={handleClear}
            className="flex-1 h-7 text-[10px] font-mono rounded border border-[#E2E8F0] text-zinc-500
              hover:border-zinc-400 hover:text-zinc-700 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}
