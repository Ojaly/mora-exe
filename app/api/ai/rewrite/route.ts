import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RewriteMode, RewriteIntensity, SectionTarget, WorldPresetKey } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a Suno AI lyricist. Rewrite song lyrics with surgical precision.

HARD RULES:
- Keep ALL section tags exactly: [Intro] [Verse 1] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Outro]
- Japanese lines: mora count 4–14 (ideal 6–12). Never add length.
- Chorus: short, emotionally direct, singable. Built for repetition. 2–4 lines.
- BANNED phrases: "lose control" "feel alive" "in my veins" "break free" "take me higher" "warrior" "rise above" "burning inside" "forever and always" "I can't stop" "meant to be"
- No stage directions, no explanations, no parenthetical commentary in lyrics
- No over-explanation. Trust imagery. Concrete > abstract.
- Preserve blank lines between sections exactly

QUALITY TARGETS:
- Emotional density over decoration
- Unexpected imagery > generic poetry
- Rhythmic readability for Suno singing
- Lines should feel singable in one breath

OUTPUT: Return ONLY valid JSON (no markdown, no code fences):
{
  "rewrittenLyrics": "<complete lyrics with all section tags and blank lines>",
  "notes": "<1–2 sentence Japanese note on what changed and why>",
  "changedLines": [<1-indexed content line numbers changed, section tags excluded>]
}`;

const PRESET_DEEP: Partial<Record<WorldPresetKey, string>> = {
  neon: "World lens: cyber melancholy. Wet streets reflecting neon at 3am. Urban loneliness inside a digital shell. Signal degradation as emotion. Images should feel like a CRT screen through rain.",
  corporate: "World lens: corporate perfection masking hollow emotion. Luxury dystopia. Fluorescent warmth at 11pm. Polished surface over existential dread.",
  mythic: "World lens: mythic scale, legendary tone. Cinematic destiny. Ancient oaths. Sacrifice honored by silence. Write with the weight of fading empires.",
  "digital-motown": "World lens: digital Motown. Groove warmth rebuilt in a DAW. Retro-futuristic soul. The ache of reaching for something human through a machine.",
  "electro-waltz": "World lens: rotational rhythm, elegant melancholy. Ballroom corrupted by static. Lines should feel like they turn — 3/4 cadence in the language.",
  "gospel-irony": "World lens: sacred language for secular pain. Redemption irony — the sermon that admits doubt. Gospel energy without religion. Communal intensity.",
};

function intensityInstruction(intensity: RewriteIntensity): string {
  if (intensity === "subtle")
    return "INTENSITY: SUBTLE — Preserve atmosphere entirely. Change at most 15–20% of lines. Fix only the most glaring issues. The listener should barely notice.";
  if (intensity === "aggressive")
    return "INTENSITY: AGGRESSIVE — Rebuild boldly. Keep only the emotional core and section structure. New imagery, new phrasing, new rhythmic attack. Transform, don't touch-up.";
  return "INTENSITY: MEDIUM — Meaningful improvements while preserving the world and atmosphere.";
}

function sectionInstruction(target: SectionTarget): string {
  if (target === "all") return "";
  const labels: Record<SectionTarget, string> = {
    all: "",
    chorus: "[Chorus] sections",
    verse: "[Verse 1] and [Verse 2] sections",
    "pre-chorus": "[Pre-Chorus] sections",
    bridge: "[Bridge] sections",
  };
  return `\nSECTION TARGET: Rewrite ONLY the ${labels[target]}. Leave every other section word-for-word identical.`;
}

function modeInstruction(mode: RewriteMode, moraWarnings: number[]): string {
  const warnStr =
    moraWarnings.length > 0
      ? `\nMORA PRIORITY: Lines at positions ${moraWarnings.join(", ")} exceed 14 mora — shorten these first while preserving meaning and heat.`
      : "";

  const map: Record<RewriteMode, string> = {
    catchy:
      "Make it catchier. Cut long lines to their sharpest fragment. Hooks must be punchy, one-breath singable, and impossible to forget.",
    "remove-ai":
      "Strip all generic AI poetry. Replace with specific, concrete, surprising imagery. If it sounds like a writing prompt response, rewrite it. Make it feel written by a human who lived it.",
    "shorten-mora":
      `Shorten every line over 14 mora. Cut to the essential meaning. Preserve emotional temperature, tension, and rhythmic feel. No flat reductions — make shorter lines hit harder.${warnStr}`,
    "strengthen-chorus":
      "Rewrite [Chorus] sections only. Shorter lines, more direct emotion, higher singability, built for repetition. Every word must earn its place. Leave all other sections untouched.",
    "more-japanese":
      "Replace English with natural Japanese that preserves meaning, rhythm, and emotional register. Avoid literal translation — find the Japanese that feels right, not just correct.",
    "more-english":
      "Replace Japanese with natural English that preserves meaning, rhythm, and emotional register. Avoid literal translation — find the English that lands.",
    darker:
      "Deepen the shadow. Replace hope or neutrality with dread, desperation, or melancholic beauty. Don't just swap words — shift the emotional temperature of the whole piece.",
    danceable:
      "Make it move. Shorter lines, punchy syllables, rhythmic stress on strong beats, physical energy in the word choices. The body should feel this, not just the mind.",
    ojaly:
      "Rewrite in 'ojaly.' signature style: digital/network metaphors (timestamps, dropped packets, cache, server errors), cyberpunk urban imagery, technical-poetic juxtaposition. Keep emotional core, make it feel like a hacker's inner monologue at 2am.",
  };

  return map[mode] ?? "Improve overall quality.";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "[mora/rewrite] ANTHROPIC_API_KEY is not set — returning 503. " +
      "Create .env.local with ANTHROPIC_API_KEY=sk-ant-... to enable Claude. " +
      "Client will fall back to rule-based rewrite."
    );
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
    intensity?: RewriteIntensity;
    sectionTarget?: SectionTarget;
    worldPreset?: WorldPresetKey | "";
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    mode,
    lyrics,
    stylePrompt,
    moraWarnings = [],
    intensity = "medium",
    sectionTarget = "all",
    worldPreset = "",
  } = body;

  if (!mode || !lyrics) {
    return NextResponse.json(
      { error: "mode and lyrics are required" },
      { status: 400 }
    );
  }

  const presetDeep = worldPreset ? (PRESET_DEEP[worldPreset as WorldPresetKey] ?? "") : "";

  const userPrompt = `${intensityInstruction(intensity)}
${sectionInstruction(sectionTarget)}

MODE: ${mode}
INSTRUCTION: ${modeInstruction(mode, moraWarnings)}
${presetDeep ? `\n${presetDeep}` : ""}

STYLE CONTEXT (tone/world reference — do not output):
${stylePrompt || "(none)"}

CURRENT LYRICS:
${lyrics}

Return JSON only.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected Claude response type");

    const raw = content.text
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(raw);

    return NextResponse.json({
      rewrittenLyrics: parsed.rewrittenLyrics ?? lyrics,
      notes: parsed.notes ?? "",
      changedLines: Array.isArray(parsed.changedLines) ? parsed.changedLines : [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Surface Anthropic-specific error details
    const detail = (err as Record<string, unknown>)?.status
      ? `HTTP ${(err as Record<string, unknown>).status}: ${msg}`
      : msg;
    console.error("[mora/rewrite] Claude API request failed:", detail);
    if ((err as Record<string, unknown>)?.status === 401) {
      console.error("[mora/rewrite] → API key is invalid or expired. Check ANTHROPIC_API_KEY in .env.local");
    } else if ((err as Record<string, unknown>)?.status === 429) {
      console.error("[mora/rewrite] → Rate limited by Anthropic. Retry after a moment.");
    }
    return NextResponse.json({ error: "Claude API request failed", detail }, { status: 500 });
  }
}
