import { PhraseMatch, SyntaxMatch } from "@/types";

interface Props {
  phraseMatches: PhraseMatch[];
  syntaxMatches: SyntaxMatch[];
}

export default function PhraseWarnings({ phraseMatches, syntaxMatches }: Props) {
  const total = phraseMatches.length + syntaxMatches.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-mono tracking-widest">// PHRASE DETECTION</p>
        {total > 0 && (
          <span className="text-[10px] font-mono text-pink-700 border border-pink-300 bg-pink-50 rounded px-1.5">
            {total} FOUND
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-emerald-200 bg-emerald-50">
          <span className="text-emerald-700 font-mono text-xs">✓</span>
          <span className="text-xs text-emerald-700 font-mono">クリーン</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {phraseMatches.map((m, i) => (
            <div
              key={`p-${i}`}
              className="border border-[#E2E8F0] bg-slate-50 rounded px-2 py-1.5 space-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">L{m.lineNumber}</span>
                <span className="text-[10px] font-mono text-pink-700 bg-pink-50 border border-pink-200 px-1.5 rounded">
                  &quot;{m.phrase}&quot;
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">word</span>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono truncate">{m.lineText}</p>
              <p className="text-[10px] text-zinc-600">
                <span className="text-slate-400">→ </span>{m.suggestion}
              </p>
            </div>
          ))}
          {syntaxMatches.map((m, i) => (
            <div
              key={`s-${i}`}
              className="border border-[#E2E8F0] bg-slate-50 rounded px-2 py-1.5 space-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">L{m.lineNumber}</span>
                <span className="text-[10px] font-mono text-orange-700 bg-orange-50 border border-orange-200 px-1.5 rounded">
                  {m.label}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">syntax</span>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono truncate">
                &quot;{m.matchedText}&quot; in {m.lineText}
              </p>
              <p className="text-[10px] text-zinc-600">
                <span className="text-slate-400">→ </span>{m.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
