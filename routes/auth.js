// routes/auth.js

const express = require("express");
const { register, login, getProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // ثبت‌نام
  router.post("/register", (req, res) => register(req, res, prisma));

  // لاگین
  router.post("/login", (req, res) => login(req, res, prisma));

  // دریافت پروفایل کاربر (نیازمند توکن)
  router.get("/profile", authMiddleware, (req, res) => getProfile(req, res, prisma));

  return router;
};
