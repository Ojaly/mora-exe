/**
 * lib/promptBuilder12.ts
 * Phase 1A — 12-Step Prompt Builder: core generation logic.
 *
 * No UI, no localStorage, no ambiguous-word translation.
 * Input:  PromptBuilder12State (12 steps, each with selected option + custom text)
 * Output: English Style Prompt ≤800 chars + charCount
 */

import type {
  PromptBuilderStep,
  PromptBuilder12State,
  PromptBuildResult,
  BuilderPreset,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAR_LIMIT = 800;

/**
 * Natural prose order for the final Style Prompt.
 * Genre always leads; instruments cluster before vocal; atmosphere closes.
 */
const OUTPUT_ORDER: readonly string[] = [
  "genre-foundation",     // 1  heavy — always first
  "genre-density",        // 3  light
  "tempo-feel",           // 2  medium
  "lead-instrument",      // 7  heavy
  "drum-direction",       // 8  heavy
  "bass-direction",       // 9  medium
  "electronic-treatment", // 6  light
  "vocal-texture",        // 4  heavy
  "vocal-processing",     // 5  medium
  "space-treatment",      // 10 medium
  "world-atmosphere",     // 11 heavy
  "final-impression",     // 12 medium
];

/**
 * Steps removed first when over budget.
 * Light steps → medium steps. Heavy steps are never trimmed automatically.
 */
const TRIM_PRIORITY: readonly string[] = [
  "genre-density",        // light
  "electronic-treatment", // light
  "final-impression",     // medium
  "space-treatment",      // medium
  "vocal-processing",     // medium
  "tempo-feel",           // medium
  "bass-direction",       // medium
];

// ─── Step Definitions ─────────────────────────────────────────────────────────

/**
 * Canonical 12-step definitions with default (empty) state.
 * Clone with createInitialState() before use — do not mutate this array.
 */
export const DEFAULT_STEPS: PromptBuilderStep[] = [
  // ── 1. Genre Foundation ────────────────────────────────────────────────────
  // Options describe genre approach/density.
  // Custom carries the actual genre name (micro-genre, free text, etc.).
  {
    id: "genre-foundation",
    label: "Genre Foundation",
    labelJa: "ジャンルの核",
    weight: "heavy",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "ジャンルど真ん中",
        promptFrag: "genre-definitive, style-consistent production",
      },
      {
        value: "b",
        label: "ジャンルベース+混合",
        promptFrag: "genre-rooted, cross-genre hybrid production",
      },
      {
        value: "c",
        label: "ジャンル参照・独自解釈",
        promptFrag: "genre-inspired, idiosyncratic interpretation",
      },
    ],
  },

  // ── 2. Tempo Feel ──────────────────────────────────────────────────────────
  {
    id: "tempo-feel",
    label: "Tempo Feel",
    labelJa: "テンポ感",
    weight: "medium",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "スロー・重い",
        promptFrag: "slow, heavy pulse, deliberate pace",
      },
      {
        value: "b",
        label: "ミッドテンポ",
        promptFrag: "mid-tempo, steady groove",
      },
      {
        value: "c",
        label: "アップテンポ・疾走感",
        promptFrag: "upbeat, driving energy, kinetic pulse",
      },
    ],
  },

  // ── 3. Genre Density ───────────────────────────────────────────────────────
  {
    id: "genre-density",
    label: "Genre Density",
    labelJa: "ジャンル密度",
    weight: "light",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "純粋・ジャンル色強め",
        promptFrag: "pure genre focus, no dilution",
      },
      {
        value: "b",
        label: "バランス型",
        promptFrag: "balanced genre and texture blend",
      },
      {
        value: "c",
        label: "ジャンル色薄め・質感重視",
        promptFrag: "texture-first, genre as backdrop",
      },
    ],
  },

  // ── 4. Vocal Texture ───────────────────────────────────────────────────────
  {
    id: "vocal-texture",
    label: "Vocal Texture",
    labelJa: "声の質感",
    weight: "heavy",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "クリア・芯あり",
        promptFrag: "clear, forward vocal presence",
      },
      {
        value: "b",
        label: "ブレシー・柔らかい",
        promptFrag: "breathy, intimate, soft-edged vocal",
      },
      {
        value: "c",
        label: "ロー・粗い",
        promptFrag: "raw, gritty, unpolished vocal delivery",
      },
    ],
  },

  // ── 5. Vocal Processing ────────────────────────────────────────────────────
  {
    id: "vocal-processing",
    label: "Vocal Processing",
    labelJa: "ボーカルエフェクト",
    weight: "medium",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "ドライ・ナチュラル",
        promptFrag: "dry vocal, minimal processing",
      },
      {
        value: "b",
        label: "軽いリバーブ・空間感",
        promptFrag: "light reverb, subtle room ambience",
      },
      {
        value: "c",
        label: "エフェクト強め",
        promptFrag: "heavy vocal processing, effect-forward",
      },
    ],
  },

  // ── 6. Electronic Treatment ────────────────────────────────────────────────
  {
    id: "electronic-treatment",
    label: "Electronic Treatment",
    labelJa: "電子処理の量",
    weight: "light",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "オーガニック・アナログ重視",
        promptFrag: "organic, analog-forward production",
      },
      {
        value: "b",
        label: "電子処理・中程度",
        promptFrag: "moderate synthesis, controlled electronic fx",
      },
      {
        value: "c",
        label: "フルデジタル・合成主体",
        promptFrag: "fully electronic, synthesis-dominant",
      },
    ],
  },

  // ── 7. Lead Instrument ─────────────────────────────────────────────────────
  {
    id: "lead-instrument",
    label: "Lead Instrument",
    labelJa: "メイン楽器",
    weight: "heavy",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "鍵盤系",
        promptFrag: "keys-led: piano, Rhodes, or synth lead",
      },
      {
        value: "b",
        label: "ギター系",
        promptFrag: "guitar-led: electric or rhythm guitar",
      },
      {
        value: "c",
        label: "管楽器・弦楽器系",
        promptFrag: "horn or string-led: sax, brass, or strings",
      },
    ],
  },

  // ── 8. Drum Direction ──────────────────────────────────────────────────────
  {
    id: "drum-direction",
    label: "Drum Direction",
    labelJa: "ドラムの性格",
    weight: "heavy",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "ライブ感・有機的",
        promptFrag: "live drum feel, natural swing and dynamics",
      },
      {
        value: "b",
        label: "ドラムマシン・タイト",
        promptFrag: "drum machine, tight and quantized",
      },
      {
        value: "c",
        label: "重い・スローグルーヴ",
        promptFrag: "heavy groove, pushed-back pocket feel",
      },
    ],
  },

  // ── 9. Bass Direction ──────────────────────────────────────────────────────
  {
    id: "bass-direction",
    label: "Bass Direction",
    labelJa: "ベースの性格",
    weight: "medium",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "メロディアス・フィル多め",
        promptFrag: "melodic bass with active fills",
      },
      {
        value: "b",
        label: "リズム重視・グルーヴ感",
        promptFrag: "rhythmic bass, groove-anchoring pulse",
      },
      {
        value: "c",
        label: "ディープ・サブベース",
        promptFrag: "deep sub bass, low-end dominant",
      },
    ],
  },

  // ── 10. Space Treatment ────────────────────────────────────────────────────
  {
    id: "space-treatment",
    label: "Space Treatment",
    labelJa: "空間処理・残響",
    weight: "medium",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "ドライ・クローズ",
        promptFrag: "dry, intimate, close-mic feel",
      },
      {
        value: "b",
        label: "中程度の残響",
        promptFrag: "moderate reverb, balanced spatial depth",
      },
      {
        value: "c",
        label: "ワイド・ホール感",
        promptFrag: "wide stereo, expansive hall reverb",
      },
    ],
  },

  // ── 11. World / Atmosphere ─────────────────────────────────────────────────
  {
    id: "world-atmosphere",
    label: "World / Atmosphere",
    labelJa: "世界観・情緒",
    weight: "heavy",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "明るい・開放的",
        promptFrag: "bright, open, uplifting atmosphere",
      },
      {
        value: "b",
        label: "暗い・緊張感",
        promptFrag: "dark, brooding, tense atmosphere",
      },
      {
        value: "c",
        label: "夢幻・浮遊感",
        promptFrag: "dreamy, hazy, floating atmosphere",
      },
    ],
  },

  // ── 12. Final Impression ───────────────────────────────────────────────────
  {
    id: "final-impression",
    label: "Final Impression",
    labelJa: "最終印象",
    weight: "medium",
    selected: null,
    custom: "",
    options: [
      {
        value: "a",
        label: "スムーズ・洗練",
        promptFrag: "smooth, polished, sophisticated finish",
      },
      {
        value: "b",
        label: "エッジ・生々しさ",
        promptFrag: "edgy, raw, visceral energy",
      },
      {
        value: "c",
        label: "シネマティック・壮大",
        promptFrag: "cinematic, dramatic, grand",
      },
    ],
  },
];

// ─── Fragment Resolvers ───────────────────────────────────────────────────────

/**
 * Step 1 special resolver.
 * Custom = the actual genre name (e.g. "Corporate Electro Funk").
 * Option = approach/density modifier (e.g. "genre-definitive production").
 * When both are present: "Corporate Electro Funk, genre-definitive production"
 */
export function resolveGenreFoundation(step: PromptBuilderStep): string {
  const option = step.options.find((o) => o.value === step.selected);

  if (step.custom && option) {
    return `${step.custom}, ${option.promptFrag}`;
  }
  if (step.custom) {
    return step.custom;
  }
  if (option) {
    return option.promptFrag;
  }
  return "";
}

/**
 * General resolver for Steps 2–12.
 * When both custom and option are present: custom leads, option supplements.
 * e.g. custom="LinnDrum" + option B → "LinnDrum, drum machine, tight and quantized"
 */
export function resolveStepFragment(step: PromptBuilderStep): string {
  if (step.id === "genre-foundation") {
    return resolveGenreFoundation(step);
  }

  const option = step.options.find((o) => o.value === step.selected);

  if (step.custom && option) {
    return `${step.custom}, ${option.promptFrag}`;
  }
  if (step.custom) {
    return step.custom;
  }
  if (option) {
    return option.promptFrag;
  }
  return "";
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

/**
 * Builds a Suno-ready English Style Prompt from a PromptBuilder12State.
 * - Output order follows OUTPUT_ORDER (genre → tempo → instruments → vocal → space → atmosphere).
 * - If over 800 chars, light steps are trimmed first, then medium steps.
 * - Heavy steps (genre, lead instrument, drums, vocal texture, atmosphere) are never auto-trimmed.
 * - Returns { prompt, charCount }.
 */
export function buildStylePromptFrom12Steps(
  state: PromptBuilder12State
): PromptBuildResult {
  // 1. Resolve each step to a fragment string (skip empty/unanswered steps)
  const fragMap = new Map<string, string>();
  for (const step of state.steps) {
    const frag = resolveStepFragment(step);
    if (frag) fragMap.set(step.id, frag);
  }

  if (fragMap.size === 0) {
    return { prompt: "", charCount: 0 };
  }

  // 2. Build in natural output order, keeping only resolved steps
  const ordered = OUTPUT_ORDER.filter((id) => fragMap.has(id));

  const join = (ids: readonly string[]): string =>
    ids.map((id) => fragMap.get(id)!).join(", ");

  const candidate = join(ordered);
  if (candidate.length <= CHAR_LIMIT) {
    return { prompt: candidate, charCount: candidate.length };
  }

  // 3. Over budget — trim by priority (light first, then medium)
  const remaining = new Set(ordered);
  for (const trimId of TRIM_PRIORITY) {
    if (remaining.size <= 1) break; // always keep at least one fragment
    if (!remaining.has(trimId)) continue;
    remaining.delete(trimId);
    const attempt = join(OUTPUT_ORDER.filter((id) => remaining.has(id)));
    if (attempt.length <= CHAR_LIMIT) {
      return { prompt: attempt, charCount: attempt.length };
    }
  }

  // 4. Last resort: hard-cut remaining at CHAR_LIMIT
  const best = join(OUTPUT_ORDER.filter((id) => remaining.has(id)));
  const cut = best.slice(0, CHAR_LIMIT - 3) + "...";
  return { prompt: cut, charCount: cut.length };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the character count of the generated prompt. */
export function countStylePromptChars(state: PromptBuilder12State): number {
  return buildStylePromptFrom12Steps(state).charCount;
}

/**
 * Returns a fresh PromptBuilder12State with all steps at default (empty) values.
 * Always clone DEFAULT_STEPS — never mutate the exported constant.
 */
export function createInitialState(): PromptBuilder12State {
  return { steps: DEFAULT_STEPS.map((s) => ({ ...s, options: s.options })) };
}

// ─── Sample State (Corporate Electro Funk) ───────────────────────────────────

/**
 * A fully-filled sample state for manual verification and unit tests.
 * Represents: Corporate Electro Funk, mid-tempo, LinnDrum, Roland Juno-106,
 *             synth slap bass, obsessive corporate atmosphere.
 */
export function makeSampleState(): PromptBuilder12State {
  const state = createInitialState();

  const set = (id: string, selected: string | null, custom: string) => {
    const step = state.steps.find((s) => s.id === id);
    if (step) {
      step.selected = selected;
      step.custom = custom;
    }
  };

  // 1  Genre Foundation: "Corporate Electro Funk" + genre-definitive approach
  set("genre-foundation",     "a",  "Corporate Electro Funk");
  // 2  Tempo: mid-tempo
  set("tempo-feel",           "b",  "");
  // 3  Genre Density: pure genre focus
  set("genre-density",        "a",  "");
  // 4  Vocal Texture: clear, forward
  set("vocal-texture",        "a",  "");
  // 5  Vocal Processing: light reverb
  set("vocal-processing",     "b",  "");
  // 6  Electronic Treatment: moderate synthesis
  set("electronic-treatment", "b",  "");
  // 7  Lead Instrument: Roland Juno-106 (custom only)
  set("lead-instrument",      null, "Roland Juno-106");
  // 8  Drum Direction: LinnDrum (custom) + drum machine option
  set("drum-direction",       "b",  "LinnDrum");
  // 9  Bass Direction: synth slap bass (custom only)
  set("bass-direction",       null, "synth slap bass");
  // 10 Space Treatment: dry and intimate
  set("space-treatment",      "a",  "");
  // 11 World / Atmosphere: obsessive precision (custom) + dark/tense option
  set("world-atmosphere",     "b",  "obsessive corporate precision");
  // 12 Final Impression: custom feel
  set("final-impression",     null, "feels like a boardroom dance floor");

  return state;
}

// ─── Preset Loader ────────────────────────────────────────────────────────────

/**
 * Builds a PromptBuilder12State from a BuilderPreset.
 * Always starts from createInitialState() so step definitions come from
 * DEFAULT_STEPS — stored selected/custom values are overlaid on top.
 * Unknown step IDs are silently ignored; unknown option values are reset to null.
 */
export function loadPresetState(preset: BuilderPreset): PromptBuilder12State {
  const map = new Map(preset.steps.map((s) => [s.id, s]));
  return {
    steps: createInitialState().steps.map((step) => {
      const stored = map.get(step.id);
      if (!stored) return step;
      const validSelected =
        stored.selected === null ||
        step.options.some((o) => o.value === stored.selected)
          ? stored.selected
          : null;
      return {
        ...step,
        selected: validSelected,
        custom: typeof stored.custom === "string" ? stored.custom : "",
      };
    }),
  };
}

// ─── Built-in Presets ─────────────────────────────────────────────────────────

// ─── Builder-derived Negative Prompt ─────────────────────────────────────────

/**
 * Negative fragments keyed by genre-foundation custom text (case-insensitive trim).
 * These capture what Suno tends to do wrong for each known micro-genre.
 */
const BUILDER_GENRE_NEGATIVES: Record<string, string> = {
  "corporate electro funk":    "generic EDM drop, corporate jingle feel, over-produced brightness, gratuitous wah guitar",
  "digital motown disco soul": "trap hi-hat spam, aggressive EDM drop, heavy guitar distortion, sterile digital production",
  "danceable electro waltz":   "four-on-the-floor kick pattern, 4/4 straight-time groove, generic EDM drop, 3/4 meter loss",
  "dark electro swing":        "cheesy Halloween kitsch, Disney villain cliché, sterile modern production, generic swing revival",
  "electro gospel irony":      "sincere praise-and-worship anthem, unironic devotional gospel, sermon piety, inspirational earnestness",
};

/**
 * Derives negative prompt fragments from the current PromptBuilder12State.
 * Targets what Suno tends to get wrong given the selected genre and production choices.
 * Returns [] when no steps are selected.
 */
export function buildNegativeFragmentsFromBuilderState(
  state: PromptBuilder12State
): string[] {
  const frags: string[] = [];
  const step = (id: string) => state.steps.find((s) => s.id === id);

  // Step 1: genre-specific negatives (keyed by custom text)
  const genreStep = step("genre-foundation");
  if (genreStep?.custom) {
    const neg = BUILDER_GENRE_NEGATIVES[genreStep.custom.trim().toLowerCase()];
    if (neg) frags.push(neg);
  }

  // Step 4: Vocal Texture — avoid the opposite direction
  const vocal = step("vocal-texture");
  if (vocal?.selected === "a") frags.push("muddy mix, buried vocals");
  if (vocal?.selected === "b") frags.push("harsh vocal compression, over-pushed presence");
  if (vocal?.selected === "c") frags.push("AutoTune gloss, over-processed vocal sheen");

  // Step 5: Vocal Processing
  const vocalFx = step("vocal-processing");
  if (vocalFx?.selected === "a") frags.push("excessive reverb, wet vocal processing");
  if (vocalFx?.selected === "c") frags.push("dry clinical vocal, zero spatial depth");

  // Step 6: Electronic Treatment
  const elec = step("electronic-treatment");
  if (elec?.selected === "a") frags.push("digital harshness, synthetic gloss");
  if (elec?.selected === "c") frags.push("acoustic bleed, live room looseness");

  // Step 8: Drum Direction
  const drums = step("drum-direction");
  if (drums?.selected === "a") frags.push("rigid drum machine feel, mechanical timing");
  if (drums?.selected === "b") frags.push("sloppy live drumming, loose timing, room bleed");
  if (drums?.selected === "c") frags.push("busy drum fills, rushing energy, over-tight snare");

  // Step 11: World / Atmosphere
  const atmo = step("world-atmosphere");
  if (atmo?.selected === "a") frags.push("dark brooding texture, claustrophobic sound");
  if (atmo?.selected === "b") frags.push("cheerful pop energy, saccharine warmth, feel-good brightness");
  if (atmo?.selected === "c") frags.push("harsh clarity, hard attack, over-present transients");

  // Step 12: Final Impression
  const finale = step("final-impression");
  if (finale?.selected === "a") frags.push("rough unfinished edges, bedroom production quality");
  if (finale?.selected === "b") frags.push("over-polished radio-friendly sheen, smooth adult contemporary finish");
  if (finale?.selected === "c") frags.push("small-scale intimate production, bedroom lo-fi aesthetic");

  return frags;
}

// ─── Built-in Presets ─────────────────────────────────────────────────────────

export const BUILT_IN_PRESETS: BuilderPreset[] = [
  {
    id: "corp-electro-funk",
    name: "Corporate Electro Funk",
    builtIn: true,
    steps: [
      { id: "genre-foundation",     selected: "a",  custom: "Corporate Electro Funk" },
      { id: "tempo-feel",           selected: "b",  custom: "" },
      { id: "genre-density",        selected: "a",  custom: "" },
      { id: "vocal-texture",        selected: "a",  custom: "" },
      { id: "vocal-processing",     selected: "b",  custom: "" },
      { id: "electronic-treatment", selected: "b",  custom: "" },
      { id: "lead-instrument",      selected: null, custom: "Roland Juno-106" },
      { id: "drum-direction",       selected: "b",  custom: "LinnDrum" },
      { id: "bass-direction",       selected: null, custom: "synth slap bass" },
      { id: "space-treatment",      selected: "a",  custom: "" },
      { id: "world-atmosphere",     selected: "b",  custom: "obsessive corporate precision" },
      { id: "final-impression",     selected: null, custom: "feels like a boardroom dance floor" },
    ],
  },
  {
    id: "digital-motown-disco-soul",
    name: "Digital Motown Disco Soul",
    builtIn: true,
    steps: [
      { id: "genre-foundation",     selected: "a",  custom: "Digital Motown Disco Soul" },
      { id: "tempo-feel",           selected: "b",  custom: "" },
      { id: "genre-density",        selected: "a",  custom: "" },
      { id: "vocal-texture",        selected: "a",  custom: "" },
      { id: "vocal-processing",     selected: "b",  custom: "" },
      { id: "electronic-treatment", selected: "b",  custom: "" },
      { id: "lead-instrument",      selected: "a",  custom: "Rhodes, Fender Rhodes" },
      { id: "drum-direction",       selected: "a",  custom: "live disco drums, four-on-the-floor" },
      { id: "bass-direction",       selected: "a",  custom: "walking bass, groovy fills" },
      { id: "space-treatment",      selected: "b",  custom: "" },
      { id: "world-atmosphere",     selected: "a",  custom: "soul dancefloor warmth" },
      { id: "final-impression",     selected: "a",  custom: "" },
    ],
  },
  {
    id: "danceable-electro-waltz",
    name: "Danceable Electro Waltz",
    builtIn: true,
    steps: [
      { id: "genre-foundation",     selected: "b",  custom: "Danceable Electro Waltz" },
      { id: "tempo-feel",           selected: "b",  custom: "" },
      { id: "genre-density",        selected: "b",  custom: "" },
      { id: "vocal-texture",        selected: "b",  custom: "" },
      { id: "vocal-processing",     selected: "b",  custom: "" },
      { id: "electronic-treatment", selected: "b",  custom: "" },
      { id: "lead-instrument",      selected: "a",  custom: "harpsichord, synth strings" },
      { id: "drum-direction",       selected: "b",  custom: "electronic waltz pattern, 3/4 feel" },
      { id: "bass-direction",       selected: "a",  custom: "staccato synth bass" },
      { id: "space-treatment",      selected: "c",  custom: "" },
      { id: "world-atmosphere",     selected: "c",  custom: "elegant dystopian ballroom" },
      { id: "final-impression",     selected: "c",  custom: "" },
    ],
  },
  {
    id: "dark-electro-swing",
    name: "Dark Electro Swing",
    builtIn: true,
    steps: [
      { id: "genre-foundation",     selected: "a",  custom: "Dark Electro Swing" },
      { id: "tempo-feel",           selected: "b",  custom: "swinging groove, jazz-inflected" },
      { id: "genre-density",        selected: "a",  custom: "" },
      { id: "vocal-texture",        selected: "c",  custom: "" },
      { id: "vocal-processing",     selected: "c",  custom: "vintage crackle, phonograph warmth" },
      { id: "electronic-treatment", selected: "b",  custom: "" },
      { id: "lead-instrument",      selected: "c",  custom: "muted trumpet, clarinet" },
      { id: "drum-direction",       selected: "b",  custom: "electro swing kick, shuffled snare" },
      { id: "bass-direction",       selected: "a",  custom: "walking double bass" },
      { id: "space-treatment",      selected: "a",  custom: "intimate speakeasy room" },
      { id: "world-atmosphere",     selected: "b",  custom: "smoky underground cabaret" },
      { id: "final-impression",     selected: "b",  custom: "" },
    ],
  },
  {
    id: "electro-gospel-irony",
    name: "Electro Gospel Irony",
    builtIn: true,
    steps: [
      { id: "genre-foundation",     selected: "c",  custom: "Electro Gospel Irony" },
      { id: "tempo-feel",           selected: "c",  custom: "driving, anthemic pulse" },
      { id: "genre-density",        selected: "b",  custom: "" },
      { id: "vocal-texture",        selected: "a",  custom: "gospel choir harmonics" },
      { id: "vocal-processing",     selected: "c",  custom: "massive reverb, cathedral space" },
      { id: "electronic-treatment", selected: "c",  custom: "" },
      { id: "lead-instrument",      selected: "a",  custom: "Hammond organ, synth stabs" },
      { id: "drum-direction",       selected: "b",  custom: "glitchy gospel rhythm" },
      { id: "bass-direction",       selected: "c",  custom: "" },
      { id: "space-treatment",      selected: "c",  custom: "" },
      { id: "world-atmosphere",     selected: "a",  custom: "ironic euphoria, hollow triumph" },
      { id: "final-impression",     selected: "c",  custom: "" },
    ],
  },
];
