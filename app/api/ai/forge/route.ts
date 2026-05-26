import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { WorldExpansion } from "@/types";
import {
  extractThemeDescriptors,
  extractThemeMotifsForLyrics,
} from "@/lib/themeExtractor";

export const dynamic = "force-dynamic";

// ─── Rule-based fallback ──────────────────────────────────────────────────────

function ruleBasedForge(worldSeed: string): WorldExpansion {
  const desc = extractThemeDescriptors(worldSeed);
  const motifs = extractThemeMotifsForLyrics(worldSeed);

  const primaryMotif = motifs[0] ?? "";

  // Scene: compose 2-3 brief cinematic fragments
  const scene: string[] = [];
  if (primaryMotif) {
    scene.push(`${primaryMotif}が中心に置かれた薄暗い空間`);
    scene.push(`誰かが${primaryMotif}に向かって祈るように向き合っている`);
  } else {
    scene.push("薄暗く静寂に満ちた空間");
    scene.push("誰かが何かに執着しながら佇んでいる");
  }
  if (desc.styleWords[0]) {
    scene.push(`${desc.styleWords[0]}な光と影が交差する`);
  }

  const emotion = desc.styleWords.length > 0
    ? desc.styleWords.slice(0, 5)
    : ["intense", "focused", "solitary"];

  const texture = primaryMotif
    ? ["intimate", "hushed", "close-mic", "minimal reverb"]
    : ["sparse", "intimate", "focused", "dry"];

  const objects = motifs.slice(0, 7);

  // Contradiction: detect paradoxes
  const contradiction: string[] = [];
  const isFood = /うどん|ラーメン|そば|餃子|コーヒー|酒|カレー/.test(worldSeed);
  const isIntense = /偏執|狂信|退廃|崇拝|執着|狂気/.test(worldSeed);
  const isCorporate = /企業|CM|完璧|ビジネス/.test(worldSeed);
  const isGrotesque = /不気味|怖い|ホラー/.test(worldSeed);

  if (isFood && isIntense) {
    contradiction.push(`日常的な${primaryMotif || "食"}への神聖な執着`);
    contradiction.push("mundane subject ↔ religious intensity");
  } else if (isCorporate && isGrotesque) {
    contradiction.push("完璧な表面 ↔ 不気味な内部");
    contradiction.push("corporate polish ↔ uncanny distortion");
  } else if (desc.styleWords.includes("decadent") && desc.styleWords.includes("ritualistic")) {
    contradiction.push("崩壊への意志 ↔ 儀式的な秩序");
  }

  const soundDirection: string[] = [
    ...desc.enMotifs.slice(0, 2),
    ...desc.styleWords.slice(0, 3),
  ].slice(0, 5);

  if (soundDirection.length === 0) {
    soundDirection.push("minimal", "focused", "atmospheric");
  }

  // Style prompt draft
  const styleParts: string[] = [
    `[Quick Idea:] ${worldSeed}`,
  ];

  const styleAtmosphere = [
    ...desc.styleWords.slice(0, 4),
  ].join(", ");
  if (styleAtmosphere) {
    styleParts.push(`[Style:] ${styleAtmosphere}, atmospheric`);
  } else {
    styleParts.push(`[Style:] experimental, atmospheric`);
  }

  if (desc.enMotifs.length > 0) {
    styleParts.push(`[Concept:] ${desc.enMotifs.join(", ")}`);
  }
  if (objects.length > 0) {
    styleParts.push(`[Objects:] ${objects.slice(0, 5).join(", ")}`);
  }
  if (soundDirection.length > 0) {
    styleParts.push(`[Sound:] ${soundDirection.join(", ")}`);
  }
  styleParts.push(
    `[Note:] Write from inside this world — every line traceable to the seed`
  );

  const lyricsDirection =
    `「${worldSeed}」を中心に` +
    (objects.length > 0
      ? `${objects.slice(0, 3).join("・")}などの具体的なモチーフで世界を構築する`
      : "具体的なイメージで世界を構築する");

  return {
    scene,
    emotion,
    texture,
    objects,
    contradiction,
    soundDirection,
    stylePromptDraft: styleParts.join("\n"),
    lyricsDirection,
  };
}

// ─── Claude system prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a World Expansion Engine for music production.
Transform a brief World Seed into a rich, sensory world suitable for Suno AI.

RULES:
- Convert abstract words into film-like scenes: light, smell, texture, temperature, action, place
- Find the CONTRADICTION or paradox — the most interesting songs have internal tension
- Extract physical objects that anchor this world (prefer Japanese words)
- soundDirection: Suno-ready English descriptors (sonic qualities, NOT genres)
- stylePromptDraft: complete Suno-style prompt string, start with [Quick Idea:]
- lyricsDirection: brief Japanese instruction for what the lyrics should "do" emotionally
- AVOID generic imagery: "光の海" "starlight" "feel alive" "dance in the rain" "burning soul"
- Every field must be traceable to the World Seed

OUTPUT: Valid JSON only — no markdown fences, no explanation:
{
  "scene": ["3-4 short cinematic fragments (JP preferred, each under 25 chars)"],
  "emotion": ["3-5 specific atmosphere/emotion words (English)"],
  "texture": ["3-4 sonic texture descriptors (English)"],
  "objects": ["4-8 physical objects or motifs (Japanese preferred)"],
  "contradiction": ["1-3 core paradoxes or tensions (Japanese or English)"],
  "soundDirection": ["4-6 Suno-ready style words (English)"],
  "stylePromptDraft": "complete Suno prompt with [Tag:] lines",
  "lyricsDirection": "Japanese: one sentence on how lyrics should approach this world"
}`;

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let worldSeed: string;
  try {
    const body = await req.json();
    worldSeed = (body.worldSeed ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!worldSeed) {
    return NextResponse.json({ error: "worldSeed is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[mora/forge] No ANTHROPIC_API_KEY — using rule-based expansion");
    return NextResponse.json(ruleBasedForge(worldSeed));
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `World Seed: "${worldSeed}"\n\nExpand this world into the JSON structure. Return JSON only.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const raw = content.text
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(raw) as WorldExpansion;
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mora/forge] Claude API failed:", msg, "— rule-based fallback");
    return NextResponse.json(ruleBasedForge(worldSeed));
  }
}
