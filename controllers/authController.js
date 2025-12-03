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

// 📌 POST /api/auth/register — نسخه کامل ژنینو
exports.register = async (req, res, prisma) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      birthDate,     // فعلاً string ذخیره می‌کنیم (گزینه C)
      province,
      city,
      phone,
      email,
      username,
      nationalCode,
      password,
    } = req.body;

    // 🔸 اعتبارسنجی اولیه
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        ok: false,
        message: "فیلدهای نام، نام خانوادگی، ایمیل و رمز عبور الزامی هستند.",
      });
    }

    // 🔸 چک تکراری بودن ایمیل
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(409).json({
        ok: false,
        message: "این ایمیل قبلاً در ژنینو ثبت شده است.",
      });
    }

    // 🔸 چک تکراری بودن شماره موبایل
    if (phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) {
        return res.status(409).json({
          ok: false,
          message: "این شماره موبایل قبلاً ثبت شده است.",
        });
      }
    }

    // 🔸 چک تکراری بودن نام کاربری
    if (username) {
      const userExists = await prisma.user.findUnique({ where: { username } });
      if (userExists) {
        return res.status(409).json({
          ok: false,
          message: "این نام کاربری قبلاً ثبت شده است.",
        });
      }
    }

    // 🔸 چک تکراری بودن کد ملی
    if (nationalCode) {
      const ncExists = await prisma.user.findUnique({ where: { nationalCode } });
      if (ncExists) {
        return res.status(409).json({
          ok: false,
          message: "این کد ملی قبلاً ثبت شده است.",
        });
      }
    }

    // 🔸 ساخت fullName
    const fullName = `${firstName} ${lastName}`;

    // 🔸 هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔸 ساخت کاربر در Prisma
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        fullName,
        gender,
        birthDate,   // فعلاً string طبق گزینه C
        province,
        city,
        phone,
        email,
        username,
        nationalCode,
        password: hashedPassword,
      },
    });

    // 🔸 ساخت توکن
    const token = generateToken(user);

    // 🔸 خروجی نهایی
    return res.status(201).json({
      ok: true,
      message: "ثبت‌نام در ژنینو با موفقیت انجام شد.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        gender: user.gender,
        province: user.province,
        city: user.city,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در ثبت‌نام.",
    });
  }
};


// 📌 POST /api/auth/login
exports.login = async (req, res, prisma) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "ایمیل و پسورد الزامی است.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "ایمیل یا پسورد اشتباه است.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "ایمیل یا پسورد اشتباه است.",
      });
    }

    const token = generateToken(user);

    return res.json({
      ok: true,
      message: "ورود به ژنینو با موفقیت انجام شد.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور در ورود.",
    });
  }
};
