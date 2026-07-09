const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-genino-secret";

function generateAdminToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      username: admin.username,
      isSuperAdmin: admin.isSuperAdmin,
      type: "admin",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

exports.login = async (req, res, prisma) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        message: "نام کاربری و رمز عبور الزامی است.",
      });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        ok: false,
        message: "اطلاعات ورود نادرست است.",
      });
    }

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "اطلاعات ورود نادرست است.",
      });
    }

    const token = generateAdminToken(admin);

    return res.json({
      ok: true,
      message: "ورود مدیر با موفقیت انجام شد.",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        isSuperAdmin: admin.isSuperAdmin,
        permissions: admin.permissions.map((p) => p.permission.code),
      },
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور.",
    });
  }
};