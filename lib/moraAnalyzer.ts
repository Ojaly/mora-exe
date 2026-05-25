import { DangerLevel, MoraLine, SongStats } from "@/types";

const SMALL_KANA = new Set("ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ");
const SOKUON = new Set("っッ");

function countJapaneseMora(text: string): number {
  let count = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const isHira = code >= 0x3041 && code <= 0x3096;
    const isKata = code >= 0x30a1 && code <= 0x30f6;
    if ((isHira || isKata) && !SMALL_KANA.has(ch) && !SOKUON.has(ch)) count++;
    else if (ch === "ー") count++;
  }
  return count;
}

function countKanjiMora(text: string): number {
  let count = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff)
    )
      count += 2;
  }
  return count;
}

function countEnglishSyllables(text: string): number {
  let total = 0;
  for (const word of text.match(/[a-zA-Z]+/g) ?? []) {
    const lower = word.toLowerCase();
    const vowelGroups = lower.match(/[aeiouy]+/g)?.length ?? 1;
    const silentE =
      lower.length > 2 &&
      lower.endsWith("e") &&
      !/[aeiouy]/.test(lower[lower.length - 2]);
    total += Math.max(1, vowelGroups - (silentE ? 1 : 0));
  }
  return total;
}

function countNumberMora(text: string): number {
  let total = 0;
  for (const numStr of text.match(/\d+/g) ?? []) {
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
  if (mora <= 3) return { level: "short", warning: "短すぎ：メリスマ化・引き伸ばしが発生しやすい" };
  if (mora <= 14) return { level: "safe", warning: "" };
  return { level: "long", warning: "長すぎ：Sunoが小節を伸ばすか詰め込む可能性あり" };
}

export function analyzeLyrics(lyrics: string): MoraLine[] {
  return lyrics.split("\n").map((text, i) => {
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

function enRatio(text: string): number {
  const clean = text.replace(/\s/g, "");
  if (!clean) return 0;
  return (clean.match(/[a-zA-Z]/g) ?? []).length / clean.length;
}

export function calcSongStats(moraLines: MoraLine[], lyrics: string): SongStats {
  const content = moraLines.filter(
    (l) => l.warning !== "空行" && l.warning !== "メタタグ行"
  );
  const moraCounts = content.map((l) => l.moraCount).filter((m) => m > 0);
  const avgMora =
    moraCounts.length ? moraCounts.reduce((a, b) => a + b, 0) / moraCounts.length : 0;
  const maxMora = moraCounts.length ? Math.max(...moraCounts) : 0;
  const dangerCount = content.filter((l) => l.danger !== "safe").length;

  const lines = lyrics.split("\n").map((l) => l.trim()).filter(Boolean);
  const enAvg =
    lines.length
      ? lines.reduce((s, l) => s + enRatio(l), 0) / lines.length
      : 0;

  // リスクスコア: 100から減点
  let score = 100;
  score -= content.filter((l) => l.danger === "long").length * 8;
  score -= content.filter((l) => l.danger === "short").length * 4;
  score = Math.max(0, score);

  return {
    totalLines: moraLines.length,
    contentLines: content.length,
    avgMora: Math.round(avgMora * 10) / 10,
    maxMora,
    dangerCount,
    enRatioAvg: Math.round(enAvg * 100),
    riskScore: score,
  };
}
