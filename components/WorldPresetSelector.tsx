"use client";

import { WorldPresetKey } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";

interface Props {
  selected: WorldPresetKey | "";
  onChange: (key: WorldPresetKey | "") => void;
}

export default function WorldPresetSelector({ selected, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 font-mono tracking-widest">// WORLD PRESET</p>
      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(WORLD_PRESETS) as WorldPresetKey[]).map((key) => {
          const preset = WORLD_PRESETS[key];
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => onChange(active ? "" : key)}
              title={preset.description}
              className={`px-2 py-1.5 text-xs font-mono font-bold rounded border transition-all ${
                active
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
              }`}
              style={active ? { borderColor: preset.accentColor, color: preset.accentColor } : {}}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs text-zinc-500 font-mono">
          <span className="text-zinc-600">▸ </span>
          {WORLD_PRESETS[selected as WorldPresetKey].description}
        </p>
      )}
    </div>
  );
}
