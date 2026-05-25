# MORA.exe — Suno Prompt Engineer

Suno AI向けの楽曲プロンプト作成支援ツール。日本語歌詞のモーラ数・音節密度を分析し、スタイル指定文と改善案を生成する。

## 起動方法

```bash
cd mora-exe
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## 機能

- **Suno Style Prompt生成** — ジャンル・BPM・雰囲気・ボーカルタイプから英語のStyleタグを自動生成
- **歌詞モーラ分析** — 1行ごとにモーラ数を推定し、危険度（短すぎ/安全/長すぎ）を表示
- **AI臭いフレーズ検出** — "lose control" "feel alive" などの定番フレーズを検出し代替案を提示
- **改善メモ** — 入力設定に基づいた改善アドバイスを自動生成
- **コピーボタン** — Style Promptをワンクリックでクリップボードにコピー

## モーラ危険度ルール

| モーラ数 | 判定 | リスク |
|---------|------|--------|
| 0〜3 | 短 | メリスマ化・引き伸ばしが発生しやすい |
| 4〜14 | OK | 安定範囲 |
| 15以上 | 長 | Sunoが小節を伸ばす・詰め込む可能性あり |

## ファイル構成

```
mora-exe/
├── app/
│   ├── globals.css       # ダーク/ネオンテーマ
│   ├── layout.tsx        # レイアウト
│   └── page.tsx          # メインページ（クライアント）
├── components/
│   ├── InputForm.tsx     # 入力フォーム
│   ├── StylePrompt.tsx   # Style Prompt表示＋コピー
│   ├── MoraTable.tsx     # モーラ分析テーブル
│   ├── PhraseWarnings.tsx # AIフレーズ検出
│   └── ImprovementMemo.tsx # 改善メモ
├── lib/
│   ├── mora.ts           # モーラカウントロジック
│   ├── phrases.ts        # AIフレーズ定義・検出
│   └── style.ts          # Style Prompt生成
└── types/
    └── index.ts          # 型定義
```

## 技術構成

- Next.js (App Router) + TypeScript
- Tailwind CSS
- ルールベース（外部AI API不使用）
