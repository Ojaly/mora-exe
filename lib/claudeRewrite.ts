import { RewriteMode, SongInput, MoraLine } from "@/types";

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
  moraLines: MoraLine[]
): Promise<ClaudeRewriteResult | null> {
  const moraWarnings = moraLines
    .filter((l) => l.danger === "long")
    .map((l) => l.lineNumber);

  try {
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, lyrics, stylePrompt, songInput, moraWarnings }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
