"use client";

import { useState } from "react";
import {
  QUICK_QUESTIONS,
  DEEP_QUESTIONS,
  WizardMode,
  WizardQuestion,
} from "@/lib/wizardData";
import {
  buildWizardPrompt,
  WizardAnswers,
  WizardResult,
} from "@/lib/wizardBuilder";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onApply: (prompt: string, negative: string) => void;
}

// ─── Char-count color ─────────────────────────────────────────────────────────

function charColor(n: number): string {
  if (n > 800) return "text-red-400";
  if (n > 620) return "text-amber-400";
  return "text-emerald-500";
}

// ─── Result view ──────────────────────────────────────────────────────────────

function ResultView({
  result,
  onApply,
  onBack,
  onRestart,
}: {
  result: WizardResult;
  onApply: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const cc = result.prompt.length;
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 pb-1 border-b border-[#d0d7de]">
        <span className="text-[9px] font-mono text-zinc-500 tracking-widest font-bold">GENERATED</span>
        <span className={`ml-auto text-[9px] font-mono tabular-nums ${charColor(cc)}`}>
          {cc} / 800
        </span>
      </div>

      {/* Prompt preview */}
      <pre className="text-[11px] font-mono leading-[1.75] text-zinc-200 whitespace-pre-wrap break-words overflow-y-auto max-h-[260px] rounded p-2 border border-[#2a2f3a]/70" style={{ background: "#13161f" }}>
        {result.prompt}
      </pre>

      {/* Negative */}
      {result.negative && (
        <div className="text-[10px] font-mono text-zinc-600 leading-snug">
          <span className="text-zinc-700">NEG: </span>
          {result.negative}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 pt-0.5">
        <button
          onClick={onBack}
          className="flex-none h-8 px-3 text-[12px] font-mono border border-[#c8cdd4] text-zinc-600 rounded hover:border-zinc-400 hover:text-zinc-900 transition-colors"
        >
          ← 修正
        </button>
        <button
          onClick={onApply}
          className="flex-1 h-8 text-[12px] font-mono font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Apply ✓
        </button>
      </div>

      <button
        onClick={onRestart}
        className="text-[9px] font-mono text-zinc-400 hover:text-zinc-700 text-center py-0.5 transition-colors"
      >
        最初から
      </button>
    </div>
  );
}

// ─── Question view ────────────────────────────────────────────────────────────

function QuestionView({
  mode,
  question,
  stepIndex,
  totalSteps,
  answer,
  isLast,
  onChip,
  onFree,
  onNext,
  onBack,
}: {
  mode: WizardMode;
  question: WizardQuestion;
  stepIndex: number;
  totalSteps: number;
  answer: { chip?: string; free?: string } | undefined;
  isLast: boolean;
  onChip: (value: string) => void;
  onFree: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const accentBorder = mode === "quick" ? "border-blue-400"  : "border-violet-400";
  const accentText   = mode === "quick" ? "text-blue-700"    : "text-violet-700";
  const accentBg     = mode === "quick" ? "bg-blue-50"       : "bg-violet-50";
  const accentBtn    = mode === "quick"
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-violet-600 hover:bg-violet-700 text-white";
  const progressBg   = mode === "quick" ? "bg-blue-500" : "bg-violet-500";

  const pct = ((stepIndex + 1) / totalSteps) * 100;
  const hasAnswer = !!(answer?.chip || answer?.free?.trim());

  return (
    <div className="flex flex-col gap-2">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-zinc-500 shrink-0 tabular-nums">
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* Question text */}
      <div>
        <p className="text-[14px] font-mono text-zinc-800 leading-snug mb-0.5 font-medium">
          {question.question}
        </p>
        {question.hint && (
          <p className="text-[12px] font-mono text-zinc-500 leading-snug">
            {question.hint}
          </p>
        )}
      </div>

      {/* Option chips */}
      <div className="flex flex-wrap gap-1">
        {question.options.map((opt) => {
          const sel = answer?.chip === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChip(opt.value)}
              className={`px-2 py-1 text-[12px] font-mono rounded border transition-all ${
                sel
                  ? `${accentBorder} ${accentText} ${accentBg}`
                  : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-800"
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
        value={answer?.free ?? ""}
        onChange={(e) => onFree(e.target.value)}
        placeholder={question.placeholder ?? "自由入力..."}
        className="w-full h-8 border border-[#d0d7de] rounded px-2.5 text-[13px] font-mono text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors" style={{ background: "#fafbfc" }}
      />

      {/* Navigation */}
      <div className="flex gap-1.5 pt-0.5">
        {stepIndex > 0 && (
          <button
            onClick={onBack}
            className="h-7 px-2.5 text-[10px] font-mono border border-[#c8cdd4] text-zinc-600 rounded hover:border-zinc-400 hover:text-zinc-900 transition-colors"
          >
            ←
          </button>
        )}
        <button
          onClick={onNext}
          className={`flex-1 h-8 text-[12px] font-mono font-bold rounded transition-colors ${accentBtn}`}
        >
          {isLast ? "GENERATE" : "NEXT →"}
        </button>
      </div>

      {!hasAnswer && (
        <p className="text-[11px] font-mono text-zinc-400 text-center">
          スキップ可 — 後で修正できます
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WizardPanel({ onApply }: Props) {
  const [mode, setMode]       = useState<WizardMode>("quick");
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [result, setResult]   = useState<WizardResult | null>(null);

  const questions = mode === "quick" ? QUICK_QUESTIONS : DEEP_QUESTIONS;
  const total     = questions.length;
  const current   = questions[step];
  const isLast    = step === total - 1;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleMode = (m: WizardMode) => {
    if (m === mode) return;
    setMode(m); setStep(0); setAnswers({}); setResult(null);
  };

  const setChip = (id: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        chip: prev[id]?.chip === value ? undefined : value,
      },
    }));
  };

  const setFree = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], free: value } }));
  };

  const handleNext = () => {
    if (isLast) {
      setResult(buildWizardPrompt(mode, answers));
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleRestart = () => { setStep(0); setAnswers({}); setResult(null); };

  const handleApply = () => {
    if (result) onApply(result.prompt, result.negative);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      {/* Mode tabs */}
      <div className="flex gap-0.5 pb-2 border-b border-[#d0d7de]">
        {(["quick", "deep"] as WizardMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleMode(m)}
            className={`flex-1 h-8 text-[12px] font-mono rounded border transition-all ${
              mode === m
                ? m === "quick"
                  ? "border-blue-400 text-blue-700 bg-blue-50"
                  : "border-violet-400 text-violet-700 bg-violet-50"
                : "border-[#d0d7de] text-zinc-500 hover:text-zinc-800 hover:border-zinc-400"
            }`}
          >
            {m === "quick" ? "QUICK  5問" : "DEEP  12問"}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p className="text-[12px] font-mono text-zinc-500 leading-snug pb-1">
        {mode === "quick"
          ? "感覚で素早くPromptを組み立てる"
          : "12問で世界観を細かく設計する"}
      </p>

      {/* Content: result or question */}
      {result ? (
        <ResultView
          result={result}
          onApply={handleApply}
          onBack={handleBack}
          onRestart={handleRestart}
        />
      ) : (
        <QuestionView
          mode={mode}
          question={current}
          stepIndex={step}
          totalSteps={total}
          answer={answers[current.id]}
          isLast={isLast}
          onChip={(v) => setChip(current.id, v)}
          onFree={(v) => setFree(current.id, v)}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
