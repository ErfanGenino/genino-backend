// controllers/userController.js

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getUserSearchScore(user, q) {
  const query = normalizeSearchText(q);

  const username = normalizeSearchText(user.username);
  const firstName = normalizeSearchText(user.firstName);
  const lastName = normalizeSearchText(user.lastName);
  const fullName = normalizeSearchText(user.fullName);

  // اولویت‌بندی نتایج
  if (username && username === query) return 100;
  if (username && username.startsWith(query)) return 90;
  if (fullName && fullName === query) return 85;
  if (firstName && firstName === query) return 80;
  if (lastName && lastName === query) return 75;
  if (fullName && fullName.startsWith(query)) return 70;
  if (firstName && firstName.startsWith(query)) return 65;
  if (lastName && lastName.startsWith(query)) return 60;
  if (username && username.includes(query)) return 50;
  if (fullName && fullName.includes(query)) return 45;
  if (firstName && firstName.includes(query)) return 40;
  if (lastName && lastName.includes(query)) return 35;

  return 0;
}

exports.searchUsers = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const rawQuery = String(req.query.q || "");
    const q = normalizeSearchText(rawQuery);

    if (!q || q.length < 1) {
      return res.json({ ok: true, items: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { fullName: { contains: q } },
          { username: { contains: q } },
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
      take: 100,
    });

    const rankedUsers = users
      .map((user) => ({
        ...user,
        _score: getUserSearchScore(user, q),
      }))
      .filter((user) => user._score > 0)
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;

        const aFullName = normalizeSearchText(a.fullName);
        const bFullName = normalizeSearchText(b.fullName);

        return aFullName.localeCompare(bFullName, "fa");
      })
      .slice(0, 20)
      .map(({ _score, ...user }) => ({
        ...user,
        fullName:
          user.fullName?.trim() ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          "کاربر ژنینو",
      }));

    return res.json({ ok: true, items: rankedUsers });
  } catch (err) {
    console.error("SEARCH USERS ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطا در جستجوی کاربران.",
      error: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
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