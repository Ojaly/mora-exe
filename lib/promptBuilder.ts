import { SongInput, WorldPresetKey, WorldExpansion } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { extractThemeDescriptors } from "@/lib/themeExtractor";

// ─── Prose helpers ────────────────────────────────────────────────────────────

/** Capitalise first character. */
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Join array as natural English list with Oxford comma. */
function naturalList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export const GENRE_MAP: Record<string, string> = {
  jpop: "J-Pop", jrock: "J-Rock", city: "City Pop", anime: "Anime OST",
  vocaloid: "Vocaloid-style", electronic: "Electronic / Synth-pop",
  rnb: "R&B / Soul", hiphop: "Hip-Hop / Trap", folk: "Folk / Acoustic",
  metal: "Metal / Hard Rock", jazz: "Jazz / Neo-Soul", ambient: "Ambient / Atmospheric",
  // Phase 1 additions (Genre Controller)
  cinematic: "Cinematic / Orchestral", funk: "Funk / Soul", kpop: "K-Pop",
};
const MOOD_MAP: Record<string, string> = {
  melancholic: "melancholic, introspective, bittersweet",
  energetic: "energetic, driving, kinetic",
  dreamy: "dreamy, hazy, ethereal",
  dark: "dark, brooding, tension-filled",
  uplifting: "uplifting, hopeful, radiant",
  nostalgic: "nostalgic, warm, hazy memories",
  aggressive: "aggressive, raw, confrontational",
  romantic: "romantic, intimate, tender",
  epic: "epic, cinematic, grandiose",
  chill: "chill, laid-back, smooth",
};
const VOCAL_MAP: Record<string, string> = {
  female: "female vocal, clear and expressive",
  male: "male vocal, gritty and emotive",
  duet: "male-female duet, intertwined harmonies",
  choir: "choir, layered vocal textures",
  falsetto: "high falsetto, delicate and breathy",
  rap: "rap vocal, rhythmic and punchy",
  vocaloid: "synthetic vocal, Vocaloid-style timbre",
};
const INSTRUMENTS_MAP: Record<string, string> = {
  jpop: "piano, synth pads, light drums, bass",
  jrock: "electric guitar, bass, drums, power chords",
  city: "fretless bass, Rhodes piano, muted guitar, soft drums",
  anime: "orchestral strings, synth leads, piano, taiko drums",
  vocaloid: "digital synths, 8-bit elements, glitchy percussion",
  electronic: "analog synths, drum machines, arpeggiated bass",
  rnb: "Rhodes, muted guitar, 808 bass, brushed snare",
  hiphop: "trap hi-hats, 808 sub-bass, sampled piano, vinyl crackle",
  folk: "acoustic guitar, fingerpicking, light percussion, strings",
  metal: "distorted guitar, double kick drums, power bass, shredding leads",
  jazz: "upright bass, jazz piano, brushed snare, muted trumpet",
  ambient: "sustained pads, field recordings, slow evolving textures",
};
const TEXTURE_MAP: Record<string, string> = {
  melancholic: "sparse, intimate, wide reverb",
  energetic: "dense, layered, punchy transients",
  dreamy: "washed-out reverb, soft attack, floating",
  dark: "low-mid heavy, claustrophobic space",
  uplifting: "bright highs, open reverb, airy",
  nostalgic: "warm tape saturation, lo-fi texture",
  aggressive: "hard-clipping edges, tight room, no decay",
  romantic: "warm low-end, soft compression, close mic feel",
  epic: "wide stereo field, orchestral depth, dynamic swells",
  chill: "smooth compression, gentle low-pass, soft transients",
};

function grooveFromBpm(bpm: string): string {
  const n = parseInt(bpm, 10);
  if (!n) return "mid-tempo groove";
  if (n < 70) return "slow, heavy groove";
  if (n < 100) return "mid-tempo, laid-back feel";
  if (n < 130) return "steady, forward-pushing groove";
  if (n < 160) return "upbeat, energetic pulse";
  return "fast, intense, relentless pace";
}

export function buildStylePrompt(
  input: SongInput,
  preset?: WorldPresetKey | ""
): string {
  const activePreset = preset ? WORLD_PRESETS[preset as WorldPresetKey] : null;

  // When genreLock is set, all genre-keyed lookups (display label, instruments, negatives)
  // use the locked key so every part of the prompt stays genre-consistent.
  const effectiveGenreKey = input.genreLock?.trim() || input.genre;

  const genre = GENRE_MAP[effectiveGenreKey] ?? effectiveGenreKey;
  const mood = MOOD_MAP[input.mood] ?? input.mood;
  const vocal = VOCAL_MAP[input.vocalType] ?? input.vocalType;
  const groove = grooveFromBpm(input.bpm);

  const instruments = activePreset?.styleOverrides.instruments
    ?? INSTRUMENTS_MAP[effectiveGenreKey]
    ?? "piano, synth pads, drums, bass";
  const texture = activePreset?.styleOverrides.texture
    ?? TEXTURE_MAP[input.mood]
    ?? "balanced texture, moderate reverb";

  // ── Quick Idea motifs ──────────────────────────────────────────────────────
  const theme = input.theme?.trim() ?? "";
  const themeDesc = theme ? extractThemeDescriptors(theme) : null;

  const sentences: string[] = [];

  // ── Genre Lock (user override — `genre` already reflects effectiveGenreKey above) ──
  if (input.genreLock?.trim()) {
    sentences.push(`[GENRE LOCK: ${genre}]`);
  }

  // S1: genre + subStyles + mood + BPM / tempo
  // `genre` is already derived from effectiveGenreKey (genreLock || input.genre)
  const bpmPart = input.bpm ? `${input.bpm} BPM` : groove;
  const keyPart = input.key ? `, key of ${input.key}` : "";
  const extraStyle = themeDesc?.styleWords.slice(0, 2) ?? [];
  const moodFull = [mood, ...extraStyle].filter(Boolean).join(", ");
  const subStyleStr = (input.subStyles ?? []).join(", ");
  sentences.push(`${genre}${subStyleStr ? `, ${subStyleStr}` : ""}${moodFull ? `, ${moodFull}` : ""}, ${bpmPart}${keyPart}.`);

  // S2: vocal (skipped when vocalType is empty — AI decides)
  if (vocal) sentences.push(`${cap(vocal)}.`);

  // S3: instruments
  const instrParts = instruments.split(/,\s*/);
  sentences.push(`${cap(naturalList(instrParts))}.`);

  // S4: texture
  sentences.push(`${cap(texture)}.`);

  // S5: theme motifs
  if (themeDesc && themeDesc.enMotifs.length > 0) {
    sentences.push(`${cap(themeDesc.enMotifs.slice(0, 4).join(", "))}.`);
  }

  // World preset note
  if (activePreset?.styleOverrides.note) {
    const note = activePreset.styleOverrides.note.replace(/^Aesthetic:\s*/i, "").trim();
    sentences.push(`${cap(note)}.`);
  }

  // Nudges
  const nudges = input.nudges ?? [];
  if (nudges.length > 0) {
    sentences.push(`${cap(nudges.join(", "))}.`);
  }

  // Avoid
  const avoidParts: string[] = [];
  if (input.avoidAiCliche) avoidParts.push("generic AI vocal artifacts, over-polished production, synthetic timbre");
  if (input.avoidExpressions?.trim()) avoidParts.push(input.avoidExpressions.trim());
  if (avoidParts.length > 0) {
    sentences.push(`Avoid ${avoidParts.join(", ")}.`);
  }

  const result = sentences.join(" ");
  return result.length <= 800 ? result : result.slice(0, 797) + "...";
}

export function buildNegativePrompt(input: SongInput): string {
  const parts: string[] = [];

  if (input.avoidAiCliche) {
    parts.push(
      "generic AI vocal phrases, over-polished production, synthetic timbre, predictable chord progressions"
    );
  }

  const GENRE_NEGATIVES: Record<string, string> = {
    jpop:       "excessive auto-tune, generic idol sound",
    jrock:      "over-compressed guitars, nu-metal clichés",
    city:       "lo-fi clichés, bedroom pop muddiness",
    vocaloid:   "robotic phrasing without intention",
    metal:      "triggered drum samples, djent clipping",
    ambient:    "new-age blandness, generic pad washes",
    hiphop:     "mumble rap aesthetics, trap hi-hat spam",
    anime:      "generic battle-music ostinato, saccharine synth choir, thin MIDI orchestration",
    electronic: "generic EDM drop, preset lead synth, gratuitous sidechain pump",
    rnb:        "gratuitous melisma runs, trap-influenced hi-hat spam, static chord-loop without groove development",
    folk:       "over-polished acoustic gloss, coffee-shop background music feel, generic three-chord campfire loop",
    jazz:       "smooth jazz blandness, elevator music feel, predictable ii-V-I without harmonic color",
    cinematic:  "generic trailer music swell, four-chord epic loop, action-brass stinger",
    funk:       "over-quantized sterile groove, generic wah-wah cliché, lifeless programmed funk bass",
    kpop:       "generic idol-group production formula, overprocessed vocal effect, formulaic energy-drop prechorus",
  };

  // Use genreLock key when set, otherwise fall back to input.genre
  const effectiveGenreKey = input.genreLock?.trim() || input.genre;
  const genreNeg = GENRE_NEGATIVES[effectiveGenreKey];
  if (genreNeg) parts.push(genreNeg);

  if (input.avoidExpressions?.trim()) {
    parts.push(input.avoidExpressions.trim());
  }

  return parts.length > 0 ? parts.join(", ") : "none";
}

export function buildRegeneratePrompt(input: SongInput): string {
  const effectiveGenreKey = input.genreLock?.trim() || input.genre;
  const genre = GENRE_MAP[effectiveGenreKey] ?? effectiveGenreKey;
  const mood = MOOD_MAP[input.mood] ?? input.mood;
  const theme = input.theme?.trim();
  const title = input.title?.trim();
  const parts = [
    `Regenerate as ${genre}${mood ? `, ${mood}` : ""}`,
    ...(input.bpm ? [`at ${input.bpm} BPM`] : []),
    ...(theme ? [`Theme: ${theme}`] : []),
    ...(title ? [`Title: ${title}`] : []),
    "Keep the same structure but vary the melodic feel.",
  ];
  return parts.join(". ");
}

export function buildImprovementMemo(
  input: SongInput,
  longLines: number,
  shortLines: number
): string[] {
  const memo: string[] = [];
  if (longLines > 0)
    memo.push(`歌詞に長すぎる行が ${longLines} 行あります。各行を2行に分割するか単語数を削減してください。`);
  if (shortLines > 0)
    memo.push(`歌詞に短すぎる行が ${shortLines} 行あります。前後の行と統合か補足フレーズの追加を検討してください。`);
  if (input.avoidAiCliche)
    memo.push("AI臭さ回避モードON：具体的なイメージ語・固有名詞・感覚描写を増やすと効果的です。");
  if (input.englishRatio === "high")
    memo.push("英語比率が高い設定です。SunoはネイティブEN歌詞に最適化されているため、発音・リズムを意識してください。");
  if (input.startWithChorus)
    memo.push("サビ頭構成：[chorus] タグを冒頭に置くとサビから始まります。インパクト重視の歌詞を用意してください。");
  return memo;
}

/**
 * Builds a Suno-ready style prompt from WorldExpansion + manual overrides.
 * Output: single prose paragraph, 350–650 chars ideal, max 800 chars.
 * No bracket tags — paste directly into Suno's Style field.
 */
export function buildStylePromptFromExpansion(
  expansion: WorldExpansion,
  input: SongInput,
  worldSeed?: string
): string {
  const md = expansion.musicDirection;
  const sentences: string[] = [];

  // ── Genre Lock (user override — prepend before Forge inference) ────────────
  const lockedGenreExp = input.genreLock?.trim();
  if (lockedGenreExp) {
    const lockLabel = GENRE_MAP[lockedGenreExp] ?? lockedGenreExp;
    sentences.push(`[GENRE LOCK: ${lockLabel}]`);
  }

  // ── S1: Genre / subStyles / atmosphere / BPM ──────────────────────────────
  const bpmNum = input.bpm ? parseInt(input.bpm, 10) : md.bpmEstimate;
  const bpmStr = bpmNum && !isNaN(bpmNum) ? `, ${bpmNum} BPM` : "";
  const tempoStr = !bpmStr && md.tempoFeel ? `, ${md.tempoFeel}` : "";
  const keyStr = input.key ? `, key of ${input.key}` : "";
  const subStyleStrExp = (input.subStyles ?? []).join(", ");

  let s1 = "";
  if (md.genreHint && md.atmosphere) {
    s1 = `${md.genreHint}${subStyleStrExp ? `, ${subStyleStrExp}` : ""} with ${md.atmosphere}`;
  } else {
    s1 = md.genreHint || md.atmosphere || "";
    if (s1 && subStyleStrExp) s1 = `${s1}, ${subStyleStrExp}`;
    else if (!s1) s1 = subStyleStrExp;
  }
  s1 += `${bpmStr || tempoStr}${keyStr}`;
  if (s1) sentences.push(cap(s1) + ".");

  // ── S2: Vocal ──────────────────────────────────────────────────────────────
  if (md.vocalStyle) {
    sentences.push(cap(md.vocalStyle) + ".");
  }

  // ── S3: Instruments ────────────────────────────────────────────────────────
  if (md.instruments.length > 0) {
    sentences.push(cap(naturalList(md.instruments)) + ".");
  }

  // ── S4: Texture + sound direction (vivid imagery) ──────────────────────────
  const vivid = [
    ...expansion.texture.slice(0, 3),
    ...expansion.soundDirection.slice(0, 2),
  ].filter(Boolean);
  if (vivid.length > 0) {
    sentences.push(cap(naturalList(vivid)) + ".");
  }

  // ── S5: Mood words ─────────────────────────────────────────────────────────
  if (md.moodWords.length > 0) {
    sentences.push(cap(md.moodWords.slice(0, 4).join(", ")) + ".");
  }

  // ── S6: Fine-tune nudges / reference vibe ─────────────────────────────────
  const nudges = input.nudges ?? [];
  if (nudges.length > 0) {
    sentences.push(cap(nudges.join(", ")) + ".");
  }
  if (input.referenceVibe?.trim()) {
    sentences.push(`Feels like ${input.referenceVibe.trim()}.`);
  }

  // ── Last: Avoid ────────────────────────────────────────────────────────────
  const avoidParts: string[] = [];
  if (input.avoidAiCliche) avoidParts.push("generic AI clichés, over-polished sheen, synthetic vocals");
  if (input.avoidExpressions?.trim()) avoidParts.push(input.avoidExpressions.trim());
  if (avoidParts.length > 0) {
    sentences.push(`Avoid ${avoidParts.join(", ")}.`);
  }

  const result = sentences.filter(Boolean).join(" ");
  return result.length <= 800 ? result : result.slice(0, 797) + "...";
}

/**
 * Builds a negative prompt from WorldExpansion.
 * Uses world/mood inference instead of genre-specific lists.
 */
export function buildNegativePromptFromExpansion(
  expansion: WorldExpansion,
  input: SongInput
): string {
  const parts: string[] = [];

  if (input.avoidAiCliche) {
    parts.push(
      "generic AI vocal phrases, over-polished production, synthetic timbre"
    );
  }

  const mw = expansion.musicDirection.moodWords.join(" ").toLowerCase();
  if (/obsess|ritual|decad|haunt|cult|fanatic/.test(mw)) {
    parts.push(
      "cheerful pop energy, generic uplifting melody, stadium anthem feel"
    );
  }
  const vox = expansion.musicDirection.vocalStyle.toLowerCase();
  if (/close|intimate|whisper|breath/.test(vox)) {
    parts.push("excessive reverb, over-produced sheen, big hall sound");
  }

  if (input.avoidExpressions?.trim()) {
    parts.push(input.avoidExpressions.trim());
  }

  return parts.length > 0 ? parts.join(", ") : "none";
}
