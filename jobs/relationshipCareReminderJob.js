async function createRelationshipCareReminders(prisma) {
  try {
    const now = new Date();

    const assessments = await prisma.relationshipAssessment.findMany({
      orderBy: { completedAt: "desc" },
      include: {
        lifeCompanion: true,
      },
    });

    const latestByUser = new Map();

    for (const assessment of assessments) {
      if (!latestByUser.has(assessment.userId)) {
        latestByUser.set(assessment.userId, assessment);
      }
    }

    for (const assessment of latestByUser.values()) {
      const daysPassed = Math.floor(
        (now - assessment.completedAt) / (1000 * 60 * 60 * 24)
      );

      if (daysPassed < 7 || daysPassed % 7 !== 0) continue;

      const alreadyExists = await prisma.notification.findFirst({
        where: {
          userId: assessment.userId,
          type: "relationship_care_reminder",
          data: {
            path: ["daysPassed"],
            equals: daysPassed,
          },
        },
      });

      if (alreadyExists) continue;

      const title =
  daysPassed === 7
    ? "وقت مراقبت هفتگی رابطه شماست 🌷"
    : `${daysPassed} روز از آخرین مراقبت رابطه گذشته است 💛`;

      const body =
        daysPassed === 7
          ? "فقط چند دقیقه زمان بگذارید و نبض رابطه‌تان را دوباره بررسی کنید."
          : daysPassed === 14
          ? "رابطه‌های خوب با توجه‌های کوچک رشد می‌کنند. اگر فرصت دارید، این هفته دوباره مراقبت رابطه را انجام دهید."
          : "گاهی چند دقیقه گفت‌وگوی آگاهانه می‌تواند مسیر رابطه را آرام‌تر کند.";

      await prisma.notification.create({
        data: {
          userId: assessment.userId,
          type: "relationship_care_reminder",
          title,
          body,
          data: {
            targetPath: "/life-companion/relationship-care",
            daysPassed,
            assessmentId: assessment.id,
          },
        },
      });
    }

    console.log("💛 Relationship care reminders checked.");
  } catch (error) {
    console.error("❌ Relationship care reminder job error:", error);
  }
}

module.exports = {
  createRelationshipCareReminders,
};