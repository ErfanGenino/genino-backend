// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-genino-secret";

// توکن‌ساز
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// تبدیل تاریخ شمسی فارسی به تاریخ میلادی ISO
function convertPersianDate(persianDate) {
  if (!persianDate) return null;

  const persianNumbers = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  const normalized = persianDate.replace(/[۰-۹٠-٩]/g, d => persianNumbers[d]);
  const [jy, jm, jd] = normalized.split("/").map(Number);
  const gy = jy + 621 - (jm < 3 || (jm === 3 && jd < 21) ? 1 : 0);
  const iso = `${gy}-${String(jm).padStart(2,"0")}-${String(jd).padStart(2,"0")}T00:00:00Z`;

  return new Date(iso);
}

// 📌 REGISTER
exports.register = async (req, res, prisma) => {
  try {
    const {
      firstName, lastName, gender, birthDate,
      province, city, phone, email, username,
      nationalCode, password
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        ok: false,
        message: "فیلدهای نام، نام خانوادگی، ایمیل و رمز عبور الزامی هستند.",
      });
    }

    // چک کردن تکراری بودن‌ها
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ ok:false, message:"این ایمیل قبلاً ثبت شده است." });
    }
    if (phone && await prisma.user.findUnique({ where: { phone } })) {
      return res.status(409).json({ ok:false, message:"این شماره موبایل قبلاً ثبت شده است." });
    }
    if (username && await prisma.user.findUnique({ where: { username } })) {
      return res.status(409).json({ ok:false, message:"این نام کاربری قبلاً ثبت شده است." });
    }
    if (nationalCode && await prisma.user.findUnique({ where: { nationalCode } })) {
      return res.status(409).json({ ok:false, message:"این کد ملی قبلاً ثبت شده است." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let birthDateValue = null;
    if (birthDate) {
      birthDateValue = convertPersianDate(birthDate);
      if (isNaN(birthDateValue.getTime())) {
        return res.status(400).json({ ok:false, message:"فرمت تاریخ تولد معتبر نیست." });
      }
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        gender,
        birthDate: birthDateValue,
        province,
        city,
        phone,
        email,
        username,
        nationalCode,
        password: hashedPassword,
        lifeStage: "user",
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      ok: true,
      message: "ثبت‌نام با موفقیت انجام شد.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        lifeStage: user.lifeStage,
      },
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ ok:false, message:"خطای داخلی سرور." });
  }
};

// 📌 LOGIN
exports.login = async (req, res, prisma) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        ok: false,
        message: "نام کاربری، ایمیل یا موبایل و رمز عبور الزامی است.",
      });
    }

    let user = null;

    // تشخیص نوع identifier
    if (identifier.includes("@")) {
      // ایمیل
      user = await prisma.user.findUnique({
        where: { email: identifier },
      });
    } else if (/^\d{10,15}$/.test(identifier)) {
      // موبایل (عدد ۱۰ تا ۱۵ رقمی)
      user = await prisma.user.findUnique({
        where: { phone: identifier },
      });
    } else {
      // username
      user = await prisma.user.findUnique({
        where: { username: identifier },
      });
    }

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "اطلاعات ورود نادرست است.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "اطلاعات ورود نادرست است.",
      });
    }

    const token = generateToken(user);

    return res.json({
      ok: true,
      message: "ورود موفقیت‌آمیز.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        lifeStage: user.lifeStage,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
};


// 📌 GET PROFILE
exports.getProfile = async (req, res, prisma) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user) {
      return res.status(404).json({ ok:false, message:"کاربر پیدا نشد." });
    }

    return res.json({
  ok: true,
  user: {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    username: user.username,
    gender: user.gender,
    birthDate: user.birthDate,
    province: user.province,
    city: user.city,
    lifeStage: user.lifeStage || "user",
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl,
  },
});
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    return res.status(500).json({ ok:false, message:"خطای داخلی سرور." });
  }
};


// 📌 UPDATE LIFE STAGE
exports.updateLifeStage = async (req, res, prisma) => {
  try {
    const { lifeStage } = req.body;

    const allowed = ["user", "single", "couple", "pregnancy", "parent"];
    if (!allowed.includes(lifeStage)) {
      return res.status(400).json({ ok:false, message:"مرحله زندگی معتبر نیست." });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { lifeStage },
    });

    return res.json({
      ok: true,
      message: "مرحله زندگی ذخیره شد.",
      lifeStage: updated.lifeStage,
    });

  } catch (err) {
    console.error("UPDATE LIFE STAGE ERROR:", err);
    return res.status(500).json({ ok:false, message:"خطای سرور." });
  }
};

// 📌 UPDATE PROFILE (me)
exports.updateProfile = async (req, res, prisma) => {
  try {
    const userId = req.user.userId;

    const {
      firstName,
      lastName,
      gender,
      birthDate,
      province,
      city,
      username,
      phone,
      avatarUrl,
      lifeStage,
    } = req.body;

    // ✅ فقط همین stage ها مجازند
    const allowedStages = ["user", "single", "couple", "pregnancy", "parent"];
    if (lifeStage && !allowedStages.includes(lifeStage)) {
      return res.status(400).json({ ok: false, message: "مرحله زندگی معتبر نیست." });
    }

    // ✅ آماده‌سازی داده‌های قابل آپدیت (فقط whitelist)
    const data = {};

    if (typeof firstName === "string") data.firstName = firstName.trim();
    if (typeof lastName === "string") data.lastName = lastName.trim();

    // fullName را هم هماهنگ نگه داریم
    if (data.firstName || data.lastName) {
      // اول کاربر فعلی را بگیر تا اگر یکی از فیلدها نیامده بود، خراب نشود
      const current = await prisma.user.findUnique({ where: { id: userId } });
      const fn = (data.firstName ?? current.firstName ?? "").trim();
      const ln = (data.lastName ?? current.lastName ?? "").trim();
      data.fullName = `${fn} ${ln}`.trim();
    }

    if (typeof gender === "string") data.gender = gender.trim();
    if (typeof province === "string") data.province = province.trim();
    if (typeof city === "string") data.city = city.trim();
    if (typeof avatarUrl === "string") data.avatarUrl = avatarUrl.trim();

    // اگر birthDate به صورت ISO از فرانت آمد:
    if (birthDate) {
      const dt = new Date(birthDate);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({ ok: false, message: "فرمت تاریخ تولد معتبر نیست." });
      }
      data.birthDate = dt;
    }

    if (lifeStage) data.lifeStage = lifeStage;

    // ✅ نکته: username/phone را هم اجازه می‌دهیم ولی باید uniqueness چک شود
    // (اگر نمی‌خوای فعلاً قابل تغییر باشن، بگو تا ببندیمش)
    if (typeof username === "string") data.username = username.trim() || null;
    if (typeof phone === "string") data.phone = phone.trim() || null;

    // اگر هیچ چیزی برای آپدیت نیومده بود
    if (Object.keys(data).length === 0) {
      return res.json({ ok: true, message: "چیزی برای تغییر ارسال نشده است." });
    }

    // ✅ چک تکراری‌ها (فقط اگر تغییر دادن)
    if (data.username) {
      const exists = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id: userId } },
        select: { id: true },
      });
      if (exists) return res.status(409).json({ ok: false, message: "این نام کاربری قبلاً ثبت شده است." });
    }

    if (data.phone) {
      const exists = await prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id: userId } },
        select: { id: true },
      });
      if (exists) return res.status(409).json({ ok: false, message: "این شماره موبایل قبلاً ثبت شده است." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json({
      ok: true,
      message: "پروفایل با موفقیت ذخیره شد.",
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        username: updated.username,
        gender: updated.gender,
        birthDate: updated.birthDate,
        province: updated.province,
        city: updated.city,
        lifeStage: updated.lifeStage || "user",
        createdAt: updated.createdAt,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);

    // Prisma unique error (fallback)
    if (err?.code === "P2002") {
      return res.status(409).json({ ok: false, message: "اطلاعات تکراری است." });
    }

    return res.status(500).json({ ok: false, message: "خطای داخلی سرور." });
  }
};

