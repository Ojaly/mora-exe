"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import StylePrompt from "@/components/StylePrompt";
import MoraTable from "@/components/MoraTable";
import PhraseWarnings from "@/components/PhraseWarnings";
import ImprovementMemo from "@/components/ImprovementMemo";
import AIPanel from "@/components/AIPanel";
import { SongInput, AnalysisResult, AIImprovement } from "@/types";
import { analyzeLyrics } from "@/lib/moraAnalyzer";
import { detectAiPhrases } from "@/lib/phraseDetector";
import { buildStylePrompt, buildImprovementMemo } from "@/lib/promptBuilder";

const defaultInput: SongInput = {
  title: "",
  genre: "jpop",
  bpm: "",
  mood: "melancholic",
  vocalType: "female",
  lyrics: "",
  startWithChorus: false,
  englishRatio: "low",
  avoidAiCliche: false,
};

export default function Home() {
  const [input, setInput] = useState<SongInput>(defaultInput);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [aiResult, setAiResult] = useState<AIImprovement | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAnalyze = () => {
    const moraLines = analyzeLyrics(input.lyrics);
    const phraseMatches = detectAiPhrases(input.lyrics);
    const stylePrompt = buildStylePrompt(input);
    const longLines = moraLines.filter((l) => l.danger === "long").length;
    const shortLines = moraLines.filter(
      (l) => l.danger === "short" && l.warning !== "空行" && l.warning !== "メタタグ行"
    ).length;
    const improvementMemo = buildImprovementMemo(input, longLines, shortLines);
    setResult({ stylePrompt, moraLines, phraseMatches, improvementMemo });
    setAiResult(null);
  };

  const handleAiGenerate = async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      // AI provider 未実装のため、現時点では呼ばれない
      // 将来: const provider = getProvider("claude"); result = await provider.analyze(...)
      await new Promise((r) => setTimeout(r, 100));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <span className="font-bold text-gray-900 tracking-tight text-lg">MORA.exe</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400 text-xs">Suno Prompt Engineer</span>
          <div className="ml-auto">
            <span className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-1">
              v0.1 — rule-based
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div
          className={`grid gap-8 ${
            result ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"
          }`}
        >
          {/* Input Panel */}
          <section>
            <h1 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Input
            </h1>
            <div className="border border-gray-200 rounded-lg p-5">
              <InputForm input={input} onChange={setInput} onAnalyze={handleAnalyze} />
            </div>
          </section>

          {/* Results Panel */}
          {result && (
            <section className="space-y-5">
              <h1 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Results{input.title && <span className="font-normal ml-2 text-gray-300">— {input.title}</span>}
              </h1>

              <div className="border border-gray-200 rounded-lg p-5">
                <StylePrompt prompt={result.stylePrompt} />
              </div>

              <div className="border border-gray-200 rounded-lg p-5">
                <MoraTable lines={result.moraLines} />
              </div>

              <div className="border border-gray-200 rounded-lg p-5">
                <PhraseWarnings matches={result.phraseMatches} />
              </div>

              {result.improvementMemo.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-5">
                  <ImprovementMemo memos={result.improvementMemo} />
                </div>
              )}

              {/* AI Panel */}
              <div className="border border-gray-200 rounded-lg p-5">
                <AIPanel
                  onGenerate={handleAiGenerate}
                  result={aiResult}
                  loading={aiLoading}
                />
              </div>
            </section>
          )}
        </div>

        {!result && (
          <p className="mt-6 text-center text-gray-400 text-xs">
            入力して「Analyze &amp; Generate」を押してください
          </p>
        )}
      </main>

      <footer className="border-t border-gray-100 mt-16 py-5 text-center">
        <p className="text-gray-300 text-xs">
          MORA.exe v0.1 — rule-based mora analysis engine
        </p>
      </footer>
    </div>
  );
}
