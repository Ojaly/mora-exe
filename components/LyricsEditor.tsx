"use client";

import { useRef, useMemo } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  isSample?: boolean;
  changedLines?: number[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(text: string, changedLines: number[]): string {
  const changed = new Set(changedLines);
  let lineNum = 0;
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return " ";

      if (/^\[[^\]]+\]$/.test(trimmed)) {
        return `<span class="le-tag">${esc(line)}</span>`;
      }

      lineNum++;
      if (changed.has(lineNum)) {
        return `<span class="le-changed">${esc(line)}</span>`;
      }
      return `<span class="le-line">${esc(line)}</span>`;
    })
    .join("\n");
}

// ─── Shared tokens ───────────────────────────────────────────────────────────

const MONO = "font-mono text-[16px] leading-[2.1]";

// ─── Component ───────────────────────────────────────────────────────────────

export default function LyricsEditor({ value, onChange, isSample, changedLines = [] }: Props) {
  const lineNumRef = useRef<HTMLDivElement>(null);
  const preRef     = useRef<HTMLPreElement>(null);
  const taRef      = useRef<HTMLTextAreaElement>(null);

  const lineCount = useMemo(() => value.split("\n").length, [value]);

  const syncScroll = () => {
    const top = taRef.current?.scrollTop ?? 0;
    if (lineNumRef.current) lineNumRef.current.scrollTop = top;
    if (preRef.current)     preRef.current.scrollTop     = top;
  };

  return (
    <div className={`flex-1 min-h-0 flex overflow-hidden transition-opacity ${isSample ? "opacity-[0.42]" : "opacity-100"}`}>

      {/* ── Line numbers ────────────────────────────────────────────────── */}
      <div
        ref={lineNumRef}
        className={`shrink-0 w-11 select-none border-r border-[#d0d7de] ${MONO} text-right`}
        style={{ background: "#eaedf1", overflowY: "hidden", overflowX: "hidden" }}
      >
        <div className="px-2 py-5 text-zinc-400">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>

      {/* ── Editor area ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0 overflow-hidden">
        {/* Highlighted layer */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className={`absolute inset-0 px-4 py-4 ${MONO} whitespace-pre-wrap break-words pointer-events-none select-none`}
          style={{ overflow: "hidden" }}
          dangerouslySetInnerHTML={{ __html: highlight(value, changedLines) }}
        />

        {/* Transparent edit layer */}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          className={`absolute inset-0 px-4 py-4 ${MONO} bg-transparent resize-none focus:outline-none whitespace-pre-wrap`}
          style={{ caretColor: "#38bdf8", color: "transparent" }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
