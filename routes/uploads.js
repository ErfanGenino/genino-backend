const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPresignedAvatarUpload,
  createPresignedMedicalAttachmentUpload,
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

  return router;
};