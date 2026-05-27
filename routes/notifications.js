const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // GET /api/notifications
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const notifications = await prisma.notification.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
});

const invitationIds = notifications
  .filter((n) => n.type === "child_invitation" && n.data?.invitationId)
  .map((n) => Number(n.data.invitationId));

const activeInvitations = await prisma.childInvitation.findMany({
  where: {
    id: { in: invitationIds },
    accepted: false,
    expiresAt: { gt: new Date() },
  },
  select: { id: true },
});

const activeInvitationIdSet = new Set(
  activeInvitations.map((inv) => inv.id)
);

const validNotifications = notifications.filter((n) => {
  if (n.type !== "child_invitation") return true;

  const invitationId = Number(n.data?.invitationId);
  return activeInvitationIdSet.has(invitationId);
});

return res.json({
  ok: true,
  notifications: validNotifications,
});


    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      return res.status(500).json({
        ok: false,
        message: "خطا در دریافت اعلان‌ها",
      });
    }
  });

  // PATCH /api/notifications/:id/read
  router.patch("/:id/read", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const notificationId = Number(req.params.id);

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          ok: false,
          message: "اعلان پیدا نشد",
        });
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return res.json({
        ok: true,
        notification: updated,
      });
    } catch (error) {
      console.error("❌ Error marking notification read:", error);
      return res.status(500).json({
        ok: false,
        message: "خطا در خواندن اعلان",
      });
    }
  });

  // DELETE /api/notifications/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = Number(req.params.id);

    const deleted = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        ok: false,
        message: "اعلان پیدا نشد",
      });
    }

    return res.json({
      ok: true,
      message: "اعلان حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return res.status(500).json({
      ok: false,
      message: "خطا در حذف اعلان",
    });
  }
});

// DELETE /api/notifications
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    return res.json({
      ok: true,
      message: "همه اعلان‌ها حذف شدند",
    });
  } catch (error) {
    console.error("❌ Error clearing notifications:", error);
    return res.status(500).json({
      ok: false,
      message: "خطا در حذف اعلان‌ها",
    });
  }
});

  return router;
};