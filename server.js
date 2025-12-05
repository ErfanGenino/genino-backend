// server.js — Genino Backend Entry

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("./middleware/authMiddleware");

// env را از prisma/.env لود می‌کنیم
dotenv.config({ path: "prisma/.env" });

const app = express();
const prisma = new PrismaClient();

const PORT = 80;


// میدل‌ورها
app.use(cors());
app.use(express.json());

// 🔹 Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Genino backend is alive ✨",
  });
});

// 🔹 Auth Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes(prisma));

// 🔹 Protected Test Route (اینجا باید باشد ❗)
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    message: "این مسیر فقط با JWT قابل دسترسی است.",
    user: req.user,
  });
});

// استارت سرور (همیشه آخر)
app.listen(PORT, () => {
  console.log(`🚀 Genino backend running on port ${PORT}`);
});
