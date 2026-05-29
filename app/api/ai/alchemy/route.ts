import { NextRequest, NextResponse } from "next/server";
import { AlchemyResult } from "@/types";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Source Alchemy — a transmutation engine for MORA.exe (World Translator IDE).

MISSION: Take real-world source material (news article, SNS post, opinion piece, personal experience) + the user's emotional reaction, and alchemize them into universal poetic material for music.

TRANSMUTATION LAWS:
1. ZERO proper nouns in output — no names, company names, place names, dates, product names
2. NEVER describe the event directly — abstract it completely
3. Extract EMOTIONAL CORE from the reaction, not factual content from the source
4. Find the universal human pattern hidden inside the specific event
5. Transform anger / criticism → metaphor, imagery, parable
6. Transform grief / loss → sensory fragments, texture, temperature
7. Transform awe / wonder → light quality, movement, sonic space
8. songWorld = cinematic film location, never a news headline
9. metaphors = concrete sensory images that carry emotional weight without naming the source
10. worldSeed = poetic entry point for the World Forge engine (1-2 sentences, JP preferred)

ALCHEMY QUALITY BAR:
  Bad:  "A powerful company controls information" → fails, too literal
  Good: "霧の向こう側で誰かが鏡を磨いている"

  Bad:  "Someone lost their job to automation" → fails, still factual
  Good: "手が空っぽになった朝、機械だけが歌っている"

  Bad:  "The news made me angry at injustice"
  Good: reactionCore = ["怒り", "無力感", "見えない壁への衝動"]

songWorld fragments must feel like you stumbled into a scene mid-film.
metaphors must be tactile — texture, smell, weight, temperature, sound.
chorusHookIdeas = emotional image hooks, not literal statements about the event.
worldSeed = the one sentence a songwriter needs to enter this world.

OUTPUT: Return ONLY valid JSON (no markdown, no code fences):
{
  "sourceSummary": "1-sentence abstract, zero proper nouns, describes the emotional/structural shape of what happened",
  "reactionCore": ["3-5 raw emotion words distilled from user reaction — JP or EN"],
  "universalThemes": ["3-5 universal human themes this maps to (e.g. '消えていく声', '見えない支配', '手放すこと')"],
  "songWorld": ["3-4 cinematic world fragments, JP preferred, under 25 chars each"],
  "metaphors": ["4-6 concrete sensory metaphors — EN/JP mix ok, avoid abstraction"],
  "stylePromptDraft": "atmosphere-first Suno style, NOT genre-first",
  "lyricsDirection": "JP: one sentence on how lyrics should enter this world emotionally",
  "chorusHookIdeas": ["2-3 chorus hook concepts as poetic images, not event descriptions"],
  "worldSeed": "1-2 sentence World Seed for World Forge — JP preferred, zero proper nouns, poetic not journalistic"
}`;

// ─── Gemini REST helper ───────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
): Promise<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens,
        response_mime_type: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw Object.assign(new Error(`Gemini HTTP ${res.status}: ${body}`), { status: res.status });
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Source Alchemy requires Gemini API — add GEMINI_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  let sourceText: string;
  let userReaction: string;
  let desiredTone: string;
  let avoidDirectReference: boolean;

  try {
    const body = await req.json();
    sourceText           = (body.sourceText ?? "").trim();
    userReaction         = (body.userReaction ?? "").trim();
    desiredTone          = (body.desiredTone ?? "").trim();
    avoidDirectReference = body.avoidDirectReference ?? true;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!sourceText) {
    return NextResponse.json({ error: "sourceText is required" }, { status: 400 });
  }

  const avoidNote = avoidDirectReference
    ? "\nCRITICAL: ALL proper nouns, brand names, place names, person names must be removed from every field of the output. Zero direct references."
    : "";

  const userPrompt = `SOURCE TEXT:
"""
${sourceText.slice(0, 3000)}
"""

USER REACTION:
"${userReaction || "(no reaction specified)"}"
${desiredTone ? `\nDESIRED TONE: ${desiredTone}` : ""}${avoidNote}

Transmute this into universal poetic material for music. Return JSON only.`;

  try {
    const raw = await callGemini(apiKey, SYSTEM_PROMPT, userPrompt, 1200);
    const parsed = JSON.parse(raw) as AlchemyResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as Record<string, unknown>)?.status;
    console.error("[mora/alchemy] Gemini API failed:", msg);
    if (status === 401 || status === 403) {
      console.error("[mora/alchemy] → API key is invalid or lacks permission. Check GEMINI_API_KEY in .env.local");
    } else if (status === 429) {
      console.error("[mora/alchemy] → Rate limited by Google. Retry after a moment.");
    }
    return NextResponse.json({ error: "Alchemy failed", detail: msg }, { status: 500 });
  }
}
