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

  // ════════════════════════════════════════════════════════════════════════════
  // GENRE — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "genre-acid-jazz",
    label: "acid jazz",
    category: "genre",
    promptText: "acid jazz, funky jazz, live drums, rhodes, wah guitar",
    description: "生ドラムとローズピアノ、ワウギターが絡むグルーヴィーなアシッド・ジャズ。",
    aliases: ["アシッドジャズ", "funky jazz", "groove jazz"],
    tags: ["genre", "jazz", "funk", "groove", "acid"],
  },
  {
    id: "genre-neo-funk",
    label: "neo funk",
    category: "genre",
    promptText: "neo funk, tight groove, slap bass, clean guitar stabs, modern production",
    description: "現代的なプロダクションで磨き上げた新世代ファンク。タイトなグルーヴと切れ味鋭いギター・スタブ。",
    aliases: ["ネオファンク", "modern funk", "new funk"],
    tags: ["genre", "funk", "groove", "bass", "modern"],
  },
  {
    id: "genre-gothic-cabaret",
    label: "gothic cabaret",
    category: "genre",
    promptText: "gothic cabaret, dark theatrical, piano noir, dramatic vocals, cabaret ballad",
    description: "暗闇のキャバレー。ピアノ・ノワールと演劇的な歌唱が絡む退廃的なゴシック・キャバレー。",
    aliases: ["ゴシックキャバレー", "dark cabaret", "piano noir"],
    tags: ["genre", "gothic", "cabaret", "theatrical", "dark"],
  },
  {
    id: "genre-dark-cabaret",
    label: "dark cabaret",
    category: "genre",
    promptText: "dark cabaret, vaudeville noir, circus dark, accordion, sinister waltz",
    description: "不穏なヴォードヴィル美学。サーカス的で歪んだキャバレー・サウンド。",
    aliases: ["ダークキャバレー", "vaudeville noir", "sinister circus"],
    tags: ["genre", "dark", "cabaret", "vaudeville", "circus"],
  },
  {
    id: "genre-baroque-pop",
    label: "baroque pop",
    category: "genre",
    promptText: "baroque pop, harpsichord, chamber strings, ornate melody, orchestral pop",
    description: "バロック装飾とポップの融合。チェンバロや室内弦楽器が彩る緻密なアレンジ。",
    aliases: ["バロックポップ", "chamber pop", "orchestral pop"],
    tags: ["genre", "baroque", "pop", "classical", "chamber"],
  },
  {
    id: "genre-cinematic-rock",
    label: "cinematic rock",
    category: "genre",
    promptText: "cinematic rock, epic guitar, orchestral backdrop, wide dynamics, film score rock",
    description: "映画スコアの壮大さとロックのダイナミクスが融合したシネマティック・ロック。",
    aliases: ["シネマティックロック", "epic rock", "film rock"],
    tags: ["genre", "rock", "cinematic", "epic", "orchestral"],
  },
  {
    id: "genre-breakbeat-punk",
    label: "breakbeat punk",
    category: "genre",
    promptText: "breakbeat punk, chopped breakbeats, distorted guitar, raw energy, lo-fi chaos",
    description: "チョップされたブレイクビートとディストーション・ギターが衝突するローファイ・カオス。",
    aliases: ["ブレイクビートパンク", "punk breakbeat", "lo-fi punk"],
    tags: ["genre", "punk", "breakbeat", "raw", "chaos"],
  },
  {
    id: "genre-big-beat",
    label: "big beat",
    category: "genre",
    promptText: "big beat, massive breakbeats, distorted bass, euphoric energy, rave rock",
    description: "マッシブなブレイクビートと歪んだベースが爆発するビッグ・ビート。90年代レイヴ・ロックのエネルギー。",
    aliases: ["ビッグビート", "rave rock", "breakbeat electronic"],
    tags: ["genre", "big beat", "breakbeat", "electronic", "rave"],
  },
  {
    id: "genre-industrial-funk",
    label: "industrial funk",
    category: "genre",
    promptText: "industrial funk, mechanical groove, metal percussion, factory rhythm, harsh funk",
    description: "工場の機械音をリズムに転化した過酷なファンク。金属打撃とグルーヴの衝突。",
    aliases: ["インダストリアルファンク", "factory funk", "metal funk"],
    tags: ["genre", "industrial", "funk", "mechanical", "metal"],
  },
  {
    id: "genre-digital-soul",
    label: "digital soul",
    category: "genre",
    promptText: "digital soul, chopped vocals, quantized groove, pitched samples, modern R&B texture",
    description: "刻まれたボーカルと精密なグルーヴが融合するデジタル・ソウル。現代R&Bのテクスチャ。",
    aliases: ["デジタルソウル", "chopped soul", "quantized R&B"],
    tags: ["genre", "soul", "digital", "R&B", "samples"],
  },
  {
    id: "genre-uk-garage",
    label: "UK garage",
    category: "genre",
    promptText: "UK garage, shuffled 2-step, pitched vocals, sub bass, underground London",
    description: "シャッフルされた2ステップとサブベース、ピッチ変換ボーカルのUKガラージ。",
    aliases: ["UKガラージ", "2-step", "speed garage"],
    tags: ["genre", "UK garage", "2-step", "electronic", "London"],
  },
  {
    id: "genre-future-garage",
    label: "future garage",
    category: "genre",
    promptText: "future garage, pitched vocal chops, atmospheric pads, sub bass, melancholy electronic",
    description: "雰囲気豊かなパッドとサブベースが漂うフューチャー・ガラージ。内省的な電子音楽。",
    aliases: ["フューチャーガラージ", "atmospheric garage", "deep garage"],
    tags: ["genre", "garage", "atmospheric", "electronic", "deep"],
  },
  {
    id: "genre-liquid-dnb",
    label: "liquid drum and bass",
    category: "genre",
    promptText: "liquid drum and bass, rolling breakbeats, lush pads, soulful bass, fluid melody",
    description: "なめらかに流れるブレイクビートとソウルフルなベース、豊かなパッドのリキッドD&B。",
    aliases: ["リキッドD&B", "liquid DnB", "soulful DnB"],
    tags: ["genre", "drum and bass", "liquid", "soulful", "electronic"],
  },
  {
    id: "genre-synthwave",
    label: "synthwave",
    category: "genre",
    promptText: "synthwave, analog synthesizer, gated reverb drums, 80s retro future, neon aesthetic",
    description: "80年代レトロフューチャーの美学。アナログシンセとゲートリバーブ・ドラムで彩るシンスウェーブ。",
    aliases: ["シンスウェーブ", "retrowave", "80s synth"],
    tags: ["genre", "synthwave", "80s", "retro", "electronic"],
  },
  {
    id: "genre-city-funk",
    label: "city funk",
    category: "genre",
    promptText: "city funk, urban groove, tight rhythm section, brass, midnight city",
    description: "夜の都市を走るようなタイトなリズムとブラス・セクションの都会的ファンク。",
    aliases: ["シティファンク", "urban funk", "midnight funk"],
    tags: ["genre", "funk", "city", "urban", "groove"],
  },
  {
    id: "genre-kayokyoku-disco",
    label: "kayokyoku disco",
    category: "genre",
    promptText: "kayokyoku disco, Japanese pop disco, city pop groove, Showa dance floor, strings and synth bass",
    description: "昭和歌謡のメロディーにディスコ・グルーヴを融合させた歌謡ディスコ。シティポップの源流。",
    aliases: ["歌謡ディスコ", "歌謡曲ディスコ", "Showa disco"],
    tags: ["genre", "kayokyoku", "disco", "Japanese", "Showa"],
  },
  {
    id: "genre-matsuri-funk",
    label: "matsuri funk",
    category: "genre",
    promptText: "matsuri funk, festival groove, taiko beats, shamisen riff, summer night dance",
    description: "夏祭りの熱狂をファンクに変換。太鼓のビートと三味線リフが踊り出す。",
    aliases: ["祭りファンク", "festival funk", "和ファンク"],
    tags: ["genre", "matsuri", "funk", "Japanese", "festival"],
  },
  {
    id: "genre-festival-techno",
    label: "festival techno",
    category: "genre",
    promptText: "festival techno, driving kick, euphoric drop, outdoor rave, massive crowd",
    description: "野外フェスの広大な空間に対応する駆動力あるキックとユーフォリックなドロップのフェスティバル・テクノ。",
    aliases: ["フェスティバルテクノ", "outdoor techno", "peak time techno"],
    tags: ["genre", "techno", "festival", "rave", "driving"],
  },
  {
    id: "genre-shrine-rave",
    label: "shrine rave",
    category: "genre",
    promptText: "shrine rave, torii gate techno, Japanese spirituality, ritualistic bass, sacred dance floor",
    description: "神社の聖域でレイヴが行われる神秘的なビジョン。鳥居テクノと儀式的ベースの融合。",
    aliases: ["神社レイヴ", "torii techno", "sacred rave"],
    tags: ["genre", "rave", "Japanese", "spiritual", "techno"],
  },
  {
    id: "genre-ambient-folk",
    label: "ambient folk",
    category: "genre",
    promptText: "ambient folk, acoustic guitar, field recording, sparse texture, nature sounds",
    description: "フィールドレコーディングと疎なアコースティック・ギターが溶け合うアンビエント・フォーク。",
    aliases: ["アンビエントフォーク", "nature folk", "sparse acoustic"],
    tags: ["genre", "ambient", "folk", "acoustic", "nature"],
  },
  {
    id: "genre-bedroom-pop",
    label: "bedroom pop",
    category: "genre",
    promptText: "bedroom pop, lo-fi recording, intimate vocals, DIY production, warm tape",
    description: "自室で録音したようなDIYプロダクションとウォームなテープ感の寝室ポップ。",
    aliases: ["ベッドルームポップ", "lo-fi pop", "DIY pop"],
    tags: ["genre", "bedroom pop", "lo-fi", "DIY", "intimate"],
  },
  {
    id: "genre-lofi-soul",
    label: "lo-fi soul",
    category: "genre",
    promptText: "lo-fi soul, vinyl crackle, dusty samples, mellow groove, emotional warmth",
    description: "ビニール盤のプチプチノイズとダスティなサンプルに乗るメロウなグルーヴのローファイ・ソウル。",
    aliases: ["ローファイソウル", "dusty soul", "mellow soul"],
    tags: ["genre", "lo-fi", "soul", "vinyl", "mellow"],
  },
  {
    id: "genre-spoken-word-pop",
    label: "spoken word pop",
    category: "genre",
    promptText: "spoken word pop, narrative vocal, poetry over beat, minimal music, spoken delivery",
    description: "詩の朗読がビートの上に乗るスポークン・ワード・ポップ。語りと音楽の境界を溶かす。",
    aliases: ["スポークンワードポップ", "poetry pop", "narrative pop"],
    tags: ["genre", "spoken word", "pop", "poetry", "narrative"],
  },
  {
    id: "genre-comedy-funk",
    label: "comedy funk",
    category: "genre",
    promptText: "comedy funk, playful groove, cartoon brass, silly bass, fun and absurd",
    description: "カートゥーン的なブラスとシリーなベースが跳ね回るコメディ・ファンク。",
    aliases: ["コメディファンク", "cartoon funk", "silly funk"],
    tags: ["genre", "comedy", "funk", "playful", "absurd"],
  },
  {
    id: "genre-absurdist-pop",
    label: "absurdist pop",
    category: "genre",
    promptText: "absurdist pop, surreal lyrics, unexpected chord changes, off-kilter production",
    description: "シュールな歌詞と予測不能なコード進行、奇妙なプロダクションのアブサーディスト・ポップ。",
    aliases: ["アブサーディストポップ", "surreal pop", "weird pop"],
    tags: ["genre", "absurdist", "pop", "surreal", "weird"],
  },
  {
    id: "genre-corporate-disco",
    label: "corporate disco",
    category: "genre",
    promptText: "corporate disco, elevator music gone wrong, office floor groove, ironic funk, 9-to-5 dance",
    description: "職場のエレベーターBGMが突然ダンスフロアに変貌するコーポレート・ディスコ。皮肉的ファンク。",
    aliases: ["コーポレートディスコ", "office disco", "elevator funk"],
    tags: ["genre", "disco", "corporate", "ironic", "office"],
  },
  {
    id: "genre-electro-gospel",
    label: "electro gospel",
    category: "genre",
    promptText: "electro gospel, gospel choir over electronic beat, spiritual rave, redemption drop",
    description: "電子ビートの上に降臨するゴスペル・クワイア。スピリチュアルなレイヴ体験としての福音。",
    aliases: ["エレクトロゴスペル", "electronic gospel", "spiritual rave"],
    tags: ["genre", "gospel", "electronic", "spiritual", "choir"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MOOD — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "mood-bittersweet",
    label: "bittersweet",
    category: "mood",
    promptText: "bittersweet, tender sadness, nostalgic warmth, joy tinged with loss",
    description: "喜びと悲しみが混ざり合う甘苦い感情。喪失の影が滲む温かな記憶。",
    aliases: ["甘苦い", "哀愁と温かさ", "tender melancholy"],
    tags: ["mood", "bittersweet", "nostalgic", "tender", "emotional"],
  },
  {
    id: "mood-lonely",
    label: "lonely",
    category: "mood",
    promptText: "lonely, solitary, isolated, quiet ache of solitude, empty presence",
    description: "静かな孤独の痛み。人の気配がありながら空洞が広がる孤立感。",
    aliases: ["孤独", "孤立", "solitary", "isolated"],
    tags: ["mood", "lonely", "solitary", "isolation", "quiet"],
  },
  {
    id: "mood-nostalgic",
    label: "nostalgic",
    category: "mood",
    promptText: "nostalgic, longing for the past, sepia memories, warm distance",
    description: "過去への郷愁。セピアがかった記憶の温もりと遠さ。",
    aliases: ["懐かしい", "郷愁", "wistful", "sepia"],
    tags: ["mood", "nostalgic", "past", "memory", "warm"],
  },
  {
    id: "mood-playful",
    label: "playful",
    category: "mood",
    promptText: "playful, bouncy, lighthearted, fun energy, carefree",
    description: "弾むような軽やかさと無邪気な楽しさ。遊び心に満ちたエネルギー。",
    aliases: ["遊び心", "軽やか", "bouncy", "carefree"],
    tags: ["mood", "playful", "fun", "bouncy", "lighthearted"],
  },
  {
    id: "mood-sarcastic",
    label: "sarcastic",
    category: "mood",
    promptText: "sarcastic, biting wit, dry humor, ironic distance, cutting edge",
    description: "切れ味鋭い皮肉とドライなユーモア。冷笑的な距離感と棘のある洞察。",
    aliases: ["皮肉", "サルカスティック", "cutting wit", "dry irony"],
    tags: ["mood", "sarcastic", "ironic", "wit", "dry"],
  },
  {
    id: "mood-cynical",
    label: "cynical",
    category: "mood",
    promptText: "cynical, world-weary, disenchanted, bitter realism, seen-it-all",
    description: "世界に幻滅した冷笑的な視点。苦い現実主義と「すべて見通した」倦怠感。",
    aliases: ["冷笑的", "シニカル", "disenchanted", "world-weary"],
    tags: ["mood", "cynical", "bitter", "disenchanted", "realism"],
  },
  {
    id: "mood-ecstatic",
    label: "ecstatic",
    category: "mood",
    promptText: "ecstatic, euphoric, transcendent joy, overwhelming bliss, peak emotion",
    description: "法悦とも呼べる圧倒的な喜び。感情が頂点に達する超越的な恍惚感。",
    aliases: ["恍惚", "法悦", "euphoric", "transcendent"],
    tags: ["mood", "ecstatic", "euphoric", "transcendent", "peak"],
  },
  {
    id: "mood-haunted",
    label: "haunted",
    category: "mood",
    promptText: "haunted, ghost of the past, lingering presence, dread and longing",
    description: "過去の亡霊に取り憑かれたような感覚。恐れと渇望が混在する残留する存在感。",
    aliases: ["取り憑かれた", "幽霊的", "ghost-like", "lingering dread"],
    tags: ["mood", "haunted", "ghost", "dread", "lingering"],
  },
  {
    id: "mood-ritualistic",
    label: "ritualistic",
    category: "mood",
    promptText: "ritualistic, ceremonial gravity, repetitive hypnosis, sacred intention",
    description: "反復と儀式の重力。聖なる意図が込められた催眠的な荘重さ。",
    aliases: ["儀式的", "呪術的", "ceremonial", "hypnotic ritual"],
    tags: ["mood", "ritualistic", "ceremonial", "hypnotic", "sacred"],
  },
  {
    id: "mood-feverish",
    label: "feverish",
    category: "mood",
    promptText: "feverish, delirious intensity, overheated urgency, fever dream energy",
    description: "高熱にうなされるような錯乱した強度。現実と夢の境界が溶ける発熱的な緊迫感。",
    aliases: ["熱に浮かされた", "fever dream", "delirious", "overheated"],
    tags: ["mood", "feverish", "delirious", "intense", "fever"],
  },
  {
    id: "mood-elegant",
    label: "elegant",
    category: "mood",
    promptText: "elegant, refined, poised, understated grace, sophisticated restraint",
    description: "洗練された品格と控えめな優雅さ。過剰を排した洗練の静寂。",
    aliases: ["エレガント", "優雅", "refined", "sophisticated"],
    tags: ["mood", "elegant", "refined", "sophisticated", "grace"],
  },
  {
    id: "mood-sleazy",
    label: "sleazy",
    category: "mood",
    promptText: "sleazy, low-life glamour, dirty groove, morally questionable, seedy underbelly",
    description: "退廃的な魅力と薄汚れたグルーヴ。道徳的に疑わしい魅力を持つ夜の底辺。",
    aliases: ["退廃的", "スリーシー", "dirty glamour", "seedy"],
    tags: ["mood", "sleazy", "dirty", "low-life", "groove"],
  },
  {
    id: "mood-heroic",
    label: "heroic",
    category: "mood",
    promptText: "heroic, noble courage, epic determination, triumphant struggle, righteous power",
    description: "気高い勇気と壮大な意志。正義の力と勝利への闘争を体現する英雄的な気概。",
    aliases: ["英雄的", "勇壮", "noble", "triumphant courage"],
    tags: ["mood", "heroic", "noble", "epic", "courage"],
  },
  {
    id: "mood-intimate",
    label: "intimate",
    category: "mood",
    promptText: "intimate, close and personal, hushed confessional, private moment, soft disclosure",
    description: "ふたりだけの囁き声。告白のような静かな親密さと柔らかな開示。",
    aliases: ["親密", "内密", "hushed", "confessional"],
    tags: ["mood", "intimate", "close", "quiet", "personal"],
  },
  {
    id: "mood-hollow",
    label: "hollow",
    category: "mood",
    promptText: "hollow, empty inside, emotional numbness, hollow chest, vacant presence",
    description: "内側が空洞になったような感覚。感情の麻痺と空虚な存在感。",
    aliases: ["空洞", "虚無", "empty", "numb"],
    tags: ["mood", "hollow", "empty", "numb", "void"],
  },
  {
    id: "mood-bureaucratic",
    label: "bureaucratic",
    category: "mood",
    promptText: "bureaucratic, procedural flatness, form-filling dread, institutional grey, rule-bound",
    description: "書類と手続きの重力。規則に縛られた灰色の制度的な平坦さ。",
    aliases: ["官僚的", "事務的", "procedural", "institutional"],
    tags: ["mood", "bureaucratic", "procedural", "grey", "institutional"],
  },
  {
    id: "mood-devotional",
    label: "devotional",
    category: "mood",
    promptText: "devotional, worshipful intensity, total dedication, reverent surrender, obsessive love",
    description: "全身を捧げるような献身と崇拝の強度。執拗な愛と恭順の感情。",
    aliases: ["献身的", "崇拝", "worshipful", "reverent"],
    tags: ["mood", "devotional", "worship", "surrender", "dedicated"],
  },
  {
    id: "mood-rebellious",
    label: "rebellious",
    category: "mood",
    promptText: "rebellious, defiant energy, anti-authority, raw resistance, punk attitude",
    description: "権威への反抗と生のレジスタンス。パンク的な反骨精神と挑発的なエネルギー。",
    aliases: ["反抗的", "レベリアス", "defiant", "anti-authority"],
    tags: ["mood", "rebellious", "defiant", "punk", "resistance"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // VOCAL — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "vocal-low-male",
    label: "low male vocal",
    category: "vocal",
    promptText: "low male vocal, deep baritone, resonant depth, gravelly presence",
    description: "重厚な低音男性ボーカル。共鳴する深さとざらつきのある存在感。",
    aliases: ["低音男性", "バリトン", "deep baritone", "gravelly"],
    tags: ["vocal", "male", "low", "baritone", "deep"],
  },
  {
    id: "vocal-nasal-male",
    label: "nasal male vocal",
    category: "vocal",
    promptText: "nasal male vocal, adenoidal tone, quirky timbre, distinctive voice",
    description: "鼻に抜ける独特の音色の男性ボーカル。クセのある個性的な声質。",
    aliases: ["鼻声", "鼻にかかった声", "adenoidal", "nasal"],
    tags: ["vocal", "male", "nasal", "quirky", "distinctive"],
  },
  {
    id: "vocal-raspy-male",
    label: "raspy male vocal",
    category: "vocal",
    promptText: "raspy male vocal, rough and gritty, worn voice, blues grit, lived-in sound",
    description: "ブルースの渋みとざらついたテクスチャの男性ボーカル。歴史が滲む声。",
    aliases: ["ハスキー男性", "gritty vocal", "rough voice", "blues voice"],
    tags: ["vocal", "male", "raspy", "gritty", "blues"],
  },
  {
    id: "vocal-theatrical",
    label: "theatrical vocal",
    category: "vocal",
    promptText: "theatrical vocal, dramatic delivery, stage presence, projected voice, musical theatre",
    description: "舞台映えするドラマチックな歌唱。ミュージカル的な発声と強烈な舞台存在感。",
    aliases: ["シアトリカル", "演劇的", "dramatic", "stage vocal"],
    tags: ["vocal", "theatrical", "dramatic", "musical theatre", "stage"],
  },
  {
    id: "vocal-cabaret",
    label: "cabaret vocal",
    category: "vocal",
    promptText: "cabaret vocal, intimate storytelling, torch song, smoky delivery, nightclub singer",
    description: "ナイトクラブのトーチ・シンガー。煙がくゆる中での親密な語り口調の歌唱。",
    aliases: ["キャバレー歌手", "torch singer", "nightclub vocal"],
    tags: ["vocal", "cabaret", "torch song", "intimate", "smoky"],
  },
  {
    id: "vocal-soulful-female",
    label: "soulful female vocal",
    category: "vocal",
    promptText: "soulful female vocal, deep emotion, powerful R&B, gospel influence, raw feeling",
    description: "魂の深みから湧き出るパワフルな女性ボーカル。ゴスペルの影響を受けた生の感情表現。",
    aliases: ["ソウルフル女性", "R&Bボーカル", "powerful female", "gospel female"],
    tags: ["vocal", "female", "soulful", "R&B", "gospel"],
  },
  {
    id: "vocal-gospel-lead",
    label: "gospel lead vocal",
    category: "vocal",
    promptText: "gospel lead vocal, call and response lead, testifying delivery, church power",
    description: "教会に響き渡るゴスペルのリード・ボーカル。コール＆レスポンスを牽引する証言の歌声。",
    aliases: ["ゴスペルリード", "church vocal", "testifying"],
    tags: ["vocal", "gospel", "lead", "church", "powerful"],
  },
  {
    id: "vocal-chant",
    label: "chant vocal",
    category: "vocal",
    promptText: "chant, monotone ritual singing, meditative repetition, trance vocal",
    description: "単調な音程で反復されるチャント。瞑想的なトランス状態へ誘う儀礼的な歌声。",
    aliases: ["チャント", "詠唱", "monotone chant", "ritual vocal"],
    tags: ["vocal", "chant", "ritual", "monotone", "trance"],
  },
  {
    id: "vocal-group-chant",
    label: "group chant",
    category: "vocal",
    promptText: "group chant, unison voices, crowd vocal, mass singing, communal power",
    description: "群衆が一体となって歌うユニゾンのグループ・チャント。集合的エネルギーの爆発。",
    aliases: ["グループチャント", "群衆の歌声", "crowd vocal", "mass chant"],
    tags: ["vocal", "group", "chant", "crowd", "unison"],
  },
  {
    id: "vocal-whispered-spoken",
    label: "whispered spoken vocal",
    category: "vocal",
    promptText: "whispered spoken word, breathy narration, intimate whisper, hushed confession",
    description: "息が漏れるような囁き声で語られるスポークン・ワード。極めて親密な告白の形式。",
    aliases: ["囁き語り", "ウィスパード", "breathy narration", "hushed"],
    tags: ["vocal", "whisper", "spoken", "breathy", "intimate"],
  },
  {
    id: "vocal-robotic-spoken",
    label: "robotic spoken vocal",
    category: "vocal",
    promptText: "robotic vocal, synthesized speech, text-to-speech affect, machine narration",
    description: "テキスト読み上げのような合成音声。機械が語りかける無感情なナレーション。",
    aliases: ["ロボットボーカル", "合成音声", "TTS vocal", "machine voice"],
    tags: ["vocal", "robotic", "synthesized", "TTS", "machine"],
  },
  {
    id: "vocal-megaphone",
    label: "megaphone vocal",
    category: "vocal",
    promptText: "megaphone vocal, bullhorn effect, lo-fi processed voice, announcement delivery",
    description: "拡声器を通したような歪んだ声。アナウンスメント的な発声で伝達する距離感。",
    aliases: ["メガホン", "拡声器", "bullhorn", "lo-fi processed"],
    tags: ["vocal", "megaphone", "bullhorn", "lo-fi", "processed"],
  },
  {
    id: "vocal-radio-announcer",
    label: "radio announcer vocal",
    category: "vocal",
    promptText: "radio announcer vocal, broadcasting tone, over-enunciated, AM radio warmth",
    description: "AMラジオのブロードキャスティング・トーン。過度に明瞭に発音されたアナウンサー的声質。",
    aliases: ["ラジオアナウンサー", "放送局", "broadcasting voice", "AM radio"],
    tags: ["vocal", "radio", "announcer", "broadcasting", "AM"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // INSTRUMENT — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "inst-wah-guitar",
    label: "wah guitar",
    category: "instrument",
    promptText: "wah guitar, funky wah pedal, talking guitar, expressive wah effect",
    description: "ワウ・ペダルで語りかけるようなファンキーなエクスプレッシブ・ギター。",
    aliases: ["ワウギター", "wah pedal", "talking guitar"],
    tags: ["instrument", "guitar", "wah", "funky", "pedal"],
  },
  {
    id: "inst-skank-guitar",
    label: "skank guitar",
    category: "instrument",
    promptText: "skank guitar, reggae upstroke, offbeat chop, choppy rhythm guitar",
    description: "レゲエのオフビートを刻む上昇ストロークのスカンク・ギター。",
    aliases: ["スカンクギター", "reggae guitar", "upstroke chop"],
    tags: ["instrument", "guitar", "reggae", "offbeat", "skank"],
  },
  {
    id: "inst-funk-rhythm-guitar",
    label: "funk rhythm guitar",
    category: "instrument",
    promptText: "funk rhythm guitar, tight chop, 16th note groove, chicken scratch guitar",
    description: "チキン・スクラッチとも呼ばれる16分音符を刻むタイトなファンク・リズムギター。",
    aliases: ["ファンクギター", "chicken scratch", "rhythm chop"],
    tags: ["instrument", "guitar", "funk", "rhythm", "groove"],
  },
  {
    id: "inst-gospel-organ",
    label: "gospel organ",
    category: "instrument",
    promptText: "gospel organ, Hammond B3, church organ fills, hand of god chords, spiritual swell",
    description: "教会に響くハモンドB3のゴスペル・オルガン。神の手のようなコードとスピリチュアルな膨らみ。",
    aliases: ["ゴスペルオルガン", "church organ", "Hammond B3"],
    tags: ["instrument", "organ", "gospel", "Hammond", "church"],
  },
  {
    id: "inst-hammond-organ",
    label: "Hammond organ",
    category: "instrument",
    promptText: "Hammond organ, rotary speaker, rock organ, bluesy drawbar, soul organ",
    description: "レスリー・スピーカーで回転するハモンドオルガン。ロック、ブルース、ソウルを横断する定番鍵盤。",
    aliases: ["ハモンドオルガン", "B3", "rotary organ", "Leslie"],
    tags: ["instrument", "Hammond", "organ", "rotary", "B3"],
  },
  {
    id: "inst-talk-box",
    label: "talk box",
    category: "instrument",
    promptText: "talk box, vocoder guitar, robot vocal harmonics, funky synth voice",
    description: "チューブで口に音を送り込むトーク・ボックス。ボコーダー的な人声ハーモニクスのファンキー表現。",
    aliases: ["トークボックス", "vocoder guitar", "robot harmonics"],
    tags: ["instrument", "talk box", "vocoder", "funky", "synth"],
  },
  {
    id: "inst-turntable",
    label: "turntable",
    category: "instrument",
    promptText: "turntable, DJ scratch, vinyl scratch, hip-hop turntablism, crossfader",
    description: "DJスクラッチとターンテーブリズム。ヒップホップ的なクロスフェーダー操作が生み出す音の断片。",
    aliases: ["ターンテーブル", "スクラッチ", "DJ scratch", "vinyl scratch"],
    tags: ["instrument", "turntable", "scratch", "DJ", "vinyl"],
  },
  {
    id: "inst-breakbeat-drums",
    label: "breakbeat drums",
    category: "instrument",
    promptText: "breakbeat drums, chopped loop, swing breakbeat, sampled live drums, Amen break",
    description: "チョップされた生ドラム・ループ。スウィングするブレイクビートとアーメン・ブレイクの遺伝子。",
    aliases: ["ブレイクビートドラム", "chopped breaks", "Amen break"],
    tags: ["instrument", "drums", "breakbeat", "chopped", "loop"],
  },
  {
    id: "inst-gated-drums",
    label: "gated drums",
    category: "instrument",
    promptText: "gated reverb drums, 80s power drums, Phil Collins snare, huge room reverb gate",
    description: "ゲート・リバーブを使った80年代パワー・ドラム。広大な空間を感じさせる瞬間的な残響。",
    aliases: ["ゲートドラム", "80sドラム", "gated reverb", "power snare"],
    tags: ["instrument", "drums", "gated", "reverb", "80s"],
  },
  {
    id: "inst-festival-percussion",
    label: "festival percussion",
    category: "instrument",
    promptText: "festival percussion, hand drums, congas, djembe, tribal celebration beat",
    description: "コンガ、ジャンベなどのハンドドラムが一体となる祭典的なパーカッション。",
    aliases: ["フェスティバルパーカッション", "tribal drums", "congas"],
    tags: ["instrument", "percussion", "festival", "tribal", "hand drums"],
  },
  {
    id: "inst-metallic-percussion",
    label: "metallic percussion",
    category: "instrument",
    promptText: "metallic percussion, steel drums, metal hit, industrial strike, anvil sound",
    description: "スチール・ドラムや金属打撃のメタリック・パーカッション。工場的な素材感を帯びた音。",
    aliases: ["メタリックパーカッション", "steel hit", "metal percussion"],
    tags: ["instrument", "percussion", "metal", "industrial", "steel"],
  },
  {
    id: "inst-factory-percussion",
    label: "factory percussion",
    category: "instrument",
    promptText: "factory percussion, industrial rhythm, pipe bang, bolt drop, mechanical beat",
    description: "工場の作業音をリズムに転化。パイプ打撃やボルト落下音が生み出す機械的ビート。",
    aliases: ["工場パーカッション", "industrial beat", "mechanical rhythm"],
    tags: ["instrument", "percussion", "factory", "industrial", "mechanical"],
  },
  {
    id: "inst-toy-piano",
    label: "toy piano",
    category: "instrument",
    promptText: "toy piano, childlike tinkling, small keys, innocent melody, nursery sound",
    description: "子供のおもちゃのピアノが奏でる無邪気なきらきら音。童謡的な素朴なメロディ。",
    aliases: ["トイピアノ", "おもちゃのピアノ", "childlike piano", "nursery keys"],
    tags: ["instrument", "piano", "toy", "childlike", "innocent"],
  },
  {
    id: "inst-kalimba",
    label: "kalimba",
    category: "instrument",
    promptText: "kalimba, thumb piano, African resonance, pure tones, meditative pluck",
    description: "親指で弾くカリンバ（親指ピアノ）のアフリカン・レゾナンス。瞑想的な純粋な音色。",
    aliases: ["カリンバ", "thumb piano", "mbira", "親指ピアノ"],
    tags: ["instrument", "kalimba", "thumb piano", "African", "meditative"],
  },
  {
    id: "inst-accordion",
    label: "accordion",
    category: "instrument",
    promptText: "accordion, musette, French bistro, Eastern European folk, bellow breath",
    description: "フランスのビストロからヨーロッパ民謡まで。ふいごの呼吸が命を吹き込むアコーディオン。",
    aliases: ["アコーディオン", "musette", "French accordion"],
    tags: ["instrument", "accordion", "folk", "French", "European"],
  },
  {
    id: "inst-mandolin",
    label: "mandolin",
    category: "instrument",
    promptText: "mandolin, Italian folk, bluegrass tremolo, bright picking, quick strum",
    description: "イタリア民謡からブルーグラスまで。明るいピッキングとトレモロが輝くマンドリン。",
    aliases: ["マンドリン", "bluegrass mandolin", "Italian strings"],
    tags: ["instrument", "mandolin", "folk", "bluegrass", "bright"],
  },
  {
    id: "inst-koto",
    label: "koto",
    category: "instrument",
    promptText: "koto, Japanese zither, plucked strings, traditional Japanese, pentatonic melody",
    description: "爪弾かれる絹糸の余韻。日本の伝統楽器・箏の五音音階が紡ぐ旋律。",
    aliases: ["琴", "koto", "和琴", "Japanese zither"],
    tags: ["instrument", "koto", "Japanese", "traditional", "zither"],
  },
  {
    id: "inst-shakuhachi",
    label: "shakuhachi",
    category: "instrument",
    promptText: "shakuhachi, Japanese bamboo flute, breath control, zen meditation, wabi sabi tone",
    description: "竹の一節から生まれる尺八の声。禅の呼吸と侘び寂びの音色。",
    aliases: ["尺八", "bamboo flute", "Japanese flute"],
    tags: ["instrument", "shakuhachi", "Japanese", "bamboo", "zen"],
  },
  {
    id: "inst-808-bass",
    label: "808 bass",
    category: "instrument",
    promptText: "808 bass, sub kick, boomy low end, trap bass, pitched 808",
    description: "ローエンドを揺るがすピッチドな808ベース。トラップの骨格となるサブキックの震動。",
    aliases: ["808ベース", "sub bass 808", "trap bass", "Roland 808"],
    tags: ["instrument", "bass", "808", "trap", "sub"],
  },
  {
    id: "inst-acid-bassline",
    label: "acid bassline",
    category: "instrument",
    promptText: "acid bassline, TB-303, squelchy resonant bass, acid house, filter sweep",
    description: "TB-303のぐにゃりと歪むアシッド・ベースライン。フィルタースウィープが踊るアシッド・ハウスの魂。",
    aliases: ["アシッドベース", "303 bass", "TB-303", "squelchy bass"],
    tags: ["instrument", "bass", "acid", "303", "electronic"],
  },
  {
    id: "inst-wobble-bass",
    label: "wobble bass",
    category: "instrument",
    promptText: "wobble bass, LFO modulation, dubstep bass, growl bass, frequency wobble",
    description: "LFOで変調されたぐにゃぐにゃ揺れるウォブル・ベース。ダブステップの攻撃的なグロウル。",
    aliases: ["ウォブルベース", "dubstep bass", "growl bass", "LFO bass"],
    tags: ["instrument", "bass", "wobble", "dubstep", "LFO"],
  },
  {
    id: "inst-orchestra-hits",
    label: "orchestra hits",
    category: "instrument",
    promptText: "orchestra hits, stab chords, dramatic hit, tutti chord, cinematic punch",
    description: "オーケストラが一斉に打ち込むスタブ・コード。映画的なパンチと劇的な和音の衝撃。",
    aliases: ["オーケストラヒット", "stab chords", "tutti hit", "cinematic stab"],
    tags: ["instrument", "orchestra", "hit", "stab", "cinematic"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // TEXTURE — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "tex-tape-wobble",
    label: "tape wobble",
    category: "texture",
    promptText: "tape wobble, pitch instability, wow and flutter, vintage tape degradation",
    description: "テープのワウ・フラッターによるピッチの不安定な揺らぎ。ヴィンテージ・テープ劣化の質感。",
    aliases: ["テープワウ", "wow flutter", "tape pitch drift"],
    tags: ["texture", "tape", "wobble", "vintage", "lo-fi"],
  },
  {
    id: "tex-dusty-room",
    label: "dusty room",
    category: "texture",
    promptText: "dusty room, ambient hiss, old space, forgotten place, time-worn air",
    description: "長い年月で積もった埃の部屋。忘れられた空間の環境ノイズと時間の堆積。",
    aliases: ["埃っぽい部屋", "forgotten room", "dusty ambience"],
    tags: ["texture", "dusty", "room", "vintage", "ambient"],
  },
  {
    id: "tex-warm-room",
    label: "warm room",
    category: "texture",
    promptText: "warm room reverb, cozy acoustic space, intimate live recording, body heat resonance",
    description: "温もりのある部屋の響き。人の気配と体温が染み込んだような親密なライブ録音感。",
    aliases: ["温かい部屋", "cozy room", "warm reverb"],
    tags: ["texture", "warm", "room", "intimate", "reverb"],
  },
  {
    id: "tex-cold-office",
    label: "cold office",
    category: "texture",
    promptText: "cold office ambience, air conditioning hum, fluorescent flicker, dead acoustic tile",
    description: "エアコンの低い唸りと蛍光灯のちらつき。吸音材が張られた死んだ音響の職場環境。",
    aliases: ["冷たいオフィス", "オフィス環境音", "office ambience", "corporate acoustic"],
    tags: ["texture", "office", "cold", "institutional", "ambience"],
  },
  {
    id: "tex-cheap-speaker",
    label: "cheap speaker",
    category: "texture",
    promptText: "cheap speaker, phone speaker simulation, tinny lo-fi, consumer playback, small driver distortion",
    description: "スマートフォンやラジカセの小型スピーカーで再生したような安物の音質。歪みと周波数カット。",
    aliases: ["安スピーカー", "phone speaker", "tinny sound", "lo-fi playback"],
    tags: ["texture", "cheap", "speaker", "lo-fi", "tinny"],
  },
  {
    id: "tex-analog-warmth",
    label: "analog warmth",
    category: "texture",
    promptText: "analog warmth, tape saturation, harmonic distortion, soft clipping, vintage glow",
    description: "テープ・サチュレーションと倍音歪みが生み出すアナログの温もり。デジタルにない有機的な艶。",
    aliases: ["アナログウォーム", "tape warmth", "vintage glow", "soft saturation"],
    tags: ["texture", "analog", "warm", "tape", "vintage"],
  },
  {
    id: "tex-digital-glitch",
    label: "digital glitch",
    category: "texture",
    promptText: "digital glitch, buffer stutter, data corruption sound, artifacting, broken digital",
    description: "バッファのスタッターとデータ破壊音。壊れたデジタル信号のアーティファクト。",
    aliases: ["デジタルグリッチ", "stutter", "buffer error", "data corruption"],
    tags: ["texture", "glitch", "digital", "stutter", "broken"],
  },
  {
    id: "tex-bitcrushed",
    label: "bitcrushed",
    category: "texture",
    promptText: "bitcrushed, reduced bit depth, retro digital, 8-bit texture, quantization noise",
    description: "ビット深度を落としたビットクラッシュ・サウンド。レトロなデジタル感と量子化ノイズ。",
    aliases: ["ビットクラッシュ", "8-bit texture", "lo-fi digital", "quantized"],
    tags: ["texture", "bitcrushed", "8-bit", "retro", "digital"],
  },
  {
    id: "tex-metallic-clang",
    label: "metallic clang",
    category: "texture",
    promptText: "metallic clang, steel resonance, industrial ring, metal on metal, harsh overtones",
    description: "金属が打ち合う鋭い音響。鉄の共鳴と工業的な倍音の衝突。",
    aliases: ["金属音", "metallic ring", "steel clang", "industrial metal"],
    tags: ["texture", "metal", "clang", "industrial", "resonance"],
  },
  {
    id: "tex-factory-ambience",
    label: "factory ambience",
    category: "texture",
    promptText: "factory ambience, machinery hum, conveyor belt, industrial noise floor, production line",
    description: "ベルトコンベアと機械の唸り音。工場の生産ラインが生み出す恒常的な産業的ノイズ。",
    aliases: ["工場環境音", "industrial ambience", "machinery noise", "production floor"],
    tags: ["texture", "factory", "industrial", "ambience", "machinery"],
  },
  {
    id: "tex-arcade-ambience",
    label: "arcade ambience",
    category: "texture",
    promptText: "arcade ambience, game sounds, blip and beep, retro gaming, coin drop",
    description: "ゲームセンターの多重音響。ブリップ音とコイン投入音が重なるレトロ・ゲーミング空間。",
    aliases: ["ゲームセンター", "arcade sounds", "retro gaming noise", "8-bit ambience"],
    tags: ["texture", "arcade", "retro", "gaming", "ambience"],
  },
  {
    id: "tex-night-street",
    label: "night street",
    category: "texture",
    promptText: "night street ambience, distant traffic, urban night, midnight city, wet pavement",
    description: "深夜の街路。遠くを走る車の音と濡れたアスファルトの静寂が混在する都市夜景の空気感。",
    aliases: ["夜の街路", "深夜の街", "midnight city", "urban night"],
    tags: ["texture", "night", "street", "urban", "ambience"],
  },
  {
    id: "tex-rain-window",
    label: "rain on window",
    category: "texture",
    promptText: "rain on window, indoor intimacy, storm outside, shelter from rain, glass drops",
    description: "窓ガラスを打つ雨音。屋内の親密さと嵐の外が対比するシェルターの感覚。",
    aliases: ["窓の雨", "雨音", "rain sounds", "window rain"],
    tags: ["texture", "rain", "window", "indoor", "intimate"],
  },
  {
    id: "tex-humid-summer",
    label: "humid summer",
    category: "texture",
    promptText: "humid summer air, cicada ambience, heat haze, damp warmth, heavy summer",
    description: "蝉の声と陽炎が揺れる湿度の高い夏の空気。じっとりとした重い熱気の質感。",
    aliases: ["蒸し暑い夏", "夏の空気", "cicada summer", "heat haze"],
    tags: ["texture", "summer", "humid", "cicada", "heat"],
  },
  {
    id: "tex-dry-air",
    label: "dry air",
    category: "texture",
    promptText: "dry air, anechoic near-dry, minimal reverb, close and direct, dead room",
    description: "残響がほぼない乾いた空気の質感。アナコイック的な直接音の近さ。",
    aliases: ["乾いた空気", "ドライ空間", "dead room", "anechoic"],
    tags: ["texture", "dry", "direct", "close", "minimal reverb"],
  },
  {
    id: "tex-underwater-reverb",
    label: "underwater reverb",
    category: "texture",
    promptText: "underwater reverb, deep submersion, muffled and watery, oceanic depth",
    description: "水中に沈んだような深い残響。こもった水の音響が包み込む海の深さ。",
    aliases: ["水中リバーブ", "submersion reverb", "oceanic depth", "watery"],
    tags: ["texture", "underwater", "reverb", "deep", "watery"],
  },
  {
    id: "tex-distant-room-mic",
    label: "distant room mic",
    category: "texture",
    promptText: "distant room mic, far mic placement, ambient bleed, roomy distance, room wash",
    description: "部屋の端に置かれたような遠いマイク・プレースメント。アンビエントな滲みと部屋鳴りの広がり。",
    aliases: ["遠いマイク", "room mic", "ambient bleed", "far placement"],
    tags: ["texture", "room", "distant", "ambient", "reverb"],
  },
  {
    id: "tex-close-mic",
    label: "close mic",
    category: "texture",
    promptText: "close mic, proximity effect, intimate direct, mouth breaths audible, raw closeness",
    description: "口元に近い密着マイク。プロキシミティ・エフェクトと息遣いが聞こえる生々しい近さ。",
    aliases: ["密着マイク", "close miking", "proximity effect", "direct mic"],
    tags: ["texture", "close", "mic", "proximity", "intimate"],
  },
  {
    id: "tex-empty-hall",
    label: "empty hall",
    category: "texture",
    promptText: "empty hall reverb, desolate echo, abandoned building resonance, long decay space",
    description: "人のいないホールに響く空洞的なエコー。廃墟的な長い残響と孤立した反響。",
    aliases: ["空のホール", "廃墟エコー", "empty building reverb", "desolate echo"],
    tags: ["texture", "hall", "empty", "echo", "desolate"],
  },
  {
    id: "tex-shrine-ambience",
    label: "shrine ambience",
    category: "texture",
    promptText: "shrine ambience, wind through torii, incense smoke, sacred outdoor space, spiritual air",
    description: "鳥居を抜ける風と線香の煙。聖なる屋外空間の霊的な空気感。",
    aliases: ["神社の環境音", "shrine atmosphere", "sacred outdoor", "torii wind"],
    tags: ["texture", "shrine", "sacred", "outdoor", "Japanese"],
  },
  {
    id: "tex-festival-noise",
    label: "festival noise",
    category: "texture",
    promptText: "festival noise, crowd energy, outdoor celebration, chaos of celebration, festive air",
    description: "祭りの熱狂と群衆エネルギー。屋外お祭りの祝祭的な喧騒と活気に満ちた空気。",
    aliases: ["祭り騒音", "festival crowd", "outdoor celebration noise", "festive ambience"],
    tags: ["texture", "festival", "crowd", "celebration", "outdoor"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STRUCTURE — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "struct-no-pre-chorus",
    label: "no pre-chorus",
    category: "structure",
    promptText: "no pre-chorus, verse directly into chorus, immediate impact, tight structure",
    description: "プリコーラスなしで即座にコーラスへ突入。タイトで直接的なコントラスト構造。",
    aliases: ["プリコーラスなし", "verse to chorus", "direct chorus"],
    tags: ["structure", "no pre-chorus", "tight", "direct"],
  },
  {
    id: "struct-double-chorus",
    label: "double chorus",
    category: "structure",
    promptText: "double chorus at end, repeat chorus twice, intensified final statement",
    description: "曲の後半でコーラスを二度繰り返す。強調された最終的な感情の高まり。",
    aliases: ["ダブルコーラス", "repeat chorus", "extended chorus"],
    tags: ["structure", "double chorus", "repeat", "intense"],
  },
  {
    id: "struct-final-key-change",
    label: "final key change",
    category: "structure",
    promptText: "final key change, modulation to higher key, emotional lift, key shift at climax",
    description: "クライマックスでの転調。最終コーラスに向けて高い調へ移動する感情的な高揚。",
    aliases: ["転調", "key modulation", "final modulation", "key lift"],
    tags: ["structure", "key change", "modulation", "climax", "lift"],
  },
  {
    id: "struct-spoken-bridge",
    label: "spoken bridge",
    category: "structure",
    promptText: "spoken word bridge, narrative interlude, spoken section between choruses",
    description: "コーラス間に挿入されるスポークン・ワード・ブリッジ。語りによるインタールード。",
    aliases: ["語りブリッジ", "spoken interlude", "narrative bridge"],
    tags: ["structure", "spoken", "bridge", "narrative", "interlude"],
  },
  {
    id: "struct-dance-breakdown",
    label: "dance breakdown",
    category: "structure",
    promptText: "dance breakdown, stripped beat, dancer's moment, rhythmic isolation, percussion only",
    description: "ダンサーのためのブレイクダウン。リズムのみが残り、メロディが引いてパーカッションが孤立する瞬間。",
    aliases: ["ダンスブレイクダウン", "dance break", "stripped breakdown"],
    tags: ["structure", "breakdown", "dance", "percussion", "stripped"],
  },
  {
    id: "struct-instrumental-break",
    label: "instrumental break",
    category: "structure",
    promptText: "instrumental break, no vocals, musical interlude, solo section, instrumental passage",
    description: "ボーカルが抜け楽器のみが演奏するインストゥルメンタル・ブレイク。ソロ・セクション。",
    aliases: ["間奏", "instrumental interlude", "solo section", "no vocal section"],
    tags: ["structure", "instrumental", "break", "solo", "interlude"],
  },
  {
    id: "struct-call-response-hook",
    label: "call and response hook",
    category: "structure",
    promptText: "call and response hook, lead and answer vocal, antiphonal chorus, echo response",
    description: "コールとレスポンスで構成されるフック。リードとアンサー・ボーカルのアンティフォナルな応答。",
    aliases: ["コール＆レスポンス", "call response", "antiphonal hook"],
    tags: ["structure", "call response", "hook", "antiphonal", "vocal"],
  },
  {
    id: "struct-chant-hook",
    label: "chant hook",
    category: "structure",
    promptText: "chant hook, crowd chant, unison chant section, repetitive group vocal",
    description: "群衆が一体となって繰り返すチャント・フック。反復と統一の集合的エネルギー。",
    aliases: ["チャントフック", "crowd chant", "group chant section"],
    tags: ["structure", "chant", "hook", "crowd", "unison"],
  },
  {
    id: "struct-refrain-loop",
    label: "refrain loop",
    category: "structure",
    promptText: "refrain loop, repeated refrain, cyclical return, hypnotic recurrence",
    description: "繰り返し回帰するリフレイン・ループ。催眠的な循環と変奏が積み重なる構造。",
    aliases: ["リフレインループ", "repeated refrain", "cyclical", "hypnotic loop"],
    tags: ["structure", "refrain", "loop", "cyclical", "hypnotic"],
  },
  {
    id: "struct-scene-change",
    label: "scene change",
    category: "structure",
    promptText: "scene change, dramatic shift, perspective change, sudden transition",
    description: "劇的な視点転換。突然のシーン切り替えで物語の角度が変わる転換点。",
    aliases: ["シーンチェンジ", "scene shift", "dramatic transition", "perspective shift"],
    tags: ["structure", "scene change", "transition", "shift", "dramatic"],
  },
  {
    id: "struct-cinematic-build",
    label: "cinematic build",
    category: "structure",
    promptText: "cinematic build, slow tension rise, orchestral swell, epic crescendo",
    description: "映画的なゆっくりとした緊張の高まり。オーケストラのスウェルとともに頂点へ向かうクレッシェンド。",
    aliases: ["シネマティックビルド", "epic build", "orchestral build", "tension rise"],
    tags: ["structure", "cinematic", "build", "tension", "crescendo"],
  },
  {
    id: "struct-explosive-final",
    label: "explosive final",
    category: "structure",
    promptText: "explosive final chorus, maximum energy ending, all elements in, cathartic release",
    description: "すべての要素が結集する爆発的なフィナーレ。最大エネルギーでカタルシスを解放する結末。",
    aliases: ["爆発的フィナーレ", "explosive ending", "maximum final", "cathartic end"],
    tags: ["structure", "finale", "explosive", "maximum", "cathartic"],
  },
  {
    id: "struct-quiet-outro",
    label: "quiet outro",
    category: "structure",
    promptText: "quiet outro, fade into silence, stripped ending, intimate close, solo instrument fade",
    description: "静寂へと溶けていく静かなアウトロ。削ぎ落とされた孤独な楽器が消えていく結末。",
    aliases: ["静かなアウトロ", "fade outro", "quiet ending", "stripped close"],
    tags: ["structure", "outro", "quiet", "fade", "intimate"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // META TAGS — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "meta-tag-intro-hook",
    label: "[Intro Hook]",
    category: "metaTag",
    promptText: "[Intro Hook]",
    description: "冒頭のフック・セクション。イントロとして機能しながら、すでにフック性を持つ開幕。",
    aliases: ["intro hook", "opening hook"],
    tags: ["metaTag", "intro", "hook"],
  },
  {
    id: "meta-tag-refrain",
    label: "[Refrain]",
    category: "metaTag",
    promptText: "[Refrain]",
    description: "繰り返し回帰するリフレイン・セクション。コーラスより短く、より反復的な定型句。",
    aliases: ["refrain", "リフレイン"],
    tags: ["metaTag", "refrain", "repeat"],
  },
  {
    id: "meta-tag-build",
    label: "[Build]",
    category: "metaTag",
    promptText: "[Build]",
    description: "緊張を高めていくビルド・セクション。EDM的なドロップ前の昂揚感を明示するタグ。",
    aliases: ["build", "build up", "ビルド"],
    tags: ["metaTag", "build", "tension", "EDM"],
  },
  {
    id: "meta-tag-final-hook",
    label: "[Final Hook]",
    category: "metaTag",
    promptText: "[Final Hook]",
    description: "曲の最後を締めくくる最終フック・セクション。",
    aliases: ["final hook", "last hook", "最終フック"],
    tags: ["metaTag", "final", "hook"],
  },
  {
    id: "meta-tag-spoken-intro",
    label: "[Spoken Intro]",
    category: "metaTag",
    promptText: "[Spoken Intro]",
    description: "歌唱なしの語りで始まるスポークン・イントロ・セクション。",
    aliases: ["spoken intro", "narrative intro", "語りイントロ"],
    tags: ["metaTag", "spoken", "intro"],
  },
  {
    id: "meta-tag-spoken-bridge",
    label: "[Spoken Bridge]",
    category: "metaTag",
    promptText: "[Spoken Bridge]",
    description: "語りで構成されるブリッジ・セクション。歌からの離脱と再帰を明示するタグ。",
    aliases: ["spoken bridge", "narrative bridge", "語りブリッジ"],
    tags: ["metaTag", "spoken", "bridge"],
  },
  {
    id: "meta-tag-dance-break",
    label: "[Dance Break]",
    category: "metaTag",
    promptText: "[Dance Break]",
    description: "ダンス向けのブレイク・セクション。リズムが前面に出てメロディが引くタグ。",
    aliases: ["dance break", "ダンスブレイク"],
    tags: ["metaTag", "dance", "break"],
  },
  {
    id: "meta-tag-instrumental-break",
    label: "[Instrumental Break]",
    category: "metaTag",
    promptText: "[Instrumental Break]",
    description: "ボーカルなしのインストゥルメンタル・ブレイク・セクション。間奏を明示するタグ。",
    aliases: ["instrumental break", "間奏", "solo break"],
    tags: ["metaTag", "instrumental", "break", "solo"],
  },
  {
    id: "meta-tag-call-response",
    label: "[Call and Response]",
    category: "metaTag",
    promptText: "[Call and Response]",
    description: "コール＆レスポンス形式のセクションを明示するタグ。",
    aliases: ["call and response", "コール＆レスポンス", "antiphonal"],
    tags: ["metaTag", "call response", "antiphonal"],
  },
  {
    id: "meta-tag-chant",
    label: "[Chant]",
    category: "metaTag",
    promptText: "[Chant]",
    description: "チャント・セクションを明示するタグ。群衆的・儀礼的な反復唱を誘導する。",
    aliases: ["chant", "チャント", "group chant"],
    tags: ["metaTag", "chant", "ritual"],
  },
  {
    id: "meta-tag-key-change",
    label: "[Key Change]",
    category: "metaTag",
    promptText: "[Key Change]",
    description: "転調箇所を明示するタグ。セクションの境界で音楽的な転換を示す。",
    aliases: ["key change", "転調", "modulation"],
    tags: ["metaTag", "key change", "modulation"],
  },
  {
    id: "meta-tag-quiet-outro",
    label: "[Quiet Outro]",
    category: "metaTag",
    promptText: "[Quiet Outro]",
    description: "静かなアウトロ・セクションを明示するタグ。エネルギーが収束していく結末を誘導する。",
    aliases: ["quiet outro", "静かなアウトロ", "fade outro"],
    tags: ["metaTag", "outro", "quiet", "fade"],
  },
  {
    id: "meta-tag-scene-change",
    label: "[Scene Change]",
    category: "metaTag",
    promptText: "[Scene Change]",
    description: "シーン転換を明示するタグ。物語の視点や時間軸が切り替わるセクション。",
    aliases: ["scene change", "シーンチェンジ", "scene shift"],
    tags: ["metaTag", "scene change", "transition"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // PRODUCTION — extended vocabulary
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "prod-68bpm",
    label: "68 BPM",
    category: "production",
    promptText: "68 BPM, slow ballad tempo, heartbeat pace, funeral march, drawn-out phrasing",
    description: "68BPMの遅いバラード・テンポ。心拍に寄り添う葬送行進曲的な引き伸ばされたフレージング。",
    aliases: ["68bpm", "slow ballad", "60s tempo"],
    tags: ["production", "bpm", "slow", "ballad"],
  },
  {
    id: "prod-76bpm",
    label: "76 BPM",
    category: "production",
    promptText: "76 BPM, slow groove, lazy swing, low-key tempo, relaxed pace",
    description: "76BPMのゆったりとしたグルーヴ。怠惰なスウィングと低強度のリラックスした歩調。",
    aliases: ["76bpm", "lazy groove", "slow swing"],
    tags: ["production", "bpm", "slow", "groove"],
  },
  {
    id: "prod-98bpm",
    label: "98 BPM",
    category: "production",
    promptText: "98 BPM, mid-tempo groove, hip-hop tempo, laid-back feel, moderate energy",
    description: "98BPMのミッドテンポ・グルーヴ。ヒップホップ的なレイドバックとほどよいエネルギー感。",
    aliases: ["98bpm", "hip-hop tempo", "mid-tempo"],
    tags: ["production", "bpm", "mid-tempo", "hip-hop"],
  },
  {
    id: "prod-128bpm",
    label: "128 BPM",
    category: "production",
    promptText: "128 BPM, house tempo, dance floor standard, four-on-the-floor pulse",
    description: "128BPMのハウス・テンポ。ダンスフロアの標準的な4つ打ちパルス。",
    aliases: ["128bpm", "house tempo", "dance tempo"],
    tags: ["production", "bpm", "house", "dance"],
  },
  {
    id: "prod-138bpm",
    label: "138 BPM",
    category: "production",
    promptText: "138 BPM, hard dance tempo, trance speed, peak time energy, fast four-on-floor",
    description: "138BPMのハード・ダンス・テンポ。トランスとピークタイムのエネルギーを持つ速い4つ打ち。",
    aliases: ["138bpm", "trance tempo", "hard dance"],
    tags: ["production", "bpm", "trance", "hard dance"],
  },
  {
    id: "prod-shuffle",
    label: "shuffle feel",
    category: "production",
    promptText: "shuffle feel, swung 8ths, blues shuffle, bouncy shuffle groove",
    description: "シャッフルするスウィング8分音符。バウンシーなブルース・シャッフル・グルーヴ。",
    aliases: ["シャッフル", "swung feel", "shuffle groove", "blues shuffle"],
    tags: ["production", "shuffle", "swing", "bounce", "blues"],
  },
  {
    id: "prod-swing-rhythm",
    label: "swing rhythm",
    category: "production",
    promptText: "swing rhythm, jazzy swing, delayed second beat, triplet feel",
    description: "ジャズ的なスウィング・リズム。遅れる2拍目と3連符的なフィール。",
    aliases: ["スウィングリズム", "jazzy swing", "triplet feel"],
    tags: ["production", "swing", "jazz", "rhythm", "triplet"],
  },
  {
    id: "prod-four-on-floor",
    label: "four on the floor",
    category: "production",
    promptText: "four on the floor, straight kick drum, electronic dance, driving pulse",
    description: "すべての拍にキックが落ちる4つ打ち。電子ダンス・ミュージックの駆動力あるパルス。",
    aliases: ["4つ打ち", "four-on-floor", "straight kick", "EDM kick"],
    tags: ["production", "four on floor", "kick", "dance", "driving"],
  },
  {
    id: "prod-breakbeat-groove",
    label: "breakbeat groove",
    category: "production",
    promptText: "breakbeat groove, syncopated kick, break-derived pattern, off-grid swing",
    description: "シンコペーションするキックとオフグリッドのスウィングが絡むブレイクビート・グルーヴ。",
    aliases: ["ブレイクビートグルーヴ", "syncopated beat", "break groove"],
    tags: ["production", "breakbeat", "groove", "syncopated", "swing"],
  },
  {
    id: "prod-halftime",
    label: "halftime feel",
    category: "production",
    promptText: "halftime feel, half-time groove, slow snare, double-time energy, trap-influenced",
    description: "ハーフタイム・フィール。スネアが遅くなりトラップ的な重力感が生まれるグルーヴ。",
    aliases: ["ハーフタイム", "half-time", "slow snare", "trap feel"],
    tags: ["production", "halftime", "groove", "trap", "slow"],
  },
  {
    id: "prod-sidechain",
    label: "sidechain compression",
    category: "production",
    promptText: "sidechain compression, pumping bass, ducking pads, house pumping, rhythmic breathing",
    description: "キックに連動してパッドが息をするようにダッキングするサイドチェーン・コンプレッション。",
    aliases: ["サイドチェーン", "sidechain pump", "ducking", "pumping"],
    tags: ["production", "sidechain", "compression", "pumping", "house"],
  },
  {
    id: "prod-tape-saturation-mix",
    label: "tape saturation mix",
    category: "production",
    promptText: "tape saturation on mix bus, warm analog master, harmonically rich, vintage master",
    description: "ミックスバスにテープ・サチュレーションをかけたビンテージ・マスター。倍音豊かな温かみ。",
    aliases: ["テープサチュレーション", "analog master", "warm master"],
    tags: ["production", "tape", "saturation", "master", "warm"],
  },
  {
    id: "prod-dry-mix",
    label: "dry mix",
    category: "production",
    promptText: "dry mix, minimal effects, direct sound, no reverb, close and present",
    description: "エフェクトを最小限に抑えた乾いたミックス。リバーブなしの直接的で近い音。",
    aliases: ["ドライミックス", "no reverb mix", "direct mix", "minimal FX"],
    tags: ["production", "dry", "mix", "direct", "minimal"],
  },
  {
    id: "prod-wet-mix",
    label: "wet mix",
    category: "production",
    promptText: "wet mix, heavy reverb and delay, spacious production, lush effects, drenched in reverb",
    description: "リバーブとディレイをたっぷりかけた濡れたミックス。広大な空間に満ちた豊かなエフェクト感。",
    aliases: ["ウェットミックス", "drenched reverb", "spacious mix", "heavy FX"],
    tags: ["production", "wet", "reverb", "delay", "spacious"],
  },
  {
    id: "prod-mono-intro",
    label: "mono intro",
    category: "production",
    promptText: "mono intro, single channel opening, narrow sound field, opens to stereo",
    description: "モノラルで始まるイントロ。単一チャンネルの狭い音場が後にステレオへ開く演出。",
    aliases: ["モノイントロ", "mono opening", "narrow intro"],
    tags: ["production", "mono", "intro", "narrow", "stereo"],
  },
  {
    id: "prod-stereo-widening",
    label: "stereo widening",
    category: "production",
    promptText: "stereo widening, wide stereo image, Haas effect, immersive spread, spatial expansion",
    description: "音場を広げるステレオ・ワイドニング。ハース効果と空間拡張で没入感を生む広がり。",
    aliases: ["ステレオワイドニング", "wide stereo", "Haas effect", "spatial width"],
    tags: ["production", "stereo", "wide", "spatial", "immersive"],
  },
  {
    id: "prod-radio-ready",
    label: "radio ready",
    category: "production",
    promptText: "radio ready, polished master, broadcast loudness, commercial production quality",
    description: "放送レベルのラウドネスと磨き上げられたマスタリングのラジオ対応品質。商業プロダクションの仕上がり。",
    aliases: ["ラジオレディ", "broadcast quality", "commercial master", "polished"],
    tags: ["production", "radio", "master", "polished", "commercial"],
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
      "genre-matsuri-funk",
      "genre-shrine-rave",
      "inst-shamisen",
      "inst-taiko",
      "inst-festival-percussion",
      "tex-festival-noise",
      "tex-shrine-ambience",
      "vocal-call-and-response",
      "struct-theatrical-intro",
      "mood-triumphant",
      "mood-ritualistic",
      "genre-ceremonial-ambient",
    ],
    bonus: 6,
  },
  {
    keywords: ["太鼓", "和太鼓", "大太鼓", "締太鼓", "鼓"],
    ids: ["inst-taiko", "inst-festival-percussion", "genre-enka", "genre-matsuri-funk", "mood-triumphant"],
    bonus: 6,
  },
  {
    keywords: ["三味線", "三絃", "琴", "尺八", "篠笛", "能管"],
    ids: ["inst-shamisen", "inst-koto", "inst-shakuhachi", "genre-enka", "genre-showa-kayokyoku"],
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
      "genre-corporate-disco",
      "mood-deadpan",
      "mood-ironic",
      "mood-bureaucratic",
      "inst-clavinet",
      "tex-dry-vocal-booth",
      "tex-cold-office",
      "tex-fluorescent-hum",
      "vocal-spoken",
      "vocal-radio-announcer",
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
      "genre-industrial-funk",
      "genre-breakbeat-rock",
      "inst-distorted-breakbeats",
      "inst-factory-percussion",
      "tex-factory-ambience",
      "tex-metallic-clang",
      "tex-dry-vocal-booth",
      "mood-deadpan",
      "mood-unsettling",
    ],
    bonus: 6,
  },
  {
    keywords: ["鉄", "金属", "スチール", "鋼", "鍛造"],
    ids: ["genre-industrial-rock", "genre-industrial-funk", "inst-distorted-breakbeats", "inst-metallic-percussion", "tex-metallic-clang", "mood-unsettling"],
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
      "genre-kayokyoku-disco",
      "tex-vinyl-crackle",
      "tex-tape-saturation",
      "tex-tape-wobble",
      "tex-dusty-room",
      "mood-melancholic",
      "mood-nostalgic",
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
      "genre-shrine-rave",
      "mood-sacred",
      "mood-ritualistic",
      "mood-devotional",
      "vocal-gospel-choir",
      "vocal-chant",
      "vocal-group-chant",
      "inst-shakuhachi",
      "tex-shrine-ambience",
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
