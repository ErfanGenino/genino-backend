require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("GeninoAdmin@1405", 10);

  const admin = await prisma.adminUser.upsert({
    where: { username: "genino-admin" },
    update: {},
    create: {
      username: "genino-admin",
      password: hashedPassword,
      fullName: "مدیر اصلی ژنینو",
      email: "admin@genino.ir",
      isSuperAdmin: true,
      isActive: true,
    },
  });

  console.log("Super Admin created:", admin.username);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });