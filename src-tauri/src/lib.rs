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

// ─── App entry ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![forge_world, alchemy_transform, rewrite_lyrics])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
