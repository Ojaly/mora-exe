"use client";

import { useState } from "react";
import { AlchemyResult } from "@/types";

interface Props {
  onSetWorldSeed: (seed: string) => void;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "violet" | "purple" | "amber";
}) {
  const cls: Record<string, string> = {
    default: "border-[#d0d7de]  text-zinc-600   bg-white",
    violet:  "border-violet-200 text-violet-700  bg-violet-50",
    purple:  "border-purple-200 text-purple-700  bg-purple-50",
    amber:   "border-amber-200  text-amber-700   bg-amber-50",
  };
  return (
    <span
      className={`inline-block px-1.5 py-[2px] text-[11px] font-mono rounded border leading-tight ${cls[variant]}`}
    >
      {label}
    </span>
  );
}

// ─── ExpRow ───────────────────────────────────────────────────────────────────

function ExpRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase font-semibold">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SourceAlchemy({ onSetWorldSeed }: Props) {
  const [sourceText,    setSourceText]    = useState("");
  const [userReaction,  setUserReaction]  = useState("");
  const [desiredTone,   setDesiredTone]   = useState("");
  const [avoidDirect,   setAvoidDirect]   = useState(true);
  const [isTransmuting, setIsTransmuting] = useState(false);
  const [result,        setResult]        = useState<AlchemyResult | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [seedApplied,   setSeedApplied]   = useState(false);

  const handleTransmute = async () => {
    if (!sourceText.trim() || isTransmuting) return;
    setIsTransmuting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/alchemy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText:           sourceText.trim(),
          userReaction:         userReaction.trim(),
          desiredTone:          desiredTone.trim(),
          avoidDirectReference: avoidDirect,
        }),
      });

      if (res.status === 503) {
        setError("Source Alchemy requires Claude API — .env.local に ANTHROPIC_API_KEY を追加してください");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: AlchemyResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transmutation failed");
    } finally {
      setIsTransmuting(false);
    }
  };

  const handleSetWorldSeed = () => {
    if (!result?.worldSeed) return;
    onSetWorldSeed(result.worldSeed);
    setSeedApplied(true);
    setTimeout(() => setSeedApplied(false), 2200);
  };

  const hasSource = sourceText.trim().length > 0;

  return (
    <div className="space-y-2.5">

      {/* Source Text */}
      <div className="space-y-1">
        <label className="block text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase">
          Source Text
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder={"記事・ニュース・SNS投稿・論考を貼り付け\n（URL不可 — テキストで）"}
          rows={4}
          className="w-full border border-[#d0d7de] rounded px-2.5 py-2 text-[12px] font-mono text-zinc-800 placeholder-zinc-300 focus:outline-none focus:border-violet-400 transition-colors resize-none leading-relaxed"
          style={{ background: "#fafbfc" }}
        />
        {sourceText.length > 0 && (
          <p className="text-[10px] font-mono text-zinc-400 text-right tabular-nums">
            {sourceText.length.toLocaleString()} chars
          </p>
        )}
      </div>

      {/* User Reaction */}
      <div className="space-y-1">
        <label className="block text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase">
          Your Reaction
        </label>
        <textarea
          value={userReaction}
          onChange={(e) => setUserReaction(e.target.value)}
          placeholder={"どう感じた？\n例: 怒り、虚しさ、共感、不気味さ、笑い..."}
          rows={2}
          className="w-full border border-[#d0d7de] rounded px-2.5 py-2 text-[12px] font-mono text-zinc-800 placeholder-zinc-300 focus:outline-none focus:border-violet-400 transition-colors resize-none leading-relaxed"
          style={{ background: "#fafbfc" }}
        />
      </div>

      {/* Desired Tone + Avoid toggle in one row */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-0.5">
          <label className="block text-[10px] font-mono text-zinc-400 tracking-[0.12em] uppercase">
            Desired Tone{" "}
            <span className="normal-case text-zinc-300">optional</span>
          </label>
          <input
            type="text"
            value={desiredTone}
            onChange={(e) => setDesiredTone(e.target.value)}
            placeholder="obsessive / dark / absurd…"
            className="w-full border border-[#d0d7de] rounded px-2.5 h-7 text-[12px] font-mono text-zinc-800 placeholder-zinc-300 focus:outline-none focus:border-violet-400 transition-colors"
            style={{ background: "#fafbfc" }}
          />
        </div>
      </div>

      {/* Avoid Direct Reference toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div
          onClick={() => setAvoidDirect((v) => !v)}
          className={`w-8 h-4 rounded-full transition-colors shrink-0 relative ${avoidDirect ? "bg-violet-500" : "bg-zinc-300"}`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${avoidDirect ? "left-4" : "left-0.5"}`}
          />
        </div>
        <span className="text-[12px] font-mono text-zinc-600">固有名詞・直接参照を完全除去</span>
      </label>

      {/* Transmute button */}
      <button
        onClick={handleTransmute}
        disabled={!hasSource || isTransmuting}
        className={`w-full h-9 font-mono font-bold text-[13px] tracking-widest rounded border transition-all disabled:cursor-not-allowed ${
          isTransmuting
            ? "border-violet-300 text-violet-400 bg-violet-50 animate-pulse"
            : hasSource
            ? "border-violet-500 text-violet-600 hover:bg-violet-600 hover:text-white hover:border-violet-600 active:scale-[0.98]"
            : "border-[#d0d7de] text-zinc-400"
        }`}
      >
        {isTransmuting ? "TRANSMUTING …" : "⚗  TRANSMUTE"}
      </button>

      {/* Error */}
      {error && (
        <div className="border border-red-200 rounded-lg px-3 py-2 text-[11px] font-mono text-red-600 bg-red-50 leading-snug">
          {error}
        </div>
      )}

      {/* Result */}
      {result && !isTransmuting && (
        <div className="border border-violet-200 rounded-lg overflow-hidden">

          {/* Header bar */}
          <div
            className="flex items-center justify-between px-3 py-1.5 border-b border-violet-100"
            style={{ background: "#f5f0ff" }}
          >
            <span className="text-[10px] font-mono text-violet-600 tracking-widest font-semibold">
              TRANSMUTATION RESULT
            </span>
            <button
              onClick={() => setResult(null)}
              className="text-[11px] font-mono text-violet-400 hover:text-violet-700 transition-colors"
              title="Clear"
            >
              ✕
            </button>
          </div>

          <div className="px-3 py-2.5 space-y-3" style={{ background: "#fefcff" }}>

            {/* Source abstracted */}
            {result.sourceSummary && (
              <p
                className="text-[12px] font-mono text-zinc-600 italic leading-snug pl-2"
                style={{ borderLeft: "2px solid #ddd6fe" }}
              >
                {result.sourceSummary}
              </p>
            )}

            {/* Reaction Core */}
            {result.reactionCore.length > 0 && (
              <ExpRow label="Reaction Core">
                <div className="flex flex-wrap gap-1">
                  {result.reactionCore.map((r) => (
                    <Chip key={r} label={r} variant="violet" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Universal Themes */}
            {result.universalThemes.length > 0 && (
              <ExpRow label="Universal Themes">
                <div className="flex flex-wrap gap-1">
                  {result.universalThemes.map((t) => (
                    <Chip key={t} label={t} variant="purple" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Song World */}
            {result.songWorld.length > 0 && (
              <ExpRow label="Song World">
                <div className="space-y-0.5">
                  {result.songWorld.map((s, i) => (
                    <p key={i} className="text-[12px] font-mono text-zinc-700 leading-snug">
                      · {s}
                    </p>
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Metaphors */}
            {result.metaphors.length > 0 && (
              <ExpRow label="Metaphors">
                <div className="flex flex-wrap gap-1">
                  {result.metaphors.map((m) => (
                    <Chip key={m} label={m} variant="amber" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Chorus Hook Ideas */}
            {result.chorusHookIdeas.length > 0 && (
              <ExpRow label="Chorus Hook Ideas">
                <div className="space-y-0.5">
                  {result.chorusHookIdeas.map((h, i) => (
                    <p key={i} className="text-[12px] font-mono text-zinc-500 leading-snug italic">
                      "{h}"
                    </p>
                  ))}
                </div>
              </ExpRow>
            )}

            {/* World Seed CTA */}
            {result.worldSeed && (
              <div
                className="rounded-lg border border-violet-200 px-3 py-2.5 space-y-2"
                style={{ background: "#f5f0ff" }}
              >
                <span className="text-[9px] font-mono text-violet-500 tracking-[0.18em] uppercase font-semibold">
                  Generated World Seed
                </span>
                <p className="text-[12px] font-mono text-zinc-800 leading-relaxed">
                  {result.worldSeed}
                </p>
                <button
                  onClick={handleSetWorldSeed}
                  className={`w-full h-8 font-mono font-bold text-[12px] tracking-wider rounded border transition-all active:scale-[0.98] ${
                    seedApplied
                      ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                      : "border-violet-400 text-violet-700 hover:bg-violet-600 hover:text-white"
                  }`}
                >
                  {seedApplied ? "✓ World Seed に設定しました" : "→ Set as World Seed"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
