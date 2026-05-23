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

const SYSTEM_PROMPT = `You are Prettiflow Analyzer, an expert software architect who evaluates apps against Prettiflow's AI code generation capabilities.

Prettiflow's stack generates: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Radix UI components, React Hook Form + Zod validation, Recharts for data viz, Express.js backend, Drizzle ORM, Neon Postgres, Vercel deployment, JWT/session auth, REST APIs, file uploads (S3-compatible), email (Resend), Stripe payments, and CRUD operations.

Prettiflow handles well: standard CRUD UIs, dashboards, auth flows, form-heavy apps, landing pages, admin panels, simple APIs, basic e-commerce, content management.

Prettiflow needs manual work for: real-time features (WebSockets), complex AI/ML pipelines, custom hardware integrations, regulatory compliance (HIPAA, PCI-DSS), custom mobile apps, complex algorithmic logic, multi-tenant SaaS infrastructure, blockchain/Web3, advanced caching systems, microservices.

Given an app description or GitHub repo, return ONLY valid JSON:
{
  "appName": "short memorable name",
  "appSummary": "2-3 sentences describing the app's purpose and scale",
  "overallComplexity": 5,
  "complexityLabel": "Moderate",
  "dimensions": [
    {"name": "Frontend UI", "score": 6, "description": "specific assessment for this app"},
    {"name": "Backend & APIs", "score": 4, "description": "..."},
    {"name": "Database & Data Modeling", "score": 3, "description": "..."},
    {"name": "Auth & Security", "score": 5, "description": "..."},
    {"name": "Third-party Integrations", "score": 7, "description": "..."},
    {"name": "Infrastructure & DevOps", "score": 2, "description": "..."}
  ],
  "prettiflowHandlesList": ["specific feature Prettiflow generates", "another feature"],
  "manualWorkList": ["specific thing needing custom code", "another manual piece"],
  "timeEstimate": "2-4 weeks with Prettiflow",
  "verdict": "2-3 paragraph verdict explaining complexity rating and what makes this app hard or easy",
  "topInsight": "the single most important thing to know about building this app with Prettiflow",
  "mermaidDiagram": "graph TD\\n  A[Next.js Frontend] --> B[Express API]\\n  B --> C[Neon Postgres]\\n  B --> D[External APIs]"
}

Rules:
- overallComplexity: 1-10 (1=simple CRUD, 10=Google-scale enterprise)
- complexityLabel: "Simple" (1-3), "Moderate" (4-5), "Complex" (6-8), "Enterprise-Grade" (9-10)
- dimensions: exactly 6 items with unique names, scores 1-10
- prettiflowHandlesList: 4-8 specific items, be concrete
- manualWorkList: 2-6 items, only things truly outside Prettiflow's scope
- mermaidDiagram: valid flowchart, use \\n for newlines inside the JSON string
- Return ONLY the JSON object, no markdown, no extra text`;

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
