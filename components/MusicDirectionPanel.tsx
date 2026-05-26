"use client";

import { MusicDirection } from "@/types";

interface Props {
  direction: MusicDirection;
  /** Optional: lyricsDirection from WorldExpansion — shown as "Lyric Angle" */
  lyricsDirection?: string;
}

/**
 * MORA.exe's interpretation of what the world sounds like.
 * Displayed as labeled rows — NOT a settings form.
 */
export default function MusicDirectionPanel({ direction, lyricsDirection }: Props) {
  type Row = { label: string; value: string; highlight?: boolean };
  const rows: Row[] = [];

  if (direction.genreHint) {
    rows.push({ label: "Genre Hint", value: direction.genreHint, highlight: true });
  }
  if (direction.atmosphere) {
    rows.push({ label: "Atmosphere", value: direction.atmosphere });
  }
  if (direction.tempoFeel || direction.bpmEstimate) {
    const tempo = [
      direction.tempoFeel,
      direction.bpmEstimate ? `~${direction.bpmEstimate} BPM` : "",
    ].filter(Boolean).join("  ");
    rows.push({ label: "Tempo Feel", value: tempo });
  }
  if (direction.vocalStyle) {
    rows.push({ label: "Vocal", value: direction.vocalStyle });
  }
  if (direction.instruments.length > 0) {
    rows.push({ label: "Instruments", value: direction.instruments.join(" · ") });
  }

  if (rows.length === 0) return null;

  return (
    <div>
      <span className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase font-semibold">
        DETECTED DIRECTION
      </span>

      <div
        className="mt-1.5 rounded-lg overflow-hidden border"
        style={{ borderColor: "#bfdbfe" }}
      >
        <div className="divide-y" style={{ divideColor: "#dbeafe" } as React.CSSProperties}>
          {rows.map(({ label, value, highlight }) => (
            <div
              key={label}
              className="flex gap-2 px-2.5 py-1.5"
              style={{ background: highlight ? "#eff6ff" : "#ffffff" }}
            >
              <span
                className="text-[9px] font-mono tracking-[0.14em] uppercase shrink-0 pt-[3px] w-[5.5rem]"
                style={{ color: "#93c5fd" }}
              >
                {label}
              </span>
              <span
                className="text-[12px] font-mono leading-snug flex-1"
                style={{
                  color: highlight ? "#1e40af" : "#374151",
                  fontWeight: highlight ? 600 : 400,
                }}
              >
                {value}
              </span>
            </div>
          ))}

          {/* Lyric Angle — from WorldExpansion.lyricsDirection */}
          {lyricsDirection && (
            <div className="flex gap-2 px-2.5 py-1.5" style={{ background: "#f0f7ff" }}>
              <span
                className="text-[9px] font-mono tracking-[0.14em] uppercase shrink-0 pt-[3px] w-[5.5rem]"
                style={{ color: "#93c5fd" }}
              >
                Lyric Angle
              </span>
              <span
                className="text-[12px] font-mono leading-snug flex-1 italic"
                style={{ color: "#1e40af" }}
              >
                {lyricsDirection}
              </span>
            </div>
          )}
        </div>
      </div>

      {direction.source === "rule" && (
        <p className="text-[9px] font-mono text-zinc-400 mt-1 pl-1">
          rule-based estimate — Forge with Claude for richer inference
        </p>
      )}
    </div>
  );
}
