import { SongInput, LyricsDraft, LyricsSection } from "@/types";

type SectionKey = "Intro" | "Verse 1" | "Verse 2" | "Pre-Chorus" | "Chorus" | "Bridge" | "Outro";

type MoodPool = {
  intro: string[];
  verse: string[];
  "pre-chorus": string[];
  chorus: string[];
  bridge: string[];
  outro: string[];
};

const JP_POOLS: Record<string, MoodPool> = {
  melancholic: {
    intro: [
      "静寂が　部屋を満たしていく",
      "窓の外　雨が降り始めた",
      "街灯が　一つずつ消えていく",
    ],
    verse: [
      "街の灯りが　滲んで消えて",
      "誰かの声が　遠ざかっていく",
      "手を伸ばしても　届かなくて",
      "また一人で　夜を数える",
      "古いレコードが　止まったまま",
      "あの日の言葉　忘れられなくて",
      "時間だけが　静かに流れる",
      "窓の外には　変わらない空",
    ],
    "pre-chorus": [
      "もう逃げられない",
      "真実を探して",
      "終わりが見えなくて",
      "息が詰まりそうで",
    ],
    chorus: [
      "消えない痛みを　抱えたまま",
      "どこかにある　答えを探す",
      "君の残した　言葉だけが",
      "今も胸に　刻まれてる",
      "泣いても　笑っても",
      "この想いは　変わらない",
    ],
    bridge: [
      "それでも前へ　歩き出す",
      "涙が乾いた後に",
      "新しい朝を　待ちながら",
      "ひとつずつ　手放していく",
    ],
    outro: [
      "雨上がりの　光の中で",
      "また始まる　新しい日",
      "静かに　幕が下りていく",
    ],
  },
  energetic: {
    intro: [
      "轟く音が　空気を震わせる",
      "カウントダウン　始まった",
      "点火　今行くぞ",
    ],
    verse: [
      "走り出したら　止まれない",
      "鼓動が　爆発しそうで",
      "限界なんて　知らない",
      "今夜は誰にも　止められない",
      "汗が光って　輝いてる",
      "ギアを上げろ　まだ足りない",
      "燃え上がる　全身で",
      "この瞬間を　掴み取れ",
    ],
    "pre-chorus": [
      "もう止まらない",
      "全部出し切れ",
      "いくぞ　今だ",
      "限界突破",
    ],
    chorus: [
      "行くぞ　全力で",
      "限界を超えていく",
      "もう迷わない　突き進む",
      "この瞬間だけが　全てだ",
      "叫べ　解き放て",
      "血が滾る　この感覚",
    ],
    bridge: [
      "折れそうな時こそ　立ち上がれ",
      "諦めたら　そこで終わり",
      "傷だらけでも　前へ",
      "全てを賭けて　行け",
    ],
    outro: [
      "燃え尽きるまで　走り続けた",
      "この熱さを　忘れるな",
      "また始まる　次のステージへ",
    ],
  },
  dreamy: {
    intro: [
      "霞の向こう　どこかへ続く",
      "まどろみの中　溶けていく",
      "ふわりと　時間が止まって",
    ],
    verse: [
      "光と影が　溶け合う場所",
      "浮かんでいる　このままで",
      "夢と現実の　境界線",
      "綿飴みたいな　白い雲",
      "指先がかすかに　触れる感覚",
      "意識が遠く　彼方へ",
      "色が滲んで　消えていく",
      "水面に映る　揺れる顔",
    ],
    "pre-chorus": [
      "ここは夢の中",
      "このまま消えたい",
      "どこへ連れていって",
      "目を閉じたまま",
    ],
    chorus: [
      "夢の中に　連れていって",
      "現実なんて　もういらない",
      "あなたと溶け合う　その瞬間",
      "ずっと　このままでいたい",
      "羽のように　ふわりと",
      "意識が宇宙へ　広がっていく",
    ],
    bridge: [
      "目が覚めても　まだここにいる",
      "夢の残像　消えないうちに",
      "もう少しだけ　眠らせて",
      "現実に戻る　準備ができない",
    ],
    outro: [
      "静かに　夢が終わっていく",
      "また眠れば　会えるから",
      "朝の光が　滲んでいく",
    ],
  },
  dark: {
    intro: [
      "闇が全てを　飲み込んでいく",
      "冷たい風が　吹き荒れる",
      "終焉の予感　漂う夜に",
    ],
    verse: [
      "終わりのない　迷宮の中",
      "誰も来ない　この場所で",
      "崩れていく　全てのもの",
      "底なしの　虚無に落ちていく",
      "信じていたもの　全て嘘で",
      "孤独が牙を　剥いてくる",
      "逃げ場などない　この檻の中",
      "静寂が叫んでいる",
    ],
    "pre-chorus": [
      "もう戻れない",
      "全てが崩れていく",
      "助けを呼んでも",
      "声が届かない",
    ],
    chorus: [
      "絶望が　支配する夜",
      "光は遠く　手が届かない",
      "それでも生きていくしかない",
      "傷だらけの　この魂で",
      "闇の中に　沈んでいく",
      "全てを諦めた後でも",
    ],
    bridge: [
      "だがまだ息をしている",
      "這い上がる爪が折れても",
      "この痛みだけが　証明だ",
      "壊れていくことさえ　美しい",
    ],
    outro: [
      "闇が晴れることなく終わる",
      "それでも朝は来てしまう",
      "静かに　目を閉じた",
    ],
  },
  uplifting: {
    intro: [
      "新しい朝が　来るたびに",
      "空が明るく　なってきた",
      "希望の光が　差し込んでくる",
    ],
    verse: [
      "小さな光が　見えてくる",
      "諦めかけた　その先に",
      "また立ち上がれる　気がしてる",
      "転んでも　また歩き出す",
      "雲の切れ間に　青が見えた",
      "昨日より少し　強くなった",
      "誰かの笑顔が　力になる",
      "続けてきた日々が　輝いてる",
    ],
    "pre-chorus": [
      "もう少しだけ",
      "前を向いて行こう",
      "信じていれば",
      "きっと届く",
    ],
    chorus: [
      "大丈夫　また歩ける",
      "この先に　きっと答えがある",
      "信じていれば　繋がっていく",
      "前を向いて　走り続けよう",
      "諦めなければ　道は続く",
      "輝く未来が　待っている",
    ],
    bridge: [
      "雨の後には　虹が出る",
      "全ての試練が　糧になる",
      "一人じゃない　一緒に行こう",
      "今日の涙が　明日の力に",
    ],
    outro: [
      "またいつか　笑える日が来る",
      "その日まで　歩き続けよう",
      "始まりはいつも　今から",
    ],
  },
  nostalgic: {
    intro: [
      "古いアルバムを　開いてみた",
      "あの頃の匂いが　よみがえる",
      "セピア色の　記憶の中で",
    ],
    verse: [
      "あの頃の　風景が蘇る",
      "セピア色に　変わった写真",
      "時間が止まった　あの場所で",
      "懐かしい　声が聞こえる",
      "帰れない日々が　輝いていた",
      "子供の頃の　あの笑顔",
      "変わってしまった　街角で",
      "思い出だけが　ここに残る",
    ],
    "pre-chorus": [
      "戻れないけど",
      "あの日を想う",
      "忘れられない",
      "時を超えて",
    ],
    chorus: [
      "あの夏の日を　思い出す",
      "もう会えない　あの人の声",
      "時間よ戻れ　そう願うけど",
      "思い出だけが　永遠だから",
      "懐かしさが　胸を締め付ける",
      "あの頃に戻りたい",
    ],
    bridge: [
      "時は流れても　心は同じ",
      "また同じ場所で　会えたなら",
      "変わったのは　自分だけかも",
      "あの日々が　今も生きてる",
    ],
    outro: [
      "さよならを言えなかった　あの日",
      "ありがとう　全ての記憶に",
      "また会える日まで",
    ],
  },
  romantic: {
    intro: [
      "君の横顔を　見ていると",
      "胸が高鳴る　この感覚",
      "言葉にできない　この気持ち",
    ],
    verse: [
      "言葉よりも　伝わるものがある",
      "触れるか触れないか　その距離で",
      "時間が止まれば　いいのにと思う",
      "君と過ごす　何気ない日々",
      "笑顔を見るたびに　また好きになる",
      "隣にいるだけで　十分なのに",
      "ふとした仕草に　心を奪われる",
      "どう伝えれば　いいんだろう",
    ],
    "pre-chorus": [
      "もう隠せない",
      "君のことが好きだ",
      "言えそうで言えなくて",
      "心が溢れそう",
    ],
    chorus: [
      "好きだって言いたい　でも怖い",
      "この気持ち本物だって　わかってる",
      "君のそばにいたい　それだけで",
      "愛してるって　言わせてほしい",
      "ずっと一緒にいたい",
      "君だけを　見ている",
    ],
    bridge: [
      "うまく伝えられなくても",
      "傍にいることが　答えだから",
      "不器用でも構わない",
      "この想いだけは　本物だから",
    ],
    outro: [
      "ありがとう　出会えてよかった",
      "これからも　よろしくね",
      "君と歩いていく",
    ],
  },
  epic: {
    intro: [
      "地平線の彼方へ　続く道を",
      "嵐の前の　静けさの中",
      "決戦の刻が　近づいてくる",
    ],
    verse: [
      "嵐の中でも　揺れない心",
      "世界が変わっても　これだけは",
      "運命に挑む　その覚悟で",
      "天を仰いで　誓いを立てる",
      "幾千の敵が　立ちはだかっても",
      "折れない剣と　砕けぬ意志",
      "歴史を刻む　この一歩で",
      "伝説は今　始まっていく",
    ],
    "pre-chorus": [
      "立ち上がれ",
      "恐れるな",
      "全力で挑め",
      "今こそ時だ",
    ],
    chorus: [
      "立ち向かえ　恐れるな",
      "全ての壁を　乗り越えていく",
      "これが俺たちの　戦いだ",
      "諦めるな　まだここにいる",
      "運命を変えろ　今こそ",
      "不滅の魂で　輝け",
    ],
    bridge: [
      "傷を負っても　立ち続けろ",
      "英雄とは　諦めない者だ",
      "後世に語り継がれる為に",
      "全てをかけろ　この一瞬に",
    ],
    outro: [
      "戦いが終わり　静寂が訪れる",
      "伝説は語り継がれていく",
      "また新たな戦いが始まる",
    ],
  },
  chill: {
    intro: [
      "コーヒーが冷めていく",
      "午後の光が　柔らかくて",
      "何もしない　そんな日もいい",
    ],
    verse: [
      "ゆっくり流れる　時間の中で",
      "急がなくていい　今日くらいは",
      "窓辺で読む　お気に入りの本",
      "何も考えず　ただ漂う",
      "風が吹いて　目が覚めた",
      "猫みたいに　丸くなって",
      "音楽に身を　任せていたら",
      "いつの間にか　眠っていた",
    ],
    "pre-chorus": [
      "このままでいい",
      "急がなくていい",
      "ゆっくりと",
      "流れに乗って",
    ],
    chorus: [
      "何もしない　贅沢な時間",
      "急がないで　ゆっくり行こう",
      "今日はただ　のんびりしよう",
      "全部後回しでいい",
      "この瞬間だけ　感じていたい",
      "リラックスして　ただ在ればいい",
    ],
    bridge: [
      "頑張らない日も　必要だ",
      "疲れた時は　休んでいい",
      "自分を大切に　してあげて",
      "焦らなくていい　人生は長い",
    ],
    outro: [
      "また明日　ゆっくりと",
      "今日もお疲れ様",
      "夜が静かに　更けていく",
    ],
  },
  aggressive: {
    intro: [
      "限界だ　もう我慢できない",
      "叫べ　解き放て",
      "全てを壊してやる",
    ],
    verse: [
      "怒りが　全身を満たす",
      "理不尽な世界に　拳を握る",
      "黙って従う時代は終わった",
      "全てに反抗する　この魂で",
      "偽りの笑顔は　もういらない",
      "正直に生きる　それだけだ",
      "マスクを脱いで　本当の声で",
      "お前らには　負けない",
    ],
    "pre-chorus": [
      "もう黙らない",
      "全部ぶちまける",
      "聞こえるか",
      "これが答えだ",
    ],
    chorus: [
      "叫べ　全力で",
      "怒りを解き放て",
      "これが俺の本音だ",
      "壊せ　作り直せ",
      "もう止まらない　突き進む",
      "全てと戦う",
    ],
    bridge: [
      "傷だらけでも　立っている",
      "折れない心が　武器だ",
      "憎しみじゃなくて　怒りで",
      "変えていくんだ　この世界を",
    ],
    outro: [
      "戦いは終わらない",
      "それでも叫び続ける",
      "これが俺の生き様だ",
    ],
  },
};

const EN_LINES: Record<string, Partial<MoodPool>> = {
  melancholic: {
    verse: [
      "walking alone past midnight streets",
      "silence fills the room you left behind",
      "every memory fades like photographs",
      "can't find the words I meant to say",
    ],
    chorus: [
      "I can't let go of what we had",
      "the pain won't fade, it stays with me",
      "your voice still echoes in my head",
      "how do I move on from this",
    ],
  },
  energetic: {
    verse: [
      "can't slow down, I'm breaking free",
      "full speed ahead, no looking back",
      "feel the rush, the world is mine",
      "burning up, ignite the night",
    ],
    chorus: [
      "run and never stop",
      "push it to the limit",
      "we're alive, we're on fire",
      "nothing's gonna hold us back",
    ],
  },
  uplifting: {
    verse: [
      "every step I take brings me closer",
      "I can see the light ahead",
      "one more try, that's all I need",
      "tomorrow holds a better way",
    ],
    chorus: [
      "rise up, we can make it through",
      "keep on going, don't give in",
      "the best is yet to come",
      "believe and you will find your way",
    ],
  },
};

function pickLines(pool: string[], count: number, seed: number): string[] {
  const result: string[] = [];
  const used = new Set<number>();
  let idx = seed % pool.length;
  while (result.length < Math.min(count, pool.length)) {
    if (!used.has(idx)) {
      result.push(pool[idx]);
      used.add(idx);
    }
    idx = (idx + 3) % pool.length;
  }
  return result;
}

function injectKeyword(lines: string[], keyword: string): string[] {
  if (!keyword || lines.length === 0) return lines;
  return lines.map((l, i) =>
    i === 0 ? l.replace(/君|あなた|それ/, keyword) : l
  );
}

function extractKeyword(theme: string): string {
  const cleaned = theme.replace(/[、。！？\s　]+/g, " ").trim();
  const words = cleaned.split(" ").filter((w) => w.length >= 2);
  return words[0] ?? "";
}

function getSectionLines(
  sectionKey: keyof MoodPool,
  mood: string,
  englishRatio: string,
  count: number,
  seed: number
): string[] {
  const moodKey = mood in JP_POOLS ? mood : "melancholic";
  const jpPool = JP_POOLS[moodKey][sectionKey] ?? JP_POOLS.melancholic[sectionKey];

  if (englishRatio === "high") {
    const enPool = EN_LINES[moodKey]?.[sectionKey] ?? EN_LINES.melancholic?.[sectionKey];
    if (enPool && enPool.length > 0) {
      const en = pickLines(enPool, Math.ceil(count / 2), seed);
      const jp = pickLines(jpPool, Math.floor(count / 2), seed + 1);
      return [...en, ...jp].slice(0, count);
    }
  } else if (englishRatio === "mixed") {
    const enPool = EN_LINES[moodKey]?.[sectionKey];
    if (enPool && enPool.length > 0) {
      const en = pickLines(enPool, 1, seed);
      const jp = pickLines(jpPool, count - 1, seed + 1);
      return [...jp.slice(0, 1), ...en, ...jp.slice(1, count - 1)].slice(0, count);
    }
  }

  return pickLines(jpPool, count, seed);
}

const SECTION_LINE_COUNTS: Record<string, number> = {
  Intro: 2,
  "Verse 1": 4,
  "Verse 2": 4,
  "Pre-Chorus": 2,
  Chorus: 4,
  Bridge: 3,
  Outro: 2,
};

function getSections(input: SongInput): SectionKey[] {
  if (input.startWithChorus) {
    if (input.songLength === "30s") return ["Chorus"];
    if (input.songLength === "90s") return ["Chorus", "Verse 1", "Pre-Chorus", "Chorus"];
    return ["Chorus", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"];
  }
  if (input.songLength === "30s") return ["Chorus"];
  if (input.songLength === "90s")
    return ["Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus"];
  return ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"];
}

const SECTION_KEY_MAP: Record<SectionKey, keyof MoodPool> = {
  Intro: "intro",
  "Verse 1": "verse",
  "Verse 2": "verse",
  "Pre-Chorus": "pre-chorus",
  Chorus: "chorus",
  Bridge: "bridge",
  Outro: "outro",
};

export function buildLyricsDraft(input: SongInput): LyricsDraft {
  const sections = getSections(input);
  const keyword = extractKeyword(input.theme);
  const titleWord = input.title.trim();
  let seed = (input.mood.charCodeAt(0) ?? 0) + (input.genre.charCodeAt(0) ?? 0);

  const result: LyricsSection[] = sections.map((tag) => {
    const poolKey = SECTION_KEY_MAP[tag];
    const count = SECTION_LINE_COUNTS[tag] ?? 4;
    let lines = getSectionLines(poolKey, input.mood, input.englishRatio, count, seed);
    seed = (seed + 7) % 100;

    if (tag === "Chorus" && titleWord) {
      lines = lines.map((l, i) => (i === lines.length - 1 ? titleWord : l));
    } else if (keyword) {
      lines = injectKeyword(lines, keyword);
    }

    return { tag, lines };
  });

  return { sections: result };
}

export function draftToRaw(draft: LyricsDraft): string {
  return draft.sections
    .map((s) => `[${s.tag}]\n${s.lines.join("\n")}`)
    .join("\n\n");
}
