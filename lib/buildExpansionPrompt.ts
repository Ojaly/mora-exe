import { SongInput, WorldExpansion } from "@/types";
import { pickStructureForClaude } from "@/lib/structureVariation";
import { GENRE_MAP } from "@/lib/promptBuilder";

export interface LibraryContext {
  styleAddition: string;
  structureHint: string;
  metaTagHint: string;
}

export function langInstruction(ratio: string): string {
  if (ratio === "high") return "Write mostly in English (80%+). Japanese words ok as texture or flavor. Each English line must carry its own image or hook — not restate adjacent content in another language.";
  if (ratio === "mixed") return "Mix Japanese and English. English must NOT translate or restate the Japanese line — use English as hooks, inner voice, sonic texture, or rhythmic fragments that add a new image or emotional angle. Avoid bilingual mirror lines where both languages say the same thing.";
  return "Write entirely in Japanese. Do not use English words, phrases, or fragments anywhere in the lyrics — including Verse, Chorus, Interlude, Breakdown, Outro, and Bridge. Every line must be in Japanese.";
}

export function resolveStructure(
  input: SongInput,
  lib: LibraryContext,
  structureOverride?: string,
  isCustomBlueprint?: boolean,
): string {
  const base = structureOverride ?? pickStructureForClaude(input);
  console.log(
    `[MORA structure] songLength=${input.songLength},`,
    `hasStructureOverride=${structureOverride !== undefined},`,
    `structure="${base}"`,
  );
  const hint = (!structureOverride && lib.structureHint)
    ? `\nSTRUCTURE PREFERENCE: ${lib.structureHint}`
    : "";
  const custom = isCustomBlueprint
    ? "\nSTRUCTURE CONSTRAINT: Use EXACTLY the sections listed above in that order. Do not add, remove, or reorder any section. Each section's content is free."
    : "";
  const meta = lib.metaTagHint ? `\nPREFERRED SECTIONS: ${lib.metaTagHint}` : "";
  return `${base}${hint}${custom}${meta}`;
}

export function buildExpansionUserPrompt(
  expansion: WorldExpansion,
  input: SongInput,
  lib: LibraryContext,
  structureOverride?: string,
  isCustomBlueprint?: boolean,
): string {
  const md   = expansion.musicDirection;
  const seed = input.theme?.trim() || "";

  return `╔═══ QUICK IDEA ═══╗
${seed || "(no seed provided)"}
╚═══════════════════╝

WORLD EXPANSION:

SCENE:
${expansion.scene.map((s) => `• ${s}`).join("\n")}

OBJECTS & MOTIFS: ${expansion.objects.join(" / ")}

EMOTIONAL ATMOSPHERE: ${expansion.emotion.join(" · ")}

TEXTURE: ${expansion.texture.join(", ")}
${
  expansion.contradiction.length > 0
    ? `\nCONTRADICTION:\n${expansion.contradiction.map((c) => `↔ ${c}`).join("\n")}`
    : ""
}

DETECTED MUSIC DIRECTION (MORA.exe interpretation):
- Feel: ${md.genreHint}
- Atmosphere: ${md.atmosphere}
- Vocal: ${md.vocalStyle}
- Tempo: ${md.tempoFeel}${md.bpmEstimate ? ` (~${md.bpmEstimate} BPM)` : ""}
${md.instruments.length > 0 ? `- Instruments: ${md.instruments.join(", ")}` : ""}

LYRICS DIRECTION: ${expansion.lyricsDirection}

PARAMETERS:
TITLE: ${input.title || "(未設定)"}
LANGUAGE: ${langInstruction(input.englishRatio)}
STRUCTURE: ${resolveStructure(input, lib, structureOverride, isCustomBlueprint)}
STYLE TAGS: ${[md.genreHint, md.atmosphere, md.vocalStyle, lib.styleAddition].filter(Boolean).join(", ")}${input.genreLock?.trim() ? `\nGENRE LOCK: ${GENRE_MAP[input.genreLock.trim()] ?? input.genreLock.trim()}` : ""}
AVOID: ${input.avoidExpressions || "(none)"}${(input.nudges ?? []).length > 0 ? `\nFINE TUNE (directional corrections): ${input.nudges.join(", ")}` : ""}

INSTRUCTION:
Every single line must be traceable to the World Seed.
Use these concrete objects as recurring imagery: ${expansion.objects.slice(0, 4).join(", ")}
${expansion.contradiction[0] ? `The contradiction "${expansion.contradiction[0]}" is the emotional core.` : ""}
Embody the detected music direction — atmosphere over generic melody.

Return JSON only.`;
}
