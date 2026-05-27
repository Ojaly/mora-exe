import { SongInput, StructurePreset } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type GenreCategory = "dance" | "rap" | "theatrical" | "ballad" | "standard";

/**
 * Section key values that map to existing MoodPool entries in lyricsBuilder.ts.
 * Only these names are valid for the rule-based fallback builder.
 */
export type RuleBasedSectionKey =
  | "Intro"
  | "Verse 1"
  | "Verse 2"
  | "Pre-Chorus"
  | "Chorus"
  | "Bridge"
  | "Outro";

// ─── Genre detection ──────────────────────────────────────────────────────────

const DANCE_KW   = ["electronic", "edm", "house", "techno", "trance", "club", "dance", "electro"];
const RAP_KW     = ["hiphop", "hip-hop", "hip hop", "rap", "trap", "funk", "r&b", "rnb", "g-funk"];
const THEATRE_KW = ["theatrical", "gothic", "drama", "opera", "musical", "baroque", "waltz", "cabaret"];
const BALLAD_GENRES = ["folk", "acoustic", "city", "jpop", "j-pop", "jazz"];
const BALLAD_MOODS  = ["melancholic", "romantic", "nostalgic", "dreamy"];

function hasKw(text: string, kws: string[]): boolean {
  const t = text.toLowerCase();
  return kws.some((k) => t.includes(k));
}

function detectGenreCategory(input: SongInput): GenreCategory {
  const combined = `${input.genre ?? ""} ${input.theme ?? ""} ${input.referenceVibe ?? ""}`;
  if (hasKw(combined, DANCE_KW))   return "dance";
  if (hasKw(combined, RAP_KW))     return "rap";
  if (hasKw(combined, THEATRE_KW)) return "theatrical";
  if (
    BALLAD_MOODS.includes(input.mood ?? "") &&
    hasKw(input.genre ?? "", BALLAD_GENRES)
  ) return "ballad";
  return "standard";
}

// ─── Random pick ─────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Claude prompt structure string ──────────────────────────────────────────

/**
 * Returns the STRUCTURE string injected into the Claude user prompt.
 * Picks from genre-appropriate variants randomly so consecutive GENERATE
 * calls with the same seed can produce structurally different songs.
 *
 * Extended section tags (Build, Drop, Hook, etc.) are valid here because
 * Claude follows whatever tags the STRUCTURE parameter specifies.
 */
export function pickStructureForClaude(input: SongInput): string {
  // 30s: single hook only
  if (input.songLength === "30s") {
    return input.startWithChorus ? "[Chorus]" : "[Hook] → [Verse] → [Hook]";
  }

  // Chorus-first takes priority over genre variants
  if (input.startWithChorus) {
    if (input.songLength === "90s") {
      return pick([
        "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus]",
        "[Chorus] → [Verse 1] → [Chorus] → [Bridge]",
      ]);
    }
    return pick([
      "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Bridge] → [Final Chorus]",
      "[Chorus] → [Verse 1] → [Chorus] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Outro]",
    ]);
  }

  const cat = detectGenreCategory(input);

  // ── 90s ──────────────────────────────────────────────────────────────────
  if (input.songLength === "90s") {
    const opts: Record<GenreCategory, string[]> = {
      dance: [
        "[Intro] → [Build] → [Drop] → [Verse] → [Drop]",
        "[Verse 1] → [Build] → [Drop] → [Breakdown] → [Drop]",
      ],
      rap: [
        "[Intro] → [Verse 1] → [Hook] → [Verse 2] → [Hook]",
        "[Hook] → [Verse 1] → [Hook] → [Verse 2]",
      ],
      theatrical: [
        "[Spoken Intro] → [Verse] → [Chorus] → [Bridge] → [Chorus]",
        "[Intro] → [Verse 1] → [Chorus] → [Scene Change] → [Chorus]",
      ],
      ballad: [
        "[Verse 1] → [Verse 2] → [Chorus] → [Bridge] → [Chorus]",
        "[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus]",
      ],
      standard: [
        "[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus]",
        "[Intro] → [Verse 1] → [Chorus] → [Bridge] → [Chorus]",
        "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Outro]",
      ],
    };
    return pick(opts[cat]);
  }

  // ── full ──────────────────────────────────────────────────────────────────
  const opts: Record<GenreCategory, string[]> = {
    dance: [
      "[Intro] → [Build] → [Drop] → [Verse 1] → [Build] → [Drop] → [Breakdown] → [Drop] → [Outro]",
      "[Intro] → [Verse 1] → [Build] → [Drop] → [Verse 2] → [Build] → [Drop] → [Outro]",
    ],
    rap: [
      "[Intro] → [Verse 1] → [Hook] → [Verse 2] → [Hook] → [Break] → [Final Hook]",
      "[Intro] → [Hook] → [Verse 1] → [Hook] → [Verse 2] → [Bridge] → [Hook]",
    ],
    theatrical: [
      "[Spoken Intro] → [Verse 1] → [Chorus] → [Scene Change] → [Verse 2] → [Bridge] → [Finale]",
      "[Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Scene Change] → [Bridge] → [Chorus] → [Finale]",
    ],
    ballad: [
      "[Verse 1] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Final Chorus]",
      "[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Final Chorus]",
    ],
    standard: [
      "[Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Outro]",
      "[Intro] → [Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Bridge] → [Final Chorus]",
      "[Intro] → [Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Final Chorus]",
      "[Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Final Chorus]",
    ],
  };
  return pick(opts[cat]);
}

// ─── Structure Presets ────────────────────────────────────────────────────────

/**
 * Human-readable label for each preset, used in the UI dropdown.
 */
export const STRUCTURE_PRESET_LABELS: Record<StructurePreset, string> = {
  "chorus-first":       "Chorus First",
  "dance-drop":         "Dance Drop",
  "hook-loop":          "Hook Loop",
  "ballad-narrative":   "Ballad Narrative",
  "rap-hook":           "Rap Hook",
  "theatrical":         "Theatrical",
  "short-viral":        "Short Viral",
  "verse-first":        "Verse First",
  "spoken-intro":       "Spoken Intro",
  "final-chorus-build": "Final Chorus Build",
};

/**
 * Short structure hint shown under the dropdown.
 */
export const STRUCTURE_PRESET_HINTS: Record<StructurePreset, string> = {
  "chorus-first":       "[Chorus] → [Verse] → [Bridge] → [Final Chorus]",
  "dance-drop":         "[Build] → [Drop] → [Verse] → [Drop] → [Outro]",
  "hook-loop":          "[Hook] → [Verse] → [Hook] → [Break] → [Final Hook]",
  "ballad-narrative":   "[Verse 1] → [Verse 2] → [Chorus] → [Bridge] → [Final Chorus]",
  "rap-hook":           "[Hook] → [Verse 1] → [Hook] → [Verse 2] → [Final Hook]",
  "theatrical":         "[Spoken Intro] → [Verse] → [Chorus] → [Scene Change] → [Finale]",
  "short-viral":        "[Hook] → [Verse] → [Final Hook]",
  "verse-first":        "[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Final Chorus]",
  "spoken-intro":       "[Spoken Intro] → [Verse] → [Build] → [Drop] → [Final Chorus]",
  "final-chorus-build": "[Verse 1] → [Chorus] → [Bridge] → [Chorus] → [Final Chorus]",
};

type StructureLengthKey = "30s" | "90s" | "full";

const PRESET_STRUCTURES: Record<StructurePreset, Record<StructureLengthKey, string>> = {
  "chorus-first": {
    "30s":  "[Chorus]",
    "90s":  "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus]",
    "full": "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Bridge] → [Final Chorus]",
  },
  "dance-drop": {
    "30s":  "[Build] → [Drop]",
    "90s":  "[Intro] → [Build] → [Drop] → [Verse] → [Drop]",
    "full": "[Intro] → [Build] → [Drop] → [Verse 1] → [Build] → [Drop] → [Breakdown] → [Drop] → [Outro]",
  },
  "hook-loop": {
    "30s":  "[Hook]",
    "90s":  "[Hook] → [Verse 1] → [Hook] → [Verse 2] → [Hook]",
    "full": "[Hook] → [Verse 1] → [Hook] → [Verse 2] → [Hook] → [Break] → [Final Hook]",
  },
  "ballad-narrative": {
    "30s":  "[Verse] → [Chorus]",
    "90s":  "[Verse 1] → [Verse 2] → [Chorus] → [Bridge] → [Chorus]",
    "full": "[Verse 1] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Final Chorus]",
  },
  "rap-hook": {
    "30s":  "[Hook] → [Verse] → [Hook]",
    "90s":  "[Hook] → [Verse 1] → [Hook] → [Verse 2] → [Hook]",
    "full": "[Intro] → [Hook] → [Verse 1] → [Hook] → [Verse 2] → [Break] → [Final Hook]",
  },
  "theatrical": {
    "30s":  "[Spoken Intro] → [Chorus]",
    "90s":  "[Spoken Intro] → [Verse] → [Chorus] → [Bridge] → [Chorus]",
    "full": "[Spoken Intro] → [Verse 1] → [Chorus] → [Scene Change] → [Verse 2] → [Bridge] → [Finale]",
  },
  "short-viral": {
    "30s":  "[Hook]",
    "90s":  "[Hook] → [Verse] → [Hook]",
    "full": "[Hook] → [Verse] → [Hook] → [Verse 2] → [Final Hook]",
  },
  "verse-first": {
    "30s":  "[Verse] → [Chorus]",
    "90s":  "[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus]",
    "full": "[Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Bridge] → [Final Chorus]",
  },
  "spoken-intro": {
    "30s":  "[Spoken Intro] → [Hook]",
    "90s":  "[Spoken Intro] → [Verse 1] → [Build] → [Drop] → [Outro]",
    "full": "[Spoken Intro] → [Verse 1] → [Build] → [Drop] → [Verse 2] → [Bridge] → [Final Chorus] → [Outro]",
  },
  "final-chorus-build": {
    "30s":  "[Verse] → [Chorus]",
    "90s":  "[Verse 1] → [Chorus] → [Bridge] → [Chorus] → [Final Chorus]",
    "full": "[Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Bridge] → [Chorus] → [Final Chorus]",
  },
};

/**
 * Returns the fixed structure string for a given preset and song length.
 * Used when structure mode is "preset".
 */
export function getPresetStructure(
  preset: StructurePreset,
  songLength: StructureLengthKey,
): string {
  return PRESET_STRUCTURES[preset][songLength];
}

// ─── Rule-based builder section list ─────────────────────────────────────────

/**
 * Returns the section sequence for the rule-based lyric builder (offline fallback).
 * Only returns RuleBasedSectionKey values that map to existing MoodPool entries.
 * Extended tags (Build, Drop, Hook…) are NOT used here — they have no pool lines.
 */
export function pickSectionList(input: SongInput): RuleBasedSectionKey[] {
  if (input.songLength === "30s") return ["Chorus"];

  if (input.startWithChorus) {
    if (input.songLength === "90s") {
      return pick([
        ["Chorus", "Verse 1", "Pre-Chorus", "Chorus"],
        ["Chorus", "Verse 1", "Chorus"],
      ] as RuleBasedSectionKey[][]);
    }
    return pick([
      ["Chorus", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Bridge", "Chorus"],
      ["Chorus", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"],
    ] as RuleBasedSectionKey[][]);
  }

  const cat = detectGenreCategory(input);

  // ── 90s ──────────────────────────────────────────────────────────────────
  if (input.songLength === "90s") {
    const map: Partial<Record<GenreCategory, RuleBasedSectionKey[][]>> = {
      dance: [
        ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus"],
        ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Bridge", "Chorus"],
      ],
      rap: [
        ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus"],
        ["Chorus", "Verse 1", "Chorus", "Verse 2"],
      ],
    };
    const list = map[cat];
    if (list) return pick(list);
    return pick([
      ["Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus"],
      ["Intro", "Verse 1", "Chorus", "Bridge", "Chorus"],
      ["Chorus", "Verse 1", "Pre-Chorus", "Chorus", "Outro"],
    ] as RuleBasedSectionKey[][]);
  }

  // ── full ──────────────────────────────────────────────────────────────────
  const fullMap: Partial<Record<GenreCategory, RuleBasedSectionKey[][]>> = {
    dance: [
      ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"],
      ["Intro", "Chorus", "Verse 1", "Chorus", "Verse 2", "Chorus", "Outro"],
    ],
    rap: [
      ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"],
      ["Intro", "Chorus", "Verse 1", "Chorus", "Verse 2", "Bridge", "Chorus"],
    ],
    theatrical: [
      ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Bridge", "Outro"],
      ["Intro", "Verse 1", "Chorus", "Bridge", "Chorus", "Outro"],
    ],
    ballad: [
      ["Verse 1", "Verse 2", "Pre-Chorus", "Chorus", "Bridge", "Chorus"],
      ["Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Pre-Chorus", "Chorus", "Bridge", "Chorus"],
    ],
  };
  const fullList = fullMap[cat];
  if (fullList) return pick(fullList);

  // standard: 4 variants — structural variety without special tags
  return pick([
    ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"],
    ["Intro", "Chorus", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Bridge", "Chorus"],
    ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Chorus"],
    ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Pre-Chorus", "Chorus", "Bridge", "Outro"],
  ] as RuleBasedSectionKey[][]);
}
