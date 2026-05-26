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

// ─── App entry ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![forge_world])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
