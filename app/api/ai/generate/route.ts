import { NextRequest, NextResponse } from "next/server";
import { SongInput, WorldPresetKey, WorldExpansion } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";
import { pickStructureForClaude } from "@/lib/structureVariation";
import { GENRE_MAP } from "@/lib/promptBuilder";

// ─── JSON helpers ────────────────────────────────────────────────────────────

/** JSON string 値内の未エスケープ control character を安全に escape する（状態機械方式） */
function sanitizeControlChars(json: string): string {
  const ESC: Record<string, string> = {
    "\n": "\\n", "\r": "\\r", "\t": "\\t",
    "\b": "\\b", "\f": "\\f",
  };
  let inString = false, escaped = false;
  const out: string[] = [];
  for (const c of json) {
    if (escaped)                { out.push(c); escaped = false; continue; }
    if (c === "\\" && inString) { out.push(c); escaped = true;  continue; }
    if (c === '"')              { inString = !inString; out.push(c); continue; }
    if (inString && c.charCodeAt(0) < 0x20) {
      out.push(ESC[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
      continue;
    }
    out.push(c);
  }
  return out.join("");
}

/** コードフェンス除去 → JSON object 抽出（string-aware） → control char sanitize → parse */
function extractJson(text: string, meta?: { rawLength: number; finishReason?: string }): Record<string, unknown> {
  const s = text.trim()
    .replace(/^```(?:json)?\r?\n?/, "")
    .replace(/\r?\n?```$/, "");
  const start = s.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in Gemini response");

  let depth = 0, end = -1;
  let inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (esc)               { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"')         { inStr = !inStr; continue; }
    if (inStr)             { continue; }
    if (c === "{")         { depth++; }
    else if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) {
    const hint = meta
      ? ` (rawLength=${meta.rawLength}, finishReason=${meta.finishReason ?? "unknown"})`
      : "";
    throw new Error(`Unterminated JSON in Gemini response${hint}`);
  }
  return JSON.parse(sanitizeControlChars(s.slice(start, end + 1)));
}

// ─── Gemini REST helper ───────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
): Promise<{ text: string; finishReason?: string }> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens,
        response_mime_type: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw Object.assign(new Error(`Gemini HTTP ${res.status}: ${body}`), { status: res.status });
  }

  const data = await res.json() as {
    candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
  };

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty content");
  return { text, finishReason: candidate?.finishReason };
}

// ─── System prompt ────────────────────────────────────────────────────────────

function langInstruction(ratio: string): string {
  if (ratio === "high") return "Write mostly in English (80%+). Japanese words ok as texture or flavor. Each English line must carry its own image or hook — not restate adjacent content in another language.";
  if (ratio === "mixed") return "Mix Japanese and English. English must NOT translate or restate the Japanese line — use English as hooks, inner voice, sonic texture, or rhythmic fragments that add a new image or emotional angle. Avoid bilingual mirror lines where both languages say the same thing.";
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

SOURCE CORE LINE RULE — do this before writing any lyrics:
- Read the Quick Idea and identify the single most painful sentence, quote, confession,
  or emotional punchline. This is the SOURCE CORE LINE.
  It may be a direct quote, an admission, a realization, or the line that makes the story hurt.
- If no explicit sentence exists, name the sharpest emotional fact buried in the source.
- Use the SOURCE CORE LINE, or a closely transformed version of it, as the emotional anchor
  of the Chorus. If it contains a direct quote, consider preserving its phrasing or rhythm.
- Do not replace the source wound with generic imagery. The listener must feel WHY this hurts.

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
- [Chorus] [Final Chorus]: 4–6 lines. Emotionally direct and singable. State a complete emotional thesis — don't fragment. Each line adds a dimension; the last line lands with weight.
- [Drop] [Hook] [Final Hook]: 3–4 lines. Short, physically urgent, built for repetition.
- [Pre-Chorus] [Build]: 3–4 lines. Build emotional pressure toward the Chorus. End on tension, not resolution.
- [Spoken Intro]: narrative, atmospheric, no melody required; 2–3 lines.
- [Scene Change]: 2–3 lines, shifts perspective or time.
- [Finale] / [Outro]: 2–3 lines, closes the arc.
- Blank line after each section's content, before the next tag.
- Lines per section: Intro/Spoken Intro 2–3, Verse 4–6, Pre-Chorus/Build 3–4, Chorus/Final Chorus 4–6, Drop/Hook/Final Hook 3–4, Bridge/Break/Breakdown/Scene Change 3–4, Outro/Finale 2–3

BANNED PHRASES: "lose control" "feel alive" "in my veins" "break free" "take me higher"
  "warrior" "rise above" "burning inside" "meant to be" "forever and always"
  "neon-lit streets" "rain-soaked streets" "fluorescent flicker"
  "loneliness in the crowd" "city lights below" "tears in the rain"
  "街の灯り" "光の海" "君の笑顔" "翼を広げて" "空に向かって"
  "蛍光灯" "滲んだ街明かり" "雨に濡れた街" "夜明け前" "光と影" "誰もいない部屋" (generic AI filler)

VISUAL IMAGERY RULE: Do not default to generic urban night imagery (neon streets, fluorescent
  lights, rain-soaked city, dawn-before-sunrise metaphors) unless the Quick Idea or Style Prompt
  explicitly contains such imagery. If the Seed has no city / night / rain elements, invent
  concrete imagery that belongs to the Seed's own world instead.

QUALITY:
- Concrete > abstract. Name the thing. "うどんの麺が震える" beats "何かが溢れる".
- Obsessive, abnormal, or absurd themes need MATCHING imagery — lean into the weirdness.
- Match energy and pacing to the structure type: a Dance Drop should feel physically urgent; a Ballad Narrative should breathe slowly.
- Verse lines accumulate: build a concrete scene line by line. Each line adds a new object, sensation, or angle.
- Pre-Chorus tightens: emotional pressure rises, perspective narrows, tension is unresolved.
- Chorus delivers the thesis: 4–6 lines that form a complete emotional statement. Do not reduce the Chorus to compact poetic fragments — build it out. A 3-line chorus is a fragment; a 5-line chorus is a statement. Each Chorus line earns its place by adding a new dimension to the central hook.
- Hook/Drop lines must be short and physically urgent — 3–4 lines, built for repetition.
- Bridge/Scene Change shifts perspective or time.
- No over-explanation. Trust the image.

META-LANGUAGE RULE:
- Do not use analytical meta-words in the final lyrics: core, thesis, theme, claim,
  concept, motif, emotional thesis, emotional anchor.
- These words may guide your reasoning — they must not appear in the lyrics output.
- Express the emotional center as an image, confession, action, or concrete phrase.
- Lines like "that's the core of it all" or "this is the theme" are analysis, not poetry.
- Avoid any line that reads like a lyricist explaining what the song is about.

RAW REALITY RULE:
- Do not polish the source wound into generic literary sadness.
- Keep the rough, ordinary, specific reality of the source.
- Prefer mundane concrete details over elegant abstract grief.
  Everyday records, numbers, receipts, screens, habits, and repeated small actions
  carry the emotion — do not elevate them into poetic equivalents.
- If the source contains ordinary objects (a red pen, a printed slip, a can of coffee,
  a screen, a receipt, a zero), let those objects carry the emotion as they are.
- Ordinary pain expressed in ordinary words hits harder than beautiful grief.
- Avoid beautiful but generic phrases like "fading dream", "silent ending",
  "forgotten voice", "under a gray sky" unless directly anchored to a source detail.

CHORUS RULE — applies to [Chorus] and [Final Chorus]:
- The Chorus must state the core claim of the song: what the narrator really wants, fears, or cannot let go of. Answer that question directly in the Chorus.
- At least one concrete motif from the Quick Idea must appear in the Chorus — an object, action, place, phrase, or recurring image drawn from the theme.
- Do not fill the Chorus with generic emotion words (dream, hope, pain, light, darkness) unless each one is directly anchored to a concrete motif from the theme. Generic words alone are not a thesis.
- A strong Chorus has both: one concrete anchor image AND one emotional thesis line.
- The Chorus crystallizes the world built in the Verse — it does not escape it into abstraction.
- The Chorus must carry the SOURCE CORE LINE or its direct transformation — not a paraphrase, not a softened version.
- A complete Chorus contains all three: the SOURCE CORE LINE (or its direct transformation),
  at least one ordinary concrete detail from the source (a record, object, habit, or number),
  and one emotional thesis line. Missing any of the three makes the Chorus incomplete.
- Do not let the Chorus end after only the SOURCE CORE LINE — use the remaining lines
  to complete the emotional statement with concrete ordinary detail and thesis.
- If the Chorus opens with the source quote, follow it with concrete ordinary detail,
  not generic imagery.

BILINGUAL RULE (applies whenever English words or lines appear):
- English phrases must NOT translate or restate the adjacent Japanese line.
- English must add something new: a different image, emotional angle, sonic texture, or rhythmic hook.
- Prefer short English phrases — hook words, inner voice, texture fragments — over full explanatory sentences.
- Avoid bilingual mirror lines: writing the same meaning in Japanese and English side by side.
- Concrete English nouns and verbs beat abstract English sentiment words.

OUTPUT: Return ONLY valid JSON (no markdown, no code fences). JSON string values must not contain literal newlines — use \\n if a newline is needed.
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

/** Builds the STRUCTURE line for the prompt, honouring override priority. */
function resolveStructure(
  input: SongInput,
  lib: LibraryContext,
  structureOverride?: string,
  isCustomBlueprint?: boolean,
): string {
  const base = structureOverride ?? pickStructureForClaude(input);
  const hint = (!structureOverride && lib.structureHint)
    ? `\nSTRUCTURE PREFERENCE: ${lib.structureHint}`
    : "";
  const custom = isCustomBlueprint
    ? "\nSTRUCTURE CONSTRAINT: Use EXACTLY the sections listed above in that order. Do not add, remove, or reorder any section. Each section's content is free."
    : "";
  const meta = lib.metaTagHint ? `\nPREFERRED SECTIONS: ${lib.metaTagHint}` : "";
  return `${base}${hint}${custom}${meta}`;
}

function buildExpansionUserPrompt(
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

function buildLegacyUserPrompt(
  input: SongInput,
  presetDeep: string,
  lib: LibraryContext,
  structureOverride?: string,
  isCustomBlueprint?: boolean,
): string {
  const quickIdea = input.theme?.trim() || input.title?.trim() || "";
  return `${
    quickIdea
      ? `╔═══ QUICK IDEA (TOP PRIORITY) ═══╗\n${quickIdea}\n╚══════════════════════════════════╝\n\n`
      : ""
  }Generate lyrics with these parameters:

TITLE: ${input.title || "(未設定)"}
GENRE: ${input.genreLock?.trim() || input.genre}
MOOD: ${input.mood}
VOCAL: ${input.vocalType}
BPM: ${input.bpm || "120"}
KEY: ${input.key || "Am"}
SONG LENGTH: ${input.songLength}
LANGUAGE: ${langInstruction(input.englishRatio)}
REFERENCE VIBE: ${input.referenceVibe || "(none)"}
AVOID: ${input.avoidExpressions || "(none)"}
STRUCTURE: ${resolveStructure(input, lib, structureOverride, isCustomBlueprint)}${lib.styleAddition ? `\nSTYLE TAGS: ${lib.styleAddition}` : ""}
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[mora/generate] GEMINI_API_KEY is not set — returning 503. " +
      "Create .env.local with GEMINI_API_KEY=AIza... to enable Gemini. " +
      "Client will fall back to rule-based lyric generation."
    );
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  let input: SongInput;
  let expansion: WorldExpansion | null = null;
  let lib: LibraryContext = { styleAddition: "", structureHint: "", metaTagHint: "" };
  let structureOverride: string | undefined;
  let isCustomBlueprint = false;
  try {
    const body = await req.json();
    input = body.songInput;
    expansion = body.expansion ?? null;
    lib = {
      styleAddition:  typeof body.libraryStyleAddition === "string"  ? body.libraryStyleAddition  : "",
      structureHint:  typeof body.libraryStructureHint === "string"  ? body.libraryStructureHint  : "",
      metaTagHint:    typeof body.libraryMetaTagHint   === "string"  ? body.libraryMetaTagHint    : "",
    };
    if (typeof body.structureOverride === "string" && body.structureOverride.trim()) {
      structureOverride = body.structureOverride.trim();
    }
    isCustomBlueprint = body.isCustomBlueprint === true;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const presetDeep = input.worldPreset
    ? (WORLD_PRESETS[input.worldPreset as WorldPresetKey]?.deepPrompt ?? "")
    : "";

  const userPrompt = expansion
    ? buildExpansionUserPrompt(expansion, input, lib, structureOverride, isCustomBlueprint)
    : buildLegacyUserPrompt(input, presetDeep, lib, structureOverride, isCustomBlueprint);

  try {
    const { text: raw, finishReason } = await callGemini(apiKey, SYSTEM_PROMPT, userPrompt, 3200);

    if (process.env.NODE_ENV !== "production") {
      const preview = raw.slice(0, 300).replace(/[\x00-\x1f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`);
      console.log("[mora/generate] raw preview:", preview);
      console.log(`[mora/generate] rawLength=${raw.length} finishReason=${finishReason ?? "unknown"}`);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(raw, { rawLength: raw.length, finishReason });
    } catch (parseErr) {
      console.error("[mora/generate] JSON parse failed:", parseErr);
      return NextResponse.json({ lyrics: "", notes: "" });
    }

    return NextResponse.json({
      lyrics: parsed.lyrics ?? "",
      notes: parsed.notes ?? "",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as Record<string, unknown>)?.status;
    const detail = status ? `HTTP ${status}: ${msg}` : msg;
    console.error("[mora/generate] Gemini API request failed:", detail);
    if (status === 401 || status === 403) {
      console.error("[mora/generate] → API key is invalid or lacks permission. Check GEMINI_API_KEY in .env.local");
    } else if (status === 429) {
      console.error("[mora/generate] → Rate limited by Google. Retry after a moment.");
    }
    return NextResponse.json({ lyrics: "", notes: "" });
  }
}
