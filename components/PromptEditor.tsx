"use client";

import { useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  isSample?: boolean;
  placeholder?: string;
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

const MONO = "font-mono text-[16px] leading-[2.2]";
const PAD  = "px-6 py-6";

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptEditor({ value, onChange, isSample, placeholder }: Props) {
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

      {/* ── Placeholder overlay (empty state) ─────────────────────────── */}
      {!value && placeholder && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none px-8 py-12"
        >
          <div className="border border-dashed border-[#94A3B8] rounded-2xl bg-[#F8FAFC] px-8 py-10 text-center max-w-sm w-full" style={{ boxShadow: "inset 0 1px 4px rgba(15,23,42,0.04)" }}>
            <div className="text-[28px] mb-3 text-[#94A3B8]">✦</div>
            <p className="font-mono text-[13px] font-semibold text-[#475569] leading-relaxed">{placeholder}</p>
            <p className="font-mono text-[12px] text-[#94A3B8] mt-2 leading-relaxed">Seed を書いて Generate してください</p>
          </div>
        </div>
      )}

      {/* ── Transparent editing layer ──────────────────────────────────── */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        className={`absolute inset-0 ${PAD} ${MONO} bg-transparent text-transparent resize-none focus:outline-none whitespace-pre-wrap`}
        style={{ caretColor: "#38bdf8", color: "transparent" }}
        spellCheck={false}
      />
    </div>
  );
}
