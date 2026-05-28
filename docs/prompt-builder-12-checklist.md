# 12-Step Prompt Builder — 動作確認チェックリスト

> 作成日: 2026-05-28  
> 対象コミット: `963a197 refactor: move 12-step builder to center tab`  
> 関連コミット: `63a21e0 feat: add 12-step prompt builder panel`, `bec5ce4 feat: add 12-step prompt builder core`

---

## テスト前提条件

- dev サーバー起動済み (`npm run dev`)
- ブラウザで `http://localhost:3000` を開く
- ANTHROPIC_API_KEY 不要（すべて rule-based で確認可能）

---

## TC-1: 表示確認

**目的:** 中央カラムに BUILDER タブが追加され、Sidebar から PROMPT BUILDER 本体が消えていること

| # | 確認箇所 | 期待結果 |
|---|---|---|
| 1 | 中央カラム上部のタブ pill | `STYLE PROMPT` / `LIBRARY` / `BUILDER` の 3 タブが並ぶ |
| 2 | `BUILDER` タブをクリック | 12-Step Prompt Builder が表示される |
| 3 | 左 Sidebar をスクロール | `PROMPT BUILDER` セクション本体が存在しない |
| 4 | 左 Sidebar のセクション番号 | `3. FINE TUNE` / `4. STRUCTURE` / `5. PROMPT LIBRARY` / `6. AVOID / NEGATIVE` |
| 5 | 左 Sidebar 内 / Guided Mode | Wizard / Guided Mode UI が表示されない |

---

## TC-2: SAMPLE 確認

**目的:** SAMPLE ボタンで Corporate Electro Funk のサンプルが入力され、Preview が正常に更新されること

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | `BUILDER` タブを開く | 全 Step が空欄の初期状態 |
| 2 | `SAMPLE` ボタンを押す | 各 Step に Corporate Electro Funk のサンプル値が入力される |
| 3 | Preview テキストを確認 | `Corporate Electro Funk` から始まるプロンプトが表示される |
| 4 | 文字数カウンターを確認 | `N / 800` 形式で表示され、N が 800 以内 |
| 5 | 進捗バーの色を確認 | 600 未満: 緑 / 600〜749: 黄色 / 750 以上: 赤 |

---

## TC-3: 入力確認

**目的:** 各 Step のチップ選択・解除・Custom 入力が正常に動作すること

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | 任意の Step の Option chip をクリック | チップが青色（active）になる |
| 2 | 同じ chip を再クリック | チップが通常色に戻る（deselect） |
| 3 | 別の chip をクリック | 前の chip が解除され、新しい chip が active になる |
| 4 | Custom 入力欄に文字を入力 | 入力した文字が欄に表示される |
| 5 | Step 1 の Custom 欄を確認 | 青ティントのスタイル・`Corporate Electro Funk` 系のプレースホルダー |
| 6 | Step 1 Custom に micro genre を入力 | `Dark Electro Gospel` などの任意 micro genre を入力できる |
| 7 | Step 1 以外の Custom 欄 | プレースホルダーが `Custom...` |

---

## TC-4: Preview リアルタイム更新確認

**目的:** Option / Custom の変更が即時に Preview と文字数に反映されること

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | Step 1 Custom に genre 名を入力 | Preview の先頭に入力内容が反映される |
| 2 | Option chip を切り替える | Preview テキストがリアルタイムで変化する |
| 3 | Custom 欄をクリアする | そのステップの内容が Preview から消える |
| 4 | 全 Step を空欄にする | Preview が空になり、「未入力」案内テキストが表示される |
| 5 | 文字数が 800 を超えそうな入力 | 自動トリム（light → medium step の優先削除）が効き 800 以内に収まる |
| 6 | heavy step（Genre / Lead / Drum / Vocal / Atmosphere）をすべて入力 | トリム対象外なため削除されない |

---

## TC-5: Use as Style Prompt 確認

**目的:** Use as Style Prompt ボタンで STYLE PROMPT タブへ自動切替し、内容が反映されること

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | Step 1 Custom に `Corporate Electro Funk` を入力 | Preview にプロンプトが表示される |
| 2 | `Use as Style Prompt` ボタンを押す | 中央カラムが `STYLE PROMPT` タブへ自動切替する |
| 3 | STYLE PROMPT タブの内容を確認 | 12-Step の出力が Style Prompt 欄に表示される |
| 4 | 中央カラム上部のタブ pill を確認 | `BUILDER` タブが `BUILDER · active` と表示される |
| 5 | Use as Style Prompt を空欄状態で押す | ボタンが disabled（押せない） |

---

## TC-6: Override active 確認

**目的:** stylePromptOverride が active な間、Sidebar footer に表示が出て Generate に反映されること

| # | 確認箇所 | 期待結果 |
|---|---|---|
| 1 | Use as Style Prompt 後の Sidebar 下部 | `↳ 12-Step Prompt Builder active` テキストが表示される |
| 2 | 同箇所 | `✕ クリア` ボタンが表示される |
| 3 | override active 状態で GENERATE | 中央の Style Prompt に 12-Step 出力の内容が使われる |
| 4 | World Forge を使わず GENERATE（PATH B） | `stylePromptOverride` が `buildStylePrompt` より優先される |
| 5 | World Forge → GENERATE（PATH A） | `stylePromptOverride` が `buildStylePromptFromExpansion` より優先される |
| 6 | `✕ クリア` を押した後に GENERATE | 従来の `buildStylePrompt` / `buildStylePromptFromExpansion` に戻る |

---

## TC-7: Clear 確認

**目的:** BUILDER 内の CLEAR と Sidebar footer の ✕ クリアがそれぞれ正しく動作すること

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | `SAMPLE` でサンプルを入力後、`CLEAR` ボタンを押す | 全 Step が初期状態にリセットされる |
| 2 | CLEAR 後の Preview を確認 | 空欄状態の案内テキストが表示される |
| 3 | CLEAR 後の `Use as Style Prompt` | ボタンが disabled になる |
| 4 | Sidebar footer の `✕ クリア` を押す | `stylePromptOverride` が解除される |
| 5 | `✕ クリア` 後のタブ pill を確認 | `BUILDER · active` が通常の `BUILDER` に戻る |
| 6 | `✕ クリア` 後の Sidebar footer を確認 | `12-Step Prompt Builder active` / `✕ クリア` が非表示になる |

---

## TC-8: Mobile 確認

**目的:** Mobile 画面幅で BLDR タブが追加され、正常に動作すること

| # | 確認箇所 | 期待結果 |
|---|---|---|
| 1 | Mobile 幅（< lg ブレークポイント）のタブストリップ | `CONCEPT` / `PROMPT` / `LIBRARY` / `LYRICS` / `TUNER` / `BLDR` の 6 タブが表示される |
| 2 | タブストリップの横幅 | 崩れずに 6 タブが収まる（横スクロールまたは自然な縮小） |
| 3 | `BLDR` タブをタップ | `BUILDER` パネルヘッダーと 12-Step Builder が表示される |
| 4 | `BLDR` タブで `Use as Style Prompt` を押す | `PROMPT` タブへ自動切替する |
| 5 | `PROMPT` タブの内容を確認 | 12-Step 出力が Style Prompt 欄に表示される |
| 6 | `CONCEPT` タブの Sidebar footer | override active 時に `12-Step Prompt Builder active` + `✕ クリア` が表示される |

---

## 既知の制限（未実装）

以下は現バージョン（Phase 1B / 1C）では意図的に未実装。

| 項目 | 状況 |
|---|---|
| 12-Step 入力状態の localStorage 保存 | 未実装 — リロードで入力が消える |
| `stylePromptOverride` のリロード跨ぎ保持 | 未実装 — リロードで override が解除される |
| Genre Lock / Sub Styles との自動同期 | 未実装 — genreLock 設定が Step 1 Custom に反映されない |
| 日本語 Custom の自動英語化 | 未実装 — Custom は英語入力を推奨 |
| 曖昧語変換（「もっと暗く」→ `dark, brooding`） | 未実装 — Phase 2 候補 |
| Builder preset / Micro Genre preset | 未実装 — Phase 3 候補 |

---

## コード根拠

| 確認項目 | 関連ファイル |
|---|---|
| 12-Step 定義 / 生成ロジック | `lib/promptBuilder12.ts` |
| UI コンポーネント | `components/PromptBuilder12Panel.tsx` |
| CenterTab / MobileTab 型・BUILDER タブ配置 | `app/page.tsx` |
| stylePromptOverride generate 優先ロジック（PATH A / B） | `app/page.tsx` — `handleGenerate()` |
| Sidebar footer active 表示 / ✕ クリア | `components/Sidebar.tsx` |
| Sidebar セクション番号（3〜6） | `components/Sidebar.tsx` |
