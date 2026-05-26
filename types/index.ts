export interface SongInput {
  title: string;
  theme: string;
  genre: string;
  bpm: string;
  key: string;
  mood: string;
  vocalType: string;
  songLength: "30s" | "90s" | "full";
  englishRatio: "low" | "mixed" | "high";
  worldPreset: WorldPresetKey | "";
  referenceVibe: string;
  avoidExpressions: string;
  startWithChorus: boolean;
  avoidAiCliche: boolean;
  lyrics: string;
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
  riskScore: number;
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

// ─── Lyrics Builder ──────────────────────────────────────────────────────────

export interface LyricsSection {
  tag: string;
  lines: string[];
}

export interface LyricsDraft {
  sections: LyricsSection[];
}

// ─── Mora Tuner ──────────────────────────────────────────────────────────────

export interface MoraSuggestion {
  lineNumber: number;
  originalLine: string;
  moraCount: number;
  danger: "long" | "short";
  alternatives: string[];
}

// ─── Rewrite Modes ───────────────────────────────────────────────────────────

export type RewriteMode =
  | "catchy"
  | "remove-ai"
  | "shorten-mora"
  | "strengthen-chorus"
  | "more-japanese"
  | "more-english"
  | "darker"
  | "danceable"
  | "ojaly";

export type RewriteIntensity = "subtle" | "medium" | "aggressive";

export type SectionTarget = "all" | "chorus" | "verse" | "pre-chorus" | "bridge";

export interface HistoryEntry {
  lyrics: string;
  label: string;
  ts: number;
}

// ─── World Forge ─────────────────────────────────────────────────────────────

export interface WorldExpansion {
  scene: string[];
  emotion: string[];
  texture: string[];
  objects: string[];
  contradiction: string[];
  soundDirection: string[];
  stylePromptDraft: string;
  lyricsDirection: string;
}

export interface PromptMemory {
  id: string;
  ts: number;
  memo: string;
  title: string;
  songInput: SongInput;
  stylePrompt: string;
  lyrics: string;
  worldPreset: WorldPresetKey | "";
  score: number | null;
}
