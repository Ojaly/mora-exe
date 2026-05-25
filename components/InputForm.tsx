"use client";

import { SongInput } from "@/types";

interface Props {
  input: SongInput;
  onChange: (updated: SongInput) => void;
  onAnalyze: () => void;
}

const L = "block text-[10px] font-mono text-zinc-500 mb-1 tracking-widest uppercase";
const I =
  "w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-600 transition-colors placeholder:text-zinc-700";

export default function InputForm({ input, onChange, onAnalyze }: Props) {
  const set =
    (k: keyof SongInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ ...input, [k]: e.target.value });
  const setCheck =
    (k: keyof SongInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...input, [k]: e.target.checked });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={L}>Title</label>
          <input className={I} value={input.title} onChange={set("title")} placeholder="曲タイトル" />
        </div>
        <div>
          <label className={L}>Genre</label>
          <select className={I} value={input.genre} onChange={set("genre")}>
            <option value="">—</option>
            <option value="jpop">J-Pop</option>
            <option value="jrock">J-Rock</option>
            <option value="city">City Pop</option>
            <option value="anime">Anime OST</option>
            <option value="vocaloid">Vocaloid</option>
            <option value="electronic">Electronic</option>
            <option value="rnb">R&amp;B</option>
            <option value="hiphop">Hip-Hop</option>
            <option value="folk">Folk</option>
            <option value="metal">Metal</option>
            <option value="jazz">Jazz</option>
            <option value="ambient">Ambient</option>
          </select>
        </div>
        <div>
          <label className={L}>BPM</label>
          <input className={I} type="number" min="40" max="240" value={input.bpm} onChange={set("bpm")} placeholder="120" />
        </div>
        <div>
          <label className={L}>Mood</label>
          <select className={I} value={input.mood} onChange={set("mood")}>
            <option value="">—</option>
            <option value="melancholic">メランコリック</option>
            <option value="energetic">エネルギッシュ</option>
            <option value="dreamy">ドリーミー</option>
            <option value="dark">ダーク</option>
            <option value="uplifting">アップリフティング</option>
            <option value="nostalgic">ノスタルジック</option>
            <option value="aggressive">アグレッシブ</option>
            <option value="romantic">ロマンティック</option>
            <option value="epic">エピック</option>
            <option value="chill">チル</option>
          </select>
        </div>
        <div>
          <label className={L}>Vocal</label>
          <select className={I} value={input.vocalType} onChange={set("vocalType")}>
            <option value="">—</option>
            <option value="female">女性</option>
            <option value="male">男性</option>
            <option value="duet">デュエット</option>
            <option value="choir">コーラス</option>
            <option value="falsetto">ファルセット</option>
            <option value="rap">ラップ</option>
            <option value="vocaloid">Vocaloid</option>
          </select>
        </div>
        <div>
          <label className={L}>EN Ratio</label>
          <select className={I} value={input.englishRatio} onChange={set("englishRatio")}>
            <option value="low">低（JP主体）</option>
            <option value="mixed">中（JP+EN）</option>
            <option value="high">高（EN主体）</option>
          </select>
        </div>
      </div>

      <div>
        <label className={L}>Lyrics</label>
        <textarea
          className={`${I} h-40 resize-y leading-relaxed`}
          value={input.lyrics}
          onChange={set("lyrics")}
          placeholder={"[Verse]\n君の声が聞こえる\n遠くなる前に\n\n[Chorus]\nlose control\nfeel alive..."}
        />
        <p className="text-[10px] text-zinc-700 font-mono mt-1">[Verse] [Chorus] [Bridge] タグ対応</p>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" className="w-3 h-3 accent-cyan-500" checked={input.startWithChorus} onChange={setCheck("startWithChorus")} />
          <span className="text-xs font-mono text-zinc-400">サビ頭</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" className="w-3 h-3 accent-pink-500" checked={input.avoidAiCliche} onChange={setCheck("avoidAiCliche")} />
          <span className="text-xs font-mono text-zinc-400">AI臭さ回避</span>
        </label>
      </div>

      <button
        onClick={onAnalyze}
        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs tracking-widest rounded transition-colors"
      >
        [ ANALYZE ]
      </button>
    </div>
  );
}
