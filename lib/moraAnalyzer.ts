import { DangerLevel, MoraLine } from "@/types";

const SMALL_KANA = new Set("ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ");
const SOKUON = new Set("っッ");

function countJapaneseMora(text: string): number {
  let count = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const isHiragana = code >= 0x3041 && code <= 0x3096;
    const isKatakana = code >= 0x30a1 && code <= 0x30f6;
    const isLongVowel = ch === "ー";
    if (isHiragana || isKatakana) {
      if (!SMALL_KANA.has(ch) && !SOKUON.has(ch)) count += 1;
    } else if (isLongVowel) {
      count += 1;
    }
  }
  return count;
}

function countKanjiMora(text: string): number {
  let count = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const isCJK =
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff);
    if (isCJK) count += 2;
  }
  return count;
}

function countEnglishSyllables(text: string): number {
  const words = text.match(/[a-zA-Z]+/g) ?? [];
  let total = 0;
  for (const word of words) {
    const lower = word.toLowerCase();
    const vowelGroups = lower.match(/[aeiouy]+/g)?.length ?? 1;
    const endsWithSilentE =
      lower.length > 2 &&
      lower.endsWith("e") &&
      !/[aeiouy]/.test(lower[lower.length - 2]);
    total += Math.max(1, vowelGroups - (endsWithSilentE ? 1 : 0));
  }
  return total;
}

function countNumberMora(text: string): number {
  const numbers = text.match(/\d+/g) ?? [];
  let total = 0;
  for (const numStr of numbers) {
    const n = parseInt(numStr, 10);
    if (n === 0) total += 3;
    else if (n < 10) total += [2, 1, 2, 2, 2, 2, 3, 3, 2][n - 1] ?? 2;
    else total += Math.ceil(numStr.length * 1.5);
  }
  return total;
}

export function estimateMora(line: string): number {
  return (
    countJapaneseMora(line) +
    countKanjiMora(line) +
    countEnglishSyllables(line) +
    countNumberMora(line)
  );
}

export function getDangerLevel(mora: number): { level: DangerLevel; warning: string } {
  if (mora <= 3) {
    return { level: "short", warning: "短すぎ：メリスマ化・引き伸ばしが発生しやすい" };
  } else if (mora <= 14) {
    return { level: "safe", warning: "" };
  } else {
    return { level: "long", warning: "長すぎ：Sunoが小節を伸ばすか詰め込む可能性あり" };
  }
}

export function analyzeLyrics(lyrics: string): MoraLine[] {
  const lines = lyrics.split("\n");
  return lines.map((text, i) => {
    const trimmed = text.trim();
    if (!trimmed || /^\[.*\]$/.test(trimmed)) {
      return {
        lineNumber: i + 1,
        text: trimmed || text,
        moraCount: 0,
        danger: "safe" as DangerLevel,
        warning: trimmed ? "メタタグ行" : "空行",
      };
    }
    const moraCount = estimateMora(trimmed);
    const { level, warning } = getDangerLevel(moraCount);
    return { lineNumber: i + 1, text: trimmed, moraCount, danger: level, warning };
  });
}
