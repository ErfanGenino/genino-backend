// routes/auth.js

const express = require("express");
const { register, login } = require("../controllers/authController");

module.exports = function (prisma) {
  const router = express.Router();

  // ثبت‌نام
  router.post("/register", (req, res) => register(req, res, prisma));

  // لاگین
  router.post("/login", (req, res) => login(req, res, prisma));

  return router;
};
