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
  Example: "Decadent downtempo neo-soul with humid fluorescent loneliness, 72 BPM. Hushed male vocal, close-mic. Sparse piano, low bass drone, brushed percussion. Intimate, ritualistic, obsessive comfort-seeking."
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
    "bpmEstimate": 72,
    "vocalStyle": "specific vocal texture + mic treatment (EN)",
    "instruments": ["2-4 instruments"],
    "moodWords": ["3-5 mood words (EN)"]
  },
  "stylePromptDraft": "one prose paragraph, no bracket tags — Suno-ready style prompt",
  "lyricsDirection": "JP: one sentence on how lyrics should approach this world"
}"#;

// ─── forge_world command ──────────────────────────────────────────────────────

/// Call Claude API to expand a world seed into a WorldExpansion object.
/// Returns Ok(Some(expansion)) on success.
/// Returns Ok(None) when ANTHROPIC_API_KEY is not set — frontend uses rule-based fallback.
/// Returns Err(msg) on API or parse failure — frontend uses rule-based fallback.
#[tauri::command]
async fn forge_world(world_seed: String) -> Result<Option<Value>, String> {
    // Read API key from environment — never exposed to frontend
    let api_key = match std::env::var("ANTHROPIC_API_KEY") {
        Ok(k) if !k.trim().is_empty() => k,
        _ => return Ok(None), // no key → signal frontend to use rule-based
    };

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("HTTP client build error: {}", e))?;

    let body = serde_json::json!({
        "model": "claude-sonnet-4-6",
        "max_tokens": 1400,
        "system": FORGE_SYSTEM_PROMPT,
        "messages": [{
            "role": "user",
            "content": format!("World Seed: \"{}\"\n\nExpand this world. Return JSON only.", world_seed)
        }]
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Anthropic API error {}: {}", status, text));
    }

    let resp_json: Value = response
        .json()
        .await
        .map_err(|e| format!("Response parse error: {}", e))?;

    let text = resp_json["content"][0]["text"]
        .as_str()
        .ok_or_else(|| "No text field in API response".to_string())?;

    // Strip markdown code fences if present
    let raw = text
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let mut expansion: Value =
        serde_json::from_str(raw).map_err(|e| format!("JSON parse error: {}", e))?;

    // Ensure musicDirection.source = "claude"
    if let Some(md) = expansion.get_mut("musicDirection") {
        if let Some(obj) = md.as_object_mut() {
            obj.insert("source".to_string(), Value::String("claude".to_string()));
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

// ─── App entry ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![forge_world, alchemy_transform])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
