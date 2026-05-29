import { SongInput, WorldExpansion, LyricsDraft, LyricsSection } from "@/types";
import {
  extractThemeMotifsForLyrics,
  buildThemeLines,
  SectionType,
} from "@/lib/themeExtractor";
import { pickSectionList, RuleBasedSectionKey } from "@/lib/structureVariation";

type SectionKey = RuleBasedSectionKey;

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

const EN_LINES: Record<string, MoodPool> = {
  melancholic: {
    intro: [
      "the silence settles in",
      "rain against the windowpane",
      "another night alone begins",
    ],
    verse: [
      "walking alone past midnight streets",
      "silence fills the room you left behind",
      "every memory fades like photographs",
      "can't find the words I meant to say",
      "the city lights blur in the rain",
      "I keep replaying what went wrong",
      "your shadow follows everywhere I go",
      "the hours pass but nothing changes",
    ],
    "pre-chorus": [
      "I can't escape this feeling",
      "nowhere left to run",
      "drowning in the silence",
      "barely holding on",
    ],
    chorus: [
      "I can't let go of what we had",
      "the pain won't fade, it stays with me",
      "your voice still echoes in my head",
      "how do I move on from this",
      "every night I feel the weight",
      "something's broken deep inside",
    ],
    bridge: [
      "maybe time will heal this wound",
      "learning how to breathe again",
      "still I reach for what is gone",
      "picking up the broken pieces",
    ],
    outro: [
      "slowly fading into grey",
      "nothing left to say",
      "let the silence take me now",
    ],
  },
  energetic: {
    intro: [
      "the engine's running hot tonight",
      "feel that adrenaline rise",
      "countdown, let's go",
    ],
    verse: [
      "can't slow down, I'm breaking free",
      "full speed ahead, no looking back",
      "feel the rush, the world is mine",
      "burning up, ignite the night",
      "sweat and fire in my veins",
      "push the limits past the edge",
      "every muscle, every bone",
      "this is what it means to live",
    ],
    "pre-chorus": [
      "can't stop now",
      "give it everything",
      "let's go, right now",
      "break the limit",
    ],
    chorus: [
      "run and never stop",
      "push it to the limit",
      "we're alive, we're on fire",
      "nothing's gonna hold us back",
      "feel the power in your bones",
      "scream it out and don't look down",
    ],
    bridge: [
      "even when you're about to break",
      "keep on fighting, stand your ground",
      "scars are proof that you survived",
      "burn it all and rise again",
    ],
    outro: [
      "we burned until the morning came",
      "never forget this heat",
      "on to the next battle",
    ],
  },
  dreamy: {
    intro: [
      "drifting through a silver haze",
      "the edges blur and fade away",
      "somewhere between awake and sleep",
    ],
    verse: [
      "floating through the clouds above",
      "colors bleeding into light",
      "nothing feels quite real tonight",
      "I dissolve into the air",
      "half asleep and half alive",
      "cotton skies and velvet nights",
      "every breath is slow and soft",
      "time is melting at the seams",
    ],
    "pre-chorus": [
      "lost inside a dream",
      "don't wake me yet",
      "carry me away",
      "eyes still closed",
    ],
    chorus: [
      "take me somewhere far away",
      "I don't want to wake from this",
      "let me float a little longer",
      "stay here in the in-between",
      "weightless, drifting, soft as snow",
      "consciousness just let me go",
    ],
    bridge: [
      "even waking I'm still here",
      "the dream still lingers in my eyes",
      "just a little longer please",
      "the real world feels too sharp today",
    ],
    outro: [
      "slowly the dream dissolves",
      "I'll find you when I sleep again",
      "morning light bleeds through",
    ],
  },
  dark: {
    intro: [
      "darkness swallows everything",
      "the cold wind tears right through",
      "something wicked this way comes",
    ],
    verse: [
      "lost inside a maze with no way out",
      "walls are closing in around me",
      "every light has turned to ash",
      "falling deeper, can't be found",
      "hollow voices fill the dark",
      "shadows eating at my soul",
      "chains I forged with my own hands",
      "silence screaming in my skull",
    ],
    "pre-chorus": [
      "no turning back",
      "everything's collapsing",
      "no one hears me",
      "swallowed by the dark",
    ],
    chorus: [
      "darkness takes control tonight",
      "light's too far to reach",
      "still I breathe through all of this",
      "torn apart but still alive",
      "sinking in the void below",
      "even after all is lost",
    ],
    bridge: [
      "but I'm still breathing after all",
      "clawing up with broken nails",
      "this pain is proof that I exist",
      "even ruins hold a kind of grace",
    ],
    outro: [
      "the dark never fully lifts",
      "yet morning keeps on coming",
      "eyes close, breathe out, let go",
    ],
  },
  uplifting: {
    intro: [
      "a new day breaks on the horizon",
      "the sky is turning bright",
      "I feel the light coming through",
    ],
    verse: [
      "every step I take brings me closer",
      "I can see the light ahead",
      "one more try, that's all I need",
      "tomorrow holds a better way",
      "piece by piece I'm finding strength",
      "yesterday was hard but here I am",
      "someone's smile gave me the push",
      "all these days will shine one day",
    ],
    "pre-chorus": [
      "just a little more",
      "keep on moving forward",
      "believe and it will come",
      "almost there now",
    ],
    chorus: [
      "rise up, we can make it through",
      "keep on going, don't give in",
      "the best is yet to come",
      "believe and you will find your way",
      "it's okay, we'll carry on",
      "a brighter future's waiting there",
    ],
    bridge: [
      "after every rain a rainbow comes",
      "every trial makes you stronger",
      "you're not walking this alone",
      "today's tears fuel tomorrow's fire",
    ],
    outro: [
      "someday we will laugh about this",
      "keep walking until then",
      "every start begins today",
    ],
  },
  nostalgic: {
    intro: [
      "I opened an old photograph",
      "the scent of those days returns",
      "sepia tones in my memory",
    ],
    verse: [
      "the old streets look familiar now",
      "faded photos in a box",
      "time has stopped in that one place",
      "I still hear your voice sometimes",
      "those days shone brighter than I knew",
      "a childhood face I can't forget",
      "the corner where the bakery stood",
      "only memories remain",
    ],
    "pre-chorus": [
      "can't go back but",
      "I still think of those days",
      "I can't forget",
      "across the years",
    ],
    chorus: [
      "I remember that summer day",
      "your voice I'll never hear again",
      "time please turn back, I wish but know",
      "memories last forever though",
      "nostalgia aches inside my chest",
      "I want to go back to that time",
    ],
    bridge: [
      "time flows on but hearts stay young",
      "if we could meet at that same place",
      "maybe I'm the one who changed",
      "those days still live inside of me",
    ],
    outro: [
      "I never said goodbye that day",
      "thank you for all these memories",
      "until we meet again",
    ],
  },
  romantic: {
    intro: [
      "I keep watching your silhouette",
      "my heartbeat won't slow down",
      "words I still can't say",
    ],
    verse: [
      "more than words could ever say",
      "this distance between us, just enough",
      "I wish that time would stop right here",
      "these ordinary days with you",
      "every time you smile I fall again",
      "just being near you is enough",
      "the smallest things you do undo me",
      "how do I tell you what I feel",
    ],
    "pre-chorus": [
      "I can't hide it anymore",
      "I think I love you",
      "so close yet I can't say it",
      "my heart is overflowing",
    ],
    chorus: [
      "I want to say I love you but I'm scared",
      "I know these feelings are the real thing",
      "all I want is to stay close to you",
      "let me say the words I've held so long",
      "I want to be with you forever",
      "you're the only one I see",
    ],
    bridge: [
      "even if I stumble with the words",
      "staying close is all the answer I need",
      "clumsy love is love all the same",
      "this feeling is the truest thing I have",
    ],
    outro: [
      "thank you for coming into my life",
      "let's keep walking this road together",
      "I'll be here beside you",
    ],
  },
  epic: {
    intro: [
      "the road stretches to the horizon",
      "calm before the storm descends",
      "the hour of reckoning draws near",
    ],
    verse: [
      "standing firm against the raging storm",
      "this vow remains though worlds may fall",
      "facing fate with open eyes",
      "swearing on the endless sky",
      "ten thousand blades may bar my path",
      "unbroken sword, unshaken will",
      "carving legends with this single step",
      "the myth begins here, right now",
    ],
    "pre-chorus": [
      "rise up",
      "do not fear",
      "give everything",
      "the time is now",
    ],
    chorus: [
      "face it head on, do not fear",
      "we'll break through every wall",
      "this is our battle to be won",
      "don't surrender, we are still here",
      "change your destiny, right now",
      "shine with an undying soul",
    ],
    bridge: [
      "still standing even bearing wounds",
      "the hero is the one who never quits",
      "so that our story echoes through the ages",
      "stake it all on this one moment",
    ],
    outro: [
      "battle's end, a silence falls",
      "legends will be told of this",
      "a new war has already begun",
    ],
  },
  chill: {
    intro: [
      "coffee's going cold again",
      "afternoon light, soft and warm",
      "doing nothing, that's just fine",
    ],
    verse: [
      "time moves slow and that's okay",
      "no rush today, just let it be",
      "reading by the window light",
      "adrift with nothing on my mind",
      "a gentle breeze and I'm awake",
      "curled up like a cat in sun",
      "letting music carry me away",
      "I fell asleep without a care",
    ],
    "pre-chorus": [
      "this is enough",
      "no need to rush",
      "easy now",
      "just go with the flow",
    ],
    chorus: [
      "nothing to do, what a luxury",
      "slow down, take it easy now",
      "just chill today, nowhere to be",
      "put everything off till tomorrow",
      "stay here in this moment, feel it",
      "relax, just breathe, just be",
    ],
    bridge: [
      "rest days are necessary too",
      "it's okay to take a break",
      "treat yourself a little kinder",
      "no hurry, life is long enough",
    ],
    outro: [
      "again tomorrow, slowly now",
      "good work today, you made it",
      "the night grows quiet and still",
    ],
  },
  aggressive: {
    intro: [
      "that's it, I've had enough",
      "scream it out, let it go",
      "I'll break it all apart",
    ],
    verse: [
      "rage is flooding through my veins",
      "against this world I raise my fist",
      "the age of silence ends today",
      "I rebel with every breath I take",
      "done with all the fake smiles now",
      "I'll live my truth, that's all",
      "rip the mask off, speak the real",
      "I won't bow to any of you",
    ],
    "pre-chorus": [
      "no more silence",
      "I'll say it all",
      "can you hear me",
      "this is my answer",
    ],
    chorus: [
      "scream it out, with everything",
      "let the rage break free",
      "this is what I really mean",
      "tear it down and build it new",
      "nothing stops me, I push through",
      "I'll fight everything",
    ],
    bridge: [
      "still standing, battered as I am",
      "the unbreakable heart is the weapon",
      "not with hate but with this fire",
      "I will change this world we're in",
    ],
    outro: [
      "this fight will never end",
      "still I'll keep on screaming",
      "this is how I choose to live",
    ],
  },
};

function pickLines(pool: string[], count: number, seed: number): string[] {
  if (pool.length === 0) return [];
  const start = seed % pool.length;
  const result: string[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    result.push(pool[(start + i) % pool.length]);
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
  const enMoodKey = moodKey in EN_LINES ? moodKey : "melancholic";
  const enPool = EN_LINES[enMoodKey][sectionKey] ?? EN_LINES.melancholic[sectionKey];

  if (englishRatio === "high") {
    // EN: 全行英語
    return pickLines(enPool, count, seed);
  }

  if (englishRatio === "mixed") {
    // MIX: 英語と日本語を交互に
    const half = Math.ceil(count / 2);
    const en = pickLines(enPool, half, seed);
    const jp = pickLines(jpPool, count - half, seed + 1);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(i % 2 === 0 ? (jp[Math.floor(i / 2)] ?? en[i] ?? "") : (en[Math.floor(i / 2)] ?? jp[i] ?? ""));
    }
    return result.slice(0, count);
  }

  // low: 全行日本語
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
  return pickSectionList(input);
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

// How many theme lines to inject per section type (out of total count)
const THEME_INJECTION: Partial<Record<SectionType, number>> = {
  intro:         2, // 100% of 2
  verse:         2, // 50% of 4
  "pre-chorus":  2, // 100% of 2
  chorus:        4, // 100% of 4
  bridge:        2, // ~67% of 3
  outro:         2, // 100% of 2
};

export function buildLyricsDraft(input: SongInput): LyricsDraft {
  const sections = getSections(input);
  const titleWord = input.title.trim();
  let seed = (input.mood.charCodeAt(0) || 0) + (input.genre.charCodeAt(0) || 0);

  // Extract theme motifs once — used across all sections
  const themeMotifs =
    input.theme?.trim() && input.englishRatio !== "high"
      ? extractThemeMotifsForLyrics(input.theme)
      : [];

  const result: LyricsSection[] = sections.map((tag) => {
    const poolKey = SECTION_KEY_MAP[tag] as SectionType;
    const count = SECTION_LINE_COUNTS[tag] ?? 4;

    let lines: string[];

    if (themeMotifs.length > 0) {
      // How many theme lines for this section
      const themeCount = THEME_INJECTION[poolKey] ?? Math.ceil(count / 2);
      const poolCount = count - Math.min(themeCount, count);

      const themeLines = buildThemeLines(themeMotifs, poolKey, themeCount, seed) ?? [];
      const poolLines =
        poolCount > 0
          ? getSectionLines(poolKey, input.mood, input.englishRatio, poolCount, seed + 1)
          : [];

      // Theme lines first, pool lines fill the rest
      lines = [...themeLines, ...poolLines].slice(0, count);
    } else {
      // No theme — legacy path with single-word injection
      lines = getSectionLines(poolKey, input.mood, input.englishRatio, count, seed);
      const keyword = extractKeyword(input.theme ?? "");
      if (keyword) lines = injectKeyword(lines, keyword);
    }

    seed = (seed + 7) % 100;

    // Title as final chorus line
    if (tag === "Chorus" && titleWord) {
      lines = lines.map((l, i) => (i === lines.length - 1 ? titleWord : l));
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

// ─── Expansion-first lyrics fallback ─────────────────────────────────────────
//
// Used when WorldExpansion is present but the Claude API is unavailable (503).
// Builds a world-specific lyrics scaffold from expansion data — NOT from generic
// mood pools. Guarantees that expansion-path generate always uses expansion data.

type SectionTag =
  | "Intro" | "Verse 1" | "Verse 2"
  | "Pre-Chorus" | "Chorus" | "Bridge" | "Outro";

function expansionSectionList(input: SongInput): SectionTag[] {
  // RuleBasedSectionKey is a subset of SectionTag — cast is safe
  return pickSectionList(input) as SectionTag[];
}

/**
 * Builds a basic but world-specific lyrics scaffold from WorldExpansion data.
 * Called when expansion is present but Claude API is unavailable.
 * Unlike buildLyricsDraft, this never falls back to generic mood pools.
 */
export function buildExpansionLyricsFallback(
  expansion: WorldExpansion,
  input: SongInput
): string {
  const obj   = expansion.objects;
  const scene = expansion.scene;
  const contr = expansion.contradiction;

  // Safely index into arrays that may be short
  const o = (i: number) => obj[i % Math.max(obj.length, 1)] ?? "";
  const s = (i: number) => scene[i % Math.max(scene.length, 1)] ?? "";

  const c0 = contr[0] ?? "";
  const c1 = contr[1] ?? c0;

  // Chorus: built from contradiction (emotional core) + key motifs
  const chorusLines = [
    c0 || (o(0) ? `${o(0)}の中に全てがある` : "それだけが残る"),
    o(0) ? `${o(0)}を見つめる`            : s(0) || "目が離せない",
    o(1) ? `${o(1)}が答えだ`              : "ここにいる",
  ];

  const sections: string[] = [];
  const push = (tag: string, lines: string[]) => {
    sections.push(`[${tag}]\n${lines.filter(Boolean).join("\n")}`);
  };

  for (const tag of expansionSectionList(input)) {
    switch (tag) {
      case "Intro":
        push(tag, [
          s(0) || (o(0) ? `${o(0)}が静かに光る`    : "薄暗い空間に入る"),
          o(0) ? `${o(0)}の匂いが漂う`              : "息を詰める静寂",
        ]);
        break;

      case "Verse 1":
        push(tag, [
          s(1) || (o(0) ? `${o(0)}に向かって座る`  : "一人で佇んでいる"),
          o(1) ? `${o(1)}が揺れる`                  : "何かが揺れている",
          o(0) ? `${o(0)}だけがここにある`           : "それだけがある",
          s(2) || "静かに時間が過ぎる",
        ]);
        break;

      case "Verse 2":
        push(tag, [
          o(2) ? `${o(2)}に触れながら`              : "手を伸ばして",
          o(0) ? `${o(0)}が冷めていく`              : "時間が流れる",
          o(1) ? `${o(1)}の音がする`                : "何かが鳴る",
          s(0) || "終わりを待つ",
        ]);
        break;

      case "Pre-Chorus":
        push(tag, [
          c0 || "それでも離れられない",
          o(0) ? `${o(0)}の前で`                    : "ここにいる",
        ]);
        break;

      case "Chorus":
        push(tag, chorusLines);
        break;

      case "Bridge":
        push(tag, [
          s(2) || c1 || "光と影が交差する",
          o(0) ? `${o(0)}は消えない`                : "それは永遠だ",
          c1 !== c0 ? c1 : (o(1) ? `${o(1)}が問いかける` : "答えはどこだ"),
        ]);
        break;

      case "Outro":
        push(tag, [
          o(0) ? `${o(0)}が消えていく`              : "静かに消えていく",
          "また待つ",
        ]);
        break;
    }
  }

  return sections.join("\n\n");
}
