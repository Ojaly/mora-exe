/**
 * Gemini (Google) プロバイダー
 *
 * 実装手順:
 * 1. npm install @google/generative-ai
 * 2. NEXT_PUBLIC_GEMINI_API_KEY または GEMINI_API_KEY を .env.local に設定
 * 3. このファイルで AIProvider を実装し、app/page.tsx で登録する
 *
 * 参考: https://ai.google.dev/gemini-api/docs
 *
 * 実装スケルトン:
 *
 * import { GoogleGenerativeAI } from "@google/generative-ai";
 * import { AIProvider, AIAnalysisInput, AIAnalysisOutput } from "@/lib/aiProvider";
 *
 * export class GeminiProvider implements AIProvider {
 *   readonly name = "gemini";
 *   readonly displayName = "Gemini 2.0 Flash (Google)";
 *   private genAI: GoogleGenerativeAI;
 *
 *   constructor(apiKey: string) {
 *     this.genAI = new GoogleGenerativeAI(apiKey);
 *   }
 *
 *   async analyze(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
 *     const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
 *     const result = await model.generateContent(buildPrompt(input));
 *     return parseResponse(result.response.text());
 *   }
 * }
 */

export {};
