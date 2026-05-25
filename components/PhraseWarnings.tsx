import { PhraseMatch } from "@/types";

interface Props {
  matches: PhraseMatch[];
}

export default function PhraseWarnings({ matches }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        AI臭いフレーズ検出
        {matches.length > 0 && (
          <span className="ml-2 text-red-500">[{matches.length}]</span>
        )}
      </h2>

      {matches.length === 0 ? (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          検出なし — フレーズはクリーンです
        </p>
      ) : (
        <div className="space-y-2">
          {matches.map((m, i) => (
            <div key={i} className="border border-gray-200 rounded p-3 space-y-1 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">L{m.lineNumber}</span>
                <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-mono">
                  &quot;{m.phrase}&quot;
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono truncate">{m.lineText}</p>
              <p className="text-xs text-gray-700">
                <span className="text-gray-400">代替案: </span>
                {m.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
