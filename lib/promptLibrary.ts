/**
 * MORA.exe — Local Prompt Library
 *
 * 静的辞書。Suno向けのジャンル・ムード・ボーカル・楽器・質感・
 * 構成・メタタグ・プロダクション語彙を一元管理する。
 *
 * 後続ステップでUIから検索・選択できるよう設計。
 * 外部通信なし・ビルド不要・ランタイムのみで動作。
 */

import type { WorldExpansion } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromptLibraryCategory =
  | "genre"
  | "mood"
  | "vocal"
  | "instrument"
  | "texture"
  | "structure"
  | "metaTag"
  | "production";

export interface PromptLibraryItem {
  /** URL-safe slug, unique across the full library */
  id: string;
  /** Human-readable display name */
  label: string;
  category: PromptLibraryCategory;
  /**
   * Suno style-prompt ready text.
   * Insert this directly into the Style Prompt field.
   */
  promptText: string;
  /** What this sounds like / how to use it (Japanese) */
  description: string;
  /** Alternative spellings or synonyms (for search) */
  aliases: string[];
  /** Cross-cutting tags for filtered browsing */
  tags: string[];
}

// ─── Dictionary ───────────────────────────────────────────────────────────────

export const PROMPT_LIBRARY: PromptLibraryItem[] = [

  // ── genre ──────────────────────────────────────────────────────────────────

  {
    id: "genre-electro-swing",
    label: "electro swing",
    category: "genre",
    promptText: "electro swing, jazz, vintage electronic, big band, brass",
    description: "1920～40年代のジャズ・スウィングとモダンなエレクトロが融合。ブラスとダンサブルなビートが特徴。",
    aliases: ["electroswing", "swing electro"],
    tags: ["jazz", "electronic", "vintage", "dance", "brass"],
  },
  {
    id: "genre-dark-electro-swing",
    label: "dark electro swing",
    category: "genre",
    promptText: "dark electro swing, cabaret, noir jazz, industrial brass, minor key",
    description: "退廃的・不吉な雰囲気のエレクトロスウィング。キャバレーとノワールが交差する世界観。",
    aliases: ["gothic electro swing", "noir swing"],
    tags: ["jazz", "electronic", "dark", "gothic", "brass", "noir"],
  },
  {
    id: "genre-neo-soul",
    label: "neo soul",
    category: "genre",
    promptText: "neo soul, warm analog, smooth groove, soulful vocals, Rhodes piano",
    description: "70年代ソウルの温かみとオルタナティブR&Bの洗練が融合。Rhodes、生ドラムが核。",
    aliases: ["neo-soul"],
    tags: ["soul", "rnb", "groove", "analog", "warmth"],
  },
  {
    id: "genre-digital-motown",
    label: "digital motown",
    category: "genre",
    promptText: "digital motown, retro soul, electronic Motown, funky bass, vintage drum machine",
    description: "DAW上で再構築されたモータウン。機械的なグルーヴに人間的な温かさを宿す。",
    aliases: ["electronic motown", "retro-futuristic soul"],
    tags: ["soul", "electronic", "retro", "groove", "bass"],
  },
  {
    id: "genre-french-house",
    label: "french house",
    category: "genre",
    promptText: "french house, filter house, disco house, 4/4, bassline, vocoder",
    description: "ダフト・パンクに代表されるフィルターサウンド。ディスコのループをハウスに昇華。",
    aliases: ["filter house", "french touch"],
    tags: ["house", "electronic", "disco", "dance", "club"],
  },
  {
    id: "genre-nu-disco",
    label: "nu disco",
    category: "genre",
    promptText: "nu disco, disco revival, driving bass, lush strings, cosmic groove",
    description: "70年代ディスコの再解釈。ライブ感あるストリングスとコスミックなシンセが特徴。",
    aliases: ["new disco", "disco house"],
    tags: ["disco", "electronic", "dance", "strings", "groove"],
  },
  {
    id: "genre-electro-waltz",
    label: "electro waltz",
    category: "genre",
    promptText: "electro waltz, 3/4 time, waltz, electronic, melancholic, elegant",
    description: "3/4拍子のワルツにエレクトロを融合。回転する旋律、退廃的な優雅さ。",
    aliases: ["electronic waltz", "synthwaltz"],
    tags: ["waltz", "electronic", "3/4", "elegant", "dance"],
  },
  {
    id: "genre-gothic-waltz",
    label: "gothic waltz",
    category: "genre",
    promptText: "gothic waltz, 3/4, dark orchestral, harpsichord, minor key, cinematic",
    description: "ゴシック的な暗闘とワルツの優雅さ。ハープシコードと弦楽が織りなす暗い舞踏会。",
    aliases: ["dark waltz", "orchestral gothic"],
    tags: ["gothic", "waltz", "orchestral", "dark", "cinematic"],
  },
  {
    id: "genre-breakbeat-rock",
    label: "breakbeat rock",
    category: "genre",
    promptText: "breakbeat rock, broken beats, distorted guitar, hip-hop drums, live rock",
    description: "ヒップホップ由来のブレイクビートと生ロックギターが衝突するハイブリッド。",
    aliases: ["rock breakbeat", "break rock"],
    tags: ["rock", "breakbeat", "hip-hop", "drums", "distorted"],
  },
  {
    id: "genre-industrial-rock",
    label: "industrial rock",
    category: "genre",
    promptText: "industrial rock, heavy, distorted synth, metal percussion, aggressive, Nine Inch Nails",
    description: "金属的な打撃音とディストーションシンセ。怒り・破壊・機械を音に変える。",
    aliases: ["industrial metal", "noise rock"],
    tags: ["rock", "industrial", "heavy", "electronic", "aggressive"],
  },
  {
    id: "genre-city-pop",
    label: "city pop",
    category: "genre",
    promptText: "city pop, Japanese city pop, 80s, smooth, AOR, driving bass, synth",
    description: "80年代日本のシティポップ。都会的な洗練、ドライブ感、夏と夜。",
    aliases: ["シティポップ", "jpop 80s"],
    tags: ["jpop", "80s", "retro", "japanese", "smooth"],
  },
  {
    id: "genre-showa-kayokyoku",
    label: "showa kayokyoku",
    category: "genre",
    promptText: "Showa kayokyoku, Japanese vintage pop, orchestral, nostalgic, enka influence",
    description: "昭和歌謡曲。演歌的コブシとポップスが交差する日本固有の情感。",
    aliases: ["昭和歌謡", "kayokyoku", "showa pop"],
    tags: ["japanese", "vintage", "orchestral", "nostalgic", "showa"],
  },
  {
    id: "genre-enka",
    label: "enka",
    category: "genre",
    promptText: "enka, Japanese traditional pop, kobushi, minor pentatonic, orchestral, emotional",
    description: "演歌。コブシ回し、マイナーペンタトニック、情念と哀愁を核とする日本の伝統歌謡。",
    aliases: ["演歌"],
    tags: ["japanese", "traditional", "pentatonic", "emotional"],
  },
  {
    id: "genre-techno-enka",
    label: "techno enka",
    category: "genre",
    promptText: "techno enka, electronic enka, synthesized kobushi, 4-on-the-floor, minor pentatonic",
    description: "演歌のコブシとテクノのビートを融合した異形のジャンル。祭囃子とシンセが同居。",
    aliases: ["テクノ演歌", "electronic enka"],
    tags: ["japanese", "electronic", "enka", "experimental", "dance"],
  },
  {
    id: "genre-reggae-funk",
    label: "reggae funk",
    category: "genre",
    promptText: "reggae funk, skank guitar, slap bass, off-beat, groove, Jamaican rhythm",
    description: "レゲエのスカ的オフビートとファンクのグルーヴが融合。スラップベースが核。",
    aliases: ["funk reggae", "reggae groove"],
    tags: ["reggae", "funk", "bass", "groove", "offbeat"],
  },
  {
    id: "genre-corporate-electro-funk",
    label: "corporate electro funk",
    category: "genre",
    promptText: "corporate electro funk, sterile funk, fluorescent office, electronic groove, dystopian soul",
    description: "企業CMのような完璧さと不気味さ。蛍光灯の下のファンク。感情を排した機能的な陽気さ。",
    aliases: ["office funk", "dystopian funk"],
    tags: ["funk", "electronic", "ironic", "dystopian", "corporate"],
  },
  {
    id: "genre-ceremonial-ambient",
    label: "ceremonial ambient",
    category: "genre",
    promptText: "ceremonial ambient, ritual drone, sacred atmosphere, slow pulse, minimal melody",
    description: "儀式的・祭祀的な荘厳さを持つアンビエント。緩慢なドローン、神聖な空気感。",
    aliases: ["ritual ambient", "sacred ambient"],
    tags: ["ambient", "ritual", "sacred", "minimal", "drone"],
  },
  {
    id: "genre-minimal-post-pop",
    label: "minimal post-pop",
    category: "genre",
    promptText: "minimal post-pop, sparse arrangement, art pop, silence, negative space",
    description: "削ぎ落とした後に残る音楽。余白と沈黙がメロディと等価に機能するポストポップ。",
    aliases: ["art pop", "post-pop minimal"],
    tags: ["minimal", "experimental", "pop", "sparse", "art"],
  },
  {
    id: "genre-electro-gospel-irony",
    label: "electro gospel irony",
    category: "genre",
    promptText: "electro gospel, call and response, gospel choir, electronic rhythm, ironic sacred",
    description: "ゴスペルの熱量とエレクトロの冷徹さが衝突。神聖さと皮肉が同居する奇妙な祝祭。",
    aliases: ["gospel electro", "ironic gospel"],
    tags: ["gospel", "electronic", "ironic", "choir", "sacred"],
  },

  // ── mood ───────────────────────────────────────────────────────────────────

  {
    id: "mood-melancholic",
    label: "melancholic",
    category: "mood",
    promptText: "melancholic, bittersweet, sad, introspective",
    description: "切なさ、哀愁、過去への郷愁。明確な悲しみより静かな痛みに近い。",
    aliases: ["melancholy", "sad", "bittersweet"],
    tags: ["sad", "emotional", "quiet"],
  },
  {
    id: "mood-ironic",
    label: "ironic",
    category: "mood",
    promptText: "ironic, deadpan, wry, detached, sardonic",
    description: "距離を置いた冷静さ、皮肉、表情のない笑い。感情は表面の裏にある。",
    aliases: ["sardonic", "wry", "deadpan"],
    tags: ["irony", "detached", "humor"],
  },
  {
    id: "mood-eerie",
    label: "eerie",
    category: "mood",
    promptText: "eerie, unsettling, uncanny, haunting, strange",
    description: "不穏、不気味、現実と異常の境界にある感覚。不安を名指しせず漂わせる。",
    aliases: ["creepy", "haunting", "uncanny"],
    tags: ["dark", "horror", "atmospheric"],
  },
  {
    id: "mood-cinematic",
    label: "cinematic",
    category: "mood",
    promptText: "cinematic, epic, orchestral, dramatic, film score",
    description: "映画的スケール。シーンが見える叙述性、感情の大きなアーク。",
    aliases: ["epic", "dramatic", "film"],
    tags: ["orchestral", "epic", "drama", "visual"],
  },
  {
    id: "mood-luxurious",
    label: "luxurious",
    category: "mood",
    promptText: "luxurious, opulent, sophisticated, smooth, polished",
    description: "洗練された豊かさ。過剰なまでに磨き上げられた表面、感情を隠す完璧さ。",
    aliases: ["opulent", "plush", "sophisticated"],
    tags: ["smooth", "high-end", "polished"],
  },
  {
    id: "mood-absurd",
    label: "absurd",
    category: "mood",
    promptText: "absurd, bizarre, surreal, strange humor, off-kilter",
    description: "不条理、シュール。論理的に成立しないが感情的には正確な世界観。",
    aliases: ["surreal", "bizarre", "kafkaesque"],
    tags: ["surreal", "humor", "strange", "experimental"],
  },
  {
    id: "mood-sacred",
    label: "sacred",
    category: "mood",
    promptText: "sacred, divine, spiritual, reverent, transcendent",
    description: "神聖さ、畏敬、信仰に近い感情。世俗を超えたものへの接近。",
    aliases: ["divine", "holy", "spiritual"],
    tags: ["religion", "ceremony", "ambient"],
  },
  {
    id: "mood-desolate",
    label: "desolate",
    category: "mood",
    promptText: "desolate, empty, barren, lonely, post-apocalyptic",
    description: "廃墟的な荒廃感。人の気配が消えた後の静寂。喪失よりも不在。",
    aliases: ["barren", "empty", "lonely"],
    tags: ["dark", "empty", "atmospheric", "post-apocalyptic"],
  },
  {
    id: "mood-triumphant",
    label: "triumphant",
    category: "mood",
    promptText: "triumphant, victorious, powerful, uplifting, anthemic",
    description: "勝利・昂揚。アンセム的な高揚感、涙と共に込み上げるもの。",
    aliases: ["victorious", "anthemic", "uplifting"],
    tags: ["power", "epic", "uplifting", "choir"],
  },
  {
    id: "mood-unsettling",
    label: "unsettling",
    category: "mood",
    promptText: "unsettling, tense, ominous, dread, foreboding",
    description: "不安定さ、予兆、何かが起きる直前の緊張感。ホラーよりサスペンスに近い。",
    aliases: ["tense", "ominous", "dread"],
    tags: ["dark", "tension", "horror"],
  },
  {
    id: "mood-romantic",
    label: "romantic",
    category: "mood",
    promptText: "romantic, intimate, tender, warm, heartfelt",
    description: "親密さ、柔らかさ、人と人との熱量。感傷より体温に近い感情。",
    aliases: ["intimate", "tender", "loving"],
    tags: ["love", "warmth", "emotional"],
  },
  {
    id: "mood-deadpan",
    label: "deadpan",
    category: "mood",
    promptText: "deadpan, flat affect, expressionless, monotone, dry",
    description: "表情ゼロ。感情を完全に排した語り口。その空白が逆説的に語る。",
    aliases: ["flat", "expressionless", "monotone"],
    tags: ["irony", "detached", "humor", "minimal"],
  },

  // ── vocal ──────────────────────────────────────────────────────────────────

  {
    id: "vocal-flat-male",
    label: "flat male vocal",
    category: "vocal",
    promptText: "flat male vocal, deadpan delivery, spoken-word adjacent, no vibrato",
    description: "感情を排したフラットな男性ボーカル。読み上げに近い無機質な声質。",
    aliases: ["monotone male", "deadpan male"],
    tags: ["male", "deadpan", "spoken"],
  },
  {
    id: "vocal-husky-male",
    label: "husky male vocal",
    category: "vocal",
    promptText: "husky male vocal, raspy, deep, smoky, gravelly",
    description: "かすれた深みのある男性声。煙草と夜を感じさせるスモーキーな質感。",
    aliases: ["raspy male", "gravelly voice", "deep male"],
    tags: ["male", "dark", "smoky", "soul"],
  },
  {
    id: "vocal-female-soprano",
    label: "female soprano",
    category: "vocal",
    promptText: "female soprano, clear high voice, operatic, soaring, crystalline",
    description: "高音域の透明感ある女性ボーカル。オペラ的な張りと旋律性。",
    aliases: ["high female", "soprano"],
    tags: ["female", "high", "classical", "operatic"],
  },
  {
    id: "vocal-androgynous",
    label: "androgynous vocal",
    category: "vocal",
    promptText: "androgynous vocal, gender-neutral, ethereal, smooth falsetto",
    description: "性別を超えた声質。エーテル的な浮遊感、固定されない輪郭。",
    aliases: ["gender-neutral vocal", "ethereal vocal"],
    tags: ["androgynous", "ethereal", "electronic", "falsetto"],
  },
  {
    id: "vocal-spoken",
    label: "spoken vocal",
    category: "vocal",
    promptText: "spoken word, spoken vocal, narrative, prose delivery, no melody",
    description: "メロディを持たない語り。詩の朗読、独白、ナレーションに近い声の使い方。",
    aliases: ["spoken word", "narrative vocal"],
    tags: ["spoken", "narrative", "theatrical"],
  },
  {
    id: "vocal-call-and-response",
    label: "call and response",
    category: "vocal",
    promptText: "call and response vocals, antiphonal, gospel tradition, leader and choir",
    description: "リードとコーラスが呼応するゴスペル的唱法。集団の熱量とリーダーの個性が交差。",
    aliases: ["antiphonal", "responsive singing"],
    tags: ["gospel", "choir", "communal"],
  },
  {
    id: "vocal-duet",
    label: "duet",
    category: "vocal",
    promptText: "duet, male female duet, two voices, harmony, interplay",
    description: "二つの声の対話。男女デュエット、声の質感の差異が物語を作る。",
    aliases: ["two vocals", "male female"],
    tags: ["harmony", "duet", "interplay"],
  },
  {
    id: "vocal-vocoder-layers",
    label: "vocoder layers",
    category: "vocal",
    promptText: "vocoder, vocoder layers, talk box, robot voice, processed vocal",
    description: "ボコーダー処理された複数レイヤーのボーカル。機械と人間の境界を溶かす。",
    aliases: ["talk box", "robot vocal", "processed voice"],
    tags: ["electronic", "processed", "vocoder", "robotic"],
  },
  {
    id: "vocal-gospel-choir",
    label: "gospel choir",
    category: "vocal",
    promptText: "gospel choir, mass choir, powerful harmonies, spiritual, soulful",
    description: "大勢のゴスペルクワイア。圧倒的な合唱、霊的な熱量、共同体の声。",
    aliases: ["choir", "mass choir", "gospel vocals"],
    tags: ["choir", "gospel", "communal", "powerful"],
  },
  {
    id: "vocal-whisper",
    label: "whisper vocal",
    category: "vocal",
    promptText: "whisper vocal, intimate, breathy, close-mic, ASMR-adjacent",
    description: "ウィスパーボイス。耳元で語られるような親密さ、息の音が前景に来る。",
    aliases: ["breathy", "intimate vocal"],
    tags: ["intimate", "breathy", "quiet", "close"],
  },

  // ── instrument ─────────────────────────────────────────────────────────────

  {
    id: "inst-brass-stabs",
    label: "brass stabs",
    category: "instrument",
    promptText: "brass stabs, horn hits, punchy brass, funk brass",
    description: "短くパンチのあるブラスヒット。ファンク・ソウルのグルーヴを生む。",
    aliases: ["horn stabs", "horn hits"],
    tags: ["brass", "funk", "soul", "punchy"],
  },
  {
    id: "inst-walking-bass",
    label: "walking bass",
    category: "instrument",
    promptText: "walking bass, jazz bass, upright bass, bebop, swing feel",
    description: "四分音符で歩くようなジャズベースライン。スウィング感の核。",
    aliases: ["jazz bass", "upright bass"],
    tags: ["jazz", "bass", "swing", "acoustic"],
  },
  {
    id: "inst-slap-bass",
    label: "slap bass",
    category: "instrument",
    promptText: "slap bass, popping bass, funky bass, percussive bass",
    description: "スラップ奏法によるパーカッシブなベース。ファンク・フュージョンの核。",
    aliases: ["slap and pop", "funky bass"],
    tags: ["bass", "funk", "percussive"],
  },
  {
    id: "inst-prepared-piano",
    label: "prepared piano",
    category: "instrument",
    promptText: "prepared piano, John Cage, detuned piano, percussive piano, experimental",
    description: "弦に異物を挟んだプリペアドピアノ。通常の音色を逸脱した打楽器的音響。",
    aliases: ["detuned piano", "cage piano"],
    tags: ["experimental", "piano", "percussive", "avant-garde"],
  },
  {
    id: "inst-vibraphone",
    label: "vibraphone",
    category: "instrument",
    promptText: "vibraphone, vibes, metallic resonance, jazz percussion, dreamy",
    description: "ビブラフォン特有の金属的残響と夢幻的な揺らぎ。ジャズ・アンビエントに溶け込む。",
    aliases: ["vibes", "marimba adjacent"],
    tags: ["jazz", "metallic", "dreamy", "percussion"],
  },
  {
    id: "inst-shamisen",
    label: "shamisen",
    category: "instrument",
    promptText: "shamisen, Japanese lute, plucked string, sawari, traditional Japanese",
    description: "三味線。サワリ(独特の雑音)を含む撥弦音、演歌・邦楽の質感。",
    aliases: ["三味線", "japanese lute"],
    tags: ["japanese", "traditional", "string", "plucked"],
  },
  {
    id: "inst-taiko",
    label: "taiko",
    category: "instrument",
    promptText: "taiko drums, Japanese percussion, powerful drumming, traditional",
    description: "太鼓。大地に響く打撃、祭り・儀式・戦の熱量を持つ日本の打楽器。",
    aliases: ["太鼓", "japanese drums"],
    tags: ["japanese", "percussion", "powerful", "traditional"],
  },
  {
    id: "inst-filtered-synth-bass",
    label: "filtered synth bass",
    category: "instrument",
    promptText: "filtered synth bass, resonant filter, analog bass, fat bass, sweeping",
    description: "フィルタースウィープするアナログシンセベース。フレンチハウスやEDMの核音。",
    aliases: ["filter bass", "analog synth bass"],
    tags: ["electronic", "bass", "filter", "analog"],
  },
  {
    id: "inst-clavinet",
    label: "clavinet",
    category: "instrument",
    promptText: "clavinet, funky clavinet, Stevie Wonder, percussive keyboard, wah",
    description: "クラビネットの鋭いアタック音。スティービー・ワンダー的なファンクキーボード。",
    aliases: ["clavi", "funk keyboard"],
    tags: ["funk", "keyboard", "percussive", "classic"],
  },
  {
    id: "inst-string-section",
    label: "string section",
    category: "instrument",
    promptText: "string section, orchestral strings, lush strings, cinematic strings",
    description: "オーケストラ弦楽セクション。感情の増幅、映画的スウェルに使われる。",
    aliases: ["strings", "orchestral strings"],
    tags: ["orchestral", "cinematic", "strings", "lush"],
  },
  {
    id: "inst-distorted-breakbeats",
    label: "distorted breakbeats",
    category: "instrument",
    promptText: "distorted breakbeats, crushed drums, lo-fi hip-hop breaks, clipped",
    description: "ディストーションがかかったブレイクビーツ。歪みと荒さが攻撃性を生む。",
    aliases: ["crushed beats", "broken breaks"],
    tags: ["drums", "electronic", "distorted", "hip-hop", "aggressive"],
  },
  {
    id: "inst-hand-claps",
    label: "hand claps",
    category: "instrument",
    promptText: "hand claps, clapping, percussive claps, crowd clap, rhythmic",
    description: "ハンドクラップ。コミュナルな熱量、身体性、4つ打ちやスウィングに乗る。",
    aliases: ["clapping", "claps"],
    tags: ["percussion", "communal", "rhythmic"],
  },

  // ── texture ────────────────────────────────────────────────────────────────

  {
    id: "tex-fluorescent-hum",
    label: "fluorescent hum",
    category: "texture",
    promptText: "fluorescent hum, institutional ambience, office drone, 60hz buzz",
    description: "蛍光灯のハム音。施設・オフィス・病院的な冷たさと疎外感。",
    aliases: ["institutional hum", "60hz buzz"],
    tags: ["industrial", "corporate", "ambient", "cold"],
  },
  {
    id: "tex-gymnasium-reverb",
    label: "gymnasium reverb",
    category: "texture",
    promptText: "gymnasium reverb, large room reverb, hollow echo, school hall",
    description: "体育館・大きな空洞の残響。校舎や式典の記憶と結びつく独特の空間感。",
    aliases: ["large room reverb", "hall reverb"],
    tags: ["reverb", "space", "nostalgic", "hollow"],
  },
  {
    id: "tex-tape-saturation",
    label: "tape saturation",
    category: "texture",
    promptText: "tape saturation, analog warmth, tape hiss, warm compression",
    description: "アナログテープの温かい歪み・圧縮感。デジタルの精度より人間的なにじみ。",
    aliases: ["tape warmth", "analog saturation"],
    tags: ["analog", "vintage", "warm", "lo-fi"],
  },
  {
    id: "tex-vinyl-crackle",
    label: "vinyl crackle",
    category: "texture",
    promptText: "vinyl crackle, record noise, lo-fi, vintage texture, dusty",
    description: "レコードのパチパチ雑音。過去の物理的な記憶、時間の経過が音になったもの。",
    aliases: ["record crackle", "vinyl noise"],
    tags: ["lo-fi", "vintage", "nostalgic", "texture"],
  },
  {
    id: "tex-neon-shimmer",
    label: "neon shimmer",
    category: "texture",
    promptText: "neon shimmer, glittery synth, wet reverb, city lights texture",
    description: "濡れた街のネオンが滲む質感。シンセのシマー系リバーブ、都市の光の揺らぎ。",
    aliases: ["synth shimmer", "city texture"],
    tags: ["electronic", "urban", "wet", "glossy"],
  },
  {
    id: "tex-hollow-room-echo",
    label: "hollow room echo",
    category: "texture",
    promptText: "hollow room echo, empty space, abandoned room, bare reverb",
    description: "空洞に響くエコー。誰もいない部屋、廃墟、不在の音響的表現。",
    aliases: ["empty room reverb", "bare echo"],
    tags: ["reverb", "empty", "desolate", "atmospheric"],
  },
  {
    id: "tex-lofi-compression",
    label: "lo-fi compression",
    category: "texture",
    promptText: "lo-fi compression, crushed dynamics, bit-crushed, degraded audio",
    description: "ローファイな過圧縮。ダイナミクスが潰れ、荒い質感が全面に出る。",
    aliases: ["lo-fi", "crushed audio"],
    tags: ["lo-fi", "electronic", "degraded"],
  },
  {
    id: "tex-glossy-club-mix",
    label: "glossy club mix",
    category: "texture",
    promptText: "glossy club mix, polished, loud mastering, club-ready, modern production",
    description: "クラブ向けに磨き上げられた高光沢ミックス。すべてが完璧で滑らか、感情は表面にない。",
    aliases: ["club mix", "polished mix"],
    tags: ["club", "electronic", "polished", "loud"],
  },
  {
    id: "tex-dry-vocal-booth",
    label: "dry vocal booth",
    category: "texture",
    promptText: "dry vocal, no reverb, close-mic, raw, intimate recording",
    description: "リバーブなしの乾いたボーカル。録音の現場感、フィルタリングなしの声の質感。",
    aliases: ["dry vocal", "no-reverb vocal"],
    tags: ["vocal", "dry", "intimate", "raw"],
  },
  {
    id: "tex-cinematic-reverb",
    label: "cinematic reverb",
    category: "texture",
    promptText: "cinematic reverb, large hall reverb, epic space, film scoring reverb",
    description: "映画音楽的な広大な残響。感情を膨張させ、場面に壮大さを与える。",
    aliases: ["epic reverb", "film reverb"],
    tags: ["cinematic", "orchestral", "epic", "reverb"],
  },

  // ── structure ──────────────────────────────────────────────────────────────

  {
    id: "struct-chorus-first",
    label: "chorus first",
    category: "structure",
    promptText: "[Chorus] opening, hook-first structure, starts with main melody",
    description: "冒頭からサビ。聴き手を即座にフックで掴む構成。印象を最初に刻む。",
    aliases: ["hook first", "starts with chorus"],
    tags: ["structure", "hook", "catchy"],
  },
  {
    id: "struct-hook-loop",
    label: "hook loop",
    category: "structure",
    promptText: "[Hook] repeating structure, verse and hook alternating, no bridge",
    description: "Hookを軸にVerse交互繰り返し。ラップ・ポップに多い中毒性の高い構造。",
    aliases: ["verse hook loop", "rap structure"],
    tags: ["structure", "rap", "hook", "repetition"],
  },
  {
    id: "struct-dance-build-drop",
    label: "dance build drop",
    category: "structure",
    promptText: "[Build] into [Drop], tension and release, EDM structure",
    description: "ビルドアップからドロップへの緊張と解放。EDM・ハウスの基本構造。",
    aliases: ["build drop", "edm structure"],
    tags: ["structure", "dance", "edm", "tension"],
  },
  {
    id: "struct-verse-first",
    label: "verse first",
    category: "structure",
    promptText: "verse first structure, narrative build, [Verse] opening",
    description: "Verseから始まる物語的構成。サビへの期待感を段階的に高める。",
    aliases: ["standard structure", "intro verse"],
    tags: ["structure", "narrative", "standard"],
  },
  {
    id: "struct-theatrical-intro",
    label: "theatrical intro",
    category: "structure",
    promptText: "theatrical intro, [Spoken Intro], dramatic opening, scene-setting",
    description: "劇的なイントロ。語りや情景描写で世界観を確立してから曲が展開する。",
    aliases: ["dramatic intro", "scene-setting intro"],
    tags: ["structure", "theatrical", "spoken", "dramatic"],
  },
  {
    id: "struct-spoken-intro",
    label: "spoken intro",
    category: "structure",
    promptText: "[Spoken Intro], spoken word opening, narrative prelude",
    description: "スポークンワードで始まる前奏。メロディより語りで世界に引き込む。",
    aliases: ["narrated intro", "spoken opening"],
    tags: ["structure", "spoken", "narrative"],
  },
  {
    id: "struct-final-chorus",
    label: "final chorus",
    category: "structure",
    promptText: "[Final Chorus], climactic chorus, last chorus, key change option",
    description: "最終サビ。転調やアレンジ変化で感情の最高点を作る。",
    aliases: ["last chorus", "outro chorus"],
    tags: ["structure", "climax", "chorus"],
  },
  {
    id: "struct-breakdown",
    label: "breakdown",
    category: "structure",
    promptText: "[Breakdown], stripped arrangement, tension release, minimal section",
    description: "アレンジを剥ぎ取ったブレイクダウン。緊張解放または再構築の準備セクション。",
    aliases: ["break", "stripped section"],
    tags: ["structure", "tension", "minimal"],
  },
  {
    id: "struct-bridge",
    label: "bridge",
    category: "structure",
    promptText: "[Bridge], contrasting section, perspective shift, middle 8",
    description: "ブリッジ。視点・調・質感を転換させる楔のセクション。",
    aliases: ["middle 8", "contrasting section"],
    tags: ["structure", "contrast", "shift"],
  },
  {
    id: "struct-outro",
    label: "outro",
    category: "structure",
    promptText: "[Outro], fade out, closing section, resolution",
    description: "アウトロ。物語の着地点または余韻として機能する閉幕部。",
    aliases: ["closing", "fade"],
    tags: ["structure", "closing", "resolution"],
  },

  // ── metaTag ────────────────────────────────────────────────────────────────

  {
    id: "tag-intro",
    label: "[Intro]",
    category: "metaTag",
    promptText: "[Intro]",
    description: "導入部。世界観と雰囲気を設定する冒頭セクション。2～3行。",
    aliases: ["intro"],
    tags: ["section", "opening"],
  },
  {
    id: "tag-verse",
    label: "[Verse]",
    category: "metaTag",
    promptText: "[Verse]",
    description: "汎用バース。番号なしのシングルバース用。",
    aliases: ["verse"],
    tags: ["section", "verse"],
  },
  {
    id: "tag-verse-1",
    label: "[Verse 1]",
    category: "metaTag",
    promptText: "[Verse 1]",
    description: "第1バース。物語の導入、場面設定。4～6行。",
    aliases: ["first verse", "verse 1"],
    tags: ["section", "verse", "narrative"],
  },
  {
    id: "tag-verse-2",
    label: "[Verse 2]",
    category: "metaTag",
    promptText: "[Verse 2]",
    description: "第2バース。視点の発展、深化、または転換。4～6行。",
    aliases: ["second verse", "verse 2"],
    tags: ["section", "verse", "development"],
  },
  {
    id: "tag-pre-chorus",
    label: "[Pre-Chorus]",
    category: "metaTag",
    promptText: "[Pre-Chorus]",
    description: "プレコーラス。サビへの緊張を高める2～3行のランウェイ。",
    aliases: ["pre chorus", "build-up"],
    tags: ["section", "tension", "transition"],
  },
  {
    id: "tag-chorus",
    label: "[Chorus]",
    category: "metaTag",
    promptText: "[Chorus]",
    description: "サビ。感情の最高点、反復により記憶に刻まれる中心部。3～5行。",
    aliases: ["chorus", "hook section"],
    tags: ["section", "hook", "peak"],
  },
  {
    id: "tag-bridge",
    label: "[Bridge]",
    category: "metaTag",
    promptText: "[Bridge]",
    description: "ブリッジ。視点・調・質感を転換する楔。3～4行。",
    aliases: ["bridge", "middle 8"],
    tags: ["section", "contrast"],
  },
  {
    id: "tag-outro",
    label: "[Outro]",
    category: "metaTag",
    promptText: "[Outro]",
    description: "アウトロ。曲の余韻と着地。2～3行。",
    aliases: ["outro", "ending"],
    tags: ["section", "closing"],
  },
  {
    id: "tag-hook",
    label: "[Hook]",
    category: "metaTag",
    promptText: "[Hook]",
    description: "ラップ・ポップ向けの繰り返しフック。Chorusより短い傾向。3～4行。",
    aliases: ["hook"],
    tags: ["section", "hook", "rap"],
  },
  {
    id: "tag-drop",
    label: "[Drop]",
    category: "metaTag",
    promptText: "[Drop]",
    description: "EDM・ダンス系の「ドロップ」。Build後の解放、高エネルギーセクション。",
    aliases: ["drop", "edm drop"],
    tags: ["section", "edm", "dance", "energy"],
  },
  {
    id: "tag-breakdown",
    label: "[Breakdown]",
    category: "metaTag",
    promptText: "[Breakdown]",
    description: "アレンジを剥ぎ取ったブレイクダウン。緊張の解放または再ビルド前の静寂。",
    aliases: ["breakdown"],
    tags: ["section", "minimal", "tension"],
  },
  {
    id: "tag-spoken",
    label: "[Spoken]",
    category: "metaTag",
    promptText: "[Spoken]",
    description: "スポークンワードセクション。メロディなし、語りとして機能。",
    aliases: ["spoken", "narration"],
    tags: ["section", "spoken", "narrative"],
  },
  {
    id: "tag-instrumental",
    label: "[Instrumental]",
    category: "metaTag",
    promptText: "[Instrumental]",
    description: "ボーカルなし・楽器のみのセクション。ソロや間奏に使用。",
    aliases: ["instrumental", "solo section"],
    tags: ["section", "instrumental"],
  },
  {
    id: "tag-final-chorus",
    label: "[Final Chorus]",
    category: "metaTag",
    promptText: "[Final Chorus]",
    description: "最終サビ。クライマックスの反復、感情の最高点。",
    aliases: ["final chorus", "last chorus"],
    tags: ["section", "chorus", "climax"],
  },

  // ── production ─────────────────────────────────────────────────────────────

  {
    id: "prod-64bpm",
    label: "64 BPM",
    category: "production",
    promptText: "64 BPM",
    description: "非常に遅いテンポ。葬送、儀礼、瞑想的なアンビエントに適する。",
    aliases: ["very slow", "largo"],
    tags: ["bpm", "slow", "ambient", "ceremonial"],
  },
  {
    id: "prod-90bpm",
    label: "90 BPM",
    category: "production",
    promptText: "90 BPM",
    description: "ミドルテンポ。ヒップホップ、バラード、グルーヴ系に自然なテンポ域。",
    aliases: ["mid tempo", "hip-hop tempo"],
    tags: ["bpm", "mid-tempo", "hip-hop", "soul"],
  },
  {
    id: "prod-116bpm",
    label: "116 BPM",
    category: "production",
    promptText: "116 BPM",
    description: "アップテンポ寄りのミドル。ダンスポップ、ハウス、UKガレージに多い域。",
    aliases: ["upbeat", "dance tempo"],
    tags: ["bpm", "dance", "pop", "upbeat"],
  },
  {
    id: "prod-118bpm",
    label: "118 BPM",
    category: "production",
    promptText: "118 BPM",
    description: "クラブクラシックに多いハウステンポ。4-on-the-floorが最も機能する域。",
    aliases: ["house tempo", "club tempo"],
    tags: ["bpm", "house", "club", "dance"],
  },
  {
    id: "prod-3-4-time",
    label: "3/4 time",
    category: "production",
    promptText: "3/4 time, waltz, triple meter",
    description: "ワルツ拍子。3拍子の回転感、円舞的な流れ。",
    aliases: ["waltz time", "triple meter"],
    tags: ["time-signature", "waltz", "elegant"],
  },
  {
    id: "prod-4-4-time",
    label: "4/4 time",
    category: "production",
    promptText: "4/4 time, common time, standard meter",
    description: "標準的な4拍子。ポップ・ロック・ダンスのほぼ全ての基本。",
    aliases: ["common time", "four-four"],
    tags: ["time-signature", "standard"],
  },
  {
    id: "prod-club-ready",
    label: "club-ready mix",
    category: "production",
    promptText: "club-ready mix, loud mastering, high loudness, punchy transients",
    description: "クラブシステムで機能するラウドなマスタリング。低音の前進感、明確なトランジェント。",
    aliases: ["club mix", "dance mix"],
    tags: ["mixing", "club", "loud", "dance"],
  },
  {
    id: "prod-studio-recording",
    label: "studio recording",
    category: "production",
    promptText: "studio recording, professional production, clean mix, high fidelity",
    description: "スタジオ品質の高忠実度録音。ノイズなし、全帯域クリアなプロダクション。",
    aliases: ["professional recording", "hi-fi"],
    tags: ["production", "clean", "professional"],
  },
  {
    id: "prod-no-crowd",
    label: "no crowd ambience",
    category: "production",
    promptText: "no crowd ambience, studio only, no audience, clean isolation",
    description: "観客・環境音なし。スタジオ収録の純粋な音のみを維持する指定。",
    aliases: ["no audience", "clean recording"],
    tags: ["production", "clean", "studio"],
  },
  {
    id: "prod-minimal-arrangement",
    label: "minimal arrangement",
    category: "production",
    promptText: "minimal arrangement, sparse, few instruments, negative space",
    description: "最小限のアレンジ。余白が音と等価に機能する削ぎ落とした編成。",
    aliases: ["sparse", "minimal"],
    tags: ["production", "minimal", "sparse", "art"],
  },
  {
    id: "prod-full-arrangement",
    label: "full arrangement",
    category: "production",
    promptText: "full arrangement, dense production, all instruments, rich texture",
    description: "フル編成。すべての楽器が揃い、豊かな音の層が重なる密度の高いプロダクション。",
    aliases: ["full production", "dense arrangement"],
    tags: ["production", "full", "rich", "dense"],
  },
];

// ─── Prompt builder helpers ───────────────────────────────────────────────────

/** Categories whose promptText feeds into the Suno Style Prompt field */
const STYLE_CATEGORIES: PromptLibraryCategory[] = [
  "genre", "mood", "vocal", "instrument", "texture", "production",
];

/**
 * Builds a comma-separated style addition string from selected items.
 * Only includes style-relevant categories (genre, mood, vocal, instrument,
 * texture, production). Empty string when no matching items.
 */
export function buildLibraryStyleAddition(items: PromptLibraryItem[]): string {
  return items
    .filter((i) => STYLE_CATEGORIES.includes(i.category))
    .map((i) => i.promptText)
    .join(", ");
}

/**
 * Builds a structure preference hint from selected structure items.
 * Injected into the Claude generate prompt as a STRUCTURE PREFERENCE note.
 */
export function buildLibraryStructureHint(items: PromptLibraryItem[]): string {
  return items
    .filter((i) => i.category === "structure")
    .map((i) => `${i.label}: ${i.promptText}`)
    .join("; ");
}

/**
 * Builds a preferred-sections hint from selected metaTag items.
 * Injected into the Claude generate prompt as a PREFERRED SECTIONS note.
 */
export function buildLibraryMetaTagHint(items: PromptLibraryItem[]): string {
  return items
    .filter((i) => i.category === "metaTag")
    .map((i) => i.promptText)
    .join(" ");
}

// ─── Forge recommendation ─────────────────────────────────────────────────────

/** Categories eligible for recommendation (metaTag / production are too generic) */
const RECOMMEND_CATS: PromptLibraryCategory[] = [
  "genre", "mood", "vocal", "instrument", "texture", "structure",
];

/** Maximum items to surface per category */
const REC_CAT_MAX: Partial<Record<PromptLibraryCategory, number>> = {
  genre: 3, mood: 3, instrument: 2, texture: 2, structure: 2, vocal: 1,
};

/**
 * Japanese keyword → item-id bonus mapping.
 *
 * Each entry: if ANY keyword in `keywords` appears in the full Japanese corpus
 * (seed text + expansion fields), apply `bonus` extra score to each listed item id.
 * Bonus is ADDITIVE on top of the English corpus score — existing EN scoring
 * is not affected.
 *
 * Rules:
 * - production / metaTag category items are NOT listed (excluded from RECOMMEND_CATS)
 * - bonus 6 = strong thematic match (core genre/texture of the theme)
 * - bonus 5 = clear association
 * - bonus 4 = supporting / secondary association
 * - bonus 3 = weak / tangential association
 */
const JP_KEYWORD_MAP: ReadonlyArray<{
  keywords: readonly string[];
  ids: readonly string[];
  bonus: number;
}> = [
  // ── 学校・朝礼・施設系 ────────────────────────────────────────────────────
  {
    keywords: [
      "朝礼", "体育館", "校庭", "出席簿", "チャイム", "教室", "号令", "整列",
      "朝の会", "学校", "登校", "校舎", "下校", "廊下", "黒板", "先生", "生徒",
      "上履き", "給食", "運動場",
    ],
    ids: [
      "genre-ceremonial-ambient",
      "genre-minimal-post-pop",
      "tex-gymnasium-reverb",
      "tex-hollow-room-echo",
      "vocal-spoken",
      "mood-desolate",
      "mood-deadpan",
    ],
    bonus: 6,
  },
  {
    keywords: ["蛍光灯", "マイク", "スピーカー", "放送室", "拡声器"],
    ids: [
      "tex-fluorescent-hum",
      "vocal-spoken",
      "mood-deadpan",
    ],
    bonus: 6,
  },
  // ── 祭り・和風・神社系 ────────────────────────────────────────────────────
  {
    keywords: [
      "祭り", "お祭り", "提灯", "御神輿", "神輿", "みこし", "音頭", "縁日",
      "祝詞", "屋台", "盆踊り", "祭囃子", "お囃子", "神社", "神楽", "神事",
      "お盆", "花火", "浴衣",
    ],
    ids: [
      "genre-enka",
      "genre-techno-enka",
      "inst-shamisen",
      "inst-taiko",
      "vocal-call-and-response",
      "struct-theatrical-intro",
      "mood-triumphant",
      "genre-ceremonial-ambient",
    ],
    bonus: 6,
  },
  {
    keywords: ["太鼓", "和太鼓", "大太鼓", "締太鼓", "鼓"],
    ids: ["inst-taiko", "genre-enka", "mood-triumphant"],
    bonus: 6,
  },
  {
    keywords: ["三味線", "三絃", "琴", "尺八", "篠笛", "能管"],
    ids: ["inst-shamisen", "genre-enka", "genre-showa-kayokyoku"],
    bonus: 6,
  },
  // ── 船・海・航海系 ─────────────────────────────────────────────────────────
  {
    keywords: [
      "船", "帆船", "漁船", "港", "航海", "錨", "漁師", "海岸", "岸壁", "大海",
      "大漁旗", "汽船", "渡し船",
    ],
    ids: [
      "genre-enka",
      "inst-taiko",
      "mood-triumphant",
      "mood-melancholic",
      "struct-theatrical-intro",
    ],
    bonus: 5,
  },
  // ── 企業・規約・事務・職場系 ──────────────────────────────────────────────
  {
    keywords: [
      "企業", "規約", "利用規約", "契約", "会議", "ハンコ", "判子", "稟議",
      "書類", "署名", "承認", "社内", "オフィス", "業務", "部長", "課長",
      "社員", "社長", "印鑑", "決裁", "上司", "部下", "会社", "同僚",
      "コンプライアンス", "規定", "マニュアル",
    ],
    ids: [
      "genre-corporate-electro-funk",
      "mood-deadpan",
      "mood-ironic",
      "inst-clavinet",
      "tex-dry-vocal-booth",
      "vocal-spoken",
      "tex-fluorescent-hum",
    ],
    bonus: 6,
  },
  // ── 夜・都会・ネオン・クラブ系 ───────────────────────────────────────────
  {
    keywords: [
      "夜", "ネオン", "都会", "街灯", "路地", "クラブ", "ダンス", "摩天楼",
      "深夜", "ミラーボール", "夜景", "繁華街", "バー", "酒場", "ナイトクラブ",
      "フロア", "DJブース",
    ],
    ids: [
      "genre-nu-disco",
      "genre-french-house",
      "tex-neon-shimmer",
      "tex-glossy-club-mix",
      "mood-romantic",
      "mood-melancholic",
    ],
    bonus: 5,
  },
  // ── 猫・生活・昭和家屋・日常系 ───────────────────────────────────────────
  {
    keywords: [
      "猫", "三毛猫", "子猫", "野良猫", "縁側", "座布団", "茶碗", "畳",
      "ちゃぶ台", "古い家", "木造", "昼下がり", "窓辺", "障子", "和室",
      "縁", "日向", "蒸し暑い", "縁側", "庭", "物干し", "雨戸",
    ],
    ids: [
      "tex-lofi-compression",
      "tex-vinyl-crackle",
      "tex-tape-saturation",
      "vocal-spoken",
      "mood-melancholic",
      "mood-deadpan",
      "genre-showa-kayokyoku",
    ],
    bonus: 5,
  },
  // ── 工場・金属・町工場・製造系 ───────────────────────────────────────────
  {
    keywords: [
      "工場", "町工場", "溶接", "旋盤", "切断", "機械", "作業着", "火花",
      "油", "ボルト", "製造", "部品", "鉄骨", "鉄板", "炉", "鋳物",
      "プレス", "ベルトコンベア",
    ],
    ids: [
      "genre-industrial-rock",
      "genre-breakbeat-rock",
      "inst-distorted-breakbeats",
      "tex-dry-vocal-booth",
      "mood-deadpan",
      "mood-unsettling",
    ],
    bonus: 6,
  },
  {
    keywords: ["鉄", "金属", "スチール", "鋼", "鍛造"],
    ids: ["genre-industrial-rock", "inst-distorted-breakbeats", "mood-unsettling"],
    bonus: 4,
  },
  // ── 昭和・レトロ・懐古系 ──────────────────────────────────────────────────
  {
    keywords: [
      "昭和", "レトロ", "懐かしい", "昔", "古い", "黒電話", "古写真",
      "セピア", "白黒", "昭和レトロ", "古びた",
    ],
    ids: [
      "genre-showa-kayokyoku",
      "tex-vinyl-crackle",
      "tex-tape-saturation",
      "mood-melancholic",
      "genre-enka",
    ],
    bonus: 5,
  },
  // ── 廃墟・孤独・不在系 ────────────────────────────────────────────────────
  {
    keywords: [
      "廃墟", "廃校", "廃工場", "朽ちた", "荒廃", "孤独", "誰もいない",
      "空っぽ", "取り残された", "忘れられた", "静寂", "廃れた", "廃村",
      "廃屋",
    ],
    ids: [
      "mood-desolate",
      "tex-hollow-room-echo",
      "genre-ceremonial-ambient",
      "mood-eerie",
      "mood-melancholic",
      "tex-dry-vocal-booth",
    ],
    bonus: 6,
  },
  // ── 儀式・神聖・荘厳系 ────────────────────────────────────────────────────
  {
    keywords: [
      "儀式", "神聖", "祈り", "礼拝", "聖堂", "荘厳", "厳か", "奉納",
      "お祓い", "巫女", "神官", "仏", "読経", "葬儀", "冥福",
    ],
    ids: [
      "genre-ceremonial-ambient",
      "mood-sacred",
      "vocal-gospel-choir",
      "struct-theatrical-intro",
      "struct-spoken-intro",
    ],
    bonus: 6,
  },
  // ── 映画・叙事詩・英雄系 ──────────────────────────────────────────────────
  {
    keywords: [
      "映画", "叙事詩", "英雄", "冒険", "戦い", "壮大", "宇宙", "銀河",
      "伝説", "叙情", "史詩", "叙事",
    ],
    ids: [
      "mood-cinematic",
      "inst-string-section",
      "tex-cinematic-reverb",
      "mood-triumphant",
      "inst-brass-stabs",
    ],
    bonus: 5,
  },
  // ── ゴシック・暗黒・呪い系 ────────────────────────────────────────────────
  {
    keywords: [
      "呪い", "悪魔", "暗黒", "地獄", "血", "腐敗", "骸骨", "棺",
      "黒ミサ", "魔女", "幽霊", "妖怪", "鬼", "怨霊",
    ],
    ids: [
      "genre-gothic-waltz",
      "genre-dark-electro-swing",
      "mood-eerie",
      "mood-unsettling",
      "mood-sacred",
    ],
    bonus: 5,
  },
  // ── AI・デジタル・開発系（弱め） ─────────────────────────────────────────
  {
    keywords: [
      "AI", "プロンプト", "UI", "ブラウザ", "Claude", "ChatGPT",
      "タグ", "コード", "プログラム", "デジタル",
    ],
    ids: [
      "genre-minimal-post-pop",
      "vocal-spoken",
      "tex-dry-vocal-booth",
      "mood-deadpan",
      "mood-ironic",
    ],
    bonus: 3,
  },
  // ── 子供・夢・無邪気系 ────────────────────────────────────────────────────
  {
    keywords: [
      "子供", "子ども", "幼い", "夢", "メルヘン", "おとぎ話", "おもちゃ",
      "砂場", "秘密基地", "かくれんぼ",
    ],
    ids: [
      "mood-melancholic",
      "mood-absurd",
      "tex-vinyl-crackle",
      "vocal-whisper",
    ],
    bonus: 4,
  },
  // ── 恋・愛・親密系 ────────────────────────────────────────────────────────
  {
    keywords: [
      "恋", "愛", "好き", "君", "あなた", "二人", "抱擁", "口づけ",
      "恋人", "愛しい", "想い", "恋愛",
    ],
    ids: [
      "mood-romantic",
      "vocal-whisper",
      "vocal-duet",
      "mood-melancholic",
    ],
    bonus: 4,
  },
  // ── 海外・グローバル・移民系 ──────────────────────────────────────────────
  {
    keywords: [
      "ジャズ", "ブルース", "ソウル", "ゴスペル", "ファンク", "ヒップホップ",
      "レゲエ", "ディスコ",
    ],
    ids: [
      "genre-neo-soul",
      "genre-digital-motown",
      "inst-walking-bass",
      "inst-brass-stabs",
      "vocal-gospel-choir",
    ],
    bonus: 4,
  },
] as const;

/**
 * Recommends up to 12 Prompt Library items from a WorldForge expansion result.
 *
 * Two-layer scoring:
 *  1. English corpus matching — unchanged from original logic.
 *     Scans genreHint / atmosphere / moodWords / instruments / vocalStyle /
 *     soundDirection / stylePromptDraft against each item's label, tags,
 *     aliases and promptText tokens.
 *  2. Japanese keyword mapping — additive bonus.
 *     JP_KEYWORD_MAP entries are checked against the full Japanese corpus
 *     (seed text + emotion + texture + scene + objects + contradiction +
 *     lyricsDirection). Any matched entry adds its bonus score directly
 *     to the listed item IDs.
 *
 * Results are category-balanced (≤ REC_CAT_MAX per category) and capped at 12.
 *
 * @param expansion WorldForge expansion result
 * @param seed      Optional raw world seed text (input.theme) for direct JP matching
 */
export function recommendFromExpansion(
  expansion: WorldExpansion,
  seed?: string,
): PromptLibraryItem[] {
  const md = expansion.musicDirection;

  // ── 1. English corpus (high-signal) ──────────────────────────────────────
  const corpusEN = [
    md.genreHint,
    md.atmosphere,
    md.vocalStyle,
    md.tempoFeel,
    ...md.instruments,
    ...md.moodWords,
    ...(expansion.soundDirection ?? []),
    expansion.stylePromptDraft ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // ── 2. Japanese corpus (full — seed + all JP expansion fields) ────────────
  const corpusJP = [
    seed ?? "",
    ...expansion.emotion,
    ...expansion.texture,
    ...expansion.scene,
    ...expansion.objects,
    ...(expansion.contradiction ?? []),
    expansion.lyricsDirection ?? "",
  ].join(" ");

  // ── 3. Build JP bonus map: item-id → cumulative bonus score ──────────────
  const bonusMap = new Map<string, number>();
  for (const { keywords, ids, bonus } of JP_KEYWORD_MAP) {
    const matched = keywords.some((kw) => corpusJP.includes(kw));
    if (matched) {
      for (const id of ids) {
        bonusMap.set(id, (bonusMap.get(id) ?? 0) + bonus);
      }
    }
  }

  // ── 4. Score every eligible item ─────────────────────────────────────────
  const scored = PROMPT_LIBRARY
    .filter((item) => RECOMMEND_CATS.includes(item.category))
    .map((item) => {
      let score = 0;

      // EN corpus: check item terms (label / tags / aliases / promptText tokens)
      const itemTerms = [
        item.label,
        ...item.tags,
        ...item.aliases,
        ...item.promptText.split(/[\s,/]+/).filter((w) => w.length > 2),
      ];
      for (const term of itemTerms) {
        const t = term.toLowerCase().trim();
        if (t.length < 3) continue;
        if (corpusEN.includes(t)) {
          score += t.length >= 6 ? 4 : 2;
        }
      }

      // JP description overlap (weak, general signal)
      if (corpusJP) {
        const jpTokens = corpusJP
          .split(/[\s、。「」\n]+/)
          .filter((w) => w.length > 1);
        for (const w of jpTokens) {
          if (item.description.includes(w)) score += 1;
        }
      }

      // JP keyword map bonus (strong, thematic signal)
      score += bonusMap.get(item.id) ?? 0;

      return { item, score };
    });

  // ── 5. Keep only positive matches, sort descending ───────────────────────
  const ranked = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  // ── 6. Category-balanced selection (≤ REC_CAT_MAX, total ≤ 12) ───────────
  const catCount: Partial<Record<PromptLibraryCategory, number>> = {};
  const results: PromptLibraryItem[] = [];

  for (const { item } of ranked) {
    const max   = REC_CAT_MAX[item.category] ?? 2;
    const count = catCount[item.category] ?? 0;
    if (count >= max) continue;
    catCount[item.category] = count + 1;
    results.push(item);
    if (results.length >= 12) break;
  }

  return results;
}

// ─── Search / retrieval helpers ───────────────────────────────────────────────

/**
 * Full-text search across label, promptText, description, aliases, and tags.
 * Returns items sorted by match quality (exact label match first, then partial).
 */
export function searchPromptLibrary(query: string): PromptLibraryItem[] {
  if (!query.trim()) return PROMPT_LIBRARY;

  const q = query.toLowerCase().trim();

  const scored = PROMPT_LIBRARY.map((item) => {
    let score = 0;

    if (item.label.toLowerCase() === q)                   score += 100;
    else if (item.label.toLowerCase().startsWith(q))      score +=  60;
    else if (item.label.toLowerCase().includes(q))        score +=  40;

    if (item.promptText.toLowerCase().includes(q))        score +=  20;
    if (item.description.toLowerCase().includes(q))       score +=  10;
    if (item.aliases.some((a) => a.toLowerCase().includes(q))) score += 30;
    if (item.tags.some((t) => t.toLowerCase().includes(q)))    score += 15;

    return { item, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/**
 * Returns all items belonging to the given category.
 * Order matches declaration order in PROMPT_LIBRARY.
 */
export function getPromptItemsByCategory(
  category: PromptLibraryCategory
): PromptLibraryItem[] {
  return PROMPT_LIBRARY.filter((item) => item.category === category);
}

/**
 * Returns a single item by its unique id, or undefined if not found.
 */
export function getPromptItemById(id: string): PromptLibraryItem | undefined {
  return PROMPT_LIBRARY.find((item) => item.id === id);
}
