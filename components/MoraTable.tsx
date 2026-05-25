import { MoraLine } from "@/types";

interface Props {
  lines: MoraLine[];
}

const ROW = {
  safe:  { bar: "bg-emerald-500", text: "text-zinc-300", badge: "text-emerald-400 border-emerald-800", label: "OK" },
  short: { bar: "bg-amber-400",  text: "text-amber-300", badge: "text-amber-400 border-amber-800",   label: "短" },
  long:  { bar: "bg-red-500",    text: "text-red-300",   badge: "text-red-400 border-red-800",        label: "長" },
};

export default function MoraTable({ lines }: Props) {
  const dangerLines = lines.filter(
    (l) => l.danger !== "safe" && l.warning !== "空行" && l.warning !== "メタタグ行"
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 font-mono tracking-widest">// MORA TABLE</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-1 px-1 text-zinc-600 font-normal w-8">#</th>
              <th className="text-left py-1 px-1 text-zinc-600 font-normal">line</th>
              <th className="text-right py-1 px-1 text-zinc-600 font-normal w-10">M</th>
              <th className="text-center py-1 px-1 text-zinc-600 font-normal w-14"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const isMeta =
                line.warning === "空行" || line.warning === "メタタグ行";
              if (isMeta) {
                return (
                  <tr key={line.lineNumber} className="border-b border-zinc-900/60">
                    <td className="py-0.5 px-1 text-zinc-700">{line.lineNumber}</td>
                    <td className="py-0.5 px-1 text-zinc-700 italic">
                      {line.warning === "空行" ? "—" : line.text}
                    </td>
                    <td /><td />
                  </tr>
                );
              }

              const r = ROW[line.danger];
              const barW = Math.min(Math.round((line.moraCount / 20) * 100), 100);

              return (
                <tr
                  key={line.lineNumber}
                  className="border-b border-zinc-900/60 hover:bg-zinc-900/40 group"
                >
                  <td className="py-1 px-1 text-zinc-600">{line.lineNumber}</td>
                  <td className={`py-1 px-1 ${r.text}`}>
                    <div className="flex flex-col gap-0.5">
                      <span>{line.text}</span>
                      <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.bar} opacity-60`}
                          style={{ width: `${barW}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={`py-1 px-1 text-right font-bold ${r.text}`}>
                    {line.moraCount}
                  </td>
                  <td className="py-1 px-1 text-center">
                    {line.danger !== "safe" && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${r.badge}`}
                      >
                        {r.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dangerLines.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600 font-mono">─ danger lines</p>
          {dangerLines.map((line) => (
            <div
              key={`d-${line.lineNumber}`}
              className={`flex items-start gap-2 px-2 py-1 rounded border text-[10px] font-mono ${
                line.danger === "short"
                  ? "border-amber-900 bg-amber-950/30 text-amber-300"
                  : "border-red-900 bg-red-950/30 text-red-300"
              }`}
            >
              <span className="shrink-0 text-zinc-600">L{line.lineNumber}</span>
              <span className="truncate">&quot;{line.text}&quot;</span>
              <span className="ml-auto shrink-0 text-zinc-600">
                {line.moraCount}M · {line.warning}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
