# MORA.exe 開発引継ぎメモ — 2026-05-29

## 1. 現在の Git 状態

| 項目 | 状態 |
|---|---|
| Branch | `master` |
| 最新コミット | `bd7e6eb style: make project delete action visibly dangerous` |
| origin/master | 同期済み |
| Working tree | clean |

---

## 2. 今回完了した主な作業

### UI Polish フェーズ（2026-05-29 実施）

| フェーズ | コミット | 概要 |
|---|---|---|
| Phase A | `2bf55f1` | `app/layout.tsx` の dead class（`bg-zinc-950 text-zinc-100`）削除 |
| Phase B | `2bf55f1` | `app/globals.css` に `--border-muted: #CBD5E1` トークン追加 |
| Phase C | `2146469` | `components/Sidebar.tsx` — border 値統一（チップ・アクションボタン非アクティブ → `--border-muted`） |
| Phase D | `5720a9a` | `app/page.tsx` — border 値統一 + ProjectListPanel Export/Import ボタンを文字リンクから border 付きボタンへ強化 |
| Phase E | `b15efed` | `components/PromptBuilder12Panel.tsx` — border 値統一 |
| TIPS 改善 | `3dc8854` | Sidebar / page.tsx / PromptBuilder12 / WorldForge / StructureBlueprint の TIPS・補足テキストを `zinc-400/500` → `zinc-500/600/700` に改善 |
| Readable Size Pass 第一段階 | `ced2009` | TIPS `text-[10px]`→`[11px]` × 10 / `text-[11px]`→`[12px]` × 5 / パネルタブ `text-[12px]`→`[13px]` × 7 / 本文・preview `text-[12px]`→`[13px]`（PromptBuilder12Panel / page.tsx / PromptEditor / LyricsEditor / WorldForge） |
| Readable Size Pass 第二段階（安全範囲） | `93757a1` | World Lens chips / Selected Library item chips / Builder preset chips / SAMPLE・CLEAR ボタン `text-[11px]`→`[12px]` |
| Style Prompt 本文コントラスト改善 | `f4cec5a` | `globals.css` `.pe-plain` color `#475569`→`#334155`（slate-700相当） |
| ProjectList delete danger 表示 | `bd7e6eb` | DEL ボタン通常状態を薄赤系に / YES, DELETE をより明確な danger 表示に |

**UI Polish で変更したファイル一覧:**

- `app/layout.tsx`
- `app/globals.css`
- `components/Sidebar.tsx`
- `components/PromptBuilder12Panel.tsx`
- `components/WorldForge.tsx`
- `components/StructureBlueprint.tsx`
- `components/PromptEditor.tsx`
- `components/LyricsEditor.tsx`
- `app/page.tsx`

**UI Polish で変更しなかったもの（意図的）:**

- padding / font / layout — 後続フェーズで段階的に対応
- `font-mono` / `ui-sans` 統一 — スコープ外
- ロジック・状態管理・保存/読込/Export/Import — 一切変更なし
- `components/MoraTunerPanel.tsx` / `SourceAlchemy.tsx` / `PromptLibraryPanel.tsx` 等 — 後続フェーズで見直し
- Genre / Sub-style / Nudge chips（`text-[11px]` のまま） — wrapping 変化があるため別フェーズ
- Builder Step option chips（`text-[11px]` のまま） — パネル高変化リスクあり
- h-7 ボタン（Replace / Append Negative 等） — mobile レイアウトリスクあり
- ProjectListPanel ヘッダーボタン — ヘッダー詰まりリスクあり

---

### バグ修正・API移行フェーズ（2026-05-29 後半）

| 項目 | コミット | 概要 |
|---|---|---|
| rule-based fallback クラッシュ修正 | `91cd434` | `mood: ""` 時に `charCodeAt(0)` が `NaN` → `?? 0` では補正されず `buildThemeLines` でクラッシュ。`lib/lyricsBuilder.ts` を `\|\| 0` に変更、`lib/themeExtractor.ts` に `Number.isFinite` ガードを追加 |
| Source Alchemy の Gemini API 化 | `6f482a8` | `app/api/ai/alchemy/route.ts` を Anthropic SDK から Gemini REST API（fetch）に切り替え。`GEMINI_API_KEY` を使用。`gemini-2.0-flash` / `response_mime_type: "application/json"` |

#### Gemini 手動テスト結果（2026-05-29）

| 項目 | 結果 |
|---|---|
| API call 到達 | ✅ `/api/ai/alchemy` → Google Gemini API まで到達確認 |
| `GEMINI_API_KEY` 読み込み | ✅ `.env.local` から正常に読み込まれている |
| レスポンス | ❌ `429 RESOURCE_EXHAUSTED` — prepayment credits 枯渇 |
| コード不具合 | なし（実装自体は正常）|
| 次アクション | Google AI Studio / Gemini API でクレジット補充後に再テスト |

> **⚠ 正常 JSON レスポンスの確認（`songWorld` / `metaphors` / `worldSeed` / `chorusHookIdeas` フィールド揃い / FORGE WORLD 連携）は credits 補充後に実施すること。コード修正は不要。**

---

#### Gemini 移行状態（最終）

| エンドポイント | プロバイダー | fallback |
|---|---|---|
| `/api/ai/alchemy` | **Gemini**（`GEMINI_API_KEY`） | ❌ なし |
| `/api/ai/rewrite` | **Gemini**（`GEMINI_API_KEY`） | ✅ rule-based（client 側） |
| `/api/ai/generate` | **Gemini**（`GEMINI_API_KEY`） | ✅ rule-based（client 側） |
| `/api/ai/forge` | **Gemini**（`GEMINI_API_KEY`） | ✅ ruleBasedForge（server 側） |

#### `.env.local` に必要なキー

```
GEMINI_API_KEY=AIza...     # Google AI Studio で取得
ANTHROPIC_API_KEY=sk-ant-... # generate / rewrite / forge 用（credit 切れの場合 fallback 動作）
```

> **⚠ `.env.local` は絶対にコミットしない**

---

### Project 保存・管理フェーズ（前スレッド完了分）

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
| Project一覧 Summary | `4ad31d2` | `SongProjectMeta` に summary fields 追加 + 一覧表示改善 |
| Project Export（単体・全件） | `282edf5` | EXP ボタン / export all ↓ ボタン、safe filename 生成 |
| Save name drift overwrite guard | `282edf5` | LOAD 済み Project の名前変更状態での SAVE を中断 |
| Project Import（restore） | `65d2323` | `restore ↑` ボタン — 元 ID 保持、衝突時 skip |
| Import as New | `65d2323` | `as new ↑` ボタン — 常に新 ID、名前に `(copy)` |
| Project Save UI 改善 | `c1c505a` | SAVE CURRENT / SAVE AS NEW ボタン化、mobile 接続修正 |

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
mora-project-list       SongProjectMeta[]   軽量 index（id / name / updatedAt / summary fields）
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
| Project Export | `282edf5` | 単体 EXP ボタン + 全件 export all ↓ ボタン + safe filename 生成 |
| Save name drift overwrite guard | `282edf5` | `savedProjectName` と名前が一致しない場合に SAVE を中断 |
| Project Import / Import as New | `65d2323` | `restore ↑` / `as new ↑` ボタン + `validateAndNormalizeSongProject` |
| Project Save UI 改善 | `c1c505a` | SAVE CURRENT / SAVE AS NEW 文言・配置変更、mobile 接続修正 |

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

**SAVE CURRENT ボタン外観:**
| 状態 | スタイル | ラベル |
|---|---|---|
| 通常 | zinc ボーダー | `SAVE CURRENT` |
| dirty | amber ボーダー / amber 背景 | `SAVE CURRENT ●` |
| 保存直後 | emerald ボーダー / emerald 背景 | `✓ Saved`（1.8 秒） |

`SAVE AS NEW` は flash なし。成功は projectName 更新 / ACTIVE バッジ / dirty 消失で確認する。

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

## 5. Project一覧 Summary の詳細

### コミット

`4ad31d2 feat: improve project summary readability`（前コミット `4ad31d2` = 本文行数ラベル修正を含む最終版）

### SongProjectMeta に追加した optional フィールド

```typescript
export interface SongProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // 以下 optional — 後方互換。旧エントリは undefined → 再 SAVE で更新される
  lyricsContentLines?: number;  // 空行と [Chorus] 等のセクションタグを除外した本文行数
  hasStyle?:           boolean; // stylePrompt または stylePromptOverride のどちらかが非空なら true
  hasNeg?:             boolean; // negPrompt が非空なら true
  lyricsPreview?:      string;  // 最初の本文行（セクションタグ除外）を最大 28 文字で切り出し
}
```

### buildProjectSummary() の計算ロジック（lib/songProject.ts）

```typescript
function buildProjectSummary(project: SongProject) {
  const isSectionTag  = (line: string) => /^\[[^\]]+\]$/.test(line.trim());
  const isContentLine = (line: string) => line.trim().length > 0 && !isSectionTag(line);

  const lines        = project.lyrics ? project.lyrics.split("\n") : [];
  const contentLines = lines.filter(isContentLine);  // 本文行のみ

  const firstLine = contentLines[0]?.trim() ?? "";
  const preview   = firstLine.length > 28 ? firstLine.slice(0, 28) + "…" : firstLine;

  return {
    lyricsContentLines: contentLines.length > 0 ? contentLines.length : undefined,
    hasStyle:           !!(project.stylePrompt.trim() || project.stylePromptOverride.trim()) || undefined,
    hasNeg:             !!project.negPrompt.trim() || undefined,
    lyricsPreview:      preview || undefined,
  };
}
```

`saveProject()` が `buildProjectSummary()` を呼び、結果を `SongProjectMeta` に spread して index に書き込む。

### 後方互換設計

- 旧 `mora-project-list` エントリには summary fields がない → `undefined`
- UI は `p.lyricsContentLines != null` 等でガードしているため、旧エントリは summary 行が出ないだけで壊れない
- 再 SAVE（SAVE / SAVE AS）したタイミングで summary が埋まる

### ProjectListPanel の表示（通常状態のみ）

```
[Project Name]        [· ACTIVE]
5/29 14:30
本文 31行   STYLE   NEG
♪ 消えない痛みを　抱えたまま…
```

| 要素 | 条件 | スタイル |
|---|---|---|
| `本文 N行` | `lyricsContentLines != null` | `text-[13px] font-mono font-semibold text-zinc-600` |
| `STYLE` チップ | `hasStyle === true` | `text-[12px] border border-zinc-300 text-zinc-600 rounded px-1.5 py-px` |
| `NEG` チップ | `hasNeg === true` | 同上 |
| `♪ preview` | `lyricsPreview` が存在 | `text-[13px] font-mono text-zinc-600 truncate` |

Rename 編集中・Delete 確認中は summary 行を非表示（`!isConfirmingDelete` かつ `!isEditing` 相当の分岐で制御）。

---

## 6. Project Export / Import の詳細（基本機能完了）

> 上書き Import・差分 Import・Import 前プレビューなどの高度機能は未実装。

### コミット

- Export / overwrite guard: `282edf5 feat: add project export and overwrite guard`
- Import / Import as New: `65d2323 feat: add import as new mode`

### 単体エクスポート（EXP ボタン）

- `ProjectListPanel` の各 Project 行に `EXP` ボタンを追加
- `handleExportProject(meta)` → `loadProject(meta.id)` でフルペイロードを取得し JSON ダウンロード
- ファイル名: `${toSafeFilename(project.name)}.mora.json`

### 全件エクスポート（export all ↓ ボタン）

- PROJECT セクション右端の `export all ↓` ボタン（projects.length > 0 のときのみ表示）
- `handleExportAll()` → 全 Project を `loadProject` で読み込み、1 ファイルにまとめてダウンロード
- ファイル名: `mora-projects-YYYY-MM-DD.json`（実行日の ISO 日付）
- ペイロード構造:
  ```json
  {
    "version": 1,
    "exportedAt": "<ISO 8601>",
    "projects": [ /* SongProject[] */ ]
  }
  ```
- 読み込めなかった件数があれば `alert` で通知してスキップ

### safe filename ロジック（`toSafeFilename`）

```typescript
function toSafeFilename(name: string): string {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_{2,}/g, "_")
      .trim() || "untitled"
  );
}
```

Windows / Unix 双方で unsafe な文字をアンダースコアに置換し、連続アンダースコアを圧縮。空文字になった場合は `"untitled"` にフォールバック。

### Import の実装（restore ↑ / as new ↑）

`ProjectListPanel` ヘッダーに 2 つの Import ボタンを配置（hidden `<input type="file">` を共有）。

#### 共通仕様

- 単体 `.mora.json` / 全件 `mora-projects-YYYY-MM-DD.json` を自動判別（`projects` 配列の有無）
- `validateAndNormalizeSongProject(entry)` で必須フィールドを検証し、不正エントリはスキップ
- `saveProject()` 経由で保存するため summary fields（`lyricsContentLines` / `lyricsPreview` / `hasStyle` / `hasNeg`）は自動再生成
- `currentProjectId` / 現在の作業 state は変更しない
- 完了後に alert で件数通知（imported / skipped / invalid）

#### `restore ↑`（元 ID 保持）

- JSON 内の `id` をそのまま使用
- 既存 ID と衝突する場合は skip（上書きしない）
- 同ファイル内の重複 ID も guard（`existingIds` Set に都度追加）
- バックアップ復元・環境移行用途

#### `as new ↑`（新 ID 発行）

- `generateProjectId()` で毎回新 UUID を発行
- 名前に `(copy)` を付与（例: `"My Song"` → `"My Song (copy)"`）
- 衝突チェックなし — 同じファイルを何度 import しても別 Project として追加される
- 名前の重複は許可

#### `validateAndNormalizeSongProject`（`lib/songProject.ts`）

必須フィールドのみ型チェック。optional フィールドはデフォルト値で補完：

| フィールド | 検証 | デフォルト補完 |
|---|---|---|
| `id`, `name`, `createdAt`, `updatedAt` | string, id は非空 | — |
| `input` | object | — |
| `lyrics`, `stylePrompt`, `stylePromptOverride`, `negPrompt`, `regenPrompt` | string | — |
| `structureMode` | `"preset"` または `"builder"` | — |
| `builderSteps`, `builderSections`, `libraryIds` | array | — |
| `worldPreset` | string | `""` |
| `expansion` | object または null | `null` |
| `structurePreset` | string | `"verse-first"` |
| `history` | array | `[]` |
| `notes` | string | `""` |

---

## 6b. Save name drift overwrite guard の詳細

### コミット

`282edf5 feat: add project export and overwrite guard`

### 概要

LOAD 済みの Project において、名前欄を変更したまま SAVE（上書き保存）しようとすると保存を中断し、`alert` でユーザーに案内する。

### ガード発動条件

```typescript
// handleSaveProject 内
if (
  currentProjectId !== null &&   // 既存 Project を編集中
  savedProjectName !== null &&   // 保存時の名前ベースラインが設定されている
  nameToSave !== savedProjectName // 名前が変わっている
) { alert(...); return; }
```

`savedProjectName` は SAVE / SAVE AS / LOAD / Rename（REN）の各操作で更新される。
NEW プロジェクト（`currentProjectId === null`）では発動しない。

### ユーザーへの案内（alert メッセージ）

```
プロジェクト名が変更されているため保存できません。

保存済み名: "${savedProjectName}"
現在の名前: "${nameToSave}"

・別プロジェクトとして保存するには「SAVE AS NEW」を使ってください。
・既存プロジェクトの名前を変えるには、プロジェクト一覧の「REN」を使ってください。
```

### `savedProjectName` の更新タイミング

| 操作 | savedProjectName |
|---|---|
| SAVE | `nameToSave` をセット |
| SAVE AS | `newName.trim()` をセット |
| LOAD | `project.name` をセット |
| REN（プロジェクト一覧から rename） | `newName` をセット（active project のみ） |
| NEW | `null` にクリア |

---

## 6c. Project Save UI 改善の詳細

### コミット

`c1c505a feat: clarify project save actions`

### ボタン配置変更（`components/Sidebar.tsx`）

```
変更前:
[SAVE (flex-1)] [LOAD (flex-1)] [NEW (flex-1)]
save as new project →   ← text-[11px] 右寄せリンク

変更後:
[SAVE CURRENT (flex-1)] [SAVE AS NEW (flex-1)]
[LOAD (flex-1)]         [NEW (flex-1)]
SAVE CURRENT overwrites · SAVE AS NEW creates a copy  ← hint text
```

### 各変更の詳細

| 変更 | 内容 |
|---|---|
| `SAVE` → `SAVE CURRENT` | 上書き保存であることを明示 |
| `save as new project →` リンク → `SAVE AS NEW` ボタン | セカンダリリンクからプライマリボタンへ昇格 |
| dirty ラベル | `SAVE ●` → `SAVE CURRENT ●` |
| flash | `SAVE CURRENT` のみ `✓ Saved`（1.8 秒）。`SAVE AS NEW` は flash なし — 成功は projectName / ACTIVE バッジ / dirty 消失で確認 |
| hint text | `SAVE CURRENT overwrites · SAVE AS NEW creates a copy`（常時表示、text-[11px] zinc-400） |

### `app/page.tsx` の変更

| 変更 | 内容 |
|---|---|
| mobile `<Sidebar>` | `onSaveAsProject={handleSaveAsProject}` を追加（従来は未接続 → mobile で SAVE AS NEW が動作しないバグの修正） |
| overwrite guard alert | `「save as new project →」` → `「SAVE AS NEW」` に文言更新 |
| `handleSaveAsProject` | `setProjectSaveFlash(true)` / `setTimeout` を削除（SAVE AS NEW は flash なし） |

---

## 7. Negative Prompt 周りの詳細

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

## 8. 現在の起動方法

```bat
# Windows — ダブルクリック起動
start-dev.bat

# または PowerShell / ターミナルから
cd C:\Users\ojari\Documents\mora-exe
npm.cmd run dev
```

- ブラウザで http://localhost:3000 を開く
- **Turbopack 禁止**: `--turbo` フラグなし（`next dev` のみ）

> **⚠ Claude Code 側での dev server 操作は禁止**
> `preview_start` / dev server 起動・停止 / `.claude/launch.json` の追加・変更はすべて行わない。
> ブラウザ確認はユーザーが手動で行う。
> Claude 側の確認範囲: `git diff` / `npm.cmd run build` / `npm.cmd run lint`（既存エラーは pre-existing 扱い）のみ。

---

## 9. 次回候補タスク

### UI Polish — 残り候補（未実装）

以下は wrapping 変化・ヘッダー詰まりリスクがあるため、別フェーズで一つずつ確認する。

**Sidebar Genre / Sub-style / Nudge chips（A/B/C）**
- 現状 `text-[11px]`。18種・10種・13種と多いため、`text-[12px]` にすると flex-wrap 行数が増える
- 実施する場合は mobile（375px）での折り返し増加を事前確認すること

**Builder Step option chips（F）**
- 現状 `text-[11px]`。12 steps × 複数 options = パネル全体高が大幅増加の可能性
- 実施する場合は desktop / mobile 両方で縦スクロール量の変化を確認すること

**ProjectListPanel ヘッダーボタン（J）**
- `export all ↓` / `restore ↑` / `as new ↑` — 現状 `text-[11px]`
- `h-11` の1行ヘッダーに4要素横並び。mobile 幅で詰まるリスクあり

**h-7 ボタン（スコープ外）**
- `StructureBlueprint` mode buttons / `PromptBuilder12` Replace・Append Negative ボタン
- `text-[11px]` のまま維持推奨。変更しない。

---

---

## 8b. Gemini API 移行完了（2026-05-29）

以下 4 ルートを Claude API から Gemini API へ移行済み。

### `/api/ai/alchemy`
- commit: `7ee9517 fix: harden Gemini alchemy JSON parsing`
- Gemini API 実動作確認済み（finishReason=STOP）
- JSON parse / MAX_TOKENS 問題を解消
- `thinkingConfig: { thinkingBudget: 0 }` 使用

### `/api/ai/rewrite`
- commit: `0d62a09 feat: switch rewrite to Gemini API`
- 実動作確認済み（finishReason=STOP、rawLength 492〜691）
- `rewrittenLyrics` / `notes` / `changedLines` 返却確認済み

### `/api/ai/generate`
- commit: `e3f7b91 feat: switch generate to Gemini API`
- 実動作確認済み（finishReason=STOP、rawLength 595〜608）
- PATH B（World Forge なし）確認済み
- PATH A（World Forge 後）確認済み
- 失敗時の `{ lyrics: "", notes: "" }` fallback 設計は維持

### `/api/ai/forge`
- commit: `1c7bf19 feat: switch forge to Gemini API`
- 実動作確認済み（finishReason=STOP、rawLength=1600）
- Forge 後の Generate PATH A 連携確認済み
- 失敗時は従来通り `ruleBasedForge(worldSeed)` に fallback

### 共通実装メモ

- **Gemini model**: `gemini-2.5-flash`
- **API key**: `GEMINI_API_KEY` を `.env.local` に設定（`.gitignore` 対象、commit 禁止）
- **SDK 追加なし**: fetch で Gemini REST API を直接呼ぶ
- **`thinkingConfig: { thinkingBudget: 0 }`** を `generationConfig` 内に配置（外側に置くと 400 エラー）
- **JSON parse 防御** として各ルートに以下を導入:
  - `sanitizeControlChars()`: JSON string 内の literal control char を状態機械方式でエスケープ
  - `extractJson()`: string-aware ブラケット抽出 + コードフェンス除去 + sanitize → parse
  - `rawLength` / `finishReason`: dev 環境限定ログ（`NODE_ENV !== "production"`）

### 注意事項

- dev server / preview / launch.json は Claude 側で触らない
- ブラウザ確認はユーザーが手動で行う
- package.json 変更なし（SDK 追加なし）
- provider 抽象化はまだ未実施（各 route に `callGemini` / `sanitizeControlChars` / `extractJson` が重複）
- Claude API は現在不要だが、将来の高品質オプションとして残すかは別途判断
- `musicDirection.source` の型は `"claude" | "rule"` のまま維持（Gemini 結果も `"claude"` で返す）

---

### 次スレッドで最初にやること

1. `git pull`
2. `docs/MORA_HANDOFF_2026-05-29.md` を読む
3. 現在地を要約
4. 勝手に実装せず、次フェーズ案を提示

---

### その他の次回候補タスク

優先度順（暫定）:

1. **provider 共通化** — `lib/llmClient.ts` で Gemini 呼び出しを共通化。現状は各 route に同種処理が重複
2. **UI 表示整理** — バッジ・内部 source 名が `Claude AI` / `"claude"` のまま残っている箇所を `AI` / `Gemini` 表示へ整理
3. **`musicDirection.source` 型整理** — 現状 `"claude" | "rule"`。将来 `"gemini"` または `"ai"` 追加を検討
4. **Sidebar chip 文字サイズ（A/B/C）** — mobile 確認しながら段階的に検討
5. **Auto-save** — currentProjectId がある場合に debounce で自動上書き保存
6. **lint cleanup** — pre-existing errors の整理（`react-hooks/set-state-in-effect` 等）
7. **Builder state 持ち上げ** — `PromptBuilder12Panel` の state を page.tsx へ lift up（key リマウント不要に）
8. **EXE 化調査** — Tauri / Electron との統合調査（`src-tauri` ディレクトリ存在確認済み）
9. **次機能開発へ進む** — UI Polish をいったん区切り、新機能実装に移行する選択肢もあり

> 完了済みのため次回候補から除外:
> - ~~Current Project 表示強化~~ → Phase 2-A で完了
> - ~~Unsaved changes 表示~~ → Phase 2-B で完了
> - ~~Save As / Duplicate~~ → 完了
> - ~~Project Export~~ → `282edf5` で完了
> - ~~Save name drift overwrite guard~~ → `282edf5` で完了
> - ~~Project Import（restore / as new）~~ → `65d2323` で完了
> - ~~Project Save UI 改善~~ → `c1c505a` で完了
> - ~~UI Polish Phase A〜E~~ → `2bf55f1`〜`b15efed` で完了
> - ~~TIPS テキスト視認性改善~~ → `3dc8854` で完了
> - ~~Readable Size Pass 第一段階（TIPS / タブ / 本文 preview）~~ → `ced2009` で完了
> - ~~Readable Size Pass 第二段階（安全範囲 chip / button）~~ → `93757a1` で完了
> - ~~Style Prompt 本文コントラスト改善~~ → `f4cec5a` で完了
> - ~~ProjectList delete danger 表示~~ → `bd7e6eb` で完了
> - ~~rule-based fallback クラッシュ修正~~ → `91cd434` で完了
> - ~~Source Alchemy Gemini API 化~~ → `6f482a8` で完了
> - ~~Source Alchemy Gemini 手動テスト確認~~ → `7ee9517` で完了（finishReason=STOP 確認済み）
> - ~~generate / rewrite / forge の Gemini 化~~ → `0d62a09` / `e3f7b91` / `1c7bf19` で完了

---

## 10. 将来候補機能メモ — MORA-1: 作詞支援 モーラ数可視化

> **⚠ 実装しない。将来フェーズ用のメモ。現在の安定状態を崩さないこと。**

### 目的

- Suno 向け歌詞の行ごとの歌いやすさを確認する
- 日本語歌詞のモーラ数を可視化する
- 長すぎる行・短すぎる行を検出する
- Verse / Pre-Chorus / Chorus などセクション単位でバランスを見る

### 候補機能

| # | 機能 | 概要 |
|---|---|---|
| 1 | 行ごとのモーラ数カウント | 各歌詞行のモーラ数を算出して表示 |
| 2 | セクションごとの平均モーラ数 | `[Chorus]` 等のセクション単位で平均・最大・最小を集計 |
| 3 | 長すぎる行・短すぎる行の警告 | 閾値（例: 20モーラ超・5モーラ未満）で色分け警告 |
| 4 | Suno向け歌いやすさスコア | モーラ密度・行バランスから総合スコアを算出 |
| 5 | セクション構造解析 | セクションタグを解析し構成の偏りを可視化 |
| 6 | モーラ指定リライト | 将来的に長すぎる行の短縮案やモーラ数指定でリライト |

### 実装方針（メモ）

- 既存の `MoraTunerPanel` や `LyricsEditor` の拡張として追加することを検討
- モーラカウントは既存の `lib/` に `moraCounting.ts` 等として追加
- UI は LyricsEditor の行番号列の横にモーラ数を表示する案が自然
- 既存ロジック・state への影響を最小化するため、表示専用（read-only）から始める

### フェーズ識別子

`MORA-1` として管理。実装開始時は別ブランチまたはフェーズ番号を明記すること。

---

## 11. 注意事項

- **Auto-save は未実装**: SAVE ボタンの明示的な押下のみで保存される
- **Project は localStorage 保存**: ブラウザのデータ消去で失われる。Export（EXP / export all ↓）で JSON バックアップを取ること
- **Builder state のリマウント**: Project LOAD 時に `builderReloadKey` をインクリメントしてリマウント。次フェーズで Builder の controlled 化（state lift up）を検討
- **DELETE は作業内容を消さない**: 保存済みのスナップショットのみ削除し、現在の作業 state は残る（active の場合は `currentProjectId` / `projectName` / `savedSnapshot` の紐付けを解除）
- **NEW は CLEAR SESSION 相当**: Builder state / genreLock / subStyles / centerTab などのセッション設定は消えない
- **Import は基本機能のみ実装**: `restore ↑`（元 ID 保持）/ `as new ↑`（新 ID）の 2 モードで JSON を読み込める。上書き Import・差分 Import・Import 前プレビューは未実装
- **lint は exit code 1（pre-existing errors）**: 各 Phase の変更起因の新規エラーはなし。`npm run build` は全フェーズで通過。pre-existing errors は `react-hooks/set-state-in-effect`（mount effect 内 setState）・`react/jsx-no-comment-textnodes`（複数コンポーネント）など
- **Claude Code は dev server / preview を操作しない**: `.claude/launch.json` は削除済み（`530bfcb`）。ブラウザ確認はユーザーが手動で行う。Claude 側は `git diff` / `npm.cmd run build` / `npm.cmd run lint` のみ実施する
- **border 統一トークン `--border-muted`**: `globals.css` の `:root` に `#CBD5E1` で定義済み。インタラクティブ要素の非アクティブ border はすべてこのトークンを使う。構造的 divider（`border-t` / `border-b`）は `--border`（`#E2E8F0`）を維持する
- **SongProjectMeta の summary は再 SAVE まで更新されない**: 既存 Project は一覧に summary が出ないが壊れない。SAVE / SAVE AS を実行すると `lyricsContentLines` / `hasStyle` / `hasNeg` / `lyricsPreview` が生成される
- **`.env.local` は絶対にコミットしない**: `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` を含む。`.gitignore` 対象。Claude 側も key の中身は一切表示・ログ出力しない
- **Gemini 移行は alchemy のみ完了**: generate / rewrite / forge はまだ Claude のまま。credit 切れの場合は rule-based fallback で動作
- **`lib/aiProvider.ts` と `lib/providers/*` はスケルトン**: provider 抽象化の骨格のみ存在し、routes とは未接続。本格実装は `lib/llmClient.ts` を新規作成して段階移行予定
- **rule-based fallback の `seed` 計算バグは修正済み**: `mood: ""` 時の `charCodeAt(0) = NaN` 問題。`|| 0` と `Number.isFinite` ガードで対処（`91cd434`）

---

## 11. 既存 localStorage キー一覧

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
| `mora-project-list` | SongProjectMeta[] index（summary fields 含む） | lib/songProject.ts |
| `mora-project-<id>` | SongProject フルペイロード | lib/songProject.ts |
| `mora-current-project` | アクティブ Project ID（将来用） | 未使用 |

---

## 12. 歌詞生成品質改善フェーズ — 2026-05-30

> **最新コミット: `4562b7c`**
> このセクションを読めば、次のスレッドから迷わず再開できる。

---

### 12-1. 大方針

MORA.exe は「元ネタの抽象的な面白さを、具体物・動作・物証に変換して歌詞化するエンジン」として育てている。

**AIが出しがちなもの（抑制対象）:**

| パターン | 例 |
|---|---|
| 抽象感情 | `報われる瞬間`、`静かに消えた` |
| AI文学的な詩情 | `声が響く`、`指先の熱が冷めていく` |
| ポジティブ標語 | `競馬をみんな絶対に楽しむんだ` |
| メタ歌詞 | `庶民的な夏の歌`、`レシートまで含めた夏の歌` |
| プロンプト文の直貼り | `高い天然うなぎじゃなくても養殖うなぎで十分うまい` |
| 説明文の歌詞化 | `万馬券はただの高配当じゃなく` |
| 未完了行 | `タレの甘い匂いが`（助詞で終わる） |
| 近接重複 | `麦茶` → `麦茶` が連続する |
| 抽象まとめ語 | `質素な贅沢`、`ささやかな満足`、`充足` |
| 感覚フィラー | `染み渡る`、`灯り`、`視線`、`見つめる` |

**代わりに変換する方向:**

| 変換前 | 変換後 |
|---|---|
| `報われる瞬間` | `払い戻し0円` / `PAT履歴` / `締切前の画面` |
| `ささやかな贅沢` | `山椒ひと振り` / `レシート七百八十円` |
| `ポジティブ標語` | 主Chorusの繰り返し or 具体物で終わる |
| 説明文 | 短い言い切りフック（`養殖でいい` / `タレでいい`） |
| 未完了行 | 体言止め or 動詞完結 |

---

### 12-2. 実装済み（コミット一覧）

| コミット | 内容 |
|---|---|
| `5a4c0ab` | UI / API の `Claude` 表示を `Gemini` に修正 |
| `4fd9500` | Chorus 5〜6行 preferred、abstract closure 抑制 |
| `72133c2` | repair residual 強化（報われる/夢/希望 置換、Chorus per-section ログ） |
| `467a34d` | WEAK_POETIC_JP / MIXED_LANG_WEIRD 追加、langInstruction("low") 厳格化 |
| `7bf1c7c` | Final Chorus ハードキャップ、スローガン禁止、快感制限、説明文検出 |
| `4f462df` | ABSTRACT_SUMMARY_JP 追加、短フックルール、Verse/Bridge 末尾ルール |
| `f6f5e49` | 抽象まとめ語・弱詩的フィラー拡張、Chorus 行末助詞チェック |
| `b6010d7` | META_LYRIC_JP 追加、プロンプト直貼り禁止、赤提灯正規化 |
| `0fbe337` | deterministic cleanup 追加、quality_warning ログ追加 |
| `ca45629` | 季節フィラー / 擬感覚記憶フレーズ、Chorus 名詞チェーン禁止 |
| `4562b7c` | near_duplicate 検出、dangling_particle 全セクション化、感覚表現禁止 |
| `add133e` | 動詞終端 near_duplicate（NEAR_DUP_VERB_ENDINGS）、verb重複 few-shot 追加 |
| `c1c932f` | domain_leakage 検出、WEAK_POETIC_JP 全セクション適用、Chorus 最終行ルール |
| `dab8cfd` | near_dup を quality_warning に統合、deterministic 拡張、repair 候補追加 |
| `2450c93` | が-enjambment 例外、abstract_summary 拡張、BREAKDOWN/OUTRO ルール |
| `2058a92` | を-enjambment 拡張、Pass 2 同一行反復検出、冷たい麦茶で 補完 |
| `30463bf` | ANCHOR_EVIDENCE_LINES、NI_ACTION_VERBS、に-enjambment 限定許可 |

---

### 12-3. 実装済みの主な検出項目（detectAbstractDrift）

post-repair ログに出力される項目一覧。すべて `none / detected` で表示。

| ログキー | 意味 |
|---|---|
| `jp_abstract` | 日本語の抽象感情行（静かに消えた / 夢が消えた 等） |
| `en_slogan` | 英語スローガン（hope is gone / fading out 等） |
| `weird_mixed_lang` | 日英不自然混在（`Winning is the快感` 等） |
| `weak_poetic` | 弱詩的フィラー（が響く / 染み渡る / 灯り / 視線 等） |
| `abstract_summary` | 抽象まとめ語（贅沢 / 充足 / 安らぎ / 今ここでいい 等） |
| `dangling_particle` | 全セクション対象。助詞（が/を/に/で/は）で終わる行（t.length > 3） |
| `meta_lyric` | 自己言及行（夏の歌 / 庶民的な.*歌 等） |
| `explanatory_prose` | 説明口調（じゃなくても / 庶民的な / 最高級 等） |
| `generic_positive_ending` | Final Chorus のポジティブ標語（みんな絶対に等） |
| `kaikan_overuse` | 「快感」が曲中2回以上 |
| `final_chorus_overflow` | Final Chorus が7行以上 |

**final ログ（常時出力）:**

```
[mora/generate] final — quality_warning:none | near_duplicate:none | deterministic_replacements:0
```

| キー | 意味 |
|---|---|
| `quality_warning` | repair + cleanup 後も残存ドリフトあり |
| `near_duplicate` | 隣接2行に共通の漢字2+／カタカナ2+トークン |
| `deterministic_replacements` | deterministic cleanup で置換した件数 |

---

### 12-4. Deterministic Cleanup（DETERMINISTIC_REPLACEMENTS）

Gemini repair が通った後に**アプリ側で安全に確実置換**するパス。`route.ts` 内で常時実行。

| 検出パターン | 置換後 |
|---|---|
| `レシートまで含めた庶民的な夏の歌` | `レシート七百八十円` |
| `最高級じゃなくても` | `並の札を裏返す` |
| `あの夏の日と同じ` | `麦茶の氷が鳴る` |
| `このままの夏` | `タレ多めの並ひとつ` |
| `喉を静かに潤す` | `麦茶をひと口飲む` |
| `この舌は知ってる` | `山椒ひと振り` |
| `ざらざらした舌の記憶` | `焦げ目を奥歯で噛む` |
| `冷たいおしぼり首筋に`（行末） | `おしぼりで首を拭く` |
| `舌が痺れ`（行末） | `舌が痺れる` |
| `赤提灯` | `赤ちょうちん` |

---

### 12-5. 主な検出配列（route.ts）

```typescript
// app/api/ai/generate/route.ts 内
ABSTRACT_SIGNALS_EN      // 英語スローガン
ABSTRACT_LINE_JP         // JP 抽象行（行頭パターン）
WEAK_POETIC_JP           // 弱詩的表現（広域）
ABSTRACT_SUMMARY_JP      // 抽象まとめ語
SLOGANY_ENDING_JP        // Final Chorus ポジティブ標語
EXPLANATORY_PROSE_JP     // 説明口調
META_LYRIC_JP            // メタ歌詞自己言及
MIXED_LANG_WEIRD         // 不自然な日英混在
DETERMINISTIC_REPLACEMENTS  // 確定置換テーブル
```

---

### 12-6. system prompt の主要ルール（SYSTEM_PROMPT）

- **QUICK IDEA IS LAW**: Quick Idea が最上位ソース
- **SOURCE CORE LINE RULE**: 最も痛い1文をChorustアンカーに
- **NO SCENERY SUBSTITUTION RULE**: 痛みを風景に変換しない
- **ABSTRACT EMOTION RULE**: 感情ラベルを具体物・数字・動作に変換
- **RAW REALITY RULE**: 日常の平凡な具体物が感情を運ぶ
- **ABSTRACT SUMMARY RULE**: `贅沢`・`儀式`・`充足` 等を禁止
- **CHORUS RULE**: Chorus は SOURCE CORE LINE + 具体物 + 動作/価格
- **FINAL CHORUS RULE**: 主Chorus の繰り返し ±1行。スローガン禁止
- **JAPANESE-ONLY RULE**: `englishRatio=low` の場合、全行日本語
- **BILINGUAL RULE**: 英語行は日本語行を言い換えない
- **PRE-FINALIZE SCAN**: 出力前に全行スキャン（説明文・メタ歌詞・快感多用等）

---

### 12-7. Repair プロンプトの構成（repairAbstractDrift）

repair は **最大1回**。以下のブロックで構成：

1. REPAIR RULES（行数維持・Chorus concrete 化等）
2. FINAL CHORUS RULES（7行目削除・スローガン禁止）
3. 快感 LIMIT（1回のみ許可）
4. EXPLANATORY PROSE（説明文 → 具体動作）
5. ABSTRACT SUMMARY REPLACEMENT（抽象まとめ語 → 価格/物/動作）
6. ATMOSPHERIC FILLER REPLACEMENT（滲む/蝉時雨/夕暮れ 等）
7. CHORUS SELF-CONTAINED LINES（行末助詞の修正）
8. SECTION ENDINGS（Verse/Bridge 末尾は動作で終わる）
9. SEASONAL FILLER（夏の終わり等 → 具体物）
10. NO PROMPT COPY（プロンプト文の直貼り禁止）
11. META LYRIC（自己言及行 → 物/動作）
12. WEAK SENSORY FILLER（心を撫でる/ふわり 等）
13. NEAR DUPLICATE LINES（隣接行で同名詞・同動詞禁止）
14. INCOMPLETE LINES（助詞終端行の修正）
15. SENSORY FILLER（染み渡る/視線/見つめる 等）
16. NORMALIZE（赤提灯→赤ちょうちん）
17. **FEW-SHOT EXAMPLES**（30件以上）

---

### 12-8. 直近のテストプロンプト

```
高い天然うなぎじゃなくても、養殖うなぎで十分うまい。
赤ちょうちん、タレの焦げ目、山椒、麦茶、冷たいおしぼり、
レシートまで含めた庶民的な夏の歌。
```

**良い出力傾向（維持する方向）:**

```
養殖でいい タレでいい
赤ちょうちん タレの焦げ目
山椒ひと振り 舌が痺れる
レシート七百八十円
小銭を数えて暖簾を出る
割り箸の袋を畳む
麦茶の氷が鳴る
焦げ目を奥歯で噛む
```

---

### 12-9. 残課題（次スレッドでやること）

#### 優先度：高

| 課題 | 詳細 |
|---|---|
| 動詞終端の near_duplicate 未検出 | `畳む` / `拭く` / `飲む` のような「漢字1字+送り仮名」動詞は現行の kanji2+検出で拾えない |
| 連続テスト（3回生成） | `quality_warning:none` / `near_duplicate:none` / `deterministic_replacements:N` が出るか確認 |

#### 動詞終端 near_duplicate の実装案

```typescript
const NEAR_DUP_VERB_ENDINGS = [
  "畳む", "拭く", "飲む", "噛む", "出る", "拾う",
  "戻す", "鳴る", "見る", "開ける", "数える", "折る",
];

// detectNearDuplicate に追加:
const verbA = NEAR_DUP_VERB_ENDINGS.filter(v => lines[i].includes(v));
const verbB = NEAR_DUP_VERB_ENDINGS.filter(v => lines[i + 1].includes(v));
const sharedVerbs = verbA.filter(v => verbB.includes(v));
```

#### 優先度：中

| 課題 | 詳細 |
|---|---|
| Chorus バリエーション固定化 | `赤ちょうちん タレの焦げ目` が毎回同じ並びになりやすい。few-shot で複数パターンを示す |
| `染み渡る` 等が repair 後も残るケース | WEAK_POETIC_JP で検出はできているが repair で消えない場合は deterministic 追加を検討 |
| `identical_section_reuse` 検出（将来） | Chorus 以外のセクション（Pre-Chorus / Verse / Bridge）が同じ lyrics で2回以上完全一致した場合に `identical_section_reuse:detected` をログに出す。Chorus は反復OK。現状は未実装。 |

---

### 12-10. route.ts 変更ファイル

歌詞生成品質改善フェーズで変更したのは **1ファイルのみ**:

```
app/api/ai/generate/route.ts
```

UI・他の API route・lib/ は**一切変更なし**。
品質改善を元に戻すには `route.ts` のみ差し戻せばよい。

---

### 12-11. ブラウザ確認方法

```
localhost:3000
```

で dev server が起動済みの前提で、Quick Idea に上記のテストプロンプトを入れて生成。
サーバーログ（`npm run dev` の出力）に `[mora/generate]` プレフィックスのログが出る。

**合格条件:**
- `quality_warning:none`（near_duplicate を含む）
- `domain_leakage:none`
- `near_duplicate:none`
- `deterministic_replacements:N`（N は0でも正常）
- 実際の歌詞に `贅沢` / `充足` / `安らぎ` / `染み渡る` 等が残っていない
- `養殖でいい` 系の短フックが Chorus に出る
- `レシート七百八十円` / `小銭を数えて暖簾を出る` 等が自然に出る
- `この味でいい` / `これでいい` が出ない
- Chorus 末尾の価格を Interlude が単純反復しない

---

## 13. うなぎ品質改善フェーズ完了 — 2026-05-31

> **最新コミット: `30463bf`**
> うなぎプロンプトでの品質改善フェーズが合格ライン到達。次スレッドから参照。

---

### 13-1. 現在の最終ログ形式

```
[mora/generate] final — quality_warning:none | domain_leakage:none | near_duplicate:none | deterministic_replacements:N
```

| キー | 意味 |
|---|---|
| `quality_warning` | abstract drift または near_duplicate が残存（どちらか detected で detected） |
| `domain_leakage` | 入力に競馬語なし・出力に競馬語あり（`買い目`/`馬券`/`PAT履歴` 等） |
| `near_duplicate` | 隣接行の漢字2+/カタカナ2+ 共通トークン、動詞終端重複、または同一行の複数セクション反復 |
| `deterministic_replacements` | deterministic cleanup で置換した件数（0でも正常） |

---

### 13-2. コミット `4562b7c` 以降の追加実装まとめ

#### 検出強化

| 追加項目 | 内容 |
|---|---|
| `NEAR_DUP_VERB_ENDINGS` | 動詞終端（畳む/拭く/飲む 等12語）の隣接重複を検出 |
| `detectDomainLeakage()` | 入力に競馬語がないのに出力に競馬語が出たら `domain_leakage:detected` |
| WEAK_POETIC_JP 全セクション適用 | 以前は Chorus/Bridge のみ。Verse/Pre-Chorus の弱詩的表現も検出対象に |
| `ABSTRACT_SUMMARY_JP` 拡張 | `この味でいい` / `これでいい` / `この場所だけは` / `変わらないまま` を追加 |
| `WEAK_POETIC_JP` 拡張 | `衣纏う` / `まとう` を追加 |
| Pass 2 repeated-line 検出 | 非Chorus セクションで同一行テキストが2回以上出現したら `repeated line` |
| `ANCHOR_EVIDENCE_LINES` | `レシート七百八十円` 等の Chorus フック行は near_dup の片方として扱わない |
| valid enjambment 拡張 | `が/を/に` 終端への対応。`に` は次行が `NI_ACTION_VERBS` を含む場合のみ許可 |

#### Deterministic Cleanup 追加パターン

| 検出パターン | 置換後 |
|---|---|
| `レシートまで含めた.*歌` | `レシート七百八十円` |
| `^七百八十円$`（単独行） | `カサカサのレシート` |
| `冷たい麦茶で`（行末） | `冷たい麦茶をひと口飲む` |
| `ひやりと冷たい おしぼりが`（行末） | `おしぼりで首を拭く` |
| `冷たいおしぼりが`（行末） | `おしぼりで首を拭く` |
| `この味でいい` | `タレ多めの並ひとつ` |

#### repair prompt 追加ルール

| ルール | 内容 |
|---|---|
| CHORUS FINAL LINE | `麦茶をひと口飲む`/`おしぼりで首を拭く` 等は Chorus 末尾 NG。価格・物証を優先 |
| BREAKDOWN/OUTRO | `レシート七百八十円`/`赤ちょうちん` 等 Chorus 決め行を Breakdown/Outro に流用しない |
| NEAR DUPLICATE SAME-LINE | 同一行が非Chorus で2回以上 → 2回目以降を別動作へ（`おしぼりで首を拭く`×3 など） |
| DOMAIN INTEGRITY | 競馬語（買い目/馬券等）が eel 文脈に漏れた場合の置換候補を明示 |
| 麦茶近接反復 | `麦茶` が近接2行に出たら1つを `湯気の向こうで箸を割る` / `レジ横の小銭皿が鳴る` 等に |

---

### 13-3. 検出定数一覧（現時点）

```typescript
// app/api/ai/generate/route.ts 内
ABSTRACT_SIGNALS_EN         // 英語スローガン
ABSTRACT_LINE_JP            // JP 抽象行（行頭パターン）
WEAK_POETIC_JP              // 弱詩的表現 ← 全セクション適用に変更
ABSTRACT_SUMMARY_JP         // 抽象まとめ語 ← 拡張済み
SLOGANY_ENDING_JP           // Final Chorus ポジティブ標語
EXPLANATORY_PROSE_JP        // 説明口調
META_LYRIC_JP               // メタ歌詞自己言及
MIXED_LANG_WEIRD            // 不自然な日英混在
NEAR_DUP_VERB_ENDINGS       // 動詞終端重複検出用
ANCHOR_EVIDENCE_LINES       // near_dup 例外とする Chorus フック物証行
NI_ACTION_VERBS             // に-enjambment が valid になる動作動詞
DETERMINISTIC_REPLACEMENTS  // 確定置換テーブル ← 拡張済み
RACING_DOMAIN_TERMS         // domain_leakage 検出用（競馬語）
RACING_INPUT_SIGNALS        // 競馬プロンプト判定用
```

---

### 13-4. うなぎプロンプト到達点（合格確認済み）

3回生成の合格条件（コミット `30463bf` 時点で安定確認）：

- `quality_warning:none`
- `domain_leakage:none`
- `near_duplicate:none`（`レシート七百八十円` ↔ `カサカサのレシート` は anchor 例外）
- `養殖でいい タレでいい` 短フックが Chorus に安定出現
- `レシート七百八十円` が Chorus 末尾に安定
- Breakdown / Outro が「帰り際・会計・身体感覚」に具体化
- `おしぼりで首を拭く` の3連発は解消
- `麦茶をひと口飲む` が Chorus 末尾に入る問題は解消
- 競馬語の混入なし

---

### 13-5. 次フェーズ候補（未着手）

優先度順：

| 優先度 | 内容 |
|---|---|
| 高 | 競馬プロンプトでの汎用性テスト（うなぎ合格後の次ステップ） |
| 中 | `identical_section_reuse` 検出（非Chorus セクションの完全一致反復） |
| 中 | Chorus バリエーション固定化の緩和（few-shot で複数パターンを示す） |
| 低 | Emotional Arc / lyric flow 改善（Verse の箇条書き感の解消） |
| 低 | Chorus Variation ルール |
| 低 | Suno 向け演出タグ最適化 |

---

### 13-6. 次スレッドへの引継ぎ

- **最新実装コミット**: `30463bf`
- **変更ファイル**: `app/api/ai/generate/route.ts` のみ
- **UI・lib/ は一切変更なし**
- 次のテストは「競馬プロンプト」で汎用性を確認することを推奨
- 競馬プロンプトで domain_leakage が逆方向（競馬語が正しく出ているか）を確認すること

---

## 14. 競馬プロンプト副作用テスト完了 — 2026-05-31

> **最新コミット: `5702fff`**
> 競馬プロンプトでの副作用テストが完了。テーマ分岐修正により混入解消を確認。

---

### 14-1. このフェーズで実施したこと

| コミット | 内容 |
|---|---|
| `ab81466` | `DETERMINISTIC_REPLACEMENTS` を `GLOBAL` / `UNAGI_SPECIFIC` に分割。`UNAGI_INPUT_SIGNALS` 判定時のみうなぎ置換を適用 |
| `5702fff` | `ANCHOR_EVIDENCE_LINES` を分割（グローバル / `UNAGI_ANCHOR_EVIDENCE_LINES`）。`detectNearDuplicate` に `quickIdea` を渡しテーマ別アンカーを使用。`repairAbstractDrift` の Breakdown/Outro 候補を `isUnagi` / `isRacing` / generic の3分岐に分離 |

---

### 14-2. 競馬プロンプト再テスト結果（コミット `5702fff` 時点）

**合格した確認項目:**

- `domain_leakage:none` ✅
- `near_duplicate:none` ✅（安定）
- うなぎ用 Outro 混入なし ✅（`小銭を数えて暖簾を出る` / `袖口にタレの匂いが残る` 等が競馬歌詞に出なくなった）
- 競馬語が自然に出ている ✅
  - `PAT履歴` / `ハズレ券` / `パドック` / `馬券` / `穴馬` / `展開` / `払い戻し` / `的中表示`
- 競馬用 Breakdown / Outro 候補が使われている ✅

---

### 14-3. 残課題（次フェーズでやること）

#### 優先度：高

| 課題 | 詳細 |
|---|---|
| `weak_poetic` の競馬抽象行が repair 後に残る | 以下のような行が検出されているが、repair で置換されずに残る |

**NG 残存行（例）:**

| 行 | 問題 |
|---|---|
| `人は静かに競馬から離れていく` | weak_poetic / 抽象的な人物描写 |
| `たまに夢を見せること` | weak_poetic |
| `期待だけが残る` | 抽象まとめ語 |
| `それでも画面は変わらず` | 弱い叙述 |
| `知識は深く情熱あった` | 説明口調 |
| `なのに急に消えた` | 説明口調 |

**置換候補（repair prompt に追加予定）:**

| NG | 置換後 |
|---|---|
| `人は静かに競馬から離れていく` | `PAT履歴だけが白く残る` |
| `人は競馬から離れていく` | `ハズレ券を引き出しに入れた` |
| `たまに夢を見せること` | `赤ペンの印だけ残る` |
| `夢を見せる` | `締切前の画面を閉じた` |
| `期待だけが残る` | `払い戻しは0円のまま` |
| `それでも画面は変わらず` | `当たり馬券だけが出なかった` |
| `知識は深く情熱あった` | `赤ペンの跡だけ残る` |
| `なのに急に消えた` | `買い目のメモを閉じた` |

#### 優先度：高（次フェーズ本命）

| 課題 | 詳細 |
|---|---|
| Chorus Variation | 3件とも Chorus がほぼ完全反復。フック行は残してよいが、2回目以降は物証や感情の重さを変える |

**Chorus Variation 実装方針（未着手）:**

- Chorus 1 / Chorus 2 / Final Chorus を完全一致させない
- フック行（`PAT履歴は空白のまま` 等）は維持してよい
- 2回目以降は物証・感情の重さを変化させる

**例:**
```
Chorus 1:  PAT履歴は空白のまま
Chorus 2:  払い戻しは0円のまま
Final:     当たり馬券だけが出なかった
```

#### 優先度：中

| 課題 | 詳細 |
|---|---|
| `identical_section_reuse` 検出 | 非Chorus セクションの完全一致反復（既存課題、未着手） |
| Emotional Arc 実装 | Verse の箇条書き感の解消（既存課題、未着手） |

---

### 14-4. 次フェーズ実装順（推奨）

1. **競馬用 `weak_poetic` concrete repair 強化** — repair prompt に競馬文脈の置換候補を追加
2. **Chorus Variation** — Chorus 反復をバリエーション化（フレーズ系）
3. **`identical_section_reuse` 検出** — 非Chorus 完全反復の検出
4. **Emotional Arc** — Verse の流れ改善

---

### 14-5. 現時点のコード状態

- **変更ファイル**: `app/api/ai/generate/route.ts` のみ
- **UI・lib/ は一切変更なし**
- `UNAGI_INPUT_SIGNALS` / `RACING_INPUT_SIGNALS` / `UNAGI_ANCHOR_EVIDENCE_LINES` はすべて同ファイルに定義済み
- `applyDeterministicCleanup(lyrics, quickIdea)` / `detectNearDuplicate(lyrics, quickIdea)` / `repairAbstractDrift(apiKey, lyrics, quickIdea)` はすべて `quickIdea` を受け取り、テーマ別に動作する

---

## 15. Concrete Pool 導入・汎用品質改善フェーズ — 2026-05-31

> **最新コミット: `45f72b0`**
> Concrete Pool の導入と weak_poetic 修正強化、を-enjambment 厳格化、SYSTEM_PROMPT のうなぎ語彙除去を完了。次スレでは生成テスト結果の確認から再開。

---

### 15-1. このフェーズで実施したコミット一覧

| コミット | 内容 |
|---|---|
| `ab81466` | `DETERMINISTIC_REPLACEMENTS` を `GLOBAL` / `UNAGI_SPECIFIC` に分割。`UNAGI_INPUT_SIGNALS` 判定時のみうなぎ置換を適用 |
| `5702fff` | Breakdown/Outro repair 候補を `isUnagi` / `isRacing` / generic の3分岐に分離。`ANCHOR_EVIDENCE_LINES` をうなぎ専用に分割 |
| `104bf95` | `extractConcreteVocabulary()` を追加。repair prompt に CONCRETE POOL ブロックを挿入（SOURCE → CONCRETE POOL → REPAIR RULES） |
| `aef36c0` | weak_poetic repair rule に CONCRETE POOL 使用を明記。`WEAK_POETIC_JP` に `人は.*離れていく` 系2パターン追加。ABSTRACT SUMMARY / SECTION ENDINGS の `小銭を数えて暖簾を出る` を CONCRETE POOL 参照に変更 |
| `45f72b0` | `WEAK_POETIC_JP` に `/静かに.*から離れていく/` / `/.*から離れていく$/` を追加。`を`-enjambment を `WO_ACTION_VERBS` 条件付きに厳格化（`が` / `を` / `に` を独立分岐に分離）。SYSTEM_PROMPT 3か所から `小銭を数えて暖簾を出る` を削除 |

---

### 15-2. 現時点の設計状態

#### Concrete Pool の仕組み

```
quickIdea + lyrics（非抽象行） → extractConcreteVocabulary() → 最大25トークン
→ repair prompt の CONCRETE POOL ブロックに挿入
→ Gemini が抽象行を Pool 内語彙で置換するよう誘導（Prefer 強度）
```

#### enjambment 判定（3粒子それぞれ独立）

| 粒子 | valid 条件 |
|---|---|
| `が` | 次行が助詞で終わらない |
| `を` | 次行に `WO_ACTION_VERBS` が含まれる（厳格） |
| `に` | 次行に `NI_ACTION_VERBS` が含まれる |

`「熱い麦茶を」+「焦げ目を奥歯で噛む」` → `WO_ACTION_VERBS` なし → `dangling particle` 検出 ✅  
`「カサカサのレシートを」+「財布に戻す」` → `戻す` あり → valid ✅

#### `小銭を数えて暖簾を出る` の残存箇所（`45f72b0` 時点）

| 場所 | 状態 |
|---|---|
| SYSTEM_PROMPT 3か所（旧 235, 253, 353行） | ✅ **削除済み** |
| `UNAGI_ANCHOR_EVIDENCE_LINES` | ✅ うなぎ専用 |
| `breakdownOutroRule`（`isUnagi`） | ✅ うなぎ専用 |
| repair CHORUS FINAL LINE / NEAR DUPLICATE / SENSORY FILLER / FEW-SHOT | うなぎ文脈内・低リスク留置 |

---

### 15-3. 次スレで最初に確認すること

`45f72b0` 後の生成テストが未完了。次スレで以下を確認してから実装判断する。

#### 競馬プロンプト 3件で確認

- `静かに競馬から離れていく` / `〜から離れていく` 系が消えているか
- `小銭を数えて` が競馬側に出なくなったか
- `domain_leakage:none` / `near_duplicate:none` が維持されているか
- 競馬の具体物（PAT履歴 / ハズレ券 / 締切前の画面 / 的中表示）が安定して出るか

#### うなぎプロンプト 1〜2件で確認

- `「熱い麦茶を」+「焦げ目を奥歯で噛む」` のような不自然な `を` enjambment が消えているか
- `「カサカサのレシートを」+「財布に戻す」` のような自然な `を` enjambment は許可されているか
- うなぎ品質が劣化していないか

---

### 15-4. 次フェーズ候補（優先度順）

| 優先度 | 内容 | 状態 |
|---|---|---|
| 高 | 生成テスト確認（15-3） | **次スレ最初のタスク** |
| 高 | weak_poetic concrete repair のさらなる強化（必要なら） | 生成結果を見て判断 |
| 中 | Chorus Variation — Chorus 1 / 2 / Final の完全反復を防ぐ | 未着手 |
| 中 | `identical_section_reuse` 検出 | 未着手 |
| 低 | Emotional Arc — Verse の流れ改善 | 未着手 |
| 低 | FEW-SHOT のうなぎ語彙を段階的に削減 | 未着手 |

---

### 15-5. 変更ファイルとコード状態

- **変更ファイル**: `app/api/ai/generate/route.ts` のみ（全フェーズ通じて）
- **UI・lib/ は一切変更なし**
- 主要な定数・関数一覧:

```typescript
GLOBAL_DETERMINISTIC_REPLACEMENTS   // 全テーマ共通置換（赤提灯のみ）
UNAGI_INPUT_SIGNALS                 // うなぎ判定用
UNAGI_SPECIFIC_REPLACEMENTS         // うなぎ専用置換
RACING_INPUT_SIGNALS                // 競馬判定用
RACING_DOMAIN_TERMS                 // 競馬語 domain_leakage 検出用
ANCHOR_EVIDENCE_LINES               // 全テーマ near_dup 例外
UNAGI_ANCHOR_EVIDENCE_LINES         // うなぎ専用 near_dup 例外
ABSTRACT_QUICK_PATTERNS             // Concrete Pool 抽出時の除外パターン
NI_ACTION_VERBS                     // に-enjambment valid 条件
WO_ACTION_VERBS                     // を-enjambment valid 条件（厳格）
extractConcreteVocabulary()         // quickIdea + lyrics からテーマ語を抽出
isLikelyAbstractLine()              // 軽量抽象行判定
applyDeterministicCleanup(lyrics, quickIdea)
detectNearDuplicate(lyrics, quickIdea)
repairAbstractDrift(apiKey, lyrics, quickIdea)  // CONCRETE POOL 挿入済み
```

---

## 16. 生成テスト結果確認・事故修正フェーズ完了 — 2026-05-31

> **対象コミット: `45f72b0`**
> 競馬3件・うなぎ2件の生成テストで事故修正フェーズの収束を確認。残課題は次フェーズへ。

---

### 16-1. テスト結果サマリー

#### 競馬側：解消・改善確認

| 確認項目 | 結果 |
|---|---|
| `小銭を数えて暖簾を出る` の混入 | ✅ 出ていない |
| `小銭を数えて` 競馬側への漏れ | ✅ 出ていない |
| `静かに競馬から離れていく` 系 | ✅ 出ていない |
| `〜から離れていく` 系 | ✅ 出ていない |
| 競馬の具体物の安定出現 | ✅ 安定（PAT履歴 / 鉛筆 / 赤い的中表示 / 払い戻し0円 / 競馬新聞 / ハズレ券 / 締切前の画面 / PAT口座 / 日曜の夜に印を消す） |

#### うなぎ側：解消・改善確認

| 確認項目 | 結果 |
|---|---|
| `熱い麦茶を` + `焦げ目を奥歯で噛む` 系の不自然な `を` enjambment | ✅ 出ていない |
| `おしぼりで首を拭く` の連発 | ✅ 起きていない |
| Breakdown / Outro の崩れ | ✅ 大きく崩れていない |
| うなぎ具体物の維持 | ✅ 安定（赤ちょうちん / 山椒 / レシート七百八十円 / 換気扇 / 小銭皿 / タレ / 暖簾） |

---

### 16-2. 残存する小課題

#### 課題1: 複合行内の抽象表現 `今日これでいい`（うなぎ）

```
赤ちょうちん 今日これでいい
```

`これでいい` / `今日これでいい` 系が単独行でなく複合行の中に混入。
`ABSTRACT_SUMMARY_JP` の現パターンは行全体マッチ寄りのため、部分マッチを拾えていない。

**対応方針（次フェーズ）:**
- うなぎ入力時のみ `今日これでいい` / `これでいい` を部分一致で deterministic cleanup 対象にする
- 置換候補: `赤ちょうちん 路地に揺れる` / `赤ちょうちん 店先に揺れる` / `赤ちょうちん 油の煙に揺れる`

#### 課題2: `だけが` 終端の未完了行（競馬）

```
缶コーヒーだけが
```

`が` enjambment の許可条件では通過してしまう可能性がある `だけが` 終端。

**対応方針（次フェーズ）:**
- `/だけが$/` を dangling_particle として強制検出する（既存 `が` 判定とは独立して追加）
- 緩和条件: 次行が同セクション内で明確な述語の場合のみ許可（例: `馬券の切れ端だけが / 砂の乾きに残る`）

#### 課題3: Chorus 完全反復（競馬・うなぎ共通）

Chorus 1 / Chorus 2 / Final Chorus がほぼ完全に反復している。
**これは次フェーズ（Chorus Variation）で扱う。事故修正フェーズのスコープ外。**

---

### 16-3. 事故修正フェーズの完了判断

`45f72b0` の修正は成功。事故修正フェーズはほぼ完了と判断する。

- 競馬 ↔ うなぎ間の domain leakage: 解消
- theme 別 deterministic cleanup: 正常動作
- enjambment 検出（`を` / `に` / `が`）: 概ね正常
- Concrete Pool による weak_poetic repair: 機能している
- 残課題2点（`だけが` 終端 / 複合行内抽象）は小さな修正で対応可能

---

### 16-4. 次フェーズ実装順（推奨）

| 優先度 | 内容 | 備考 |
|---|---|---|
| 高 | `だけが` 終端を dangling_particle として強制検出 | 小修正。generate/route.ts のみ |
| 高 | `今日これでいい` 系をうなぎ限定で部分一致 deterministic cleanup | 小修正。generate/route.ts のみ |
| 中 | Chorus Variation — Chorus 1/2/Final の完全反復を防ぐ | 新フェーズ |
| 中 | Emotional Arc — Verse の流れ改善 | 新フェーズ |
| 低 | Music Direction Tags / Suno向け構造タグ補助 | 新フェーズ |
| 低 | `identical_section_reuse` 検出 | 未着手 |

---

## セクション17: Chorus Variation / Final Chorus フェーズ 到達点（2026-05-31）

### 17-1. 最新コミット状況

| コミット | 内容 |
|---|---|
| `0f862f0` | Emotional Arc rules — Verse の流れ改善 |
| `fa9c7ea` | Chorus Variation guidance — Chorus 反復の変化指示 |
| `9401e8a` | selected structures の Final Chorus 化 |
| `08b078a` | STRUCTURE 診断ログ追加 |
| `60834c8` | Builder の最後の Chorus を自動 Final Chorus 化 |
| `7317bea` | Final Chorus 重み付け補強（variation guidance 強化） |
| `0c2ea12` | Final Chorus 完全一致禁止 guidance を FINAL CHORUS RULE / PRE-FINALIZE SCAN / repair prompt に追加 |
| `8beb013` | `の` 終端 dangling noun-modifier の repair prompt 補強（CHORUS SELF-CONTAINED LINES / WEAK SENSORY FILLER / few-shot） |
| `5e3be15` | `赤ちょうちんの\n甘い匄` → `赤ちょうちんの甘い匂い` の deterministic merge を UNAGI_SPECIFIC_REPLACEMENTS に追加 |

現在の最新コミット: **`5e3be15`**

---

### 17-2. 現在の品質評価

| 項目 | 評価 |
|---|---|
| うなぎテーマ全体 | 大きく改善。たたき台として有効な水準に到達 |
| Final Chorus の物証化 | 「指先に山椒の粉が残る」「小銭が皿に残る」などが出るケースあり |
| `赤ちょうちんの / 甘い匄` 2行分割 | deterministic merge により改善傾向 |
| domain_leakage | none で安定 |
| Final Chorus 完全一致 | 一部残るが、大幅に減少 |
| near_duplicate | 一部残る（「暖簾」重複など）。たたき台用途では許容範囲 |
| dangling_particle | 一部残る（`丼の底まで` 等）。人力編集で対応可能 |
| generic positive ending | 発生なし |

---

### 17-3. 品質ゴールの再定義（たたき台方針）

このフェーズ以降、MORA.exe の生成物は「人力で磨くためのたたき台」として位置づける。

- **目標**: 自動生成で 70〜80点のたたき台を安定して出す
- **非目標**: 自動生成で完成品を作る
- 致命的事故を優先して潰す
- 細かい歌詞表現の磨きは人力編集に残す

---

### 17-4. 許容する残課題

以下は人力で数分〜十数分で修正可能な範囲として許容する：

- Final Chorus の変化行がやや弱い（例: `割り箸の先`）
- 1〜2行の弱い表現が残る
- 多少の近接素材重複
- dangling / weak line が少数残ること

---

### 17-5. 許容しない問題（致命的事故）

以下が発生した場合は即座に修正対象とする：

- domain leakage（テーマ外の物証混入）
- セクション構造の崩壊
- 意味不明な日本語
- Chorus / Final Chorus の完全一致が頻発
- 未完行・generic positive ending が大量に残る

---

### 17-6. 次フェーズ backlog（優先度付き）

| 優先度 | 内容 | 備考 |
|---|---|---|
| 中 | `detectFinalChorusIdentical()` による Final Chorus 完全一致検出 → repair 起動 | ロジック変更。repair コスト・レイテンシ増に注意 |
| 中 | `丼の底まで` の限定 deterministic cleanup | `UNAGI_SPECIFIC_REPLACEMENTS` に1件追加。安全 |
| 低 | near_duplicate repair 指示の見直し | prompt 補強。効果は確率的 |
| 低 | dangling_particle 残存時の追加 repair | repair 2段階化。ロジック変更大 |
| 低 | Music Direction Tags | 新フェーズ |

---

## セクション18: EXE化事前調査・Tauri build 確認結果（2026-05-31）

### 18-1. 前フェーズ引き継ぎ

| 項目 | 状態 |
|---|---|
| 基点コミット | `59c016e docs: record structure improvement phase boundary` |
| たたき台生成品質安定化フェーズ | セクション17で完了扱い |
| 今回のフェーズ | EXE化事前調査（コード変更なし） |

---

### 18-2. EXE化事前調査結果

**Tauri 2.x はすでに導入済み。** ゼロから構築する必要なし。

| 確認項目 | 状態 |
|---|---|
| `src-tauri/` ディレクトリ | 存在する |
| `src-tauri/tauri.conf.json` | 存在する |
| `src-tauri/Cargo.toml` | 存在する（Tauri 2.x） |
| `src-tauri/src/lib.rs` | 存在する（`forge_world` Rust command 実装済み） |
| `cargo` | 1.95.0 ✅ |
| `rustc` | 1.95.0 ✅ |
| `tauri-cli` | 2.11.2 ✅ |
| `node` | v24.16.0 ✅ |
| `npm` | 11.13.0 ✅ |
| `node_modules` | 存在する（npm install 不要） |

**`npm run tauri:dev` は正常起動。**

- Next.js dev server（localhost:3000）が先に起動し、Rust ビルド（約35秒）後に Tauri ウィンドウが開く
- dev 環境では Next.js dev server 経由で全 API routes が生きている
- `GET / 200` 確認済み

---

### 18-3. `npm run tauri:build` 結果

**ビルド成功。**

```
npm run build:tauri  → Next.js 静的エクスポート完了
cargo release build  → 56.98秒
mora-exe.exe 生成
bundle 生成完了
```

| 生成物 | パス | サイズ |
|---|---|---|
| EXE（直接実行） | `src-tauri/target/release/mora-exe.exe` | 11.1 MB |
| MSI インストーラー | `src-tauri/target/release/bundle/msi/MORA.exe_0.1.0_x64_en-US.msi` | 4.1 MB |
| NSIS インストーラー | `src-tauri/target/release/bundle/nsis/MORA.exe_0.1.0_x64-setup.exe` | 2.9 MB |

- EXE 直接起動: 成功
- UI 表示: 成功（Tauri WebView が `out/index.html` を表示）
- サーバーレス動作（ポートなし）

---

### 18-4. 現状 EXE の制限

**`build:tauri` は `NEXT_OUTPUT=export next build`（静的エクスポート）。**

- `out/` に `/api/` フォルダが存在しない（Next.js API routes は静的エクスポートに含まれない）
- 本番 EXE 内で `fetch("/api/ai/...")` を呼ぶと `tauri://localhost/api/...` に解決されるが、該当ファイルが存在しないため 404 / fetch 失敗

| 機能 | EXE 内の挙動 | ユーザーへの見え方 |
|---|---|---|
| generate | fetch 失敗 → `catch {}` → ルールベース歌詞生成 | エラー表示なし（サイレントフォールバック） |
| forge（WorldForge） | fetch 失敗 → `ruleBasedForge(seed)` | エラー表示なし（サイレントフォールバック） |
| rewrite | fetch 失敗 → `null` → `applyRewriteMode()` | エラー表示なし（サイレントフォールバック） |
| alchemy（SourceAlchemy） | fetch 失敗 → `setError(err.message)` | **🔴 "Failed to fetch" 相当のエラーが UI に表示される** |

**注意:** WorldForge の Tauri `invoke` パスはコード上で意図的に無効化されている（`WorldForge.tsx` コメント参照）。

---

### 18-5. 重要な判断

| 判断 | 内容 |
|---|---|
| 現状 EXE の位置づけ | 「Claude なしのルールベース版」として起動は可能 |
| Claude 品質で動かすには | API route 依存を解消する必要がある |
| 最有力の解決策 | Next.js API routes を Tauri/Rust command に移植 |
| 移植の規模 | 大きい。個別に設計・フェーズ化が必要 |
| 既存実装の再利用 | `lib.rs` の `forge_world` を参考に他の3本（generate / rewrite / alchemy）を移植できるはず |

---

### 18-6. 次フェーズ候補と方針

**方針: いきなり全 API を移植しない。小さい機能から順に設計・実装する。**

| 優先度 | 内容 | 備考 |
|---|---|---|
| 高 | **alchemy の Rust command 化**（設計） | 3本の中で最もシンプル。単一プロンプト→JSON返却の構造 |
| 高 | generate / rewrite の Rust command 化（設計） | generate が最大規模。システムプロンプト・repair 込み |
| 中 | APIキー設定方法の設計 | 環境変数 / 設定ファイル / 初回設定UI のいずれか |
| 中 | `forge_world` Rust 実装の再利用性確認 | `.env.local` を読まない点に注意（システム環境変数が必要） |
| 低 | EXE 配布時の注意事項整備 | SmartScreen 警告・オフライン不可・APIキー設定手順 |

**generate は最後に回す**（最も規模が大きく、システムプロンプト・repair・バリデーションを含む）。

---

### 18-7. EXE 配布時の既知リスク

| リスク | 対策 |
|---|---|
| APIキーを EXE に埋め込まない | `std::env::var("ANTHROPIC_API_KEY")` で実行時読み込み（`lib.rs` 方式） |
| Windows SmartScreen 警告 | 未署名 EXE は初回起動で「発行元不明」警告が出る。コードサイニング証明書が必要 |
| オフライン動作不可 | Claude API 呼び出しがあるため完全オフラインでは動かない。ユーザーへの説明が必要 |
| ユーザー環境でのキー設定 | 初回設定 UI または README での案内が必要 |
| `.env.local` が Rust プロセスで読まれない | Next.js は `.env.local` を読むが、Rust プロセスはシステム環境変数のみ参照 |

---

## セクション19: Phase EXE-1 完了 — Source Alchemy Rust command 化（2026-05-31）

### 19-1. 実施内容

| 項目 | 内容 |
|---|---|
| フェーズ | Phase EXE-1 / Step 1〜3 |
| 目的 | EXE本番で Source Alchemy の `Failed to fetch` エラーを解消 |
| 変更ファイル | `src-tauri/src/lib.rs` / `components/SourceAlchemy.tsx` のみ |
| route.ts・その他 | 一切変更なし |

---

### 19-2. 追加した Rust command

**command 名**: `alchemy_transform`

```rust
#[tauri::command]
async fn alchemy_transform(
    source_text: String,
    user_reaction: String,
    desired_tone: String,
    avoid_direct_reference: bool,
) -> Result<Option<serde_json::Value>, String>
```

| 戻り値 | 意味 |
|---|---|
| `Ok(Some(value))` | Gemini から取得した AlchemyResult JSON |
| `Ok(None)` | `GEMINI_API_KEY` 未設定 — フロントでエラーメッセージ表示 |
| `Err(msg)` | API失敗 / JSON parse失敗 — フロントで `setError(msg)` |

- **Gemini API**: `gemini-2.5-flash` / `maxOutputTokens: 2500` / `response_mime_type: "application/json"` / `thinkingBudget: 0`
- **APIキー**: `std::env::var("GEMINI_API_KEY")` — システム環境変数のみ参照（`.env.local` は Rust から読めない）
- **APIキーをログに出さない**: URL に key パラメータが含まれるため、URL を `eprintln!` / `println!` に出力しない
- **タイムアウト**: 60秒（forge_world の 30秒より余裕を持たせた）
- **JSON抽出**: `extract_json_object()` ヘルパーを追加（コードフェンス除去 + string-aware ブラケット深さ探索 + `serde_json::from_str`）
- **`invoke_handler!`**: `tauri::generate_handler![forge_world, alchemy_transform]`

---

### 19-3. フロント側の変更（SourceAlchemy.tsx）

`handleTransmute` 内に Tauri 判定を追加し、環境に応じて経路を分岐。

```typescript
const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
```

| 環境 | 経路 | APIキーの場所 |
|---|---|---|
| EXE / `tauri:dev` | `invoke("alchemy_transform")` | システム環境変数 `GEMINI_API_KEY` |
| Web / `npm run dev` | `fetch("/api/ai/alchemy")` | `.env.local` の `GEMINI_API_KEY` |

- `invoke` が `null` を返した場合（キー未設定）: `"Source Alchemy requires Gemini API. EXE版ではシステム環境変数 GEMINI_API_KEY を設定してください。"` を表示
- `invoke` が reject された場合（API失敗）: 既存の `catch` で `setError(msg)` — fetch 失敗と同じ経路

---

### 19-4. 手動確認結果（2026-05-31）

| 確認項目 | 結果 |
|---|---|
| `tauri:dev` 起動 | ✅ |
| `GEMINI_API_KEY` 設定あり → TRANSMUTE 実行 | ✅ TRANSMUTATION RESULT 表示 |
| `Generated World Seed` 表示 | ✅ |
| `Set as World Seed` で World Seed に反映 | ✅ |
| `Failed to fetch` エラー | ✅ 解消（出ていない） |
| `GEMINI_API_KEY` なし → エラーメッセージ表示 | ✅ EXE版案内メッセージが UI に出た |

---

### 19-5. 現在の EXE 機能状態（Phase EXE-1 完了後）

| 機能 | EXE本番の挙動 |
|---|---|
| generate | fetch 失敗 → rule-based fallback（サイレント）|
| forge（WorldForge） | fetch 失敗 → `ruleBasedForge(seed)`（サイレント）|
| rewrite | fetch 失敗 → rule-based fallback（サイレント）|
| **alchemy（SourceAlchemy）** | **✅ `invoke("alchemy_transform")` → Gemini API（解消）** |

---

### 19-6. 次フェーズ候補

| 優先度 | 内容 | 備考 |
|---|---|---|
| 高 | `forge_world` の Gemini 対応版への更新 | 現在は Anthropic API を呼んでいる。`GEMINI_API_KEY` に統一し、`WorldForge.tsx` の invoke パスを有効化 |
| 中 | `rewrite` の Rust command 化 | 339行。中程度の規模 |
| 低 | `generate` の Rust command 化 | 1554行。最大規模のため最後 |
| 低 | APIキー設定 UI | 初回起動時の案内 UI |

**generate は最後に回す**（システムプロンプト・repair・CONCRETE POOL・deterministic cleanup を含む最大規模）。

---

## セクション20: Phase EXE-2 完了 — forge_world Gemini 統一（2026-05-31）

### 20-1. 実施内容

| 項目 | 内容 |
|---|---|
| フェーズ | Phase EXE-2 |
| 目的 | `forge_world` を `ANTHROPIC_API_KEY` から `GEMINI_API_KEY` に統一し、Tauri invoke パスを有効化 |
| 変更ファイル | `src-tauri/src/lib.rs` / `components/WorldForge.tsx` のみ |
| generate / rewrite / alchemy | 一切変更なし |

---

### 20-2. `forge_world` の変更内容（lib.rs）

| 変更点 | Before | After |
|---|---|---|
| APIキー | `ANTHROPIC_API_KEY` | `GEMINI_API_KEY` |
| エンドポイント | `api.anthropic.com/v1/messages` | Gemini REST（`gemini-2.5-flash`）|
| リクエスト body | Anthropic 形式 | Gemini 形式（`system_instruction` / `generationConfig`）|
| `maxOutputTokens` | 1400 | 2000 |
| タイムアウト | 30秒 | 60秒 |
| レスポンス取得パス | `resp_json["content"][0]["text"]` | `resp_json["candidates"][0]["content"]["parts"][0]["text"]` |
| JSON 抽出 | コードフェンス trim + `from_str` | `extract_json_object()` 再利用（Phase EXE-1 実装済み）|
| `musicDirection.source` | `"claude"`（型に存在しない値） | `"gemini"`（型定義 `"gemini" \| "rule"` に準拠）|
| system prompt 例文 | `"fluorescent loneliness"` | `"vending-machine loneliness"`（route.ts に同期）|

- **APIキーをログに出さない**: URL に key パラメータが含まれるため `eprintln!` 等への出力なし
- **`GEMINI_API_KEY` 未設定**: `Ok(None)` → フロントで `ruleBasedForge(seed)` にサイレント fallback

---

### 20-3. WorldForge.tsx の変更内容

| 環境 | 経路 |
|---|---|
| EXE / `tauri:dev` | `invoke("forge_world", { worldSeed })` → Gemini API |
| Web / `npm run dev` | `fetch("/api/ai/forge")` → Next.js route（変更なし）|

- `isTauri` 判定: `__TAURI_INTERNALS__` in window（Phase EXE-1 と同じ方式）
- `null` 返却時（キー未設定）: `ruleBasedForge(seed)` にサイレント fallback（エラー表示なし）
- invoke reject 時: 既存の `catch` → `ruleBasedForge(seed)`（変更なし）
- Tauri invoke path を無効化していたコメントは削除済み

---

### 20-4. 手動確認結果（2026-05-31）

| 確認項目 | 結果 |
|---|---|
| `tauri:dev` 起動 | ✅ |
| `GEMINI_API_KEY` 設定あり → FORGE WORLD 実行 | ✅ Forged World が表示された |
| **"AI" バッジ表示**（`source === "gemini"` 判定） | ✅ 表示確認 |
| Library に Forge 結果由来のタグが追加 | ✅ |
| `Failed to fetch` エラー | ✅ 解消（出ていない）|

---

### 20-5. 現在の EXE 機能状態（Phase EXE-2 完了後）

| 機能 | EXE本番の挙動 |
|---|---|
| generate | fetch 失敗 → rule-based fallback（サイレント）|
| **forge（WorldForge）** | **✅ `invoke("forge_world")` → Gemini API（AI バッジ）/ キーなしは RULE バッジで fallback** |
| rewrite | fetch 失敗 → rule-based fallback（サイレント）|
| alchemy（SourceAlchemy） | ✅ `invoke("alchemy_transform")` → Gemini API（Phase EXE-1 完了）|

---

### 20-6. 次フェーズ候補

| 優先度 | 内容 | 備考 |
|---|---|---|
| 高 | `rewrite` の Rust command 化 | 339行。中程度の規模。EXE で rule-based fallback のまま |
| 低 | `generate` の Rust command 化 | 1554行。システムプロンプト・repair・CONCRETE POOL・deterministic cleanup を含む最大規模。最後に回す |
| 低 | APIキー設定 UI | 初回起動時の案内 UI |

**generate は最後に回す**（最も規模が大きく、フェーズ分割が必要）。

---

## セクション21: Phase EXE-3 完了 — rewrite_lyrics Rust/Tauri command 化（2026-05-31）

### 21-1. 実施内容

| 項目 | 内容 |
|---|---|
| フェーズ | Phase EXE-3 |
| 目的 | EXE本番で Rewrite 機能を Gemini AI 品質で動作させる |
| 変更ファイル | `src-tauri/src/lib.rs` / `lib/claudeRewrite.ts` のみ |
| app/page.tsx | **変更不要**（`callClaudeRewrite` が `null` を返せば `applyRewriteMode` に自動 fallback する既存設計のため）|
| route.ts / generate / alchemy / forge | 一切変更なし |

---

### 21-2. 追加した Rust command

**command 名**: `rewrite_lyrics`

```rust
#[tauri::command]
async fn rewrite_lyrics(
    mode: String,
    lyrics: String,
    style_prompt: String,
    _song_input: Value,       // passed by frontend; world_preset extracted separately
    mora_warnings: Vec<i64>,
    intensity: String,
    section_target: String,
    world_preset: String,
) -> Result<Option<Value>, String>
```

| 戻り値 | 意味 |
|---|---|
| `Ok(Some({ rewrittenLyrics, notes, changedLines }))` | 成功 |
| `Ok(None)` | `GEMINI_API_KEY` 未設定 → `null` → `applyRewriteMode` fallback |
| `Err(msg)` | API失敗 / JSON parse失敗 → invoke reject → catch → `null` → fallback |

**移植した helper 関数:**

| Rust 関数 | 対応する route.ts 関数 |
|---|---|
| `rewrite_intensity_instruction()` | `intensityInstruction()` — 3分岐 |
| `rewrite_section_instruction()` | `sectionInstruction()` — 5分岐 |
| `rewrite_mode_instruction()` | `modeInstruction()` — 11モード（catchy / remove-ai / shorten-mora / strengthen-chorus / more-japanese / more-english / darker / danceable / poetic / ironic / ojaly） |
| `rewrite_preset_deep()` | `PRESET_DEEP` — 6プリセット（neon / corporate / mythic / digital-motown / electro-waltz / gospel-irony）|

- **APIキー**: `GEMINI_API_KEY` 環境変数
- **モデル**: `gemini-2.5-flash` / `maxOutputTokens: 2500` / `response_mime_type: "application/json"` / `thinkingBudget: 0`
- **タイムアウト**: 60秒
- **JSON 抽出**: `extract_json_object()` 再利用（Phase EXE-1 実装済み）
- **出力正規化**: `rewrittenLyrics ?? lyrics` / `notes ?? ""` / `changedLines ?? []`（route.ts と同じ fallback）

---

### 21-3. lib/claudeRewrite.ts の変更内容

`callClaudeRewrite()` 内に Tauri 判定を追加。

| 環境 | 経路 |
|---|---|
| EXE / `tauri:dev` | `invoke("rewrite_lyrics", { mode, lyrics, ... })` → `ClaudeRewriteResult \| null` |
| Web / `npm run dev` | 既存 `fetch("/api/ai/rewrite")` をそのまま維持 |

- `null` 返却時・invoke reject 時: `console.warn` して `null` を返す
- `page.tsx` の `handleRewrite` は `result === null` で `applyRewriteMode` に切り替わる（変更不要）

---

### 21-4. 手動確認結果（2026-05-31）

| 確認項目 | 結果 |
|---|---|
| `tauri:dev` 起動 | ✅ |
| `GEMINI_API_KEY` 設定あり → rewrite 実行 | ✅ 歌詞が更新された |
| **"Gemini AI" バッジ表示** | ✅ 確認 |
| 変更メモが表示された | ✅ |
| エラー表示なし | ✅ |

---

### 21-5. 現在の EXE 機能状態（Phase EXE-3 完了後）

| 機能 | EXE本番の挙動 |
|---|---|
| generate | fetch 失敗 → rule-based fallback（サイレント）|
| **forge（WorldForge）** | ✅ `invoke("forge_world")` → Gemini API |
| **rewrite** | ✅ `invoke("rewrite_lyrics")` → Gemini API |
| **alchemy（SourceAlchemy）** | ✅ `invoke("alchemy_transform")` → Gemini API |

---

### 21-6. 次フェーズ候補

| 優先度 | 内容 | 備考 |
|---|---|---|
| 高 | `generate` の事前設計確認 | 1554行。いきなり実装しない。まず設計確認から |
| 低 | `generate` の Rust command 化 | システムプロンプト・repair・CONCRETE POOL・deterministic cleanup を含む最大規模。フェーズ分割が必要 |
| 低 | APIキー設定 UI | 初回起動時の案内 UI |

**generate はまず事前設計確認から**（最も規模が大きく、フェーズ分割が必要）。

---

## 22. Phase EXE-4B〜4D: generate legacy path Rust/Tauri command 化完了（2026-05-31）

### 22-1. 完了フェーズ

| フェーズ | 内容 |
|---|---|
| EXE-4A | invoke引数設計確認（コード変更なし） |
| EXE-4B | `lib/generateLyrics.ts` 新規作成 |
| EXE-4C | `app/page.tsx` の generate fetch 3箇所を `callGenerateLyrics()` に差し替え |
| EXE-4D | `src-tauri/src/lib.rs` に `generate_lyrics` Rust command 追加 |

### 22-2. lib/generateLyrics.ts の仕様

| 環境 | 経路 |
|---|---|
| EXE / `tauri:dev` | `invoke("generate_lyrics", { songInput, expansion, resolvedStructure, worldPresetDeepPrompt, libraryStyleAddition })` |
| Web / `npm run dev` | 既存 `fetch("/api/ai/generate", ...)` をそのまま維持 |

- `null` 返却時・invoke reject 時: `null` を返し、既存 rule-based fallback に任せる
- `app/page.tsx` の fetch 3箇所（handleGenerate PATH A / PATH B / handleRegenLyrics）を `callGenerateLyrics()` 経由に統一

### 22-3. generate_lyrics Rust command の仕様

```rust
#[tauri::command]
async fn generate_lyrics(
    song_input: serde_json::Value,
    expansion: Option<serde_json::Value>,
    resolved_structure: String,
    world_preset_deep_prompt: String,
    library_style_addition: String,
) -> Result<Option<serde_json::Value>, String>
```

| 戻り値 | 意味 |
|---|---|
| `Ok(Some({ lyrics, notes }))` | 成功 |
| `Ok(None)` | `GEMINI_API_KEY` 未設定 → `null` → rule-based fallback |
| `Ok(None)` | expansion あり → `null` → `buildExpansionLyricsFallback` fallback（EXE-4E 実装予定） |
| `Err(msg)` | API失敗 / lyrics 空 → invoke reject → catch → `null` → fallback |

- **APIキー**: `GEMINI_API_KEY` 環境変数
- **モデル**: `gemini-2.5-flash` / `maxOutputTokens: 3200` / `response_mime_type: "application/json"` / `thinkingBudget: 0`
- **タイムアウト**: 60秒
- **structure解決**: TS側で `resolveStructure()` を事前計算して `resolved_structure` に渡す方式（EXE-4A 設計決定）
- **deepPrompt解決**: TS側で `WORLD_PRESETS[worldPreset]?.deepPrompt` を解決して `world_preset_deep_prompt` に渡す方式（EXE-4A 設計決定）

### 22-4. 移植済み / 未移植

| 項目 | 状態 |
|---|---|
| `GENERATE_SYSTEM_PROMPT`（≒380行） | ✅ 移植済み（Rust raw string定数） |
| `generate_lang_instruction`（langInstruction相当） | ✅ 移植済み |
| `buildLegacyUserPrompt` 相当 | ✅ 移植済み |
| expansion path（`buildExpansionUserPrompt`） | ❌ 未対応（`Ok(None)` を返す） |
| `repairAbstractDrift`（第2Gemini呼び出し） | ❌ 未移植 |
| `detectAbstractDrift` / `detectNearDuplicate` 等の品質検出 | ❌ 未移植 |
| `applyDeterministicCleanup` | ❌ 未移植 |
| domain leakage 検出 | ❌ 未移植 |

### 22-5. 手動確認結果（2026-05-31）

| 確認項目 | 結果 |
|---|---|
| `tauri:dev` 起動 | ✅（初回は旧プロセス残留により `Command generate_lyrics not found` が1度出たが、再ビルド後に解消） |
| expansion なし・通常生成の実行 | ✅ 歌詞が生成された |
| **"Gemini AI" バッジ表示** | ✅ 確認 |
| 変更メモが表示された | ✅ |
| エラー表示なし | ✅ |

### 22-6. 現在の EXE 機能状態（Phase EXE-4D 完了後）

| 機能 | EXE本番の挙動 |
|---|---|
| **generate（legacy path）** | ✅ `invoke("generate_lyrics")` → Gemini API |
| generate（expansion path） | ❌ `Ok(None)` → `buildExpansionLyricsFallback`（EXE-4E 実装予定） |
| generate repair | ❌ 未移植（EXE-4F で判断） |
| **rewrite** | ✅ `invoke("rewrite_lyrics")` → Gemini API |
| **forge（WorldForge）** | ✅ `invoke("forge_world")` → Gemini API |
| **alchemy（SourceAlchemy）** | ✅ `invoke("alchemy_transform")` → Gemini API |

### 22-7. 次フェーズ候補

| 優先度 | 内容 | 備考 |
|---|---|---|
| 高 | EXE-4E: expansion path 対応 | expansion あり時の `buildExpansionUserPrompt` 相当を Rust に実装。**実装前に事前設計確認を行うこと** |
| 中 | EXE-4F: repair 対応判断 | legacy path 品質を評価後に判断。repairは第2Gemini呼び出しを含むため慎重に |
| 低 | APIキー設定 UI | 初回起動時の案内 UI |

**expansion path は WorldExpansion の全フィールドを Rust に渡す設計が必要なため、いきなり実装しない。**
