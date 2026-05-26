/**
 * Rule-based WorldExpansion forge — no Claude API required.
 * Used as fallback in both Next.js API route and Tauri desktop (no-key path).
 * Importable from frontend components.
 */
import { WorldExpansion, MusicDirection } from "@/types";
import {
  extractThemeDescriptors,
  extractThemeMotifsForLyrics,
} from "@/lib/themeExtractor";

export function ruleBasedMusicDirection(
  worldSeed: string,
  styleWords: string[],
  motifs: string[]
): MusicDirection {
  let bpmEstimate: number | null = null;
  if (/退廃|obsess|ゆっくり|ritual|melanchol|slow/.test(worldSeed))    bpmEstimate = 72;
  else if (/aggressive|fast|intense|ダンス|高速/.test(worldSeed))       bpmEstimate = 132;
  else if (/ファンク|funk|groove/.test(worldSeed))                      bpmEstimate = 96;
  else if (/ポップ|pop|キャッチ|upbeat/.test(worldSeed))                bpmEstimate = 110;

  let genreHint = "atmospheric experimental";
  if (/退廃|decaden/.test(worldSeed))              genreHint = "decadent slow-burn";
  if (/偏執|obsess/.test(worldSeed))               genreHint = "obsessive minimal";
  if (/ファンク|funk/.test(worldSeed))             genreHint = "uncanny psychedelic funk";
  if (/jazz|ジャズ/.test(worldSeed))               genreHint = "dark jazz";
  if (/neo.soul|ネオソウル/.test(worldSeed))       genreHint = "neo-soul";
  if (/企業|corporate|CM|ビジネス/.test(worldSeed))  genreHint = "uncanny corporate pop";
  if (/民謡|folk/.test(worldSeed))                genreHint = "dark folk";
  if (/electro|シンセ|synth/.test(worldSeed))     genreHint = "cold electronic";
  if (/hip.hop|ヒップホップ/.test(worldSeed))     genreHint = "abstract hip-hop";

  const atParts: string[] = [...styleWords.slice(0, 2)];
  if (motifs[0]) atParts.push(`${motifs[0]}-scented`);
  atParts.push("intimate");
  const atmosphere = [...new Set(atParts)].slice(0, 4).join(", ");

  let tempoFeel = "mid-tempo, deliberate";
  if (bpmEstimate && bpmEstimate <= 80)           tempoFeel = "slow, deliberate";
  else if (bpmEstimate && bpmEstimate >= 120)     tempoFeel = "driven, relentless";
  else if (/ゆっくり|slow|heavy/.test(worldSeed))  tempoFeel = "slow, meditative";

  let vocalStyle = "close-mic, intimate";
  if (/女|female|girl/.test(worldSeed))           vocalStyle = "breathy female, close-mic";
  else if (/男|male|man/.test(worldSeed))         vocalStyle = "dry male, hushed";
  if (/choir|コーラス|合唱/.test(worldSeed))      vocalStyle = "layered choir, ritualistic";

  const isFood    = /うどん|ラーメン|そば|餃子|コーヒー/.test(worldSeed);
  const isFunk    = /ファンク|funk/.test(worldSeed);
  const isAmbient = /ambient|アンビエント|宇宙|space/.test(worldSeed);
  const instruments = isFood    ? ["minimal piano", "sparse brushed percussion", "low bass drone"]
                    : isFunk    ? ["clean electric guitar", "funk bass", "tight snare", "organ"]
                    : isAmbient ? ["sustained synth pads", "subtle field textures", "sparse piano"]
                    :             ["sparse piano", "minimal percussion"];

  return {
    genreHint,
    atmosphere,
    tempoFeel,
    bpmEstimate,
    vocalStyle,
    instruments,
    moodWords: styleWords.slice(0, 5),
    source: "rule",
  };
}

export function ruleBasedForge(worldSeed: string): WorldExpansion {
  const desc   = extractThemeDescriptors(worldSeed);
  const motifs = extractThemeMotifsForLyrics(worldSeed);
  const md     = ruleBasedMusicDirection(worldSeed, desc.styleWords, motifs);

  const primaryMotif = motifs[0] ?? "";

  const scene: string[] = [];
  if (primaryMotif) {
    scene.push(`${primaryMotif}が中心に置かれた薄暗い空間`);
    scene.push(`誰かが${primaryMotif}に向かって祈るように向き合っている`);
  } else {
    scene.push("薄暗く静寂に満ちた空間");
    scene.push("誰かが何かに執着しながら佇んでいる");
  }
  if (desc.styleWords[0]) scene.push(`${desc.styleWords[0]}な光と影が交差する`);

  const emotion = desc.styleWords.length > 0
    ? desc.styleWords.slice(0, 5)
    : ["intense", "focused", "solitary"];

  const texture = primaryMotif
    ? ["intimate", "hushed", "close-mic", "minimal reverb"]
    : ["sparse", "intimate", "focused", "dry"];

  const objects = motifs.slice(0, 7);

  const contradiction: string[] = [];
  const isFood      = /うどん|ラーメン|そば|餃子|コーヒー/.test(worldSeed);
  const isIntense   = /偏執|狂信|退廃|崇拝|執着|狂気/.test(worldSeed);
  const isCorporate = /企業|CM|完璧|ビジネス/.test(worldSeed);
  const isGrotesque = /不気味|怖い|ホラー/.test(worldSeed);

  if (isFood && isIntense) {
    contradiction.push(`日常的な${primaryMotif || "食"}への神聖な執着`);
    contradiction.push("mundane subject ↔ religious intensity");
  } else if (isCorporate && isGrotesque) {
    contradiction.push("完璧な表面 ↔ 不気味な内部");
    contradiction.push("corporate polish ↔ uncanny distortion");
  } else if (md.moodWords.includes("decadent") || md.moodWords.includes("ritualistic")) {
    contradiction.push("崩壊への意志 ↔ 儀式的な秩序");
  }

  const soundDirection = [...new Set([
    ...desc.enMotifs.slice(0, 2),
    ...desc.styleWords.slice(0, 3),
  ])].slice(0, 5);
  if (soundDirection.length === 0) soundDirection.push("minimal", "atmospheric");

  const bpmPart  = md.bpmEstimate ? `, ${md.bpmEstimate} BPM` : "";
  const atmGenre = md.genreHint && md.atmosphere
    ? `${md.genreHint} with ${md.atmosphere}`
    : md.genreHint || md.atmosphere || "";
  const stylePromptDraft = [
    atmGenre + bpmPart + ".",
    md.vocalStyle ? `${md.vocalStyle.charAt(0).toUpperCase() + md.vocalStyle.slice(1)}.` : "",
    md.instruments.length > 0 ? `${md.instruments.join(", ")}.` : "",
    soundDirection.length > 0 ? `${soundDirection.slice(0, 3).join(", ")}.` : "",
    md.moodWords.length > 0  ? `${md.moodWords.slice(0, 4).join(", ")}.` : "",
  ].filter(Boolean).join(" ");

  const lyricsDirection =
    `「${worldSeed}」を中心に` +
    (objects.length > 0
      ? `${objects.slice(0, 3).join("・")}などの具体的なモチーフで世界を構築する`
      : "具体的なイメージで世界を構築する");

  return {
    scene,
    emotion,
    texture,
    objects,
    contradiction,
    soundDirection,
    musicDirection: md,
    stylePromptDraft,
    lyricsDirection,
  };
}
