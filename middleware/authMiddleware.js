// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-genino-secret"; // ✅ مثل authController

module.exports = function (req, res, next) {
  try {
    // 1) گرفتن توکن از هدر درخواست
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: "توکن ارسال نشده است.",
      });
    }

    // 2) جدا کردن Bearer و گرفتن توکن
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "توکن نامعتبر است.",
      });
    }

    // 3) بررسی صحت توکن
    const decoded = jwt.verify(token, JWT_SECRET); // ✅ این خط مهمه

    // 4) قرار دادن کاربر داخل req برای استفاده در کنترلرها
    req.user = decoded;

    next(); // اجازه عبور به مرحله بعد
  } catch (err) {
    console.error("JWT Error:", err);

    return res.status(401).json({
      ok: false,
      message: "توکن منقضی یا نامعتبر است.",
    });
  }
};