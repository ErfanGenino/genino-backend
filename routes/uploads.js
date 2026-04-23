const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPresignedAvatarUpload,
  createPresignedMedicalAttachmentUpload,
  createPresignedChatImageUpload,
  createPresignedChatRoomImageUpload,
  createPresignedChatVoiceUpload,
} = require("../controllers/uploadController");

module.exports = function () {
  const router = express.Router();

  router.post(
    "/presign/avatar",
    authMiddleware,
    createPresignedAvatarUpload
  );

  router.post(
    "/presign/medical-attachment",
    authMiddleware,
    createPresignedMedicalAttachmentUpload
  );

  router.post(
    "/presign/chat-image",
    authMiddleware,
    createPresignedChatImageUpload
  );

  router.post(
    "/presign/chat-room-image",
    authMiddleware,
    createPresignedChatRoomImageUpload
  );

  router.post(
    "/presign/chat-voice",
    authMiddleware,
    createPresignedChatVoiceUpload
  );

  return router;
};