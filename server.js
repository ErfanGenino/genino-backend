// server.js — Genino Backend Entry

try {
  require("dotenv").config();
} catch (err) {
  console.log("dotenv not found, using runtime environment variables.");
}

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("./middleware/authMiddleware");
const inspirationRoutes = require("./routes/inspiration");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { deactivateInactiveChatRooms, deleteExpiredRoomMessages } = require("./controllers/chatRoomController");
const { deleteExpiredPrivateMessages } = require("./controllers/chatController");
const {
  createRelationshipCareReminders,
} = require("./jobs/relationshipCareReminderJob");
const {
  createLifeEventReminders,
} = require("./jobs/lifeEventReminderJob");


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

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true);
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

// --- Notifications Routes ---
const notificationsRoutes = require("./routes/notifications");
app.use("/api/notifications", notificationsRoutes(prisma));

// --- FamilyTree Routes ---
const familyTreeRoutes = require("./routes/familyTree");
app.use("/api/family-tree", familyTreeRoutes(prisma));

// --- Child Follow Requests Routes ---
const childFollowRequestsRoutes = require("./routes/childFollowRequests");
app.use("/api/child-follow-requests", childFollowRequestsRoutes(prisma));

// --- Reminders Routes ---
const remindersRoutes = require("./routes/reminders");
app.use("/api/reminders", remindersRoutes(prisma));

// --- myCycleRoutes ---
const myCycleRoutes = require("./routes/myCycle");
app.use("/api/my-cycle", myCycleRoutes(prisma));

// --- Women Health Routes ---
const womenHealthRoutes = require("./routes/womenHealth");
app.use("/api/women-health", womenHealthRoutes(prisma));

// --- Men Health Routes ---
const menHealthRoutes = require("./routes/menHealth");
app.use("/api/men-health", menHealthRoutes(prisma));

// --- Calorie Tracker Routes ---
const calorieTrackerRoutes = require("./routes/calorieTracker");
app.use("/api/calorie-tracker", calorieTrackerRoutes(prisma));

// --- Medical Records Routes ---
const medicalRecordsRoutes = require("./routes/medicalRecords");
app.use("/api/medical-records", medicalRecordsRoutes(prisma));

const chatRoutes = require("./routes/chat");
app.use("/api/chat", chatRoutes(prisma));

const usersRoutes = require("./routes/users");
app.use("/api/users", usersRoutes(prisma));

const chatRoomsRoutes = require("./routes/chatRooms");
app.use("/api/chat-rooms", chatRoomsRoutes(prisma));

// --- Memory Albums Routes ---
const memoryAlbumsRoutes = require("./routes/memoryAlbums");
app.use("/api/memory-albums", memoryAlbumsRoutes(prisma));

const articlesRoutes = require("./routes/articles");
app.use("/api/articles", articlesRoutes(prisma));

const lifeCompanionRoutes = require("./routes/lifeCompanion");
app.use("/api/life-companion", lifeCompanionRoutes(prisma));

const relationshipAssessmentsRoutes = require("./routes/relationshipAssessments");
app.use("/api/relationship-assessments", relationshipAssessmentsRoutes(prisma));


// --- Uploads Routes ---
const uploadsRoutes = require("./routes/uploads");
app.use("/api/uploads", uploadsRoutes());

// ✅ Inspiration Routes (قبل از listen)
app.use("/api/inspiration", inspirationRoutes(prisma));

const childAchievementsRoutes = require("./routes/childAchievements");
app.use("/api/child-achievements", childAchievementsRoutes(prisma));

// --- Protected Test Route ---
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    message: "این مسیر فقط با JWT قابل دسترسی است.",
    user: req.user,
  });
});

// --- Start Server ---
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// --- Auto deactivate inactive chat rooms ---
const runInactiveChatRoomsCleanup = async () => {
  console.log("⏳ Checking inactive chat rooms...");

  const result = await deactivateInactiveChatRooms(prisma);

  if (result?.ok) {
    console.log(`🧹 Inactive rooms cleaned: ${result.count || 0}`);
  } else {
    console.log("❌ Failed to clean inactive rooms");
  }
};

// --- Auto delete expired room messages ---
const runExpiredRoomMessagesCleanup = async () => {
  console.log("⏳ Checking expired room messages...");

  const result = await deleteExpiredRoomMessages(prisma);

  if (result?.ok) {
    console.log(`🧹 Expired room messages deleted: ${result.count || 0}`);
  } else {
    console.log("❌ Failed to delete expired room messages");
  }
};

// --- Auto delete expired private messages ---
const runExpiredPrivateMessagesCleanup = async () => {
  console.log("⏳ Checking expired private messages...");

  const result = await deleteExpiredPrivateMessages(prisma);

  if (result?.ok) {
    console.log(`🧹 Expired private messages deleted: ${result.count || 0}`);
  } else {
    console.log("❌ Failed to delete expired private messages");
  }
};

runInactiveChatRoomsCleanup();
runExpiredRoomMessagesCleanup();
runExpiredPrivateMessagesCleanup();
createRelationshipCareReminders(prisma);
setInterval(() => {
  createRelationshipCareReminders(prisma);
}, 24 * 60 * 60 * 1000); // هر 24 ساعت

createLifeEventReminders(prisma);

setInterval(() => {
  createLifeEventReminders(prisma);
}, 60 * 1000);

setInterval(runInactiveChatRoomsCleanup, 6 * 60 * 60 * 1000); // هر 6 ساعت
setInterval(runExpiredRoomMessagesCleanup, 6 * 60 * 60 * 1000); // هر 6 ساعت
setInterval(runExpiredPrivateMessagesCleanup, 6 * 60 * 60 * 1000); // هر 6 ساعت

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join_room", ({ roomId, userId }) => {
  const roomKey = `chat-room-${roomId}`;

  socket.data.roomId = roomId;
  socket.data.userId = userId;
  socket.data.roomKey = roomKey;

  socket.join(roomKey);

  console.log("📥 join_room:", {
    socketId: socket.id,
    roomId,
    userId,
    roomKey,
  });

  io.emit("room_presence_updated", {
    roomId,
    userId,
    message: "user joined room",
  });
});

socket.on("send_room_message", ({ roomId, message }) => {
  const roomKey = `chat-room-${roomId}`;

  socket.to(roomKey).emit("receive_room_message", {
  message,
});
});

socket.on("delete_room_message", ({ roomId, messageId }) => {
  const roomKey = `chat-room-${roomId}`;

  socket.to(roomKey).emit("room_message_deleted", {
    roomId,
    messageId,
  });
});

socket.on("react_room_message", ({ roomId, messageId, reactions }) => {
  const roomKey = `chat-room-${roomId}`;

  socket.to(roomKey).emit("room_message_reacted", {
    roomId,
    messageId,
    reactions,
  });
});

socket.on("typing_room", ({ roomId, userId, name }) => {
  const roomKey = `chat-room-${roomId}`;

  socket.to(roomKey).emit("room_user_typing", {
    roomId,
    userId,
    name,
  });
});


socket.on("disconnect", async () => {
  console.log("🔴 Socket disconnected:", socket.id);

  if (socket.data?.roomId && socket.data?.userId) {
    try {
      await prisma.chatRoomPresence.deleteMany({
        where: {
          roomId: Number(socket.data.roomId),
          userId: Number(socket.data.userId),
        },
      });
    } catch (err) {
      console.error("SOCKET PRESENCE DELETE ERROR:", err);
    }
  }

  if (socket.data?.roomKey && socket.data?.roomId) {
    io.emit("room_presence_updated", {
      roomId: socket.data.roomId,
      userId: socket.data.userId || null,
      message: "user left room",
    });
  }
});
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Genino backend running on port ${PORT}`);
});




