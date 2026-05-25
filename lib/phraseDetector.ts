import { PhraseMatch } from "@/types";

interface PhraseEntry {
  phrase: string;
  suggestion: string;
}

export const AI_CLICHE_PHRASES: PhraseEntry[] = [
  { phrase: "lose control", suggestion: '"unravel" / "come undone" / "let go"' },
  { phrase: "feel alive", suggestion: '"pulse with life" / "burn inside" / "breathe again"' },
  { phrase: "take me higher", suggestion: '"lift me out" / "pull me through" / "carry me"' },
  { phrase: "shining bright", suggestion: '"cutting through" / "burning through" / "glowing raw"' },
  { phrase: "never let go", suggestion: '"hold on tight" / "stay close now" / "don\'t drift away"' },
  { phrase: "break the chains", suggestion: '"cut the wire" / "step outside" / "break the frame"' },
  { phrase: "in the night", suggestion: '"past midnight" / "through the dark" / "when lights die"' },
  { phrase: "into the light", suggestion: '"toward the open" / "past the fog" / "out of the grey"' },
  { phrase: "we don't stop", suggestion: '"keep moving" / "no brakes now" / "never slow"' },
  { phrase: "rise above", suggestion: '"climb past it" / "push through" / "get over"' },
  { phrase: "dance in the rain", suggestion: '"walk through storms" / "stand in the downpour"' },
  { phrase: "touch the sky", suggestion: '"reach the edge" / "hit the ceiling" / "go beyond"' },
  { phrase: "burning desire", suggestion: '"raw hunger" / "quiet ache" / "hollow want"' },
  { phrase: "heart on fire", suggestion: '"chest tight" / "ribs cracked open" / "fever-brained"' },
  { phrase: "chase the dream", suggestion: '"follow the thread" / "hunt the idea" / "track it down"' },
];

export function detectAiPhrases(lyrics: string): PhraseMatch[] {
  const lines = lyrics.split("\n");
  const matches: PhraseMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const lower = lineText.toLowerCase();
    for (const entry of AI_CLICHE_PHRASES) {
      if (lower.includes(entry.phrase)) {
        matches.push({
          phrase: entry.phrase,
          lineNumber: i + 1,
          lineText: lineText.trim(),
          suggestion: entry.suggestion,
        });
      }
    }
  }

  return matches;
}
