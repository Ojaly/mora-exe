# Style Modifiers Phase 2 MVP — 動作確認チェックリスト

> 作成日: 2026-05-28  
> 対象コミット: `e23e871 feat: add style modifiers`  
> 関連ファイル: `components/Sidebar.tsx`, `lib/promptBuilder.ts`, `types/index.ts`, `app/page.tsx`

---

## テスト前提条件

- dev サーバー起動済み (`npm run dev`)
- ブラウザで `http://localhost:3000` を開く
- TC-1〜TC-3 は API 不要（UI 動作のみ）
- TC-4〜TC-5 は STYLE PROMPT タブの出力確認（rule-based, API 不要）
- TC-6 は GENERATE 実行が不要（UI 操作のみ）

---

## TC-1: UI 表示確認

**目的:** SUB STYLE セクションが正しく表示されるか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | サイドバーの **2. GENRE / STYLE** を開く | PRIMARY GENRE チップの下に区切り線 + **SUB STYLE** ラベルが表示される |
| 2 | SUB STYLE エリアのチップ数を確認する | `bedroom` `acoustic` `lo-fi` `analog` `retro` `minimal` `lush` `cinematic` `distorted` `danceable` の10個が表示される |
| 3 | いずれかのチップを1つ選択する | 選択チップが **violet** 系（紫）に変わる。PRIMARY GENRE の **blue** と色が区別できる |
| 4 | genreLock で J-Pop を選択し、SUB STYLE も選択する | genreLock は blue チップ、SUB STYLE は violet チップで共存できる |

**確認箇所:** サイドバー → 2. GENRE / STYLE セクション内

---

## TC-2: 複数選択・解除確認

**目的:** チップの複数選択 / 個別解除 / 一括クリアが正しく動くか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | `bedroom` → `acoustic` → `lo-fi` の順にクリックする | 3つが同時に violet 選択状態になる |
| 2 | 選択済みの `acoustic` をもう一度クリックする | `acoustic` だけ解除され、`bedroom` と `lo-fi` は選択状態のまま |
| 3 | 2つ以上選択した状態で **✕ クリア** ボタンをクリックする | 全選択が解除され、クリアボタンが消える |
| 4 | 全解除後に再度チップを選択する | 問題なく再選択できる |

---

## TC-3: セクション見出し表示確認

**目的:** 選択状態がセクションラベルにカウントとして反映されるか

| # | 条件 | 期待されるラベル |
|---|---|---|
| 1 | genreLock=なし, subStyles=なし | `2. GENRE / STYLE` |
| 2 | genreLock=なし, subStyles=2つ選択 | `2. GENRE / STYLE · +2 style` |
| 3 | genreLock=J-Pop, subStyles=なし | `2. GENRE / STYLE · J-Pop` |
| 4 | genreLock=J-Pop, subStyles=2つ選択 | `2. GENRE / STYLE · J-Pop +2` |
| 5 | genreLock=J-Pop, subStyles=全解除 | `2. GENRE / STYLE · J-Pop`（カウントが消える） |
| 6 | genreLock=解除, subStyles=全解除 | `2. GENRE / STYLE`（元に戻る） |

**確認箇所:** セクション折りたたみヘッダーのラベルテキスト

---

## TC-4: buildStylePrompt への反映確認（Forge なし）

**目的:** 通常の GENERATE フローで subStyles が Style Prompt の genre 直後に挿入されるか

| # | 条件 | 期待される Style Prompt 冒頭 |
|---|---|---|
| 1 | genreLock=なし, subStyles=なし | `J-Pop, melancholic, 90 BPM...`（subStyles なし） |
| 2 | genreLock=なし, subStyles=`bedroom` `acoustic` | `J-Pop, bedroom, acoustic, melancholic, 90 BPM...` |
| 3 | genreLock=J-Pop, subStyles=`lo-fi` | `[GENRE LOCK: J-Pop] J-Pop, lo-fi, melancholic, 90 BPM...` |
| 4 | genreLock=Jazz, subStyles=`minimal` `analog` | `[GENRE LOCK: Jazz / Neo-Soul] Jazz / Neo-Soul, minimal, analog, ...` |
| 5 | subStyles を全解除して再 GENERATE | Style Prompt から subStyles の文字列が消える |

**確認箇所:** CENTER カラム → **STYLE PROMPT** タブのテキスト

---

## TC-5: buildStylePromptFromExpansion への反映確認（Forge 経由）

**目的:** World Forge → Generate Draft 経由でも subStyles が正しく挿入され、Forge 由来の genreHint / atmosphere を壊していないか

| # | 条件 | 期待される Style Prompt |
|---|---|---|
| 1 | Forge 展開済み, subStyles=なし | `Ritualistic downtempo neo-soul with shadowy, layered atmosphere, 90 BPM.`（変化なし） |
| 2 | Forge 展開済み, subStyles=`bedroom` `acoustic` | `Ritualistic downtempo neo-soul, bedroom, acoustic with shadowy, layered atmosphere, 90 BPM.`（genreHint と atmosphere の間に挿入） |
| 3 | Forge 展開済み, genreLock=J-Pop, subStyles=`retro` | `[GENRE LOCK: J-Pop] Ritualistic downtempo neo-soul, retro with shadowy atmosphere, ...` |
| 4 | Forge 展開済み, subStyles を全解除 | TC-5-1 と同じ出力に戻る |

**確認箇所:** CENTER カラム → **STYLE PROMPT** タブのテキスト（Forge → Generate Draft 実行後）

---

## TC-6: 独立解除確認

**目的:** genreLock と subStyles の解除が互いに影響しないか

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | genreLock=J-Pop, subStyles=`bedroom` の状態で genreLock のみ解除 | `bedroom` の選択は残る。Style Prompt から `[GENRE LOCK]` だけ消える |
| 2 | genreLock=J-Pop, subStyles=`bedroom` の状態で SUB STYLE のみ ✕ クリア | genreLock=J-Pop は残る。Style Prompt から `bedroom` だけ消える |
| 3 | genreLock なし + subStyles あり → GENERATE → subStyles クリア → 再 GENERATE | 2回目の Style Prompt に subStyles が含まれない |

---

## 既知制限（Phase 2 MVP スコープ外）

| 項目 | 状態 | 予定 |
|---|---|---|
| localStorage 永続化 | 未対応（リロードでリセット） | Phase 3 候補（genreLock とセット） |
| nudge との意味重複（lo-fi / analog / minimal） | 共存中（意図的） | Phase 3 で整理予定 |
| API route への直接受け渡し | 未対応（Style Prompt 文字列に変換後に渡す） | 変更不要 |
| `dark` / `intimate` チップ | 未追加 | nudge 整理後に検討 |
| genreLock × subStyles 矛盾チェック（例: metal + acoustic） | 未実装 | Phase 3 候補 |

---

## コード根拠

| ファイル | 変更内容 |
|---|---|
| [`components/Sidebar.tsx`](../components/Sidebar.tsx) | `SUB_STYLE_OPTIONS` / `SUB_STYLE_LABELS` 定数、`toggleSubStyle` ハンドラ、チップ UI、ラベル更新 |
| [`lib/promptBuilder.ts`](../lib/promptBuilder.ts) | `buildStylePrompt` S1 に `subStyleStr` 挿入、`buildStylePromptFromExpansion` S1 に `subStyleStrExp` 挿入 |
| [`types/index.ts`](../types/index.ts) | `subStyles?: string[]` — Phase 2 reserved として定義済み（変更なし） |
| [`app/page.tsx`](../app/page.tsx) | `defaultInput` に `subStyles: []` — 定義済み（変更なし） |
