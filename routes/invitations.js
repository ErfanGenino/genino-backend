const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");

module.exports = function (prisma) {
  const router = express.Router();

  // ===============================
  // POST /api/invitations (ارسال دعوت)
  // ===============================
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { childId, email, phone } = req.body;

      // 1️⃣ اعتبارسنجی
      if (!childId) {
        return res.status(400).json({ message: "childId الزامی است." });
      }
      if (!email && !phone) {
        return res.status(400).json({
          message: "ایمیل یا شماره موبایل الزامی است.",
        });
      }

      // 2️⃣ بررسی ادمین بودن کاربر
      const admin = await prisma.childAdmin.findFirst({
        where: { childId: Number(childId), userId },
      });

      if (!admin) {
        return res.status(403).json({
          message: "شما اجازه ارسال دعوت برای این کودک را ندارید.",
        });
      }

      // 3️⃣ جلوگیری از دعوت فعال تکراری
      const existingInvite = await prisma.childInvitation.findFirst({
        where: {
          childId: Number(childId),
          accepted: false,
          expiresAt: { gt: new Date() },
          OR: [
            email ? { email } : undefined,
            phone ? { phone } : undefined,
          ].filter(Boolean),
        },
      });

      if (existingInvite) {
        return res.status(409).json({
          message: "برای این والد قبلاً دعوت فعال ارسال شده است.",
        });
      }

      // 4️⃣ ساخت توکن و تاریخ انقضا
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 5️⃣ ذخیره دعوت
      const invitation = await prisma.childInvitation.create({
        data: {
          childId: Number(childId),
          inviterId: userId,
          email: email || null,
          phone: phone || null,
          token,
          expiresAt,
        },
      });

      res.status(201).json({
        ok: true,
        message: "دعوت‌نامه با موفقیت ایجاد شد.",
        invitationId: invitation.id,
      });
    } catch (error) {
      console.error("❌ Error creating invitation:", error);
      res.status(500).json({ message: "خطا در ایجاد دعوت‌نامه." });
    }
  });

  // ===============================
  // POST /api/invitations/accept (پذیرش دعوت)
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
          message: "شما قبلاً ادمین این کودک هستید.",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gender: true },
      });

      let role = "parent";
      if (user?.gender === "male") role = "father";
      else if (user?.gender === "female") role = "mother";

      await prisma.childAdmin.create({
        data: {
          childId: invitation.childId,
          userId,
          role,
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

      res.json({
        ok: true,
        message: "دعوت با موفقیت پذیرفته شد.",
      });
    } catch (error) {
      console.error("❌ Accept invitation error:", error);
      res.status(500).json({
        ok: false,
        message: "خطای سرور در پذیرش دعوت.",
      });
    }
  });

  return router;
};
