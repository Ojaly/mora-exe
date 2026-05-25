import { MoraSuggestion } from "@/types";
import { estimateMora } from "@/lib/moraAnalyzer";

const JP_EXTEND_SUFFIXES = [
  "　のように",
  "　続いていく",
  "　消えないまま",
  "　だから",
  "　今も",
];

const SECTION_EXTEND: Record<string, string[]> = {
  chorus: ["　叫べ", "　もう一度", "　ずっと"],
  "pre-chorus": ["　もうすぐ", "　感じてる", "　近づいてる"],
  verse: ["　だから", "　でも", "　それでも"],
  bridge: ["　それが全て", "　だと気づいた", "　その理由で"],
};

function splitAtNaturalBreak(line: string): string[] {
  // Try 、or ,
  const commaIdx = line.search(/[、,]/);
  if (commaIdx > 1 && commaIdx < line.length - 1) {
    const p1 = line.slice(0, commaIdx).trim();
    const p2 = line.slice(commaIdx + 1).trim();
    if (p1 && p2) return [p1, p2];
  }

  // Try particle split (は・が・を・に・で・も・へ followed by space/content)
  const particleMatch = line.match(/^(.+?[はがをにでもへと])\s*(.+)$/);
  if (particleMatch) {
    const p1 = particleMatch[1].trim();
    const p2 = particleMatch[2].trim();
    if (estimateMora(p1) >= 3 && estimateMora(p2) >= 3) return [p1, p2];
  }

  // Try whitespace split (全角スペース)
  const spaceIdx = line.indexOf("　");
  if (spaceIdx > 1 && spaceIdx < line.length - 1) {
    return [line.slice(0, spaceIdx).trim(), line.slice(spaceIdx + 1).trim()];
  }

  // Fallback: cut at ~60%
  const cutAt = Math.max(2, Math.floor(line.length * 0.6));
  return [line.slice(0, cutAt).trim()];
}

function extendShortLine(line: string, sectionTag: string): string[] {
  const tag = sectionTag.toLowerCase().replace(/\s+\d+$/, "");
  const sectionSuffixes = SECTION_EXTEND[tag] ?? JP_EXTEND_SUFFIXES;
  return sectionSuffixes.slice(0, 3).map((suffix) => line + suffix);
}

export function generateMoraSuggestions(
  lyrics: string
): MoraSuggestion[] {
  const lines = lyrics.split("\n");
  const suggestions: MoraSuggestion[] = [];
  let currentTag = "verse";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const tagMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (tagMatch) {
      currentTag = tagMatch[1].toLowerCase();
      continue;
    }

    const mora = estimateMora(trimmed);

    if (mora > 14) {
      const alts = splitAtNaturalBreak(trimmed);
      suggestions.push({
        lineNumber: i + 1,
        originalLine: trimmed,
        moraCount: mora,
        danger: "long",
        alternatives: alts,
      });
    } else if (mora > 0 && mora <= 3) {
      const alts = extendShortLine(trimmed, currentTag);
      suggestions.push({
        lineNumber: i + 1,
        originalLine: trimmed,
        moraCount: mora,
        danger: "short",
        alternatives: alts,
      });
    }
  }

  return suggestions;
}

export function applyLineFix(
  lyrics: string,
  lineNumber: number,
  replacement: string | string[]
): string {
  const lines = lyrics.split("\n");
  const idx = lineNumber - 1;
  if (idx < 0 || idx >= lines.length) return lyrics;

  if (Array.isArray(replacement)) {
    lines.splice(idx, 1, ...replacement);
  } else {
    lines[idx] = replacement;
  }
  return lines.join("\n");
}
