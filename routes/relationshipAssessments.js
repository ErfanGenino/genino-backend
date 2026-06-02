const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  async function getMyLifeCompanion(userId) {
    return prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });
  }

  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const companion = await getMyLifeCompanion(userId);

      if (!companion) {
        return res.status(404).json({ ok: false, message: "همراه زندگی پیدا نشد." });
      }

      const assessments = await prisma.relationshipAssessment.findMany({
        where: {
          lifeCompanionId: companion.id,
          userId,
        },
        orderBy: { completedAt: "desc" },
      });

      return res.json({ ok: true, assessments });
    } catch (err) {
      console.error("GET RELATIONSHIP ASSESSMENTS ERROR:", err);
      return res.status(500).json({ ok: false, message: "خطا در دریافت ارزیابی‌ها." });
    }
  });

  router.post("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const companion = await getMyLifeCompanion(userId);

      if (!companion) {
        return res.status(404).json({ ok: false, message: "همراه زندگی پیدا نشد." });
      }

      const latest = await prisma.relationshipAssessment.findFirst({
        where: {
          lifeCompanionId: companion.id,
          userId,
        },
        orderBy: { completedAt: "desc" },
      });

      if (latest) {
        const nextAllowedAt = new Date(latest.completedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (new Date() < nextAllowedAt) {
          const daysRemaining = Math.ceil(
            (nextAllowedAt - new Date()) / (24 * 60 * 60 * 1000)
          );

          return res.status(429).json({
            ok: false,
            message: "ارزیابی این هفته قبلاً ثبت شده است.",
            daysRemaining,
            nextAllowedAt,
          });
        }
      }

      const {
  overallScore,
  strongestCategory,
  growthCategory,
  answers,
  categoryScores,
  hasChild = false,
} = req.body;

      if (
        typeof overallScore !== "number" ||
        !answers ||
        !categoryScores
      ) {
        return res.status(400).json({
          ok: false,
          message: "اطلاعات ارزیابی کامل نیست.",
        });
      }

      const totalAssessmentsBefore = await prisma.relationshipAssessment.count({
  where: {
    lifeCompanionId: companion.id,
  },
});

      const assessment = await prisma.relationshipAssessment.create({
        data: {
  lifeCompanionId: companion.id,
  userId,
  overallScore,
  hasChild: Boolean(hasChild),
  strongestCategory,
  growthCategory,
  answers,
  categoryScores,
},
      });

      if (totalAssessmentsBefore === 0) {
  const partnerId =
    companion.user1Id === userId ? companion.user2Id : companion.user1Id;

  await prisma.notification.create({
    data: {
      userId: partnerId,
      type: "relationship_care_partner_started",
      title: "همسرت مراقبت رابطه را شروع کرد 💛",
      body: "همراه زندگی شما اولین مراقبت رابطه را انجام داده است. شما هم می‌توانید نبض رابطه را بررسی کنید.",
      data: {
        targetPath: "/life-companion/relationship-care",
        assessmentId: assessment.id,
        partnerId: userId,
      },
    },
  });
}

      return res.status(201).json({ ok: true, assessment });
    } catch (err) {
      console.error("CREATE RELATIONSHIP ASSESSMENT ERROR:", err);
      return res.status(500).json({ ok: false, message: "خطا در ثبت ارزیابی رابطه." });
    }
  });

  return router;
};