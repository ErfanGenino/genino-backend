const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (prisma) => {
  const router = express.Router();

  const getUserId = (req) => Number(req.user.userId || req.user.id);

  // دریافت همه اطلاعات کالری‌شمار
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);

      const tracker = await prisma.calorieTracker.findUnique({
        where: { userId },
      });

      const profiles = await prisma.calorieProfile.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      const dailyLogs = await prisma.calorieDailyLog.findMany({
        where: { userId },
        orderBy: { dateKey: "asc" },
      });

      res.json({
        ok: true,
        startDate: tracker?.startDate || null,
        calorieHistory: profiles,
        dailyLogs,
      });
    } catch (err) {
      console.error("GET CALORIE TRACKER ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در دریافت اطلاعات کالری‌شمار" });
    }
  });

  // دریافت تاریخ شروع
  router.get("/start-date", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);

      const tracker = await prisma.calorieTracker.findUnique({
        where: { userId },
      });

      res.json({ ok: true, startDate: tracker?.startDate || null });
    } catch (err) {
      console.error("GET CALORIE START DATE ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در دریافت تاریخ شروع کالری‌شماری" });
    }
  });

  // ثبت یا ویرایش تاریخ شروع
  router.post("/start-date", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { startDate } = req.body;

      if (!startDate) {
        return res.status(400).json({ ok: false, message: "تاریخ شروع الزامی است" });
      }

      const tracker = await prisma.calorieTracker.upsert({
        where: { userId },
        update: { startDate },
        create: { userId, startDate },
      });

      res.json({ ok: true, startDate: tracker.startDate });
    } catch (err) {
      console.error("SAVE CALORIE START DATE ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در ثبت تاریخ شروع کالری‌شماری" });
    }
  });

  // حذف تاریخ شروع و اطلاعات کالری‌شمار
  router.delete("/start-date", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);

      await prisma.calorieDailyLog.deleteMany({ where: { userId } });
      await prisma.calorieProfile.deleteMany({ where: { userId } });
      await prisma.calorieTracker.deleteMany({ where: { userId } });

      res.json({ ok: true, message: "اطلاعات کالری‌شماری حذف شد" });
    } catch (err) {
      console.error("DELETE CALORIE START DATE ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در حذف اطلاعات کالری‌شماری" });
    }
  });

  // ثبت پروفایل کالری جدید
  router.post("/profile", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);

      const {
        effectiveFrom,
        calories,
        gender,
        age,
        height,
        weight,
        activityLevel,
        bmi,
        idealWeightMin,
        idealWeightMax,
        goal,
        maintenanceCalories,
      } = req.body;

      if (!effectiveFrom || !calories) {
        return res.status(400).json({ ok: false, message: "تاریخ اثرگذاری و کالری الزامی است" });
      }

      const profile = await prisma.calorieProfile.create({
        data: {
          userId,
          effectiveFrom,
          calories: Number(calories),
          gender,
          age: age ? Number(age) : null,
          height: height ? Number(height) : null,
          weight: weight ? Number(weight) : null,
          activityLevel: activityLevel ? Number(activityLevel) : null,
          bmi: bmi ? Number(bmi) : null,
          idealWeightMin: idealWeightMin ? Number(idealWeightMin) : null,
          idealWeightMax: idealWeightMax ? Number(idealWeightMax) : null,
          goal,
          maintenanceCalories: maintenanceCalories ? Number(maintenanceCalories) : null,
        },
      });

      res.json({ ok: true, profile });
    } catch (err) {
      console.error("SAVE CALORIE PROFILE ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در ثبت پروفایل کالری" });
    }
  });

  // ثبت یا ویرایش گزارش روزانه
  router.post("/daily-log", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);

      console.log("CALORIE DAILY LOG BODY:", {
  userId,
  body: req.body,
});

      const {
        dateKey,
        dateText,
        foods,
        calories,
        totalCalories,
        allowedCalories,
      } = req.body;

      if (!dateKey || !dateText) {
        return res.status(400).json({ ok: false, message: "تاریخ گزارش الزامی است" });
      }

      const log = await prisma.calorieDailyLog.upsert({
        where: {
          userId_dateKey: { userId, dateKey },
        },
        update: {
          dateText,
          foods,
          calories,
          totalCalories: Number(totalCalories || 0),
          allowedCalories: Number(allowedCalories || 0),
        },
        create: {
          userId,
          dateKey,
          dateText,
          foods,
          calories,
          totalCalories: Number(totalCalories || 0),
          allowedCalories: Number(allowedCalories || 0),
        },
      });

      console.log("CALORIE DAILY LOG SAVED:", log);

      res.json({ ok: true, log });
    } catch (err) {
      console.error("SAVE CALORIE DAILY LOG ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در ثبت گزارش روزانه کالری" });
    }
  });

  // حذف گزارش یک روز
  router.delete("/daily-log/:dateKey", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { dateKey } = req.params;

      await prisma.calorieDailyLog.deleteMany({
        where: { userId, dateKey },
      });

      res.json({ ok: true, message: "گزارش روز حذف شد" });
    } catch (err) {
      console.error("DELETE CALORIE DAILY LOG ERROR:", err);
      res.status(500).json({ ok: false, message: "خطا در حذف گزارش روزانه" });
    }
  });

  return router;
};