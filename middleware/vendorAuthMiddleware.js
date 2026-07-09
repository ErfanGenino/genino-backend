const jwt = require("jsonwebtoken");

module.exports = async function vendorAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        message: "برای دسترسی به پنل فروشنده، ورود لازم است.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "genino-secret"
    );

    const vendorId =
      decoded.vendorId ||
      decoded.id ||
      decoded.vendor?.id;

    if (!vendorId) {
      return res.status(401).json({
        ok: false,
        message: "دسترسی فروشنده معتبر نیست.",
      });
    }

    const vendor = await req.prisma.vendorAccount.findUnique({
      where: { id: Number(vendorId) },
      select: {
        id: true,
        email: true,
        phone: true,
        businessName: true,
        accountStatus: true,
        publishStatus: true,
      },
    });

    if (!vendor) {
      return res.status(401).json({
        ok: false,
        message: "حساب فروشنده پیدا نشد.",
      });
    }

    req.vendor = vendor;

    next();
  } catch (err) {
    console.error("VENDOR AUTH ERROR:", err);
    return res.status(401).json({
      ok: false,
      message: "نشست فروشنده معتبر نیست. لطفاً دوباره وارد شوید.",
    });
  }
};