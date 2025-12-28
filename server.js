// server.js — Genino Backend Entry

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("./middleware/authMiddleware");

dotenv.config({ path: "prisma/.env" });

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 80;

// --- CORS ---
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://genino-web.vercel.app",   // ← دامنه واقعی فرانت تو
    "https://genino.vercel.app",       // ← اگر این یکی را هم داری
    "https://genino.ir",
    "https://www.genino.ir",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


// Body parser
app.use(express.json());

// --- Health Check ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Genino backend is alive ✨",
  });
});

// --- Auth Routes ---
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes(prisma));
const childrenRoutes = require("./routes/children");
app.use("/api/children", childrenRoutes(prisma));

// --- Protected Test Route ---
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    message: "این مسیر فقط با JWT قابل دسترسی است.",
    user: req.user,
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Genino backend running on port ${PORT}`);
});
