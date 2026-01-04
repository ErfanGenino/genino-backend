// server.js — Genino Backend Entry
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
const allowedOrigins = [
  "http://localhost:5173",
  "https://genino-web.vercel.app",
  "https://genino.vercel.app",
  "https://genino.ir",
  "https://www.genino.ir",
];

// اگر Origin خالی بود (مثلاً بعضی تست‌ها/سرورها) اجازه بده
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ✅ پاسخ به preflight های OPTIONS (خیلی مهم برای POST/PUT/DELETE)
app.options("*", cors());

// Body parser
app.use(express.json());

// --- Health Check ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Genino backend is alive ✨",
  });
});

// --- API TEST ---
// ✅ هم با مرورگر (GET) تست میشه هم با fetch/postman (POST)
app.get("/api/test", (req, res) => {
  res.json({ ok: true, method: "GET", message: "API TEST OK" });
});

app.post("/api/test", (req, res) => {
  res.json({ ok: true, method: "POST", message: "API TEST OK" });
});

// --- Auth Routes ---
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes(prisma));

// --- Children Routes ---
const childrenRoutes = require("./routes/children");
app.use("/api/children", childrenRoutes(prisma));

// --- Invitations Routes ---
const invitationsRoutes = require("./routes/invitations");
app.use("/api/invitations", invitationsRoutes(prisma));


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

