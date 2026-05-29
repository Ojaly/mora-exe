# MORA.exe 開発引継ぎメモ — 2026-05-29

## 1. 現在の Git 状態

| 項目 | 状態 |
|---|---|
| Branch | `master` |
| 最新コミット | `1ebe94e feat: add inline project delete confirmation` |
| origin/master | 同期済み |
| Working tree | clean |

---

## 2. 今回完了した主な作業

| 機能 | コミット | 概要 |
|---|---|---|
| 12-Step Builder state 保存 | `3e383b3` | `mora-builder-12` に selected/custom を保存/復元 |
| built-in Builder Preset | `8726b8f` | 5種のプリセット + `loadPresetState()` |
| centerTab 保存 | `8726b8f` | `mora-center-tab` でタブ復元 |
| Style Prompt override 保存/復元 | `4c03090` | `mora-style-override` / `effectiveStylePrompt` 導入 |
| Builder Negative preview | `7ddbd95` | `buildNegativeFragmentsFromBuilderState()` |
| Replace / Append Negative 分離 | `0368062` | Replace Negative ボタンを追加 |
| Negative Prompt 保存/復元 | `41354ac` | `mora-negative-prompt` / CLEAR SESSION 連動 |
| Builder Negative チューニング | `41354ac` | BUILDER_GENRE_NEGATIVES / Step fragment 調整 |
| CLEAR SESSION | `0368062` | Sidebar 下部に confirm 付きボタン |
| start-dev.bat | `868733f` | `%~dp0` ベース、Windows 用起動スクリプト |
| Project保存 Phase 1 | `d7074a2`〜`1505c50` | 下記参照 |
| Project保存 Phase 2 | `a5857a8`〜`1ebe94e` | 下記参照（**完了**） |

---

## 3. Project保存 Phase 1 の詳細

### フェーズ構成

| Phase | コミット | 内容 |
|---|---|---|
| 1-A | `d7074a2` | `SongProjectMeta` / `SongProject` 型 + `lib/songProject.ts` CRUD |
| 1-B | `1126fe0` | Save Project — Sidebar に PROJECT セクション + SAVE ボタン |
| 1-C | `f474a5c` | Project List / Load — `ProjectListPanel` オーバーレイ |
| 1-D | `1505c50` | Delete / New Project + Rename / 一覧即時更新 |

### localStorage キー設計

```
mora-project-list       SongProjectMeta[]   軽量 index（id / name / updatedAt）
mora-project-<id>       SongProject         個別プロジェクトのフルペイロード
mora-current-project    string (id)         現在アクティブな Project ID（未実装 — 将来用）
```

### SongProject 保存対象フィールド

```typescript
id, name, createdAt, updatedAt
input (SongInput)
worldPreset
expansion (WorldExpansion | null)
lyrics, stylePrompt, stylePromptOverride, negPrompt, regenPrompt
builderSteps (BuilderPresetStep[])   // 12-Step Builder の selected/custom
structureMode, structurePreset, builderSections
libraryIds
history (最大 10 件)
notes (現時点は空文字)
```

### Project保存と個別 localStorage の関係

- **個別 localStorage**（`mora-builder-12`, `mora-style-override`, `mora-negative-prompt` など）は「現在の作業セッションの自動保存」
- **Project**（`mora-project-<id>`）は「明示的な曲ごとのスナップショット」
- この二層構造で共存。Project SAVE は現在 state を snapshot として書き出す。Project LOAD は全 state + 個別 localStorage を上書きする。

### Builder state のロード方法

Builder state は `PromptBuilder12Panel` 内部 state として管理されているため、Project LOAD 時は:

1. `localStorage.setItem("mora-builder-12", JSON.stringify({ steps: project.builderSteps }))` で書き戻し
2. `setBuilderReloadKey(k => k + 1)` で両 `PromptBuilder12Panel` をリマウント（`key={builderReloadKey}` を設定済み）

### Project 操作の挙動まとめ

| 操作 | 作業 state への影響 | localStorage / state への影響 |
|---|---|---|
| SAVE | なし（snapshot を書き出すだけ） | `mora-project-<id>` / `mora-project-list` を更新、`savedSnapshot` 更新 |
| SAVE AS | なし（新規 ID で書き出す） | 新 `mora-project-<id>` 作成、`currentProjectId` / `projectName` / `savedSnapshot` を新 Project に切り替え |
| LOAD | 全 state を復元 + analyse 再実行 | 個別キーも上書き、Builder は remount、`savedSnapshot` 更新 |
| DELETE | 作業 state はそのまま | `mora-project-<id>` 削除 + list 更新。active の場合は `currentProjectId` / `projectName` / `savedSnapshot` も解除 |
| NEW | CLEAR SESSION 相当 + Project 紐付け解除 | 個別キーは persist effect 経由で消える、`savedSnapshot` クリア |
| RENAME | name/updatedAt のみ更新 | payload + list の name を更新。active の場合は Sidebar の `projectName` も同期 |

---

## 4. Project保存 Phase 2 の詳細（**完了**）

> **⚠ 次に Project 周りを触る場合は Export/Import または Auto-save 以降から着手すること。**
> **Rename / Delete / Save As はすべて実装済み。重複実装しないこと。**

### フェーズ構成

| Phase | コミット | 内容 |
|---|---|---|
| 2-A | `a5857a8` | `ProjectListPanel` に ACTIVE バッジ + LOAD 前 `window.confirm` |
| 2-B | `a845175` | Unsaved changes indicator（`savedSnapshot` / `isDirty` / SAVE ● amber） |
| Save As | `7cba51f` | `handleSaveAsProject` + `readBuilderSteps()` 共通化 + Sidebar "save as new project →" |
| Inline Rename | `3cebe04` | `editingId/editingName` state + Enter/Escape + `onRename(id, newName)` シグネチャ変更 |
| Inline Delete | `1ebe94e` | `confirmDeleteId` state + YES,DELETE/CANCEL + `setSavedSnapshot(null)` on active delete |

### Unsaved changes の設計（Phase 2-B）

**dirty 判定対象フィールド:**
```
input, preset, expansion, lyrics, stylePrompt, stylePromptOverride,
negPrompt, regenPrompt, structureMode, structurePreset, builderSections, libraryIds
```

**除外フィールド:**
| 除外 | 理由 |
|---|---|
| `projectName` | 入力中に dirty になると煩わしい |
| `builderSteps` | `PromptBuilder12Panel` 内部 state で page.tsx から直接読めない |
| `history` | rewrite ごとに変わる内部履歴 |
| `notes` | 常に空 |

**実装:**
```typescript
// page.tsx
const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

const currentSnapshot = useMemo(() =>
  JSON.stringify({ input, preset, expansion, lyrics, stylePrompt, stylePromptOverride,
    negPrompt, regenPrompt, structureMode, structurePreset, builderSections, libraryIds }),
  [/* 上記フィールド */]
);

const isDirty = currentProjectId !== null
  && savedSnapshot !== null
  && currentSnapshot !== savedSnapshot;
```

**各操作での `savedSnapshot` 更新:**
| 操作 | savedSnapshot |
|---|---|
| SAVE / SAVE AS | `currentSnapshot` をセット |
| LOAD | ロードした project フィールドを serialize してセット |
| NEW | `null` にクリア |
| DELETE（active） | `null` にクリア |
| CLEAR SESSION | 変更なし → 自動的に dirty になる（正しい動作） |

**SAVE ボタン外観:**
| 状態 | スタイル | ラベル |
|---|---|---|
| 通常 | zinc ボーダー | `SAVE` |
| dirty | amber ボーダー / amber 背景 | `SAVE ●` |
| 保存直後 | emerald ボーダー / emerald 背景 | `✓ Saved`（1.8 秒） |

### Inline Rename の設計（`ProjectListPanel` 内部）

```typescript
const [editingId,   setEditingId]   = useState<string | null>(null);
const [editingName, setEditingName] = useState("");
```

- REN ボタン → `startEditing(id, name)` — 削除確認状態をキャンセル
- Enter → `commitRename(id)` — 空文字なら保存しない
- Escape / ✕ → `cancelRename()`
- `onRename` シグネチャ: `(id: string, newName: string) => void`（page.tsx の `handleRenameProject` で処理）

### Inline Delete の設計（`ProjectListPanel` 内部）

```typescript
const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
```

- DEL ボタン → `startConfirmDelete(id)` — rename 編集状態をキャンセル
- `[YES, DELETE]` → `commitDelete(id)` → `onDelete(id)` を呼ぶ
- `[CANCEL]` → `cancelConfirmDelete()`
- 削除確認中: 名前テキストが赤色 + 日時部分に "Delete this project? This cannot be undone." を表示

---

## 5. Negative Prompt 周りの詳細

### Builder Negative preview

- `buildNegativeFragmentsFromBuilderState(state)` が Builder の各 Step 選択から negative を推論
- Step 1（genre custom）からは `BUILDER_GENRE_NEGATIVES` テーブルを参照
- Step 4 / 5 / 6 / 8 / 11 / 12 から Step 固有フラグメントを追加
- `PromptBuilder12Panel` の下部に "BUILDER NEGATIVE" プレビューとして表示

### Replace / Append Negative

- **Replace Negative**: NEGATIVE 欄の内容を全置換（primary action、amber 濃い色）
- **Append to Negative**: 既存テキストの末尾に `, ` 区切りで追記（secondary action）

### 重複 Append 防止

```typescript
const existing = prev.trim() === "" || prev.trim().toLowerCase() === "none" ? "" : prev.trim();
if (existing && existing.includes(neg)) return existing;  // 重複なら追記しない
return existing ? `${existing}, ${neg}` : neg;
```

### mora-negative-prompt 保存

- `negPrompt` が変化するたびに `mora-negative-prompt` へ保存（trim 空文字なら `removeItem`）
- CLEAR SESSION 実行時は `setNeg("")` → persist effect が `removeItem`

---

## 6. 現在の起動方法

```bat
# Windows — ダブルクリック起動
start-dev.bat

# または PowerShell / ターミナルから
cd C:\Users\ojari\Documents\mora-exe
npm.cmd run dev
```

- ブラウザで http://localhost:3000 を開く
- **Turbopack 禁止**: `--turbo` フラグなし（`next dev` のみ）

---

## 7. 次回候補タスク

優先度順（暫定）:

1. **Project Export / Import** — JSON ファイルとして書き出し / 読み込み
2. **Auto-save** — currentProjectId がある場合に debounce で自動上書き保存
3. **Builder state 持ち上げ** — `PromptBuilder12Panel` の state を page.tsx へ lift up（key リマウント不要に）
4. **EXE 化調査** — Tauri / Electron との統合調査（`src-tauri` ディレクトリ存在確認済み）

> 完了済みのため次回候補から除外:
> - ~~Current Project 表示強化~~ → Phase 2-A で完了
> - ~~Unsaved changes 表示~~ → Phase 2-B で完了
> - ~~Save As / Duplicate~~ → 完了
> - ~~npm build 確認~~ → 各フェーズで通過確認済み

---

## 8. 注意事項

- **Auto-save は未実装**: SAVE ボタンの明示的な押下のみで保存される
- **Project は localStorage 保存**: ブラウザのデータ消去で失われる。Export 未実装のため注意
- **Builder state のリマウント**: Project LOAD 時に `builderReloadKey` をインクリメントしてリマウント。次フェーズで Builder の controlled 化（state lift up）を検討
- **DELETE は作業内容を消さない**: 保存済みのスナップショットのみ削除し、現在の作業 state は残る（active の場合は `currentProjectId` / `projectName` / `savedSnapshot` の紐付けを解除）
- **NEW は CLEAR SESSION 相当**: Builder state / genreLock / subStyles / centerTab などのセッション設定は消えない
- **Export 機能は未実装**: `mora-project-list` / `mora-project-<id>` を直接 DevTools で確認可能
- **lint は exit code 1（pre-existing errors）**: 各 Phase の変更起因の新規エラーはなし。`npm run build` は全フェーズで通過。pre-existing errors は `react-hooks/set-state-in-effect`（mount effect 内 setState）・`react/jsx-no-comment-textnodes`（複数コンポーネント）など

---

## 9. 既存 localStorage キー一覧

| キー | 内容 | 管理箇所 |
|---|---|---|
| `mora-library-ids` | 選択済み Library ID 配列 | page.tsx |
| `mora-structure-mode` | preset / builder | page.tsx |
| `mora-structure-preset` | StructurePreset 値 | page.tsx |
| `mora-structure-custom` | BuilderSection 配列 | page.tsx |
| `mora-genre-lock` | genreLock 文字列 | page.tsx |
| `mora-sub-styles` | subStyles 配列 | page.tsx |
| `mora-center-tab` | centerTab 値 | page.tsx |
| `mora-style-override` | stylePromptOverride 文字列 | page.tsx |
| `mora-negative-prompt` | negPrompt 文字列 | page.tsx |
| `mora-builder-12` | 12-Step Builder steps | PromptBuilder12Panel |
| `mora-project-list` | SongProjectMeta[] index | lib/songProject.ts |
| `mora-project-<id>` | SongProject フルペイロード | lib/songProject.ts |
| `mora-current-project` | アクティブ Project ID（将来用） | 未使用 |
