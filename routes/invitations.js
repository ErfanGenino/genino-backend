const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");

module.exports = function (prisma) {
  const router = express.Router();

  // ===============================
  // POST /api/invitations (ارسال دعوت)
  // body: { childId, email?, phone?, relationType, slot?, roleLabel? }
  // ===============================
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { childId, email, phone, relationType, slot, roleLabel } = req.body;

      // 1) اعتبارسنجی پایه
      if (!childId) {
        return res.status(400).json({ ok: false, message: "childId الزامی است." });
      }
      if (!email && !phone) {
        return res.status(400).json({
          ok: false,
          message: "ایمیل یا شماره موبایل الزامی است.",
        });
      }

      // ✅ NEW: نقش/جایگاه
      if (!relationType || typeof relationType !== "string") {
        return res.status(400).json({
          ok: false,
          message: "relationType الزامی است.",
        });
      }

      const slotValue =
        slot === undefined || slot === null || slot === ""
          ? 0
          : Number(slot);

      if (Number.isNaN(slotValue) || slotValue < 0) {
        return res.status(400).json({
          ok: false,
          message: "slot باید عدد 0 یا بزرگتر باشد.",
        });
      }

      // 1) اگر آن جایگاه قبلاً CONNECTED شده باشد، اجازه دعوت نده
      const alreadyConnected = await prisma.childAdmin.findFirst({
        where: {
          childId: Number(childId),
          role: relationType.trim(),
          slot: slotValue,
        },
      });

      if (alreadyConnected) {
      return res.status(409).json({
        ok: false,
          message: "این جایگاه قبلاً پر شده است و امکان ارسال دعوت ندارد.",
        });
      }

      // 2) اگر برای همان جایگاه دعوت فعال وجود دارد، دوباره دعوت نده
      const existingSlotInvite = await prisma.childInvitation.findFirst({
        where: {
          childId: Number(childId),
          relationType: relationType.trim(),
          slot: slotValue,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingSlotInvite) {
      return res.status(409).json({
        ok: false,
          message: "برای این جایگاه قبلاً دعوت فعال ارسال شده است.",
        });
      }

      // 2) بررسی ادمین بودن کاربر (فقط پدر/مادر)
      const admin = await prisma.childAdmin.findFirst({
        where: {
          childId: Number(childId),
          userId,
          role: { in: ["father", "mother"] },
        },
      });


      if (!admin) {
        return res.status(403).json({
          ok: false,
          message: "شما اجازه ارسال دعوت برای این کودک را ندارید.",
        });
      }

      // 3) جلوگیری از دعوت فعال تکراری (برای همان کودک و همان مقصد)
      const existingInvite = await prisma.childInvitation.findFirst({
        where: {
          childId: Number(childId),
          accepted: false,
          expiresAt: { gt: new Date() },
          OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(Boolean),
        },
      });

      if (existingInvite) {
        return res.status(409).json({
          ok: false,
          message: "برای این شخص قبلاً دعوت فعال ارسال شده است.",
        });
      }

      // 4) ساخت توکن و تاریخ انقضا
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 5) ذخیره دعوت
      const invitation = await prisma.childInvitation.create({
        data: {
          childId: Number(childId),
          inviterId: userId,
          email: email || null,
          phone: phone || null,
          token,
          expiresAt,

          // ✅ NEW
          relationType: relationType.trim(),
          slot: slotValue,
          roleLabel: roleLabel ? String(roleLabel).trim() : null,
        },
      });

      // ⚠️ در prod بهتره token برنگرده؛ فعلاً برای تست accept، برمی‌گردونیم
      return res.status(201).json({
        ok: true,
        message: "دعوت‌نامه با موفقیت ایجاد شد.",
        invitationId: invitation.id,
        token: invitation.token, // ✅ فقط برای تست/دیباگ
        relationType: invitation.relationType,
        slot: invitation.slot,
      });
    } catch (error) {
      console.error("❌ Error creating invitation:", error);
      return res.status(500).json({ ok: false, message: "خطا در ایجاد دعوت‌نامه." });
    }
  });

  // ===============================
  // POST /api/invitations/accept (پذیرش دعوت)
  // body: { token }
  // ===============================
  router.post("/accept", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          ok: false,
          message: "توکن دعوت ارسال نشده است.",
        });
      }

      const invitation = await prisma.childInvitation.findUnique({
        where: { token },
      });
      if (!invitation) {
        return res.status(404).json({
          ok: false,
          message: "دعوت معتبر نیست.",
        });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(410).json({
          ok: false,
          message: "دعوت منقضی شده است.",
        });
      }

      if (invitation.accepted) {
        return res.status(409).json({
          ok: false,
          message: "این دعوت قبلاً استفاده شده است.",
        });
      }

      const exists = await prisma.childAdmin.findFirst({
        where: {
          childId: invitation.childId,
          userId,
        },
      });

      if (exists) {
        return res.status(409).json({
          ok: false,
          message: "شما قبلاً عضو درختواره این کودک هستید.",
        });
      }

      // ✅ NEW: نقش از روی invitation
      // (والدین مسیر جدا دارند؛ اینجا فقط برای اعضای دعوت‌شده است)
      const roleFromInvite = invitation.relationType || "relative";
      const slotFromInvite = Number.isFinite(invitation.slot) ? invitation.slot : 0;

      await prisma.childAdmin.create({
        data: {
          childId: invitation.childId,
          userId,
          role: roleFromInvite,
          slot: slotFromInvite, // ✅ NEW
          isPrimary: false,
        },
      });


      await prisma.childInvitation.update({
        where: { id: invitation.id },
        data: {
          accepted: true,
          acceptedAt: new Date(),
        },
      });

      return res.json({
        ok: true,
        message: "دعوت با موفقیت پذیرفته شد.",
        childId: invitation.childId,
        role: roleFromInvite,
        slot: invitation.slot,
      });
    } catch (error) {
      console.error("❌ Accept invitation error:", error);
      return res.status(500).json({
        ok: false,
        message: "خطای سرور در پذیرش دعوت.",
      });
    }
  });

    // ===============================
  // DELETE /api/invitations/:invitationId (لغو/حذف دعوت Pending)
  // ===============================
  router.delete("/:invitationId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const invitationId = Number(req.params.invitationId);

      if (!invitationId) {
        return res.status(400).json({ ok: false, message: "invitationId نامعتبر است." });
      }

      const invitation = await prisma.childInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return res.status(404).json({ ok: false, message: "دعوت پیدا نشد." });
      }

      if (invitation.accepted) {
        return res.status(409).json({ ok: false, message: "این دعوت قبلاً پذیرفته شده و قابل حذف نیست." });
      }

      // ✅ بررسی ادمین بودن کاربر برای همان کودک (فقط پدر/مادر)
      const admin = await prisma.childAdmin.findFirst({
        where: {
          childId: invitation.childId,
          userId,
          role: { in: ["father", "mother"] },
        },
      });


      if (!admin) {
        return res.status(403).json({ ok: false, message: "شما اجازه لغو این دعوت را ندارید." });
      }

      await prisma.childInvitation.delete({
        where: { id: invitationId },
      });

      return res.json({
        ok: true,
        message: "دعوت با موفقیت لغو شد.",
        invitationId,
        childId: invitation.childId,
        relationType: invitation.relationType,
        slot: invitation.slot,
      });
    } catch (error) {
      console.error("❌ Cancel invitation error:", error);
      return res.status(500).json({ ok: false, message: "خطای سرور در لغو دعوت." });
    }
  });


  return router;
};