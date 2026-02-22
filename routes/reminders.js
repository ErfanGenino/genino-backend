// routes/reminders.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // ✅ GET /api/reminders
  // لیست یادآوری‌های کاربر (فقط فعال‌ها)
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const reminders = await prisma.reminder.findMany({
        where: { userId, isActive: true },
        orderBy: { remindAt: "asc" },
      });

      return res.json({ ok: true, reminders });
    } catch (error) {
      console.error("❌ Error fetching reminders:", error);
      return res.status(500).json({ ok: false, message: "خطا در دریافت یادآوری‌ها" });
    }
  });

  // ✅ POST /api/reminders
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { title, description, type, repeat, remindAt } = req.body;

      // حداقل اعتبارسنجی سبک (بدون سنگین‌کاری)
      if (!title || !type || !repeat || !remindAt) {
        return res.status(400).json({
          ok: false,
          message: "اطلاعات ناقص است (title/type/repeat/remindAt).",
        });
      }

      const created = await prisma.reminder.create({
        data: {
          userId,
          title: String(title).trim(),
          description: description ? String(description).trim() : null,
          type: String(type),
          repeat: String(repeat),
          remindAt: new Date(remindAt),
        },
      });

      return res.status(201).json({ ok: true, reminder: created });
    } catch (error) {
      console.error("❌ Error creating reminder:", error);
      return res.status(500).json({ ok: false, message: "خطا در ثبت یادآوری" });
    }
  });

  // ✅ DELETE /api/reminders/:id
  router.delete("/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const id = Number(req.params.id);

      // فقط مالک خودش اجازه حذف دارد
      const reminder = await prisma.reminder.findFirst({
        where: { id, userId, isActive: true },
        select: { id: true },
      });

      if (!reminder) {
        return res.status(404).json({ ok: false, message: "یادآوری پیدا نشد." });
      }

      // حذف نرم (برای آینده و audit)
      await prisma.reminder.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("❌ Error deleting reminder:", error);
      return res.status(500).json({ ok: false, message: "خطا در حذف یادآوری" });
    }
  });

  return router;
};