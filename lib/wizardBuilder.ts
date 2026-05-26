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

// ─── Prose helper ─────────────────────────────────────────────────────────────

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ─── Quick Mode ───────────────────────────────────────────────────────────────

function buildQuick(answers: WizardAnswers): WizardResult {
  const base       = val(answers, "base");
  const emotion    = val(answers, "emotion");
  const vocal      = val(answers, "vocal");
  const world      = val(answers, "world");
  const impression = val(answers, "impression");

  const sentences: string[] = [];

  // S1: genre + emotion
  const styleParts = [base, emotion].filter(Boolean);
  if (styleParts.length) sentences.push(cap(styleParts.join(", ")) + ".");

  // S2: vocal
  if (vocal) sentences.push(cap(vocal) + ".");

  // S3: world / texture
  if (world) sentences.push(cap(world) + ".");

  // S4: overall vibe
  if (impression) sentences.push(cap(impression) + ".");

  sentences.push("Raw emotion over polish. Avoid generic AI clichés.");

  return {
    prompt: sentences.join(" "),
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

  const sentences: string[] = [];

  // S1: genre + tempo
  const s1Parts = [genre, tempo].filter(Boolean);
  if (s1Parts.length) sentences.push(cap(s1Parts.join(", ")) + ".");

  // S2: vocal (texture + fx)
  const vocalParts = [
    vocalTex,
    vocalFx && !vocalFx.startsWith("dry") ? vocalFx : "",
  ].filter(Boolean);
  if (vocalParts.length) sentences.push(cap(vocalParts.join(", ")) + ".");

  // S3: instruments (lead + density + drums + bass)
  const instrParts = [
    lead,
    instDens,
    drums && !drums.startsWith("beatless") ? drums : "",
    bass && !bass.startsWith("bass-light") ? bass : "",
  ].filter(Boolean);
  if (instrParts.length) sentences.push(cap(instrParts.join(", ")) + ".");

  // S4: production / texture / space
  const texParts = [
    electronic && !electronic.startsWith("fully acoustic") && !electronic.startsWith("clean digital")
      ? electronic : "",
    space,
  ].filter(Boolean);
  if (texParts.length) sentences.push(cap(texParts.join(", ")) + ".");

  // S5: world aesthetic + vibe
  const worldParts = [world, impression].filter(Boolean);
  if (worldParts.length) sentences.push(cap(worldParts.join(", ")) + ".");

  sentences.push("Avoid generic AI clichés, over-polished sheen, muzak blandness.");

  return {
    prompt: sentences.join(" "),
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
