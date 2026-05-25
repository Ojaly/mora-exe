/**
 * Claude (Anthropic) プロバイダー
 *
 * 実装手順:
 * 1. npm install @anthropic-ai/sdk
 * 2. NEXT_PUBLIC_CLAUDE_API_KEY または CLAUDE_API_KEY を .env.local に設定
 * 3. このファイルで AIProvider を実装し、app/page.tsx で登録する
 *
 * 参考: https://docs.anthropic.com/ja/api/getting-started
 *
 * 実装スケルトン:
 *
 * import Anthropic from "@anthropic-ai/sdk";
 * import { AIProvider, AIAnalysisInput, AIAnalysisOutput } from "@/lib/aiProvider";
 *
 * export class ClaudeProvider implements AIProvider {
 *   readonly name = "claude";
 *   readonly displayName = "Claude (Anthropic)";
 *   private client: Anthropic;
 *
 *   constructor(apiKey: string) {
 *     this.client = new Anthropic({ apiKey });
 *   }
 *
 *   async analyze(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
 *     const prompt = buildPrompt(input);
 *     const response = await this.client.messages.create({
 *       model: "claude-opus-4-7",
 *       max_tokens: 1024,
 *       messages: [{ role: "user", content: prompt }],
 *     });
 *     return parseResponse(response.content[0].text);
 *   }
 * }
 */

export {};
