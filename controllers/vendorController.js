// controllers/vendorController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev-genino-secret";

// تبدیل تاریخ شمسی فارسی به Date ساده
function convertPersianDate(persianDate) {
  if (!persianDate) return null;

  const persianNumbers = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  const normalized = persianDate.replace(/[۰-۹٠-٩]/g, (d) => persianNumbers[d]);
  const [jy, jm, jd] = normalized.split("/").map(Number);

  if (!jy || !jm || !jd) return null;

  const gy = jy + 621 - (jm < 3 || (jm === 3 && jd < 21) ? 1 : 0);
  return new Date(`${gy}-${String(jm).padStart(2, "0")}-${String(jd).padStart(2, "0")}T00:00:00Z`);
}

exports.registerVendor = async (req, res, prisma) => {
  try {
    const {
      personType,
      activityType,
      mainActivityField,
      extraActivityFields,
      firstName,
      lastName,
      nationalCode,
      birthDate,
      legalCompanyName,
      companyType,
      managerName,
      registrationNumber,
      registrationDate,
      nationalId,
      economicCode,
      companyName,
      email,
      phone,
      password,
      province,
      city,
    } = req.body;

    if (!personType || !activityType || !mainActivityField || !companyName || !email || !phone || !password) {
      return res.status(400).json({
        ok: false,
        message: "اطلاعات اصلی ثبت‌نام فروشنده کامل نیست.",
      });
    }

    const existingEmail = await prisma.vendorAccount.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({
        ok: false,
        message: "این ایمیل قبلاً برای یک حساب فروشنده ثبت شده است.",
      });
    }

    const existingPhone = await prisma.vendorAccount.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(409).json({
        ok: false,
        message: "این شماره موبایل قبلاً برای یک حساب فروشنده ثبت شده است.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = await prisma.vendorAccount.create({
      data: {
        personType,
        activityType,
        mainActivityField,
        extraActivityFields: extraActivityFields || [],

        firstName: personType === "real" ? firstName : null,
        lastName: personType === "real" ? lastName : null,
        nationalCode: personType === "real" ? nationalCode : null,
        birthDate: personType === "real" ? convertPersianDate(birthDate) : null,

        legalCompanyName: personType === "legal" ? legalCompanyName : null,
        companyType: personType === "legal" ? companyType : null,
        managerName: personType === "legal" ? managerName : null,
        registrationNumber: personType === "legal" ? registrationNumber : null,
        registrationDate:
          personType === "legal" ? convertPersianDate(registrationDate) : null,
        nationalId: personType === "legal" ? nationalId : null,
        economicCode: personType === "legal" ? economicCode : null,

        businessName: companyName,

        email,
        phone,
        password: hashedPassword,

        province,
        city,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "ثبت‌نام اولیه فروشنده با موفقیت انجام شد.",
      vendor: {
        id: vendor.id,
        personType: vendor.personType,
        businessName: vendor.businessName,
        accountStatus: vendor.accountStatus,
        publishStatus: vendor.publishStatus,
      },
    });
  } catch (err) {
    console.error("REGISTER VENDOR ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در ثبت‌نام فروشنده.",
    });
  }
};

exports.getVendorById = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.id);

    if (!vendorId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه فروشنده معتبر نیست.",
      });
    }

    const vendor = await prisma.vendorAccount.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        personType: true,

        firstName: true,
        lastName: true,

        legalCompanyName: true,
        managerName: true,

        businessName: true,
        activityType: true,
        mainActivityField: true,

        accountStatus: true,
        publishStatus: true,
        packageStatus: true,
        paymentStatus: true,
        documentsStatus: true,
        reviewStatus: true,
        contractAccepted: true,
        contractAcceptedAt: true,

        selectedPackageId: true,
        selectedPackageTitle: true,
        selectedPackagePrice: true,
        selectedPackageFinalPrice: true,

        selectedDiscountCode: true,
        selectedDiscountPercent: true,

        selectedAmbassadorCode: true,
        selectedAmbassadorName: true,
        selectedAmbassadorPhone: true,
        selectedAmbassadorDiscountAmount: true,

        province: true,
        city: true,

        shopHeaderImages: true,

        bankName: true,
        accountNumber: true,
        cardNumber: true,
        shebaNumber: true,

        bankInfoConfirmed: true,
        bankInfoConfirmedAt: true,

        createdAt: true,

        rejectionReason: true,
        correctionReason: true,
        correctionFields: true,
        suspensionReason: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد.",
      });
    }

    return res.json({
      ok: true,
      vendor,
    });
  } catch (err) {
    console.error("GET VENDOR BY ID ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در دریافت اطلاعات فروشنده.",
    });
  }
};

exports.loginVendor = async (req, res, prisma) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        ok: false,
        message: "ایمیل یا شماره موبایل و رمز عبور الزامی است.",
      });
    }

    let vendor = null;

    if (identifier.includes("@")) {
      vendor = await prisma.vendorAccount.findUnique({
        where: { email: identifier },
      });
    } else {
      vendor = await prisma.vendorAccount.findUnique({
        where: { phone: identifier },
      });
    }

    if (!vendor) {
      return res.status(401).json({
        ok: false,
        message: "اطلاعات ورود فروشنده نادرست است.",
      });
    }

    const isValid = await bcrypt.compare(password, vendor.password);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "اطلاعات ورود فروشنده نادرست است.",
      });
    }

    const token = jwt.sign(
  {
    vendorId: vendor.id,
    type: "vendor",
  },
  JWT_SECRET,
  {
    expiresIn: "30d",
  }
);


    return res.json({
      ok: true,
      token,
      message: "ورود فروشنده با موفقیت انجام شد.",
      vendor: {
        id: vendor.id,
        personType: vendor.personType,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        legalCompanyName: vendor.legalCompanyName,
        managerName: vendor.managerName,
        businessName: vendor.businessName,
        accountStatus: vendor.accountStatus,
        publishStatus: vendor.publishStatus,
      },
    });
  } catch (err) {
    console.error("LOGIN VENDOR ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در ورود فروشنده.",
    });
  }
};


exports.confirmVendorPackage = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.id);

    const {
      packageId,
      ambassadorCode,
      discountCode,
      finalPrice,
    } = req.body;

    if (!vendorId || !packageId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه فروشنده و بسته همکاری الزامی است.",
      });
    }

    const vendor = await prisma.vendorAccount.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد.",
      });
    }

    const vendorPackage = await prisma.vendorPackage.findUnique({
      where: { id: Number(packageId) },
    });

    if (!vendorPackage || !vendorPackage.isActive) {
      return res.status(404).json({
        ok: false,
        message: "بسته همکاری معتبر نیست.",
      });
    }

    const financeSettings = await prisma.financeSetting.findFirst({
      orderBy: { id: "asc" },
    });

    const ambassadorDiscountAmount =
      financeSettings?.ambassadorVendorDiscountAmount || 0;

    const subscriptionCommissionPercent =
      financeSettings?.ambassadorSubscriptionCommissionPercent || 0;

    const salesCommissionPercent =
      financeSettings?.ambassadorSalesCommissionPercent || 0;

    let ambassador = null;

    if (ambassadorCode) {
      ambassador = await prisma.ambassador.findUnique({
  where: {
    ambassadorCode: ambassadorCode.trim().toUpperCase(),
  },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
      },
    },
  },
});

      if (!ambassador || ambassador.status !== "ACTIVE") {
        return res.status(400).json({
          ok: false,
          message: "کد سفیر معتبر نیست یا سفیر فعال نیست.",
        });
      }

      const activeRelation = await prisma.ambassadorVendor.findFirst({
        where: {
          vendorId: vendor.id,
          status: "ACTIVE",
        },
      });

      if (activeRelation && activeRelation.ambassadorId !== ambassador.id) {
  return res.status(400).json({
    ok: false,
    message:
      "این کسب‌وکار پیش‌تر از طریق سفیر دیگری به ژنینو معرفی شده است. با هدف حفظ حقوق و تلاش سفیران ژنینو، امکان استفاده از کد سفیر دیگر برای این فروشنده وجود ندارد.",
  });
}
    }

    const subscriptionBaseAmount = ambassador
      ? Math.max(vendorPackage.price - ambassadorDiscountAmount, 0)
      : vendorPackage.price;

    const subscriptionCommissionAmount = ambassador
      ? Math.round(
          subscriptionBaseAmount *
            (subscriptionCommissionPercent / 100)
        )
      : 0;

    const updatedVendor = await prisma.vendorAccount.update({
      where: { id: vendor.id },
      data: {
        packageStatus: "SELECTED",
        paymentStatus: Number(finalPrice) === 0 ? "PAID" : "UNPAID",
        accountStatus: Number(finalPrice) === 0 ? "PAID" : "PACKAGE_SELECTED",
        packageSelectedAt: new Date(),
        paidAt: Number(finalPrice) === 0 ? new Date() : null,
        selectedPackageId: vendorPackage.id,
selectedPackageTitle: vendorPackage.title,
selectedPackagePrice: vendorPackage.price,
selectedPackageFinalPrice: Number(finalPrice),

selectedDiscountCode: discountCode || null,

selectedAmbassadorCode: ambassador?.ambassadorCode || null,

selectedAmbassadorName: ambassador
  ? ambassador.user?.fullName ||
    `${ambassador.user?.firstName || ""} ${ambassador.user?.lastName || ""}`.trim() ||
    "سفیر ژنینو"
  : null,

selectedAmbassadorPhone:
  ambassador?.user?.phone ||
  ambassador?.phone ||
  "",

selectedAmbassadorDiscountAmount:
  ambassador ? ambassadorDiscountAmount : 0,

      },
    });

    let ambassadorVendor = null;

    if (ambassador) {
      ambassadorVendor = await prisma.ambassadorVendor.create({
        data: {
          ambassadorId: ambassador.id,
          vendorId: vendor.id,
          ambassadorCode: ambassador.ambassadorCode,

          packageId: vendorPackage.id,
          packageTitle: vendorPackage.title,
          packagePrice: vendorPackage.price,

          ambassadorDiscountAmount,

          subscriptionCommissionBaseAmount: subscriptionBaseAmount,
          subscriptionCommissionPercent,
          subscriptionCommissionAmount,

          salesCommissionPercent,
          payableCommissionAmount: subscriptionCommissionAmount,

          status: "ACTIVE",
        },
      });

      await prisma.ambassador.update({
        where: { id: ambassador.id },
        data: {
          customersCount: { increment: 1 },
          totalCommission: { increment: subscriptionCommissionAmount },
          payableCommission: { increment: subscriptionCommissionAmount },
        },
      });
    }

    return res.json({
      ok: true,
      message: "بسته همکاری با موفقیت ثبت شد.",
      vendor: updatedVendor,
      ambassadorVendor,
    });
  } catch (err) {
    console.error("CONFIRM VENDOR PACKAGE ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در ثبت بسته همکاری.",
    });
  }
};

exports.updateVendorBankingInfo = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.id);

    const {
      bankName,
      accountNumber,
      cardNumber,
      shebaNumber,
    } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه فروشنده معتبر نیست.",
      });
    }

    if (
      !bankName ||
      !accountNumber ||
      !cardNumber ||
      !shebaNumber
    ) {
      return res.status(400).json({
        ok: false,
        message: "تمام اطلاعات بانکی الزامی است.",
      });
    }

    const vendor = await prisma.vendorAccount.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد.",
      });
    }

    const updatedVendor = await prisma.vendorAccount.update({
      where: { id: vendorId },
      data: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        cardNumber: cardNumber.trim(),
        shebaNumber: shebaNumber.trim(),

        bankInfoConfirmed: true,
        bankInfoConfirmedAt: new Date(),
      },
    });

    return res.json({
      ok: true,
      message: "اطلاعات بانکی با موفقیت ذخیره شد.",
      vendor: updatedVendor,
    });
  } catch (err) {
    console.error("UPDATE VENDOR BANKING ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در ذخیره اطلاعات بانکی.",
    });
  }
};

exports.acceptVendorContract = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.id);

    const vendor = await prisma.vendorAccount.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد",
      });
    }

    const updated = await prisma.vendorAccount.update({
      where: { id: vendorId },
      data: {
        contractAccepted: true,
        contractAcceptedAt: new Date(),

        accountStatus: "CONTRACT_AND_DOCUMENTS_SUBMITTED",
        documentsStatus: "SUBMITTED",
        reviewStatus: "UNDER_REVIEW",

        reviewStartedAt: new Date(),
        documentsSubmittedAt: new Date(),

        correctionReason: null,
        correctionFields: [],
        rejectionReason: null,
      },
    });

    return res.json({
      ok: true,
      message: "قرارداد با موفقیت ثبت شد",
      vendor: updated,
    });
  } catch (err) {
    console.error("ACCEPT CONTRACT ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطا در ثبت قرارداد",
    });
  }
};
