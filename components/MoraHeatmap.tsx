import { MoraLine } from "@/types";

interface Props {
  lines: MoraLine[];
}

const MAX_DISPLAY_MORA = 20;

export default function MoraHeatmap({ lines }: Props) {
  const content = lines.filter(
    (l) => l.warning !== "空行" && l.warning !== "メタタグ行"
  );

  if (content.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 font-mono tracking-widest">// MORA HEATMAP</p>
      <div className="flex flex-wrap gap-0.5 items-end">
        {content.map((line) => {
          const pct = Math.min(line.moraCount / MAX_DISPLAY_MORA, 1);
          const h = Math.max(4, Math.round(pct * 32));
          const color =
            line.danger === "long"
              ? "bg-red-500"
              : line.danger === "short"
              ? "bg-amber-400"
              : "bg-emerald-500";

          return (
            <div
              key={line.lineNumber}
              className="relative group"
              title={`L${line.lineNumber}: ${line.text.slice(0, 24)}… (${line.moraCount}モーラ)`}
            >
              <div
                className={`w-2 rounded-sm opacity-80 hover:opacity-100 transition-opacity ${color}`}
                style={{ height: `${h}px` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                L{line.lineNumber} · {line.moraCount}モーラ
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />4–14</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1" />0–3</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1" />15+</span>
      </div>
    </div>
  );
}
