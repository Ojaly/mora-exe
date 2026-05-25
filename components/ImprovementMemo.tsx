interface Props {
  memos: string[];
}

export default function ImprovementMemo({ memos }: Props) {
  if (memos.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 font-mono tracking-widest">// IMPROVEMENT MEMO</p>
      <ul className="space-y-1">
        {memos.map((memo, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded px-2 py-1.5"
          >
            <span className="text-cyan-700 shrink-0 font-mono">▸</span>
            {memo}
          </li>
        ))}
      </ul>
    </div>
  );
}
