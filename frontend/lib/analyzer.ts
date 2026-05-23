import { analyzeWithGemini, type GeminiAnalysisResult } from "./gemini";
import { analyzeWithGroq, type GroqAnalysisResult } from "./groq-analyzer";

export type AnalysisResult = {
  appName: string;
  appSummary: string;
  overallComplexity: number;
  complexityLabel: string;
  dimensions: Array<{ name: string; score: number; description: string }>;
  prettiflowHandlesList: string[];
  manualWorkList: string[];
  timeEstimate: string;
  verdict: string;
  topInsight: string;
  mermaidDiagram: string;
};

export async function analyze(input: string): Promise<{ result: AnalysisResult; provider: string }> {
  // Try Gemini first
  try {
    const geminiResult = await analyzeWithGemini(input);
    return { result: geminiResult, provider: "gemini" };
  } catch (geminiError) {
    console.error("Gemini analysis failed, falling back to Groq:", geminiError);
  }

  // Fallback to Groq
  try {
    const groqResult = await analyzeWithGroq(input);
    return { result: groqResult, provider: "groq" };
  } catch (groqError) {
    console.error("Groq analysis failed:", groqError);
    throw new Error("All AI providers failed. Please try again later.");
  }
}
