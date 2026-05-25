"use client";

import { SongInput } from "@/types";

interface Props {
  input: SongInput;
  onChange: (updated: SongInput) => void;
  onAnalyze: () => void;
}

const labelClass = "block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider";
const inputClass =
  "w-full bg-white border border-gray-300 text-gray-900 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900 transition-colors";

export default function InputForm({ input, onChange, onAnalyze }: Props) {
  const set =
    (key: keyof SongInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange({ ...input, [key]: e.target.value });
    };
  const setCheck =
    (key: keyof SongInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...input, [key]: e.target.checked });
    };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>曲タイトル</label>
          <input
            className={inputClass}
            value={input.title}
            onChange={set("title")}
            placeholder="例: 夜明けの残骸"
          />
        </div>
        <div>
          <label className={labelClass}>ジャンル</label>
          <select className={inputClass} value={input.genre} onChange={set("genre")}>
            <option value="">選択...</option>
            <option value="jpop">J-Pop</option>
            <option value="jrock">J-Rock</option>
            <option value="city">City Pop</option>
            <option value="anime">Anime OST</option>
            <option value="vocaloid">Vocaloid-style</option>
            <option value="electronic">Electronic / Synth-pop</option>
            <option value="rnb">R&amp;B / Soul</option>
            <option value="hiphop">Hip-Hop / Trap</option>
            <option value="folk">Folk / Acoustic</option>
            <option value="metal">Metal / Hard Rock</option>
            <option value="jazz">Jazz / Neo-Soul</option>
            <option value="ambient">Ambient</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>BPM</label>
          <input
            className={inputClass}
            value={input.bpm}
            onChange={set("bpm")}
            placeholder="例: 128"
            type="number"
            min="40"
            max="240"
          />
        </div>
        <div>
          <label className={labelClass}>雰囲気</label>
          <select className={inputClass} value={input.mood} onChange={set("mood")}>
            <option value="">選択...</option>
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
          <label className={labelClass}>ボーカルタイプ</label>
          <select className={inputClass} value={input.vocalType} onChange={set("vocalType")}>
            <option value="">選択...</option>
            <option value="female">女性ボーカル</option>
            <option value="male">男性ボーカル</option>
            <option value="duet">デュエット</option>
            <option value="choir">コーラス</option>
            <option value="falsetto">ファルセット</option>
            <option value="rap">ラップ</option>
            <option value="vocaloid">Vocaloid風</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>英語比率</label>
          <select className={inputClass} value={input.englishRatio} onChange={set("englishRatio")}>
            <option value="low">低（主に日本語）</option>
            <option value="mixed">中（日英混在）</option>
            <option value="high">高（主に英語）</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>歌詞本文</label>
        <textarea
          className={`${inputClass} h-48 resize-y font-mono text-xs leading-relaxed`}
          value={input.lyrics}
          onChange={set("lyrics")}
          placeholder={"[Verse]\n君の声が聞こえる\n遠くなる前に\n\n[Chorus]\nlose control\nfeel alive..."}
        />
        <p className="text-gray-400 text-xs mt-1">[Verse] [Chorus] [Bridge] などのタグも入力可</p>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={input.startWithChorus}
            onChange={setCheck("startWithChorus")}
          />
          <span className="text-sm text-gray-700">サビ頭構成にする</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={input.avoidAiCliche}
            onChange={setCheck("avoidAiCliche")}
          />
          <span className="text-sm text-gray-700">AI臭さを避ける</span>
        </label>
      </div>

      <button
        onClick={onAnalyze}
        className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm rounded transition-colors"
      >
        Analyze &amp; Generate
      </button>
    </div>
  );
}
