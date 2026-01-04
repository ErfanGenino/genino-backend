import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateChildAdmins() {
  const children = await prisma.child.findMany({
    include: {
      user: true,
      admins: true,
    },
  });

  let createdCount = 0;

  for (const child of children) {
    // اگر قبلاً ادمین دارد، رد شو
    if (child.admins.length > 0) continue;

    let role = "parent";

    if (child.user?.gender === "male") role = "father";
    else if (child.user?.gender === "female") role = "mother";

    await prisma.childAdmin.create({
      data: {
        childId: child.id,
        userId: child.userId,
        role,
        isPrimary: true,
      },
    });

    createdCount++;
  }

  console.log(`✅ Migration done. ChildAdmin created: ${createdCount}`);
}

migrateChildAdmins()
  .catch((e) => {
    console.error("❌ Migration error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
