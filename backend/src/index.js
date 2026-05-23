import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./lib/config.js";

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Express server is running" });
});

// Explicit health endpoint used by preview orchestrator
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// API routes will be added here by the agent
// Example: app.use("/api/users", usersRouter);

// API keys configuration endpoint (for health/verification)
app.get("/api/config/status", (req, res) => {
  res.json({
    status: "ok",
    services: {
      gemini: !!config.geminiApiKey,
      groq: !!config.groqApiKey,
      github: !!config.githubToken,
    },
  });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
