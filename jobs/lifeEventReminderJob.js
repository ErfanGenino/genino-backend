async function createLifeEventReminders(prisma) {
  try {
    const now = new Date();

    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const events = await prisma.lifeEvent.findMany({
      where: {
        completed: false,
        reminderSent: false,
        eventDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        lifeCompanion: true,
      },
    });

    for (const event of events) {
      const userIds = [
        event.lifeCompanion.user1Id,
        event.lifeCompanion.user2Id,
      ];

      const timeText = event.eventTime
        ? ` ساعت ${event.eventTime}`
        : "";

      const body = `فردا رویداد «${event.eventType}»${timeText} دارید.${
        event.description ? `\n${event.description}` : ""
      }`;

      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: "life_companion_event_reminder",
          title: "یادآوری رویداد فردا",
          body,
          data: {
            lifeEventId: event.id,
            eventType: event.eventType,
            targetPath: "/life-companion/events",
          },
        })),
      });

      await prisma.lifeEvent.update({
        where: { id: event.id },
        data: { reminderSent: true },
      });
    }

    console.log(`📅 Life event reminders checked: ${events.length}`);
  } catch (error) {
    console.error("❌ Life event reminder job error:", error);
  }
}

module.exports = {
  createLifeEventReminders,
};