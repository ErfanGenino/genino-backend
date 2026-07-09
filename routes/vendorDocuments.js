// routes/vendorDocuments.js

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  addVendorDocument,
  deleteVendorDocument,
  listVendorDocuments,
} = require("../controllers/vendorDocumentController");

module.exports = function (prisma) {
  const router = express.Router();

  router.get("/:vendorId/documents", authMiddleware, (req, res) =>
    listVendorDocuments(req, res, prisma)
  );

  router.post("/:vendorId/documents", authMiddleware, (req, res) =>
    addVendorDocument(req, res, prisma)
  );

  router.delete("/:vendorId/documents/:documentId", authMiddleware, (req, res) =>
    deleteVendorDocument(req, res, prisma)
  );

  return router;
};