"use client";

import { MusicDirection } from "@/types";

interface Props {
  direction: MusicDirection;
}

/**
 * MORA.exe's interpretation of what the world sounds like.
 * Displayed as 4-5 poetic lines — NOT a settings form.
 */
export default function MusicDirectionPanel({ direction }: Props) {
  // Build at most 5 lines, each a "vibe statement"
  const lines: string[] = [];

  if (direction.genreHint)   lines.push(direction.genreHint);
  if (direction.atmosphere)  lines.push(direction.atmosphere);
  if (direction.vocalStyle)  lines.push(direction.vocalStyle);

  const tempoLine = [
    direction.tempoFeel,
    direction.bpmEstimate ? `~${direction.bpmEstimate} BPM` : "",
  ].filter(Boolean).join("  ");
  if (tempoLine) lines.push(tempoLine);

  if (direction.instruments.length > 0) {
    lines.push(direction.instruments.slice(0, 3).join(" · "));
  }

  return (
    <div>
      <span className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase font-semibold">
        DETECTED DIRECTION
      </span>
      <div
        className="mt-1.5 pl-3 space-y-[3px]"
        style={{ borderLeft: "2px solid #bfdbfe" }}  /* blue-200 */
      >
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-[12px] font-mono leading-snug"
            style={{
              color: i === 0 ? "#1e40af" : "#374151",  /* first line accent, rest zinc-700 */
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {line}
          </p>
        ))}
      </div>
      {direction.source === "rule" && (
        <p className="text-[9px] font-mono text-zinc-400 mt-1 pl-3">
          rule-based estimate — forge with Claude for richer inference
        </p>
      )}
    </div>
  );
}
