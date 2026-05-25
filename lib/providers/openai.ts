/**
 * OpenAI プロバイダー
 *
 * 実装手順:
 * 1. npm install openai
 * 2. NEXT_PUBLIC_OPENAI_API_KEY または OPENAI_API_KEY を .env.local に設定
 * 3. このファイルで AIProvider を実装し、app/page.tsx で登録する
 *
 * 参考: https://platform.openai.com/docs/api-reference
 *
 * 実装スケルトン:
 *
 * import OpenAI from "openai";
 * import { AIProvider, AIAnalysisInput, AIAnalysisOutput } from "@/lib/aiProvider";
 *
 * export class OpenAIProvider implements AIProvider {
 *   readonly name = "openai";
 *   readonly displayName = "GPT-4o (OpenAI)";
 *   private client: OpenAI;
 *
 *   constructor(apiKey: string) {
 *     this.client = new OpenAI({ apiKey });
 *   }
 *
 *   async analyze(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
 *     const response = await this.client.chat.completions.create({
 *       model: "gpt-4o",
 *       messages: [{ role: "user", content: buildPrompt(input) }],
 *     });
 *     return parseResponse(response.choices[0].message.content ?? "");
 *   }
 * }
 */

export {};
