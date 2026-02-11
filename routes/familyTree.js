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

  return router;
};