export type GenerateLyricsResult = {
  lyrics: string;
  notes?: string;
};

export type GenerateLyricsParams = {
  songInput: Record<string, unknown>;
  expansion?: unknown | null;
  libraryStyleAddition?: string;
  libraryStructureHint?: string;
  libraryMetaTagHint?: string;
  structureOverride?: string;
  isCustomBlueprint?: boolean;

  // EXE-4A: TS側で事前解決済みの値（Tauri invoke 用）
  resolvedStructure?: string;
  worldPresetDeepPrompt?: string;
};

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function callGenerateLyrics(
  params: GenerateLyricsParams
): Promise<GenerateLyricsResult | null> {
  if (isTauri) {
    // EXE / tauri:dev — Rust command 経由で Gemini を呼ぶ
    // generate_lyrics command は EXE-4D で実装予定。未実装時は reject → null → rule-based fallback
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<GenerateLyricsResult | null>("generate_lyrics", {
        songInput: params.songInput,
        expansion: params.expansion ?? null,
        resolvedStructure: params.resolvedStructure ?? "",
        worldPresetDeepPrompt: params.worldPresetDeepPrompt ?? "",
        libraryStyleAddition: params.libraryStyleAddition ?? "",
      });
      // null = GEMINI_API_KEY 未設定 → page.tsx が rule-based fallback へ
      if (!result || !result.lyrics) return null;
      return result;
    } catch (err) {
      console.warn("[mora/generate] tauri invoke failed:", err, "→ rule-based fallback");
      return null;
    }
  }

  // Web / dev server — Next.js API route 経由
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        songInput: params.songInput,
        expansion: params.expansion ?? null,
        libraryStyleAddition: params.libraryStyleAddition,
        libraryStructureHint: params.libraryStructureHint,
        libraryMetaTagHint: params.libraryMetaTagHint,
        structureOverride: params.structureOverride,
        isCustomBlueprint: params.isCustomBlueprint,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      console.warn(
        `[mora/generate] API returned ${res.status}:`,
        body?.error ?? "(no error message)",
        "→ rule-based fallback"
      );
      return null;
    }
    const data = await res.json() as GenerateLyricsResult;
    if (!data.lyrics) return null;
    return data;
  } catch (err) {
    console.warn("[mora/generate] fetch failed:", err, "→ rule-based fallback");
    return null;
  }
}
