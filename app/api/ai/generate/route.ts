import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SongInput, WorldPresetKey, WorldExpansion } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { pickStructureForClaude } from "@/lib/structureVariation";

/** Claude レスポンスから JSON オブジェクトを堅牢に抽出する */
function extractJson(text: string): Record<string, unknown> {
  // コードフェンス・前後テキストを除去
  const s = text.trim().replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "");
  const start = s.indexOf("{");
  if (start === -1) throw new Error("No JSON object found");
  let depth = 0, end = -1;
  for (let i = start; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Unterminated JSON");
  return JSON.parse(s.slice(start, end + 1));
}


function langInstruction(ratio: string): string {
  if (ratio === "high") return "Write mostly in English (80%+). Japanese phrases ok for flavor.";
  if (ratio === "mixed") return "Mix Japanese and English roughly half/half. Alternate lines or sections.";
  return "Write mostly in Japanese (80%+). English phrases ok for flavor.";
}

const SYSTEM_PROMPT = `You are a Suno AI lyricist writing for professional music production.

═══ QUICK IDEA IS LAW ═══
If a Quick Idea is provided, it is the SOLE source of truth for content.
Step 1 — Extract from the Quick Idea:
  • The central subject / protagonist (e.g. うどん, a specific object, place, emotion)
  • The dominant atmosphere / abnormality (e.g. 偏執的, 退廃的, 狂信的)
  • Concrete sensory motifs (textures, smells, sounds, colors, physical details)
  • The emotional arc (devotion? obsession? grief? ecstasy?)
Step 2 — Every single line of lyrics must be traceable back to those extracted elements.
Step 3 — NEVER fall back to generic J-Pop imagery ("街の灯り", "光の中で", "君の笑顔", "feel alive").
     The Quick Idea replaces all defaults. If it's about udon, write about udon —麺, だし, 丼, 湯気, 偏執, 祈り.
═══════════════════════════

STRUCTURE RULES:
- Write EXACTLY the sections listed in the STRUCTURE parameter — no extras, no omissions.
- Do not default to [Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Outro] unless the STRUCTURE parameter specifies it.
- Section tags must be written exactly as they appear in STRUCTURE, enclosed in square brackets.
- Valid section tag families (use only what STRUCTURE specifies):
    Standard:   [Intro] [Verse 1] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Final Chorus] [Outro]
    Dance/EDM:  [Build] [Drop] [Breakdown] [Verse]
    Rap/Hook:   [Hook] [Final Hook] [Break]
    Theatrical: [Spoken Intro] [Scene Change] [Finale]
    Short:      [Verse] [Hook]

HARD RULES:
- Japanese lines: mora count 4–14 (ideal 6–12). Never write run-on lines.
- High-energy sections ([Chorus] [Drop] [Hook] [Final Chorus] [Final Hook]): short, direct, singable, 3–5 lines.
- [Build]: 2–3 lines of rising tension; no resolution.
- [Spoken Intro]: narrative, atmospheric, no melody required; 2–3 lines.
- [Scene Change]: 2–3 lines, shifts perspective or time.
- [Finale] / [Outro]: 2–3 lines, closes the arc.
- Blank line after each section's content, before the next tag.
- Lines per section: Intro/Spoken Intro 2–3, Verse 4–6, Pre-Chorus/Build 2–3, Chorus/Drop/Hook 3–5, Bridge/Break/Breakdown/Scene Change 3–4, Outro/Finale 2–3

BANNED PHRASES: "lose control" "feel alive" "in my veins" "break free" "take me higher"
  "warrior" "rise above" "burning inside" "meant to be" "forever and always"
  "街の灯り" "光の海" "君の笑顔" "翼を広げて" "空に向かって" (generic AI filler)

QUALITY:
- Concrete > abstract. Name the thing. "うどんの麺が震える" beats "何かが溢れる".
- Obsessive, abnormal, or absurd themes need MATCHING imagery — lean into the weirdness.
- Match energy and pacing to the structure type: a Dance Drop should feel physically urgent; a Ballad Narrative should breathe slowly.
- Chorus/Hook/Drop lines must be memorable in isolation — singable, repeatable, unforgettable.
- Verse lines build a scene. Pre-chorus/Build raises tension. Bridge/Scene Change shifts perspective.
- No over-explanation. Trust the image.

OUTPUT: Return ONLY valid JSON (no markdown, no code fences):
{
  "lyrics": "<complete lyrics with all section tags and blank lines between sections>",
  "notes": "<1–2 sentence Japanese note on which specific Quick Idea elements were woven in>"
}`;

// ─── User prompt builders ─────────────────────────────────────────────────────

interface LibraryContext {
  styleAddition: string;
  structureHint: string;
  metaTagHint: string;
}

function buildExpansionUserPrompt(
  expansion: WorldExpansion,
  input: SongInput,
  lib: LibraryContext
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
STRUCTURE: ${pickStructureForClaude(input)}${lib.structureHint ? `\nSTRUCTURE PREFERENCE: ${lib.structureHint}` : ""}${lib.metaTagHint ? `\nPREFERRED SECTIONS: ${lib.metaTagHint}` : ""}
STYLE TAGS: ${[md.genreHint, md.atmosphere, md.vocalStyle, lib.styleAddition].filter(Boolean).join(", ")}
AVOID: ${input.avoidExpressions || "(none)"}${(input.nudges ?? []).length > 0 ? `\nFINE TUNE (directional corrections): ${input.nudges.join(", ")}` : ""}

INSTRUCTION:
Every single line must be traceable to the World Seed.
Use these concrete objects as recurring imagery: ${expansion.objects.slice(0, 4).join(", ")}
${expansion.contradiction[0] ? `The contradiction "${expansion.contradiction[0]}" is the emotional core.` : ""}
Embody the detected music direction — atmosphere over generic melody.

Return JSON only.`;
}

function buildLegacyUserPrompt(input: SongInput, presetDeep: string, lib: LibraryContext): string {
  const quickIdea = input.theme?.trim() || input.title?.trim() || "";
  return `${
    quickIdea
      ? `╔═══ QUICK IDEA (TOP PRIORITY) ═══╗\n${quickIdea}\n╚══════════════════════════════════╝\n\n`
      : ""
  }Generate lyrics with these parameters:

TITLE: ${input.title || "(未設定)"}
GENRE: ${input.genre}
MOOD: ${input.mood}
VOCAL: ${input.vocalType}
BPM: ${input.bpm || "120"}
KEY: ${input.key || "Am"}
SONG LENGTH: ${input.songLength}
LANGUAGE: ${langInstruction(input.englishRatio)}
REFERENCE VIBE: ${input.referenceVibe || "(none)"}
AVOID: ${input.avoidExpressions || "(none)"}
STRUCTURE: ${pickStructureForClaude(input)}${lib.structureHint ? `\nSTRUCTURE PREFERENCE: ${lib.structureHint}` : ""}${lib.metaTagHint ? `\nPREFERRED SECTIONS: ${lib.metaTagHint}` : ""}${lib.styleAddition ? `\nSTYLE TAGS: ${lib.styleAddition}` : ""}
${presetDeep ? `\nWORLD PRESET LENS: ${presetDeep}` : ""}

${
  quickIdea
    ? `Every line must be traceable to the Quick Idea: "${quickIdea}". No generic imagery.`
    : `Theme "${input.title}" is the subject. Write from inside this world.`
}

Return JSON only.`;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "[mora/generate] ANTHROPIC_API_KEY is not set — returning 503. " +
      "Create .env.local with ANTHROPIC_API_KEY=sk-ant-... to enable Claude. " +
      "Client will fall back to rule-based lyric generation."
    );
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  let input: SongInput;
  let expansion: WorldExpansion | null = null;
  let lib: LibraryContext = { styleAddition: "", structureHint: "", metaTagHint: "" };
  try {
    const body = await req.json();
    input = body.songInput;
    expansion = body.expansion ?? null;
    lib = {
      styleAddition:  typeof body.libraryStyleAddition === "string"  ? body.libraryStyleAddition  : "",
      structureHint:  typeof body.libraryStructureHint === "string"  ? body.libraryStructureHint  : "",
      metaTagHint:    typeof body.libraryMetaTagHint   === "string"  ? body.libraryMetaTagHint    : "",
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const presetDeep = input.worldPreset
    ? (WORLD_PRESETS[input.worldPreset as WorldPresetKey]?.deepPrompt ?? "")
    : "";

  const userPrompt = expansion
    ? buildExpansionUserPrompt(expansion, input, lib)
    : buildLegacyUserPrompt(input, presetDeep, lib);

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(content.text);
    } catch (parseErr) {
      console.error("[mora/generate] JSON parse failed:", parseErr, "| raw:", content.text.slice(0, 300));
      // parse失敗 → クライアントのルールベースフォールバックへ
      return NextResponse.json({ lyrics: "", notes: "" });
    }

    return NextResponse.json({
      lyrics: parsed.lyrics ?? "",
      notes: parsed.notes ?? "",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const detail = (err as Record<string, unknown>)?.status
      ? `HTTP ${(err as Record<string, unknown>).status}: ${msg}`
      : msg;
    console.error("[mora/generate] Claude API request failed:", detail);
    if ((err as Record<string, unknown>)?.status === 401) {
      console.error("[mora/generate] → API key is invalid or expired. Check ANTHROPIC_API_KEY in .env.local");
    } else if ((err as Record<string, unknown>)?.status === 429) {
      console.error("[mora/generate] → Rate limited by Anthropic. Retry after a moment.");
    }
    // API障害 → クライアントフォールバックへ (500より200でフォールバックさせる)
    return NextResponse.json({ lyrics: "", notes: "" });
  }
}
