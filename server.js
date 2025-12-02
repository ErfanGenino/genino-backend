// server.js — Genino Backend Entry

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

// env را از prisma/.env لود می‌کنیم
dotenv.config({ path: "prisma/.env" });

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;

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

// استارت سرور
app.listen(PORT, () => {
  console.log(`🚀 Genino backend running on port ${PORT}`);
});
