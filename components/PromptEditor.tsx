"use client";

import { useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  isSample?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (!line.trim()) return " "; // preserve blank line height

      // [Tag:] value
      const m = line.match(/^(\[[^\]]+:\])(.*)/);
      if (m) {
        return (
          `<span class="pe-tag">${esc(m[1])}</span>` +
          `<span class="pe-val">${esc(m[2])}</span>`
        );
      }

      // Section tag [Name] without colon (e.g. [Structure:] value contains [...])
      // Already covered above; handle bare [comments] in grey
      if (/^\[.*\]$/.test(line.trim())) {
        return `<span class="pe-section">${esc(line)}</span>`;
      }

      return `<span class="pe-plain">${esc(line)}</span>`;
    })
    .join("\n");
}

// ─── Shared style tokens ─────────────────────────────────────────────────────

const MONO = "font-mono text-[13px] leading-[1.85]";
const PAD  = "px-5 py-4";

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptEditor({ value, onChange, isSample }: Props) {
  const preRef  = useRef<HTMLPreElement>(null);
  const taRef   = useRef<HTMLTextAreaElement>(null);

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop  = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  return (
    <div className={`relative flex-1 min-h-0 overflow-hidden transition-opacity ${isSample ? "opacity-[0.42]" : "opacity-100"}`}>
      {/* ── Highlighted display layer ──────────────────────────────────── */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className={`absolute inset-0 ${PAD} ${MONO} whitespace-pre-wrap break-all pointer-events-none select-none`}
        style={{ overflow: "hidden" }}
        dangerouslySetInnerHTML={{ __html: highlight(value) }}
      />

      {/* ── Transparent editing layer ──────────────────────────────────── */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        className={`absolute inset-0 ${PAD} ${MONO} bg-transparent text-transparent resize-none focus:outline-none whitespace-pre-wrap`}
        style={{ caretColor: "#22d3ee", color: "transparent" }}
        spellCheck={false}
      />
    </div>
  );
}
