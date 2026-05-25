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
          <span className="text-[10px] font-mono text-pink-500 border border-pink-900 rounded px-1.5">
            {total} FOUND
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-emerald-900 bg-emerald-950/30">
          <span className="text-emerald-400 font-mono text-xs">✓</span>
          <span className="text-xs text-emerald-400 font-mono">クリーン</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {phraseMatches.map((m, i) => (
            <div
              key={`p-${i}`}
              className="border border-zinc-800 bg-zinc-900/50 rounded px-2 py-1.5 space-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-600">L{m.lineNumber}</span>
                <span className="text-[10px] font-mono text-pink-400 bg-pink-950/50 border border-pink-900/50 px-1.5 rounded">
                  &quot;{m.phrase}&quot;
                </span>
                <span className="text-[10px] text-zinc-700 font-mono">word</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono truncate">{m.lineText}</p>
              <p className="text-[10px] text-zinc-400">
                <span className="text-zinc-600">→ </span>{m.suggestion}
              </p>
            </div>
          ))}
          {syntaxMatches.map((m, i) => (
            <div
              key={`s-${i}`}
              className="border border-zinc-800 bg-zinc-900/50 rounded px-2 py-1.5 space-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-600">L{m.lineNumber}</span>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950/50 border border-orange-900/50 px-1.5 rounded">
                  {m.label}
                </span>
                <span className="text-[10px] text-zinc-700 font-mono">syntax</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                &quot;{m.matchedText}&quot; in {m.lineText}
              </p>
              <p className="text-[10px] text-zinc-400">
                <span className="text-zinc-600">→ </span>{m.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
