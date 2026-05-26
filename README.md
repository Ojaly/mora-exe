# MORA.exe — Suno World Translator IDE

> 世界観を語る → MORA.exe が音楽言語へ翻訳する

---

## コンセプト

MORA.exe は **Suno向けの単なる Prompt Generator ではない。**

「世界観・感情・テーマ」を入力として受け取り、Suno AIが理解できる音楽言語（Style Prompt・Lyrics・Negative Prompt）へ変換する **制作 IDE** である。

> ユーザーは「どんなジャンルか」ではなく「どんな世界観か」を語る。  
> MORA.exe が Genre / BPM / Texture / Vocal を自動で推定し、Suno 入力へ落とし込む。

VSCode と DAW と Writing Tool を掛け合わせた思想で設計されている。Mora 分析・Rewrite・世界観プリセットはすべて「世界観を正確に Suno へ伝える」ための補助機能だ。

---

## 中核導線

```
⚗ Source Alchemy          現実の素材（記事・SNS等）→ 世界観への抽象化
        ↓
  World Seed               ユーザーが語る一行の世界観テキスト
        ↓
↯ Forge World              MORA.exe が世界観を音楽的に展開（rule-based または Claude）
        ↓
  WorldExpansion           scene / emotion / texture / objects / contradiction /
                           soundDirection / musicDirection / lyricsDirection
        ↓
  Detected Direction       推定 genreHint / atmosphere / tempoFeel / vocalStyle /
                           instruments を可視化
        ↓
  Style Prompt             buildStylePromptFromExpansion → 大気圧 > ジャンル優先
  Lyrics                   Claude API → expansion-first 生成
  Negative Prompt          buildNegativePromptFromExpansion
        ↓
  Rewrite / Mora Tuning    カテゴリ別リライト・モーラ分析・行修正
```

**全ての入力は最終的に WorldExpansion に収束してから Generate される。**

---

## 設計原則

| 原則 | 内容 |
|------|------|
| **WorldExpansion-first** | Generate は expansion の有無を最初に確認し、ある場合は expansion からのみ構築する |
| **大気圧 > ジャンル** | `[Style:]` は `atmosphere` を先頭に置く。`genreHint` は補足として括弧内に入る |
| **Source Alchemy はただの入口** | Source Alchemy は World Seed を作るだけ。専用の Generate ルートを持たない |
| **Fine Tune は主役ではない** | Genre / Mood / Vocal / BPM のフォームは生成に優先されない。WorldExpansion が推定した値が使われる |
| **ルートの統一** | Source Alchemy / Wizard / World Seed それぞれの専用 Generate ルートを作らない |
| **フォーム地獄に戻さない** | 設定項目を増やすことで精度を上げようとしない |

---

## 主要機能

### ⚗ Source Alchemy
現実のテキスト（ニュース・SNS・記事）をユーザーの反応とともに入力し、固有名詞・時事性を排除した「世界観の種」へ変換する。10の錬金法則（固有名詞禁止・完全抽象化・ニュースの見出しにしない等）に基づく Claude によるトランスミュート。503 時は不動作（rule-based fallback なし）。

### ↯ World Forge
World Seed（1〜3行の世界観テキスト）を入力として WorldExpansion を生成する。Claude API 使用時は深いコンテキスト推定、未設定時は rule-based フォールバック（regex + 辞書）で動作。

### Detected Direction
World Forge の結果として表示される MORA.exe の音楽解釈パネル。ラベル行テーブル形式で以下を表示：

- **Genre Hint** — 世界固有の genre 感（standard genre 名ではない）
- **Atmosphere** — 2〜4 の感覚的/大気的記述
- **Tempo Feel** — テンポの質感
- **Vocal** — ボーカルテクスチャ＋マイク処理
- **Instruments** — この世界に存在する楽器 2〜4 本
- **Lyric Angle** — 歌詞がこの世界へどう近づくべきか（日本語）

rule-based の場合は「rule-based estimate」注記あり。

### Style Prompt 生成
`buildStylePromptFromExpansion` が生成する。出力例：

```
[Quick Idea:] 深夜のラーメン屋で神を待つ男
[Style:] spiritual, devotional, ラーメン-scented, intimate  (atmospheric experimental)
[Tempo:] mid-tempo, deliberate
[Vocal:] dry male, hushed
[Instruments:] minimal piano, sparse brushed percussion, low bass drone
[Texture:] intimate, hushed, close-mic, minimal reverb
[Concept:] ラーメン, 麺, スープ, 丼, 湯気, チャーシュー
[Structure:] [verse] → [pre-chorus] → [chorus] → ...
[Mix:] cinematic balance, atmosphere-forward, world over polish
[World:] 日常的なラーメンへの神聖な執着 / mundane subject ↔ religious intensity
[Lyric Direction:] 「深夜のラーメン屋で神を待つ男」を中心にラーメン・麺...
```

### Lyrics 生成
WorldExpansion を Claude へ渡して生成（`buildExpansionUserPrompt`）。Claude 不使用時は `buildExpansionLyricsFallback` で expansion.scene / objects / contradiction から世界固有の scaffold を構築。generic mood pool は expansion があるかぎり使われない。

### Rewrite
カテゴリ別ボタン + SECTION / INTENSITY 設定。Claude API 使用時は高品質書き換え、未設定時は rule-based。

| カテゴリ | ボタン |
|---------|--------|
| REWRITE | キャッチー / 短縮 / サビ強化 / AI臭除去 / ojaly.化 |
| TONE    | ダーク / ダンサブル / 詩的 / 皮肉 |
| LANG    | JP多め / EN多め |

### ojaly. 化
MORA.exe 固有の Rewrite preset。説明を削り、余韻・夜・ミニマルな比喩に寄せる。ノクターナル・詩的・皮肉・最小化・映画的を組み合わせた美学。ボタンに tooltip: `"説明を削り、夜・光・余韻・皮肉・ミニマルな比喩に寄せる"` あり。

### Fine Tune（サイドバー）
Direction Adjust チップ（more aggressive / darker / lo-fi / male vocal 等 16 種）と LENGTH / LANG / BPM / KEY / REF / サビ始まり。World Lens プリセット（NEON / CORP / MYTH / MTWN / WALTZ / GOSP）。

### Avoid / Negative
避けたい表現テキスト入力 + AI 臭さ回避 Toggle。Negative Prompt に反映。

### Mora Tuner
歌詞の各行をモーラ単位で分析。

| モーラ数 | 判定 | リスク |
|---------|------|--------|
| 0〜3    | 短   | メリスマ化・引き伸ばし |
| 4〜14   | OK   | 安定範囲 |
| 15以上  | 長   | 詰め込み・小節引き伸ばし |

### Prompt Memory
SAVE / MEM で最大 20 件の Style Prompt + Lyrics を保存・復元できる。

---

## Generate 仕様（現在）

```typescript
// handleGenerate の二分岐

if (expansion) {
  // PATH A: expansion-first（World Forge 使用済み）
  setStyle(buildStylePromptFromExpansion(expansion, input, worldSeed))
  setNeg(buildNegativePromptFromExpansion(expansion, input))
  
  // Claude API 成功 → expansion ベースの歌詞
  // Claude API 失敗（503等）→ buildExpansionLyricsFallback（expansion.scene/objects/contradictionから構築）
  return  // ← 必ず早期リターン。Legacy path に絶対に落ちない
}

// PATH B: Legacy（expansion なし）
setStyle(buildStylePrompt(input, preset))
setNeg(buildNegativePrompt(input))
// Claude API 失敗 → buildLyricsDraft（従来の mood pool）
```

**「World Forge active — expansion-first generate」が表示されている時、Generate も必ず expansion から生成される。**

---

## 開発環境

### 依存関係

| パッケージ | バージョン |
|-----------|-----------|
| Next.js   | 16.2.6    |
| React     | 19.2.4    |
| TypeScript | ^5       |
| Tailwind CSS | ^4    |
| @anthropic-ai/sdk | ^0.98.0 |
| @tauri-apps/cli | ^2.11.2 |

### セットアップ

```bash
git clone https://github.com/Ojaly/mora-exe.git
cd mora-exe
npm install
```

### 起動

```bash
# ブラウザ版（推奨・開発中はこちら）
npm run dev
# → http://localhost:3000

# デスクトップ版（Tauri）開発モード
npm run tauri:dev

# デスクトップ版（Tauri）リリースビルド
npm run tauri:build
# → src-tauri/target/release/bundle/ に出力
```

> **Tauri 前提条件：** [Rust](https://rustup.rs) のインストールが必要。

### Claude API 設定（任意）

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
```

APIキーは [Anthropic Console](https://console.anthropic.com/) で発行。

**未設定時の動作：**

| 機能 | 未設定時の動作 |
|------|--------------|
| World Forge | rule-based フォールバック（regex + 辞書）で動作 |
| Generate (Lyrics) | `buildExpansionLyricsFallback` または mood pool で動作 |
| Rewrite | rule-based フォールバック（`lib/rewriteModes.ts`）で動作 |
| Source Alchemy | **動作しない**（Claude 必須） |

**セキュリティ：**
- `.env.local` は `.gitignore` の `.env*` ルールで Git 管理外
- API キーはサーバーサイド（API Route）のみで使用。フロントエンドに露出しない
- `.env.local` を絶対にコミットしないこと

---

## プロジェクト構成（主要ファイル）

```
mora-exe/
├── app/
│   ├── page.tsx                  # メイン UI（handleGenerate / Rewrite bar）
│   └── api/ai/
│       ├── forge/route.ts        # World Forge API（rule-based + Claude）
│       ├── generate/route.ts     # Lyrics 生成 API
│       ├── rewrite/route.ts      # Rewrite API
│       └── alchemy/route.ts      # Source Alchemy API
├── components/
│   ├── Sidebar.tsx               # サイドバー全体（Alchemy/Forge/FineTune/Avoid/Generate）
│   ├── WorldForge.tsx            # World Seed textarea + Forge ボタン + Expansion 表示
│   ├── MusicDirectionPanel.tsx   # Detected Direction パネル
│   ├── SourceAlchemy.tsx         # Source Alchemy UI
│   ├── LyricsEditor.tsx          # 歌詞エディタ
│   ├── PromptEditor.tsx          # Style Prompt エディタ
│   └── MoraTunerPanel.tsx        # Mora Tuner
├── lib/
│   ├── promptBuilder.ts          # buildStylePromptFromExpansion / buildStylePrompt
│   ├── lyricsBuilder.ts          # buildLyricsDraft / buildExpansionLyricsFallback
│   ├── rewriteModes.ts           # rule-based rewrite（poetic / ironic / ojaly 等）
│   ├── claudeRewrite.ts          # Claude Rewrite 呼び出し
│   ├── moraAnalyzer.ts           # モーラ分析
│   ├── themeExtractor.ts         # World Seed からの motif / style word 抽出
│   ├── worldPresets.ts           # World Lens プリセット定義
│   └── promptMemory.ts           # localStorage ベースのメモリ
├── types/
│   └── index.ts                  # SongInput / WorldExpansion / MusicDirection 等
└── docs/
    └── DEVELOPMENT_HISTORY.md    # 開発経緯・設計変更履歴
```

---

## トラブルシューティング

### Port 3000 が既に使用されている

```bash
# Windows（PowerShell）
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id <PID> -Force

# macOS / Linux
lsof -ti:3000 | xargs kill -9
```

`npm run tauri:dev` を実行する前に既存の `npm run dev` プロセスを停止すること。両者が同時に Port 3000 を使おうとするとポート競合が起きる。

### Source Alchemy が動かない

ANTHROPIC_API_KEY が必要。`.env.local` を確認する。Source Alchemy には rule-based フォールバックがない（意図的な設計：alchemy は抽象化の質が重要なため）。

### World Forge が rule-based になる

Claude API 未設定時は rule-based フォールバックになる。rule-based でも動作するが、より深いコンテキスト推定には Claude が必要。Detected Direction パネルに `RULE` バッジが表示される。

---

## UI テーマ

GitHub Light パレットベース（ライトテーマ）。

| 変数 | 用途 |
|------|------|
| `#f6f8fa` | アプリ背景 |
| `#d0d7de` | ボーダー |
| `#0969da` | 主要アクション（blue） |
| `#8250df` | Source Alchemy アクセント（violet） |
| `#1f883d` | 成功・Flash（emerald） |

---

> MORA.exe は「どんな音楽にするか」ではなく「どんな世界観か」を起点に制作するための道具だ。
