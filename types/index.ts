export interface SongInput {
  title: string;
  genre: string;
  bpm: string;
  mood: string;
  vocalType: string;
  lyrics: string;
  startWithChorus: boolean;
  englishRatio: string;
  avoidAiCliche: boolean;
}

export type DangerLevel = "safe" | "short" | "long";

export interface MoraLine {
  lineNumber: number;
  text: string;
  moraCount: number;
  danger: DangerLevel;
  warning: string;
}

export interface PhraseMatch {
  phrase: string;
  lineNumber: number;
  lineText: string;
  suggestion: string;
}

export interface AnalysisResult {
  stylePrompt: string;
  moraLines: MoraLine[];
  phraseMatches: PhraseMatch[];
  improvementMemo: string[];
}

export interface AIImprovement {
  suggestions: string[];
  rewrittenLines?: { original: string; rewritten: string }[];
}
