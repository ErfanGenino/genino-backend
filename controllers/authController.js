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

// 📌 POST /api/auth/register
exports.register = async (req, res, prisma) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "ایمیل و پسورد الزامی است.",
      });
    }

    // چک وجود کاربر
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "این ایمیل قبلاً در ژنینو ثبت شده است.",
      });
    }

    // هش کردن پسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // ساخت کاربر
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      ok: true,
      message: "ثبت‌نام در ژنینو با موفقیت انجام شد.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
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
