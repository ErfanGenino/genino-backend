require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      code: "OPENING_1405",
      title: "بسته افتتاحیه ۱۴۰۵",
      description: "۳۰ پنجره، یک صفحه اختصاصی، اعتبار ۲ ساله",
      targetType: "SHOP",
      hasDedicatedPage: true,
      windowCount: 30,
      durationMonths: 24,
      price: 2000000,
      sortOrder: 1,
    },
    {
      code: "SHOP_STANDARD",
      title: "بسته سالانه فروشگاه",
      description: "۲۰ پنجره، یک صفحه اختصاصی، اعتبار ۱ ساله",
      targetType: "SHOP",
      hasDedicatedPage: true,
      windowCount: 20,
      durationMonths: 12,
      price: 3000000,
      sortOrder: 2,
    },
    {
      code: "SERVICE_PROVIDER",
      title: "بسته ارائه‌دهندگان کالا و خدمات",
      description: "صفحه اختصاصی، ۳۰۰ مجوز دستاورد، اعتبار ۱ ساله",
      targetType: "SERVICE",
      hasDedicatedPage: true,
      achievementLimit: 300,
      durationMonths: 12,
      price: 6000000,
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    await prisma.vendorPackage.upsert({
      where: {
        code: pkg.code,
      },
      update: pkg,
      create: pkg,
    });
  }

  console.log("Vendor packages seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });