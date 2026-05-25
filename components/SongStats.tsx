import type { SongStats } from "@/types";

interface Props {
  stats: SongStats;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={`font-mono text-xs font-bold ${
          score >= 80
            ? "text-emerald-400"
            : score >= 50
            ? "text-amber-400"
            : "text-red-400"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

export default function SongStats({ stats }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <StatItem label="LINES" value={`${stats.contentLines}L`} />
      <StatItem label="AVG_M" value={stats.avgMora.toFixed(1)} />
      <StatItem label="MAX_M" value={String(stats.maxMora)} warn={stats.maxMora >= 15} />
      <StatItem label="DANGER" value={String(stats.dangerCount)} warn={stats.dangerCount > 0} />
      <StatItem label="EN%" value={`${stats.enRatioAvg}%`} />
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-zinc-600">SCORE</span>
        <ScoreBar score={stats.riskScore} />
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono text-zinc-600">{label}</span>
      <span
        className={`text-xs font-mono font-bold ${
          warn ? "text-amber-400" : "text-zinc-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
