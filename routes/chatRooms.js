// routes/chatRooms.js

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getChatRooms,
  createChatRoom,
  getRoomMessages,
  sendRoomMessage,
  deleteRoomMessage,
  reactToRoomMessage,
  upsertRoomPresence,
  getRoomPresence,
  deleteChatRoom,
  updateChatRoom,
  addFavoriteChatRoom,
  removeFavoriteChatRoom,
  getMyFavoriteChatRooms,
  muteRoomUser,
  unmuteRoomUser,
  getMutedRoomUsers,
} = require("../controllers/chatRoomController");

module.exports = function (prisma) {
  const router = express.Router();

  router.get("/", authMiddleware, (req, res) =>
    getChatRooms(req, res, prisma)
  );

  router.post("/", authMiddleware, (req, res) =>
    createChatRoom(req, res, prisma)
  );

  router.get("/favorites/me", authMiddleware, (req, res) =>
    getMyFavoriteChatRooms(req, res, prisma)
  );

  router.post("/:roomId/favorite", authMiddleware, (req, res) =>
    addFavoriteChatRoom(req, res, prisma)
  );

  router.delete("/:roomId/favorite", authMiddleware, (req, res) =>
    removeFavoriteChatRoom(req, res, prisma)
  );

  router.get("/:roomId/messages", authMiddleware, (req, res) =>
    getRoomMessages(req, res, prisma)
  );

  router.post("/:roomId/messages", authMiddleware, (req, res) =>
    sendRoomMessage(req, res, prisma)
  );

  router.delete("/messages/:messageId", authMiddleware, (req, res) =>
    deleteRoomMessage(req, res, prisma)
  );

  router.post("/messages/:messageId/reaction", authMiddleware, (req, res) =>
    reactToRoomMessage(req, res, prisma)
  );

  router.post("/:roomId/presence", authMiddleware, (req, res) =>
    upsertRoomPresence(req, res, prisma)
  );

  router.get("/:roomId/presence", authMiddleware, (req, res) =>
    getRoomPresence(req, res, prisma)
  );

  router.delete("/:roomId", authMiddleware, (req, res) =>
    deleteChatRoom(req, res, prisma)
  );

  router.put("/:roomId", authMiddleware, (req, res) =>
    updateChatRoom(req, res, prisma)
  );

  router.get("/:roomId/mutes", authMiddleware, (req, res) =>
    getMutedRoomUsers(req, res, prisma)
  );

  router.post("/:roomId/mutes/:userId", authMiddleware, (req, res) =>
    muteRoomUser(req, res, prisma)
  );

  router.delete("/:roomId/mutes/:userId", authMiddleware, (req, res) =>
    unmuteRoomUser(req, res, prisma)
  );
  

  return router;
};