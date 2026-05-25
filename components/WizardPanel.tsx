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
      <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-800">
        <span className="text-[9px] font-mono text-zinc-500 tracking-widest">GENERATED</span>
        <span className={`ml-auto text-[9px] font-mono tabular-nums ${charColor(cc)}`}>
          {cc} / 800
        </span>
      </div>

      {/* Prompt preview */}
      <pre className="text-[11px] font-mono leading-[1.75] text-zinc-300 whitespace-pre-wrap break-words overflow-y-auto max-h-[260px] rounded bg-black/30 p-2 border border-zinc-800/60">
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
          className="flex-none h-7 px-2.5 text-[10px] font-mono border border-zinc-700 text-zinc-500 rounded hover:border-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← 修正
        </button>
        <button
          onClick={onApply}
          className="flex-1 h-7 text-[10px] font-mono font-bold bg-cyan-700 hover:bg-cyan-600 text-zinc-950 rounded transition-colors"
        >
          Apply ✓
        </button>
      </div>

      <button
        onClick={onRestart}
        className="text-[9px] font-mono text-zinc-700 hover:text-zinc-500 text-center py-0.5 transition-colors"
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
  const accentBorder = mode === "quick" ? "border-cyan-600" : "border-violet-600";
  const accentText   = mode === "quick" ? "text-cyan-300"   : "text-violet-300";
  const accentBg     = mode === "quick" ? "bg-cyan-950/50"  : "bg-violet-950/50";
  const accentBtn    = mode === "quick"
    ? "bg-cyan-700 hover:bg-cyan-600 text-zinc-950"
    : "bg-violet-700 hover:bg-violet-600 text-zinc-100";
  const progressBg   = mode === "quick" ? "bg-cyan-600" : "bg-violet-600";

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
        <span className="text-[9px] font-mono text-zinc-600 shrink-0 tabular-nums">
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* Question text */}
      <div>
        <p className="text-[12px] font-mono text-zinc-200 leading-snug mb-0.5 font-medium">
          {question.question}
        </p>
        {question.hint && (
          <p className="text-[10px] font-mono text-zinc-600 leading-snug">
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
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-all ${
                sel
                  ? `${accentBorder} ${accentText} ${accentBg}`
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
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
        className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded px-2 text-[11px] font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
      />

      {/* Navigation */}
      <div className="flex gap-1.5 pt-0.5">
        {stepIndex > 0 && (
          <button
            onClick={onBack}
            className="h-7 px-2.5 text-[10px] font-mono border border-zinc-700 text-zinc-500 rounded hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ←
          </button>
        )}
        <button
          onClick={onNext}
          className={`flex-1 h-7 text-[10px] font-mono font-bold rounded transition-colors ${accentBtn}`}
        >
          {isLast ? "GENERATE" : "NEXT →"}
        </button>
      </div>

      {!hasAnswer && (
        <p className="text-[9px] font-mono text-zinc-700 text-center">
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
      <div className="flex gap-0.5 pb-2 border-b border-zinc-800">
        {(["quick", "deep"] as WizardMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleMode(m)}
            className={`flex-1 h-6 text-[10px] font-mono rounded border transition-all ${
              mode === m
                ? m === "quick"
                  ? "border-cyan-700 text-cyan-400 bg-cyan-950/40"
                  : "border-violet-700 text-violet-400 bg-violet-950/40"
                : "border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {m === "quick" ? "QUICK  5問" : "DEEP  12問"}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p className="text-[9px] font-mono text-zinc-700 leading-snug -mt-1 pb-1">
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
