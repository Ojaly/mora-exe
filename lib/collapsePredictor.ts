import { CollapseRisk, MoraLine } from "@/types";

function enRatio(text: string): number {
  const clean = text.replace(/\s/g, "");
  if (!clean) return 0;
  return (clean.match(/[a-zA-Z]/g) ?? []).length / clean.length;
}

function hasJp(text: string): boolean {
  return /[぀-ヿ一-鿿]/.test(text);
}

function hasEn(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

function isContentLine(text: string): boolean {
  return !!text.trim() && !/^\[.*\]$/.test(text.trim());
}

// 英語比率急増
function detectEnSpike(lines: string[]): CollapseRisk[] {
  const risks: CollapseRisk[] = [];
  const content = lines
    .map((t, i) => ({ t: t.trim(), i }))
    .filter((l) => isContentLine(l.t));

  for (let k = 1; k < content.length; k++) {
    const prev = enRatio(content[k - 1].t);
    const curr = enRatio(content[k].t);
    const jump = curr - prev;
    if (jump >= 0.4) {
      risks.push({
        id: `en-spike-${k}`,
        type: "english-spike",
        severity: jump >= 0.6 ? "high" : "medium",
        lineNumbers: [content[k - 1].i + 1, content[k].i + 1],
        description: `英語比率急増 ${Math.round(prev * 100)}% → ${Math.round(curr * 100)}%`,
        suggestion:
          "英語切替は段階的に。前後の行で日英を混在させてスムーズに移行してください",
      });
    }
  }
  return risks;
}

// 子音クラスター
function detectConsonantClusters(lines: string[]): CollapseRisk[] {
  const risks: CollapseRisk[] = [];
  const VOWEL = /[aeiouAEIOU]/;

  lines.forEach((line, i) => {
    if (!isContentLine(line)) return;
    const words = line.match(/[a-zA-Z]+/g) ?? [];
    let maxCluster = 0;

    for (const word of words) {
      let run = 0;
      for (const ch of word) {
        if (!VOWEL.test(ch)) {
          run++;
          if (run > maxCluster) maxCluster = run;
        } else {
          run = 0;
        }
      }
    }

    if (maxCluster >= 3) {
      risks.push({
        id: `consonant-${i}`,
        type: "consonant-cluster",
        severity: maxCluster >= 4 ? "high" : "medium",
        lineNumbers: [i + 1],
        description: `子音クラスター（最大 ${maxCluster} 連続）`,
        suggestion:
          "密集した子音列はSunoが省略・歪める場合があります。発音しやすい別の単語に置換してください",
      });
    }
  });
  return risks;
}

// 長音連続
function detectLongVowelChains(lines: string[]): CollapseRisk[] {
  const risks: CollapseRisk[] = [];

  lines.forEach((line, i) => {
    if (!isContentLine(line)) return;
    const longVowels = (line.match(/ー/g) ?? []).length;
    const sokuon = (line.match(/[っッ]/g) ?? []).length;

    if (longVowels >= 3) {
      risks.push({
        id: `longvowel-${i}`,
        type: "long-vowel-chain",
        severity: longVowels >= 4 ? "high" : "medium",
        lineNumbers: [i + 1],
        description: `長音連続 ー×${longVowels}`,
        suggestion:
          "長音が連続するとSunoが音程をだらだら伸ばします。異なる語彙に置き換えてください",
      });
    }
    if (sokuon >= 3) {
      risks.push({
        id: `sokuon-${i}`,
        type: "consonant-cluster",
        severity: "medium",
        lineNumbers: [i + 1],
        description: `促音連続 っ/ッ×${sokuon}`,
        suggestion: "促音が多いとリズムが不規則になりやすいです",
      });
    }
  });
  return risks;
}

// 言語急切替
function detectLangSwitch(lines: string[]): CollapseRisk[] {
  const risks: CollapseRisk[] = [];

  type Lang = "jp" | "en" | "mixed" | "none";
  const classify = (t: string): Lang => {
    if (!isContentLine(t)) return "none";
    const jp = hasJp(t);
    const en = hasEn(t);
    if (jp && !en) return "jp";
    if (en && !jp) return "en";
    if (jp && en) return "mixed";
    return "none";
  };

  const content = lines
    .map((t, i) => ({ t: t.trim(), i, lang: classify(t.trim()) }))
    .filter((l) => l.lang !== "none");

  for (let k = 1; k < content.length; k++) {
    const p = content[k - 1];
    const c = content[k];
    if (
      (p.lang === "jp" && c.lang === "en") ||
      (p.lang === "en" && c.lang === "jp")
    ) {
      risks.push({
        id: `langswitch-${k}`,
        type: "lang-switch",
        severity: "medium",
        lineNumbers: [p.i + 1, c.i + 1],
        description: `言語急切替 ${p.lang.toUpperCase()} → ${c.lang.toUpperCase()}`,
        suggestion:
          "日英の急切替でSunoの発音モデルが混乱します。1行の中で混在させるか接続フレーズを挟んでください",
      });
    }
  }
  return risks;
}

// モーラ過密・不足（MoraLine から）
function fromMoraLines(moraLines: MoraLine[]): CollapseRisk[] {
  const risks: CollapseRisk[] = [];
  for (const l of moraLines) {
    if (l.warning === "空行" || l.warning === "メタタグ行") continue;
    if (l.danger === "long") {
      risks.push({
        id: `mora-long-${l.lineNumber}`,
        type: "mora-overload",
        severity: l.moraCount >= 20 ? "high" : "medium",
        lineNumbers: [l.lineNumber],
        description: `モーラ過密 ${l.moraCount}モーラ`,
        suggestion:
          "1行を2行に分割するか、不要な語を削除してください",
      });
    } else if (l.danger === "short") {
      risks.push({
        id: `mora-short-${l.lineNumber}`,
        type: "too-short",
        severity: "low",
        lineNumbers: [l.lineNumber],
        description: `モーラ不足 ${l.moraCount}モーラ`,
        suggestion:
          "メリスマ・引き伸ばしが発生します。前後の行と統合を検討してください",
      });
    }
  }
  return risks;
}

export function predictCollapse(
  lyrics: string,
  moraLines: MoraLine[]
): CollapseRisk[] {
  const lines = lyrics.split("\n");
  const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

  const all = [
    ...detectEnSpike(lines),
    ...detectConsonantClusters(lines),
    ...detectLongVowelChains(lines),
    ...detectLangSwitch(lines),
    ...fromMoraLines(moraLines),
  ];

  // 同一行・同一タイプの重複を除去
  const seen = new Set<string>();
  return all
    .filter((r) => {
      const key = `${r.type}-${r.lineNumbers.join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
