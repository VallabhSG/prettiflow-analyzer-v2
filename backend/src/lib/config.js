import "dotenv/config";

export const config = {
  port: process.env.PORT || 8000,
  databaseUrl: process.env.DATABASE_URL || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  groqApiKey: process.env.GROQ_API_KEY || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
};
