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
  worldPreset: WorldPresetKey | "";
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

export interface SyntaxMatch {
  patternId: string;
  label: string;
  lineNumber: number;
  lineText: string;
  matchedText: string;
  suggestion: string;
}

export type CollapseRiskType =
  | "english-spike"
  | "consonant-cluster"
  | "long-vowel-chain"
  | "mora-overload"
  | "too-short"
  | "lang-switch";

export interface CollapseRisk {
  id: string;
  type: CollapseRiskType;
  severity: "low" | "medium" | "high";
  lineNumbers: number[];
  description: string;
  suggestion: string;
}

export interface SongStats {
  totalLines: number;
  contentLines: number;
  avgMora: number;
  maxMora: number;
  dangerCount: number;
  enRatioAvg: number;
  riskScore: number; // 0–100（100=問題なし）
}

export interface AnalysisResult {
  stylePrompt: string;
  moraLines: MoraLine[];
  phraseMatches: PhraseMatch[];
  syntaxMatches: SyntaxMatch[];
  collapseRisks: CollapseRisk[];
  improvementMemo: string[];
  songStats: SongStats;
}

export interface AIImprovement {
  suggestions: string[];
  rewrittenLines?: { original: string; rewritten: string }[];
}

export type WorldPresetKey =
  | "neon"
  | "corporate"
  | "mythic"
  | "digital-motown"
  | "electro-waltz"
  | "gospel-irony";
