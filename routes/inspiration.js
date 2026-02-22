// routes/inspiration.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

// --- helpers ---
function ymd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// deterministic pick: same user+date+mode => same item
function stablePickIndex(seedStr, len) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return len ? h % len : 0;
}

const ALLOWED_MODES = new Set(["calm", "focus", "energy", "relation", "discipline"]);

module.exports = function inspirationRoutes(prisma) {
  const router = express.Router();

  // ✅ GET /api/inspiration/today?mode=calm
  router.get("/today", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.query.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const dateKey = ymd(new Date());

      // 1) items for mode
      const items = await prisma.inspirationItem.findMany({
        where: { mode, isActive: true },
        orderBy: { id: "asc" },
        select: {
          id: true,
          mode: true,
          quote: true,
          author: true,
          exerciseTitle: true,
          exerciseText: true,
          durationSec: true,
          reflectionQuestion: true,
          reflectionHint: true,
        },
      });

      if (!items.length) {
        return res.status(404).json({
          ok: false,
          message: "برای این مود هنوز محتوایی ثبت نشده است.",
        });
      }

      const idx = stablePickIndex(`${userId}|${dateKey}|${mode}`, items.length);
      const picked = items[idx];

      // 2) user action (upsert-like read)
      const action = await prisma.inspirationAction.findUnique({
        where: { userId_dateKey_mode: { userId, dateKey, mode } },
        select: { completed: true, saved: true, note: true, updatedAt: true },
      });

      return res.json({
        ok: true,
        dateKey,
        mode,
        item: picked,
        action: action || { completed: false, saved: false, note: null },
      });
    } catch (err) {
      console.error("GET /inspiration/today error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  // ✅ GET /api/inspiration/week?mode=calm
  router.get("/week", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.query.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(ymd(d));
      }

      const actions = await prisma.inspirationAction.findMany({
        where: { userId, mode, dateKey: { in: days } },
        select: { dateKey: true, completed: true, saved: true },
      });

      const map = new Map(actions.map((a) => [a.dateKey, a]));
      const result = days.map((d, i) => ({
        dayLabel: i === 0 ? "امروز" : i === 1 ? "دیروز" : `${i} روز قبل`,
        dateKey: d,
        completed: map.get(d)?.completed || false,
        saved: map.get(d)?.saved || false,
      }));

      return res.json({ ok: true, mode, days: result });
    } catch (err) {
      console.error("GET /inspiration/week error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  // ✅ POST /api/inspiration/complete  { mode, dateKey?, completed? }
  router.post("/complete", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.body.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const dateKey = String(req.body.dateKey || ymd(new Date()));
      const completed = req.body.completed === undefined ? true : Boolean(req.body.completed);

      const action = await prisma.inspirationAction.upsert({
        where: { userId_dateKey_mode: { userId, dateKey, mode } },
        update: { completed },
        create: { userId, dateKey, mode, completed },
        select: { completed: true, saved: true, note: true, updatedAt: true },
      });

      return res.json({ ok: true, mode, dateKey, action });
    } catch (err) {
      console.error("POST /inspiration/complete error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  // ✅ POST /api/inspiration/save { mode, dateKey?, saved? }
  router.post("/save", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.body.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const dateKey = String(req.body.dateKey || ymd(new Date()));
      const saved = req.body.saved === undefined ? true : Boolean(req.body.saved);

      const action = await prisma.inspirationAction.upsert({
        where: { userId_dateKey_mode: { userId, dateKey, mode } },
        update: { saved },
        create: { userId, dateKey, mode, saved },
        select: { completed: true, saved: true, note: true, updatedAt: true },
      });

      return res.json({ ok: true, mode, dateKey, action });
    } catch (err) {
      console.error("POST /inspiration/save error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  // ✅ POST /api/inspiration/note { mode, dateKey?, note }
  router.post("/note", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.body.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const dateKey = String(req.body.dateKey || ymd(new Date()));
      const note = typeof req.body.note === "string" ? req.body.note : "";

      const action = await prisma.inspirationAction.upsert({
        where: { userId_dateKey_mode: { userId, dateKey, mode } },
        update: { note },
        create: { userId, dateKey, mode, note },
        select: { completed: true, saved: true, note: true, updatedAt: true },
      });

      return res.json({ ok: true, mode, dateKey, action });
    } catch (err) {
      console.error("POST /inspiration/note error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

    // ✅ GET /api/inspiration/history?mode=calm&take=30
  // آرشیو روزهای اخیر (همراه با وضعیت completed/saved/note)
  router.get("/history", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.query.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const take = Math.min(180, Math.max(1, parseInt(req.query.take || "30", 10)));

      const actions = await prisma.inspirationAction.findMany({
        where: { userId, mode },
        orderBy: { dateKey: "desc" },
        take,
        select: { dateKey: true, completed: true, saved: true, note: true, updatedAt: true },
      });

      return res.json({ ok: true, mode, items: actions });
    } catch (err) {
      console.error("GET /inspiration/history error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  // ✅ GET /api/inspiration/saved?mode=calm&take=50
  // لیست ذخیره‌ها (همراه با محتوای quote/exercise)
  router.get("/saved", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, message: "کاربر نامعتبر است." });

      const mode = String(req.query.mode || "calm");
      if (!ALLOWED_MODES.has(mode)) {
        return res.status(400).json({ ok: false, message: "mode نامعتبر است." });
      }

      const take = Math.min(200, Math.max(1, parseInt(req.query.take || "50", 10)));

      const savedActions = await prisma.inspirationAction.findMany({
        where: { userId, mode, saved: true },
        orderBy: { dateKey: "desc" },
        take,
        select: { dateKey: true, completed: true, saved: true, note: true, updatedAt: true },
      });

      const allItems = await prisma.inspirationItem.findMany({
        where: { mode, isActive: true },
        orderBy: { id: "asc" },
        select: {
          id: true,
          mode: true,
          quote: true,
          author: true,
          exerciseTitle: true,
          exerciseText: true,
          durationSec: true,
          reflectionQuestion: true,
          reflectionHint: true,
        },
      });

      if (!allItems.length) return res.json({ ok: true, mode, items: [] });

      const items = savedActions.map((a) => {
        const idx = stablePickIndex(`${userId}|${a.dateKey}|${mode}`, allItems.length);
        return {
          dateKey: a.dateKey,
          action: a,
          item: allItems[idx],
        };
      });

      return res.json({ ok: true, mode, items });
    } catch (err) {
      console.error("GET /inspiration/saved error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  return router;
};