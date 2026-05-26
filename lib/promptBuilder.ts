import { SongInput, WorldPresetKey, WorldExpansion } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { extractThemeDescriptors } from "@/lib/themeExtractor";

const GENRE_MAP: Record<string, string> = {
  jpop: "J-Pop", jrock: "J-Rock", city: "City Pop", anime: "Anime OST",
  vocaloid: "Vocaloid-style", electronic: "Electronic / Synth-pop",
  rnb: "R&B / Soul", hiphop: "Hip-Hop / Trap", folk: "Folk / Acoustic",
  metal: "Metal / Hard Rock", jazz: "Jazz / Neo-Soul", ambient: "Ambient / Atmospheric",
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
const MIX_MAP: Record<string, string> = {
  jpop: "polished J-Pop mix, clear vocals up front",
  jrock: "guitar-forward rock mix, punchy low-end",
  city: "warm analog mix, smooth frequency balance",
  electronic: "modern EDM master, loud and clean",
  hiphop: "trap-style mix, 808 sidechain, crisp hi-hats",
  ambient: "lo-fi master, soft limiter, organic feel",
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

  const genre = GENRE_MAP[input.genre] ?? input.genre;
  const mood = MOOD_MAP[input.mood] ?? input.mood;
  const vocal = VOCAL_MAP[input.vocalType] ?? input.vocalType;
  const groove = grooveFromBpm(input.bpm);

  const instruments = activePreset?.styleOverrides.instruments
    ?? INSTRUMENTS_MAP[input.genre]
    ?? "piano, synth pads, drums, bass";
  const texture = activePreset?.styleOverrides.texture
    ?? TEXTURE_MAP[input.mood]
    ?? "balanced texture, moderate reverb";
  const mix =
    (MIX_MAP[input.genre] ?? "clean modern mix, professional master") +
    (input.avoidAiCliche ? ", avoid synthetic vocal artifacts" : "");

  const structure =
    input.songLength === "30s"
      ? "[chorus]"
      : input.startWithChorus
      ? "[chorus] → [verse] → [chorus] → [bridge] → [chorus]"
      : "[verse] → [pre-chorus] → [chorus] → [verse] → [chorus] → [bridge] → [outro]";

  // ── Quick Idea extraction ──────────────────────────────────────────────────
  const theme = input.theme?.trim() ?? "";
  const themeDesc = theme ? extractThemeDescriptors(theme) : null;

  // Merge theme style words into [Style:] line
  const extraStyle = themeDesc?.styleWords.slice(0, 4) ?? [];
  const styleLine = [`[Style:] ${genre}`, mood, ...extraStyle].join(", ");

  const lines: string[] = [];

  // Quick Idea is the FIRST line — highest priority signal for Suno
  if (theme) {
    lines.push(`[Quick Idea:] ${theme}`);
  }

  lines.push(styleLine);
  lines.push(`[Tempo:] ${input.bpm ? input.bpm + " BPM, " : ""}${groove}`);
  if (input.key) lines.push(`[Key:] ${input.key}`);
  lines.push(`[Vocal:] ${vocal}`);
  lines.push(`[Groove:] ${groove}, rhythmically tight`);
  lines.push(`[Instruments:] ${instruments}`);
  lines.push(`[Texture:] ${texture}`);
  lines.push(`[Structure:] ${structure}`);
  lines.push(`[Mix Aesthetic:] ${mix}`);

  // Concrete motifs as [Concept:] line
  if (themeDesc && themeDesc.enMotifs.length > 0) {
    lines.push(`[Concept:] ${themeDesc.enMotifs.join(", ")}`);
  }

  if (activePreset?.styleOverrides.note) {
    lines.push(`[World Aesthetic:] ${activePreset.styleOverrides.note}`);
  }

  if (theme) {
    const avoidNote = input.avoidAiCliche
      ? " — no generic filler, every line traceable to this world"
      : " — concrete imagery, stay inside this world";
    lines.push(`[Note:] Theme: "${theme}"${avoidNote}`);
  } else if (input.avoidAiCliche) {
    lines.push(
      "[Note:] Avoid generic AI clichés — use unexpected imagery, raw emotion over polish"
    );
  }

  return lines.join("\n");
}

export function buildNegativePrompt(input: SongInput): string {
  const parts: string[] = [];

  if (input.avoidAiCliche) {
    parts.push(
      "generic AI vocal phrases, over-polished production, synthetic timbre, predictable chord progressions"
    );
  }

  const GENRE_NEGATIVES: Record<string, string> = {
    jpop: "excessive auto-tune, generic idol sound",
    jrock: "over-compressed guitars, nu-metal clichés",
    city: "lo-fi clichés, bedroom pop muddiness",
    vocaloid: "robotic phrasing without intention",
    metal: "triggered drum samples, djent clipping",
    ambient: "new-age blandness, generic pad washes",
    hiphop: "mumble rap aesthetics, trap hi-hat spam",
  };

  const genreNeg = GENRE_NEGATIVES[input.genre];
  if (genreNeg) parts.push(genreNeg);

  if (input.avoidExpressions?.trim()) {
    parts.push(input.avoidExpressions.trim());
  }

  return parts.length > 0 ? parts.join(", ") : "none";
}

export function buildRegeneratePrompt(input: SongInput): string {
  const genre = GENRE_MAP[input.genre] ?? input.genre;
  const mood = MOOD_MAP[input.mood] ?? input.mood;
  const theme = input.theme?.trim();
  const title = input.title?.trim();
  const parts = [
    `Regenerate as ${genre}, ${mood}`,
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

// ─── World-first prompt builders ─────────────────────────────────────────────

function buildStructureLine(songLength: string, startWithChorus: boolean): string {
  if (songLength === "30s") return "[chorus]";
  if (startWithChorus) return "[chorus] → [verse] → [chorus] → [bridge] → [chorus]";
  return "[verse] → [pre-chorus] → [chorus] → [verse] → [chorus] → [bridge] → [outro]";
}

/**
 * Builds a Suno style prompt from WorldExpansion + manual overrides.
 * World-first: atmosphere and world description come before genre labels.
 */
export function buildStylePromptFromExpansion(
  expansion: WorldExpansion,
  input: SongInput,
  worldSeed?: string
): string {
  const md = expansion.musicDirection;
  const lines: string[] = [];

  // Quick Idea — always first
  const seed = (worldSeed ?? input.theme)?.trim();
  if (seed) lines.push(`[Quick Idea:] ${seed}`);

  // [Style:] = atmosphere-first, NOT genre-first
  // genreHint goes in parentheses at the end (secondary label)
  const styleAtm = [md.atmosphere, ...md.moodWords.slice(0, 3)]
    .filter(Boolean).join(", ");
  const genreLabel = md.genreHint ? `  (${md.genreHint})` : "";
  lines.push(`[Style:] ${styleAtm}${genreLabel}`);

  // Tempo (manual BPM overrides estimated)
  const bpmNum =
    input.bpm ? parseInt(input.bpm, 10) : md.bpmEstimate;
  const bpmStr =
    bpmNum && !isNaN(bpmNum) ? `${bpmNum} BPM, ` : "";
  lines.push(`[Tempo:] ${bpmStr}${md.tempoFeel}`);

  // Key — manual override only
  if (input.key) lines.push(`[Key:] ${input.key}`);

  // Vocal — from musicDirection (world-inferred, not dropdown)
  if (md.vocalStyle) lines.push(`[Vocal:] ${md.vocalStyle}`);

  // Instruments — from musicDirection
  if (md.instruments.length > 0) {
    lines.push(`[Instruments:] ${md.instruments.join(", ")}`);
  }

  // Texture — from expansion
  if (expansion.texture.length > 0) {
    lines.push(`[Texture:] ${expansion.texture.join(", ")}`);
  }

  // Concrete motifs as [Concept:]
  if (expansion.objects.length > 0) {
    lines.push(`[Concept:] ${expansion.objects.slice(0, 6).join(", ")}`);
  }

  // Structure
  lines.push(`[Structure:] ${buildStructureLine(input.songLength, input.startWithChorus)}`);

  // Mix — atmosphere-forward
  lines.push(`[Mix:] cinematic balance, atmosphere-forward, world over polish`);

  // Contradiction — the poetic core
  if (expansion.contradiction.length > 0) {
    lines.push(`[World:] ${expansion.contradiction.join(" / ")}`);
  }

  // Manual overrides: reference vibe
  if (input.referenceVibe?.trim()) {
    lines.push(`[Reference:] ${input.referenceVibe.trim()}`);
  }

  // Manual overrides: avoid
  const avoidParts: string[] = [];
  if (input.avoidAiCliche) avoidParts.push("generic AI clichés, over-polished sheen");
  if (input.avoidExpressions?.trim()) avoidParts.push(input.avoidExpressions.trim());
  if (avoidParts.length > 0) lines.push(`[Avoid:] ${avoidParts.join(", ")}`);

  return lines.join("\n");
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
