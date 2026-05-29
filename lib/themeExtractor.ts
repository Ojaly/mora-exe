// ─── Style atmosphere patterns ───────────────────────────────────────────────
// Maps JP/EN patterns in the Quick Idea to Suno-friendly style descriptors

const STYLE_PATTERN_MAP: Array<[RegExp, string[]]> = [
  [/退廃/,                        ["decadent"]],
  [/偏執/,                        ["obsessive", "fixated"]],
  [/狂信|信仰.*狂|狂.*信|カルト/, ["fanatical", "cult-like", "ritualistic"]],
  [/執着/,                        ["obsessive", "fixated"]],
  [/孤独|孤立/,                   ["solitary", "isolated"]],
  [/狂気|狂った/,                  ["unhinged", "deranged"]],
  [/悲劇|悲しみ/,                  ["tragic"]],
  [/憎悪|憎しみ/,                  ["hateful", "bitter"]],
  [/執念/,                        ["relentless", "tenacious"]],
  [/儚|はかな/,                    ["ephemeral", "fleeting"]],
  [/偏愛|愛.*狂|狂.*愛/,          ["obsessive love", "devotion"]],
  [/崇拝/,                        ["worshipful"]],
  [/呪い/,                        ["cursed", "haunted"]],
  [/陶酔|恍惚/,                   ["intoxicated", "ecstatic"]],
  [/絶望/,                        ["despairing"]],
  [/孤高/,                        ["solitary", "aloof"]],
  [/absurd|滑稽|おかし/,          ["absurdist"]],
  [/祈り|祈る/,                   ["prayerful", "ritualistic"]],
  [/宗教|神/,                     ["spiritual", "devotional"]],
  [/obsess/i,                     ["obsessive"]],
  [/decaden/i,                    ["decadent"]],
  [/fanatic|cult/i,               ["fanatical", "ritualistic"]],
  [/dark|darkness/i,              ["dark", "brooding"]],
  [/melanchol/i,                  ["melancholic"]],
];

// ─── Concrete motif table ─────────────────────────────────────────────────────
// [pattern, primary_jp_word, en_style_hint, jp_expansion_words]

type MotifEntry = [RegExp, string, string, string[]];

const MOTIF_TABLE: MotifEntry[] = [
  [/うどん/,
    "うどん",
    "udon noodles, absurd food devotion, noodle ritual",
    ["うどん", "麺", "だし", "丼", "湯気", "小麦", "器"]],
  [/ラーメン/,
    "ラーメン",
    "ramen, noodle obsession, broth ritual",
    ["ラーメン", "麺", "スープ", "丼", "湯気", "チャーシュー", "器"]],
  [/そば/,
    "そば",
    "soba, noodle ritual",
    ["そば", "麺", "出汁", "器", "湯気", "水"]],
  [/寿司|すし/,
    "寿司",
    "sushi, seafood ritual",
    ["寿司", "酢飯", "ネタ", "海", "包丁", "器"]],
  [/餃子/,
    "餃子",
    "gyoza, dumpling ritual",
    ["餃子", "皮", "餡", "油", "煙", "熱"]],
  [/カレー/,
    "カレー",
    "curry, spice devotion",
    ["カレー", "スパイス", "香り", "皿", "湯気", "熱"]],
  [/酒|日本酒/,
    "酒",
    "sake, intoxication ritual",
    ["酒", "瓶", "杯", "酔い", "香り", "濁り"]],
  [/ビール/,
    "ビール",
    "beer, foam ritual",
    ["ビール", "泡", "杯", "苦味", "喉", "冷気"]],
  [/コーヒー/,
    "コーヒー",
    "coffee, bitter morning ritual",
    ["コーヒー", "香り", "苦味", "湯気", "カップ", "黒"]],
  [/タバコ|煙草/,
    "煙草",
    "cigarette smoke, exhale",
    ["煙草", "煙", "灰", "火", "息", "指"]],
  [/花|桜/,
    "花",
    "blossoms, petals, fleeting beauty",
    ["花", "香り", "花びら", "枝", "根", "土"]],
  [/海|波/,
    "海",
    "the sea, waves, depths",
    ["海", "波", "塩", "深み", "岸", "水平線"]],
  [/雨/,
    "雨",
    "rain, downpour",
    ["雨", "雨粒", "水音", "濡れた道", "傘", "しずく"]],
  [/夜|闇/,
    "夜",
    "the night, darkness",
    ["夜", "闇", "月", "影", "静寂", "星"]],
  [/血/,
    "血",
    "blood, wounds",
    ["血", "傷", "赤", "脈", "痛み", "しずく"]],
  [/火|炎/,
    "炎",
    "fire, burning",
    ["炎", "燃え", "灰", "煙", "熱", "赤"]],
  [/星|宇宙/,
    "星",
    "stars, cosmos",
    ["星", "宇宙", "銀河", "闇", "光", "塵"]],
  [/鏡/,
    "鏡",
    "mirrors, reflection, distortion",
    ["鏡", "反射", "像", "歪み", "ガラス", "影"]],
  [/砂漠/,
    "砂漠",
    "desert, arid wasteland",
    ["砂漠", "砂", "熱", "乾き", "地平線", "静寂"]],
  [/時計/,
    "時計",
    "clocks, passing time",
    ["時計", "針", "秒", "音", "止まった", "時間"]],
];

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ThemeDescriptors {
  /** English style adjectives for Suno [Style:] / [Concept:] lines */
  styleWords: string[];
  /** Short English motif hints for [Concept:] line */
  enMotifs: string[];
  /** Primary Japanese motif nouns */
  jMotifs: string[];
}

// ─── Extraction functions ─────────────────────────────────────────────────────

export function extractThemeDescriptors(theme: string): ThemeDescriptors {
  const styleSet = new Set<string>();
  const enMotifSet = new Set<string>();
  const jMotifs: string[] = [];

  for (const [re, words] of STYLE_PATTERN_MAP) {
    if (re.test(theme)) {
      words.forEach((w) => styleSet.add(w));
    }
  }

  for (const [re, jp, en] of MOTIF_TABLE) {
    if (re.test(theme)) {
      jMotifs.push(jp);
      en.split(", ").forEach((w) => enMotifSet.add(w));
    }
  }

  return {
    styleWords: [...styleSet],
    enMotifs: [...enMotifSet],
    jMotifs,
  };
}

/**
 * Returns an expanded list of Japanese motif words for use in rule-based lyrics.
 * Prefers expansion sets; falls back to extracting the first recognizable noun.
 */
export function extractThemeMotifsForLyrics(theme: string): string[] {
  const motifs: string[] = [];

  for (const [re, , , expansions] of MOTIF_TABLE) {
    if (re.test(theme)) {
      motifs.push(...expansions);
    }
  }

  // Fallback: extract first substantial word from the raw theme text
  if (motifs.length === 0) {
    const skip = new Set(["する", "ている", "てる", "という", "について", "のため",
      "から", "まで", "ため", "こと", "もの", "ところ"]);
    const cleaned = theme.replace(/[、。！？！？\s　]+/g, " ").trim();
    const first = cleaned
      .split(/[\s　]/)
      .filter((w) => w.length >= 2 && !skip.has(w))[0];
    if (first) motifs.push(first);
  }

  return motifs.slice(0, 7);
}

// ─── Theme lyric line builder ─────────────────────────────────────────────────

export type SectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "outro";

// [template string with M placeholder, applicable section types]
const JP_THEME_TEMPLATES: Array<[string, SectionType[]]> = [
  // Intro / atmospheric openers
  ["Mの湯気が　立ち込める",            ["intro", "verse"]],
  ["Mの香りに　満たされる",            ["intro", "verse"]],
  ["Mが　世界を満たしていく",          ["intro", "outro"]],
  ["Mの記憶が　始まりだった",          ["intro", "verse"]],

  // Verse — scene-building
  ["Mを手繰る　震える指",              ["verse"]],
  ["Mだけが　全てだった",              ["verse", "chorus"]],
  ["Mに触れて　目が覚めた",            ["verse"]],
  ["Mの名を　呼び続ける",              ["verse", "chorus"]],
  ["Mと共に　朽ちていく",              ["verse", "bridge"]],
  ["Mの底に　真実がある",              ["verse", "bridge"]],
  ["Mを抱えて　眠れない",              ["verse", "pre-chorus"]],
  ["Mの前では　言葉が出ない",          ["verse", "pre-chorus"]],
  ["Mのない朝は　存在しない",          ["verse"]],
  ["Mに溺れた　それでいい",            ["verse", "chorus"]],

  // Pre-chorus — tension build
  ["Mの向こうに　何かがある",          ["pre-chorus", "bridge"]],
  ["Mが引き寄せる　どこかへ",          ["pre-chorus"]],
  ["Mの声が　聞こえる",               ["pre-chorus", "bridge"]],

  // Chorus — anthemic
  ["Mよ　お前が全てだ",               ["chorus"]],
  ["Mに縛られ　それでいい",            ["chorus"]],
  ["Mだけが　真実だった",              ["chorus"]],
  ["Mの呪いが　解けない",              ["chorus", "bridge"]],
  ["Mに跪く　この魂",                 ["chorus", "bridge"]],
  ["Mに祈る　これが愛だ",             ["chorus"]],

  // Bridge — shift in perspective
  ["Mに祈る　夜が続く",               ["bridge", "outro"]],
  ["Mを離しても　また戻る",            ["bridge"]],
  ["Mなしでは　息もできない",          ["bridge"]],

  // Outro
  ["Mの記憶　消えない",               ["outro", "bridge"]],
  ["Mと共に　終わっていく",            ["outro"]],
];

/**
 * Builds theme-specific Japanese lyric lines by filling the M placeholder
 * with motif words, cycling through applicable templates.
 * Returns null if no applicable templates exist for the section.
 */
export function buildThemeLines(
  motifs: string[],
  sectionKey: SectionType,
  count: number,
  seed: number
): string[] | null {
  if (motifs.length === 0) return null;

  const applicable = JP_THEME_TEMPLATES.filter(([, secs]) =>
    secs.includes(sectionKey)
  );
  if (applicable.length === 0) return null;

  const lines: string[] = [];
  let ti = (Number.isFinite(seed) ? seed : 0) % applicable.length;
  let mi = 0;

  for (let i = 0; i < count; i++) {
    const [template] = applicable[ti % applicable.length];
    const motif = motifs[mi % motifs.length];
    lines.push(template.replace(/M/g, motif));
    ti = (ti + 3) % applicable.length; // skip by 3 for variety
    mi++;
  }

  return lines;
}
