# Genre Lock Phase 1 — 動作確認チェックリスト

> 作成日: 2026-05-28  
> 対象コミット: `a71c630 fix: pass genre lock to legacy lyrics prompt`  
> 関連コミット: `0d95f0c feat: add genre lock controller`, `4895c4f fix: respect genre lock in structure variation`

---

## テスト前提条件

- dev サーバー起動済み (`npm run dev`)
- ブラウザで `http://localhost:3000` を開く
- TC-1〜TC-6 は ANTHROPIC_API_KEY 不要（rule-based fallback で確認可能）
- TC-4 の歌詞 AI 内容確認は `.env.local` に `ANTHROPIC_API_KEY` が必要

---

## TC-1: Style Prompt 先頭への `[GENRE LOCK]` 挿入

**目的:** `genreLock` 選択 → `buildStylePrompt` 先頭に `[GENRE LOCK: X]` が入るか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | 2. GENRE / STYLE を開き、**何も選択しない** で GENERATE | Style Prompt 先頭に `[GENRE LOCK]` なし |
| 2 | **Rock/Metal** を選択して GENERATE | `[GENRE LOCK: Metal / Hard Rock] Metal / Hard Rock, ...` で始まる |
| 3 | **Jazz** を選択して GENERATE | `[GENRE LOCK: Jazz / Neo-Soul] Jazz / Neo-Soul, ...` で始まる |
| 4 | **Folk** を選択して GENERATE | `[GENRE LOCK: Folk / Acoustic] Folk / Acoustic, ...` で始まる |

**確認箇所:** CENTER カラム → STYLE PROMPT タブのテキスト先頭

---

## TC-2: instruments の変化

**目的:** `genreLock` に応じて楽器構成が変わるか（`effectiveGenreKey` → `INSTRUMENTS_MAP` 参照）

| genreLock | 期待される instruments 文 |
|---|---|
| 未選択（jpop fallback） | `Piano, synth pads, light drums, and bass.` |
| `jazz` | `Upright bass, jazz piano, brushed snare, and muted trumpet.` |
| `folk` | `Acoustic guitar, fingerpicking, light percussion, and strings.` |
| `metal` | `Distorted guitar, double kick drums, power bass, and shredding leads.` |
| `electronic` | `Analog synths, drum machines, and arpeggiated bass.` |

**確認箇所:** Style Prompt テキスト内 3 文目前後（S3: instruments）

---

## TC-3: Negative Prompt の変化

**目的:** `buildNegativePrompt` が `effectiveGenreKey` を参照しているか

| genreLock | 期待される negative 追記 |
|---|---|
| 未選択（jpop fallback） | `excessive auto-tune, generic idol sound` |
| `jrock` | `over-compressed guitars, nu-metal clichés` |
| `hiphop` | `mumble rap aesthetics, trap hi-hat spam` |
| `ambient` | `new-age blandness, generic pad washes` |
| `jazz` / `folk` / `cinematic` 等 | GENRE_NEGATIVES に定義なし → genre 由来の追記なし |

**確認箇所:** CENTER カラム → NEGATIVE タブのテキスト内容

---

## TC-4: Legacy Generate — 歌詞 AI への genreLock 受け渡し

**目的:** `buildLegacyUserPrompt` の `GENRE:` が `genreLock` を反映するか  
**要件:** ANTHROPIC_API_KEY が設定されていること

| # | 操作 | 確認方法 |
|---|---|---|
| 1 | `genreLock = "folk"` を選択 | — |
| 2 | World Seed を入力し、Forge なしで **GENERATE** | — |
| 3 | DevTools → Network → `/api/ai/generate` → Request Payload | `songInput.genreLock: "folk"` が含まれるか |
| 4 | 生成された歌詞を確認 | folk 寄りの語彙・静かなリズム感になっているか |
| 5 | `genreLock` 未選択で同じ Seed で再 GENERATE | `songInput.genreLock: ""` が渡り、jpop 寄りの傾向になるか |

**確認箇所:** DevTools Network タブ + 出力歌詞テキスト

---

## TC-5: Forge → Generate Draft — Style Prompt への genreLock 反映

**目的:** `buildStylePromptFromExpansion` に `[GENRE LOCK]` が入るか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | `genreLock = "jazz"` を選択 | — |
| 2 | World Seed を入力して **FORGE WORLD** を実行 | Forge 展開結果が表示される |
| 3 | **GENERATE DRAFT** をクリック | Style Prompt 先頭: `[GENRE LOCK: Jazz / Neo-Soul]` が入る |
| 4 | Style Prompt のテキストを確認 | `[GENRE LOCK: Jazz / Neo-Soul]` の後に Forge 由来の `md.genreHint` が続く |

**確認箇所:** GENERATE DRAFT 後の CENTER → STYLE PROMPT タブ

> **注意:** Forge パスの歌詞 AI (`buildExpansionUserPrompt`) は Phase 1 未対応。
> 歌詞テキストは Forge の `md.genreHint` に引っ張られる場合がある（既知制限）。

---

## TC-6: Structure Variation — genreLock によるカテゴリ変化

**目的:** `detectGenreCategory` が `effectiveGenreKey` を参照しているか

| genreLock | `input.mood` | 期待される構成カテゴリ | 根拠 |
|---|---|---|---|
| `folk` | `melancholic` | `ballad` | BALLAD_GENRES に `"folk"` 含む / BALLAD_MOODS に `"melancholic"` 含む |
| `electronic` | any | `dance` | DANCE_KW に `"electronic"` 含む（現行実装で成立） |
| `hiphop` | any | `rap` | RAP_KW に `"hiphop"` 含む |
| 未選択（`"jpop"` fallback） | `melancholic` | `ballad` になる可能性あり | BALLAD_GENRES に `"jpop"` 含む・BALLAD_MOODS に `"melancholic"` 含む。ただし実装依存のため fallback 挙動として参考確認 |
| `cinematic` | any | `standard` | DANCE / RAP / THEATRE / BALLAD いずれにも非該当 |

**確認箇所:** 生成歌詞のセクション構成（`[Build]` / `[Drop]` / `[Hook]` などが出るか）

---

## TC-7: genreLock 解除後の fallback 復帰確認

**目的:** チップ再クリックで解除したとき、すべての出力が fallback（jpop）に戻るか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | `genreLock = "jazz"` を選択して GENERATE | `[GENRE LOCK: Jazz / Neo-Soul]` が先頭に入る / jazz instruments |
| 2 | `jazz` チップを**再クリックして解除** | UI 上でチップの青ハイライトが消える |
| 3 | 再度 GENERATE | Style Prompt 先頭に `[GENRE LOCK]` なし / `J-Pop, ...` で始まる |
| 4 | instruments を確認 | `Piano, synth pads, light drums, and bass.`（jpop fallback）に戻る |
| 5 | Negative Prompt を確認 | `excessive auto-tune, generic idol sound`（jpop fallback）に戻る |
| 6 | セクション見出しを確認 | `2. GENRE / STYLE`（バッジなし）になっている |

---

## TC-8: リロード後の genreLock 初期化確認

**目的:** `input`（SongInput）は localStorage に保存されないため、リロードで `genreLock` が空に戻るか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | `genreLock = "folk"` を選択 | UI でチップが青くハイライト、見出しに `· Folk` バッジ表示 |
| 2 | ブラウザをリロード（F5） | ページ再読み込み |
| 3 | 2. GENRE / STYLE セクションを開く | **チップがすべて未選択**になっている |
| 4 | セクション見出しを確認 | `2. GENRE / STYLE`（バッジなし）になっている |
| 5 | GENERATE して Style Prompt を確認 | `[GENRE LOCK]` なし、jpop fallback で生成される |

> **補足:** `genreLock` は `input` state（in-memory）に保持されるため、リロードで初期化される。
> これは `input.genre` / `input.mood` 等の他フィールドと同じ仕様。
> もし永続化が必要になった場合は Phase 2 以降で localStorage 対応を検討する。

---

## 既知制限（Phase 1 未対応）

| 項目 | 詳細 | 対応予定 |
|---|---|---|
| **Forge 歌詞 AI** | `buildExpansionUserPrompt` に `GENRE:` フィールドなし。歌詞 AI には Forge の `md.genreHint` のみ渡る。`genreLock` を設定しても Forge が別ジャンルを推測すれば歌詞はそちらに引っ張られる | Phase 2 |
| **`input.mood` / `input.vocalType` の UI なし** | texture / vocal は常に `defaultInput` の固定値（`"melancholic"` / `"female"`）。genreLock と mood が乖離することがある | 別途検討 |
| **GENRE_NEGATIVES の未定義ジャンル** | `jazz` / `folk` / `cinematic` / `funk` / `kpop` の genre-specific negative が未定義。genreLock してもネガティブ genre 追記なし | 必要なら追加 |
| **Forge パス の `STYLE TAGS`** | `buildExpansionUserPrompt` の `STYLE TAGS` に genreLock が含まれない。Forge の `md.genreHint` との競合を避けるため Phase 1 対象外とした | Phase 2 |

---

## 確認済みコード根拠

| 確認項目 | ファイル | 実装 |
|---|---|---|
| `[GENRE LOCK]` 挿入 | `lib/promptBuilder.ts` | `if (input.genreLock?.trim()) sentences.push(\`[GENRE LOCK: ${genre}]\`)` |
| instruments | `lib/promptBuilder.ts` | `INSTRUMENTS_MAP[effectiveGenreKey]` |
| negative | `lib/promptBuilder.ts` | `GENRE_NEGATIVES[effectiveGenreKey]` |
| regenerate | `lib/promptBuilder.ts` | `GENRE_MAP[effectiveGenreKey]` |
| structure | `lib/structureVariation.ts` | `effectiveGenreKey = input.genreLock?.trim() \|\| input.genre \|\| ""` |
| legacy lyrics AI | `app/api/ai/generate/route.ts` | `GENRE: ${input.genreLock?.trim() \|\| input.genre}` |
| Forge Style Prompt | `lib/promptBuilder.ts` | `buildStylePromptFromExpansion` 先頭に `[GENRE LOCK]` 挿入 |
| DANCE_KW に `"electronic"` | `lib/structureVariation.ts` | `["electronic", "edm", "house", ...]` ✅ |
| BALLAD_GENRES に `"jpop"` | `lib/structureVariation.ts` | `["folk", "acoustic", "city", "jpop", ...]` ✅ |
