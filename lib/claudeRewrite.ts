import { RewriteMode, RewriteIntensity, SectionTarget, SongInput, MoraLine } from "@/types";

export interface ClaudeRewriteResult {
  rewrittenLyrics: string;
  rewrittenStylePrompt?: string;
  notes: string;
  changedLines: number[];
}

export async function callClaudeRewrite(
  mode: RewriteMode,
  lyrics: string,
  stylePrompt: string,
  songInput: SongInput,
  moraLines: MoraLine[],
  intensity: RewriteIntensity = "medium",
  sectionTarget: SectionTarget = "all"
): Promise<ClaudeRewriteResult | null> {
  const moraWarnings = moraLines
    .filter((l) => l.danger === "long")
    .map((l) => l.lineNumber);

  try {
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        lyrics,
        stylePrompt,
        songInput,
        moraWarnings,
        intensity,
        sectionTarget,
        worldPreset: songInput.worldPreset || "",
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      console.warn(
        `[mora/rewrite] API returned ${res.status}:`,
        body?.error ?? "(no error message)",
        "→ falling back to rule-based rewrite"
      );
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[mora/rewrite] fetch failed:", err, "→ falling back to rule-based rewrite");
    return null;
  }
}
