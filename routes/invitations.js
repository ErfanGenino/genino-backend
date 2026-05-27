const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");

module.exports = function (prisma) {
  const router = express.Router();
  

  // ===============================
  // POST /api/invitations (ارسال دعوت)
  // body: { childId, email?, phone?, relationType, slot?, roleLabel? }
  // ===============================
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { childId, email, phone, username, relationType, slot, roleLabel } = req.body;

      // 1) اعتبارسنجی پایه
      if (!childId) {
        return res.status(400).json({ ok: false, message: "childId الزامی است." });
      }
      if (!email && !phone && !username) {
        return res.status(400).json({
          ok: false,
          message: "ایمیل، شماره موبایل یا نام کاربری الزامی است.",
        });
      }

      // ✅ NEW: نقش/جایگاه
      if (!relationType || typeof relationType !== "string") {
        return res.status(400).json({
          ok: false,
          message: "relationType الزامی است.",
        });
      }

      const slotValue =
        slot === undefined || slot === null || slot === ""
          ? 0
          : Number(slot);

      if (Number.isNaN(slotValue) || slotValue < 0) {
        return res.status(400).json({
          ok: false,
          message: "slot باید عدد 0 یا بزرگتر باشد.",
        });
      }

      // 1) اگر آن جایگاه قبلاً CONNECTED شده باشد، اجازه دعوت نده
      const alreadyConnected = await prisma.childAdmin.findFirst({
        where: {
          childId: Number(childId),
          role: relationType.trim(),
          slot: slotValue,
        },
      });

      if (alreadyConnected) {
      return res.status(409).json({
        ok: false,
          message: "این جایگاه قبلاً پر شده است و امکان ارسال دعوت ندارد.",
        });
      }

      // 2) اگر برای همان جایگاه دعوت فعال وجود دارد، دوباره دعوت نده
      const existingSlotInvite = await prisma.childInvitation.findFirst({
        where: {
          childId: Number(childId),
          relationType: relationType.trim(),
          slot: slotValue,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingSlotInvite) {
      return res.status(409).json({
        ok: false,
          message: "برای این جایگاه قبلاً دعوت فعال ارسال شده است.",
        });
      }

      // 2) بررسی ادمین بودن کاربر (فقط پدر/مادر)
      const admin = await prisma.childAdmin.findFirst({
  where: {
    childId: Number(childId),
    userId,
    role: { in: ["father", "mother"] },
  },
  include: {
    user: {
      select: {
        fullName: true,
        gender: true,
      },
    },
    child: {
      select: {
        fullName: true,
      },
    },
  },
});


      if (!admin) {
        return res.status(403).json({
          ok: false,
          message: "شما اجازه ارسال دعوت برای این کودک را ندارید.",
        });
      }

      // پیدا کردن کاربر مقصد اگر با نام کاربری، موبایل یا ایمیل عضو ژنینو باشد
      let targetUser = null;

      if (username || phone || email) {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              username ? { username: String(username).trim() } : undefined,
              phone ? { phone: String(phone).trim() } : undefined,
              email ? { email: String(email).trim() } : undefined,
            ].filter(Boolean),
          },
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            phone: true,
          },
        });
      }

      if (!targetUser?.id) {
        return res.status(404).json({
          ok: false,
          message: "کاربری با این مشخصات در ژنینو پیدا نشد.",
        });
      }

      if (targetUser?.id === userId) {
        return res.status(400).json({
          ok: false,
          message: "نمی‌توانید برای خودتان دعوت ارسال کنید.",
        });
      }

      // 3) جلوگیری از دعوت فعال تکراری (برای همان کودک و همان مقصد)
      const existingInvite = await prisma.childInvitation.findFirst({
        where: {
          childId: Number(childId),
          accepted: false,
          expiresAt: { gt: new Date() },
          OR: [
            email ? { email: String(email).trim() } : undefined,
            phone ? { phone: String(phone).trim() } : undefined,
            targetUser?.id ? { targetUserId: targetUser.id } : undefined,
          ].filter(Boolean),
        },
      });

      if (existingInvite) {
        return res.status(409).json({
          ok: false,
          message: "برای این شخص قبلاً دعوت فعال ارسال شده است.",
        });
      }

      // 4) ساخت توکن و تاریخ انقضا
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 5) ذخیره دعوت
      const invitation = await prisma.childInvitation.create({
        data: {
          childId: Number(childId),
          inviterId: userId,
          targetUserId: targetUser?.id || null,
          email: email || targetUser?.email || null,
          phone: phone || targetUser?.phone || null,
          token,
          expiresAt,

          // ✅ NEW
          relationType: relationType.trim(),
          slot: slotValue,
          roleLabel: roleLabel ? String(roleLabel).trim() : null,
        },
      });


      if (targetUser?.id) {
  const inviterTitle = admin.role === "father" ? "آقای" : "خانم";
  const inviterName = admin.user?.fullName || "کاربر ژنینو";
  const childName = admin.child?.fullName || "کودک";
  const roleText =
    relationType === "mother"
      ? "مادر"
      : relationType === "father"
      ? "پدر"
      : roleLabel || "عضو خانواده";

  await prisma.notification.create({
    data: {
      userId: targetUser.id,
      type: "child_invitation",
      title: "دعوت به پروفایل کودک",
      body: `${inviterTitle} ${inviterName} شما را به عنوان ${roleText} ${childName} به پروفایل ${childName} دعوت کرده است.`,
      data: {
        invitationId: invitation.id,
        token: invitation.token,
        childId: invitation.childId,
        relationType: invitation.relationType,
        slot: invitation.slot,
      },
    },
  });
}

      // ⚠️ در prod بهتره token برنگرده؛ فعلاً برای تست accept، برمی‌گردونیم
      return res.status(201).json({
        ok: true,
        message: "دعوت‌نامه با موفقیت ایجاد شد.",
        invitationId: invitation.id,
        token: invitation.token, // ✅ فقط برای تست/دیباگ
        relationType: invitation.relationType,
        slot: invitation.slot,
      });
    } catch (error) {
      console.error("❌ Error creating invitation:", error);
      return res.status(500).json({ ok: false, message: "خطا در ایجاد دعوت‌نامه." });
    }
  });

  // ===============================
  // POST /api/invitations/accept (پذیرش دعوت)
  // body: { token }
  // ===============================
  router.post("/accept", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          ok: false,
          message: "توکن دعوت ارسال نشده است.",
        });
      }

      const invitation = await prisma.childInvitation.findUnique({
        where: { token },
      });
      if (!invitation) {
        return res.status(404).json({
          ok: false,
          message: "دعوت معتبر نیست.",
        });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(410).json({
          ok: false,
          message: "دعوت منقضی شده است.",
        });
      }

      if (invitation.accepted) {
        return res.status(409).json({
          ok: false,
          message: "این دعوت قبلاً استفاده شده است.",
        });
      }

      if (invitation.targetUserId && invitation.targetUserId !== userId) {
        return res.status(403).json({
          ok: false,
          message: "این دعوت متعلق به شما نیست.",
        });
      }

      const exists = await prisma.childAdmin.findFirst({
        where: {
          childId: invitation.childId,
          userId,
        },
      });

      if (exists) {
        return res.status(409).json({
          ok: false,
          message: "شما قبلاً عضو درختواره این کودک هستید.",
        });
      }

      // ✅ NEW: نقش از روی invitation
      // (والدین مسیر جدا دارند؛ اینجا فقط برای اعضای دعوت‌شده است)
      const roleFromInvite = invitation.relationType || "relative";
      const slotFromInvite = Number.isFinite(invitation.slot) ? invitation.slot : 0;

      await prisma.childAdmin.create({
        data: {
          childId: invitation.childId,
          userId,
          role: roleFromInvite,
          slot: slotFromInvite, // ✅ NEW
          isPrimary: false,
        },
      });


      await prisma.childInvitation.update({
        where: { id: invitation.id },
        data: {
          accepted: true,
          acceptedAt: new Date(),
        },
      });

      // حذف اعلان دعوت از نوتیف گیرنده
await prisma.notification.deleteMany({
  where: {
    type: "child_invitation",
    data: {
      path: ["invitationId"],
      equals: invitation.id,
    },
  },
});

// اطلاعات کاربر پذیرنده
const accepter = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    fullName: true,
  },
});

// اطلاعات کودک
const childInfo = await prisma.child.findUnique({
  where: { id: invitation.childId },
  select: {
    fullName: true,
  },
});

// نوتیف برای دعوت‌کننده
await prisma.notification.create({
  data: {
    userId: invitation.inviterId,
    type: "child_invitation_accepted",
    title: "دعوت پذیرفته شد",
    body: `${accepter?.fullName || "کاربر ژنینو"} دعوت شما برای ${childInfo?.fullName || "کودک"} را پذیرفت.`,
    data: {
      invitationId: invitation.id,
      childId: invitation.childId,
      relationType: invitation.relationType,
      slot: invitation.slot,
    },
  },
});

      return res.json({
        ok: true,
        message: "دعوت با موفقیت پذیرفته شد.",
        childId: invitation.childId,
        role: roleFromInvite,
        slot: invitation.slot,
      });
    } catch (error) {
      console.error("❌ Accept invitation error:", error);
      return res.status(500).json({
        ok: false,
        message: "خطای سرور در پذیرش دعوت.",
      });
    }
  });


  // ===============================
// POST /api/invitations/reject
// body: { token }
// ===============================
router.post("/reject", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "توکن دعوت ارسال نشده است.",
      });
    }

    const invitation = await prisma.childInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        message: "دعوت معتبر نیست.",
      });
    }

    if (invitation.targetUserId && invitation.targetUserId !== userId) {
      return res.status(403).json({
        ok: false,
        message: "این دعوت متعلق به شما نیست.",
      });
    }

    if (invitation.accepted) {
      return res.status(409).json({
        ok: false,
        message: "این دعوت قبلاً پذیرفته شده است.",
      });
    }

    // ✅ حذف اعلان مربوط به این دعوت برای طرف مقابل
await prisma.notification.deleteMany({
  where: {
    type: "child_invitation",
    data: {
      path: ["invitationId"],
      equals: invitation.id,
    },
  },
});

const rejecter = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    fullName: true,
  },
});

const childInfo = await prisma.child.findUnique({
  where: { id: invitation.childId },
  select: {
    fullName: true,
  },
});

await prisma.notification.create({
  data: {
    userId: invitation.inviterId,
    type: "child_invitation_rejected",
    title: "دعوت رد شد",
    body: `${rejecter?.fullName || "کاربر ژنینو"} دعوت شما برای ${childInfo?.fullName || "کودک"} را رد کرد.`,
    data: {
      invitationId: invitation.id,
      childId: invitation.childId,
      relationType: invitation.relationType,
      slot: invitation.slot,
    },
  },
});

    await prisma.childInvitation.delete({
      where: { id: invitation.id },
    });

    return res.json({
      ok: true,
      message: "دعوت رد شد.",
    });
  } catch (error) {
    console.error("❌ Reject invitation error:", error);
    return res.status(500).json({
      ok: false,
      message: "خطای سرور در رد دعوت.",
    });
  }
});



    // ===============================
  // DELETE /api/invitations/:invitationId (لغو/حذف دعوت Pending)
  // ===============================
  router.delete("/:invitationId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const invitationId = Number(req.params.invitationId);

      if (!invitationId) {
        return res.status(400).json({ ok: false, message: "invitationId نامعتبر است." });
      }

      const invitation = await prisma.childInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return res.status(404).json({ ok: false, message: "دعوت پیدا نشد." });
      }

      if (invitation.accepted) {
        return res.status(409).json({ ok: false, message: "این دعوت قبلاً پذیرفته شده و قابل حذف نیست." });
      }

      // ✅ بررسی ادمین بودن کاربر برای همان کودک (فقط پدر/مادر)
      const admin = await prisma.childAdmin.findFirst({
        where: {
          childId: invitation.childId,
          userId,
          role: { in: ["father", "mother"] },
        },
      });


      if (!admin) {
        return res.status(403).json({ ok: false, message: "شما اجازه لغو این دعوت را ندارید." });
      }

// حذف اعلان دعوت از نوتیف گیرنده
const deletedNotifications = await prisma.notification.deleteMany({
  where: {
    userId: invitation.targetUserId,
    type: "child_invitation",
    data: {
      path: ["childId"],
      equals: invitation.childId,
    },
  },
});

console.log("Deleted invitation notifications:", deletedNotifications.count);

      await prisma.childInvitation.delete({
        where: { id: invitationId },
      });

      return res.json({
        ok: true,
        message: "دعوت با موفقیت لغو شد.",
        invitationId,
        childId: invitation.childId,
        relationType: invitation.relationType,
        slot: invitation.slot,
      });
    } catch (error) {
      console.error("❌ Cancel invitation error:", error);
      return res.status(500).json({ ok: false, message: "خطای سرور در لغو دعوت." });
    }
  });


  return router;
};