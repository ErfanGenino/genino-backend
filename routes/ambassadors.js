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

  vendorRelations: {
    orderBy: {
      createdAt: "desc",
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          personType: true,
          activityType: true,
          mainActivityField: true,
          province: true,
          city: true,
          phone: true,
          email: true,
          accountStatus: true,
          paymentStatus: true,
          packageStatus: true,
          createdAt: true,
        },
      },
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

  router.post("/validate-code", async (req, res) => {
  try {
    const { code, vendorId } = req.body;

    if (!code) {
      return res.status(400).json({
        ok: false,
        message: "کد سفیر الزامی است.",
      });
    }

    const ambassador = await prisma.ambassador.findUnique({
      where: {
        ambassadorCode: code.trim().toUpperCase(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            phone: true,
            province: true,
            city: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!ambassador || ambassador.status !== "ACTIVE") {
      return res.status(404).json({
        ok: false,
        message: "کد سفیر معتبر نیست یا سفیر فعال نمی‌باشد.",
      });
    }

    if (vendorId) {
  const activeRelation = await prisma.ambassadorVendor.findFirst({
    where: {
      vendorId: Number(vendorId),
      status: "ACTIVE",
    },
  });

  if (activeRelation && activeRelation.ambassadorId !== ambassador.id) {
    return res.status(400).json({
      ok: false,
      message:
        "این کسب‌وکار پیش‌تر از طریق سفیر دیگری به ژنینو معرفی شده است. با هدف حفظ حقوق و تلاش سفیران ژنینو، امکان استفاده از کد سفیر دیگر برای این فروشنده وجود ندارد.",
    });
  }
}

    return res.json({
      ok: true,
      ambassador: {
  id: ambassador.id,
  code: ambassador.ambassadorCode,
  name:
    ambassador.user?.fullName ||
    `${ambassador.user?.firstName || ""} ${ambassador.user?.lastName || ""}`.trim() ||
    "سفیر ژنینو",
  phone: ambassador.user?.phone || ambassador.phone || "",
  city: ambassador.user?.city || "",
  province: ambassador.user?.province || "",
  avatarUrl: ambassador.user?.avatarUrl || null,
},
    });
  } catch (error) {
    console.error("AMBASSADOR_VALIDATE_CODE_ERROR:", error);

    return res.status(500).json({
      ok: false,
      message: "خطا در بررسی کد سفیر.",
    });
  }
});

router.get("/admin/list", async (req, res) => {
  try {
    const ambassadors = await prisma.ambassador.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            nationalCode: true,
            city: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ok: true,
      ambassadors: ambassadors.map((item) => ({
        id: item.id,
        code: item.ambassadorCode,
        firstName: item.user?.firstName || "",
        lastName: item.user?.lastName || "",
        nationalCode: item.user?.nationalCode || "",
        city: item.user?.city || "",
        mobile: item.user?.phone || "",
      })),
    });
  } catch (error) {
    console.error("ADMIN_AMBASSADORS_LIST_ERROR:", error);

    return res.status(500).json({
      ok: false,
      message: "خطا در دریافت لیست سفیران",
    });
  }
});


  return router;
};