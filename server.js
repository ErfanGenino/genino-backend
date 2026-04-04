// server.js — Genino Backend Entry

const dotenv = require("dotenv");
dotenv.config({ override: true });

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("./middleware/authMiddleware");
const inspirationRoutes = require("./routes/inspiration");


const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 80;


app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});



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

// --- Reminders Routes ---
const remindersRoutes = require("./routes/reminders");
app.use("/api/reminders", remindersRoutes(prisma));

// --- myCycleRoutes ---
const myCycleRoutes = require("./routes/myCycle");
app.use("/api/my-cycle", myCycleRoutes(prisma));

// --- Women Health Routes ---
const womenHealthRoutes = require("./routes/womenHealth");
app.use("/api/women-health", womenHealthRoutes(prisma));

// --- Medical Records Routes ---
const medicalRecordsRoutes = require("./routes/medicalRecords");
app.use("/api/medical-records", medicalRecordsRoutes(prisma));

const chatRoutes = require("./routes/chat");
app.use("/api/chat", chatRoutes(prisma));

const usersRoutes = require("./routes/users");
app.use("/api/users", usersRoutes(prisma));


// --- Uploads Routes ---
const uploadsRoutes = require("./routes/uploads");
app.use("/api/uploads", uploadsRoutes());

// ✅ Inspiration Routes (قبل از listen)
app.use("/api/inspiration", inspirationRoutes(prisma));

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


