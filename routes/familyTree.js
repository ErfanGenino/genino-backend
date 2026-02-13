// routes/familyTree.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  /**
   * GET /api/family-tree/:childId/pending-invitations
   */
  router.get("/:childId/pending-invitations", authMiddleware, async (req, res) => {
    try {
      const childId = Number(req.params.childId);
      if (!childId) {
        return res.status(400).json({ ok: false, message: "childId نامعتبر است." });
      }

      const now = new Date();

      const pending = await prisma.childInvitation.findMany({
        where: {
          childId,
          accepted: false,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          relationType: true,
          slot: true,
          roleLabel: true,
          createdAt: true,
        },
        orderBy: [{ relationType: "asc" }, { slot: "asc" }],
      });

      res.json({
        ok: true,
        childId,
        pendingInvitations: pending,
      });
    } catch (err) {
      console.error("familyTree error:", err);
      res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });

  /**
 * GET /api/family-tree/:childId/members
 * لیست اعضای متصل شده (accepted)
 */
router.get("/:childId/members", authMiddleware, async (req, res) => {
  try {
    const childId = Number(req.params.childId);
    if (!childId) {
      return res.status(400).json({ ok: false, message: "childId نامعتبر است." });
    }

    const members = await prisma.childAdmin.findMany({
      where: { childId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { slot: "asc" }],
    });

    res.json({
      ok: true,
      childId,
      members,
    });
  } catch (err) {
    console.error("familyTree members error:", err);
    res.status(500).json({ ok: false, message: "خطای سرور" });
  }
});

  /**
   * DELETE /api/family-tree/:childId/members/:memberId
   * لغو اتصال یک عضو (CONNECTED)
   */
  router.delete("/:childId/members/:memberId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const childId = Number(req.params.childId);
      const memberId = Number(req.params.memberId);

      if (!childId || !memberId) {
        return res.status(400).json({ ok: false, message: "childId یا memberId نامعتبر است." });
      }

      // ✅ بررسی ادمین بودن درخواست‌دهنده برای همان کودک
      const admin = await prisma.childAdmin.findFirst({
        where: { childId, userId },
      });

      if (!admin) {
        return res.status(403).json({ ok: false, message: "شما اجازه لغو اتصال برای این کودک را ندارید." });
      }

      // عضو هدف
      const member = await prisma.childAdmin.findUnique({
        where: { id: memberId },
      });

      if (!member || member.childId !== childId) {
        return res.status(404).json({ ok: false, message: "عضو پیدا نشد." });
      }

      // ✅ جلوگیری از حذف primary
      if (member.isPrimary) {
        return res.status(409).json({ ok: false, message: "عضو اصلی قابل حذف نیست." });
      }

      // ✅ (اختیاری ولی بهتر) جلوگیری از حذف خود
      if (member.userId === userId) {
        return res.status(409).json({ ok: false, message: "شما نمی‌توانید اتصال خودتان را حذف کنید." });
      }

      await prisma.childAdmin.delete({
        where: { id: memberId },
      });

      return res.json({
        ok: true,
        message: "اتصال عضو با موفقیت لغو شد.",
        memberId,
        childId,
      });
    } catch (err) {
      console.error("familyTree remove member error:", err);
      return res.status(500).json({ ok: false, message: "خطای سرور" });
    }
  });


  return router;
};