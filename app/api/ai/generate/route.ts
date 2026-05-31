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
  return "Write entirely in Japanese. Do not use English words, phrases, or fragments anywhere in the lyrics — including Verse, Chorus, Interlude, Breakdown, Outro, and Bridge. Every line must be in Japanese.";
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
- If the user or Builder provides a section order, follow that order exactly. Do not reorder sections.
- Section tags must be written exactly as they appear in STRUCTURE, enclosed in square brackets.
- Valid section tag families (use only what STRUCTURE specifies):
    Standard:   [Intro] [Verse 1] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Final Chorus] [Outro]
    Dance/EDM:  [Build] [Drop] [Breakdown] [Verse]
    Rap/Hook:   [Hook] [Final Hook] [Break]
    Theatrical: [Spoken Intro] [Scene Change] [Finale]
    Short:      [Verse] [Hook]

HARD RULES:
- Japanese lines: mora count 4–14 (ideal 6–12). Never write run-on lines.
- [Verse] [Verse 1] [Verse 2]: 4–6 lines. Accumulate concrete details — each line adds a new object, action, or angle.
- [Pre-Chorus] [Build]: 3–4 lines. Build emotional pressure toward the Chorus. End on tension, not resolution.
- [Chorus]: 4–6 lines (5–6 preferred in a full song). Emotionally direct and singable. Each line adds a dimension; the last line lands with weight.
- [Final Chorus]: 5–6 lines HARD CAP. Emotionally complete. Repeat the main Chorus with at most one
  line changed. Do NOT add motivational lines, moral lessons, encouragement, or positive-outcome
  summaries. Do NOT append a slogan or inspirational conclusion. The last line must be concrete —
  an object, number, action, or direct confession from the source.
  Bad: 「競馬をみんな絶対に楽しむんだ」「また来週を楽しみたいんだ」「きっと次は当たるから」
  Good: 「払い戻しは0円のまま」 or a direct repeat of the main Chorus final line.
- [Bridge]: 4–6 lines. Shifts perspective or time; stay grounded in source-specific imagery.
- [Breakdown]: 2–4 lines. Short and concrete — a phrase, object, number, or action. Not atmospheric filler.
- [Interlude]: 1–2 lines only. Use a minimal lyric fragment tied to the source — a number,
  object, action, or quoted phrase. Do not fill with vague atmosphere. If English appears
  in an Interlude or Breakdown, it must be a source-specific hook, not atmospheric poetry
  (no "fading", "slowly", "quietly", "silence", "goodbye", "distant", "dream").
- [Drop] [Hook] [Final Hook]: 3–4 lines. Short, physically urgent, built for repetition.
- [Spoken Intro]: narrative, atmospheric, no melody required; 2–3 lines.
- [Scene Change]: 2–3 lines, shifts perspective or time.
- [Finale] [Outro]: 2–4 lines. Closes with a concrete phrase, object, or unresolved action — not scenery.
- Do not let short utility sections (Interlude, Breakdown, Outro) become vague poetic filler.
- Blank line after each section's content, before the next tag.
- Lines per section: Intro/Spoken Intro 2–3, Verse 4–6, Pre-Chorus/Build 3–4, Chorus 4–6 (5–6 preferred), Final Chorus 5–6, Bridge 4–6, Breakdown 2–4, Interlude 1–2, Drop/Hook/Final Hook 3–4, Outro/Finale 2–4

EMOTIONAL ARC RULES (applies to full-length structures with Verse + Chorus):
- Build emotional pressure across the song. Do not keep every section at the same emotional level.
- Do not explain the arc directly in the lyrics. Show it through concrete objects, repeated actions,
  numbers, records, receipts, physical traces, and source-specific evidence.
- Verse 1: Place the narrator inside the first concrete situation. Start with an object, action,
  record, or repeated habit from the source. Do not open with reflection or resolution.
- Pre-Chorus: Compress that situation into unresolved tension. End on tension, not resolution.
  The tension must come from a concrete detail — a number, a record, a named action.
- Chorus 1: State the emotional core using the SOURCE CORE LINE and concrete evidence from the source.
- Verse 2: Add accumulation. Introduce a new object, failed action, number, record, or physical trace.
  Do not simply repeat Verse 1 imagery. Each Verse 2 line must add something Verse 1 did not contain.
- Breakdown or Bridge: Shift the angle. Use a break, reversal, memory, absence, or physical action.
  Stay grounded in source-specific evidence. Do not use this section as scenic filler.
- Final Chorus: Let the accumulated weight land. Keep the core hook from the main Chorus.
  Avoid motivational uplift, clean resolution, or positive-outcome slogans.
- Outro: End on what remains — an object, record, number, receipt, mark, or unresolved physical action.
  Do not summarize the message or close with scenery.

BANNED PHRASES: "lose control" "feel alive" "in my veins" "break free" "take me higher"
  "warrior" "rise above" "burning inside" "meant to be" "forever and always"
  "neon-lit streets" "rain-soaked streets" "fluorescent flicker"
  "loneliness in the crowd" "city lights below" "tears in the rain"
  "街の灯り" "光の海" "君の笑顔" "翼を広げて" "空に向かって"
  "蛍光灯" "滲んだ街明かり" "雨に濡れた街" "夜明け前" "光と影" "誰もいない部屋" (generic AI filler)
  Japanese weak-poetic fillers (banned — replace with source-specific evidence):
  "声が響く" "一言が響く" "〜が響く" "熱が冷めていく" "静かに閉じた" "胸に残る"
  "指先の熱" "光を探す" "その声が響" "胸が痛い" "心が揺れる" "魂が叫ぶ"
  "未来へ向かう" "報われる瞬間" "負け慣れた背中" "人は去っていく" "静かに離れていく"
  "夢を見せる" "夢を見せてくれる" "静かに競馬から離れていく"
  These are emotional labels, not evidence. Replace with source records, numbers, objects, actions.
  Generic-positive slogans (banned — especially in Final Chorus):
  "みんな絶対に" "楽しみたいんだ" "みんなで楽しむ" "また来週を楽しみたい"
  "きっと次は" "絶対に楽しむんだ" "また夢を見る"
  Explanatory-prose patterns (banned — convert to scene or action):
  "ただの〜じゃなく" "と思わせる" "という理由" "〜の理由がある"
  These read as analysis or essay prose, not lyrics. Convert to a concrete scene or action.
  Abstract-summary convenience labels (banned — replace with price, object, physical action):
  "質素な贅沢" "ささやかな贅沢" "小さな満足" "ささやかな満足" "小さな喜び"
  "日常の儀式" "いつもの儀式" "儀式" (as generic habit label)
  These describe experience from outside. Replace: 「タレ多めの並ひとつ」「レシート七百八十円」
  Seasonal / poetic filler (banned — replace with source-specific concrete detail):
  "夏の終わり" "熱い日々" "また来年も" "過ぎ去る季節" "惜しむように"
  "胸に広がる" "ぼやけて見えた" "目に滲む" "蝉時雨" "夕暮れが" "窓辺"
  "滲む" (standalone poetic filler) "じわりと広がる"
  Abstract-summary escalation (banned — replace with price / object / physical action):
  "これが贅沢" "夏の贅沢" "今日の贅沢" "価値がある" "今日だけの価値"
  "日常が染みる" "染みてくる" "期待が膨らむ" "充足" "安らぎ"
  "満たされていく" "満たされて" "今ここでいい" "生きるただそれだけ"
  These are summary labels. Replace with the specific object, price, or action the narrator performs.
  Meta-lyric self-reference (banned — song should not describe itself):
  ".*の歌" "夏の歌" "庶民的な.*歌" "これは.*歌" ".*まで含めた.*歌"
  Replace with the object or action the narrator performs: 「レシート七百八十円」「並の札が裏返る」
  Explanatory contrast patterns (banned — compress to short hook):
  "じゃなくても" "十分うまい" "高い天然" "庶民的な" (as editorial adjective)
  Bad: 「高い天然うなぎじゃなくても養殖うなぎで十分うまい」
  Good: 「養殖でいい」「タレでいい」
  Weak-sensory filler (banned — replace with concrete action):
  "心を撫でる" "心を" (as abstract warmth phrase) "撫でる" "静かな笑顔" "ふわり"
  Seasonal day filler (banned — replace with object or action):
  "あの夏の日" "このままの夏" "夏の日" (as poetic time filler)
  Pseudo-sensory memory (banned — replace with physical action):
  "静かに潤す" "この舌は知ってる" "舌の記憶" "喉を静かに潤す" "ざらざらした舌の記憶"

VISUAL IMAGERY RULE: Do not default to generic urban night imagery (neon streets, fluorescent
  lights, rain-soaked city, dawn-before-sunrise metaphors) unless the Quick Idea or Style Prompt
  explicitly contains such imagery. If the Seed has no city / night / rain elements, invent
  concrete imagery that belongs to the Seed's own world instead.

QUALITY:
- Concrete > abstract. Name the thing. "うどんの麺が震える" beats "何かが溢れる".
- Obsessive, abnormal, or absurd themes need MATCHING imagery — lean into the weirdness.
- Match energy and pacing to the structure type: a Dance Drop should feel physically urgent; a Ballad Narrative should breathe slowly.
- Verse lines accumulate: build a concrete scene line by line. A Verse must contain at
  least two distinct source details — named objects, records, numbers, or actions. Lines
  that only set atmosphere without naming anything from the source fail this standard.
- Pre-Chorus tightens: build tension from a concrete action, record, or named detail from
  the source. End on unresolved tension. Do not use abstract passion, distance, or vague
  atmosphere as the primary driver.
- Chorus delivers the claim: in a full song, aim for 5–6 lines — give the emotional statement room to land. Each line adds a new dimension to the SOURCE CORE LINE. End on the specific (the object, the number, the confession), not on a wide image that opens everything back up.
- Hook/Drop lines must be short and physically urgent — 3–4 lines, built for repetition.
- Bridge/Scene Change shifts perspective or time.
- No over-explanation. Trust the image.
- In the Chorus, a short declarative hook of 3–5 morae anchors the section harder than a full
  explanation. Lead with the concrete verdict, then expand: 「養殖でいい」「並でいい」「タレでいい」
  「今日これでいい」「払い戻しは0円」. This lands before the listener's brain can reject it.
- Verse and Bridge must close on a physical action or object, not an introspective summary.
  Bad: 「今日の味覚を記憶する」「また来る理由を探してる」「何を探してるか分からない」
  Good: 「割り箸の袋を畳んでる」「ポイントカードを財布に戻す」

META-LANGUAGE RULE:
- Do not use analytical meta-words in the final lyrics: core, thesis, theme, claim,
  concept, motif, emotional thesis, emotional anchor.
- These words may guide your reasoning — they must not appear in the lyrics output.
- Express the emotional center as an image, confession, action, or concrete phrase.
- Lines like "that's the core of it all" or "this is the theme" are analysis, not poetry.
- Avoid any line that reads like a lyricist explaining what the song is about.

ABSTRACT SUMMARY RULE:
- Do not describe the experience from the outside using editorial convenience labels.
  「質素な贅沢」「ささやかな満足」「日常の儀式」are how a journalist summarizes an experience —
  not how the narrator lives it. Replace with the specific price, object, or action.
  Bad: 「質素な贅沢、夏の終わり」→ editorial label
  Good: 「タレ多めの並ひとつ」「レシート七百八十円」→ the experience itself
- Do not close a section with an introspective question or unresolved search that reads like
  the lyricist's commentary: 「また来る理由を探してる」「何を探してるか分からない」「この味が忘れられない」
  End instead on a physical gesture, object, or action: 「ポイントカードを財布に戻す」
- 「儀式」is a meta-label. Do not use it to describe a habit. Name the habit directly:
  the object handled, the price paid, the sequence of small actions.

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

ABSTRACT EMOTION RULE:
- Do not summarize emotion with generic abstract nouns. Words like regret, dream, hope,
  passion, silence, loneliness, emptiness, and despair are labels — not the emotion itself.
- When an abstract emotion appears, translate it into evidence: a record, number, object,
  repeated action, screen, note, ticket, receipt, or quoted phrase.
- A line naming a concrete object or number carries more emotional weight than a line
  naming a feeling. Prefer the evidence; let the listener feel the emotion from it.
- This applies everywhere — Verse, Chorus, Breakdown, Interlude, Outro.

NO SCENERY SUBSTITUTION RULE:
- This rule applies to every section — Verse, Pre-Chorus, Chorus, Breakdown,
  Interlude, Bridge, Outro, and Finale. Do not use any section as a place to
  dump vague atmosphere, weather, or poetic distance.
- Do not convert emotional pain into scenery. When the source is about a person's actions,
  failures, habits, or records, keep the camera close — near their hands, screen, notes,
  receipts, numbers, tools, and repeated actions.
- Avoid using weather, sky, wind, soil, rain, grass, silence, fading, distance, residue,
  or vague atmosphere to carry the emotion, unless those elements are explicitly present
  in the source material.
- The pain lives in the objects and numbers, not in the landscape around them.
  Bad: a line that turns a personal failure into a weather or soil image
  Bad: a line that turns a concrete record or evidence into dream or distance imagery
  Bad: a line that replaces a person's specific action with vague atmosphere or silence
  Good: a line that names a record with a number ("PAT履歴は0円のまま")
  Good: a line that names a physical action or object ("買い目のメモを閉じた", "競馬新聞の端が折れていた")
  Good: a line that preserves a confession or quote ("「一度も当たらなかった」")
- Do not invent scenic domain imagery just because the topic suggests it. If the source
  evidence consists of records, notes, screens, habits, and quoted speech — stay there.
  Do not add topically typical atmosphere (racetrack soil, wind in the stands, distant
  weather, stadium sounds) unless the source explicitly contains those elements.
- For any domain-specific topic, the source's actual evidence defines the imagery.
  A source may be about horse racing yet contain only PAT records, red pen marks,
  prediction notebooks, payout amounts, and a confession. Write from those — not from
  what the domain "typically" looks and feels like.
- When the source contains specific domain vocabulary (records, tools, documents,
  amounts, deadlines, named objects), treat those words as the preferred imagery.
  Do not replace them with abstract equivalents: a dream for the record, silence for
  the number, distance for the action. The specific word from the source is always
  stronger than its abstract substitute.
- For Breakdown, Interlude, Bridge, and Outro: close with a concrete object, number,
  repeated action, quoted phrase, or unresolved human gesture — not with scenery,
  silence, fading, goodbye, wind, sky, soil, rain, or dream imagery.
  Good closings: "鉛筆の跡だけ残ってる" / "また来週、とは言わなかった" /
    a tool or document still sitting there / a number that didn't change /
    an action the narrator did not complete.

CHORUS RULE — applies to [Chorus] and [Final Chorus]:
- The Chorus must answer the core question of the song: what the narrator really wants, fears, or cannot let go of. Answer it in the specific — not through metaphor, but through the SOURCE CORE LINE or its direct transformation.
- The SOURCE CORE LINE is the non-negotiable anchor. Preserve its rhythm, phrasing, or raw charge. Do not soften, paraphrase, or elevate it into poetry.
- A strong Chorus weaves all three naturally: the SOURCE CORE LINE, at least one ordinary concrete detail from the source (an object, record, habit, or number), and the emotional claim. These need not occupy separate dedicated lines — they can share a line, overlap across two, or accumulate through the full run.
- Do not approach the Chorus as a three-slot checklist. Let the SOURCE CORE LINE drive; let concrete detail and emotional weight follow from it organically in the remaining lines.
- Do not fill the Chorus with generic emotion words (dream, hope, pain, light, darkness) unless each one is directly anchored to a concrete motif from the theme.
- The Chorus crystallizes the world built in the Verse — it does not escape into abstraction.
- The Chorus should not explain the theme or summarize what happened. Chain the source
  confession with concrete evidence the listener can point at — a screen, a notebook,
  a number, a mark, a ticket, a phrase from the source. Each Chorus line should be
  traceable to a specific piece of the source, not to an emotional category (regret,
  hope, passion, loss).
- Every Chorus line must serve at least one concrete role: carry the source confession,
  name a specific object or record or number or action, or state the emotional truth in
  plain words. A line whose only job is atmosphere, distance, fading, or scenery does not
  earn its place.
- Avoid abstract poetic closure: the last Chorus line should not open out into a wide, universal image ("the light fades", "silence remains", "the world keeps turning"). End on the specific — the object, the number, the action, the confession.
- For a full song (Verse + Chorus + Bridge structure), prefer 5–6 lines for the main [Chorus]. A 4-line Chorus risks ending before the emotional statement has room to land.
- Each Chorus line must be self-contained: it must make sense on its own without requiring the
  next line to complete it grammatically. Do not end a Chorus line with a dangling particle
  (が / を / に / で / は as the final character) that forces the next line to resolve the syntax.
  Bad: 「養殖でいい タレの焦げ目が」 — 「が」 hangs; depends on next line
  Good: 「養殖でいい」「タレの焦げ目」「冷たいおしぼり」「首筋を拭く」 — each stands alone
  Short incomplete noun fragments (「タレの焦げ目」「山椒ひと振り」) are acceptable as Chorus
  lines — they are imagistic, not syntactically dangling.
- ABSOLUTE BANS in any Chorus or Final Chorus line:
  「の歌」「夏の歌」「庶民的な」 — these are editorial labels that describe the song from outside.
  A Chorus line must live INSIDE the world, not comment on it from above.
- Do not cram multiple nouns together with の-connectors into one Chorus line.
  Bad: 「赤ちょうちんのタレの焦げ目」(unnatural chain — three nouns welded with の)
  Good: 「赤ちょうちん」 on one line, 「タレの焦げ目」 on the next
- Preferred Chorus structure for a food/place/experience theme:
  Line 1–2: short declarative hook (「養殖でいい」「タレでいい」)
  Line 3–4: concrete noun or sensory object (「山椒ひと振り」「赤ちょうちん」)
  Line 5: concrete action or price (「麦茶で流す」「レシート七百八十円」)
- The final line of the Chorus should land with weight. Prefer a completed action or
  price over a bare noun fragment. A noun alone does not close the image.
  Bad final line: 「冷たいおしぼり」
  Good final line: 「おしぼりで首を拭く」「レシート七百八十円」

FINAL CHORUS RULE — applies only to [Final Chorus]:
- The Final Chorus keeps the main hook line(s) from the main Chorus.
- The Final Chorus must NOT be identical to any previous Chorus. If all lines would be the same, you MUST change at least one non-hook line.
- Vary 1–2 non-hook lines to carry more accumulated weight than Chorus 1: use a different
  concrete object, number, action, or record from the source that deepens — not softens — the impact.
- FINAL CHORUS VARIATION DETAIL:
  Varied non-hook lines must feel heavier than Chorus 1.
  Prefer: residue, record, payment, physical trace, stopped motion, or what remains after leaving
  (e.g. receipt, change tray, lingering scent on sleeve, scorched skin, stopped fan, a mark on paper).
  Do not vary with light routine actions: drinking tea, wiping with a towel, folding chopstick bags,
  or simply smelling something sweet — these belong in Verse/Pre-Chorus, not in Final Chorus.
  Avoid dangling noun-modifier lines such as 「赤ちょうちんの」(ends mid-phrase); merge into a
  complete image like 「赤ちょうちんの甘い匂い」or replace with a concrete physical trace.
- Do not add an extra line that the main Chorus did not have.
- Do not use the Final Chorus as a place to resolve, conclude, uplift, or deliver a moral.
- If the source is about loss, failure, or unresolved pain, the Final Chorus must not end on
  hope, positivity, or encouragement.
- BANNED in Final Chorus last line: slogans, motivational phrases, generic positive conclusions,
  community-inviting statements (「みんな絶対に〜」「楽しみたいんだ」「きっと次は」).
- The 快感 (thrill/rush) word may appear at most ONCE across the entire song. If 快感 is used
  in the main Chorus, do not repeat it in the Final Chorus. Replace with the concrete object
  the narrator was actually chasing: a payout screen, a betting ticket, an odds display, a hit.
  Example: 「快感が欲しかった」→「的中画面を一度見たかった」

BILINGUAL RULE (applies whenever English words or lines appear):
- English phrases must NOT translate or restate the adjacent Japanese line.
- English must add something new: a different image, emotional angle, sonic texture, or rhythmic hook.
- Prefer short English phrases — hook words, inner voice, texture fragments — over full explanatory sentences.
- Avoid bilingual mirror lines: writing the same meaning in Japanese and English side by side.
- Concrete English nouns and verbs beat abstract English sentiment words.
- English fragments must not become generic outro poetry. Avoid constructions like
  "quiet goodbye", "just silence", "fade out", "faint hope", "the world moves on",
  "it ends here", "nothing left". English must be a hook, texture, inner voice,
  or rhythmic fragment tied to the source evidence — not a poetic closing statement.
- Interlude, Breakdown, and Outro must not use generic English emotional summaries.
  Avoid philosophical statements like "Hope is gone", "Winning is hope", "No payout,
  just silence", or any construction that reduces the source to an abstract lesson or
  feeling. If English appears in these sections, make it source-tied: a number, a
  fragment of the source confession, or a specific physical action.

JAPANESE-ONLY RULE:
- When the LANGUAGE parameter says "Write entirely in Japanese", every lyric line must be in
  Japanese — Verse, Pre-Chorus, Chorus, Bridge, Breakdown, Interlude, Outro, and all others.
- Do not add English hooks, slogans, summary phrases, or texture fragments in any section.
- Interlude and Breakdown are not places for English commentary or motivational slogans.
  Bad: "Winning is the快感" / "Not just money" / "fading out" / "just silence"
  Good: 「当たりの画面が見たかった」 / 「金だけじゃなかった」 / 「買い目のメモを閉じた」
- If the source material contains specific English quotations or proper nouns, use them exactly
  as quoted. Do not invent English phrases as "flavor" or "texture".

PRE-FINALIZE SCAN — do this before writing the JSON output:
Scan every line of every section. If any line's only function is mood, scenery,
weather, silence, fading, distance, dream imagery, or abstract loss — replace it with:
  • a quoted phrase or confession from the source
  • a concrete object, tool, or document from the source world
  • a record, number, or measurable fact
  • a repeated action or habit
  • a specific human gesture or incomplete action
  • a plain emotional sentence in the narrator's own voice
A line that could appear in any song about any topic fails this check.
Also check section balance:
- If a Verse is shorter than the Pre-Chorus or Chorus without a clear reason, expand it with concrete source details.
- If an Interlude, Breakdown, or Outro exceeds its target length with vague atmosphere, shorten it or replace with a concrete phrase or action.
- If [Chorus] repeats in the structure: keep 1–2 hook lines consistent across all Chorus occurrences.
  For Chorus 2 and beyond, vary 1–2 non-hook lines using different concrete evidence from the source
  (a different object, number, action, or record). Do not make every Chorus repetition identical.
  Final Chorus: carry more accumulated weight — vary the non-hook lines to deepen, not resolve.
  Do not add motivational uplift or clean resolution in the Final Chorus.
  If the Final Chorus is word-for-word identical to a previous Chorus, this is a scan failure — change at least one non-hook line before output.
Also scan for abstract emotion summaries in Chorus, Breakdown, Interlude, and Outro:
if a line mainly states an abstract feeling (regret remains, hope is gone, dream ended,
passion unrewarded, silence answers) — replace it with source-specific evidence:
a record, number, object, or quoted phrase. A feeling named is a label; a feeling
shown through evidence is felt.
Also scan for invented scenic domain imagery: if a line adds topically typical scenery
(weather, soil, wind, crowd, stadium atmosphere) that is not present in the source
evidence, replace it with something the source actually contains — a record, object,
number, quoted phrase, or named action.
Also scan for explanatory prose — lines that read like essay or analysis rather than lyric:
patterns like 「ただの〜じゃなく」「〜と思わせる」「〜という理由」indicate the lyricist is
explaining the song's meaning rather than living inside it. Replace with a concrete scene
or action from the source. Example: 「万馬券はただの高配当じゃなく」→「赤い的中表示が欲しかった」
Also scan the Final Chorus for generic-positive endings: slogans, moral lessons,
encouragement, or community-inviting conclusions (「みんな絶対に楽しむんだ」etc.) must be
removed or replaced with a concrete repeat of the main Chorus's last line.
Also scan for 快感 overuse: if 快感 appears more than once in the entire lyrics, replace
the extra occurrences with the concrete object the sensation refers to (payout screen,
odds number, red hit display, ticket stub).
Also scan for prompt-text copying: if a lyric line reproduces the user's input wording
verbatim as an explanatory sentence, compress it into a short hook phrase instead.
Bad: 「高い天然うなぎじゃなくても養殖うなぎで十分うまい」(copied from input prose)
Good: 「養殖でいい」「タレでいい」(short hook that preserves the emotional stance)
Acceptable direct copy: a short phrase of 3–5 morae that works as a hook.
Unacceptable: full explanatory contrast sentences, or lines that contain "じゃなくても".
Also scan for meta-lyric self-reference: lines like 「夏の歌」「庶民的な夏の歌」describe the
song rather than living inside it. Replace with the specific object or action the line
was trying to capture: 「レシート七百八十円」「並の札が裏返る」.
Also normalize 赤提灯 → 赤ちょうちん throughout the lyrics.

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
  console.log(
    `[MORA structure] songLength=${input.songLength},`,
    `hasStructureOverride=${structureOverride !== undefined},`,
    `structure="${base}"`,
  );
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

// ─── Post-generation: abstract drift detection & repair ──────────────────────

const ABSTRACT_SIGNALS_EN: RegExp[] = [
  /hope is gone/i,
  /winning is hope/i,
  /fading out/i,
  /just silence/i,
  /silence remains/i,
];

const ABSTRACT_LINE_JP: RegExp[] = [
  /^(また|ただ)?静かに.*(消えた|去った|遠ざかる|終わった)/,
  /^(夢|希望).*(消えた|終わった|遠く|見れない|見たかった)/,
  /^(夢|希望)が(欲しい|ない|消えた|見れない)/,
  /^報われる瞬間/,
  /^また来週への希望/,
  /^でも夢が/,
];

const WEAK_POETIC_JP: RegExp[] = [
  /が響く/,
  /熱が冷めていく/,
  /静かに閉じた/,
  /胸に残る/,
  /光を探す/,
  /指先の熱/,
  /心が揺れ/,
  /魂が叫/,
  /未来へ向か/,
  /負け慣れた背中/,
  /人は去っていく/,
  /静かに.*離れていく/,
  /人は.*離れていく/,
  /人は.*から離れていく/,
  /静かに.*から離れていく/,
  /.*から離れていく$/,
  /夢を見せ/,
  /一言だけ残して/,
  /夏の終わり/,
  /熱い日々/,
  /また来年も/,
  /過ぎ去る季節/,
  /惜しむように/,
  /胸に広がる/,
  /ぼやけて見えた/,
  /目に滲む/,
  /また来る理由.*探して/,
  /何を探してる.*分からない/,
  /今日の.*味覚.*記憶/,
  /この味.*残るだろう/,
  /滲む/,
  /じわりと広がる/,
  /蝉時雨/,
  /背中に.*風/,
  /夕暮れが/,
  /窓辺/,
  /心を撫/,
  /撫でる/,
  /静かな笑顔/,
  /ふわり/,
  /の$/,
  /あの夏の日/,
  /このままの夏/,
  /夏の日/,
  /静かに潤す/,
  /この舌は知ってる/,
  /舌の記憶/,
  /染み渡る/,
  /まだ残る/,
  /目に染みる/,
  /灯り/,
  /視線/,
  /見つめる/,
  /外へ$/,
  /衣纏う/,
  /まとう/,
];

const ABSTRACT_SUMMARY_JP: RegExp[] = [
  /質素な贅沢/,
  /ささやかな贅沢/,
  /ささやかな満足/,
  /小さな満足/,
  /小さな喜び/,
  /日常の儀式/,
  /いつもの儀式/,
  /の儀式/,
  /[はがのなも]贅沢/,
  /価値がある/,
  /今日だけの価値/,
  /日常が染みる/,
  /染みてくる/,
  /期待が膨らむ/,
  /充足/,
  /安らぎ/,
  /満たされていく/,
  /満たされて/,
  /今ここでいい/,
  /生きるただそれだけ/,
  /この味でいい/,
  /これでいい/,
  /この場所だけは/,
  /変わらないまま/,
];

const SLOGANY_ENDING_JP: RegExp[] = [
  /みんな絶対に/,
  /楽しみたいんだ/,
  /みんなで.*楽しむ/,
  /また来週を楽しみたい/,
  /きっと次は.*当たる/,
  /絶対に楽しむんだ/,
];

const EXPLANATORY_PROSE_JP: RegExp[] = [
  /ただの.*じゃなく/,
  /と思わせる/,
  /という理由/,
  /じゃなくても/,
  /十分うまい/,
  /高い天然/,
  /庶民的な/,
  /最高級/,
];

const META_LYRIC_JP: RegExp[] = [
  /の歌$/,
  /庶民的な.*歌/,
  /これは.*歌/,
  /まで含めた.*歌/,
  /.*まで.*歌/,
  /夏の歌/,
];

const MIXED_LANG_WEIRD: RegExp[] = [
  /[A-Za-z]{2,}\s+is\s+(the\s+)?[぀-ヿ一-鿿]/i,
  /^Not\s+just\s+[A-Za-z]+$/i,
];

/** Returns a reason string if abstract drift is detected, null if clean. */
function detectAbstractDrift(lyrics: string): string | null {
  const reasons: string[] = [];

  // 1. English slogan check (whole-lyrics)
  for (const pat of ABSTRACT_SIGNALS_EN) {
    if (pat.test(lyrics)) { reasons.push(`EN slogan: /${pat.source}/`); break; }
  }

  // 2. Section-aware scan: strict check for Chorus/Outro/Breakdown/Interlude,
  //    lighter count-based check for Verse/Pre-Chorus
  // 快感 over-use check (whole-lyrics)
  const kaikanCount = (lyrics.match(/快感/g) ?? []).length;
  if (kaikanCount > 1) reasons.push(`快感 overuse ×${kaikanCount}`);

  const lines = lyrics.split("\n");
  type SectionKind = "final_chorus" | "chorus_etc" | "verse_pre" | "other";
  let kind: SectionKind = "other";
  let verseAbstractCount = 0;

  // Pre-compute が/を/に-endings that are valid enjambments:
  // が: next content line in the SAME section doesn't end with a particle
  //   e.g. 「古びた扇風機が」+「首振る」
  // を: next content line contains a WO_ACTION_VERBS verb (stricter than が)
  //   e.g. 「カサカサのレシートを」+「財布に戻す」 → OK
  //        「熱い麦茶を」+「焦げ目を奥歯で噛む」  → NG (next line is independent clause)
  // に: next content line contains a concrete action verb (NI_ACTION_VERBS)
  //   e.g. 「テーブルの端に」+「小銭を出す」 → OK
  //        「路地裏に」+「赤ちょうちん」    → NG (no action verb)
  const validEnjambments = new Set<string>();
  for (let ei = 0; ei < lines.length; ei++) {
    const et = lines[ei].trim();
    if (!et || et.startsWith("[")) continue;
    const endsGa = /が$/.test(et);
    const endsWo = /を$/.test(et);
    const endsNi = /に$/.test(et);
    if (!endsGa && !endsWo && !endsNi) continue;
    for (let ej = ei + 1; ej < lines.length; ej++) {
      const ent = lines[ej].trim();
      if (!ent) continue;
      if (ent.startsWith("[")) break; // section boundary — treat as dangling
      if (endsGa && !/[がをにでは]$/.test(ent)) validEnjambments.add(et);
      if (endsWo && WO_ACTION_VERBS.some(v => ent.includes(v))) validEnjambments.add(et);
      if (endsNi && NI_ACTION_VERBS.some(v => ent.includes(v))) validEnjambments.add(et);
      break;
    }
  }

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("[")) {
      if (/^\[Final Chorus\]/i.test(t)) {
        kind = "final_chorus";
      } else if (/^\[(Chorus|Outro|Finale|Breakdown|Interlude)/i.test(t)) {
        kind = "chorus_etc";
      } else if (/^\[(Verse|Pre-Chorus)/i.test(t)) {
        kind = "verse_pre";
      } else {
        kind = "other";
      }
      continue;
    }
    if (!t) continue;

    // Mixed-language weirdness check: applies to all sections
    for (const pat of MIXED_LANG_WEIRD) {
      if (pat.test(t)) { reasons.push(`weird mixed-lang: "${t.slice(0, 40)}"`); break; }
    }

    // Explanatory prose check: applies to all sections
    for (const pat of EXPLANATORY_PROSE_JP) {
      if (pat.test(t)) { reasons.push(`explanatory prose: "${t.slice(0, 40)}"`); break; }
    }

    // Abstract summary convenience label check: applies to all sections
    for (const pat of ABSTRACT_SUMMARY_JP) {
      if (pat.test(t)) { reasons.push(`abstract summary: "${t.slice(0, 40)}"`); break; }
    }

    // Meta-lyric self-reference check: applies to all sections
    for (const pat of META_LYRIC_JP) {
      if (pat.test(t)) { reasons.push(`meta lyric: "${t.slice(0, 40)}"`); break; }
    }

    // Weak poetic filler check: applies to ALL sections
    for (const pat of WEAK_POETIC_JP) {
      if (pat.test(t)) { reasons.push(`weak poetic: "${t.slice(0, 40)}"`); break; }
    }

    // Dangling particle: applies to ALL sections (line ends with raw particle, length > 3)
    // Exception: が-ending lines where the next content line in the same section completes the clause
    if (t.length > 3 && /[がをにでは]$/.test(t)) {
      if (/[がをに]$/.test(t) && validEnjambments.has(t)) {
        // valid enjambment (e.g. 「古びた扇風機が」+「首振る」, 「テーブルの端に」+「小銭を出す」) — skip
      } else {
        reasons.push(`dangling particle: "${t.slice(0, 40)}"`);
      }
    }

    if (kind === "final_chorus" || kind === "chorus_etc") {
      if (kind === "final_chorus") {
        for (const pat of SLOGANY_ENDING_JP) {
          if (pat.test(t)) { reasons.push(`generic positive ending: "${t.slice(0, 40)}"`); break; }
        }
      }
      for (const pat of ABSTRACT_LINE_JP) {
        if (pat.test(t)) { reasons.push(`JP abstract: "${t.slice(0, 40)}"`); break; }
      }
    } else if (kind === "verse_pre") {
      const m = t.match(/夢|希望|報われる|報われた/g);
      if (m) verseAbstractCount += m.length;
    }

    if (reasons.length >= 3) break;
  }

  if (verseAbstractCount >= 2) {
    reasons.push(`Verse/Pre-Chorus abstract terms ×${verseAbstractCount}`);
  }

  return reasons.length > 0 ? reasons.join("; ") : null;
}

/** Returns per-section line counts for [Chorus] and [Final Chorus] sections. */
function chorusLineCounts(lyrics: string): number[] {
  const counts: number[] = [];
  const lines = lyrics.split("\n");
  let inChorus = false, count = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("[")) {
      if (inChorus) { counts.push(count); count = 0; }
      inChorus = /^\[(Chorus|Final Chorus)/i.test(t);
      continue;
    }
    if (inChorus && t) count++;
  }
  if (inChorus) counts.push(count);
  return counts;
}

const NEAR_DUP_VERB_ENDINGS = [
  "畳む", "拭く", "飲む", "噛む", "出る", "拾う",
  "戻す", "鳴る", "見る", "開ける", "数える", "折る",
];

// Anchor evidence lines — Chorus フックとして意図的に使う物証行。
// adjacent near_duplicate チェックで、片方がこれと完全一致する場合はスキップ。
// Global anchor: レシート七百八十円 is never a false near_dup (unagi-domain only, won't appear in racing)
const ANCHOR_EVIDENCE_LINES = new Set([
  "レシート七百八十円",
]);
// Unagi-specific anchor: applied only when quickIdea contains unagi signals
const UNAGI_ANCHOR_EVIDENCE_LINES = new Set([
  "レシート七百八十円",
  "小銭を数えて暖簾を出る",
]);

// に-enjambment が valid になる条件となる動作動詞
const NI_ACTION_VERBS = [
  "出す", "置く", "戻す", "入れる", "畳む", "折る",
  "拾う", "拭く", "噛む", "飲む", "割る", "開ける",
];

// を-enjambment が valid になる条件となる動作動詞
// 次行がこれらの動詞を含む場合のみ「〜を」行末を valid enjambment と見なす。
// 「熱い麦茶を」+「焦げ目を奥歯で噛む」のような独立節へのつなぎは NG。
const WO_ACTION_VERBS = [
  "戻す", "入れる", "畳む", "折る", "拭く", "飲む",
  "閉じ", "消す", "確認", "数え", "開ける", "拾う",
  "割る", "噛む", "出す", "置く", "向ける", "渡す",
];

function detectNearDuplicate(lyrics: string, quickIdea: string): string | null {
  const anchorLines = UNAGI_INPUT_SIGNALS.some(s => quickIdea.includes(s))
    ? UNAGI_ANCHOR_EVIDENCE_LINES
    : ANCHOR_EVIDENCE_LINES;
  function keyTokens(line: string): string[] {
    const kanji = line.match(/[一-鿿]{2,}/g) ?? [];
    const kana  = line.match(/[゠-ヿ]{2,}/g) ?? [];
    return [...kanji, ...kana];
  }
  const lines = lyrics.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("["));
  for (let i = 0; i < lines.length - 1; i++) {
    // Skip if either line is an anchor evidence line (Chorus フック物証との近接は許容)
    if (anchorLines.has(lines[i]) || anchorLines.has(lines[i + 1])) continue;
    const setA = new Set(keyTokens(lines[i]));
    const shared = keyTokens(lines[i + 1]).filter(w => setA.has(w));
    if (shared.length > 0) {
      return `near duplicate: "${shared[0]}" in [${lines[i].slice(0, 20)}] / [${lines[i + 1].slice(0, 20)}]`;
    }
    const verbA = NEAR_DUP_VERB_ENDINGS.filter(v => lines[i].includes(v));
    const verbB = NEAR_DUP_VERB_ENDINGS.filter(v => lines[i + 1].includes(v));
    const sharedVerbs = verbA.filter(v => verbB.includes(v));
    if (sharedVerbs.length > 0) {
      return `near duplicate (verb): "${sharedVerbs[0]}" in [${lines[i].slice(0, 20)}] / [${lines[i + 1].slice(0, 20)}]`;
    }
  }

  // Pass 2: repeated full-line check — same line text in non-Chorus sections 2+ times
  const allLines = lyrics.split("\n");
  const lineCounts = new Map<string, number>();
  let inChorusSect = false;
  for (const l of allLines) {
    const lt = l.trim();
    if (lt.startsWith("[")) {
      inChorusSect = /^\[(Chorus|Final Chorus)/i.test(lt);
      continue;
    }
    if (!lt || inChorusSect || lt.length < 5) continue;
    const cnt = (lineCounts.get(lt) ?? 0) + 1;
    lineCounts.set(lt, cnt);
    if (cnt >= 2) return `repeated line: "${lt.slice(0, 30)}" (×${cnt})`;
  }

  return null;
}

function detectFinalChorusOverflow(lyrics: string): boolean {
  const lines = lyrics.split("\n");
  let inFinalChorus = false, count = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("[")) {
      if (inFinalChorus && count > 6) return true;
      inFinalChorus = /^\[Final Chorus\]/i.test(t);
      count = 0;
      continue;
    }
    if (inFinalChorus && t) count++;
  }
  return inFinalChorus && count > 6;
}

function analyzeRepairDiff(before: string, after: string): { repairedLines: number; repairedSections: string[] } {
  const beforeSet = new Set(
    before.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("["))
  );
  const sectionSet = new Set<string>();
  let currentSection = "Unknown";
  let repairedLines = 0;
  for (const line of after.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("[")) {
      const m = t.match(/^\[([^\]]+)\]/);
      if (m) currentSection = m[1];
      continue;
    }
    if (!beforeSet.has(t)) {
      repairedLines++;
      sectionSet.add(currentSection);
    }
  }
  return { repairedLines, repairedSections: [...sectionSet] };
}

// ─── Concrete vocabulary extraction ──────────────────────────────────────────
// Extracts theme-grounded words from quickIdea and non-abstract lyric lines.
// Used to build a Concrete Pool for the repair prompt, so Gemini replaces
// abstract lines with vocabulary already present in the song/source rather
// than importing vocabulary from its training biases.

const ABSTRACT_QUICK_PATTERNS: RegExp[] = [
  /^(また|ただ)?静かに/,
  /^(夢|希望).*(消えた|終わった)/,
  /^報われる/,
  /贅沢/, /充足/, /安らぎ/, /染みてくる/, /変わらないまま/,
  /が響く/, /胸に残る/, /滲む/, /夕暮れ/, /指先の熱/,
  /期待だけが残る/, /夢を見せ/, /静かに.*離れていく/,
  /知識.*あった/, /情熱.*あった/, /急に消えた/, /画面は変わらず/,
];

function isLikelyAbstractLine(line: string): boolean {
  return ABSTRACT_QUICK_PATTERNS.some(p => p.test(line));
}

function extractConcreteVocabulary(lyrics: string, quickIdea: string): string[] {
  // Tokens from quickIdea: 2+ kanji runs, 3+ katakana runs, number+円
  const ideaTokens: string[] = [
    ...(quickIdea.match(/[一-鿿]{2,}/g) ?? []),
    ...(quickIdea.match(/[゠-ヿ]{3,}/g) ?? []),
    ...(quickIdea.match(/\d+円/g) ?? []),
  ];

  // Tokens from lyrics: skip section tags and likely-abstract lines
  const lyricLines = lyrics.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("[") && l.length >= 3 && !isLikelyAbstractLine(l));

  const lyricTokens: string[] = lyricLines.flatMap(l => [
    ...(l.match(/[一-鿿]{2,}/g) ?? []),
    ...(l.match(/\d+円/g) ?? []),
  ]);

  // Deduplicate preserving order, cap at 25 tokens
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of [...ideaTokens, ...lyricTokens]) {
    if (!seen.has(t)) { seen.add(t); result.push(t); }
    if (result.length >= 25) break;
  }
  return result;
}

async function repairAbstractDrift(
  apiKey: string,
  lyrics: string,
  quickIdea: string,
): Promise<{ text: string; finishReason?: string } | null> {
  const isUnagi  = UNAGI_INPUT_SIGNALS.some(s => quickIdea.includes(s));
  const isRacing = RACING_INPUT_SIGNALS.some(s => quickIdea.includes(s));

  const breakdownOutroRule = isUnagi
    ? `- BREAKDOWN / OUTRO: Do not place Chorus climax lines as standalone Breakdown/Outro content.\n` +
      `  NG in Breakdown/Outro (these are Chorus territory): 「レシート七百八十円」\n` +
      `  「タレ多めの並ひとつ」「赤ちょうちん」「麦茶で流す」「養殖でいい タレでいい」\n` +
      `  Replace with perspective shift — sound, sensation, departure, or payment:\n` +
      `  「タレ多めの並ひとつ」→ 「レジ横の小銭皿が鳴る」\n` +
      `  「レシート七百八十円」→ 「焦げた皮を奥歯で噛む」\n` +
      `  「麦茶で流す」→ 「暖簾の外で煙を吸う」\n` +
      `  Good Breakdown: 「レジ横の小銭皿が鳴る」「焦げた皮を奥歯で噛む」「店の奥で換気扇が止まる」\n` +
      `  「湯気の向こうで箸を割る」「指先に山椒の粉が残る」\n` +
      `  Good Outro: 「小銭を数えて暖簾を出る」「袖口にタレの匂いが残る」\n` +
      `  「レシートを折って財布に戻す」「指先にタレの匂いが残る」\n`
    : isRacing
    ? `- BREAKDOWN / OUTRO: Do not place Chorus climax lines as standalone Breakdown/Outro content.\n` +
      `  Replace with a perspective shift — waiting, checking, or departure specific to racing:\n` +
      `  Good Breakdown: 「赤い的中表示を待っていた」「締切前の画面を閉じた」\n` +
      `  「買い目のメモだけ残っていた」「ハズレ券を引き出しに戻す」「PAT口座の残高を確認した」\n` +
      `  Good Outro: 「日曜の夜に印を消す」「PAT履歴だけが白く残る」\n` +
      `  「ハズレ券を引き出しに入れた」「締切前の画面を閉じた」「当たり馬券だけが出なかった」\n`
    : `- BREAKDOWN / OUTRO: Do not place Chorus climax lines as standalone Breakdown/Outro content.\n` +
      `  Replace with a concrete action, object, or departure drawn from the SOURCE.\n`;

  const concreteVocab = extractConcreteVocabulary(lyrics, quickIdea);
  const concretePoolBlock = concreteVocab.length > 0
    ? `CONCRETE POOL — prefer these words and phrases when replacing abstract lines.\n` +
      `These are drawn from the user's input and the generated lyrics.\n` +
      `Do not import vocabulary from other themes or unrelated contexts.\n` +
      `Pool: ${concreteVocab.join("　")}\n\n`
    : "";

  const systemPrompt =
    "You are a lyrics repair specialist. Fix abstract emotional drift. Return only valid JSON.";
  const userPrompt =
    `Revise the following song lyrics without changing the section order or section tags.\n\n` +
    `SOURCE (Quick Idea — this is your evidence pool; use its actual vocabulary and objects):\n${quickIdea || "(none)"}\n\n` +
    concretePoolBlock +
    `REPAIR RULES:\n` +
    `- Keep ALL [Section Tag] lines exactly as they appear.\n` +
    `- Keep the source core confession line in the Chorus.\n` +
    `- Keep the main hook line(s) of each Chorus consistent across repetitions.\n` +
    `  Allow 1–2 non-hook lines to vary across Chorus 2 and Final Chorus.\n` +
    `  Do not collapse all Chorus repetitions into identical text.\n` +
    `  Preserve Chorus variation when it uses source-specific concrete evidence.\n` +
    `- Do not shorten sections aggressively. Keep each section close to its original line count.\n` +
    `- For Chorus sections in a full song, keep 5–6 lines. Do not compress a Chorus to 4 lines\n` +
    `  unless the original Chorus was already 4 lines and emotionally complete.\n` +
    `- Each Chorus must include at least two concrete evidence items from the SOURCE:\n` +
    `  records, numbers, notes, marks, tickets, screens, actions, or quoted phrases.\n` +
    `- Replace abstract emotional summaries with concrete evidence: records, numbers, objects,\n` +
    `  repeated actions, or quoted phrases drawn from the SOURCE above.\n` +
    `- Read the SOURCE carefully and use the actual words, objects, and phrases it contains.\n` +
    `  Do not substitute source vocabulary with generic alternatives.\n` +
    `- Do not use dream, hope, silence, fading, gone, goodbye, quiet, or scenery as the\n` +
    `  emotional payload of a line.\n` +
    `- Do not keep lines using 報われる, 報われる瞬間, 報われる瞬間がない, or 報われなかった.\n` +
    `  Replace them with concrete source evidence: a PAT record, a payout amount of 0, a\n` +
    `  notebook mark, a betting slip, a prediction note, or a quoted phrase from the SOURCE.\n` +
    `- In Pre-Chorus and Breakdown, do not use 夢, 希望, 報われる, or reward/hope language\n` +
    `  as the main emotional payload. Use a concrete action or named record instead.\n` +
    `- After repair, the lyrics must not contain the abstract phrases that were detected.\n` +
    `  If a detected phrase appears, replace it directly — do not paraphrase around it.\n` +
    `- Do not compress the lyric into a summary or report. Keep it singable.\n` +
    `  A repaired line should still feel like a lyric, not a sentence that explains the theme.\n` +
    `- Replace weak poetic Japanese phrases with source evidence:\n` +
    `  「声が響く」「熱が冷めていく」「静かに閉じた」「胸に残る」「指先の熱」「光を探す」\n` +
    `  「人は静かに〜離れていく」「人は〜から離れていく」「夢を見せること」「期待だけが残る」\n` +
    `  These are emotional labels — do not keep them. Replace each with a physical trace,\n` +
    `  object, number, screen, note, record, or action from the CONCRETE POOL.\n` +
    `  Prefer vocabulary already visible in the lyrics over inventing new words.\n` +
    `- Replace mixed-language lines where English and Japanese are grammatically fused unnaturally.\n` +
    `  If the surrounding lyrics are Japanese-dominant, translate the entire line into Japanese.\n\n` +
    `- FINAL CHORUS RULES:\n` +
    `  - The Final Chorus must not exceed 6 lines.\n` +
    `  - Do not add motivational slogans, moral conclusions, or positive-outcome lines.\n` +
    `  - If the Final Chorus has a 7th line that is a slogan or encouragement, DELETE it.\n` +
    `  - Bad last lines: 「競馬をみんな絶対に楽しむんだ」「また来週を楽しみたいんだ」「きっと次は当たるから」\n` +
    `  - If the source is about loss, the Final Chorus must not end on hope or uplift.\n` +
    `  - Good last line: repeat the main Chorus's last line, or use a concrete object/record.\n` +
    `  - If the Final Chorus is identical to a previous Chorus, preserve hook lines and rewrite exactly one non-hook line using a heavier physical trace (residue, receipt, payment, body mark, stopped object).\n` +
    `- 快感 LIMIT: 快感 may appear at most once in the entire song. If it appears more than once,\n` +
    `  replace extra occurrences with concrete imagery: 「的中画面を一度見たかった」\n` +
    `  「赤い的中表示を待っていた」「払い戻しの数字を見たかった」\n` +
    `- EXPLANATORY PROSE: Replace lines that read like analysis or essay.\n` +
    `  「万馬券はただの高配当じゃなく」→「赤い的中表示が欲しかった」\n` +
    `  「また来週も競馬したいと思わせる」→「日曜の夜にまた印を打つ」\n` +
    `  「思わせる理由」→「買い目のメモが残ってる」\n` +
    `- 「が響く」system: any line with 〜が響く / 〜が響いた should be replaced:\n` +
    `  「その一言が響く」→「一度も当たらなかった、とだけ書いてあった」\n` +
    `  「負け慣れた背中」→「ハズレ券を引き出しに入れた」\n` +
    `  「人は去っていく」→「PAT口座の残高を確認した」\n\n` +
    `- ABSTRACT SUMMARY REPLACEMENT: Lines using editorial convenience labels must be replaced\n` +
    `  with the specific price, object, or physical action from the SOURCE.\n` +
    `  Banned labels: 「贅沢」「価値がある」「充足」「安らぎ」「満たされ」「今ここでいい」\n` +
    `  「生きるただそれだけ」「期待が膨らむ」「日常が染みる」「染みてくる」「今日だけの価値」\n` +
    `  Replace each with what the narrator actually touches, pays, or does.\n` +
    `  Example replacements from the source world:\n` +
    `  「これが夏の贅沢」→「山椒ひと振り」\n` +
    `  「今日だけの価値がある」→「並の札を裏返す」\n` +
    `  「日常が染みる」→「麦茶の氷が鳴る」\n` +
    `  「期待が膨らむ」→「丼のふたを開ける」\n` +
    `  「小さな充足」→「割り箸の袋を畳む」\n` +
    `  「この安らぎがある」→「おしぼりで首を拭く」\n` +
    `  「満たされていく」→「米粒を最後まで拾う」\n` +
    `  「この夏を生きるただそれだけ」→「山椒ひと振り 麦茶で流す」\n` +
    `  「今ここでいい」→ use a concrete action or object from the CONCRETE POOL\n` +
    `  「質素な贅沢、夏の終わり」→「タレ多めの並ひとつ」\n` +
    `  「ささやかな満足、また来週」→「レシート七百八十円」\n` +
    `  「日常の儀式、日が暮れて」→「割り箸の袋を畳んでる」\n` +
    `  「この味だけは残るだろう」→「山椒の袋だけポケットに入れた」\n` +
    `- ATMOSPHERIC FILLER REPLACEMENT: 「滲む」「蝉時雨」「夕暮れが」「窓辺」「じわりと広がる」\n` +
    `  are poetic filler. Replace with a concrete sensory object or action from the SOURCE.\n` +
    `  「店先に滲む」→「店先まで流れる」\n` +
    `  「おしぼり 滲んでゆく」→「おしぼりで首を拭く」\n` +
    `  「夕暮れが滲む窓辺」→「曇った窓に提灯が映る」\n` +
    `- CHORUS FINAL LINE: The last line of each Chorus is the emotional landing point.\n` +
    `  Prefer a concrete action, price, or physical evidence over a bare noun fragment.\n` +
    `  Bad final line: 「冷たいおしぼり」(noun only — does not complete the image)\n` +
    `  Weak final lines (too routine — replace if Chorus last): 「麦茶をひと口飲む」\n` +
    `  「おしぼりで首を拭く」「割り箸の袋を畳む」「レシートを財布に戻す」\n` +
    `  These belong in Verse/Pre-Chorus/Interlude, not as Chorus closings.\n` +
    `  Good final line: use one source-specific concrete object, record, number, place, mark,\n` +
    `  or physical trace from the current quick idea. Do not reuse examples from another theme.\n` +
    `  If the last Chorus line is a bare noun or routine daily action, replace it.\n` +
    `- CHORUS SELF-CONTAINED LINES: If a Chorus or Final Chorus line ends with a dangling particle or noun-modifier (が/を/に/で/は/の as the final character), fix it so the line stands alone grammatically.\n` +
    `  Bad: 「タレの焦げ目が」→ particle dangles\n` +
    `  Bad: 「赤ちょうちんの」→ noun-modifier dangles (の at line end).\n` +
    `  Good: 「タレの焦げ目」(drop particle) or rephrase as complete image\n` +
    `  Good: 「赤ちょうちんの甘い匂い」(merge with next line) or 「赤ちょうちん」(drop の).\n` +
    `  Short noun fragments are acceptable: 「山椒ひと振り」「冷たいおしぼり」stand alone fine.\n` +
    `- SECTION ENDINGS: Verse and Bridge must not close on introspective summary or open question.\n` +
    `  Replace with a concrete physical action the narrator performs:\n` +
    `  「今日の味覚を記憶する」→「割り箸の袋を畳んでる」\n` +
    `  「また来る理由を探してる」→「ポイントカードを財布に戻す」\n` +
    `  「何を探してるか分からない」→ use a concrete action or object from the CONCRETE POOL\n` +
    `  「この味が忘れられない」→「空の重箱に山椒だけ残った」\n` +
    breakdownOutroRule +
    `- SEASONAL FILLER: Replace weather/season filler with source-specific concrete details.\n` +
    `  「夏の終わり」「熱い日々」「また来年も」「過ぎ去る季節」→ an object, number, or action.\n` +
    `- NO PROMPT COPY: Do not reproduce user input prose verbatim as lyrics.\n` +
    `  Compress explanatory contrast sentences into short hook phrases.\n` +
    `  Bad: 「高い天然うなぎじゃなくても養殖うなぎで十分うまい」(prose copy)\n` +
    `  Good: 「養殖でいい」「タレでいい」(compressed hook)\n` +
    `  Pattern to fix: any line containing 「じゃなくても」「十分うまい」「高い天然」「庶民的な」「最高級」\n` +
    `  These MUST be replaced — do not leave them in the output even if the rest of the line is OK.\n` +
    `  「最高級じゃなくても」→「並の札を裏返す」\n` +
    `  「高い天然うなぎじゃなくても」→「養殖でいい」\n` +
    `- META LYRIC: Lines that describe the song rather than living inside it must be replaced.\n` +
    `  These MUST be replaced — leaving them is not acceptable.\n` +
    `  「夏の歌」「庶民的な夏の歌」「レシートまで夏の歌」「レシートまで含めた夏の歌」\n` +
    `  → replace with the specific object or action: 「レシート七百八十円」「並の札が裏返る」\n` +
    `- WEAK SENSORY FILLER: 「心を撫でる」「撫でる」「静かな笑顔」「ふわり」「の」(line-end).\n` +
    `  Replace with concrete sensory action: 「丼の底まで タレを拾う」「箸袋を折る」\n` +
    `  If a line ends with 「の」(dangling noun-modifier), either merge it with the next line into one complete image, or drop the 「の」 to form a clean noun fragment.\n` +
    `  Bad: 「赤ちょうちんの」(standalone) + 「甘い匂い」(next line) — 「の」 dangles across lines.\n` +
    `  Good: merge → 「赤ちょうちんの甘い匂い」 or drop → 「赤ちょうちん」\n` +
    `- NORMALIZE: Replace all 赤提灯 with 赤ちょうちん.\n` +
    `- NEAR DUPLICATE LINES: Do not repeat the same key noun or verb in consecutive lines.\n` +
    `  This includes verb-ending duplicates where both lines end with the same verb.\n` +
    `  If two adjacent lines share 麦茶 / レシート / タレ / 山椒 etc., replace one.\n` +
    `  If two adjacent lines end with the same verb (畳む / 拭く / 飲む / 噛む etc.), replace one.\n` +
    `  「水滴残る麦茶を」+「麦茶をひと口飲む」→「麦茶の氷が鳴る」+「おしぼりで首を拭く」\n` +
    `  「カサカサのレシートを畳む」+「割り箸の袋を畳む」→ keep first, replace second:\n` +
    `  「カサカサのレシートを畳む」+「小銭を数えて暖簾を出る」\n` +
    `  「おしぼりで首を拭く」+「顔を拭く」→ keep first, replace second:\n` +
    `  「おしぼりで首を拭く」+「麦茶をひと口飲む」\n` +
    `  Also check cross-section: if a Chorus ends with 麦茶/山椒/タレ/レシート and the next\n` +
    `  section's first line repeats the same noun, replace the second occurrence:\n` +
    `  Chorus: 「山椒ひと振り 麦茶で流す」+ next section: 「麦茶の氷が鳴る」\n` +
    `  → Keep Chorus line; change next section opener: 「おしぼりで首を拭く」\n` +
    `  Chorus: 「麦茶で流す」+ next section: 「麦茶の氷が鳴る」\n` +
    `  → Keep Chorus line; change next section opener: 「レシートを財布に戻す」\n` +
    `  Do NOT repeat the Chorus price in [Interlude] or [Breakdown]. If Chorus ends with\n` +
    `  「レシート七百八十円」and Interlude repeats 「七百八十円」alone, replace the Interlude line:\n` +
    `  「七百八十円」→「カサカサのレシート」or「割り箸の袋を畳む」\n` +
    `  Additional replacement candidates for 畳む overuse across sections:\n` +
    `  「割り箸の袋を畳む」(if 畳む already used nearby) → 「山椒の袋をポケットに入れる」\n` +
    `  「カサカサのレシートを畳む」(if 畳む already used nearby) → 「レシートを財布に戻す」\n` +
    `  「おしぼりで顔を拭く」(if 拭く already used nearby) → 「麦茶をひと口飲む」\n` +
    `  SAME-LINE REPETITION: If the exact same line appears in 2+ non-Chorus sections,\n` +
    `  keep the first and replace subsequent occurrences with a different concrete action:\n` +
    `  「おしぼりで首を拭く」(in Pre-Chorus AND Interlude AND Verse) → keep first,\n` +
    `  replace 2nd: 「指先のタレを紙で拭う」, 3rd: 「袖口のタレを指でこする」\n` +
    `  「割り箸の袋を畳む」(repeated) → keep first, replace: 「山椒の袋をポケットに入れる」\n` +
    `  When 麦茶 appears more than once in nearby lines, replace one occurrence:\n` +
    `  「冷たい麦茶をひと口飲む」→「湯気の向こうで箸を割る」\n` +
    `  「麦茶の氷が鳴る」→「レジ横の小銭皿が鳴る」\n` +
    `  「麦茶で流す」→「焦げた皮を奥歯で噛む」\n` +
    `- INCOMPLETE LINES: A line that ends with a dangling particle (が/を/に/で/は as final char)\n` +
    `  must be fixed: either drop the particle (taigen-dome) or complete the phrase.\n` +
    `  「タレの甘い匂いが」→「タレの甘い匂い」(drop particle) or「タレの甘い匂いが漂う」\n` +
    `- SENSORY FILLER: 「染み渡る」「まだ残る」「目に染みる」「灯り」「視線」「見つめる」\n` +
    `  are atmospheric filler. Replace with concrete objects or physical actions.\n` +
    `  「このタレが染み渡る」→「丼の底までタレを拾う」\n` +
    `  「匂いがまだ残る」→「シャツの袖にタレの匂い」\n` +
    `  「焦げたタレの煙 目に染みる」→「換気扇が煙を吸う」\n` +
    `  「赤ちょうちんの 灯り」→「赤ちょうちん 店先に揺れる」\n` +
    `  「熱い視線で丼を見つめる」→「丼のふたを開ける」\n` +
    `  「暖簾をくぐり外へ」→「小銭を数えて暖簾を出る」\n\n` +
    `FEW-SHOT REPAIR EXAMPLES (apply the same logic to similar lines):\n` +
    `  「その声が響く」→「払い戻しは0円のまま」\n` +
    `  「その一言が響く」→「一度も当たらなかった、と画面に出た」\n` +
    `  「指先の熱が冷めていく」→「締切前の画面を閉じた」\n` +
    `  「静かに閉じた」→「買い目のメモを消した」\n` +
    `  「胸に残る」→「ハズレ券だけが残った」\n` +
    `  「負け慣れた背中」→「ハズレ券を引き出しに入れた」\n` +
    `  「人は去っていく」→「PAT口座の残高を確認した」\n` +
    `  「快感を探してた」→「赤い的中表示を待っていた」\n` +
    `  「快感だけを追いかけて」→「払い戻しの数字を見たかった」\n` +
    `  「万馬券はただの高配当じゃなく」→「赤い的中表示が欲しかった」\n` +
    `  「また来週も競馬したいと思わせる」→「日曜の夜にまた印を打つ」\n` +
    `  「また来週の夢」→「また来週の買い目」\n` +
    `  「質素な贅沢、夏の終わり」→「タレ多めの並ひとつ」\n` +
    `  「ささやかな満足、また来週」→「レシート七百八十円」\n` +
    `  「日常の儀式、日が暮れて」→「割り箸の袋を畳んでる」\n` +
    `  「この味だけは残るだろう」→「山椒の袋だけポケットに入れた」\n` +
    `  「養殖うなぎ、それで十分」→「養殖でいい」\n` +
    `  「高い天然うなぎじゃなくても」→「養殖でいい」\n` +
    `  「最高級じゃなくても」→「並の札を裏返す」\n` +
    `  「養殖うなぎで十分うまい」→「タレでいい」\n` +
    `  「レシートまで夏の歌」→「レシート七百八十円」\n` +
    `  「レシートまで含めた夏の歌」→「レシート七百八十円」\n` +
    `  「冷たいおしぼり首筋に」→「おしぼりで首を拭く」\n` +
    `  「山椒ひと振り 舌が痺れ」→「山椒ひと振り 舌が痺れる」\n` +
    `  「庶民的な夏の歌」→「並の札が裏返る」\n` +
    `  「ただこの焦げ目が 心を撫でる」→「丼の底まで タレを拾う」\n` +
    `  「隣の席では 静かな笑顔」→「隣の席で 箸袋を折る」\n` +
    `  「ふわり うなぎの」→「湯気が丼から上がる」\n` +
    `  「赤提灯 路地裏に映る」→「赤ちょうちん 路地裏に映る」\n` +
    `  「あの夏の日と同じ」→「麦茶の氷が鳴る」\n` +
    `  「このままの夏」→「タレ多めの並ひとつ」\n` +
    `  「喉を静かに潤す」→「麦茶をひと口飲む」\n` +
    `  「この舌は知ってる」→「山椒ひと振り」\n` +
    `  「ざらざらした舌の記憶」→「焦げ目を奥歯で噛む」\n` +
    `  「赤ちょうちんのタレの焦げ目」→「赤ちょうちん」+「タレの焦げ目」(split into 2 lines)\n` +
    `  [の-dangling across 2 lines] 「赤ちょうちんの」\\n「甘い匂い」→ merge: 「赤ちょうちんの甘い匂い」 or use: 「赤ちょうちん」\n` +
    `  「レシートまで含めた庶民的な夏の歌」→「レシート七百八十円」\n` +
    `  [Final Chorus extra line]「競馬をみんな絶対に楽しむんだ」→ DELETE this line (cap at 6)\n` +
    `  [Verb ending duplicate] 「カサカサのレシートを畳む」+「割り箸の袋を畳む」\n` +
    `    → 「カサカサのレシートを畳む」+「小銭を数えて暖簾を出る」\n` +
    `  [Verb ending duplicate] 「おしぼりで首を拭く」+「顔を拭く」\n` +
    `    → 「おしぼりで首を拭く」+「麦茶をひと口飲む」\n` +
    `  「それでもこの場所だけは」→「レシートの日付を親指でなぞる」\n` +
    `  「この場所だけは」→「カウンターの端に箸袋が積まれる」\n` +
    `  「変わらないまま」→「湿った暖簾が肩に触れる」\n` +
    `  [Domain leakage — racing terms in non-racing source] 「また来週の買い目」→「タレ多めの並ひとつ」\n` +
    `  [Domain leakage] 「馬券を握る」→「割り箸の袋を畳む」\n` +
    `  [Chorus final line weak] 「冷たいおしぼり」(line is final, noun only) → 「おしぼりで首を拭く」\n` +
    `  [Chorus final line weak] 「山椒ひと振り」(line is final) → 「山椒ひと振り 舌が痺れる」\n` +
    `- DOMAIN INTEGRITY: If the SOURCE is about food/eel/restaurant and the lyrics contain\n` +
    `  racing-domain terms (買い目/馬券/PAT履歴/万馬券/パドック/穴馬/ハズレ券), replace them:\n` +
    `  「また来週の買い目」→「タレ多めの並ひとつ」or「レシート七百八十円」\n` +
    `  「ハズレ券を引き出しに入れた」→「割り箸の袋を畳む」\n` +
    `  These are vocabulary that leaked from prior racing prompts — remove them.\n` +
    `  Any line whose only function is atmosphere or emotion-label → replace with source evidence.\n\n` +
    `LYRICS TO REPAIR:\n${lyrics}\n\n` +
    `Return ONLY valid JSON: {"lyrics": "<repaired lyrics with all section tags>"}`;

  try {
    return await callGemini(apiKey, systemPrompt, userPrompt, 3200);
  } catch (err) {
    console.error(
      "[mora/generate] repair callGemini failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ─── Deterministic cleanup ───────────────────────────────────────────────────

// Global replacements — safe for all themes (normalization only, no theme-specific output)
const GLOBAL_DETERMINISTIC_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/赤提灯/g, "赤ちょうちん"],
];

// Unagi-specific replacements — applied only when quickIdea contains unagi signals
const UNAGI_INPUT_SIGNALS = [
  "うなぎ", "鰻", "養殖", "タレ", "山椒", "赤ちょうちん", "おしぼり", "麦茶", "暖簾", "レシート七百八十円",
];

const UNAGI_SPECIFIC_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  // Exact-phrase replacements (order matters: more specific first)
  [/レシートまで含めた.*歌/g,                  "レシート七百八十円"],
  [/最高級じゃなくても/g,                    "並の札を裏返す"],
  [/あの夏の日と同じ/g,                      "麦茶の氷が鳴る"],
  [/このままの夏/g,                          "タレ多めの並ひとつ"],
  [/喉を静かに潤す/g,                        "麦茶をひと口飲む"],
  [/この舌は知ってる/g,                      "山椒ひと振り"],
  [/ざらざらした舌の記憶/g,                  "焦げ目を奥歯で噛む"],
  [/この味でいい/g,                          "タレ多めの並ひとつ"],
  // Pattern replacements
  [/^七百八十円[ \t]*$/gm,                   "カサカサのレシート"],
  [/冷たい麦茶で[ \t]*$/gm,                  "冷たい麦茶をひと口飲む"],
  [/ひやりと冷たい[ \t]+おしぼりが[ \t]*$/gm, "おしぼりで首を拭く"],
  [/冷たいおしぼりが[ \t]*$/gm,              "おしぼりで首を拭く"],
  [/冷たいおしぼり首筋に[ \t]*$/gm,          "おしぼりで首を拭く"],
  [/舌が痺れ[ \t]*$/gm,                     "舌が痺れる"],
];

function applyDeterministicCleanup(lyrics: string, quickIdea: string): { text: string; replacedCount: number } {
  let text = lyrics;
  let replacedCount = 0;
  for (const [pat, replacement] of GLOBAL_DETERMINISTIC_REPLACEMENTS) {
    const next = text.replace(pat, replacement);
    if (next !== text) { replacedCount++; text = next; }
  }
  if (UNAGI_INPUT_SIGNALS.some(s => quickIdea.includes(s))) {
    for (const [pat, replacement] of UNAGI_SPECIFIC_REPLACEMENTS) {
      const next = text.replace(pat, replacement);
      if (next !== text) { replacedCount++; text = next; }
    }
  }
  return { text, replacedCount };
}

// ─── Domain leakage detection ────────────────────────────────────────────────

const RACING_DOMAIN_TERMS = [
  "買い目", "馬券", "PAT履歴", "万馬券", "パドック", "穴馬", "ハズレ券",
];
const RACING_INPUT_SIGNALS = ["競馬", "馬券", "PAT", "万馬券", "パドック", "穴馬", "競走馬"];

function detectDomainLeakage(lyrics: string, quickIdea: string): string | null {
  if (RACING_INPUT_SIGNALS.some(s => quickIdea.includes(s))) return null;
  for (const term of RACING_DOMAIN_TERMS) {
    if (lyrics.includes(term)) return `racing domain leakage: "${term}"`;
  }
  return null;
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

    let finalLyrics = typeof parsed.lyrics === "string" ? parsed.lyrics : "";
    const quickIdea = input.theme?.trim() || input.title?.trim() || "";
    const driftReason = finalLyrics
      ? (detectAbstractDrift(finalLyrics) ?? detectDomainLeakage(finalLyrics, quickIdea))
      : null;

    if (driftReason) {
      console.log("[mora/generate] abstract drift detected:", driftReason);
      console.log("[mora/generate] repair start — pre-length:", finalLyrics.length);
      const preRepairLyrics = finalLyrics;
      const repairResult = await repairAbstractDrift(apiKey, finalLyrics, quickIdea);
      if (repairResult) {
        try {
          const repaired = extractJson(repairResult.text, {
            rawLength: repairResult.text.length,
            finishReason: repairResult.finishReason,
          });
          if (typeof repaired.lyrics === "string" && repaired.lyrics.length > 0) {
            console.log(
              "[mora/generate] repair done — post-length:", repaired.lyrics.length,
              "finishReason:", repairResult.finishReason ?? "unknown",
            );
            finalLyrics = repaired.lyrics;
          }
        } catch (parseErr) {
          console.error("[mora/generate] repair JSON parse failed:", parseErr);
        }
      } else {
        console.log("[mora/generate] repair skipped — callGemini returned null");
      }
      // Post-repair analysis
      const counts = chorusLineCounts(finalLyrics);
      const residualDrift = detectAbstractDrift(finalLyrics);
      const { repairedLines, repairedSections } = analyzeRepairDiff(preRepairLyrics, finalLyrics);
      const residualJpAbstract    = residualDrift?.includes("JP abstract")          ? "detected" : "none";
      const residualEnSlogan      = residualDrift?.includes("EN slogan")            ? "detected" : "none";
      const residualMixed         = residualDrift?.includes("weird mixed")           ? "detected" : "none";
      const residualWeak          = residualDrift?.includes("weak poetic")           ? "detected" : "none";
      const residualGenericPos    = residualDrift?.includes("generic positive")      ? "detected" : "none";
      const residualExplanatory   = residualDrift?.includes("explanatory prose")     ? "detected" : "none";
      const residualAbstractSum   = residualDrift?.includes("abstract summary")      ? "detected" : "none";
      const residualDangling      = residualDrift?.includes("dangling particle")     ? "detected" : "none";
      const residualMetaLyric     = residualDrift?.includes("meta lyric")            ? "detected" : "none";
      const residualKaikan        = residualDrift?.includes("快感 overuse")          ? "detected" : "none";
      const finalChorusOverflow   = detectFinalChorusOverflow(finalLyrics)           ? "detected" : "none";
      console.log(
        `[mora/generate] post-repair — Chorus count:${counts.length} lines:${JSON.stringify(counts)}`,
        `| jp_abstract:${residualJpAbstract}`,
        `| en_slogan:${residualEnSlogan}`,
        `| weird_mixed_lang:${residualMixed}`,
        `| weak_poetic:${residualWeak}`,
        `| abstract_summary:${residualAbstractSum}`,
        `| dangling_particle:${residualDangling}`,
        `| meta_lyric:${residualMetaLyric}`,
        `| generic_positive_ending:${residualGenericPos}`,
        `| explanatory_prose:${residualExplanatory}`,
        `| kaikan_overuse:${residualKaikan}`,
        `| final_chorus_overflow:${finalChorusOverflow}`,
        `| repaired_lines:${repairedLines}`,
        `| sections:${repairedSections.join(",") || "none"}`,
      );
      if (residualDrift) {
        console.log("[mora/generate] post-repair residual detail:", residualDrift);
      }
    }

    // Always apply deterministic cleanup as final pass
    const { text: cleanedLyrics, replacedCount: cleanCount } = applyDeterministicCleanup(finalLyrics, quickIdea);
    if (cleanCount > 0) {
      console.log(`[mora/generate] deterministic cleanup — ${cleanCount} pattern(s) replaced`);
      finalLyrics = cleanedLyrics;
    }

    // Final quality check (always runs)
    const finalResidual    = detectAbstractDrift(finalLyrics);
    const nearDupResult    = detectNearDuplicate(finalLyrics, quickIdea);
    const domainLeakResult = detectDomainLeakage(finalLyrics, quickIdea);
    const qualityWarning   = finalResidual || nearDupResult;
    console.log(
      `[mora/generate] final — quality_warning:${qualityWarning ? "detected" : "none"}`,
      `| domain_leakage:${domainLeakResult ? "detected" : "none"}`,
      `| near_duplicate:${nearDupResult ? "detected" : "none"}`,
      `| deterministic_replacements:${cleanCount}`,
    );
    if (finalResidual) {
      console.log("[mora/generate] final residual detail:", finalResidual);
    }
    if (domainLeakResult) {
      console.log("[mora/generate] domain leakage detail:", domainLeakResult);
    }
    if (nearDupResult) {
      console.log("[mora/generate] near duplicate detail:", nearDupResult);
    }

    return NextResponse.json({
      lyrics: finalLyrics,
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
