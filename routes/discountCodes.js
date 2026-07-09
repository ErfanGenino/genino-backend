const express = require("express");

module.exports = function (prisma) {
  const router = express.Router();

  // بررسی اعتبار کد تخفیف
  router.post("/validate", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          ok: false,
          message: "کد تخفیف الزامی است.",
        });
      }

      const discountCode = await prisma.discountCode.findUnique({
        where: {
          code: code.trim().toUpperCase(),
        },
      });

      if (!discountCode || !discountCode.isActive) {
        return res.status(404).json({
          ok: false,
          message: "کد تخفیف معتبر نیست یا قبلاً استفاده شده است.",
        });
      }

      return res.json({
        ok: true,
        discountCode: {
          id: discountCode.id,
          code: discountCode.code,
          percent: discountCode.percent,
          title: discountCode.title,
        },
      });
    } catch (err) {
      console.error("VALIDATE DISCOUNT CODE ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور.",
      });
    }
  });

  // مصرف کردن کد تخفیف بعد از پرداخت موفق
// مصرف کردن کد تخفیف بعد از پرداخت موفق
router.post("/use", async (req, res) => {
  try {
    const { code, vendorId } = req.body;

    if (!code || !vendorId) {
      return res.status(400).json({
        ok: false,
        message: "کد تخفیف و شناسه فروشنده الزامی است.",
      });
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: {
        code: code.trim().toUpperCase(),
      },
    });

    if (!discountCode || !discountCode.isActive || discountCode.usedAt) {
      return res.status(404).json({
        ok: false,
        message: "کد تخفیف معتبر نیست یا قبلاً استفاده شده است.",
      });
    }

    const vendor = await prisma.vendorAccount.findUnique({
      where: {
        id: Number(vendorId),
      },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد.",
      });
    }

    const usedDiscountCode = await prisma.discountCode.update({
      where: {
        id: discountCode.id,
      },
      data: {
        isActive: false,
        usedAt: new Date(),
        usedByVendorId: vendor.id,
      },
      include: {
        usedByVendor: {
          select: {
            id: true,
            businessName: true,
            personType: true,
            firstName: true,
            lastName: true,
            legalCompanyName: true,
            phone: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      message: "کد تخفیف با موفقیت مصرف شد.",
      discountCode: {
        id: usedDiscountCode.id,
        code: usedDiscountCode.code,
        percent: usedDiscountCode.percent,
        isActive: usedDiscountCode.isActive,
        usedAt: usedDiscountCode.usedAt,
        usedByVendor: usedDiscountCode.usedByVendor,
      },
    });
  } catch (err) {
    console.error("USE DISCOUNT CODE ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
});


  return router;
};