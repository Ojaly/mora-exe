import { SongInput, MoraLine, PhraseMatch } from "@/types";

/** AI プロバイダーへの共通入力 */
export interface AIAnalysisInput {
  songInput: SongInput;
  stylePrompt: string;
  moraLines: MoraLine[];
  phraseMatches: PhraseMatch[];
}

/** AI プロバイダーからの共通出力 */
export interface AIAnalysisOutput {
  suggestions: string[];   // 改善提案の箇条書き
  rewrittenLines?: { original: string; rewritten: string }[]; // 歌詞書き換え案（任意）
}

/** 全AIプロバイダーが実装すべきインターフェース */
export interface AIProvider {
  readonly name: string;
  readonly displayName: string;
  analyze(input: AIAnalysisInput): Promise<AIAnalysisOutput>;
}

/** 利用可能なプロバイダー識別子 */
export type AIProviderKey = "claude" | "openai" | "gemini";

/**
 * プロバイダーレジストリ
 * providers/ 配下の実装を登録する。現時点では空。
 * 追加例: registry.set("claude", new ClaudeProvider(apiKey))
 */
export const providerRegistry = new Map<AIProviderKey, AIProvider>();

/** 登録済みプロバイダーを取得。未登録なら null */
export function getProvider(key: AIProviderKey): AIProvider | null {
  return providerRegistry.get(key) ?? null;
}

/** 利用可能なプロバイダーが1つでもあるか */
export function hasAnyProvider(): boolean {
  return providerRegistry.size > 0;
}
