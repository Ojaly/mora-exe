import { CollapseRisk } from "@/types";

interface Props {
  risks: CollapseRisk[];
}

const SEV = {
  high:   { label: "HIGH", cls: "", style: { color: "var(--accent-danger-strong)", borderColor: "var(--accent-danger-border)", background: "var(--accent-danger-bg)" } },
  medium: { label: "MED",  cls: "", style: { color: "var(--accent-warning-strong)", borderColor: "var(--accent-warning-border)", background: "var(--accent-warning-bg)" } },
  low:    { label: "LOW",  cls: "text-zinc-600 border-[#E2E8F0] bg-slate-50", style: {} },
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
          {high   > 0 && <span style={{ color: "var(--accent-danger)" }}>{high}H</span>}
          {medium > 0 && <span style={{ color: "var(--accent-warning)" }}>{medium}M</span>}
          {low    > 0 && <span className="text-zinc-500">{low}L</span>}
          {risks.length === 0 && <span className="text-emerald-600">CLEAN</span>}
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-emerald-200 bg-emerald-50">
          <span className="text-emerald-700 font-mono text-xs">✓</span>
          <span className="text-xs text-emerald-700 font-mono">崩壊リスクなし</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {risks.map((r) => {
            const s = SEV[r.severity];
            return (
              <div
                key={r.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded border text-xs font-mono ${s.cls}`}
                style={s.style}
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
