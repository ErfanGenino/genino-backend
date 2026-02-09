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
// --- CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://genino-web.vercel.app",
  "https://genino.vercel.app",
  "https://genino.ir",
  "https://www.genino.ir",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // برای دیباگ
    console.log("CORS ORIGIN:", origin);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // رد کن ولی Error نده تا قاطی نکنه
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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

// --- FamilyTree Routes ---
const familyTreeRoutes = require("./routes/familyTree");
app.use("/api/family-tree", familyTreeRoutes(prisma));


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

