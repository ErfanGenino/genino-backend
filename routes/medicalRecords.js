// routes/medicalRecords.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordById,
} = require("../controllers/medicalRecordController");
const { addMedicalAttachment } = require("../controllers/medicalAttachmentController");

module.exports = function (prisma) {
  const router = express.Router();

  // لیست گزارش‌ها
  router.get("/", authMiddleware, (req, res) =>
    listMedicalRecords(req, res, prisma)
  );

  // جزئیات یک گزارش
  router.get("/:id", authMiddleware, (req, res) =>
    getMedicalRecordById(req, res, prisma)
  );

  // ساخت گزارش
  router.post("/", authMiddleware, (req, res) =>
    createMedicalRecord(req, res, prisma)
  );

  // ویرایش گزارش
  router.put("/:id", authMiddleware, (req, res) =>
    updateMedicalRecord(req, res, prisma)
  );

  // حذف گزارش
  router.delete("/:id", authMiddleware, (req, res) =>
    deleteMedicalRecord(req, res, prisma)
  );

  // افزودن فایل به یک رکورد پزشکی
  router.post("/:id/attachments", authMiddleware, (req, res) =>
  addMedicalAttachment(req, res, prisma)
  );

  return router;
};