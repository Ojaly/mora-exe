# MORA.exe — Suno Prompt Forge

> 世界観 → Suno用言語 へ変換する、楽曲制作 IDE

---

## コンセプト

MORA.exe は「分析ツール」ではない。

世界観・テーマ・感情を入力すると、Suno AIが理解できる言語（Style Prompt・Lyrics・Final Output）へ変換する **制作 IDE** だ。

VSCode と DAW と Writing Tool を掛け合わせた思想で設計されている。Mora 分析はあくまで補助機能であり、中心にあるのは「**創作支援**」。

---

## スクリーンショット

<!-- スクリーンショットをここに挿入 -->
<!-- ![MORA.exe UI](docs/screenshot.png) -->

---

## 主機能

### Style Prompt Builder
ジャンル・BPM・Key・Mood・Vocal・Texture・Structure・Mix Aesthetic を組み合わせ、Suno が解釈しやすい英語の Style Prompt を自動生成する。Negative Prompt も同時に出力。

### Lyrics Builder
テーマ・世界観プリセット・JP/MIX/EN 比率をもとに歌詞を生成・編集する。セクション構造（Verse / Pre-Chorus / Chorus / Bridge / Outro）をサポート。

### Mora Tuner
歌詞の各行をモーラ単位で分析し、Suno がメリスマ化・詰め込みを起こしやすい行を警告する。リスクレベルは 3 段階。

| モーラ数 | 判定 | リスク |
|---------|------|--------|
| 0〜3    | 短   | メリスマ化・引き伸ばしが発生しやすい |
| 4〜14   | OK   | 安定範囲 |
| 15以上  | 長   | Sunoが小節を伸ばす・詰め込む可能性あり |

### Rewrite Modes
AI 臭いフレーズ（"lose control" / "feel alive" 等）を検出し、代替案を提示する。Suno 特有のクリシェを排除して楽曲の独自性を高める。

### Final Output
Style Prompt・Lyrics・Negative Prompt を統合した最終出力を生成。Suno の入力フォームにそのまま貼り付けられる形式で出力。ワンクリックコピー対応。

---

## UI 構成

```
┌──────────────┬──────────────────────┬──────────────────────┐
│  LEFT        │  CENTER              │  RIGHT               │
│  Concept /   │  Style Prompt        │  Lyrics              │
│  Controls    │  + Negative Prompt   │  + Mora Tuner        │
└──────────────┴──────────────────────┴──────────────────────┘
│  BOTTOM: Final Output (COPY ALL)                           │
└────────────────────────────────────────────────────────────┘
```

- **Left** — World Preset・Genre・Mood・Vocal・BPM・Key・Length・EN Ratio・Ref・Avoid・Creative Toggles
- **Center** — Style Prompt（シンタックスハイライト付き）・Sample・Negative Prompt
- **Right** — Lyrics エディタ・Mora Tuner・行ごとのリスク表示
- **Bottom** — Final Output バー・COPY ALL

---

## 使用方法

### Web 版（ブラウザ）

```bash
git clone https://github.com/Ojaly/mora-exe.git
cd mora-exe
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

### デスクトップ版（Windows .exe）

**前提条件：** [Rust](https://rustup.rs) のインストールが必要。

```bash
# 開発モード（デスクトップウィンドウで起動）
npm run tauri:dev

# リリースビルド（.exe / インストーラー生成）
npm run tauri:build
```

ビルド成果物は `src-tauri/target/release/bundle/` に出力される。

---

## Claude API 設定（任意）

APIキーを設定すると、Rewrite ボタンが Claude Sonnet による高品質な書き換えに切り替わる。未設定の場合はルールベース処理にフォールバックするため、なくても動作する。

```bash
# .env.example をコピー
cp .env.example .env.local
```

`.env.local` を開いて APIキーを設定：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
```

APIキーは [Anthropic Console](https://console.anthropic.com/) で発行。

**注意：**
- `.env.local` は Git 管理外（`.gitignore` に含まれている）
- APIキーはサーバーサイドのみで使用され、フロントエンドに露出しない
- Claude API は Web版・Tauri dev モードで動作。Tauri リリースビルド（`.exe`）では未対応（ルールベースフォールバック）

---

## 世界観プリセット

| プリセット | 説明 |
|-----------|------|
| **NEON** | Neon Waltz — 退廃的なネオン街、夜の雨、スローな華やかさ |
| **CORP** | Corporate Electro Funk — 管理社会への皮肉、スーツとビート |
| **MYTH** | Mythic Race — 神話的スピード、伝説的レース、叙事詩的グルーヴ |
| **MTWN** | Digital Motown — 現代のソウル、デジタルと温かさの融合 |
| **WALTZ** | Dark Waltz — 3拍子の優雅さと内面の崩壊 |
| **GOSP** | Electro Gospel Irony — 救済と皮肉、ゴスペルとシンセの衝突 |

---

## 開発思想

- **VSCode + DAW + Writing Tool** の三位一体
- 「分析」ではなく「**創作支援**」を中心に据える
- Mora 分析は補助機能。主役は世界観とプロンプト設計
- ルールベース生成（外部 AI API 不使用）
- ダークテーマ・ネオン UI 前提で設計。ライトモードは想定しない

---

## 今後の予定

- [ ] **Claude API 連携** — 世界観記述からの自動 Lyrics 生成
- [ ] **Rewrite Engine** — AI 臭い表現の自動書き換え提案
- [ ] **AI smell removal** — クリシェスコアリングと除去フロー
- [ ] **Mora-aware generation** — モーラ数を考慮した歌詞自動生成
- [ ] **Prompt memory** — 過去の設定・出力の保存と再利用

---

## 技術構成

- **Next.js 16 (App Router, Turbopack)** + TypeScript
- **Tailwind CSS** — ダークテーマ・ネオンカラー
- ルールベース生成（外部 AI API 不使用）

---

> MORA.exe は Suno AI への「翻訳機」であり、制作者の世界観を正確に伝えるための道具だ。
