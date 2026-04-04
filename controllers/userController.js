// controllers/userController.js

exports.searchUsers = async (req, res, prisma) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.json({ ok: true, items: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        lastSocialSeenAt: true,
      },
      take: 20,
    });

    return res.json({ ok: true, items: users });
  } catch (err) {
    console.error("SEARCH USERS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.updateSocialPresence = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSocialSeenAt: new Date(),
      },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("UPDATE SOCIAL PRESENCE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.getOnlineUsers = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const onlineThreshold = new Date(Date.now() - 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        lastSocialSeenAt: {
          gte: onlineThreshold,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        lastSocialSeenAt: true,
      },
      orderBy: {
        lastSocialSeenAt: "desc",
      },
      take: 50,
    });

    return res.json({ ok: true, items: users });
  } catch (err) {
    console.error("GET ONLINE USERS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};