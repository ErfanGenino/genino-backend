const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

function getFollowRoleLabel(role) {
  const labels = {
    sister: "خواهر",
    brother: "برادر",
    khale: "خاله",
    amme: "عمه",
    dayi: "دایی",
    ammo: "عمو",
    grandfather_paternal: "پدربزرگ پدری",
    grandmother_paternal: "مادربزرگ پدری",
    grandfather_maternal: "پدربزرگ مادری",
    grandmother_maternal: "مادربزرگ مادری",
    friend: "سایر دوستان",
  };

  return labels[role] || role;
}

module.exports = function (prisma) {
  const router = express.Router();

  // ثبت درخواست فالو کودک
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const {
        childId,
        requestedRole,
      } = req.body;

      if (!childId || !requestedRole) {
        return res.status(400).json({
          ok: false,
          message: "اطلاعات ناقص است.",
        });
      }

      // جلوگیری از فالو کردن کودک خود
const isOwnChild = await prisma.childAdmin.findFirst({
  where: {
    childId: Number(childId),
    userId: Number(userId),
    role: {
      in: ["father", "mother"],
    },
    status: "CONNECTED",
  },
});

if (isOwnChild) {
  return res.status(400).json({
    ok: false,
    message:
      "نیازی به فالو کردن کودک خودتان ندارید. شما به صفحه کودک خودتان در بخش کودک من دسترسی دارید 💛",
  });
}

      // جلوگیری از ثبت تکراری
      const existing =
  await prisma.childFollowRequest.findFirst({
    where: {
      childId: Number(childId),
      requesterId: Number(userId),

      status: {
        in: [
          "PENDING_PARENT",
          "PENDING_REQUESTER",
          "APPROVED",
          "APPROVED_WITH_CHANGED_ROLE",
        ],
      },
    },
  });

      if (existing) {
        return res.status(400).json({
          ok: false,
          message:
            "شما قبلاً برای این کودک درخواست فالو ثبت کرده‌اید.",
        });
      }

      const request =
        await prisma.childFollowRequest.create({
          data: {
            childId: Number(childId),
            requesterId: Number(userId),
            requestedRole,
          },
        });

      // پیدا کردن والدین کودک
      const parents =
        await prisma.childAdmin.findMany({
          where: {
            childId: Number(childId),
            role: {
              in: ["father", "mother"],
            },
            status: "CONNECTED",
          },
        });

      // اطلاعات درخواست‌کننده
      const requester =
        await prisma.user.findUnique({
          where: {
            id: Number(userId),
          },
        });

      // اطلاعات کودک
      const child =
        await prisma.child.findUnique({
          where: {
            id: Number(childId),
          },
        });

      // ارسال اعلان به والدین
      for (const parent of parents) {
        await prisma.notification.create({
          data: {
            userId: parent.userId,
            type: "child_follow_request",
            title: "درخواست فالو کودک",
            body: `${
  requester?.fullName || "کاربر"
} کودک شما ${
  child?.fullName || ""
} را در نقش ${getFollowRoleLabel(requestedRole)} فالو کرده است.`,
            data: {
              requestId: request.id,
              childId: child.id,
              requesterId: requester.id,
              requestedRole,
            },
          },
        });
      }

      return res.json({
        ok: true,
        request,
      });
    } catch (error) {
      console.error(
        "CHILD FOLLOW REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        ok: false,
        message: "خطا در ثبت درخواست فالو.",
      });
    }
  });

  // دریافت درخواست‌های فالو برای والدین کودک
router.get(
  "/pending",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      const requests =
        await prisma.childFollowRequest.findMany({
          where: {
            status: "PENDING_PARENT",

            child: {
              admins: {
                some: {
                  userId,
                  status: "CONNECTED",
                  role: {
                    in: ["father", "mother"],
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          include: {
            child: {
              select: {
                id: true,
                fullName: true,
                photo: true,
              },
            },

            requester: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        });

      return res.json({
        ok: true,
        requests,
      });
    } catch (error) {
      console.error(
        "GET PENDING FOLLOW REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        ok: false,
        message:
          "خطا در دریافت درخواست‌های فالو.",
      });
    }
  }
);

// تصمیم والدین درباره درخواست فالو
router.post("/:requestId/parent-decision", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const requestId = Number(req.params.requestId);
    const { action, approvedRole } = req.body;

    if (!["ACCEPT", "REJECT", "CHANGE_ROLE"].includes(action)) {
      return res.status(400).json({
        ok: false,
        message: "تصمیم نامعتبر است.",
      });
    }

    const request = await prisma.childFollowRequest.findUnique({
      where: { id: requestId },
      include: {
        child: true,
        requester: true,
      },
    });

    if (!request || request.status !== "PENDING_PARENT") {
      return res.status(404).json({
        ok: false,
        message: "درخواست معتبر نیست.",
      });
    }

    const isParent = await prisma.childAdmin.findFirst({
      where: {
        childId: request.childId,
        userId,
        status: "CONNECTED",
        role: { in: ["father", "mother"] },
      },
    });

    if (!isParent) {
      return res.status(403).json({
        ok: false,
        message: "شما اجازه تصمیم‌گیری برای این کودک را ندارید.",
      });
    }

    if (action === "REJECT") {
      await prisma.childFollowRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED_BY_PARENT" },
      });

      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "child_follow_rejected",
          title: "درخواست فالو رد شد",
          body: `درخواست شما برای فالو کردن ${request.child?.fullName || "کودک"} توسط والدین رد شد.`,
          data: {
            requestId,
            childId: request.childId,
          },
        },
      });

      return res.json({ ok: true });
    }

    if (action === "CHANGE_ROLE") {
      if (!approvedRole) {
        return res.status(400).json({
          ok: false,
          message: "نقش پیشنهادی جدید وارد نشده است.",
        });
      }

      await prisma.childFollowRequest.update({
        where: { id: requestId },
        data: {
          approvedRole,
          status: "PENDING_REQUESTER",
        },
      });

      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "child_follow_role_changed",
          title: "تغییر نقش درخواست فالو",
          body: `درخواست شما برای فالو کردن ${request.child?.fullName || "کودک"} پذیرفته شد، اما با نقش جدید.`,
          data: {
            requestId,
            childId: request.childId,
            approvedRole,
          },
        },
      });

      return res.json({ ok: true });
    }

    const finalRole = request.requestedRole;

    await prisma.childAdmin.create({
      data: {
        childId: request.childId,
        userId: request.requesterId,
        role: finalRole,
        requestedRole: request.requestedRole,
        status: "CONNECTED",
        isPrimary: false,
      },
    });

    await prisma.childFollowRequest.update({
      where: { id: requestId },
      data: {
        approvedRole: finalRole,
        status: "APPROVED",
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        type: "child_follow_approved",
        title: "درخواست فالو پذیرفته شد",
        body: `درخواست شما برای فالو کردن ${request.child?.fullName || "کودک"} پذیرفته شد.`,
        data: {
          requestId,
          childId: request.childId,
          approvedRole: finalRole,
        },
      },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("PARENT FOLLOW DECISION ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "خطا در ثبت تصمیم والدین.",
    });
  }
});


// تصمیم درخواست‌کننده درباره نقش تغییر داده شده توسط والدین
router.post("/:requestId/requester-decision", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const requestId = Number(req.params.requestId);
    const { action } = req.body;

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return res.status(400).json({
        ok: false,
        message: "تصمیم نامعتبر است.",
      });
    }

    const request = await prisma.childFollowRequest.findUnique({
      where: { id: requestId },
      include: {
        child: true,
      },
    });

    if (
      !request ||
      request.status !== "PENDING_REQUESTER" ||
      Number(request.requesterId) !== Number(userId)
    ) {
      return res.status(404).json({
        ok: false,
        message: "درخواست معتبر نیست.",
      });
    }

    if (action === "REJECT") {
      await prisma.childFollowRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED_BY_REQUESTER" },
      });

      return res.json({ ok: true });
    }

    const finalRole = request.approvedRole;

    if (!finalRole) {
      return res.status(400).json({
        ok: false,
        message: "نقش نهایی مشخص نیست.",
      });
    }

    await prisma.childAdmin.create({
      data: {
        childId: request.childId,
        userId: request.requesterId,
        role: finalRole,
        requestedRole: request.requestedRole,
        status: "CONNECTED",
        isPrimary: false,
      },
    });

    await prisma.childFollowRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED_WITH_CHANGED_ROLE",
      },
    });

    return res.json({
      ok: true,
      childId: request.childId,
      role: finalRole,
    });
  } catch (error) {
    console.error("REQUESTER FOLLOW DECISION ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "خطا در ثبت تصمیم درخواست‌کننده.",
    });
  }
});

// آنفالو کودک
router.delete(
  "/:childId/unfollow",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const childId = Number(req.params.childId);

      // حذف از child admins
      await prisma.childAdmin.deleteMany({
        where: {
          childId,
          userId,
          role: {
            notIn: ["father", "mother"],
          },
        },
      });

      // آخرین درخواست‌های تایید شده
      await prisma.childFollowRequest.updateMany({
        where: {
          childId,
          requesterId: userId,
          status: {
            in: [
              "APPROVED",
              "APPROVED_WITH_CHANGED_ROLE",
            ],
          },
        },
        data: {
          status: "UNFOLLOWED",
        },
      });

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error("UNFOLLOW ERROR:", error);

      return res.status(500).json({
        ok: false,
        message: "خطا در آنفالو کودک.",
      });
    }
  }
);

  return router;
};