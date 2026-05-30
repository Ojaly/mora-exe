import { NextRequest, NextResponse } from "next/server";
import { RewriteMode, RewriteIntensity, SectionTarget, WorldPresetKey } from "@/types";
import { WORLD_PRESETS } from "@/lib/worldPresets";

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
    if (esc)              { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"')        { inStr = !inStr; continue; }
    if (inStr)            { continue; }
    if (c === "{")        { depth++; }
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

BILINGUAL RULE (applies whenever English words or lines appear):
- English phrases must NOT translate or restate the adjacent Japanese line.
- English must add something new: a different image, emotional angle, sonic texture, or rhythmic hook.
- Prefer short English phrases — hook words, inner voice, texture fragments — over full explanatory sentences.
- Avoid bilingual mirror lines: writing the same meaning in Japanese and English side by side.
- Concrete English nouns and verbs beat abstract English sentiment words.

OUTPUT: Return ONLY valid JSON (no markdown, no code fences). JSON string values must not contain literal newlines — use \\n if a newline is needed.
{
  "rewrittenLyrics": "<complete lyrics with all section tags and blank lines>",
  "notes": "<1–2 sentence Japanese note on what changed and why>",
  "changedLines": [<1-indexed content line numbers changed, section tags excluded>]
}`;

// ─── Prompt helpers ───────────────────────────────────────────────────────────

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
      "Make it catchier and more memorable. Prioritize hook quality above all else: the chorus must be impossible to unhear, built on rhythmic repetition and a single unforgettable phrase. " +
      "Verse lines should build tension toward that hook. Only shorten a line when cutting it makes it hit harder rhythmically — not for brevity's sake. " +
      "The goal is earworm density: every bar should feel like it wants to be sung again. " +
      "Favor short, punchy words with strong vowel sounds. If the chorus doesn't lodge in the listener's head, rewrite it until it does.",
    "remove-ai":
      "Strip all generic AI poetry — both English and Japanese clichés. " +
      "English: remove 'feel alive', 'lose control', 'rise above', 'break free', 'in my veins', 'warrior', 'burning inside'. " +
      "Japanese: remove 大丈夫・輝いてる・信じて・翼を広げて・明日へ・夢を追って・共に歩こう・諦めないで・走り続ける・心に響く・希望の光・未来へ向かって・一緒に歩こう. " +
      "Replace ALL clichés with specific, concrete, world-specific imagery drawn from the style context. " +
      "If a line sounds like a writing-prompt output, rewrite it entirely. Make it feel written by a human who lived it.",
    "shorten-mora":
      `Shorten every line over 14 mora. Cut to the essential meaning. Preserve emotional temperature, tension, and rhythmic feel. No flat reductions — make shorter lines hit harder.${warnStr}`,
    "strengthen-chorus":
      "Rewrite [Chorus] sections only. Shorter lines, more direct emotion, higher singability, built for repetition. Every word must earn its place. Leave all other sections untouched.",
    "more-japanese":
      "Replace English with natural Japanese that preserves meaning, rhythm, and emotional register. Avoid literal translation — find the Japanese that feels right, not just correct.",
    "more-english":
      "Add English phrases and lines to the lyrics. English must NOT translate or restate the Japanese — use it to add a new image, emotional angle, sonic texture, or rhythmic hook. " +
      "Prefer short, memorable English phrases over full explanatory sentences. " +
      "Avoid bilingual mirror lines (Japanese meaning → same English meaning). " +
      "English expands the world and emotional register; it does not echo it.",
    darker:
      "Deepen the shadow. Replace hope or neutrality with dread, desperation, or melancholic beauty. Don't just swap words — shift the emotional temperature of the whole piece.",
    danceable:
      "Make it move. Shorter lines, punchy syllables, rhythmic stress on strong beats, physical energy in the word choices. The body should feel this, not just the mind.",
    poetic:
      `Make the lyrics more poetic — less explanation, more image.
- Remove explanatory connectives (だから, なぜなら, つまり, そして)
- Replace direct emotional statements with concrete sensory images
- Trust the reader: cut anything that over-explains
- Let silence do work: shorter lines, implication over statement
- Each line should carry more weight than its literal meaning
- Abstract feelings must become specific objects, textures, temperatures`,

    ironic:
      `Add irony, quiet detachment, and subtle uncanniness to the lyrics.
- Replace sincere statements with slight distance or understatement
- The narrator knows more than they're letting on
- Surface emotions should quietly contradict what's underneath
- Aim for wry, understated, not cynical
- The chorus split: the surface meaning and the real meaning should diverge slightly
- Especially effective when the most painful things are said the most calmly`,

    ojaly:
      `Rewrite in the ojaly. lyrical aesthetic.

Make it:
- more minimal — fewer words, more negative space
- more nocturnal — the world is dark, late, uncertain
- more poetic — metaphor and resonance over direct statement
- more emotionally restrained — feelings hinted, never shouted
- more cinematic — a scene, not a sentiment
- slightly ironic or uncanny — something slightly off, not fully resolved
- less explanatory — trust the image, delete the interpretation
- less generic J-pop — no 光/明日/君の笑顔 clichés
- more memorable chorus — short, strange, stays in the head long after

Preserve the original theme and section structure exactly.
Do not add proper nouns unless already present.
Avoid cliché English phrases (feel alive / in my veins / break free / warrior).

日本語歌詞の場合のニュアンス優先：
- 説明を削り、余韻を増やす
- 夜・光・孤独・違和感・近未来感をにじませる
- 感情を叫ばず、静かに刺す
- 少し皮肉、または不穏さを漂わせる
- 安いJ-POP的直球表現（大丈夫・輝く・信じて）を排除
- サビは短く、覚えやすく、異質な印象が残る形にする`,
  };

  return map[mode] ?? "Improve overall quality.";
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[mora/rewrite] GEMINI_API_KEY is not set — returning 503. " +
      "Create .env.local with GEMINI_API_KEY=AIza... to enable Gemini. " +
      "Client will fall back to rule-based rewrite."
    );
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
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
    const { text: raw, finishReason } = await callGemini(apiKey, SYSTEM_PROMPT, userPrompt, 2500);

    if (process.env.NODE_ENV !== "production") {
      const preview = raw.slice(0, 300).replace(/[\x00-\x1f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`);
      console.log("[mora/rewrite] raw preview:", preview);
      console.log(`[mora/rewrite] rawLength=${raw.length} finishReason=${finishReason ?? "unknown"}`);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(raw, { rawLength: raw.length, finishReason });
    } catch (parseErr) {
      console.error("[mora/rewrite] JSON parse failed:", parseErr);
      return NextResponse.json({ error: "JSON parse failed" }, { status: 503 });
    }

    return NextResponse.json({
      rewrittenLyrics: parsed.rewrittenLyrics ?? lyrics,
      notes: parsed.notes ?? "",
      changedLines: Array.isArray(parsed.changedLines) ? parsed.changedLines : [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as Record<string, unknown>)?.status;
    const detail = status ? `HTTP ${status}: ${msg}` : msg;
    console.error("[mora/rewrite] Gemini API request failed:", detail);
    if (status === 401 || status === 403) {
      console.error("[mora/rewrite] → API key is invalid or lacks permission. Check GEMINI_API_KEY in .env.local");
    } else if (status === 429) {
      console.error("[mora/rewrite] → Rate limited by Google. Retry after a moment.");
    }
    return NextResponse.json({ error: "Gemini API request failed", detail }, { status: 500 });
  }
}
