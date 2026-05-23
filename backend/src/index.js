import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
