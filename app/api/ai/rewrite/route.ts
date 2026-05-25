import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RewriteMode } from "@/types";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert Suno AI lyricist specializing in Japanese and English songs.
Your task: rewrite song lyrics according to the given mode, following these rules strictly.

RULES:
- Keep ALL section tags exactly as written: [Intro], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro]
- Japanese lines: mora count must stay 4–14 (ideal 6–12). Never make them longer.
- Chorus: short, emotionally direct, singable, repetition-friendly
- NEVER use AI clichés: "lose control", "feel alive", "in my veins", "break free", "take me higher", "forever and always", "warrior", "rise above", "burning inside"
- NEVER insert stage directions, explanations, or commentary into lyrics
- Preserve the world/atmosphere/emotion of the original
- Only change what the mode demands — minimal surgical rewrite
- Preserve empty lines between sections exactly

OUTPUT: Return ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "rewrittenLyrics": "<complete lyrics preserving all section tags and blank lines>",
  "notes": "<brief Japanese note about what was changed, 1–2 sentences>",
  "changedLines": [<1-indexed content line numbers that were changed, excluding section tags>]
}`;

function modeInstruction(mode: RewriteMode, moraWarnings: number[]): string {
  const warnStr =
    moraWarnings.length > 0
      ? `\nPriority targets: content lines at positions ${moraWarnings.join(", ")} are too long — shorten these first.`
      : "";

  const map: Record<RewriteMode, string> = {
    catchy:
      "Make the lyrics catchier. Shorten long lines to their most memorable fragment. Make hooks punchy, easy to recall, and singable in one breath.",
    "remove-ai":
      "Remove all AI-cliché and generic phrases. Replace with specific, unexpected, concrete imagery. Make it feel human, authentic, and surprising.",
    "shorten-mora":
      `Shorten every line that exceeds 14 mora. Cut to the essential meaning. Preserve emotion, tension, and rhyme feel as much as possible.${warnStr}`,
    "strengthen-chorus":
      "Rewrite the [Chorus] section only. Make it shorter, more emotionally direct, highly singable, and built for repetition. Leave all other sections untouched.",
    "more-japanese":
      "Replace English words and phrases with natural Japanese equivalents that preserve the original meaning, feel, and rhythm.",
    "more-english":
      "Replace Japanese words and phrases with natural English equivalents that preserve the original meaning, feel, and rhythm.",
    darker:
      "Make the lyrics darker and more desperate. Replace hopeful or neutral expressions with darker, melancholic, or threatening imagery. Intensify the shadow.",
    danceable:
      "Make lyrics more dance-floor-friendly. Shorter lines, punchy syllables, strong rhythmic stress, physical energy in the words.",
    ojaly:
      "Rewrite in 'ojaly.' signature style: inject digital/network metaphors (timestamps, server errors, cache memory, dropped connections), cyberpunk urban imagery, and unexpected technical-poetic juxtapositions. Keep the emotional core but make it feel like a hacker's inner monologue.",
  };

  return map[mode] ?? "Improve the overall quality of the lyrics.";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: {
    mode: RewriteMode;
    lyrics: string;
    stylePrompt: string;
    songInput: Record<string, unknown>;
    moraWarnings?: number[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mode, lyrics, stylePrompt, moraWarnings = [] } = body;

  if (!mode || !lyrics) {
    return NextResponse.json(
      { error: "mode and lyrics are required" },
      { status: 400 }
    );
  }

  const userPrompt = `MODE: ${mode}
INSTRUCTION: ${modeInstruction(mode, moraWarnings)}

STYLE PROMPT (reference for tone and world — do not include in output):
${stylePrompt || "(none)"}

CURRENT LYRICS:
${lyrics}

Rewrite following the mode instruction. Return JSON only.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected Claude response type");
    }

    // Strip optional markdown code fences
    const raw = content.text
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(raw);

    return NextResponse.json({
      rewrittenLyrics: parsed.rewrittenLyrics ?? lyrics,
      rewrittenStylePrompt: parsed.rewrittenStylePrompt ?? undefined,
      notes: parsed.notes ?? "",
      changedLines: Array.isArray(parsed.changedLines) ? parsed.changedLines : [],
    });
  } catch (err) {
    console.error("[Claude API error]", err);
    return NextResponse.json(
      { error: "Claude API request failed" },
      { status: 500 }
    );
  }
}
