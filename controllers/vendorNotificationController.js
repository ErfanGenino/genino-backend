async function getVendorNotifications(req, res, prisma) {
  try {
    const vendorId = Number(req.vendor.id);

    if (!vendorId) {
      return res.status(401).json({
        ok: false,
        message: "دسترسی فروشنده معتبر نیست",
      });
    }

    const notifications = await prisma.vendorNotification.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({ ok: true, notifications });
  } catch (err) {
    console.error("GET VENDOR NOTIFICATIONS ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطا در دریافت اعلان‌های فروشنده",
    });
  }
}

async function markVendorNotificationRead(req, res, prisma) {
  try {
    const vendorId = Number(req.vendor.id);
    const id = Number(req.params.id);

    if (!vendorId || !id) {
      return res.status(400).json({ ok: false, message: "اطلاعات ناقص است" });
    }

    await prisma.vendorNotification.updateMany({
      where: { id, vendorId },
      data: { read: true },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("READ VENDOR NOTIFICATION ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطا در خواندن اعلان فروشنده",
    });
  }
}

async function deleteVendorNotification(req, res, prisma) {
  try {
    const vendorId = Number(req.vendor.id);
    const id = Number(req.params.id);

    if (!vendorId || !id) {
      return res.status(400).json({ ok: false, message: "اطلاعات ناقص است" });
    }

    await prisma.vendorNotification.deleteMany({
      where: { id, vendorId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE VENDOR NOTIFICATION ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطا در حذف اعلان فروشنده",
    });
  }
}

async function clearVendorNotifications(req, res, prisma) {
  try {
    const vendorId = Number(req.vendor.id);

    if (!vendorId) {
      return res.status(401).json({
        ok: false,
        message: "دسترسی فروشنده معتبر نیست",
      });
    }

    await prisma.vendorNotification.deleteMany({
      where: { vendorId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("CLEAR VENDOR NOTIFICATIONS ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطا در حذف اعلان‌های فروشنده",
    });
  }
}

module.exports = {
  getVendorNotifications,
  markVendorNotificationRead,
  deleteVendorNotification,
  clearVendorNotifications,
};