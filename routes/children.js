// routes/children.js

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // GET /api/children
  // گرفتن لیست کودکان کاربر لاگین‌شده
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;

      const children = await prisma.child.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      res.json(children);
    } catch (error) {
      console.error("❌ Error fetching children:", error);
      res.status(500).json({
        message: "خطا در دریافت لیست کودکان",
      });
    }
  });

  return router;
};
