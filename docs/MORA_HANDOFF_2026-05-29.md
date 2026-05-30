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
