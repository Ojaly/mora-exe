// ─── Wizard question/option types ────────────────────────────────────────────

export type WizardMode = "quick" | "deep";

export interface WizardOption {
  value: string;  // used in prompt building
  label: string;  // displayed in UI
}

export interface WizardQuestion {
  id: string;
  question: string;
  hint?: string;
  options: WizardOption[];
  placeholder?: string;
}

// ─── QUICK MODE — 5 questions ─────────────────────────────────────────────────

export const QUICK_QUESTIONS: WizardQuestion[] = [
  {
    id: "base",
    question: "音の土台は？",
    hint: "曲の核になるジャンル感",
    options: [
      { value: "Electronic / Synth", label: "Electronic" },
      { value: "Rock / Guitar-driven", label: "Rock" },
      { value: "Jazz / Neo-Soul", label: "Jazz" },
      { value: "Orchestral / Cinematic", label: "Orchestral" },
      { value: "Hip-Hop / Trap", label: "Hip Hop" },
      { value: "Ambient / Atmospheric", label: "Ambient" },
      { value: "Acoustic / Folk", label: "Acoustic" },
    ],
    placeholder: "例: City Pop, Metal, Bossa Nova",
  },
  {
    id: "emotion",
    question: "感情・温度感は？",
    hint: "聴いた人が感じる「空気」",
    options: [
      { value: "euphoric, radiant, uplifting", label: "高揚" },
      { value: "blissful, warm, glowing", label: "多幸感" },
      { value: "unsettling, tense, dark", label: "不穏" },
      { value: "mysterious, ethereal, hazy", label: "神秘" },
      { value: "intoxicating, hypnotic, lush", label: "陶酔" },
      { value: "melancholic, bittersweet, aching", label: "切なさ" },
      { value: "aggressive, confrontational, raw", label: "攻撃的" },
    ],
    placeholder: "例: dreamy, nostalgic, chill",
  },
  {
    id: "vocal",
    question: "ボーカルの方向性は？",
    hint: "声の質感・存在感",
    options: [
      { value: "female vocal, clear and expressive", label: "女性" },
      { value: "male vocal, gritty and emotive", label: "男性" },
      { value: "husky female vocal, smoky texture", label: "husky" },
      { value: "breathy whisper, intimate close-mic", label: "whisper" },
      { value: "robotic, vocoded, synthetic timbre", label: "robotic" },
      { value: "choir, layered vocal harmonies", label: "choir" },
      { value: "instrumental only, no vocal", label: "Instr." },
    ],
    placeholder: "例: falsetto, androgynous, duet",
  },
  {
    id: "world",
    question: "世界観・情景は？",
    hint: "曲のMVに映りそうな景色",
    options: [
      { value: "neon-lit city, rain-soaked streets, cyberpunk", label: "Neon City" },
      { value: "sterile towers, surveillance state, dystopian", label: "Dystopia" },
      { value: "ancient ruins, gods and spirits, mythic", label: "Mythic" },
      { value: "sacred choir, cracked glass, gospel meets glitch", label: "Gospel" },
      { value: "baroque ballroom, waltzing ghosts, ornate decay", label: "Ballroom" },
      { value: "VHS glow, cassette tape, 80s retrofuture nostalgia", label: "Retro" },
      { value: "forest floor, morning mist, birdsong, earth and moss", label: "Nature" },
    ],
    placeholder: "例: underwater city, space station",
  },
  {
    id: "impression",
    question: "最終的な印象は？",
    hint: "この曲がどんな場面に合うか",
    options: [
      { value: "TikTok-ready hook, viral earworm potential", label: "TikTok映え" },
      { value: "dancefloor energy, club floor-ready", label: "Club向け" },
      { value: "cinematic score feel, emotionally sweeping", label: "映画的" },
      { value: "hypnotic loop, addictive groove, trance-inducing", label: "中毒性" },
      { value: "deeply emotional, cathartic, honest and raw", label: "エモい" },
      { value: "polished, refined, radio-ready pop", label: "洗練" },
      { value: "underground, lo-fi grain, unfiltered texture", label: "生々しい" },
    ],
    placeholder: "例: study music, gym, late night drive",
  },
];

// ─── DEEP MODE — 12 questions ────────────────────────────────────────────────

export const DEEP_QUESTIONS: WizardQuestion[] = [
  {
    id: "genre",
    question: "ジャンルの土台は？",
    hint: "メインとなるサウンドの核",
    options: [
      { value: "J-Pop, polished J-Pop production", label: "J-Pop" },
      { value: "J-Rock, guitar-forward rock", label: "J-Rock" },
      { value: "Electronic / Synth-pop", label: "Electronic" },
      { value: "Hip-Hop / Trap", label: "Hip-Hop" },
      { value: "R&B / Soul", label: "R&B" },
      { value: "Ambient / Atmospheric", label: "Ambient" },
      { value: "Orchestral / Cinematic", label: "Cinematic" },
      { value: "Acoustic / Folk", label: "Acoustic" },
    ],
    placeholder: "例: City Pop, Metal, Jazz, Vocaloid",
  },
  {
    id: "tempo",
    question: "テンポの体感は？",
    hint: "BPMより「体が感じるスピード」で",
    options: [
      { value: "slow, heavy, dragging pulse", label: "重くゆっくり" },
      { value: "mid-tempo, laid-back, unhurried groove", label: "ゆったり" },
      { value: "steady, forward-pushing momentum", label: "しっかり" },
      { value: "upbeat, energetic, bouncy feel", label: "軽快" },
      { value: "fast, intense, relentless pace", label: "速くて激しい" },
    ],
    placeholder: "例: 90 BPM, half-time feel, rubato",
  },
  {
    id: "instrumentation",
    question: "楽器の「濃さ」は？",
    hint: "どれくらい音が重なっているか",
    options: [
      { value: "sparse, minimal, one or two elements", label: "ミニマル" },
      { value: "intimate small ensemble feel", label: "小編成" },
      { value: "balanced full-band arrangement", label: "フルバンド" },
      { value: "dense, layered, richly orchestrated", label: "濃密" },
      { value: "wall-of-sound, overwhelming texture", label: "サウンドウォール" },
    ],
    placeholder: "例: piano trio, string quartet",
  },
  {
    id: "vocal_texture",
    question: "ボーカルの「質感」は？",
    hint: "声の肌触り・存在感",
    options: [
      { value: "clear, bright, crystalline vocal", label: "透明" },
      { value: "warm, rounded, comforting tone", label: "温かい" },
      { value: "husky, smoky, textured voice", label: "ハスキー" },
      { value: "breathy, airy, intimate whisper", label: "ブレシー" },
      { value: "powerful, belting, forceful delivery", label: "力強い" },
      { value: "fragile, cracked edges, emotionally raw", label: "脆い・生" },
      { value: "no vocal, fully instrumental", label: "Instr." },
    ],
    placeholder: "例: androgynous, child-like, deep",
  },
  {
    id: "vocal_fx",
    question: "ボーカルへの加工は？",
    hint: "エフェクト・処理の方向性",
    options: [
      { value: "dry, unprocessed, natural sound", label: "ナチュラル" },
      { value: "subtle reverb, light room ambience", label: "軽いリバーブ" },
      { value: "heavy reverb, cathedral wash, washed out", label: "深いリバーブ" },
      { value: "auto-tune used as artistic choice", label: "オートチューン" },
      { value: "vocoder, talkbox, robotic modulation", label: "ボコーダー" },
      { value: "glitch, stutter, digital artifacts", label: "グリッチ" },
    ],
    placeholder: "例: tape delay, harmonizer, chorus",
  },
  {
    id: "electronic",
    question: "電子的な処理は？",
    hint: "サウンドデザインの全体像",
    options: [
      { value: "fully acoustic, zero electronics", label: "完全アコースティック" },
      { value: "analog warmth, tape saturation, vintage feel", label: "アナログ温感" },
      { value: "clean digital, precise, modern sheen", label: "クリーンデジタル" },
      { value: "heavy synths, arpeggiators, sequenced patterns", label: "シンセ主体" },
      { value: "glitch, IDM, digital noise and artifacts", label: "グリッチ/IDM" },
      { value: "granular synthesis, textural fragments", label: "グラニュラー" },
    ],
    placeholder: "例: sidechain pump, bit-crush",
  },
  {
    id: "lead_instrument",
    question: "主役になる楽器は？",
    hint: "耳が一番引っかかる音",
    options: [
      { value: "piano, expressive and central", label: "ピアノ" },
      { value: "electric guitar, lead melody lines", label: "エレキギター" },
      { value: "acoustic guitar, fingerpicked", label: "アコギ" },
      { value: "synth lead, analog or digital", label: "シンセリード" },
      { value: "strings and violin, bowed expression", label: "ストリングス" },
      { value: "prominent bass guitar up front", label: "ベース主役" },
      { value: "no clear lead, texture-based", label: "テクスチャー" },
    ],
    placeholder: "例: flute, koto, saxophone, organ",
  },
  {
    id: "drums",
    question: "ドラムの方向性は？",
    hint: "リズムの「筋肉感」",
    options: [
      { value: "beatless, no drums, no percussion", label: "ドラムなし" },
      { value: "brushed snare, jazz brushes, delicate", label: "ジャズブラシ" },
      { value: "live acoustic drums, natural and dynamic", label: "生ドラム" },
      { value: "tight drum machine, quantized grid", label: "ドラムマシン" },
      { value: "trap 808s, hi-hat rolls, sub-heavy", label: "Trap" },
      { value: "heavy metal double-kick, powerful impact", label: "ヘヴィ" },
    ],
    placeholder: "例: half-time feel, polyrhythm, breakbeat",
  },
  {
    id: "bass",
    question: "ベースの方向性は？",
    hint: "低域の「重力」感",
    options: [
      { value: "bass-light, minimal low end presence", label: "控えめ" },
      { value: "warm upright bass, acoustic character", label: "アコースティック" },
      { value: "fretless bass, liquid melodic movement", label: "フレットレス" },
      { value: "punchy electric bass, groovy pocket", label: "エレキ" },
      { value: "808 sub-bass, deep and floor-shaking", label: "808サブ" },
      { value: "synth bass, filtered and sequenced", label: "シンセベース" },
    ],
    placeholder: "例: walking bass, slap bass, tuba",
  },
  {
    id: "space",
    question: "空間の広がりは？",
    hint: "音の「部屋の大きさ」と「距離感」",
    options: [
      { value: "dry, close-mic, no reverb, intimate", label: "ドライ" },
      { value: "small room, tight reflections", label: "小さな部屋" },
      { value: "studio space, balanced reverb tail", label: "スタジオ" },
      { value: "concert hall, grand open resonance", label: "ホール" },
      { value: "cathedral reverb, infinite washed space", label: "カテドラル" },
      { value: "open outdoor air, natural open space", label: "屋外" },
    ],
    placeholder: "例: plate reverb, spring reverb",
  },
  {
    id: "world",
    question: "世界観・ビジュアルは？",
    hint: "この曲のMVに映りそうな景色",
    options: [
      { value: "neon-lit city, rain-soaked streets, cyberpunk underground", label: "ネオン都市" },
      { value: "sterile corporate towers, surveillance cameras, dystopia", label: "管理社会" },
      { value: "ancient ruins, gods and spirits, mythic landscape", label: "神話" },
      { value: "sacred choir meets cracked glass, gospel and glitch", label: "聖×俗" },
      { value: "baroque ballroom, waltzing ghosts, ornate decay", label: "廃墟" },
      { value: "VHS glow, cassette tape, 80s retrofuture aesthetic", label: "レトロ" },
      { value: "forest floor, morning mist, birdsong and earth", label: "自然" },
      { value: "bedroom at 3am, blue screen glow, insomnia hours", label: "深夜3時" },
    ],
    placeholder: "例: underwater city, space colony",
  },
  {
    id: "impression",
    question: "どう聞こえてほしい？",
    hint: "完成曲がどんな体験に合うか",
    options: [
      { value: "TikTok-ready hook, instant viral earworm", label: "TikTok映え" },
      { value: "dancefloor energy, club floor, DJ set material", label: "クラブ" },
      { value: "cinematic score, emotionally sweeping, film-ready", label: "映画的" },
      { value: "hypnotic addictive loop, trance-inducing groove", label: "中毒性" },
      { value: "cathartic, deeply emotional, honest and raw", label: "感情的" },
      { value: "radio-polished, refined, pop-accessible shine", label: "洗練" },
      { value: "underground lo-fi, unfiltered, raw grain texture", label: "生々しい" },
    ],
    placeholder: "例: study music, meditation, gym",
  },
];
