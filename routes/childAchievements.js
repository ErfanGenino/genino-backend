const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

function getTehranJalaliMonthRange() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);

  const jy = Number(parts.find((p) => p.type === "year")?.value);
  const jm = Number(parts.find((p) => p.type === "month")?.value);

  let start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15));
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 15));

  while (true) {
    const p = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(start);

    const y = Number(p.find((x) => x.type === "year")?.value);
    const m = Number(p.find((x) => x.type === "month")?.value);
    const d = Number(p.find((x) => x.type === "day")?.value);

    if (y === jy && m === jm && d === 1) break;

    start = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }

  end = new Date(start.getTime());

  while (true) {
    const p = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(end);

    const y = Number(p.find((x) => x.type === "year")?.value);
    const m = Number(p.find((x) => x.type === "month")?.value);
    const d = Number(p.find((x) => x.type === "day")?.value);

    if ((y !== jy || m !== jm) && d === 1) break;

    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return {
    startOfMonth: start,
    startOfNextMonth: end,
  };
}

module.exports = function (prisma) {
  const router = express.Router();

  // GET /api/child-achievements/child/:childId
router.get("/child/:childId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const childId = Number(req.params.childId);

    if (!childId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه کودک نامعتبر است.",
      });
    }

    const relation =
      await prisma.childAdmin.findFirst({
        where: {
          childId,
          userId,
          status: "CONNECTED",
        },
      }) ||
      await prisma.childFollowRequest.findFirst({
        where: {
          childId,
          requesterId: userId,
          status: {
            in: ["APPROVED", "APPROVED_WITH_CHANGED_ROLE"],
          },
        },
      });

    if (!relation) {
      return res.status(403).json({
        ok: false,
        message: "شما اجازه مشاهده دستاوردهای این کودک را ندارید.",
      });
    }


    const achievements = await prisma.childAchievement.findMany({
      where: { childId },
      orderBy: { issuedAt: "desc" },
      include: {
        issuerUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            city: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      achievements,
    });
  } catch (err) {
    console.error("Get child achievements error:", err);
    return res.status(500).json({
      ok: false,
      message: "دریافت دستاوردها انجام نشد.",
    });
  }
});

// GET /api/child-achievements/spiritual/status/:childId
router.get("/spiritual/status/:childId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const childId = Number(req.params.childId);

    if (!childId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه کودک نامعتبر است.",
      });
    }

    const { startOfMonth, startOfNextMonth } =
  getTehranJalaliMonthRange();

    const existing = await prisma.childAchievement.findFirst({
      where: {
        childId,
        issuerUserId: userId,
        category: "spiritual",
        issuedAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    return res.json({
      ok: true,
      hasGivenThisMonth: Boolean(existing),
    });
  } catch (err) {
    console.error("Get spiritual achievement status error:", err);
    return res.status(500).json({
      ok: false,
      message: "بررسی وضعیت دستاورد انجام نشد.",
    });
  }
});

// GET /api/child-achievements/child/:childId/list
router.get("/child/:childId/list", authMiddleware, async (req, res) => {
  try {
    const childId = Number(req.params.childId);
    const category = req.query.category;

    if (!childId || !category) {
      return res.status(400).json({
        ok: false,
        message: "اطلاعات درخواست کامل نیست.",
      });
    }

    const achievements = await prisma.childAchievement.findMany({
      where: {
        childId,
        category,
      },
      orderBy: {
        issuedAt: "desc",
      },
      include: {
        issuerUser: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            city: true,
          },
        },
        child: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            birthDate: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      achievements,
    });
  } catch (err) {
    console.error("Get child achievement list error:", err);
    return res.status(500).json({
      ok: false,
      message: "دریافت لیست دستاوردها انجام نشد.",
    });
  }
});

// GET /api/child-achievements/top-receivers
router.get("/top-receivers", authMiddleware, async (req, res) => {
  const year = req.query.year;
const month = req.query.month;

const monthMap = {
  فروردین: 1,
  اردیبهشت: 2,
  خرداد: 3,
  تیر: 4,
  مرداد: 5,
  شهریور: 6,
  مهر: 7,
  آبان: 8,
  آذر: 9,
  دی: 10,
  بهمن: 11,
  اسفند: 12,
};
  try {
    
    const achievements = ( await prisma.childAchievement.findMany({
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            photo: true,
            birthDate: true,
          },
        },
      },
    })
).filter((achievement) => {
  const parts = new Intl.DateTimeFormat(
    "en-US-u-ca-persian",
    {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "numeric",
    }
  ).formatToParts(new Date(achievement.issuedAt));

  const jy = Number(
    parts.find((p) => p.type === "year")?.value
  );

  const jm = Number(
    parts.find((p) => p.type === "month")?.value
  );

  if (year && jy !== Number(year)) {
    return false;
  }

  if (
    month &&
    month !== "همه ماه‌ها" &&
    jm !== monthMap[month]
  ) {
    return false;
  }

  return true;
});

    const grouped = {};

    achievements.forEach((achievement) => {
      const childId = achievement.childId;

      if (!grouped[childId]) {
        grouped[childId] = {
          child: achievement.child,
          art: 0,
          sport: 0,
          nurture: 0,
          science: 0,
          spiritual: 0,
          total: 0,
        };
      }

      grouped[childId].total += 1;

      if (achievement.category === "art") grouped[childId].art += 1;
      if (achievement.category === "sport") grouped[childId].sport += 1;
      if (achievement.category === "nurture") grouped[childId].nurture += 1;
      if (achievement.category === "science") grouped[childId].science += 1;
      if (achievement.category === "spiritual") grouped[childId].spiritual += 1;
    });

    const receivers = Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 100)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return res.json({
      ok: true,
      receivers,
    });
  } catch (err) {
    console.error("Get top receivers error:", err);

    return res.status(500).json({
      ok: false,
      message: "دریافت برترین دریافت‌کنندگان انجام نشد.",
    });
  }
});

// GET /api/child-achievements/top-issuers
router.get("/top-issuers", authMiddleware, async (req, res) => {
  const year = req.query.year;
const month = req.query.month;

const monthMap = {
  فروردین: 1,
  اردیبهشت: 2,
  خرداد: 3,
  تیر: 4,
  مرداد: 5,
  شهریور: 6,
  مهر: 7,
  آبان: 8,
  آذر: 9,
  دی: 10,
  بهمن: 11,
  اسفند: 12,
};
  try {
    const familyRoles = [
      "father",
      "mother",
      "sister",
      "brother",
      "khale",
      "amme",
      "dayi",
      "ammo",
      "grandfather_paternal",
      "grandmother_paternal",
      "grandfather_maternal",
      "grandmother_maternal",
      "friend",
      "عضو درختواره",
    ];

    const achievements = (
  await prisma.childAchievement.findMany({
      
      where: {
        issuerRole: {
          notIn: familyRoles,
        },
      },
      include: {
        issuerUser: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            city: true,
          },
        },
      },
    })
).filter((achievement) => {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(achievement.issuedAt));

  const jy = Number(parts.find((p) => p.type === "year")?.value);
  const jm = Number(parts.find((p) => p.type === "month")?.value);

  if (year && jy !== Number(year)) return false;

  if (
    month &&
    month !== "همه ماه‌ها" &&
    jm !== monthMap[month]
  ) {
    return false;
  }

  return true;
});

    const grouped = {};

    achievements.forEach((achievement) => {
      const issuerId = achievement.issuerUserId;

      if (!grouped[issuerId]) {
        grouped[issuerId] = {
          issuer: achievement.issuerUser,
          total: 0,
        };
      }

      grouped[issuerId].total += 1;
    });

    const issuers = Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 100)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return res.json({
      ok: true,
      issuers,
    });
  } catch (err) {
    console.error("Get top issuers error:", err);
    return res.status(500).json({
      ok: false,
      message: "دریافت برترین صادرکنندگان انجام نشد.",
    });
  }
});

// GET /api/child-achievements/latest
router.get("/latest", authMiddleware, async (req, res) => {
  const days = Number(req.query.days) || 1;
const safeDays = [1, 7, 30].includes(days) ? days : 1;

const sinceDate = new Date();
sinceDate.setDate(sinceDate.getDate() - safeDays);
  try {
    const achievements = await prisma.childAchievement.findMany({
      where: {
  issuedAt: {
    gte: sinceDate,
  },
},
      orderBy: {
        issuedAt: "desc",
      },

      take: 20,

      include: {
        child: {
  select: {
    id: true,
    fullName: true,
    gender: true,
    photo: true,
    birthDate: true,
  },
},

        issuerUser: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            city: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      achievements,
    });
  } catch (err) {
    console.error("Get latest achievements error:", err);

    return res.status(500).json({
      ok: false,
      message: "دریافت آخرین دستاوردها انجام نشد.",
    });
  }
});

  // POST /api/child-achievements/spiritual
  router.post("/spiritual", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { childId, title, description } = req.body;

      if (!childId || !title) {
        return res.status(400).json({
          ok: false,
          message: "اطلاعات دستاورد کامل نیست.",
        });
      }

      const child = await prisma.child.findUnique({
        where: { id: Number(childId) },
      });

      if (!child) {
        return res.status(404).json({
          ok: false,
          message: "کودک پیدا نشد.",
        });
      }

      const { startOfMonth, startOfNextMonth } =
  getTehranJalaliMonthRange();

const existing = await prisma.childAchievement.findFirst({
  where: {
    childId: Number(childId),
    issuerUserId: userId,
    category: "spiritual",
    issuedAt: {
      gte: startOfMonth,
      lt: startOfNextMonth,
    },
  },
});

      if (existing) {
        return res.status(409).json({
          ok: false,
          code: "MONTHLY_LIMIT_REACHED",
          message: "شما قبلاً برای این کودک دستاورد معنوی اهدا کرده‌اید.",
        });
      }

      const relation =
        await prisma.childAdmin.findFirst({
          where: {
            childId: Number(childId),
            userId,
            status: "CONNECTED",
          },
        }) ||
        await prisma.childFollowRequest.findFirst({
          where: {
            childId: Number(childId),
            requesterId: userId,
            status: {
              in: ["APPROVED", "APPROVED_WITH_CHANGED_ROLE"],
            },
          },
        });

      if (!relation) {
        return res.status(403).json({
          ok: false,
          message: "شما اجازه اهدای دستاورد برای این کودک را ندارید.",
        });
      }

      const issuerRole =
        relation.role ||
        relation.approvedRole ||
        relation.requestedRole ||
        "عضو درختواره";

      const achievement = await prisma.childAchievement.create({
        data: {
          childId: Number(childId),
          issuerUserId: userId,
          category: "spiritual",
          title,
          description: description || null,
          issuerRole,
        },
      });

      return res.json({
        ok: true,
        achievement,
      });
    } catch (err) {
      console.error("Create spiritual achievement error:", err);
      return res.status(500).json({
        ok: false,
        message: "ثبت دستاورد انجام نشد.",
      });
    }
  });

  return router;
};