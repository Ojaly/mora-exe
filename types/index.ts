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
  /** Directional nudges applied as Fine Tune corrections on top of MORA.exe's inference */
  nudges: string[];
  /**
   * Phase 1: User-locked genre key (e.g. "jpop", "jazz").
   * When set, buildStylePrompt injects [GENRE LOCK: X] at the front and suppresses AI genre inference.
   * Empty string = let AI decide.
   */
  genreLock?: string;
  /**
   * Phase 2 (reserved): Sub-style modifiers stacked on top of genreLock.
   * e.g. ["lo-fi", "acoustic", "minimal"]
   */
  subStyles?: string[];
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
  | "poetic"
  | "ironic"
  | "ojaly";

export type RewriteIntensity = "subtle" | "medium" | "aggressive";

export type SectionTarget = "all" | "chorus" | "verse" | "pre-chorus" | "bridge";

export interface HistoryEntry {
  lyrics: string;
  label: string;
  ts: number;
}

// ─── Structure Blueprint ──────────────────────────────────────────────────────

export type StructureMode = "preset" | "builder";

export type BuilderSection =
  | "Intro"
  | "Spoken Intro"
  | "Hook"
  | "Verse 1"
  | "Verse 2"
  | "Pre-Chorus"
  | "Chorus"
  | "Post-Chorus"
  | "Build"
  | "Drop"
  | "Break"
  | "Bridge"
  | "Interlude"
  | "Instrumental"
  | "Breakdown"
  | "Final Chorus"
  | "Outro";

export type StructurePreset =
  | "chorus-first"
  | "dance-drop"
  | "hook-loop"
  | "ballad-narrative"
  | "rap-hook"
  | "theatrical"
  | "short-viral"
  | "verse-first"
  | "spoken-intro"
  | "final-chorus-build";

// ─── Source Alchemy ──────────────────────────────────────────────────────────

export interface AlchemyResult {
  /** 1-sentence abstract of the source — NO proper nouns */
  sourceSummary:    string;
  /** Emotional words distilled from user's reaction */
  reactionCore:     string[];
  /** Universal human themes this event maps to */
  universalThemes:  string[];
  /** Cinematic world fragments (JP preferred) */
  songWorld:        string[];
  /** Sensory metaphors that carry emotional weight without naming the source */
  metaphors:        string[];
  /** Atmosphere-first Suno style suggestion */
  stylePromptDraft: string;
  /** JP: how to approach lyrics for this transformed world */
  lyricsDirection:  string;
  /** Chorus hook concepts as emotional images */
  chorusHookIdeas:  string[];
  /** Poetic World Seed ready for World Forge (JP preferred, no proper nouns) */
  worldSeed:        string;
}

// ─── World Forge ─────────────────────────────────────────────────────────────

export interface MusicDirection {
  /** concise world-specific genre feel, e.g. "ritualistic downtempo neo-soul" */
  genreHint:   string;
  /** 2-4 atmospheric/sensory descriptors */
  atmosphere:  string;
  /** tempo character, e.g. "slow, deliberate" */
  tempoFeel:   string;
  bpmEstimate: number | null;
  /** specific vocal character + mic treatment */
  vocalStyle:  string;
  /** 2-4 instruments that fit this world */
  instruments: string[];
  /** 3-5 mood/atmosphere words (EN) */
  moodWords:   string[];
  source:      "claude" | "rule";
}

export interface WorldExpansion {
  scene:            string[];
  emotion:          string[];
  texture:          string[];
  objects:          string[];
  contradiction:    string[];
  soundDirection:   string[];
  musicDirection:   MusicDirection;
  stylePromptDraft: string;
  lyricsDirection:  string;
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
