import { RewriteMode, SectionTarget } from "@/types";
import { AI_CLICHE_PHRASES } from "@/lib/phraseDetector";
import { estimateMora } from "@/lib/moraAnalyzer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function processLines(
  lyrics: string,
  fn: (line: string, isTag: boolean) => string
): string {
  return lyrics
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      const isTag = /^\[.*\]$/.test(trimmed);
      return fn(trimmed, isTag);
    })
    .join("\n");
}

function processSection(
  lyrics: string,
  targetTag: string,
  fn: (lines: string[]) => string[]
): string {
  const sections = lyrics.split(/(?=\[)/);
  return sections
    .map((section) => {
      const tagMatch = section.match(/^\[([^\]]+)\]/);
      if (!tagMatch) return section;
      const tag = tagMatch[1].toLowerCase();
      const t = targetTag.toLowerCase();
      // Exact match or numbered sub-tag (e.g. "verse 1", "verse 2").
      // Prevents "chorus" from matching "pre-chorus" via substring.
      if (tag !== t && !tag.startsWith(t + " ")) return section;
      const lines = section.split("\n");
      const header = lines[0];
      const body = fn(lines.slice(1));
      return [header, ...body].join("\n");
    })
    .join("");
}

// ─── Mode implementations ────────────────────────────────────────────────────

function removeAiCliches(lyrics: string): string {
  let result = lyrics;
  for (const entry of AI_CLICHE_PHRASES) {
    const regex = new RegExp(entry.phrase, "gi");
    const alt = entry.suggestion.match(/"([^"]+)"/)?.[1] ?? entry.phrase;
    result = result.replace(regex, alt);
  }
  return result;
}

function shortenMora(lyrics: string): string {
  return processLines(lyrics, (line, isTag) => {
    if (isTag || !line) return line;
    const mora = estimateMora(line);
    if (mora <= 12) return line;
    // Split at 、or at particle mid-point
    const commaIdx = line.search(/[、,]/);
    if (commaIdx > 0 && commaIdx < line.length - 1) {
      return line.slice(0, commaIdx).trim();
    }
    // Cut at ~60% length
    return line.slice(0, Math.floor(line.length * 0.65)).trim();
  });
}

function moreJapanese(lyrics: string): string {
  const EN_TO_JP: [RegExp, string][] = [
    [/\bnight\b/gi, "夜"],
    [/\blight\b/gi, "光"],
    [/\bdream\b/gi, "夢"],
    [/\blove\b/gi, "愛"],
    [/\bheart\b/gi, "心"],
    [/\btime\b/gi, "時間"],
    [/\bworld\b/gi, "世界"],
    [/\bsky\b/gi, "空"],
    [/\bstar\b/gi, "星"],
    [/\bfire\b/gi, "炎"],
    [/\brun\b/gi, "走る"],
    [/\bfade\b/gi, "消えていく"],
    [/\balone\b/gi, "一人で"],
    [/\bsilence\b/gi, "静寂"],
    [/\bpain\b/gi, "痛み"],
  ];
  let result = lyrics;
  for (const [pattern, replacement] of EN_TO_JP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function moreEnglish(lyrics: string): string {
  const JP_INSERTS: [RegExp, string][] = [
    [/夜/g, "night"],
    [/光/g, "light"],
    [/夢/g, "dream"],
    [/愛/g, "love"],
    [/心/g, "heart"],
    [/空/g, "sky"],
    [/時間/g, "time"],
    [/世界/g, "world"],
    [/星/g, "star"],
    [/炎/g, "fire"],
  ];
  let result = lyrics;
  // Replace ~30% of matches
  let replaceCount = 0;
  for (const [pattern, replacement] of JP_INSERTS) {
    result = result.replace(pattern, (match) => {
      if (replaceCount++ % 2 === 0) return replacement;
      return match;
    });
  }
  return result;
}

const DARK_VOCAB: [RegExp, string][] = [
  [/消えていく/g, "崩れ落ちていく"],
  [/静かに/g, "冷たく"],
  [/新しい/g, "終わりない"],
  [/前へ/g, "奈落へ"],
  [/大丈夫/g, "もう終わり"],
  [/光/g, "闇"],
  [/希望/g, "絶望"],
  [/笑/g, "泣き"],
  [/愛/g, "憎しみ"],
  [/幸せ/g, "孤独"],
];

function makeDarker(lyrics: string): string {
  let result = lyrics;
  for (const [pattern, replacement] of DARK_VOCAB) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function makeCatchy(lyrics: string): string {
  return processLines(lyrics, (line, isTag) => {
    if (isTag || !line) return line;
    const mora = estimateMora(line);
    if (mora > 10) {
      // Shorten to first clause
      const commaIdx = line.search(/[、,\s]/);
      if (commaIdx > 2) return line.slice(0, commaIdx).trim();
    }
    return line;
  });
}

function makeDanceable(lyrics: string): string {
  return processLines(lyrics, (line, isTag) => {
    if (isTag || !line) return line;
    const mora = estimateMora(line);
    if (mora > 8) {
      const mid = Math.floor(line.length / 2);
      const space = line.indexOf("　", mid - 3);
      if (space > 0) return line.slice(0, space).trim();
    }
    return line;
  });
}

function strengthenChorus(lyrics: string): string {
  return processSection(lyrics, "chorus", (lines) => {
    const emphasisWords = ["ずっと", "絶対に", "今だけは", "もう一度"];
    return lines.map((line, i) => {
      if (!line.trim() || /^\[.*\]$/.test(line.trim())) return line;
      if (i === 0 && !line.startsWith("ずっと") && !line.startsWith("絶対")) {
        return emphasisWords[i % emphasisWords.length] + "　" + line.trim();
      }
      return line;
    });
  });
}

// ─── Poetic ──────────────────────────────────────────────────────────────────

function makePoetic(lyrics: string): string {
  return processLines(lyrics, (line, isTag) => {
    if (isTag || !line) return line;
    // Remove over-explanatory connectives
    return line
      .replace(/だから\s*/g, "")
      .replace(/なぜなら\s*/g, "")
      .replace(/つまり\s*/g, "")
      .replace(/そして\s*/g, "")
      .replace(/という\s*/g, "の")
      .replace(/ことが大切/g, "")
      .trim();
  });
}

// ─── Ironic ───────────────────────────────────────────────────────────────────

function makeIronic(lyrics: string): string {
  const IRONIC_SUBSTITUTIONS: [RegExp, string][] = [
    [/完璧な/g,   "完璧のふりをした"],
    [/幸せだ/g,   "幸せに見える"],
    [/幸せを/g,   "幸せらしきものを"],
    [/笑っている/g, "笑ってみせている"],
    [/笑う/g,     "笑ってみせる"],
    [/大丈夫/g,   "大丈夫と呟く"],
    [/信じてる/g, "信じるふりをしてる"],
    [/愛してる/g, "愛しているような気がする"],
    [/本当の/g,   "本当らしい"],
    [/永遠に/g,   "永遠というやつに"],
  ];
  let result = lyrics;
  for (const [pattern, replacement] of IRONIC_SUBSTITUTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ─── ojaly ───────────────────────────────────────────────────────────────────

const OJALY_TRANSFORMS: [RegExp, string][] = [
  [/街の灯り/g, "ネオンが滲む"],
  [/静寂/g, "サーバーの残響"],
  [/走り出す/g, "接続を切って走る"],
  [/夜/g, "0時02分"],
  [/消えていく/g, "ログアウトしていく"],
  [/忘れられない/g, "キャッシュに残ってる"],
  [/時間/g, "タイムスタンプ"],
  [/世界/g, "このネットワーク"],
  [/心/g, "コア"],
  [/泣いて/g, "エラーを吐いて"],
];

function ojalyStyle(lyrics: string): string {
  let result = lyrics;
  let patternsApplied = 0;
  for (const [pattern, replacement] of OJALY_TRANSFORMS) {
    if (patternsApplied >= 4) break;
    const before = result;
    result = result.replace(pattern, replacement); // replace all occurrences of this pattern
    if (result !== before) patternsApplied++;       // count only if something changed
  }
  return result;
}

// ─── Section-scoped fallback helper ──────────────────────────────────────────

function sectionTagForTarget(target: SectionTarget): string {
  const map: Record<SectionTarget, string> = {
    all: "", chorus: "chorus", verse: "verse",
    "pre-chorus": "pre-chorus", bridge: "bridge",
  };
  return map[target];
}

/**
 * Applies `fn` only to sections matching `target`.
 * Uses the same exact-match rule as processSection to prevent chorus/pre-chorus confusion.
 */
function applyToSection(
  lyrics: string,
  target: SectionTarget,
  fn: (text: string) => string
): string {
  if (target === "all") return fn(lyrics);
  const t = sectionTagForTarget(target).toLowerCase();
  const sections = lyrics.split(/(?=\[)/);
  return sections
    .map((section) => {
      const tagMatch = section.match(/^\[([^\]]+)\]/);
      if (!tagMatch) return section;
      const tag = tagMatch[1].toLowerCase();
      if (tag !== t && !tag.startsWith(t + " ")) return section;
      return fn(section);
    })
    .join("");
}

/**
 * Merges Claude-rewritten lyrics with the original.
 * Only sections matching `target` are taken from `rewritten`.
 * All other sections are unconditionally restored from `original`,
 * preventing Claude from silently editing sections outside the target.
 *
 * Example: target="chorus" → [Chorus] from rewritten, everything else from original.
 * Guarantees [Pre-Chorus] is never touched when target is "chorus".
 */
export function mergeSections(
  original: string,
  rewritten: string,
  target: SectionTarget
): string {
  if (target === "all") return rewritten;

  const t = sectionTagForTarget(target).toLowerCase();

  // Build tag → section-text map from Claude's output
  const rewrittenMap = new Map<string, string>();
  for (const section of rewritten.split(/(?=\[)/)) {
    const m = section.match(/^\[([^\]]+)\]/);
    if (m) rewrittenMap.set(m[1].toLowerCase(), section);
  }

  // Walk original structure; swap in rewritten only for matching sections
  return original
    .split(/(?=\[)/)
    .map((section) => {
      const m = section.match(/^\[([^\]]+)\]/);
      if (!m) return section; // pre-tag content (rare)
      const tag = m[1].toLowerCase();
      const isTarget = tag === t || tag.startsWith(t + " ");
      if (!isTarget) return section; // always keep original for non-target
      return rewrittenMap.get(tag) ?? section; // fallback if Claude omitted the section
    })
    .join("");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const REWRITE_MODE_LABELS: Record<RewriteMode, string> = {
  catchy:             "キャッチー化",
  "remove-ai":        "AI臭さ除去",
  "shorten-mora":     "モーラ短縮",
  "strengthen-chorus":"サビ強化",
  "more-japanese":    "日本語多め",
  "more-english":     "英語多め",
  darker:             "ダーク化",
  danceable:          "ダンサブル化",
  poetic:             "詩的",
  ironic:             "皮肉",
  ojaly:              "ojaly.化",
};

export function applyRewriteMode(
  lyrics: string,
  mode: RewriteMode,
  sectionTarget: SectionTarget = "all"
): string {
  // strengthen-chorus always targets [Chorus] internally via processSection
  if (mode === "strengthen-chorus") return strengthenChorus(lyrics);

  const core = (text: string): string => {
    switch (mode) {
      case "catchy":        return makeCatchy(text);
      case "remove-ai":     return removeAiCliches(text);
      case "shorten-mora":  return shortenMora(text);
      case "more-japanese": return moreJapanese(text);
      case "more-english":  return moreEnglish(text);
      case "darker":        return makeDarker(text);
      case "danceable":     return makeDanceable(text);
      case "poetic":        return makePoetic(text);
      case "ironic":        return makeIronic(text);
      case "ojaly":         return ojalyStyle(text);
      default:              return text;
    }
  };
  return applyToSection(lyrics, sectionTarget, core);
}
