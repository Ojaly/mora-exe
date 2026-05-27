import { PhraseMatch, SyntaxMatch } from "@/types";

// ─── 単語レベルクリシェ ────────────────────────────────────────────────────
interface PhraseEntry {
  phrase: string;
  suggestion: string;
}

export const AI_CLICHE_PHRASES: PhraseEntry[] = [
  { phrase: "lose control",    suggestion: '"unravel" / "come undone" / "slip away"' },
  { phrase: "feel alive",      suggestion: '"pulse with life" / "burn inside" / "breathe again"' },
  { phrase: "take me higher",  suggestion: '"lift me out" / "pull me through" / "carry me"' },
  { phrase: "shining bright",  suggestion: '"cutting through" / "glowing raw" / "bleeding light"' },
  { phrase: "never let go",    suggestion: '"hold on tight" / "stay close" / "don\'t drift away"' },
  { phrase: "break the chains",suggestion: '"cut the wire" / "step outside" / "break the frame"' },
  { phrase: "in the night",    suggestion: '"past midnight" / "through the dark" / "when lights die"' },
  { phrase: "into the light",  suggestion: '"toward the open" / "past the fog" / "out of the grey"' },
  { phrase: "we don\'t stop",  suggestion: '"keep moving" / "no brakes now" / "never slow"' },
  { phrase: "rise above",      suggestion: '"climb past it" / "push through" / "get over"' },
  { phrase: "dance in the rain",suggestion: '"walk through storms" / "stand in the downpour"' },
  { phrase: "touch the sky",   suggestion: '"reach the edge" / "hit the ceiling" / "go beyond"' },
  { phrase: "burning desire",  suggestion: '"raw hunger" / "quiet ache" / "hollow want"' },
  { phrase: "heart on fire",   suggestion: '"chest tight" / "ribs cracked open" / "fever-brained"' },
  { phrase: "chase the dream", suggestion: '"follow the thread" / "hunt the idea" / "track it down"' },
];

export function detectAiPhrases(lyrics: string): PhraseMatch[] {
  const lines = lyrics.split("\n");
  const matches: PhraseMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    for (const entry of AI_CLICHE_PHRASES) {
      if (lower.includes(entry.phrase)) {
        matches.push({
          phrase: entry.phrase,
          lineNumber: i + 1,
          lineText: lines[i].trim(),
          suggestion: entry.suggestion,
        });
      }
    }
  }
  return matches;
}

// ─── 構文レベルジェネリック構文 ────────────────────────────────────────────
interface SyntaxPattern {
  id: string;
  label: string;
  pattern: RegExp;
  suggestion: string;
}

const SYNTAX_PATTERNS: SyntaxPattern[] = [
  {
    id: "fly-away",
    label: "飛翔・逃避メタファー",
    pattern: /\bfly(ing)?\s+(away|free|high|far)\b|\bspread\b.{0,12}\bwings?\b|\bsoar(ing)?\b/i,
    suggestion: "「どこへ/何から」を具体化（例: 25番出口の改札から）",
  },
  {
    id: "find-the-light",
    label: "光メタファー汎用",
    pattern: /\b(see|find|reach|follow|be)\b.{0,15}\bthe\s+(light|glow|shine)\b|\bshine?\s+so\s+bright\b/i,
    suggestion: "光源を特定（廊下の明かり/ライターの炎/スマホ画面/自販機の青白い光）",
  },
  {
    id: "feel-so-adj",
    label: "feel so [感情形容詞] 構文",
    pattern: /\bfeel(ing)?\s+so\s+(alive|free|real|whole|lost|broken|empty|strong|weak|numb)\b/i,
    suggestion: "感情より身体感覚で描写（例: 歯が浮く/耳が詰まる/指先が冷える）",
  },
  {
    id: "heart-beats",
    label: "心臓汎用メタファー",
    pattern: /\b(my|your|this)\s+(heart|soul)\s+(beats?|pounds?|races?|breaks?|aches?|cries?|dies?|flies?)\b/i,
    suggestion: "「心」の代わりに具体的な器官・感覚（例: 喉の奥が熱い/奥歯が鳴る）",
  },
  {
    id: "forever-together",
    label: "forever / together 恒久系",
    pattern: /\b(forever|always|eternally|until the end)\b.{0,20}\b(together|with you|by your side)\b|\btogether\b.{0,15}\b(forever|always)\b/i,
    suggestion: "「永遠」は時間でなく行動で表現（例: 毎朝同じコンビニに寄る）",
  },
  {
    id: "storm-inside",
    label: "内なる嵐メタファー",
    pattern: /\b(storm|hurricane|thunder|rain)\b.{0,20}\b(inside|within|my|heart|soul)\b|\binside\b.{0,10}\b(storm|rain)\b/i,
    suggestion: "天候より温度・湿度・気圧で感情を描写（例: 低気圧の午後3時）",
  },
  {
    id: "time-infinity",
    label: "時間的無限大クリシェ",
    pattern: /\btill the end of time\b|\buntil eternity\b|\bforever and (always|ever)\b|\bfor all time\b/i,
    suggestion: "「永遠」を具体的な期限に変換（例: バッテリーが切れるまで/次の月曜日まで）",
  },
  {
    id: "we-are-one",
    label: "融合・一体化クリシェ",
    pattern: /\bwe\s+are\s+(one|the same|together|united)\b|\bbecome\s+one\b|\bone\s+and\s+the\s+same\b/i,
    suggestion: "「一体」を物理的な接触・距離で描写（例: 背中合わせで5分間）",
  },
];

export function detectSyntaxPatterns(lyrics: string): SyntaxMatch[] {
  const lines = lyrics.split("\n");
  const matches: SyntaxMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].trim();
    if (!lineText || /^\[.*\]$/.test(lineText)) continue;

    for (const sp of SYNTAX_PATTERNS) {
      const m = lineText.match(sp.pattern);
      if (m) {
        matches.push({
          patternId: sp.id,
          label: sp.label,
          lineNumber: i + 1,
          lineText,
          matchedText: m[0],
          suggestion: sp.suggestion,
        });
      }
    }
  }
  return matches;
}
