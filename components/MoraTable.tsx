import { MoraLine } from "@/types";

interface Props {
  lines: MoraLine[];
}

const DANGER_STYLE = {
  safe: {
    cell: "text-gray-800",
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
    label: "OK",
  },
  short: {
    cell: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "短",
  },
  long: {
    cell: "text-red-700",
    badge: "bg-red-50 text-red-700 border border-red-200",
    label: "長",
  },
};

export default function MoraTable({ lines }: Props) {
  const dangerLines = lines.filter(
    (l) => l.danger !== "safe" && l.warning !== "空行" && l.warning !== "メタタグ行"
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        歌詞モーラ分析
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 text-xs text-gray-400 font-medium w-10">#</th>
              <th className="text-left py-2 px-2 text-xs text-gray-400 font-medium">歌詞行</th>
              <th className="text-right py-2 px-2 text-xs text-gray-400 font-medium w-16">モーラ</th>
              <th className="text-center py-2 px-2 text-xs text-gray-400 font-medium w-16">判定</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const style = DANGER_STYLE[line.danger];
              const isMeta = line.warning === "空行" || line.warning === "メタタグ行";

              if (isMeta) {
                return (
                  <tr key={line.lineNumber} className="border-b border-gray-100">
                    <td className="py-1 px-2 text-gray-300 text-xs">{line.lineNumber}</td>
                    <td className="py-1 px-2 text-gray-300 font-mono text-xs italic">
                      {line.warning === "空行" ? "—" : line.text}
                    </td>
                    <td className="py-1 px-2" />
                    <td className="py-1 px-2" />
                  </tr>
                );
              }

              return (
                <tr key={line.lineNumber} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-400 text-xs">{line.lineNumber}</td>
                  <td className={`py-2 px-2 font-mono text-xs ${style.cell}`}>{line.text}</td>
                  <td className={`py-2 px-2 text-right font-mono font-bold text-sm ${style.cell}`}>
                    {line.moraCount}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dangerLines.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">危険行</h3>
          <div className="space-y-1">
            {dangerLines.map((line) => (
              <div
                key={`danger-${line.lineNumber}`}
                className={`flex items-start gap-2 px-3 py-2 rounded border text-xs ${
                  line.danger === "short"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <span className="shrink-0 font-mono text-gray-400">L{line.lineNumber}</span>
                <span className="font-mono">&quot;{line.text}&quot;</span>
                <span className="ml-auto shrink-0 text-gray-500">→ {line.warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
