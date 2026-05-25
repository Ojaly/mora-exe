import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SongInput } from "@/types";

export const dynamic = "force-dynamic";

function buildSections(input: SongInput): string {
  if (input.startWithChorus) {
    if (input.songLength === "30s") return "[Chorus]";
    if (input.songLength === "90s") return "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus]";
    return "[Chorus] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Outro]";
  }
  if (input.songLength === "30s") return "[Chorus]";
  if (input.songLength === "90s") return "[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus]";
  return "[Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Outro]";
}

function langInstruction(ratio: string): string {
  if (ratio === "high") return "Write mostly in English (80%+). Japanese phrases are ok for flavor.";
  if (ratio === "mixed") return "Mix Japanese and English roughly half/half. Alternate lines or sections.";
  return "Write mostly in Japanese (80%+). English phrases are ok for flavor.";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  let input: SongInput;
  try {
    const body = await req.json();
    input = body.songInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const systemPrompt = `You are a professional Suno AI lyricist. Write song lyrics that directly reflect the given theme and world.

RULES:
- Section tags are REQUIRED and must be written exactly: [Intro], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro]
- Japanese lines: keep mora count 4–14 (ideal 6–12). Never write long run-on lines.
- Chorus lines: short, emotionally direct, singable, built for repetition (2–4 lines max per chorus)
- NEVER use AI clichés: "lose control", "feel alive", "in my veins", "break free", "take me higher", "warrior", "rise above"
- The theme/world given by the user MUST be the central subject — do not write generic love songs
- Each section needs a blank line after it before the next section tag
- Keep the number of lines per section reasonable: Intro 2–3, Verse 4–6, Pre-Chorus 2–3, Chorus 3–5, Bridge 3–4, Outro 2–3

OUTPUT: Return ONLY valid JSON (no markdown, no code fences):
{
  "lyrics": "<complete lyrics with all section tags and blank lines between sections>",
  "notes": "<1–2 sentence Japanese note about how the theme was reflected>"
}`;

  const userPrompt = `Generate lyrics for this song:

TITLE: ${input.title || "(未設定)"}
THEME / WORLD: ${input.theme || "(未設定)"}
GENRE: ${input.genre}
MOOD: ${input.mood}
VOCAL: ${input.vocalType}
BPM: ${input.bpm || "120"}
KEY: ${input.key || "Am"}
SONG LENGTH: ${input.songLength}
LANGUAGE RATIO: ${langInstruction(input.englishRatio)}
REFERENCE VIBE: ${input.referenceVibe || "(none)"}
AVOID: ${input.avoidExpressions || "(none)"}
STRUCTURE: ${buildSections(input)}

The lyrics must be DIRECTLY ABOUT the theme "${input.theme || input.title}". Do not write generic lyrics — make every line tied to the world described.

Return JSON only.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const raw = content.text.trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(raw);

    return NextResponse.json({
      lyrics: parsed.lyrics ?? "",
      notes: parsed.notes ?? "",
    });
  } catch (err) {
    console.error("[Claude generate error]", err);
    return NextResponse.json({ error: "Claude API failed" }, { status: 500 });
  }
}
