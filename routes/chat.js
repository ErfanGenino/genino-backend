const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listConversations,
  getConversation,
  sendMessage,
} = require("../controllers/chatController");

module.exports = function (prisma) {
  const router = express.Router();

  router.get("/", authMiddleware, (req, res) =>
    listConversations(req, res, prisma)
  );

  router.get("/:userId", authMiddleware, (req, res) =>
    getConversation(req, res, prisma)
  );

  router.post("/:userId/messages", authMiddleware, (req, res) =>
    sendMessage(req, res, prisma)
  );

  return router;
};