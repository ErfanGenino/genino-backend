const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (prisma) => {
  const router = express.Router();

  router.post("/reports", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { date, type, score, status, tip, answers } = req.body || {};

      if (!userId) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }

      if (!date || typeof date !== "string") {
        return res.status(400).json({ ok: false, message: "فیلد date الزامی است." });
      }

      if (!type || typeof type !== "string") {
        return res.status(400).json({ ok: false, message: "فیلد type الزامی است." });
      }

      const created = await prisma.menHealthReport.create({
        data: {
          userId,
          date,
          type,
          score: score ?? null,
          status: status ?? null,
          tip: tip ?? null,
          answers: answers ?? null,
        },
      });

      return res.json({ ok: true, report: created });
    } catch (err) {
      console.error("menHealth POST /reports error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  router.get("/reports", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const take = Math.min(parseInt(req.query.take || "20", 10) || 20, 100);

      if (!userId) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }

      const reports = await prisma.menHealthReport.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
      });

      return res.json({ ok: true, reports });
    } catch (err) {
      console.error("menHealth GET /reports error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  router.delete("/reports/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const id = parseInt(req.params.id, 10);

      if (!userId) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }

      if (!id || Number.isNaN(id)) {
        return res.status(400).json({ ok: false, message: "شناسه نامعتبر است." });
      }

      const found = await prisma.menHealthReport.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!found) {
        return res.status(404).json({ ok: false, message: "گزارش پیدا نشد." });
      }

      await prisma.menHealthReport.delete({ where: { id } });

      return res.json({ ok: true, message: "گزارش حذف شد." });
    } catch (err) {
      console.error("menHealth DELETE /reports/:id error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  return router;
};