// routes/myCycle.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // ✅ GET /api/my-cycle
  // دریافت تنظیمات چرخه کاربر (اگر هنوز چیزی ثبت نکرده null برمی‌گردد)
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const cycle = await prisma.womenCycle.findUnique({
        where: { userId },
        select: {
          lastPeriodAt: true,
          cycleLength: true,
          periodLength: true,
          updatedAt: true,
        },
      });

      return res.json({ ok: true, cycle }); // cycle می‌تواند null باشد
    } catch (error) {
      console.error("❌ Error fetching my-cycle:", error);
      return res.status(500).json({ ok: false, message: "خطا در دریافت اطلاعات چرخه" });
    }
  });

  // ✅ PUT /api/my-cycle
  // ساخت یا آپدیت چرخه کاربر
  router.put("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { lastPeriodAt, cycleLength, periodLength } = req.body;

      // اعتبارسنجی سبک (نه سنگین)
      if (!lastPeriodAt) {
        return res.status(400).json({ ok: false, message: "lastPeriodAt اجباری است." });
      }

      const cl = Number(cycleLength ?? 28);
      const pl = Number(periodLength ?? 5);

      if (!Number.isFinite(cl) || cl < 18 || cl > 60) {
        return res.status(400).json({ ok: false, message: "cycleLength باید بین 18 تا 60 باشد." });
      }

      if (!Number.isFinite(pl) || pl < 1 || pl > 10) {
        return res.status(400).json({ ok: false, message: "periodLength باید بین 1 تا 10 باشد." });
      }

      const dt = new Date(lastPeriodAt);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ ok: false, message: "lastPeriodAt معتبر نیست." });
      }

      // upsert = اگر بود آپدیت کن، اگر نبود بساز
      const saved = await prisma.womenCycle.upsert({
        where: { userId },
        create: {
          userId,
          lastPeriodAt: dt,
          cycleLength: cl,
          periodLength: pl,
        },
        update: {
          lastPeriodAt: dt,
          cycleLength: cl,
          periodLength: pl,
        },
        select: {
          lastPeriodAt: true,
          cycleLength: true,
          periodLength: true,
          updatedAt: true,
        },
      });

      return res.json({ ok: true, cycle: saved });
    } catch (error) {
      console.error("❌ Error saving my-cycle:", error);
      return res.status(500).json({ ok: false, message: "خطا در ذخیره اطلاعات چرخه" });
    }
  });

  return router;
};