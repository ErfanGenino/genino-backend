const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // GET /api/children/public
// همه کودکان ژنینویی عمومی

router.get("/public", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const children = await prisma.child.findMany({
  orderBy: { createdAt: "desc" },

  include: {
    admins: {
      where: {
        status: "CONNECTED",
        role: {
          in: ["father", "mother"],
        },
      },

      include: {
        user: {
          select: {
            city: true,
          },
        },
      },
    },
    followRequests: {
  where: {
    requesterId: userId,
  },
  take: 1,
},
  },
});

    const enrichedChildren = children.map((child) => {
  // پیدا کردن شهر
  const father = child.admins.find((a) => a.role === "father");
  const mother = child.admins.find((a) => a.role === "mother");

  const city =
    father?.user?.city ||
    mother?.user?.city ||
    null;

  // محاسبه سن
  let ageText = null;

  if (child.birthDate) {
    const birth = new Date(child.birthDate);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    ageText = `${years} سال و ${months} ماه`;
  }

  const myFollowRequest = child.followRequests?.[0] || null;

return {
  ...child,
  city,
  ageText,
  followStatus: myFollowRequest?.status || null,
  myRequestedRole: myFollowRequest?.requestedRole || null,
};
});

res.json({
  ok: true,
  children: enrichedChildren,
});
  } catch (error) {
    console.error("❌ Error fetching public children:", error);

    res.status(500).json({
      message: "خطا در دریافت کودکان ژنینویی",
    });
  }
});

  // GET /api/children
// فقط کودکانی که کاربر پدر/مادر آن‌هاست
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const children = await prisma.child.findMany({
      where: {
        admins: {
          some: {
            userId,
            status: "CONNECTED",
            role: { in: ["father", "mother"] },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(children);
  } catch (error) {
    console.error("❌ Error fetching children:", error);
    res.status(500).json({ message: "خطا در دریافت کودکان" });
  }
});

// GET /api/children/followed
// کودکانی که کاربر در درختواره آن‌ها عضو است ولی پدر/مادر نیست
router.get("/followed", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const children = await prisma.child.findMany({
      where: {
        admins: {
          some: {
            userId,
            status: "CONNECTED",
            role: { notIn: ["father", "mother"] },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        admins: {
          where: {
            status: "CONNECTED",
            role: { in: ["father", "mother"] },
          },
          include: {
            user: {
              select: {
                city: true,
                province: true,
              },
            },
          },
        },
      },
    });

    const enrichedChildren = children.map((child) => {
      const father = child.admins.find((a) => a.role === "father");
      const mother = child.admins.find((a) => a.role === "mother");

      const city =
        father?.user?.city ||
        mother?.user?.city ||
        father?.user?.province ||
        mother?.user?.province ||
        null;

      return {
        ...child,
        city,
      };
    });

    res.json(enrichedChildren);
  } catch (error) {
    console.error("❌ Error fetching followed children:", error);
    res.status(500).json({ message: "خطا در دریافت کودکان فالو شده" });
  }
});

// GET /api/children/:id/admins  ✅ (لیست والدین/ادمین‌های کودک)
router.get("/:id/admins", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const childId = Number(req.params.id);

    // 1) چک دسترسی: آیا این کاربر ادمین این کودک هست؟
    const hasAccess = await prisma.childAdmin.findFirst({
  where: {
    childId,
    userId,
    status: "CONNECTED",
  },
  select: { id: true },
});

    if (!hasAccess) {
      return res.status(403).json({
        ok: false,
        message: "شما به این کودک دسترسی ندارید.",
      });
    }

    // 2) گرفتن لیست ادمین‌ها + نام کاربر
    const admins = await prisma.childAdmin.findMany({
      where: { childId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: {
        userId: true,
        role: true,
        isPrimary: true,
        createdAt: true,
        user: {
  select: {
    fullName: true,
    email: true,
    avatarUrl: true,
    city: true,
    province: true,
  },
},
      },
    });

    // 3) خروجی تمیز برای فرانت
    const result = admins.map((a) => ({
      userId: a.userId,
      role: a.role,
      isPrimary: a.isPrimary,
      fullName: a.user?.fullName || null,
      email: a.user?.email || null,
      avatarUrl: a.user?.avatarUrl || null,
      city: a.user?.city || null,
      province: a.user?.province || null,
      createdAt: a.createdAt,
      status: "CONNECTED",
    }));

    const pendingInvitations = await prisma.childInvitation.findMany({
  where: {
    childId,
    accepted: false,
    expiresAt: { gt: new Date() },
    relationType: { in: ["father", "mother"] },
  },
  select: {
    id: true,
    relationType: true,
    roleLabel: true,
    slot: true,
    email: true,
    phone: true,
    createdAt: true,
  },
});

const pendingResult = pendingInvitations.map((inv) => ({
  userId: null,
  role: inv.relationType,
  isPrimary: false,
  fullName: inv.email || inv.phone || "دعوت ارسال شده",
  email: inv.email || null,
  avatarUrl: null,
  createdAt: inv.createdAt,
  status: "PENDING",
  invitationId: inv.id,
  slot: inv.slot,
}));

const finalResult = [...result, ...pendingResult];

    return res.json({ ok: true, admins: finalResult });
  } catch (error) {
    console.error("❌ Error fetching child admins:", error);
    return res.status(500).json({
      ok: false,
      message: "خطا در دریافت والدین کودک",
    });
  }
});



// POST /api/children
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, gender, birthDate, photo, interests } = req.body;

    // 1️⃣ ساخت کودک (بدون userId)
    const child = await prisma.child.create({
      data: {
        fullName,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        photo: photo || null,
        interests: interests || null,
      },
    });

    // 2️⃣ تعیین نقش والد
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    let role = "parent";
    if (user?.gender === "male") role = "father";
    else if (user?.gender === "female") role = "mother";

    // 3️⃣ ساخت ChildAdmin
    await prisma.childAdmin.create({
      data: {
        childId: child.id,
        userId,
        role,
        isPrimary: true,
      },
    });

    res.status(201).json(child);
  } catch (error) {
    console.error("❌ Error creating child:", error);
    res.status(500).json({ message: "خطا در ثبت کودک" });
  }
});



  // PUT /api/children/:id
  router.put("/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const childId = Number(req.params.id);
      const { fullName, gender, birthDate, photo, interests } = req.body;

      const child = await prisma.child.findFirst({
  where: {
    id: childId,
    admins: {
      some: {
        userId,
        status: "CONNECTED",
        role: { in: ["father", "mother"] },
      },
    },
  },
});

      if (!child) {
        return res.status(404).json({ message: "کودک پیدا نشد" });
      }

      const updated = await prisma.child.update({
        where: { id: childId },
        data: {
          fullName,
          gender,
          birthDate: birthDate ? new Date(birthDate) : null,
          photo: photo || null,
          interests: interests || null,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error("❌ Error updating child:", error);
      res.status(500).json({ message: "خطا در ویرایش کودک" });
    }
  });

  // ✅ DELETE /api/children/:id
  router.delete("/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const childId = Number(req.params.id);

      const child = await prisma.child.findFirst({
  where: {
    id: childId,
    admins: {
      some: {
        userId,
        status: "CONNECTED",
        role: { in: ["father", "mother"] },
      },
    },
  },
});


      if (!child) {
        return res.status(404).json({ message: "کودک پیدا نشد" });
      }

      const admins = await prisma.childAdmin.findMany({
  where: { childId },
  orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
});

const currentAdmin = admins.find((a) => a.userId === userId);

if (!currentAdmin) {
  return res.status(403).json({ message: "شما به این کودک دسترسی ندارید" });
}

// اگر فقط یک ادمین دارد، کل پروفایل کودک حذف شود
if (admins.length <= 1) {
  await prisma.child.delete({
    where: { id: childId },
  });

  return res.json({
    ok: true,
    mode: "child_deleted",
  });
}

// اگر چند ادمین دارد، فقط دسترسی همین کاربر حذف شود
await prisma.childAdmin.delete({
  where: { id: currentAdmin.id },
});

// اگر ادمین اصلی حذف شد، یکی از باقی‌مانده‌ها اصلی شود
if (currentAdmin.isPrimary) {
  const nextAdmin = admins.find((a) => a.id !== currentAdmin.id);

  if (nextAdmin) {
    await prisma.childAdmin.update({
      where: { id: nextAdmin.id },
      data: { isPrimary: true },
    });
  }
}

return res.json({
  ok: true,
  mode: "access_removed",
  message: "دسترسی شما به این کودک حذف شد.",
});

    } catch (error) {
      console.error("❌ Error deleting child:", error);
      res.status(500).json({ message: "خطا در حذف کودک" });
    }
  });

  return router;
};
