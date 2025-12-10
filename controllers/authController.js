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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok:false, message:"ایمیل و پسورد الزامی است." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ ok:false, message:"ایمیل یا پسورد اشتباه است." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ ok:false, message:"ایمیل یا پسورد اشتباه است." });
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
    return res.status(500).json({ ok:false, message:"خطای داخلی سرور." });
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
        email: user.email,
        fullName: user.fullName,
        lifeStage: user.lifeStage || "user",
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
