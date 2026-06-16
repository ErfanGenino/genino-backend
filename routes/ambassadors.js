const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (prisma) => {
  const router = express.Router();

  function generateAmbassadorCode(userId) {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `GEN-${userId}-${random}`;
  }

  router.post("/register", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id || req.user.userId;

      if (!userId) {
  return res.status(401).json({
    ok: false,
    message: "شناسه کاربر در توکن پیدا نشد. لطفاً دوباره وارد شوید.",
  });
}

      const existing = await prisma.ambassador.findUnique({
        where: { userId },
      });

      if (existing) {
        return res.status(400).json({
          ok: false,
          message: "شما قبلاً به عنوان سفیر ژنینو ثبت‌نام کرده‌اید.",
        });
      }

      const ambassadorCode = generateAmbassadorCode(userId);

      const ambassador = await prisma.ambassador.create({
        data: {
          userId,
          ambassadorCode,

          fatherName: req.body.fatherName || null,
          birthCertificateNumber: req.body.birthCertificateNumber || null,
          education: req.body.education || null,
          maritalStatus: req.body.maritalStatus || null,
          childrenCount:
            req.body.childrenCount !== undefined && req.body.childrenCount !== ""
              ? Number(req.body.childrenCount)
              : null,
          currentJob: req.body.currentJob || null,

          phone: req.body.phone || null,
          address: req.body.address || null,
          postalCode: req.body.postalCode || null,

          familiarWithGenino: req.body.familiarWithGenino || null,
          marketingExperience: req.body.marketingExperience || null,
          dailyVisitAbility: req.body.dailyVisitAbility || null,
          successReason: req.body.successReason || null,

          personalPhotoUrl: req.body.personalPhotoUrl || null,
          nationalCardImageUrl: req.body.nationalCardImageUrl || null,
          birthCertificateImageUrl: req.body.birthCertificateImageUrl || null,
        },
      });

      return res.json({
        ok: true,
        message: "ثبت‌نام سفیر ژنینو با موفقیت انجام شد.",
        ambassador,
      });
    } catch (error) {
      console.error("AMBASSADOR_REGISTER_ERROR:", error);

      return res.status(500).json({
        ok: false,
        message: "خطا در ثبت‌نام سفیر ژنینو.",
      });
    }
  });

  router.get("/me", authMiddleware, async (req, res) => {
    try {
      const ambassador = await prisma.ambassador.findUnique({
  where: { userId: req.user.id || req.user.userId },
  include: {
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        email: true,
        province: true,
        city: true,
        avatarUrl: true,
      },
    },
  },
});

      return res.json({
        ok: true,
        ambassador,
      });
    } catch (error) {
      console.error("AMBASSADOR_ME_ERROR:", error);

      return res.status(500).json({
        ok: false,
        message: "خطا در دریافت اطلاعات سفیر.",
      });
    }
  });

  return router;
};