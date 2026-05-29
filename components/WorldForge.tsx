"use client";

import { useState } from "react";
import { WorldExpansion } from "@/types";
import MusicDirectionPanel from "@/components/MusicDirectionPanel";
import { ruleBasedForge } from "@/lib/ruleBasedForge";

// SAFE SWITCH: Tauri invoke path removed until forge_world timeout/env is verified.
// To re-enable: detect `typeof window !== "undefined" && "__TAURI_INTERNALS__" in window`
// and add a dynamic import("@tauri-apps/api/core") invoke branch back to handleForge.

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  worldSeed: string;
  onWorldSeedChange: (v: string) => void;
  onApplyToPrompt: (stylePrompt: string) => void;
  expansion: WorldExpansion | null;
  onExpansionChange: (e: WorldExpansion | null) => void;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "blue" | "violet" | "amber" | "emerald" | "rose";
}) {
  const cls: Record<string, string> = {
    default:  "border-[#d0d7de]  text-zinc-600  bg-white",
    blue:     "border-blue-200   text-blue-700   bg-blue-50",
    violet:   "border-violet-200 text-violet-700 bg-violet-50",
    amber:    "border-amber-200  text-amber-700  bg-amber-50",
    emerald:  "border-emerald-200 text-emerald-700 bg-emerald-50",
    rose:     "border-rose-200   text-rose-700   bg-rose-50",
  };
  return (
    <span
      className={`inline-block px-1.5 py-[2px] text-[11px] font-mono rounded border leading-tight ${cls[variant]}`}
    >
      {label}
    </span>
  );
}

// ─── ExpansionRow ─────────────────────────────────────────────────────────────

function ExpRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-mono text-zinc-500 tracking-[0.12em] uppercase font-semibold">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorldForge({
  worldSeed,
  onWorldSeedChange,
  onApplyToPrompt,
  expansion,
  onExpansionChange,
}: Props) {
  const [isForging, setIsForging] = useState(false);
  const [applyFlash, setApplyFlash] = useState(false);

  // Derive source from expansion instead of keeping separate state
  const source = expansion?.musicDirection.source ?? null;

  // ─── Forge handler ────────────────────────────────────────────────────────

  const handleForge = async () => {
    if (!worldSeed.trim() || isForging) return;
    setIsForging(true);
    onExpansionChange(null);

    const seed = worldSeed.trim();

    try {
      // ── Dev / web: use Next.js API route ────────────────────────────────
      const res = await fetch("/api/ai/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldSeed: seed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WorldExpansion = await res.json();
      onExpansionChange(data);
    } catch (err) {
      console.error("[WorldForge] forge failed:", err);
      onExpansionChange(ruleBasedForge(seed));
    } finally {
      setIsForging(false);
    }
  };

  const handleApply = () => {
    if (!expansion) return;
    onApplyToPrompt(expansion.stylePromptDraft);
    setApplyFlash(true);
    setTimeout(() => setApplyFlash(false), 2000);
  };

  const hasContent = worldSeed.trim().length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2.5">

      {/* World Seed input */}
      <div className="space-y-1.5">
        <textarea
          value={worldSeed}
          onChange={(e) => onWorldSeedChange(e.target.value)}
          placeholder={"退廃的なうどん愛を語る偏執狂\n深夜のラーメン屋で神を待つ男\n企業CMみたいに完璧で不気味なファンク"}
          rows={3}
          className="w-full border border-[#E2E8F0] rounded-md px-2.5 py-2 text-[13px] font-mono text-zinc-800 placeholder-zinc-300 focus:outline-none focus:border-blue-400 transition-colors resize-none leading-relaxed"
          style={{ background: "#fafbfc" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleForge();
          }}
        />
        <p className="text-[12px] font-mono text-zinc-500">⌘Enter で Forge</p>
      </div>

      {/* Forge button */}
      <button
        onClick={handleForge}
        disabled={!hasContent || isForging}
        className={`w-full h-8 font-mono font-bold text-[13px] tracking-widest rounded border transition-all disabled:cursor-not-allowed ${
          isForging
            ? "border-blue-300 text-blue-400 bg-blue-50 animate-pulse"
            : hasContent
            ? "border-[#0969da] text-[#0969da] hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-[0.98]"
            : "border-[#d0d7de] text-zinc-400"
        }`}
      >
        {isForging ? "FORGING …" : "↯  FORGE WORLD"}
      </button>

      {/* Expansion display */}
      {expansion && !isForging && (
        <div
          className="border border-[#d0d7de] rounded-lg overflow-hidden"
          style={{ background: "#ffffff" }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-[#E2E8F0]"
            style={{ background: "#EEF2F6" }}
          >
            <div>
              <span className="text-[11px] font-mono text-zinc-700 tracking-[0.12em] font-bold uppercase">
                FORGED WORLD
              </span>
              <span className="text-[11px] font-mono text-zinc-400 ml-2">— Seedから広げたモチーフ</span>
            </div>
            <div className="flex items-center gap-2">
              {source && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  source === "claude"
                    ? "border-blue-200 text-blue-600 bg-blue-50"
                    : "border-zinc-300 text-zinc-500 bg-zinc-50"
                }`}>
                  {source === "claude" ? "AI" : "RULE"}
                </span>
              )}
              <button
                onClick={() => onExpansionChange(null)}
                className="text-[11px] font-mono text-zinc-400 hover:text-zinc-700 transition-colors"
                title="Clear expansion"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-3 py-2 space-y-2">

            {/* Music Direction — MORA.exe's inference */}
            <MusicDirectionPanel
              direction={expansion.musicDirection}
              lyricsDirection={expansion.lyricsDirection}
            />

            {/* Scene */}
            {expansion.scene.length > 0 && (
              <ExpRow label="Scene">
                <div className="space-y-0.5">
                  {expansion.scene.map((s, i) => (
                    <p key={i} className="text-[13px] font-mono text-zinc-700 leading-snug">
                      {s}
                    </p>
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Emotion */}
            {expansion.emotion.length > 0 && (
              <ExpRow label="Emotion">
                <div className="flex flex-wrap gap-1">
                  {expansion.emotion.map((e) => (
                    <Chip key={e} label={e} variant="rose" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Texture */}
            {expansion.texture.length > 0 && (
              <ExpRow label="Texture">
                <div className="flex flex-wrap gap-1">
                  {expansion.texture.map((t) => (
                    <Chip key={t} label={t} variant="violet" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Objects */}
            {expansion.objects.length > 0 && (
              <ExpRow label="Objects / Motifs">
                <div className="flex flex-wrap gap-1">
                  {expansion.objects.map((o) => (
                    <Chip key={o} label={o} variant="amber" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Contradiction */}
            {expansion.contradiction.length > 0 && (
              <ExpRow label="Contradiction">
                <div className="space-y-0.5">
                  {expansion.contradiction.map((c, i) => (
                    <p
                      key={i}
                      className="text-[11px] font-mono text-zinc-600 leading-snug"
                    >
                      ↔ {c}
                    </p>
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Sound Direction */}
            {expansion.soundDirection.length > 0 && (
              <ExpRow label="Sound Direction">
                <div className="flex flex-wrap gap-1">
                  {expansion.soundDirection.map((s) => (
                    <Chip key={s} label={s} variant="blue" />
                  ))}
                </div>
              </ExpRow>
            )}

            {/* Lyrics direction */}
            {expansion.lyricsDirection && (
              <ExpRow label="Lyrics Direction">
                <p className="text-[13px] font-mono text-zinc-600 leading-snug">
                  {expansion.lyricsDirection}
                </p>
              </ExpRow>
            )}

            {/* Style Prompt Draft (collapsed by default) */}
            <details className="group">
              <summary className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors list-none select-none tracking-widest">
                ▸ Style Prompt Draft
              </summary>
              <pre className="mt-1.5 text-[10px] font-mono text-zinc-600 leading-relaxed whitespace-pre-wrap break-words p-2 rounded border border-[#d0d7de] overflow-y-auto max-h-32" style={{ background: "#f6f8fa" }}>
                {expansion.stylePromptDraft}
              </pre>
            </details>

            {/* Generate Draft button (triggers full lyrics + style generation) */}
            <div>
              <button
                onClick={handleApply}
                className={`w-full h-8 font-mono font-bold text-[13px] tracking-wider rounded border transition-all ${
                  applyFlash
                    ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                    : "border-[#0969da] text-[#0969da] hover:bg-[#0969da] hover:text-white active:scale-[0.98]"
                }`}
              >
                {applyFlash ? "✓ Generating…" : "▶ GENERATE DRAFT"}
              </button>
              <p className="text-[11px] font-mono text-zinc-500 text-center mt-1 leading-snug">
                このWorldからStyle + Lyricsを一括生成
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
