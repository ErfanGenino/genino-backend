const express = require("express");
const vendorAuthMiddleware = require("../middleware/vendorAuthMiddleware");

const {
  getVendorNotifications,
  markVendorNotificationRead,
  deleteVendorNotification,
  clearVendorNotifications,
} = require("../controllers/vendorNotificationController");

module.exports = function (prisma) {
  const router = express.Router();

  // دریافت همه اعلان‌ها
  router.get(
  "/",
  vendorAuthMiddleware,
  (req, res) => getVendorNotifications(req, res, prisma)
);

  // خوانده شدن یک اعلان
  router.patch(
  "/:id/read",
  vendorAuthMiddleware,
  (req, res) => markVendorNotificationRead(req, res, prisma)
);

  // حذف یک اعلان
  router.delete(
  "/:id",
  vendorAuthMiddleware,
  (req, res) => deleteVendorNotification(req, res, prisma)
);

  // حذف همه اعلان‌ها
  router.delete(
  "/",
  vendorAuthMiddleware,
  (req, res) => clearVendorNotifications(req, res, prisma)
);

  return router;
};