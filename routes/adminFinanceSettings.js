const express = require("express");

module.exports = function (prisma) {
  const router = express.Router();

  const DEFAULT_SETTINGS = {
    ambassadorVendorDiscountAmount: 5000000,
    ambassadorSubscriptionCommissionPercent: 50,
    ambassadorSalesCommissionPercent: 1,
  };

  async function getOrCreateSettings() {
    let settings = await prisma.financeSetting.findFirst({
      orderBy: { id: "asc" },
    });

    if (!settings) {
      settings = await prisma.financeSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return settings;
  }

  router.get("/", async (req, res) => {
    try {
      const settings = await getOrCreateSettings();

      return res.json({
        ok: true,
        settings,
      });
    } catch (err) {
      console.error("ADMIN FINANCE SETTINGS GET ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور.",
      });
    }
  });

  router.put("/", async (req, res) => {
    try {
      const {
        ambassadorVendorDiscountAmount,
        ambassadorSubscriptionCommissionPercent,
        ambassadorSalesCommissionPercent,
      } = req.body;

      const vendorDiscountAmount = Number(ambassadorVendorDiscountAmount);
      const subscriptionCommissionPercent = Number(
        ambassadorSubscriptionCommissionPercent
      );
      const salesCommissionPercent = Number(ambassadorSalesCommissionPercent);

      if (Number.isNaN(vendorDiscountAmount) || vendorDiscountAmount < 0) {
        return res.status(400).json({
          ok: false,
          message: "مبلغ تخفیف سفیر معتبر نیست.",
        });
      }

      if (
        Number.isNaN(subscriptionCommissionPercent) ||
        subscriptionCommissionPercent < 0 ||
        subscriptionCommissionPercent > 100
      ) {
        return res.status(400).json({
          ok: false,
          message: "درصد پورسانت اشتراک سفیر باید بین ۰ تا ۱۰۰ باشد.",
        });
      }

      if (
        Number.isNaN(salesCommissionPercent) ||
        salesCommissionPercent < 0 ||
        salesCommissionPercent > 100
      ) {
        return res.status(400).json({
          ok: false,
          message: "درصد پورسانت فروش سفیر باید بین ۰ تا ۱۰۰ باشد.",
        });
      }

      const currentSettings = await getOrCreateSettings();

      const settings = await prisma.financeSetting.update({
        where: { id: currentSettings.id },
        data: {
          ambassadorVendorDiscountAmount: vendorDiscountAmount,
          ambassadorSubscriptionCommissionPercent:
            subscriptionCommissionPercent,
          ambassadorSalesCommissionPercent: salesCommissionPercent,
        },
      });

      return res.json({
        ok: true,
        settings,
      });
    } catch (err) {
      console.error("ADMIN FINANCE SETTINGS UPDATE ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور.",
      });
    }
  });

  return router;
};