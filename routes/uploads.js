// routes/uploads.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPresignedAvatarUpload,
} = require("../controllers/uploadController");

module.exports = function () {
  const router = express.Router();

  // ✅ ساخت لینک امن آپلود آواتار
  router.post("/presign/avatar", authMiddleware, createPresignedAvatarUpload);

  return router;
};
