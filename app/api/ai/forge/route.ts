import { NextRequest, NextResponse } from "next/server";
import { WorldExpansion } from "@/types";
import { extractThemeDescriptors, extractThemeMotifsForLyrics } from "@/lib/themeExtractor";
import { ruleBasedForge, ruleBasedMusicDirection } from "@/lib/ruleBasedForge";

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
- stylePromptDraft: ONE prose paragraph, no bracket tags. Format: "{genreHint} with {atmosphere}, {BPM} BPM. {vocalStyle}. {instruments}. {texture/soundDirection descriptors}. {moodWords}."
  Example: "Decadent downtempo neo-soul with humid vending-machine loneliness, 72 BPM. Hushed male vocal, close-mic. Sparse piano, low bass drone, brushed percussion. Intimate, ritualistic, obsessive comfort-seeking."
- lyricsDirection: JP sentence on how lyrics should approach this world emotionally
- AVOID generic imagery: "光の海" "starlight" "feel alive" "dance in the rain" "burning soul"

OUTPUT: Valid JSON only — no markdown fences. JSON string values must not contain literal newlines — use \\n if a newline is needed.
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
  "stylePromptDraft": "one prose paragraph, no bracket tags — Suno-ready style prompt",
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[mora/forge] No GEMINI_API_KEY — rule-based expansion");
    return NextResponse.json(ruleBasedForge(worldSeed));
  }

  const userPrompt = `World Seed: "${worldSeed}"\n\nExpand this world. Return JSON only.`;

  try {
    const { text: raw, finishReason } = await callGemini(apiKey, SYSTEM_PROMPT, userPrompt, 2000);

    if (process.env.NODE_ENV !== "production") {
      const preview = raw.slice(0, 300).replace(/[\x00-\x1f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`);
      console.log("[mora/forge] raw preview:", preview);
      console.log(`[mora/forge] rawLength=${raw.length} finishReason=${finishReason ?? "unknown"}`);
    }

    const parsed = extractJson(raw, { rawLength: raw.length, finishReason }) as Partial<WorldExpansion>;

    if (parsed.musicDirection) {
      parsed.musicDirection.source = "gemini";
    } else {
      const desc = extractThemeDescriptors(worldSeed);
      const motifs = extractThemeMotifsForLyrics(worldSeed);
      parsed.musicDirection = ruleBasedMusicDirection(worldSeed, desc.styleWords, motifs);
    }

    return NextResponse.json(parsed as WorldExpansion);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mora/forge] Gemini API failed:", msg, "— rule-based fallback");
    return NextResponse.json(ruleBasedForge(worldSeed));
  }
}
