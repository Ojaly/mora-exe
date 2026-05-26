import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { WorldExpansion, MusicDirection } from "@/types";
import {
  extractThemeDescriptors,
  extractThemeMotifsForLyrics,
} from "@/lib/themeExtractor";

export const dynamic = "force-dynamic";

// ─── Rule-based MusicDirection ────────────────────────────────────────────────

function ruleBasedMusicDirection(
  worldSeed: string,
  styleWords: string[],
  motifs: string[]
): MusicDirection {
  // BPM estimate from intensity / mood cues
  let bpmEstimate: number | null = null;
  if (/退廃|obsess|ゆっくり|ritual|melanchol|slow/.test(worldSeed))    bpmEstimate = 72;
  else if (/aggressive|fast|intense|ダンス|高速/.test(worldSeed))       bpmEstimate = 132;
  else if (/ファンク|funk|groove/.test(worldSeed))                      bpmEstimate = 96;
  else if (/ポップ|pop|キャッチ|upbeat/.test(worldSeed))                bpmEstimate = 110;

  // Genre hint — world-specific, not standard genre names
  let genreHint = "atmospheric experimental";
  if (/退廃|decaden/.test(worldSeed))             genreHint = "decadent slow-burn";
  if (/偏執|obsess/.test(worldSeed))              genreHint = "obsessive minimal";
  if (/ファンク|funk/.test(worldSeed))            genreHint = "uncanny psychedelic funk";
  if (/jazz|ジャズ/.test(worldSeed))              genreHint = "dark jazz";
  if (/neo.soul|ネオソウル/.test(worldSeed))      genreHint = "neo-soul";
  if (/企業|corporate|CM|ビジネス/.test(worldSeed)) genreHint = "uncanny corporate pop";
  if (/民謡|folk/.test(worldSeed))               genreHint = "dark folk";
  if (/electro|シンセ|synth/.test(worldSeed))    genreHint = "cold electronic";
  if (/hip.hop|ヒップホップ/.test(worldSeed))    genreHint = "abstract hip-hop";

  // Atmosphere: styleWords + sensory hint from primary motif
  const atParts: string[] = [...styleWords.slice(0, 2)];
  if (motifs[0]) atParts.push(`${motifs[0]}-scented`);
  atParts.push("intimate");
  const atmosphere = [...new Set(atParts)].slice(0, 4).join(", ");

  // Tempo feel
  let tempoFeel = "mid-tempo, deliberate";
  if (bpmEstimate && bpmEstimate <= 80)          tempoFeel = "slow, deliberate";
  else if (bpmEstimate && bpmEstimate >= 120)    tempoFeel = "driven, relentless";
  else if (/ゆっくり|slow|heavy/.test(worldSeed)) tempoFeel = "slow, meditative";

  // Vocal style
  let vocalStyle = "close-mic, intimate";
  if (/女|female|girl/.test(worldSeed))          vocalStyle = "breathy female, close-mic";
  else if (/男|male|man/.test(worldSeed))        vocalStyle = "dry male, hushed";
  if (/choir|コーラス|合唱/.test(worldSeed))     vocalStyle = "layered choir, ritualistic";

  // Instruments — context-aware
  const isFood   = /うどん|ラーメン|そば|餃子|コーヒー/.test(worldSeed);
  const isFunk   = /ファンク|funk/.test(worldSeed);
  const isAmbient = /ambient|アンビエント|宇宙|space/.test(worldSeed);
  const instruments = isFood    ? ["minimal piano", "sparse brushed percussion", "low bass drone"]
                    : isFunk    ? ["clean electric guitar", "funk bass", "tight snare", "organ"]
                    : isAmbient ? ["sustained synth pads", "subtle field textures", "sparse piano"]
                    :             ["sparse piano", "minimal percussion"];

  return {
    genreHint,
    atmosphere,
    tempoFeel,
    bpmEstimate,
    vocalStyle,
    instruments,
    moodWords: styleWords.slice(0, 5),
    source: "rule",
  };
}

// ─── Rule-based full forge ─────────────────────────────────────────────────────

function ruleBasedForge(worldSeed: string): WorldExpansion {
  const desc   = extractThemeDescriptors(worldSeed);
  const motifs = extractThemeMotifsForLyrics(worldSeed);
  const md     = ruleBasedMusicDirection(worldSeed, desc.styleWords, motifs);

  const primaryMotif = motifs[0] ?? "";

  const scene: string[] = [];
  if (primaryMotif) {
    scene.push(`${primaryMotif}が中心に置かれた薄暗い空間`);
    scene.push(`誰かが${primaryMotif}に向かって祈るように向き合っている`);
  } else {
    scene.push("薄暗く静寂に満ちた空間");
    scene.push("誰かが何かに執着しながら佇んでいる");
  }
  if (desc.styleWords[0]) scene.push(`${desc.styleWords[0]}な光と影が交差する`);

  const emotion = desc.styleWords.length > 0
    ? desc.styleWords.slice(0, 5)
    : ["intense", "focused", "solitary"];

  const texture = primaryMotif
    ? ["intimate", "hushed", "close-mic", "minimal reverb"]
    : ["sparse", "intimate", "focused", "dry"];

  const objects = motifs.slice(0, 7);

  // Contradiction detection
  const contradiction: string[] = [];
  const isFood   = /うどん|ラーメン|そば|餃子|コーヒー/.test(worldSeed);
  const isIntense = /偏執|狂信|退廃|崇拝|執着|狂気/.test(worldSeed);
  const isCorporate = /企業|CM|完璧|ビジネス/.test(worldSeed);
  const isGrotesque = /不気味|怖い|ホラー/.test(worldSeed);

  if (isFood && isIntense) {
    contradiction.push(`日常的な${primaryMotif || "食"}への神聖な執着`);
    contradiction.push("mundane subject ↔ religious intensity");
  } else if (isCorporate && isGrotesque) {
    contradiction.push("完璧な表面 ↔ 不気味な内部");
    contradiction.push("corporate polish ↔ uncanny distortion");
  } else if (md.moodWords.includes("decadent") || md.moodWords.includes("ritualistic")) {
    contradiction.push("崩壊への意志 ↔ 儀式的な秩序");
  }

  const soundDirection = [...new Set([
    ...desc.enMotifs.slice(0, 2),
    ...desc.styleWords.slice(0, 3),
  ])].slice(0, 5);
  if (soundDirection.length === 0) soundDirection.push("minimal", "atmospheric");

  const stylePromptDraft = [
    `[Quick Idea:] ${worldSeed}`,
    `[Style:] ${md.atmosphere}, ${md.moodWords.join(", ")}  (${md.genreHint})`,
    `[Tempo:] ${md.bpmEstimate ? md.bpmEstimate + " BPM, " : ""}${md.tempoFeel}`,
    `[Vocal:] ${md.vocalStyle}`,
    `[Instruments:] ${md.instruments.join(", ")}`,
    objects.length > 0 ? `[Concept:] ${objects.slice(0, 5).join(", ")}` : "",
    contradiction.length > 0 ? `[World:] ${contradiction[0]}` : "",
    `[Note:] Write from inside this world — concrete imagery, no generic filler`,
  ].filter(Boolean).join("\n");

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
    musicDirection: md,
    stylePromptDraft,
    lyricsDirection,
  };
}

// ─── Claude system prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a World Expansion Engine for music production.
Transform a brief World Seed into a rich, sensory world for Suno AI.

RULES:
- Convert abstract words into film-like scenes: light, smell, texture, temperature, action, place
- Find the CONTRADICTION or paradox — the most interesting songs have internal tension
- Extract physical objects and motifs (prefer Japanese for food/place words)
- soundDirection: Suno-ready English sonic descriptors (NOT genre names, but qualities)
- musicDirection: MORA.exe's interpretation of what this world SOUNDS like
  - genreHint: world-specific label, NOT standard genre (e.g. "ritualistic downtempo neo-soul" not "J-Pop")
  - atmosphere: 2-4 sensory/atmospheric descriptors
  - tempoFeel: specific character (e.g. "slow, deliberate" not just "slow")
  - bpmEstimate: integer or null
  - vocalStyle: specific texture + mic treatment (e.g. "breathy female, close-mic, intimate")
  - instruments: 2-4 instruments that exist in this world's texture
  - moodWords: 3-5 emotional/atmospheric adjectives
- stylePromptDraft: start with [Quick Idea:], then [Style:] = atmosphere first (NOT "J-Pop, melancholic")
  Example: [Style:] humid fluorescent loneliness, ritualistic noodle preparation, obsessive comfort-seeking  (decadent downtempo)
- lyricsDirection: JP sentence on how lyrics should approach this world emotionally
- AVOID generic imagery: "光の海" "starlight" "feel alive" "dance in the rain" "burning soul"

OUTPUT: Valid JSON only — no markdown fences:
{
  "scene": ["3-4 cinematic fragments (JP preferred, under 25 chars each)"],
  "emotion": ["3-5 atmosphere/emotion words (EN)"],
  "texture": ["3-4 sonic texture descriptors (EN)"],
  "objects": ["4-8 physical motifs (JP preferred)"],
  "contradiction": ["1-3 paradoxes/tensions (JP or EN)"],
  "soundDirection": ["4-6 Suno-ready style words (EN)"],
  "musicDirection": {
    "genreHint": "world-specific genre feel (EN, 3-6 words)",
    "atmosphere": "2-4 sensory descriptors (EN)",
    "tempoFeel": "tempo character (EN)",
    "bpmEstimate": <number or null>,
    "vocalStyle": "specific vocal texture + mic treatment (EN)",
    "instruments": ["2-4 instruments"],
    "moodWords": ["3-5 mood words (EN)"]
  },
  "stylePromptDraft": "complete Suno prompt with [Tag:] lines, atmosphere-first",
  "lyricsDirection": "JP: one sentence on how lyrics should approach this world"
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
    console.warn("[mora/forge] No ANTHROPIC_API_KEY — rule-based expansion");
    return NextResponse.json(ruleBasedForge(worldSeed));
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `World Seed: "${worldSeed}"\n\nExpand this world. Return JSON only.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const raw = content.text
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(raw) as Partial<WorldExpansion>;

    // Ensure musicDirection.source is set
    if (parsed.musicDirection) {
      parsed.musicDirection.source = "claude";
    } else {
      // Fallback if Claude omitted the field
      const desc = extractThemeDescriptors(worldSeed);
      const motifs = extractThemeMotifsForLyrics(worldSeed);
      parsed.musicDirection = ruleBasedMusicDirection(worldSeed, desc.styleWords, motifs);
    }

    return NextResponse.json(parsed as WorldExpansion);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mora/forge] Claude API failed:", msg, "— rule-based fallback");
    return NextResponse.json(ruleBasedForge(worldSeed));
  }
}
