# Genre / Style 永続化 検収チェックリスト

対象機能: `genreLock` / `subStyles` の localStorage 永続化  
実装コミット: `d83c82b feat: persist genre style settings`

---

## 1. 初期状態確認

> localStorage が空（または初回アクセス）の状態で確認する。

- [ ] `mora-genre-lock` キーが存在しない場合、Genre Lock は未選択で表示される
- [ ] `mora-sub-styles` キーが存在しない場合、Sub Style チップはすべてOFF
- [ ] GENRE / STYLE 見出しに余計なバッジ・カウンタが表示されない

---

## 2. genreLock 永続化確認

- [ ] Sidebar の Genre Lock セクションで **Jazz**（または任意のジャンル）を選択する
- [ ] ページをリロードする
- [ ] 選択した genreLock が復元され、同じラジオボタンが選択済みになっている
- [ ] 見出しバッジ（例: `JAZZ` タグ）もリロード後に表示される

**確認ジャンル例:** Jazz / Rock-Metal / Hip-Hop / Classical

---

## 3. subStyles 永続化確認

- [ ] Sub Style セクションで **bedroom**、**lo-fi**、**analog** など複数チップを選択する
- [ ] ページをリロードする
- [ ] 同じチップが選択状態（ハイライト）で復元される
- [ ] 見出しの `+2 style` などのカウント表示もリロード後に復元される

---

## 4. genreLock と subStyles の同時復元

- [ ] `genreLock = Jazz` に設定する
- [ ] `subStyles = ["bedroom", "lo-fi"]` に設定する
- [ ] ページをリロードする
- [ ] Jazz + bedroom + lo-fi が両方復元される
- [ ] そのまま Generate を実行し、Style Prompt に Jazz / bedroom / lo-fi が反映されることを確認する

---

## 5. 解除状態の永続化

- [ ] Genre Lock の **✕ クリア** ボタンを押す
- [ ] Sub Style チップをすべてOFFにする
- [ ] ページをリロードする
- [ ] Genre Lock が未選択のまま復元される
- [ ] Sub Style チップがすべてOFFのまま復元される

---

## 6. SAMPLE ボタン確認

- [ ] `genreLock` / `subStyles` を選択した状態で **SAMPLE** ボタンを押す
- [ ] SAMPLE 押下後も `genreLock` / `subStyles` の値が変わっていないことを確認する
- [ ] ページをリロードし、SAMPLE 前と同じ `genreLock` / `subStyles` が復元される

> SAMPLE ボタンは `style` / `neg` / `lyrics` のみ変更し、`genreLock` / `subStyles` には触れない設計。

---

## 7. localStorage キー確認

DevTools → Application → Local Storage → `http://localhost:3000` で以下を確認する。

| キー | 型 | 例 |
|------|----|----|
| `mora-genre-lock` | string | `"jazz"` / `""` |
| `mora-sub-styles` | JSON string[] | `["bedroom","lo-fi"]` / `[]` |

- [ ] `mora-genre-lock` が選択内容に応じて即座に更新される
- [ ] `mora-sub-styles` が JSON 配列形式で保存されている
- [ ] クリア・全解除後はそれぞれ `""` / `[]` に更新される

---

## 8. 壊れた localStorage への耐性

以下は実装上の仕様確認であり、DevTools Console から手動で再現できる。

```js
// mora-sub-styles に壊れた値を書き込む
localStorage.setItem("mora-sub-styles", "NOT_JSON");
// → リロードしてもクラッシュせず [] にフォールバックする

localStorage.setItem("mora-sub-styles", JSON.stringify([1, true, "ok"]));
// → リロード後 subStyles = ["ok"] のみ（string 以外は除外される）

localStorage.setItem("mora-sub-styles", JSON.stringify("string_not_array"));
// → リロード後 subStyles = []（配列でない場合は [] にフォールバック）
```

- [ ] 壊れた JSON でもアプリがクラッシュしない
- [ ] 配列でない値は `[]` にフォールバックされる
- [ ] `string` 以外の要素は除外される

---

## 9. 既知制限

- `SongInput` 全体は localStorage に保存していない
  - `title` / `theme` / `lyrics` / `genre` / `bpm` などはリロードで消える
  - これは意図的な仕様（セッション単位の揮発）
- `genreLock` / `subStyles` のみ「制作環境設定」として保持する
- `subStyles` の有効値リストによる厳密フィルタ（存在しない値の排除）は現時点で未実装
  - 将来 subStyles 選択肢を変更した場合、旧キーが残る可能性がある

---

## 10. コード根拠

| ファイル | 役割 |
|----------|------|
| [`app/page.tsx`](../app/page.tsx) | mount useEffect で読み込み、write useEffect で保存 |
| [`components/Sidebar.tsx`](../components/Sidebar.tsx) | Genre Lock / Sub Style の UI・クリアボタン |
| [`lib/promptBuilder.ts`](../lib/promptBuilder.ts) | genreLock / subStyles を Style Prompt へ反映 |

### 実装箇所（app/page.tsx）

**読み込み（マウント時）:**
```ts
const storedGenreLock = localStorage.getItem("mora-genre-lock");
const restoredGenreLock = typeof storedGenreLock === "string" ? storedGenreLock : "";

let restoredSubStyles: string[] = [];
try {
  const parsed = JSON.parse(localStorage.getItem("mora-sub-styles") ?? "[]");
  if (Array.isArray(parsed)) {
    restoredSubStyles = parsed.filter((v): v is string => typeof v === "string");
  }
} catch { /* ignore corrupt data */ }
```

**書き込み（値変化のたびに、mounted 後のみ）:**
```ts
useEffect(() => { if (mounted) localStorage.setItem("mora-genre-lock", input.genreLock ?? ""); }, [input.genreLock, mounted]);
useEffect(() => { if (mounted) localStorage.setItem("mora-sub-styles", JSON.stringify(input.subStyles ?? [])); }, [input.subStyles, mounted]);
```
