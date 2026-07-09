const express = require("express");

const {
  registerVendor,
  getVendorById,
  loginVendor,
  confirmVendorPackage,
  updateVendorBankingInfo,
  acceptVendorContract,
} = require("../controllers/vendorController");

module.exports = function (prisma) {
  const router = express.Router();

  router.post("/register", (req, res) =>
    registerVendor(req, res, prisma)
  );

  router.post("/login", (req, res) =>
    loginVendor(req, res, prisma)
  );

  router.post("/:id/confirm-package", (req, res) =>
  confirmVendorPackage(req, res, prisma)
);

  router.put("/:id/banking", (req, res) =>
  updateVendorBankingInfo(req, res, prisma)
);

  router.get("/:id", (req, res) =>
    getVendorById(req, res, prisma)
  );

  router.post("/:id/accept-contract", (req, res) =>
  acceptVendorContract(req, res, prisma)
);

  return router;
};