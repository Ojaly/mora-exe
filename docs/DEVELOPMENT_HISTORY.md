# MORA.exe — 開発経緯・設計変更履歴

このドキュメントは MORA.exe の設計思想の変遷・実装上の判断・問題と修正を記録する。  
別 PC や将来の自分が「なぜこうなっているか」を理解して開発を再開できることを目的とする。

---

## 1. 当初の構造：Form-based Prompt Builder

### 初期コンセプト

最初の MORA.exe は **フォームベースの Style Prompt 組み立てツール** だった。

```
ジャンル選択 (jpop / jrock / ...)
  + Mood選択 (melancholic / energetic / ...)
  + Vocal選択 (female / male / ...)
  + BPM入力
  + Key選択
  → buildStylePrompt() → Style Prompt 文字列
```

- `GENRE_MAP`, `MOOD_MAP`, `VOCAL_MAP` などの辞書から組み合わせ
- モーラ分析（Mora Tuner）は当初から存在
- Lyrics は mood プールから random pick（`buildLyricsDraft`）

### 問題点

- フォームを埋めると「誰が作っても同じような J-Pop プロンプト」になる
- Genre 選択が dominant になり、世界観の独自性が出ない
- `female vocal, clear and expressive` が hardcode されるなど、World Seed の内容が無視される
- 「何が言いたいか」ではなく「何のジャンルか」が起点になってしまっていた

---

## 2. World Forge の追加：WorldExpansion-first への転換

### 変更の動機

「退廃的なうどん愛を語る偏執狂」という World Seed を入力した時、
`J-Pop, melancholic, female vocal` が出てきてしまう問題に気づいた。

正しい出力は `obsessive minimal, devotional, dry male, hushed` であるべきだ。

Genre / Mood / Vocal のフォームを埋めることが精度向上につながるのではなく、
**世界観を正確に記述することが最も重要な入力である** という結論に至った。

### 実装内容

- `WorldExpansion` 型の設計
  - `scene[]` — 映画的な断片（視覚・感覚）
  - `emotion[]` — 感情ワード
  - `texture[]` — ソニックテクスチャ
  - `objects[]` — 具体的なモチーフ
  - `contradiction[]` — 内部的な矛盾・緊張
  - `soundDirection[]` — Suno スタイルの音楽的記述
  - `musicDirection` — MORA.exe の音楽的解釈（MusicDirection 型）
  - `stylePromptDraft` — 参考用の Style Prompt 草稿
  - `lyricsDirection` — 歌詞の切り口（日本語）

- `MusicDirection` 型
  - `genreHint` — 世界固有の genre 感（"ritualistic downtempo neo-soul" のような、standard genre 名ではないもの）
  - `atmosphere` — 2〜4 の感覚的記述
  - `tempoFeel` — テンポの質感
  - `bpmEstimate` — 推定 BPM（null 可）
  - `vocalStyle` — ボーカルの質感 + マイク処理
  - `instruments[]` — 2〜4 の楽器
  - `moodWords[]` — 3〜5 の気分ワード
  - `source: "claude" | "rule"` — 推定ソース

- `buildStylePromptFromExpansion` の思想
  - `[Style:]` は `atmosphere` を先頭に、`genreHint` は括弧内に置く（大気圧 > ジャンル）
  - Vocal / Instruments は dropdown ではなく musicDirection から
  - contradiction → `[World:]` として最後のほうに置く

- `/api/ai/forge/route.ts`
  - Claude API ある場合 → Claude によるリッチな展開
  - Claude API ない場合 → regex + 辞書の `ruleBasedForge()`（十分動作する）

---

## 3. Source Alchemy の追加

### 変更の動機

「現実の出来事や記事から音楽を作りたい」というユースケースが出てきた。

しかし、現実のテキストをそのまま World Seed にしてしまうと：
- 固有名詞が混入して Suno が固有名詞に引っ張られる
- 時事的な話題が歌詞に出てしまう
- 「普遍的な世界観」にならない

### 実装内容

Source Alchemy は **現実素材 → 世界観の種** への変換レイヤー。

**10の錬金法則（system prompt に明記）：**
1. 固有名詞は一切出力しない
2. 時事的な要素を完全に排除
3. ニュースの見出しのような出力は禁止
4. 感情の普遍的な核だけを抽出
5. 比喩・感覚的イメージで語る
6. 出力に「世界種」を必ず含める
7. ...（詳細は `/api/ai/alchemy/route.ts` の system prompt 参照）

**設計上の重要な決定：**
- Source Alchemy は **Generate ルートを持たない**
- CTA は「→ Set as World Seed」のみ
- Source Alchemy → World Seed → World Forge → Generate という流れを強制
- Source Alchemy には rule-based fallback なし（抽象化の質が命なので Claude 必須）

---

## 4. Rewrite UI のカテゴリ整理

### 変更前の問題

Rewrite ボタンがフラットに並んでいて何を選べばよいか分かりにくかった。
また `poetic`・`ironic`・`ojaly` といった新しいモードが追加されるたびに
ボタン群が肥大化した。

### 変更内容

3カテゴリに分類：

```
REWRITE: キャッチー / 短縮 / サビ強化 / AI臭除去 / ojaly.化
TONE:    ダーク / ダンサブル / 詩的 / 皮肉
LANG:    JP多め / EN多め
```

SECTION（全体/サビ/ヴァース/プリコーラス/ブリッジ）+ INTENSITY（subtle/medium/aggressive）
は一段目に compact にまとめた。

---

## 5. ojaly. preset の正式化

### 変更の動機

開発者（ojaly.）自身の美学的方向性を、Rewrite preset として MORA.exe に組み込む。
「説明を削り、余韻・夜・ミニマルな比喩に寄せる」スタイル。

### 実装内容

`lib/rewriteModes.ts` の `makeOjaly()` 関数 + `/api/ai/rewrite/route.ts` の ojaly instruction：

```
- more minimal — fewer words, more negative space
- more nocturnal — the world is dark, late, uncertain
- more poetic — metaphor and resonance over direct statement
- more emotionally restrained — feelings hinted, never shouted
- more cinematic — a scene, not a sentiment
- slightly ironic or uncanny — something slightly off, not fully resolved
- less explanatory — trust the image, delete the interpretation
- less generic J-Pop — no 光/明日/君の笑顔 clichés
- more memorable chorus — short, strange, stays in the head long after
```

Rewrite bar でボタンに `title` 属性（tooltip）あり：`"説明を削り、夜・光・余韻・皮肉・ミニマルな比喩に寄せる"`  
スタイル: violet border（他の REWRITE ボタンと視覚的に区別）

---

## 6. Detected Direction パネルの強化

### 変更前の状態

最初の MusicDirectionPanel は 5 行の詩的なテキスト表示で、  
「MORA.exe はこう感じた」という雰囲気出しのみだった。

### 変更後

ラベル行テーブル形式に変更し、各フィールドを明示：

| ラベル | 内容 |
|--------|------|
| GENRE HINT | 世界固有の genre 感（standard genre 名ではない） |
| ATMOSPHERE | 2〜4 の感覚的記述 |
| TEMPO FEEL | テンポの質感 + BPM 推定 |
| VOCAL | ボーカルテクスチャ + マイク処理 |
| INSTRUMENTS | 2〜4 の楽器 |
| LYRIC ANGLE | 歌詞の切り口（`lyricsDirection`） |

これにより「MORA.exe が何を推定しているか」がユーザーに見えるようになり、
Forge → Generate の接続を信頼できるようになった。

---

## 7. Generate が Forge 結果を無視していた問題と修正

### 発見された問題

`expansion` が存在して「World Forge active — expansion-first generate」が表示されているにもかかわらず、
実際の出力が expansion の内容を反映していないケースが存在した。

**根本原因：3つ**

#### 原因1：`buildStylePromptFromExpansion` の重複バグ

```typescript
// バグのあるコード
const styleAtm = [md.atmosphere, ...md.moodWords.slice(0, 3)]
  .filter(Boolean).join(", ");
// → "spiritual, devotional, ラーメン-scented, intimate, spiritual, devotional"
// moodWords は atmosphere の構築元なので、連結すると重複する
```

`md.atmosphere` は `ruleBasedMusicDirection` 内で `styleWords + motif` から構築されており、
`md.moodWords` も同じ `styleWords` から作られる。両方を `[Style:]` に連結すると重複になる。

**修正：**
```typescript
// atmosphere のみ使用（moodWords は atmosphere に内包済み）
lines.push(`[Style:] ${md.atmosphere}${genreLabel}`);
```

#### 原因2：`lyricsDirection` が Style Prompt に含まれていなかった

`lyricsDirection`（歌詞の切り口）は API prompt（Claude へのリクエスト）には含まれていたが、
ユーザーが見る Style Prompt には含まれていなかった。

**修正：**
```typescript
if (expansion.lyricsDirection) {
  lines.push(`[Lyric Direction:] ${expansion.lyricsDirection}`);
}
```

#### 原因3：API 失敗時の fallback が expansion を無視していた

Claude API が 503（未設定）の場合、フォールバックが：
```typescript
const ly = draftToRaw(buildLyricsDraft(input));  // ← generic mood pool を使用
```
となっており、Style Prompt は expansion ベースなのに歌詞は「街の灯りが滲んで消えて」などのジェネリック行になっていた。

**修正：**
`buildExpansionLyricsFallback(expansion, input)` を `lib/lyricsBuilder.ts` に追加。
`expansion.scene` / `expansion.objects` / `expansion.contradiction` から世界固有の行を構築する。
generic mood pool は expansion があるかぎり使われない。

#### `handleGenerate` の構造変更（`app/page.tsx`）

```typescript
// Before: 分岐が不明確、fallback が expansion を無視
const sp = expansion ? buildStylePromptFromExpansion(...) : buildStylePrompt(...)
// ...API call...
// fallback:
const ly = draftToRaw(buildLyricsDraft(input));  // ← expansion があっても使われる
```

```typescript
// After: 二分岐 + 早期リターン
if (expansion) {
  // PATH A: 完全 expansion-first
  setStyle(buildStylePromptFromExpansion(...))
  // API 失敗 → buildExpansionLyricsFallback（world固有）
  return  // ← 必ず早期リターン
}
// PATH B: Legacy（expansion なし）— ここに到達しない
```

---

## 8. サイドバーの思想順再設計

### 変更前の問題

- Genre / Mood / Vocal の dropdown が目立つ場所にあった
- World Forge が「追加機能」に見えた
- Fine Tune セクションが dominant だった

### 変更後の順序と思想

```
⚗ Source Alchemy    ← 現実素材の入口（常に折りたたみ可、subtitle visible）
World Seed + Forge  ← 主役（常に表示）
Fine Tune           ← 補助（折りたたみ可）
Avoid / Negative    ← 独立セクション（折りたたみ可）
Guided Mode         ← レガシー（dim表示、深く折りたたみ）
▶ GENERATE          ← 常時 sticky footer
```

**設計意図：**
- サイドバーを見れば「MORA.exe の制作フローが分かる」
- Fine Tune は主役に見えてはいけない（Genre / BPM は World Forge の補正に過ぎない）
- Guided Mode（Wizard）は「World Seed で語りにくい場合の代替」として dim 表示

**Main production flow（本線）：**
```
World Seed → World Forge → Genre / Style → Fine Tune → Structure → Generate
```
Guided Mode（Wizard）は legacy alternative path。Q&A で入力を補助するが、
expansion-first パスを経由しないため本線の制作ダッシュボードとは別系統として扱う。
Wizard コードは保留・削除はしないが、今後の機能開発は本線を優先する。

---

## 9. GENRE / STYLE 制御レイヤー整備（2026-05）

### 9-1. Genre Lock Phase 1

**問題意識：**
World Forge が世界観を展開しても、Generate 時のジャンル制御が弱く、
「J-Pop として作りたい」「Jazz に固定したい」という明示的な骨格指定ができなかった。

**実装内容：**

- GENRE / STYLE Controller を Sidebar に追加
- `genreLock` フィールドを `SongInput` に追加（`""` = AI 任せ、値あり = ロック）
- `[GENRE LOCK: X]` タグを Style Prompt の先頭に挿入（`buildStylePrompt` / `buildStylePromptFromExpansion`）
- instruments / negative も genreLock に応じて切り替え（`GENRE_INSTRUMENTS` / `GENRE_NEGATIVES`）
- `regenerateLyrics` でも genreLock を引き渡し
- structure variation（`structureVariation.ts`）でも genreLock を考慮
- Legacy lyrics AI（`/api/ai/generate`）のプロンプトに genreLock を反映
- Forge 由来の `md.genreHint` は genreLock があっても上書きせず保持（世界観の個性を守る）

**Forge lyrics（`/api/ai/generate` forged path）への追加：**
- `GENRE LOCK` 行を system prompt に追加（Forge 経由でも骨格が固定される）

**関連コミット：**
`0d95f0c feat: add genre lock controller` /
`4895c4f fix: respect genre lock in structure variation` /
`a71c630 fix: pass genre lock to legacy lyrics prompt` /
`07e78be fix: pass genre lock to forged lyrics prompt`

---

### 9-2. Style Modifiers Phase 2 MVP

**問題意識：**
Genre Lock で音楽骨格は固定できるようになったが、
「bedroom っぽさ」「lo-fi 感」など音像の質感を積み重ねる手段がなかった。

**実装内容：**

- `subStyles` フィールドを `SongInput` に追加（`string[]`）
- Sidebar に SUB STYLE チップを追加（複数選択可）
- 初期チップ一覧：`bedroom` / `acoustic` / `lo-fi` / `analog` / `retro` / `minimal` / `lush` / `cinematic` / `distorted` / `danceable`
- `buildStylePrompt` / `buildStylePromptFromExpansion` に `[Style Modifiers:]` タグとして反映
- nudge チップ・API route は今回は触らず（既存 nudge との重複整理は次フェーズ）

**関連コミット：**
`e23e871 feat: add style modifiers`

---

### 9-3. Genre / Style localStorage 永続化

**問題意識：**
`genreLock` / `subStyles` は制作セッションをまたいで保持したい「制作環境設定」だが、
React state のみで管理されていたためリロードで消えていた。

**実装内容：**

- `app/page.tsx` の既存 mounted パターンを踏襲し、2キーを永続化
  - `mora-genre-lock`（string）
  - `mora-sub-styles`（JSON string[]）
- 読み込み：マウント時の単一 `useEffect` 内で `getItem` → 型ガード → `setInput` パッチ
- 書き込み：`input.genreLock` / `input.subStyles` の変化を監視する write `useEffect`（mounted 後のみ）
- `SongInput` 全体は保存しない（`title` / `theme` / `lyrics` などはセッション単位の揮発）
- SAMPLE ボタンは `genreLock` / `subStyles` に触れない設計を維持
- Clear / 全解除 → `setInput` 更新 → write `useEffect` が拾って localStorage も更新される

**耐性設計：**
- `mora-sub-styles` の `JSON.parse` は `try/catch` で保護
- 配列でない場合は `[]` にフォールバック
- `string` 以外の要素は `filter` で除外

**関連コミット：**
`d83c82b feat: persist genre style settings`

---

### 9-4. 追加された検収 docs

| ファイル | 対象 |
|----------|------|
| `docs/genre-lock-phase1-checklist.md` | Genre Lock Phase 1 の検収チェックリスト |
| `docs/style-modifiers-phase2-checklist.md` | Style Modifiers Phase 2 MVP の検収チェックリスト |
| `docs/genre-style-persistence-checklist.md` | localStorage 永続化の検収チェックリスト（耐性テスト含む） |

---

### 9-5. cliché Guard / Imagery Guard 追加

**問題意識：**
AI 生成歌詞が World Seed の内容に関わらず、蛍光灯・雨に濡れた街・夜明け前などの
定番都市夜景メタファーに逃げる問題があった。Seed が全く異なる世界観でも
generic urban night imagery が出力されることが繰り返されていた。

**実装内容：**

- `app/api/ai/generate/route.ts` の BANNED_PHRASES を拡張
  - 英語6語句追加: `"neon-lit streets"` / `"rain-soaked streets"` / `"fluorescent flicker"` /
    `"loneliness in the crowd"` / `"city lights below"` / `"tears in the rain"`
  - 日本語6語句追加: `"蛍光灯"` / `"滲んだ街明かり"` / `"雨に濡れた街"` / `"夜明け前"` / `"光と影"` / `"誰もいない部屋"`
- VISUAL IMAGERY RULE を BANNED PHRASES 直後に追加
  - Seed に夜景・雨・蛍光灯の要素がない場合、generic urban night imagery に逃げないルール
  - Seed に明示されている場合は使用可（単語単体の禁止ではなく定型フレーズを封じる方針）
- `lib/promptBuilder.ts` の `buildNegativePrompt` avoidAiCliche branch に imagery guard を追加
  - `"generic night-city imagery, neon-aesthetic clichés, rain-soaked street visuals"` を追加
  - Suno が音楽的に夜景 city-pop 方向に引っ張られるのを avoidAiCliche ON 時に抑制

**設計方針：**
- 単語単体（`"neon"` / `"rain"` / `"蛍光灯"` の文字単体）は禁止しない
- 定番の組み合わせフレーズのみを封じる
- Seed / Style Prompt に明示された表現はそのまま使える余地を残す

---

### 9-6. Micro Genre Genre Lock サポート（Phase 2 Batch 1）

**問題意識：**
Genre Lock の選択肢が大分類（J-Pop / Jazz / Funk など）に限られており、
`Electro Funk` / `Corporate Electro Funk` / `Digital Motown` のような
micro genre を指定しても Style Prompt に正しく反映されなかった。

具体的には `buildStylePromptFromExpansion` が S1（ジャンル）に Forge の `md.genreHint` を、
S3（楽器）に `md.instruments` をそのまま使うため、
genreLock に `electro-funk` を指定しても Forge が推定した `upright bass / brushed snare / muted trumpet`
（jazz 方向）が出力されてしまっていた。

**実装内容：**

- `GENRE_MAP` に 4 件追加
  - `"electro-funk"` / `"corporate-electro-funk"` / `"digital-motown"` / `"nu-disco-soul"`
- `INSTRUMENTS_MAP` に 4 件追加（genre-specific 楽器セット）
  - 例: `"electro-funk": "Roland Juno-106, LinnDrum, synth slap bass, filtered chord stabs, drum machine"`
  - 例: `"corporate-electro-funk": "Roland Juno-106, LinnDrum, vocoder, rhythm synth guitar, sterile bass synth"`
- `GENRE_NEGATIVES` に 4 件追加（Forge 由来の incompatible 楽器を排除）
  - 例: `"electro-funk"` → `"acoustic blues guitar, orchestral soul, upright piano ballad, organic folk instrumentation"`
- `buildStylePromptFromExpansion` S1 修正
  - `genreLock` が設定されている場合、`genreRoot = GENRE_MAP[lockedGenreExp]` を使用（`md.genreHint` を使わない）
  - Forge の `md.atmosphere` は保持（世界観の解釈は維持する）
- `buildStylePromptFromExpansion` S3 修正
  - `INSTRUMENTS_MAP[lockedGenreExp]` が存在する場合、Forge の `md.instruments` を上書き
  - 存在しない場合は Forge にフォールバック
- `components/Sidebar.tsx` の `GENRE_OPTIONS` に 4 件追加

**設計方針：**
- Forge の atmosphere / moodWords は genreLock があっても上書きしない（世界観の個性を守る）
- Micro genre の楽器定義が INSTRUMENTS_MAP に存在する場合のみ上書き（既存ジャンルには影響なし）
- INSTRUMENTS_MAP への追加なしで Forge フォールバックが維持されるため、
  新しい micro genre key を GENRE_MAP だけに追加した場合も動作する

**関連コミット：**
`cd0872d feat: add micro-genre Genre Lock support (phase 2 batch 1)`

---

## 10. 12-Step Prompt Builder（Phase 1A）

### 背景と目的

旧 Wizard（Guided Mode）は「初心者向けの Q&A 入力補助」として設計されたが、
実際にユーザーが必要としているのは **Suno 用 Style Prompt を 12 個の制作判断に分解して設計するモード** だった。

特に以下の問題があった：
- `Corporate Electro Funk` / `Digital Motown` / `Dark Electro Gospel` / `French House Waltz` のような
  micro genre / style preset は、既存の Genre Lock（大分類選択）では表現しきれない
- GENRE_MAP / INSTRUMENTS_MAP への手動追記が必要で、新しい micro genre を都度 hardcode する必要があった
- Forge が推定したジャンルが意図しないものでも、Structure Prompt を自由に補正する手段がなかった

**旧 Wizard との違い：**

| | 旧 Wizard | 12-Step Builder |
|---|---|---|
| 対象 | 初心者向け Q&A | 制作者向け設計シート |
| 入力方式 | ステップガイド | 12 項目並列選択 |
| 出力 | SongInput 全体 | Style Prompt のみ |
| 接続 | レガシーパス | 独立出力（UI 接続は Phase 1B 以降） |
| 位置づけ | legacy alternative | 新設（本線への組み込みを想定） |

### 実装内容（Phase 1A — コア生成ロジックのみ）

**対象ファイル：**
- `types/index.ts` — 型追加
- `lib/promptBuilder12.ts` — 新規作成

**追加した型（`types/index.ts`）：**
```typescript
PromptBuilderStepOption  // 選択肢 1 件（value / label / promptFrag）
PromptBuilderStep        // Step 1 件（id / label / labelJa / options / selected / custom / weight）
PromptBuilder12State     // { steps: PromptBuilderStep[] }
PromptBuildResult        // { prompt: string; charCount: number }
```

**12 Step 定義（`DEFAULT_STEPS`）：**

| # | ID | 役割 | Weight |
|---|----|------|--------|
| 1 | `genre-foundation` | ジャンルの核（Custom = genre 名） | heavy |
| 2 | `tempo-feel` | テンポ感 | medium |
| 3 | `genre-density` | ジャンル密度 | light |
| 4 | `vocal-texture` | 声の質感 | heavy |
| 5 | `vocal-processing` | ボーカルエフェクト | medium |
| 6 | `electronic-treatment` | 電子処理の量 | light |
| 7 | `lead-instrument` | メイン楽器 | heavy |
| 8 | `drum-direction` | ドラムの性格 | heavy |
| 9 | `bass-direction` | ベースの性格 | medium |
| 10 | `space-treatment` | 空間処理・残響 | medium |
| 11 | `world-atmosphere` | 世界観・情緒 | heavy |
| 12 | `final-impression` | 最終印象 | medium |

**各 Step の入力モデル：**
- 選択肢 A / B / C から 1 つ選ぶ（ラジオ選択）
- Custom テキストを入力（全 Step 対応、日英問わず受け付ける）
- 未入力の Step はスキップ（Style Prompt に寄与しない）
- 選択肢 + Custom 両方ある場合: Custom が先頭、選択肢が補足
  - 例: `"LinnDrum, drum machine, tight and quantized"`

**`resolveGenreFoundation()`（Step 1 専用）：**
- Custom = 実際の genre 名（例: `"Corporate Electro Funk"`）
- 選択肢 = 密度・アプローチ修飾語（例: `"genre-definitive, style-consistent production"`）
- 両方ある場合: `"Corporate Electro Funk, genre-definitive, style-consistent production"`
- Custom のみ: `"Dark Electro Gospel"`（そのまま）
- これにより GENRE_MAP への hardcode なしに任意の micro genre を指定できる

**`buildStylePromptFrom12Steps()` 出力ロジック：**
- 出力順: genre → density → tempo → lead → drum → bass → electronic → vocal → vocal-fx → space → atmosphere → impression
- 800 文字以内に収める（`CHAR_LIMIT = 800`）
- 超過時: light step（genre-density / electronic-treatment）を先に削除、次に medium step を削除
- heavy step（genre / lead / drum / vocal-texture / atmosphere）は自動トリム対象外
- 最終手段: hard-cut + `"..."`
- 返却: `{ prompt: string; charCount: number }`

**検証用サンプル（`makeSampleState()`）：**
- Corporate Electro Funk + Roland Juno-106 + LinnDrum + synth slap bass + obsessive corporate atmosphere
- 出力例: `450 / 800 文字`

### 現時点での未実装（Phase 1B 以降）

| 項目 | 状況 |
|------|------|
| UI（`PromptBuilder12Panel`） | 未接続（`components/` / `Sidebar.tsx` / `app/page.tsx` は未変更） |
| localStorage 保存 | 未実装 |
| 日本語 Custom の自動英語化 | 未実装（Phase 1 では英語入力を推奨するのみ） |
| 曖昧語変換（「もっと暗く」→ `dark, brooding`） | 未実装（Phase 2） |
| Micro Genre プリセット（Step 1-12 の推奨値セット） | 未実装（Phase 3） |
| Genre Lock / Sub Styles との自動連携 | 未実装（Phase 2） |

**関連コミット：**
`bec5ce4 feat: add 12-step prompt builder core`

---

### 10-1. 12-Step Prompt Builder UI（Phase 1B）

**背景：**
Phase 1A でコア生成ロジック（`lib/promptBuilder12.ts`）が完成したことを受け、
UI を実装してユーザーが操作できる状態にした。

**実装内容：**

- `components/PromptBuilder12Panel.tsx` を新規作成
  - `StepRow` コンポーネント：ラベル（日英）/ チップ選択 / Custom テキスト入力
  - Step 1（`genre-foundation`）の Custom 入力は青ティントで強調（micro genre 名の入力を促す）
  - `buildStylePromptFrom12Steps(state)` を毎レンダーで呼び出し → リアルタイム Preview
  - `{charCount} / 800` 進捗バー（green < 600 / amber 600〜750 / red ≥ 750）
  - `Use as Style Prompt` ボタン → `onApply(prompt)` を呼び出し
  - `SAMPLE` ボタン → Corporate Electro Funk サンプル（`makeSampleState()`）
  - `CLEAR` ボタン → 全 Step リセット（`createInitialState()`）

- `app/page.tsx` に `stylePromptOverride` state を追加
  - PATH A（expansion-first）: `const sp = stylePromptOverride || buildStylePromptFromExpansion(...)`
  - PATH B（legacy）: `const sp = stylePromptOverride || buildStylePrompt(...)`
  - override が空なら従来の generate ロジックがそのまま動作する

- Sidebar footer に override 表示を追加（stale 防止）
  - `↳ 12-Step Prompt Builder active` — override が active な間は常に表示
  - `✕ クリア` ボタン → `setStylePromptOverride("")` で即時解除

**関連コミット：**
`63a21e0 feat: add 12-step prompt builder panel` /
`5660cd4 fix: correct sidebar section numbering`

---

### 10-2. 12-Step Builder 中央カラムへの移動（Phase 1C）

**問題意識：**
Phase 1B では 12-Step Builder を Sidebar の `3. PROMPT BUILDER` セクションに配置していたが、
左 Sidebar の幅（300px）では 12 項目を操作するには狭く、実作業に向かなかった。

また、UI 構造を整理した結果：
- **左 Sidebar** = 制作条件・制御パネル（World Seed / Genre Style / Fine Tune / Structure / Negative / Generate）
- **中央カラム** = 作業台（STYLE PROMPT / LIBRARY / BUILDER）

という役割分担が明確になったため、12-Step Builder を中央へ移動した。

**UI 思想の整理：**

| エリア | 役割 | 内容 |
|---|---|---|
| 左 Sidebar | 制作条件・制御パネル | World Seed / Forge / Genre Style / Fine Tune / Structure / Avoid / Generate |
| 中央 BUILDER | 設計作業台 | 12 項目で Style Prompt を設計する作業台 |
| 中央 STYLE PROMPT | 最終確認 | 生成後の Style Prompt を表示・編集 |
| 中央 LIBRARY | 素材補助 | タグ・ライブラリ選択 |

12-Step Prompt Builder は旧 Wizard（Guided Mode）の代替ではなく、
制作者が Style Prompt を 12 の制作判断に分解して **自分の手で設計する正式な作業台** として位置づける。

**実装内容：**

- `CenterTab` 型を `"prompt" | "library"` → `"prompt" | "library" | "builder"` に拡張
- `MobileTab` 型に `"builder"` を追加（Mobile 6 タブ目: ラベル `"BLDR"`）
- 中央カラムに BUILDER タブ pill を追加
  - override active 時: `BUILDER · active` と表示
- BUILDER タブコンテンツに `<PromptBuilder12Panel>` を配置（`max-w-2xl` でラップ）
  - `onApply`: `setStylePromptOverride(p)` + `setCenterTab("prompt")` → STYLE PROMPT タブへ自動切替
- Mobile BLDR タブ → 適用後 `setMobile("prompt")` で PROMPT タブへ自動切替
- Sidebar の `3. PROMPT BUILDER` CollapseSection を削除
  - Sidebar Props から `onBuilderApply` を削除
  - `promptBuilderOpen` state を削除
  - `PromptBuilder12Panel` の import を削除
- Sidebar セクション番号詰め直し
  - 3. FINE TUNE → 4. STRUCTURE → 5. PROMPT LIBRARY → 6. AVOID / NEGATIVE
- Sidebar footer の `↳ 12-Step Prompt Builder active` + `✕ クリア` は継続維持
- `stylePromptOverride` の PATH A / PATH B 優先ロジックは変更なし
- 旧 Guided Mode は `SHOW_GUIDED_MODE = false` のまま維持

**関連コミット：**
`963a197 refactor: move 12-step builder to center tab`

---

## 11. 現在の到達点（2026-05）

### 実装済み

- [x] World Forge（rule-based + Claude）
- [x] Source Alchemy（Claude 必須）
- [x] WorldExpansion-first Generate
- [x] Detected Direction パネル（ラベル行テーブル）
- [x] Style Prompt 生成（atmosphere-first）
- [x] Lyrics 生成（Claude / expansion fallback / rule-based）
- [x] Rewrite 11 モード（Claude + rule-based fallback）
- [x] ojaly. preset
- [x] Mora Tuner
- [x] Fine Tune（16 nudge チップ + Long / Lang / BPM / Key / Ref / サビ始まり）
- [x] World Lens プリセット（6 種）
- [x] Avoid / Negative
- [x] Prompt Memory（保存・復元）
- [x] Tauri デスクトップアプリ対応
- [x] expansion-first / legacy の完全二分岐
- [x] Genre Lock（genreLock — Style Prompt / instruments / negative / structure variation に反映）
- [x] Style Modifiers（subStyles チップ複数選択 — Style Prompt に反映）
- [x] genreLock / subStyles の localStorage 永続化
- [x] default mood / vocalType バイアス除去（空文字デフォルト化）
- [x] cliché Guard — BANNED_PHRASES 拡張（英語 +6 / 日本語 +6）+ VISUAL IMAGERY RULE
- [x] Imagery Guard — buildNegativePrompt avoidAiCliche branch に夜景 cliché negative 追加
- [x] Micro Genre Genre Lock（electro-funk / corporate-electro-funk / digital-motown / nu-disco-soul）
- [x] buildStylePromptFromExpansion の genreLock 優先ロジック修正（S1 / S3）
- [x] 12-Step Prompt Builder Core（`lib/promptBuilder12.ts` — 型定義 + コア生成ロジック）
- [x] 旧 Guided Mode を Main UI から非表示化（`SHOW_GUIDED_MODE = false`）  
       cliché imagery 混入（"Neon-lit city, rain-soaked streets, cyberpunk"）による退避。  
       コード・ロジックは保持。12-Step Prompt Builder 正式稼働後に deprecation 予定。
- [x] 12-Step Prompt Builder Panel UI（`components/PromptBuilder12Panel.tsx` — 12 Step チップ選択 + Custom 入力 + リアルタイム Preview + Use as Style Prompt）
- [x] `stylePromptOverride` generate 優先ロジック（PATH A / PATH B に `stylePromptOverride || buildStyle...` を追加）
- [x] Sidebar footer に `↳ 12-Step Prompt Builder active` + `✕ クリア` 表示（stale override 防止）
- [x] 12-Step Builder を中央カラム BUILDER タブへ移動（`CenterTab` に `"builder"` 追加）
- [x] BUILDER タブ: override active 時 `BUILDER · active` 表示 / Use as Style Prompt 後に STYLE PROMPT タブへ自動切替
- [x] Mobile BLDR タブ追加（6 タブ目 / 適用後 PROMPT タブへ自動切替）

### 現在の制作レイヤー構造

```
── 左 Sidebar（制作条件・制御パネル）──────────────────────────────────
WORLD SEED      = 世界観・素材（Source Alchemy → World Forge の出発点）
GENRE LOCK      = 音楽骨格（J-Pop / Jazz / Rock など、外側の枠）
STYLE MODIFIERS = 質感・音像タグ（bedroom / lo-fi / cinematic など、内側の色）
FINE TUNE       = 微調整（nudge チップ / BPM / Key / 英語比率など）
STRUCTURE       = 曲構成（preset / builder）
NEGATIVE        = AI 悪癖封じ（Avoid / avoidAiCliche）
── 中央カラム（作業台）─────────────────────────────────────────────────
BUILDER         = 12 項目で Style Prompt を手で設計する作業台（中央 BUILDER タブ）
STYLE PROMPT    = 最終 Style Prompt の確認・編集（中央 STYLE PROMPT タブ）
LIBRARY         = タグ・素材の補助選択（中央 LIBRARY タブ）
```

### アーキテクチャの安定性

- `expansion` がある場合の全ルートが expansion データのみを使うことを保証
- Claude API 未設定でも Source Alchemy 以外はすべて rule-based で動作
- フォーム地獄への退行を防ぐ原則が README・コメントに明文化
- genreLock / subStyles は「環境設定」として localStorage で保持、曲ごとの入力とは分離

---

## 12. 次回以降の改善候補

### 12-Step Prompt Builder（優先）

- **[x] PromptBuilder12Panel UI 実装（Phase 1B）** ✅ 完了  
  `components/PromptBuilder12Panel.tsx` を実装し、中央カラム BUILDER タブに配置（Phase 1C）。

- **[x] 12-Step Builder 中央カラムへの移動（Phase 1C）** ✅ 完了  
  左 Sidebar から中央 BUILDER タブへ移動。UI 思想（Sidebar = 制御パネル / 中央 = 作業台）を整理。

- **[ ] 12-Step Builder 検収チェックリスト作成**  
  Phase 1B / 1C 完了後の動作確認項目を `docs/` に整理。  
  SAMPLE / Use as Style Prompt / STYLE PROMPT 自動切替 / override 解除 / Mobile BLDR などを網羅。

- **[ ] 12-Step Builder 入力状態の localStorage 保存**  
  12-Step の入力状態をセッション間で保持する。  
  genreLock / subStyles の永続化（Section 9-3）と同様のパターンを踏襲。

- **[ ] Style Prompt override の保存/解除仕様検討**  
  `stylePromptOverride` が active なままセッションを跨いだ場合の挙動を定義。  
  localStorage への保存可否・自動解除トリガー（Generate 実行時 / タブ切替時）を検討。

- **[ ] Builder preset / Micro Genre preset の追加**  
  12-Step の推奨値セット（Step 1〜12 のデフォルト値）を  
  `Corporate Electro Funk` / `Digital Motown` などのプリセット名で保存・呼び出しできるようにする。  
  これにより GENRE_MAP / INSTRUMENTS_MAP への hardcode 追記が不要になる。

- **[ ] Genre Lock / Sub Styles との自動連携（Phase 2）**  
  `genreLock` が設定されている場合に Step 1 Custom へ自動反映。  
  `subStyles` が選択されている場合に Step 3 へ自動反映。

- **[ ] 曖昧語変換（Phase 2）**  
  「もっと暗く」→ `dark, brooding`、「海外っぽく」→ `Western production sensibility` など  
  日本語の方向性キーワードを英語 fragment に変換する辞書を追加。

### GENRE / STYLE 周り

- **[ ] nudge 整理**  
  既存の nudge チップと subStyles の役割が一部重複している。
  どちらが Style Prompt に載るか・どちらを優先するかのルールを整理。

- **[ ] GENRE_NEGATIVES 未定義ジャンル補完**  
  `GENRE_NEGATIVES` に登録されていないジャンルが genreLock に選ばれると
  negative が空になる。登録漏れの補完または汎用 fallback の追加。

- **[ ] mood / vocalType 固定値問題の整理**  
  `defaultInput` の `mood: "melancholic"` / `vocalType: "female"` が
  World Forge の推定を上書きするケースがある。
  固定 UI と Forge 推定の優先ルールを明文化。

- **[ ] subStyles の有効値フィルタ**  
  将来 subStyles 選択肢を変更した際、localStorage に旧キーが残る可能性がある。
  読み込み時に現在の有効リストと照合してフィルタリングする実装を追加。

- **[ ] Style Modifiers と nudge の重複整理**  
  `bedroom` / `lo-fi` などは nudge と意味が近い。
  Phase 3 でレイヤーの役割を再定義し、UI を整理する。

### Output Quality

- **[ ] Suno 実機テスト**  
  生成した Style Prompt / Lyrics を実際の Suno に貼り付け、出力音楽との乖離を確認。
  `lyricsDirection` が実際に Claude の歌詞生成に効いているか検証。

- **[ ] Style Prompt 品質改善**  
  `[Style:]` の大気圧記述が Suno にどう解釈されるか不明な点が残る。
  `[Lyric Direction:]` タグが Suno に影響するかも未検証。
  必要に応じてタグ名・記述形式を調整。

- **[ ] Lyrics Direction の反映強化**  
  `lyricsDirection` は API prompt に入っているが、Claude がどの程度従うかは未検証。
  System prompt の強調を調整するか、Lyrics Direction を independent constraint として渡す実装も検討。

### Alchemy・Forge 品質

- **[ ] Source Alchemy 抽象化精度向上**  
  現在の 10 法則では固有名詞が滲み出るケースがある。
  プリンシパル名・地名・商品名の除去をより確実にするための system prompt 改善。

- **[ ] Forge rule-based の精度向上**  
  `themeExtractor.ts` の `extractThemeDescriptors` / `extractThemeMotifsForLyrics` は
  正規表現ベースで限界がある。頻出パターンの追加・edge case 対応。

### Rewrite

- **[ ] Rewrite 差分品質向上**  
  `changedLines` の可視化（行ハイライト）は実装済みだが、
  Claude が返す `changedLines` の精度にばらつきがある。
  system prompt で行番号の数え方を明確化する。

- **[ ] 皮肉・詩的 モードの quality fix**  
  `ironic` / `poetic` は rule-based fallback が弱い。
  `lib/rewriteModes.ts` の `makeIronic()` / `makePoetic()` の代替語辞書を拡充。

### 配布

- **[ ] 配布用 Tauri build 整備**  
  `npm run tauri:build` は動作するが、配布前に以下の確認が必要：
  - Windows コード署名（未設定）
  - Claude API の Tauri リリースビルドでの動作確認
  - インストーラー UI（Tauri の `tauri.conf.json` 調整）

- **[ ] .env.example の内容確認**  
  `.env.example` に `ANTHROPIC_API_KEY=` の記載があるか確認。
  `README.md` のセットアップ手順と一致していること。

---

## 付録：重要な型定義の場所

| 型 | ファイル |
|----|---------|
| `SongInput` | `types/index.ts` |
| `WorldExpansion` | `types/index.ts` |
| `MusicDirection` | `types/index.ts` |
| `AlchemyResult` | `types/index.ts` |
| `RewriteMode` | `types/index.ts` |
| `WorldPresetKey` | `types/index.ts` |
| `PromptBuilderStep` | `types/index.ts` |
| `PromptBuilder12State` | `types/index.ts` |
| `PromptBuildResult` | `types/index.ts` |

## 付録：API Routes 一覧

| エンドポイント | ファイル | Claude 必須 | Fallback |
|--------------|---------|-------------|---------|
| `POST /api/ai/forge` | `app/api/ai/forge/route.ts` | No | `ruleBasedForge()` |
| `POST /api/ai/generate` | `app/api/ai/generate/route.ts` | No | `buildExpansionLyricsFallback()` / `buildLyricsDraft()` |
| `POST /api/ai/rewrite` | `app/api/ai/rewrite/route.ts` | No | `applyRewriteMode()` |
| `POST /api/ai/alchemy` | `app/api/ai/alchemy/route.ts` | **Yes** | なし（503 返却） |
