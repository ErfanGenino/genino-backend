const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  searchUsers,
  updateSocialPresence,
  getOnlineUsers,
} = require("../controllers/userController");

module.exports = function (prisma) {
  const router = express.Router();

  router.get("/search", authMiddleware, (req, res) =>
    searchUsers(req, res, prisma)
  );

  router.post("/social-presence", authMiddleware, (req, res) =>
    updateSocialPresence(req, res, prisma)
  );

  router.get("/online", authMiddleware, (req, res) =>
    getOnlineUsers(req, res, prisma)
  );

  return router;
};