const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqAnalysisResult {
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
}

const SYSTEM_PROMPT = `You are Prettiflow Analyzer, an expert software architect and project estimator.
Given an app idea or GitHub repo context, produce a structured JSON analysis.

Return ONLY valid JSON with this exact shape (no markdown, no extra text):
{
  "appName": "short catchy name",
  "appSummary": "2-3 sentence description",
  "overallComplexity": 5,
  "complexityLabel": "Simple",
  "dimensions": [
    {"name": "Frontend UI", "score": 6, "description": "..."},
    {"name": "Backend/API", "score": 4, "description": "..."},
    {"name": "Database", "score": 3, "description": "..."},
    {"name": "Authentication", "score": 5, "description": "..."},
    {"name": "Integrations", "score": 7, "description": "..."},
    {"name": "DevOps/Infra", "score": 2, "description": "..."}
  ],
  "prettiflowHandlesList": ["item1", "item2"],
  "manualWorkList": ["item1", "item2"],
  "timeEstimate": "2-3 weeks",
  "verdict": "paragraph explaining the overall assessment",
  "topInsight": "single most important insight",
  "mermaidDiagram": "graph TD\\n  A[Frontend] --> B[API]\\n  B --> C[Database]"
}

Rules:
- overallComplexity must be 1-10
- complexityLabel must be one of: "Simple", "Moderate", "Complex", "Enterprise-Grade"
- dimensions must have exactly 6 items with scores 1-10
- prettiflowHandlesList: things Prettiflow (AI codegen) can handle automatically
- manualWorkList: things requiring human expertise/manual work
- mermaidDiagram: valid mermaid flowchart syntax using \\n for newlines
- Return ONLY the JSON object, nothing else.`;

export async function analyzeWithGroq(input: string): Promise<GroqAnalysisResult> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this app idea / project:\n\n${input}` },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Groq API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? "";

  // Extract JSON from possible markdown code blocks
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as GroqAnalysisResult;
  return parsed;
}
