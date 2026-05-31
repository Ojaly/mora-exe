use serde_json::Value;
use std::time::Duration;

// ─── Forge system prompt (mirrors app/api/ai/forge/route.ts) ─────────────────

const FORGE_SYSTEM_PROMPT: &str = r#"You are a World Expansion Engine for music production.
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

OUTPUT: Valid JSON only — no markdown fences. JSON string values must not contain literal newlines — use \n if a newline is needed.
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
}"#;

// ─── forge_world command ──────────────────────────────────────────────────────

/// Call Gemini API to expand a world seed into a WorldExpansion object.
/// Returns Ok(Some(expansion)) on success.
/// Returns Ok(None) when GEMINI_API_KEY is not set — frontend uses rule-based fallback.
/// Returns Err(msg) on API or parse failure — frontend uses rule-based fallback.
#[tauri::command]
async fn forge_world(world_seed: String) -> Result<Option<Value>, String> {
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.trim().is_empty() => k,
        _ => return Ok(None),
    };

    let user_prompt = format!(
        "World Seed: \"{}\"\n\nExpand this world. Return JSON only.",
        world_seed
    );

    let body = serde_json::json!({
        "system_instruction": {
            "parts": [{ "text": FORGE_SYSTEM_PROMPT }]
        },
        "contents": [{
            "role": "user",
            "parts": [{ "text": user_prompt }]
        }],
        "generationConfig": {
            "maxOutputTokens": 2000,
            "response_mime_type": "application/json",
            "thinkingConfig": { "thinkingBudget": 0 }
        }
    });

    // NOTE: URL contains api_key as query param — never log this URL.
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("HTTP client build error: {}", e))?;

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API error {}: {}", status, text));
    }

    let resp_json: Value = response
        .json()
        .await
        .map_err(|e| format!("Response parse error: {}", e))?;

    let text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| "Gemini returned empty content".to_string())?;

    let mut expansion = extract_json_object(text)?;

    // Ensure musicDirection.source = "gemini" (matches MusicDirection type: "gemini" | "rule")
    if let Some(md) = expansion.get_mut("musicDirection") {
        if let Some(obj) = md.as_object_mut() {
            obj.insert("source".to_string(), Value::String("gemini".to_string()));
        }
    }

    Ok(Some(expansion))
}

// ─── Alchemy system prompt (mirrors app/api/ai/alchemy/route.ts) ─────────────

const ALCHEMY_SYSTEM_PROMPT: &str = r#"You are Source Alchemy — a transmutation engine for MORA.exe (World Translator IDE).

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

OUTPUT: Return ONLY valid JSON (no markdown, no code fences). JSON string values must not contain literal newlines — use \n if a newline is needed.
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
}"#;

// ─── JSON extraction helper ───────────────────────────────────────────────────

/// コードフェンス除去 → 最初の `{` から深さ0になる `}` までを抽出 → parse。
/// string-aware（JSON string 内の括弧は深さ計算に含まない）。
fn extract_json_object(text: &str) -> Result<Value, String> {
    let s = text
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let start = s.find('{').ok_or_else(|| "No JSON object found in Gemini response".to_string())?;
    let s = &s[start..];

    let mut depth: i32 = 0;
    let mut in_string = false;
    let mut escaped = false;
    let mut end = None;

    for (i, c) in s.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if c == '\\' && in_string {
            escaped = true;
            continue;
        }
        if c == '"' {
            in_string = !in_string;
            continue;
        }
        if in_string {
            continue;
        }
        if c == '{' {
            depth += 1;
        } else if c == '}' {
            depth -= 1;
            if depth == 0 {
                end = Some(i);
                break;
            }
        }
    }

    let end = end.ok_or_else(|| "Unterminated JSON in Gemini response".to_string())?;
    serde_json::from_str(&s[..=end]).map_err(|e| format!("JSON parse error: {}", e))
}

// ─── alchemy_transform command ────────────────────────────────────────────────

/// Call Gemini API to transmute source material into AlchemyResult JSON.
/// Returns Ok(Some(result)) on success.
/// Returns Ok(None) when GEMINI_API_KEY is not set — frontend shows an error.
/// Returns Err(msg) on API or parse failure — frontend shows an error.
#[tauri::command]
async fn alchemy_transform(
    source_text: String,
    user_reaction: String,
    desired_tone: String,
    avoid_direct_reference: bool,
) -> Result<Option<Value>, String> {
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.trim().is_empty() => k,
        _ => return Ok(None),
    };

    // Build user prompt (mirrors route.ts logic)
    let source_trimmed: String = source_text.chars().take(3000).collect();
    let reaction_text = if user_reaction.trim().is_empty() {
        "(no reaction specified)".to_string()
    } else {
        user_reaction.clone()
    };
    let tone_line = if desired_tone.trim().is_empty() {
        String::new()
    } else {
        format!("\nDESIRED TONE: {}", desired_tone)
    };
    let avoid_note = if avoid_direct_reference {
        "\nCRITICAL: ALL proper nouns, brand names, place names, person names must be removed from every field of the output. Zero direct references."
    } else {
        ""
    };

    let user_prompt = format!(
        "SOURCE TEXT:\n\"\"\"\n{}\n\"\"\"\n\nUSER REACTION:\n\"{}\"{}{}",
        source_trimmed, reaction_text, tone_line, avoid_note
    );
    let user_prompt = format!("{}\n\nTransmute this into universal poetic material for music. Return JSON only.", user_prompt);

    // Build Gemini request body
    let body = serde_json::json!({
        "system_instruction": {
            "parts": [{ "text": ALCHEMY_SYSTEM_PROMPT }]
        },
        "contents": [{
            "role": "user",
            "parts": [{ "text": user_prompt }]
        }],
        "generationConfig": {
            "maxOutputTokens": 2500,
            "response_mime_type": "application/json",
            "thinkingConfig": { "thinkingBudget": 0 }
        }
    });

    // NOTE: URL contains api_key as query param — never log this URL.
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("HTTP client build error: {}", e))?;

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API error {}: {}", status, text));
    }

    let resp_json: Value = response
        .json()
        .await
        .map_err(|e| format!("Response parse error: {}", e))?;

    let text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| "Gemini returned empty content".to_string())?;

    let result = extract_json_object(text)?;
    Ok(Some(result))
}

// ─── Rewrite system prompt (mirrors app/api/ai/rewrite/route.ts) ─────────────

const REWRITE_SYSTEM_PROMPT: &str = r#"You are a Suno AI lyricist. Rewrite song lyrics with surgical precision.

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

OUTPUT: Return ONLY valid JSON (no markdown, no code fences). JSON string values must not contain literal newlines — use \n if a newline is needed.
{
  "rewrittenLyrics": "<complete lyrics with all section tags and blank lines>",
  "notes": "<1–2 sentence Japanese note on what changed and why>",
  "changedLines": [<1-indexed content line numbers changed, section tags excluded>]
}"#;

// ─── Rewrite prompt helpers ───────────────────────────────────────────────────

fn rewrite_intensity_instruction(intensity: &str) -> &'static str {
    match intensity {
        "subtle"     => "INTENSITY: SUBTLE — Preserve atmosphere entirely. Change at most 15–20% of lines. Fix only the most glaring issues. The listener should barely notice.",
        "aggressive" => "INTENSITY: AGGRESSIVE — Rebuild boldly. Keep only the emotional core and section structure. New imagery, new phrasing, new rhythmic attack. Transform, don't touch-up.",
        _            => "INTENSITY: MEDIUM — Meaningful improvements while preserving the world and atmosphere.",
    }
}

fn rewrite_section_instruction(section_target: &str) -> &'static str {
    match section_target {
        "chorus"     => "\nSECTION TARGET: Rewrite ONLY the [Chorus] sections. Leave every other section word-for-word identical.",
        "verse"      => "\nSECTION TARGET: Rewrite ONLY the [Verse 1] and [Verse 2] sections. Leave every other section word-for-word identical.",
        "pre-chorus" => "\nSECTION TARGET: Rewrite ONLY the [Pre-Chorus] sections. Leave every other section word-for-word identical.",
        "bridge"     => "\nSECTION TARGET: Rewrite ONLY the [Bridge] sections. Leave every other section word-for-word identical.",
        _            => "",
    }
}

fn rewrite_mode_instruction(mode: &str, mora_warnings: &[i64]) -> String {
    let warn_str = if mora_warnings.is_empty() {
        String::new()
    } else {
        let positions: Vec<String> = mora_warnings.iter().map(|n| n.to_string()).collect();
        format!(
            "\nMORA PRIORITY: Lines at positions {} exceed 14 mora — shorten these first while preserving meaning and heat.",
            positions.join(", ")
        )
    };

    match mode {
        "catchy" => "Make it catchier and more memorable. Prioritize hook quality above all else: the chorus must be impossible to unhear, built on rhythmic repetition and a single unforgettable phrase. Verse lines should build tension toward that hook. Only shorten a line when cutting it makes it hit harder rhythmically — not for brevity's sake. The goal is earworm density: every bar should feel like it wants to be sung again. Favor short, punchy words with strong vowel sounds. If the chorus doesn't lodge in the listener's head, rewrite it until it does.".to_string(),
        "remove-ai" => "Strip all generic AI poetry — both English and Japanese clichés. English: remove 'feel alive', 'lose control', 'rise above', 'break free', 'in my veins', 'warrior', 'burning inside'. Japanese: remove 大丈夫・輝いてる・信じて・翼を広げて・明日へ・夢を追って・共に歩こう・諦めないで・走り続ける・心に響く・希望の光・未来へ向かって・一緒に歩こう. Replace ALL clichés with specific, concrete, world-specific imagery drawn from the style context. If a line sounds like a writing-prompt output, rewrite it entirely. Make it feel written by a human who lived it.".to_string(),
        "shorten-mora" => format!("Shorten every line over 14 mora. Cut to the essential meaning. Preserve emotional temperature, tension, and rhythmic feel. No flat reductions — make shorter lines hit harder.{}", warn_str),
        "strengthen-chorus" => "Rewrite [Chorus] sections only. Shorter lines, more direct emotion, higher singability, built for repetition. Every word must earn its place. Leave all other sections untouched.".to_string(),
        "more-japanese" => "Replace English with natural Japanese that preserves meaning, rhythm, and emotional register. Avoid literal translation — find the Japanese that feels right, not just correct.".to_string(),
        "more-english" => "Add English phrases and lines to the lyrics. English must NOT translate or restate the Japanese — use it to add a new image, emotional angle, sonic texture, or rhythmic hook. Prefer short, memorable English phrases over full explanatory sentences. Avoid bilingual mirror lines (Japanese meaning → same English meaning). English expands the world and emotional register; it does not echo it.".to_string(),
        "darker" => "Deepen the shadow. Replace hope or neutrality with dread, desperation, or melancholic beauty. Don't just swap words — shift the emotional temperature of the whole piece.".to_string(),
        "danceable" => "Make it move. Shorter lines, punchy syllables, rhythmic stress on strong beats, physical energy in the word choices. The body should feel this, not just the mind.".to_string(),
        "poetic" => "Make the lyrics more poetic — less explanation, more image.\n- Remove explanatory connectives (だから, なぜなら, つまり, そして)\n- Replace direct emotional statements with concrete sensory images\n- Trust the reader: cut anything that over-explains\n- Let silence do work: shorter lines, implication over statement\n- Each line should carry more weight than its literal meaning\n- Abstract feelings must become specific objects, textures, temperatures".to_string(),
        "ironic" => "Add irony, quiet detachment, and subtle uncanniness to the lyrics.\n- Replace sincere statements with slight distance or understatement\n- The narrator knows more than they're letting on\n- Surface emotions should quietly contradict what's underneath\n- Aim for wry, understated, not cynical\n- The chorus split: the surface meaning and the real meaning should diverge slightly\n- Especially effective when the most painful things are said the most calmly".to_string(),
        "ojaly" => "Rewrite in the ojaly. lyrical aesthetic.\n\nMake it:\n- more minimal — fewer words, more negative space\n- more nocturnal — the world is dark, late, uncertain\n- more poetic — metaphor and resonance over direct statement\n- more emotionally restrained — feelings hinted, never shouted\n- more cinematic — a scene, not a sentiment\n- slightly ironic or uncanny — something slightly off, not fully resolved\n- less explanatory — trust the image, delete the interpretation\n- less generic J-pop — no 光/明日/君の笑顔 clichés\n- more memorable chorus — short, strange, stays in the head long after\n\nPreserve the original theme and section structure exactly.\nDo not add proper nouns unless already present.\nAvoid cliché English phrases (feel alive / in my veins / break free / warrior).\n\n日本語歌詞の場合のニュアンス優先：\n- 説明を削り、余韻を増やす\n- 夜・光・孤独・違和感・近未来感をにじませる\n- 感情を叫ばず、静かに刺す\n- 少し皮肉、または不穏さを漂わせる\n- 安いJ-POP的直球表現（大丈夫・輝く・信じて）を排除\n- サビは短く、覚えやすく、異質な印象が残る形にする".to_string(),
        _ => "Improve overall quality.".to_string(),
    }
}

fn rewrite_preset_deep(world_preset: &str) -> &'static str {
    match world_preset {
        "neon"            => "World lens: cyber melancholy. Wet streets reflecting neon at 3am. Urban loneliness inside a digital shell. Signal degradation as emotion. Images should feel like a CRT screen through rain.",
        "corporate"       => "World lens: corporate perfection masking hollow emotion. Luxury dystopia. Fluorescent warmth at 11pm. Polished surface over existential dread.",
        "mythic"          => "World lens: mythic scale, legendary tone. Cinematic destiny. Ancient oaths. Sacrifice honored by silence. Write with the weight of fading empires.",
        "digital-motown"  => "World lens: digital Motown. Groove warmth rebuilt in a DAW. Retro-futuristic soul. The ache of reaching for something human through a machine.",
        "electro-waltz"   => "World lens: rotational rhythm, elegant melancholy. Ballroom corrupted by static. Lines should feel like they turn — 3/4 cadence in the language.",
        "gospel-irony"    => "World lens: sacred language for secular pain. Redemption irony — the sermon that admits doubt. Gospel energy without religion. Communal intensity.",
        _                 => "",
    }
}

// ─── rewrite_lyrics command ───────────────────────────────────────────────────

/// Call Gemini API to rewrite lyrics with a specified mode.
/// Returns Ok(Some({ rewrittenLyrics, notes, changedLines })) on success.
/// Returns Ok(None) when GEMINI_API_KEY is not set — frontend uses rule-based fallback.
/// Returns Err(msg) on API or parse failure — frontend uses rule-based fallback.
#[tauri::command]
async fn rewrite_lyrics(
    mode: String,
    lyrics: String,
    style_prompt: String,
    _song_input: Value,  // passed by frontend but not used; world_preset extracted separately
    mora_warnings: Vec<i64>,
    intensity: String,
    section_target: String,
    world_preset: String,
) -> Result<Option<Value>, String> {
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.trim().is_empty() => k,
        _ => return Ok(None),
    };

    let preset_ctx = rewrite_preset_deep(&world_preset);
    let preset_block = if preset_ctx.is_empty() {
        String::new()
    } else {
        format!("\n{}", preset_ctx)
    };
    let style_ctx = if style_prompt.trim().is_empty() {
        "(none)".to_string()
    } else {
        style_prompt.clone()
    };

    let user_prompt = format!(
        "{}\n{}\n\nMODE: {}\nINSTRUCTION: {}\n{}\n\nSTYLE CONTEXT (tone/world reference — do not output):\n{}\n\nCURRENT LYRICS:\n{}\n\nReturn JSON only.",
        rewrite_intensity_instruction(&intensity),
        rewrite_section_instruction(&section_target),
        mode,
        rewrite_mode_instruction(&mode, &mora_warnings),
        preset_block,
        style_ctx,
        lyrics
    );

    let body = serde_json::json!({
        "system_instruction": {
            "parts": [{ "text": REWRITE_SYSTEM_PROMPT }]
        },
        "contents": [{
            "role": "user",
            "parts": [{ "text": user_prompt }]
        }],
        "generationConfig": {
            "maxOutputTokens": 2500,
            "response_mime_type": "application/json",
            "thinkingConfig": { "thinkingBudget": 0 }
        }
    });

    // NOTE: URL contains api_key as query param — never log this URL.
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("HTTP client build error: {}", e))?;

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API error {}: {}", status, text));
    }

    let resp_json: Value = response
        .json()
        .await
        .map_err(|e| format!("Response parse error: {}", e))?;

    let text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| "Gemini returned empty content".to_string())?;

    let parsed = extract_json_object(text)?;

    // Normalize to match route.ts output shape (mirrors: parsed.X ?? fallback)
    let rewritten_lyrics = parsed["rewrittenLyrics"]
        .as_str()
        .unwrap_or(&lyrics)
        .to_string();
    let notes = parsed["notes"].as_str().unwrap_or("").to_string();
    let changed_lines = if parsed["changedLines"].is_array() {
        parsed["changedLines"].clone()
    } else {
        serde_json::json!([])
    };

    Ok(Some(serde_json::json!({
        "rewrittenLyrics": rewritten_lyrics,
        "notes": notes,
        "changedLines": changed_lines,
    })))
}

// ─── Generate system prompt (mirrors app/api/ai/generate/route.ts SYSTEM_PROMPT) ──

const GENERATE_SYSTEM_PROMPT: &str = r#"You are a Suno AI lyricist writing for professional music production.

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

OUTPUT: Return ONLY valid JSON (no markdown, no code fences). JSON string values must not contain literal newlines — use \n if a newline is needed.
{
  "lyrics": "<complete lyrics with all section tags and blank lines between sections>",
  "notes": "<1–2 sentence Japanese note on which specific Quick Idea elements were woven in>"
}"#;

// ─── generate_lyrics helpers ──────────────────────────────────────────────────

fn generate_lang_instruction(ratio: &str) -> &'static str {
    match ratio {
        "high"  => "Write mostly in English (80%+). Japanese words ok as texture or flavor. Each English line must carry its own image or hook — not restate adjacent content in another language.",
        "mixed" => "Mix Japanese and English. English must NOT translate or restate the Japanese line — use English as hooks, inner voice, sonic texture, or rhythmic fragments that add a new image or emotional angle. Avoid bilingual mirror lines where both languages say the same thing.",
        _       => "Write entirely in Japanese. Do not use English words, phrases, or fragments anywhere in the lyrics — including Verse, Chorus, Interlude, Breakdown, Outro, and Bridge. Every line must be in Japanese.",
    }
}

// ─── Deterministic cleanup (mirrors applyDeterministicCleanup in route.ts) ───

/// Unagi signals — mirrors UNAGI_INPUT_SIGNALS in route.ts.
const UNAGI_SIGNALS: &[&str] = &[
    "うなぎ", "鰻", "養殖", "タレ", "山椒", "赤ちょうちん",
    "おしぼり", "麦茶", "暖簾", "レシート七百八十円",
];

/// Replaces the first occurrence of `prefix + (any chars, greedy) + suffix` in `line`
/// with `replacement`. Mimics JS /prefix.*suffix/g (no multiline) on a single line.
fn replace_infix_in_line(line: &str, prefix: &str, suffix: &str, replacement: &str) -> String {
    if let Some(start) = line.find(prefix) {
        let after = &line[start + prefix.len()..];
        // Greedy: use rfind to consume as many chars as possible before suffix.
        if let Some(rel) = after.rfind(suffix) {
            let end = start + prefix.len() + rel + suffix.len();
            return format!("{}{}{}", &line[..start], replacement, &line[end..]);
        }
    }
    line.to_string()
}

/// Applies end-of-line anchored replacement rules.
/// Mirrors the `/pattern[ \t]*$/gm` and `/^...$` patterns in UNAGI_SPECIFIC_REPLACEMENTS.
fn apply_line_end_cleanup(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut first = true;
    for line in text.split('\n') {
        if !first {
            out.push('\n');
        }
        first = false;

        // Strip trailing spaces/tabs to check end-anchored patterns.
        // The replacement subsumes those trailing chars (mirrors JS `[ \t]*$`).
        let te = line.trim_end_matches(|c: char| c == ' ' || c == '\t');

        // /^七百八十円[ \t]*$/gm — full-line match (both ^ and $ anchors)
        if te == "七百八十円" {
            out.push_str("カサカサのレシート");
            continue;
        }

        // /冷たい麦茶で[ \t]*$/gm → "冷たい麦茶をひと口飲む"
        if te.ends_with("冷たい麦茶で") {
            let pre = &te[..te.len() - "冷たい麦茶で".len()];
            out.push_str(pre);
            out.push_str("冷たい麦茶をひと口飲む");
            continue;
        }

        // /ひやりと冷たい[ \t]+おしぼりが[ \t]*$/gm → "おしぼりで首を拭く"
        // Requires at least one space/tab between "ひやりと冷たい" and "おしぼりが".
        if te.ends_with("おしぼりが") {
            let wo_end = &te[..te.len() - "おしぼりが".len()];
            if wo_end.ends_with(' ') || wo_end.ends_with('\t') {
                let wo_sp = wo_end.trim_end_matches(|c: char| c == ' ' || c == '\t');
                if wo_sp.ends_with("ひやりと冷たい") {
                    let pre = &wo_sp[..wo_sp.len() - "ひやりと冷たい".len()];
                    out.push_str(pre);
                    out.push_str("おしぼりで首を拭く");
                    continue;
                }
            }
        }

        // /冷たいおしぼりが[ \t]*$/gm → "おしぼりで首を拭く"
        if te.ends_with("冷たいおしぼりが") {
            let pre = &te[..te.len() - "冷たいおしぼりが".len()];
            out.push_str(pre);
            out.push_str("おしぼりで首を拭く");
            continue;
        }

        // /冷たいおしぼり首筋に[ \t]*$/gm → "おしぼりで首を拭く"
        if te.ends_with("冷たいおしぼり首筋に") {
            let pre = &te[..te.len() - "冷たいおしぼり首筋に".len()];
            out.push_str(pre);
            out.push_str("おしぼりで首を拭く");
            continue;
        }

        // /舌が痺れ[ \t]*$/gm → "舌が痺れる"
        if te.ends_with("舌が痺れ") {
            let pre = &te[..te.len() - "舌が痺れ".len()];
            out.push_str(pre);
            out.push_str("舌が痺れる");
            continue;
        }

        // No pattern matched — keep original line (preserves any trailing whitespace).
        out.push_str(line);
    }
    out
}

/// Mirrors `applyDeterministicCleanup` from app/api/ai/generate/route.ts.
/// Applies normalization passes without any AI call:
///   1. Global replacements — safe for all themes
///   2. Unagi-specific replacements — only when quick_idea contains an unagi signal
///
/// repair / detectAbstractDrift / quality-check are intentionally NOT included here.
fn apply_generate_deterministic_cleanup(lyrics: &str, quick_idea: &str) -> String {
    let mut text = lyrics.to_string();

    // ── Global: GLOBAL_DETERMINISTIC_REPLACEMENTS ─────────────────────────────
    // /赤提灯/g → "赤ちょうちん"
    text = text.replace("赤提灯", "赤ちょうちん");

    // ── Unagi-specific: UNAGI_SPECIFIC_REPLACEMENTS ───────────────────────────
    if !UNAGI_SIGNALS.iter().any(|s| quick_idea.contains(s)) {
        return text;
    }

    // Exact-phrase replacements — order mirrors UNAGI_SPECIFIC_REPLACEMENTS (more specific first)

    // /レシートまで含めた.*歌/g → "レシート七百八十円"
    {
        let lines: Vec<String> = text
            .split('\n')
            .map(|l| replace_infix_in_line(l, "レシートまで含めた", "歌", "レシート七百八十円"))
            .collect();
        text = lines.join("\n");
    }

    text = text.replace("最高級じゃなくても",   "並の札を裏返す");
    text = text.replace("あの夏の日と同じ",     "麦茶の氷が鳴る");
    text = text.replace("このままの夏",         "タレ多めの並ひとつ");
    text = text.replace("喉を静かに潤す",       "麦茶をひと口飲む");
    text = text.replace("この舌は知ってる",     "山椒ひと振り");
    text = text.replace("ざらざらした舌の記憶", "焦げ目を奥歯で噛む");
    text = text.replace("この味でいい",         "タレ多めの並ひとつ");

    // Line-end anchored patterns (/pattern[ \t]*$/gm  and  /^...$/)
    text = apply_line_end_cleanup(&text);

    // /赤ちょうちんの\n甘い匂い/g → "赤ちょうちんの甘い匂い"
    // Literal newline in string — plain replace is sufficient.
    text = text.replace("赤ちょうちんの\n甘い匂い", "赤ちょうちんの甘い匂い");

    text
}

// ─── generate_lyrics command ──────────────────────────────────────────────────

/// Call Gemini API to generate song lyrics.
/// - legacy path (expansion is None): builds prompt from SongInput fields.
/// - expansion path (expansion is Some, expansion_user_prompt non-empty): uses the
///   pre-built prompt string from TS (mirrors buildExpansionUserPrompt in route.ts).
/// Returns Ok(Some({ lyrics, notes })) on success.
/// Returns Ok(None) when GEMINI_API_KEY is not set, or when expansion is present but
///   expansion_user_prompt is empty (frontend uses buildExpansionLyricsFallback).
/// Returns Err(msg) on API or parse failure — frontend uses rule-based fallback.
#[tauri::command]
async fn generate_lyrics(
    song_input: serde_json::Value,
    expansion: Option<serde_json::Value>,
    expansion_user_prompt: String,
    resolved_structure: String,
    world_preset_deep_prompt: String,
    library_style_addition: String,
) -> Result<Option<Value>, String> {
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.trim().is_empty() => k,
        _ => return Ok(None),
    };

    // expansion path: TS 側で組み立てた prompt を使う。
    // expansion_user_prompt が空なら buildExpansionLyricsFallback に任せる。
    if expansion.is_some() && expansion_user_prompt.trim().is_empty() {
        return Ok(None);
    }

    // Determine the user prompt for Gemini
    let user_prompt: String = if expansion.is_some() {
        // expansion path: use the pre-built prompt from TS
        expansion_user_prompt.clone()
    } else {
        // legacy path: build from SongInput fields (mirrors buildLegacyUserPrompt in route.ts)
        let title          = song_input["title"].as_str().unwrap_or("").to_string();
        let theme          = song_input["theme"].as_str().unwrap_or("").trim().to_string();
        let genre_lock     = song_input["genreLock"].as_str().unwrap_or("").trim().to_string();
        let genre          = song_input["genre"].as_str().unwrap_or("").to_string();
        let mood           = song_input["mood"].as_str().unwrap_or("").to_string();
        let vocal_type     = song_input["vocalType"].as_str().unwrap_or("").to_string();
        let bpm            = song_input["bpm"].as_str().unwrap_or("120").to_string();
        let bpm            = if bpm.trim().is_empty() { "120".to_string() } else { bpm };
        let key            = song_input["key"].as_str().unwrap_or("Am").to_string();
        let key            = if key.trim().is_empty() { "Am".to_string() } else { key };
        let english_ratio  = song_input["englishRatio"].as_str().unwrap_or("low").to_string();
        let reference_vibe = song_input["referenceVibe"].as_str().unwrap_or("").to_string();
        let avoid_exprs    = song_input["avoidExpressions"].as_str().unwrap_or("").to_string();
        let song_length    = song_input["songLength"].as_str().unwrap_or("full").to_string();

        let effective_genre = if genre_lock.is_empty() { genre.as_str() } else { genre_lock.as_str() };
        let quick_idea = if !theme.is_empty() { theme.clone() } else { title.trim().to_string() };

        let mut p = String::new();

        if !quick_idea.is_empty() {
            p.push_str(&format!(
                "╔═══ QUICK IDEA (TOP PRIORITY) ═══╗\n{}\n╚══════════════════════════════════╝\n\n",
                quick_idea
            ));
        }

        p.push_str("Generate lyrics with these parameters:\n\n");
        p.push_str(&format!("TITLE: {}\n", if title.is_empty() { "(未設定)" } else { &title }));
        p.push_str(&format!("GENRE: {}\n", effective_genre));
        p.push_str(&format!("MOOD: {}\n", mood));
        p.push_str(&format!("VOCAL: {}\n", vocal_type));
        p.push_str(&format!("BPM: {}\n", bpm));
        p.push_str(&format!("KEY: {}\n", key));
        p.push_str(&format!("SONG LENGTH: {}\n", song_length));
        p.push_str(&format!("LANGUAGE: {}\n", generate_lang_instruction(&english_ratio)));
        p.push_str(&format!("REFERENCE VIBE: {}\n", if reference_vibe.is_empty() { "(none)" } else { &reference_vibe }));
        p.push_str(&format!("AVOID: {}\n", if avoid_exprs.is_empty() { "(none)" } else { &avoid_exprs }));
        p.push_str(&format!("STRUCTURE: {}", resolved_structure));

        if !library_style_addition.trim().is_empty() {
            p.push_str(&format!("\nSTYLE TAGS: {}", library_style_addition));
        }
        if !world_preset_deep_prompt.trim().is_empty() {
            p.push_str(&format!("\n\nWORLD PRESET LENS: {}", world_preset_deep_prompt));
        }

        p.push_str("\n\n");
        if !quick_idea.is_empty() {
            p.push_str(&format!(
                "Every line must be traceable to the Quick Idea: \"{}\". No generic imagery.",
                quick_idea
            ));
        } else {
            p.push_str(&format!(
                "Theme \"{}\" is the subject. Write from inside this world.",
                title
            ));
        }
        p.push_str("\n\nReturn JSON only.");
        p
    };

    let body = serde_json::json!({
        "system_instruction": {
            "parts": [{ "text": GENERATE_SYSTEM_PROMPT }]
        },
        "contents": [{
            "role": "user",
            "parts": [{ "text": user_prompt }]
        }],
        "generationConfig": {
            "maxOutputTokens": 3200,
            "response_mime_type": "application/json",
            "thinkingConfig": { "thinkingBudget": 0 }
        }
    });

    // NOTE: URL contains api_key as query param — never log this URL.
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("HTTP client build error: {}", e))?;

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API error {}: {}", status, text));
    }

    let resp_json: Value = response
        .json()
        .await
        .map_err(|e| format!("Response parse error: {}", e))?;

    let text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or_else(|| "Gemini returned empty content".to_string())?;

    let parsed = extract_json_object(text)?;

    let lyrics = parsed["lyrics"].as_str().unwrap_or("").to_string();
    if lyrics.is_empty() {
        return Err("Gemini returned empty lyrics".to_string());
    }
    let notes = parsed["notes"].as_str().unwrap_or("").to_string();

    // Deterministic cleanup — mirrors applyDeterministicCleanup in route.ts.
    // Applied to both legacy and expansion paths (song_input is always present).
    // repair / quality-check are intentionally NOT performed here.
    let cleanup_quick_idea = {
        let theme = song_input["theme"].as_str().unwrap_or("").trim().to_string();
        let title = song_input["title"].as_str().unwrap_or("").trim().to_string();
        if !theme.is_empty() { theme } else { title }
    };
    let cleaned_lyrics = apply_generate_deterministic_cleanup(&lyrics, &cleanup_quick_idea);

    Ok(Some(serde_json::json!({
        "lyrics": cleaned_lyrics,
        "notes": notes,
    })))
}

// ─── App entry ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![forge_world, alchemy_transform, rewrite_lyrics, generate_lyrics])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
