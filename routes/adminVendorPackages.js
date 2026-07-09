const express = require("express");

module.exports = function (prisma) {
  const router = express.Router();

  // دریافت همه بسته‌های همکاری برای پنل ادمین
  router.get("/", async (req, res) => {
    try {
      const packages = await prisma.vendorPackage.findMany({
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
      });

      return res.json({
        ok: true,
        packages,
      });
    } catch (err) {
      console.error("ADMIN VENDOR PACKAGES LIST ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور.",
      });
    }
  });

  // ایجاد بسته همکاری جدید
router.post("/", async (req, res) => {
  try {
    const {
      targetType,
      title,
      description,
      price,
      durationMonths,
      hasDedicatedPage,
      windowCount,
      achievementLimit,
      allowedUserCount,
      isActive,
      sortOrder,
    } = req.body;

    if (!targetType || !title || !durationMonths || !price) {
      return res.status(400).json({
        ok: false,
        message: "اطلاعات اصلی بسته کامل نیست.",
      });
    }

    const code = `VP-${targetType}-${Date.now()}`;

    const newPackage = await prisma.vendorPackage.create({
      data: {
        code,
        targetType,
        title,
        description,
        price,
        durationMonths,
        hasDedicatedPage,
        windowCount,
        achievementLimit,
        allowedUserCount,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      },
    });

    return res.status(201).json({
      ok: true,
      package: newPackage,
    });
  } catch (err) {
    console.error("CREATE VENDOR PACKAGE ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
});

  // ویرایش بسته همکاری
router.put("/:id", async (req, res) => {
  try {
    const packageId = Number(req.params.id);

    const {
  targetType,
  title,
  description,
  price,
  durationMonths,
  hasDedicatedPage,
  windowCount,
  achievementLimit,
  allowedUserCount,
  isActive,
  sortOrder,
} = req.body;

    const updatedPackage =
      await prisma.vendorPackage.update({
        where: {
          id: packageId,
        },
        data: {
  targetType,
  title,
  description,
  price,
  durationMonths,
  hasDedicatedPage,
  windowCount,
  achievementLimit,
  allowedUserCount,
  isActive,
  sortOrder,
},
      });

    return res.json({
      ok: true,
      package: updatedPackage,
    });
  } catch (err) {
    console.error(
      "ADMIN VENDOR PACKAGE UPDATE ERROR:",
      err
    );

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
});

// فعال/غیرفعال کردن بسته
router.patch("/:id/toggle", async (req, res) => {
  try {
    const packageId = Number(req.params.id);

    const existing = await prisma.vendorPackage.findUnique({
      where: { id: packageId },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        message: "بسته پیدا نشد.",
      });
    }

    const updated = await prisma.vendorPackage.update({
      where: { id: packageId },
      data: {
        isActive: !existing.isActive,
      },
    });

    return res.json({
      ok: true,
      package: updated,
    });
  } catch (err) {
    console.error("TOGGLE VENDOR PACKAGE ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const packageId = Number(req.params.id);

    const updated = await prisma.vendorPackage.update({
      where: { id: packageId },
      data: {
        isActive: false,
      },
    });

    return res.json({
      ok: true,
      package: updated,
      message: "بسته غیرفعال شد (حذف منطقی)",
    });
  } catch (err) {
    console.error("DELETE VENDOR PACKAGE ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
});

  return router;
};