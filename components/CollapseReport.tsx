import { CollapseRisk } from "@/types";

interface Props {
  risks: CollapseRisk[];
}

const SEV = {
  high:   { label: "HIGH", cls: "text-red-400 border-red-800 bg-red-950/50" },
  medium: { label: "MED",  cls: "text-amber-400 border-amber-800 bg-amber-950/40" },
  low:    { label: "LOW",  cls: "text-zinc-400 border-zinc-700 bg-zinc-900/60" },
};

const TYPE_ICON: Record<string, string> = {
  "english-spike":    "EN↑",
  "consonant-cluster":"CCL",
  "long-vowel-chain": "ーーー",
  "mora-overload":    "M++",
  "too-short":        "M--",
  "lang-switch":      "JP↔EN",
};

export default function CollapseReport({ risks }: Props) {
  const high   = risks.filter((r) => r.severity === "high").length;
  const medium = risks.filter((r) => r.severity === "medium").length;
  const low    = risks.filter((r) => r.severity === "low").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-mono tracking-widest">// COLLAPSE PREDICTION</p>
        <div className="flex items-center gap-2 font-mono text-xs">
          {high   > 0 && <span className="text-red-400">{high}H</span>}
          {medium > 0 && <span className="text-amber-400">{medium}M</span>}
          {low    > 0 && <span className="text-zinc-500">{low}L</span>}
          {risks.length === 0 && <span className="text-emerald-500">CLEAN</span>}
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-emerald-900 bg-emerald-950/30">
          <span className="text-emerald-400 font-mono text-xs">✓</span>
          <span className="text-xs text-emerald-400 font-mono">崩壊リスクなし</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {risks.map((r) => {
            const s = SEV[r.severity];
            return (
              <div
                key={r.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded border text-xs font-mono ${s.cls}`}
              >
                <span className="shrink-0 opacity-60 w-14 text-center border border-current/30 rounded px-1">
                  {TYPE_ICON[r.type] ?? r.type}
                </span>
                <span className="shrink-0 opacity-50">
                  L{r.lineNumbers.join(",")}
                </span>
                <span className="flex-1 min-w-0">
                  {r.description}
                  <span className="block text-zinc-600 mt-0.5 font-sans text-[10px] leading-tight">
                    {r.suggestion}
                  </span>
                </span>
                <span className={`shrink-0 font-bold text-[10px] opacity-70`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
