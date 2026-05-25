interface Props {
  memos: string[];
}

export default function ImprovementMemo({ memos }: Props) {
  if (memos.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">改善メモ</h2>
      <ul className="space-y-1">
        {memos.map((memo, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-2"
          >
            <span className="text-gray-400 shrink-0 mt-0.5">▸</span>
            {memo}
          </li>
        ))}
      </ul>
    </div>
  );
}
