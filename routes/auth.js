// routes/auth.js

const express = require("express");
const {
  register,
  login,
  getProfile,
  updateLifeStage
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  router.post("/register", (req, res) => register(req, res, prisma));
  router.post("/login", (req, res) => login(req, res, prisma));
  router.get("/profile", authMiddleware, (req, res) => getProfile(req, res, prisma));

  // ⭐ مسیر جدید برای آپدیت مرحله زندگی
  router.put("/update-life-stage", authMiddleware, (req, res) =>
    updateLifeStage(req, res, prisma)
  );

  return router;
};
