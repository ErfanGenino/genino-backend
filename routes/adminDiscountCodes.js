const express = require("express");

module.exports = function (prisma) {
  const router = express.Router();

  // دریافت همه کدهای تخفیف برای پنل ادمین
  router.get("/", async (req, res) => {
    try {
      const discountCodes = await prisma.discountCode.findMany({
  orderBy: [{ createdAt: "desc" }],
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
        discountCodes,
      });
    } catch (err) {
      console.error("ADMIN DISCOUNT CODES LIST ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور.",
      });
    }
  });

  // ایجاد کد تخفیف جدید
  router.post("/", async (req, res) => {
    try {
      const { code, percent, title, description, isActive } = req.body;

     const allowedPercents = [
  5, 10, 15, 20, 25,
  30, 35, 40, 45, 50,
  55, 60, 65, 70, 75,
  80, 85, 90, 95, 100,
];

      if (!code || !percent) {
        return res.status(400).json({
          ok: false,
          message: "کد تخفیف و درصد الزامی است.",
        });
      }

      if (!allowedPercents.includes(Number(percent))) {
        return res.status(400).json({
          ok: false,
          message: "درصد تخفیف معتبر نیست.",
        });
      }

      const discountCode = await prisma.discountCode.create({
        data: {
          code: code.trim().toUpperCase(),
          percent: Number(percent),
          title,
          description,
          isActive: isActive ?? true,
        },
      });

      return res.status(201).json({
        ok: true,
        discountCode,
      });
    } catch (err) {
      console.error("ADMIN DISCOUNT CODE CREATE ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور.",
      });
    }
  });

  return router;
};