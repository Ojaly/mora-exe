import { WizardMode } from "@/lib/wizardData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardAnswerEntry {
  chip?: string;
  free?: string;
}

export type WizardAnswers = Record<string, WizardAnswerEntry>;

export interface WizardResult {
  prompt: string;
  negative: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function val(answers: WizardAnswers, key: string): string {
  const a = answers[key];
  if (!a) return "";
  // Free text overrides chip when non-empty
  return a.free?.trim() || a.chip || "";
}

// ─── Quick Mode ───────────────────────────────────────────────────────────────

function buildQuick(answers: WizardAnswers): WizardResult {
  const base       = val(answers, "base");
  const emotion    = val(answers, "emotion");
  const vocal      = val(answers, "vocal");
  const world      = val(answers, "world");
  const impression = val(answers, "impression");

  const lines: string[] = [];

  const styleParts = [base, emotion].filter(Boolean);
  if (styleParts.length) lines.push(`[Style:] ${styleParts.join(", ")}`);
  if (vocal)             lines.push(`[Vocal:] ${vocal}`);
  if (world)             lines.push(`[World Aesthetic:] ${world}`);
  if (impression)        lines.push(`[Vibe:] ${impression}`);
  lines.push(`[Note:] raw emotion over polish — unexpected imagery, avoid AI clichés`);

  return {
    prompt: lines.join("\n"),
    negative:
      "generic vocal phrases, over-polished production, predictable chord progressions, muzak blandness",
  };
}

// ─── Deep Mode ────────────────────────────────────────────────────────────────

function buildDeep(answers: WizardAnswers): WizardResult {
  const genre      = val(answers, "genre");
  const tempo      = val(answers, "tempo");
  const instDens   = val(answers, "instrumentation");
  const vocalTex   = val(answers, "vocal_texture");
  const vocalFx    = val(answers, "vocal_fx");
  const electronic = val(answers, "electronic");
  const lead       = val(answers, "lead_instrument");
  const drums      = val(answers, "drums");
  const bass       = val(answers, "bass");
  const space      = val(answers, "space");
  const world      = val(answers, "world");
  const impression = val(answers, "impression");

  const lines: string[] = [];

  if (genre) lines.push(`[Style:] ${genre}`);
  if (tempo) lines.push(`[Tempo:] ${tempo}`);

  // Instruments: lead + density descriptor + drums
  const instrParts = [
    lead,
    instDens,
    drums && !drums.startsWith("beatless") ? drums : "",
  ].filter(Boolean);
  if (instrParts.length) lines.push(`[Instruments:] ${instrParts.join("; ")}`);

  // Bass (only if non-trivial)
  if (bass && !bass.startsWith("bass-light")) lines.push(`[Bass:] ${bass}`);

  // Vocal: texture + FX
  const vocalParts = [
    vocalTex,
    vocalFx && !vocalFx.startsWith("dry") ? vocalFx : "",
  ].filter(Boolean);
  if (vocalParts.length) lines.push(`[Vocal:] ${vocalParts.join(", ")}`);

  // Production / electronic treatment (skip neutral values)
  if (
    electronic &&
    !electronic.startsWith("fully acoustic") &&
    !electronic.startsWith("clean digital")
  ) {
    lines.push(`[Production:] ${electronic}`);
  }

  if (space)      lines.push(`[Texture:] ${space}`);
  if (world)      lines.push(`[World Aesthetic:] ${world}`);
  if (impression) lines.push(`[Vibe:] ${impression}`);

  lines.push(
    `[Note:] atmosphere and world-building over technical correctness — avoid AI clichés`
  );

  return {
    prompt: lines.join("\n"),
    negative:
      "generic AI vocal tropes, muzak blandness, over-explained production, predictable progressions",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildWizardPrompt(
  mode: WizardMode,
  answers: WizardAnswers
): WizardResult {
  return mode === "quick" ? buildQuick(answers) : buildDeep(answers);
}
