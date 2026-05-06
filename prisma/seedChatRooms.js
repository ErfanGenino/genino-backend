const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rooms = [
    {
      id: 1,
      title: "اتاق عمومی",
      description: "گفت‌وگوی آزاد بین کاربران ژنینو",
    },
    {
      id: 2,
      title: "کودکان",
      description: "گفت‌وگو درباره رشد، تربیت و دنیای کودکان",
    },
    {
      id: 3,
      title: "بانوان",
      description: "گفت‌وگو و همراهی در دنیای بانوان",
    },
    {
      id: 4,
      title: "آقایان",
      description: "گفت‌وگو و همراهی در دنیای آقایان",
    },
  ];

  for (const room of rooms) {
    await prisma.chatRoom.upsert({
      where: { id: room.id },
      update: {
        title: room.title,
        description: room.description,
        isActive: true,
      },
      create: {
        id: room.id,
        title: room.title,
        description: room.description,
        isActive: true,
      },
    });
  }

  console.log("✅ Fixed chat rooms seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed chat rooms failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });