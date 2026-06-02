const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // ===============================
  // ارسال دعوت همراه زندگی
  // ===============================
  router.post("/invite", authMiddleware, async (req, res) => {
    try {
      const senderId = req.user.userId;

      const { value } = req.body;

      if (!value?.trim()) {
        return res.status(400).json({
          message: "اطلاعات دعوت وارد نشده است",
        });
      }

      // پیدا کردن کاربر مقصد
      const receiver = await prisma.user.findFirst({
        where: {
          OR: [
            { username: value },
            { email: value },
            { phone: value },
          ],
        },
      });

      if (!receiver) {
        return res.status(404).json({
          message: "کاربری با این مشخصات پیدا نشد",
        });
      }

      // جلوگیری از دعوت خود
      if (receiver.id === senderId) {
        return res.status(400).json({
          message: "نمی‌توانید خودتان را دعوت کنید",
        });
      }

      // آیا قبلاً همراه زندگی دارند؟
      const existingCompanion = await prisma.lifeCompanion.findFirst({
        where: {
          OR: [
            { user1Id: senderId },
            { user2Id: senderId },
            { user1Id: receiver.id },
            { user2Id: receiver.id },
          ],
        },
      });

      if (existingCompanion) {
        return res.status(400).json({
          message: "یکی از کاربران قبلاً همراه زندگی فعال دارد",
        });
      }

      // آیا دعوت pending وجود دارد؟
      const existingInvite =
        await prisma.lifeCompanionInvite.findFirst({
          where: {
            senderId,
            receiverId: receiver.id,
            status: "PENDING",
          },
        });

      if (existingInvite) {
        return res.status(400).json({
          message: "دعوت قبلاً ارسال شده است",
        });
      }

      // ساخت دعوت
      const invite =
        await prisma.lifeCompanionInvite.create({
          data: {
            senderId,
            receiverId: receiver.id,
          },
        });

        const senderUser = await prisma.user.findUnique({
  where: {
    id: senderId,
  },
  select: {
    firstName: true,
    lastName: true,
  },
});

const senderName =
  `${senderUser?.firstName || ""} ${senderUser?.lastName || ""}`.trim() ||
  "کاربر ژنینو";

      // نوتیفیکیشن
      await prisma.notification.create({
  data: {
    userId: receiver.id,
    type: "life_companion_invite",
    title: "دعوت همراه زندگی",
    body: `${senderName} شما را به همراه زندگی من دعوت کرده است.`,
    data: {
      inviteId: invite.id,
      senderId,
      senderName,
    },
  },
});

      return res.json({
        success: true,
        message: "دعوت با موفقیت ارسال شد",
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message: "خطا در ارسال دعوت",
      });
    }
  });

  // ===============================
// قبول دعوت همراه زندگی
// ===============================
router.post(
  "/invites/:inviteId/accept",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const inviteId = Number(req.params.inviteId);

      const invite =
        await prisma.lifeCompanionInvite.findUnique({
          where: {
            id: inviteId,
          },
        });

      if (!invite) {
        return res.status(404).json({
          message: "دعوت پیدا نشد",
        });
      }

      if (invite.receiverId !== userId) {
        return res.status(403).json({
          message: "اجازه دسترسی ندارید",
        });
      }

      if (invite.status !== "PENDING") {
        return res.status(400).json({
          message: "این دعوت قبلاً بررسی شده است",
        });
      }

      // ساخت رابطه همراه زندگی
      await prisma.lifeCompanion.create({
        data: {
          user1Id: invite.senderId,
          user2Id: invite.receiverId,
        },
      });

      // آپدیت دعوت
      await prisma.lifeCompanionInvite.update({
        where: {
          id: inviteId,
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      return res.json({
        success: true,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message: "خطا در پذیرش دعوت",
      });
    }
  }
);

// ===============================
// رد دعوت همراه زندگی
// ===============================
router.post(
  "/invites/:inviteId/reject",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const inviteId = Number(req.params.inviteId);

      const invite =
        await prisma.lifeCompanionInvite.findUnique({
          where: {
            id: inviteId,
          },
        });

      if (!invite) {
        return res.status(404).json({
          message: "دعوت پیدا نشد",
        });
      }

      if (invite.receiverId !== userId) {
        return res.status(403).json({
          message: "اجازه دسترسی ندارید",
        });
      }

      if (invite.status !== "PENDING") {
        return res.status(400).json({
          message: "این دعوت قبلاً بررسی شده است",
        });
      }

      await prisma.lifeCompanionInvite.update({
        where: {
          id: inviteId,
        },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
        },
      });

      return res.json({
        success: true,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message: "خطا در رد دعوت",
      });
    }
  }
);

// ===============================
// دریافت همراه زندگی فعال من
// ===============================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            gender: true,
            avatarUrl: true,
            username: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            gender: true,
            avatarUrl: true,
            username: true,
          },
        },
      },
    });

    if (!companion) {
      return res.json({
        success: true,
        hasCompanion: false,
        companion: null,
      });
    }

    return res.json({
      success: true,
      hasCompanion: true,
      companion,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "خطا در دریافت همراه زندگی",
    });
  }
});

// ===============================
// قطع ارتباط همراه زندگی
// ===============================
router.delete(
  "/disconnect",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      const companion =
        await prisma.lifeCompanion.findFirst({
          where: {
            OR: [
              { user1Id: userId },
              { user2Id: userId },
            ],
          },
        });

      if (!companion) {
        return res.status(404).json({
          message: "همراه زندگی فعالی پیدا نشد",
        });
      }

      await prisma.lifeCompanion.delete({
        where: {
          id: companion.id,
        },
      });

      return res.json({
        success: true,
        message: "ارتباط همراه زندگی پایان یافت",
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message: "خطا در قطع ارتباط",
      });
    }
  }
);

// ===============================
// ساخت لیست خرید مشترک
// ===============================
router.post("/shopping-lists", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "حداقل یک کالا باید وارد شود",
      });
    }

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const shoppingList = await prisma.shoppingList.create({
      data: {
        lifeCompanionId: companion.id,
        creatorId: userId,
        items: {
          create: items.map((item) => ({
            category: item.category,
            title: item.title,
            amount: item.amount || null,
            canceled: false,
            done: false,
          })),
        },
      },
      include: {
        items: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    const receiverId =
  companion.user1Id === userId ? companion.user2Id : companion.user1Id;

const creatorName =
  shoppingList.creator?.fullName ||
  `${shoppingList.creator?.firstName || ""} ${
    shoppingList.creator?.lastName || ""
  }`.trim() ||
  "همراه زندگی شما";

await prisma.notification.create({
  data: {
    userId: receiverId,
    type: "life_companion_shopping_list_created",
    title: "لیست خرید جدید",
    body: `${creatorName} یک لیست خرید جدید ثبت کرد.`,
    data: {
      shoppingListId: shoppingList.id,
      creatorId: userId,
      creatorName,
      targetPath: "/life-companion/shopping-lists",
    },
  },
});

    return res.json({
      ok: true,
      shoppingList,
    });
  } catch (err) {
    console.error("CREATE SHOPPING LIST ERROR:", err);

    return res.status(500).json({
      message: "خطا در ثبت لیست خرید",
    });
  }
});

// ===============================
// دریافت لیست‌های خرید مشترک
// ===============================
router.get("/shopping-lists", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        lifeCompanionId: companion.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      shoppingLists,
    });
  } catch (err) {
    console.error("GET SHOPPING LISTS ERROR:", err);

    return res.status(500).json({
      message: "خطا در دریافت لیست‌های خرید",
    });
  }
});

// ===============================
// بستن لیست خرید / خرید انجام شد
// ===============================
router.patch("/shopping-lists/:listId/complete", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const listId = Number(req.params.listId);

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        lifeCompanionId: companion.id,
      },
    });

    if (!shoppingList) {
      return res.status(404).json({
        message: "لیست خرید پیدا نشد",
      });
    }

    if (shoppingList.completed) {
      return res.status(400).json({
        message: "این لیست خرید قبلاً بسته شده است",
      });
    }

    const updatedList = await prisma.shoppingList.update({
      where: {
        id: listId,
      },
      data: {
        completed: true,
        completedById: userId,
        completedAt: new Date(),
      },
      include: {
        items: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      shoppingList: updatedList,
    });
  } catch (err) {
    console.error("COMPLETE SHOPPING LIST ERROR:", err);

    return res.status(500).json({
      message: "خطا در بستن لیست خرید",
    });
  }
});

// ===============================
// حذف لیست خرید
// ===============================
router.delete("/shopping-lists/:listId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const listId = Number(req.params.listId);

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        lifeCompanionId: companion.id,
      },
    });

    if (!shoppingList) {
      return res.status(404).json({
        message: "لیست خرید پیدا نشد",
      });
    }

    await prisma.shoppingList.delete({
      where: {
        id: listId,
      },
    });

    return res.json({
      ok: true,
      message: "لیست خرید حذف شد",
    });
  } catch (err) {
    console.error("DELETE SHOPPING LIST ERROR:", err);

    return res.status(500).json({
      message: "خطا در حذف لیست خرید",
    });
  }
});

// ===============================
// ویرایش لیست خرید
// ===============================
router.put("/shopping-lists/:listId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const listId = Number(req.params.listId);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "حداقل یک کالا باید وارد شود",
      });
    }

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        lifeCompanionId: companion.id,
      },
    });

    if (!shoppingList) {
      return res.status(404).json({
        message: "لیست خرید پیدا نشد",
      });
    }

    if (shoppingList.completed) {
      return res.status(400).json({
        message: "لیست خرید بسته‌شده قابل ویرایش نیست",
      });
    }

    await prisma.shoppingListItem.deleteMany({
      where: {
        shoppingListId: listId,
      },
    });

    const updatedList = await prisma.shoppingList.update({
      where: {
        id: listId,
      },
      data: {
        items: {
          create: items.map((item) => ({
            category: item.category,
            title: item.title,
            amount: item.amount || null,
            canceled: item.canceled || false,
            done: item.done || false,
          })),
        },
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      shoppingList: updatedList,
    });
  } catch (err) {
    console.error("UPDATE SHOPPING LIST ERROR:", err);

    return res.status(500).json({
      message: "خطا در ویرایش لیست خرید",
    });
  }
});

// ===============================
// ساخت رویداد یا قرار مشترک
// ===============================
router.post("/life-events", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventType, eventDate, eventTime, description } = req.body;

    if (!eventType?.trim() || !eventDate) {
      return res.status(400).json({
        message: "نوع رویداد و تاریخ رویداد الزامی است",
      });
    }

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const lifeEvent = await prisma.lifeEvent.create({
      data: {
        lifeCompanionId: companion.id,
        creatorId: userId,
        eventType,
        eventDate: new Date(eventDate),
        eventTime: eventTime || null,
        description: description || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    const receiverId =
  companion.user1Id === userId ? companion.user2Id : companion.user1Id;

const creatorName =
  lifeEvent.creator?.fullName ||
  `${lifeEvent.creator?.firstName || ""} ${lifeEvent.creator?.lastName || ""}`.trim() ||
  "همراه زندگی شما";

await prisma.notification.create({
  data: {
    userId: receiverId,
    type: "life_companion_event_created",
    title: "رویداد جدید",
    body: `${creatorName} یک "${lifeEvent.eventType}" جدید ثبت کرد.`,
    data: {
      lifeEventId: lifeEvent.id,
      creatorId: userId,
      creatorName,
      eventType: lifeEvent.eventType,
      targetPath: "/life-companion/events",
    },
  },
});

    return res.json({
      ok: true,
      lifeEvent,
    });
  } catch (err) {
    console.error("CREATE LIFE EVENT ERROR:", err);

    return res.status(500).json({
      message: "خطا در ثبت رویداد",
    });
  }
});


// ===============================
// انجام شدن رویداد
// ===============================
router.patch("/life-events/:eventId/complete", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = Number(req.params.eventId);

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const lifeEvent = await prisma.lifeEvent.findFirst({
      where: {
        id: eventId,
        lifeCompanionId: companion.id,
      },
    });

    if (!lifeEvent) {
      return res.status(404).json({
        message: "رویداد پیدا نشد",
      });
    }

    if (lifeEvent.completed) {
      return res.status(400).json({
        message: "این رویداد قبلاً انجام شده است",
      });
    }

    const updatedEvent = await prisma.lifeEvent.update({
      where: {
        id: eventId,
      },
      data: {
        completed: true,
        completedById: userId,
        completedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      lifeEvent: updatedEvent,
    });
  } catch (err) {
    console.error("COMPLETE LIFE EVENT ERROR:", err);

    return res.status(500).json({
      message: "خطا در ثبت انجام شدن رویداد",
    });
  }
});

// ===============================
// حذف رویداد
// ===============================
router.delete("/life-events/:eventId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = Number(req.params.eventId);

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const lifeEvent = await prisma.lifeEvent.findFirst({
      where: {
        id: eventId,
        lifeCompanionId: companion.id,
      },
    });

    if (!lifeEvent) {
      return res.status(404).json({
        message: "رویداد پیدا نشد",
      });
    }

    const receiverId =
  companion.user1Id === userId ? companion.user2Id : companion.user1Id;

const deletingUser = await prisma.user.findUnique({
  where: {
    id: userId,
  },
  select: {
    firstName: true,
    lastName: true,
    fullName: true,
  },
});

const deleterName =
  deletingUser?.fullName ||
  `${deletingUser?.firstName || ""} ${deletingUser?.lastName || ""}`.trim() ||
  "همراه زندگی شما";

await prisma.notification.create({
  data: {
    userId: receiverId,
    type: "life_companion_event_deleted",
    title: "حذف رویداد",
    body: `${deleterName} رویداد ${lifeEvent.eventType} را حذف کرد.`,
    data: {
      lifeEventId: lifeEvent.id,
      deleterId: userId,
      deleterName,
      eventType: lifeEvent.eventType,
      targetPath: "/life-companion/events",
    },
  },
});

    await prisma.lifeEvent.delete({
      where: {
        id: eventId,
      },
    });

    return res.json({
      ok: true,
      message: "رویداد حذف شد",
    });
  } catch (err) {
    console.error("DELETE LIFE EVENT ERROR:", err);

    return res.status(500).json({
      message: "خطا در حذف رویداد",
    });
  }
});

// ===============================
// ویرایش رویداد
// ===============================
router.put("/life-events/:eventId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = Number(req.params.eventId);

    const {
      eventType,
      eventDate,
      eventTime,
      description,
    } = req.body;

    if (!eventType?.trim() || !eventDate) {
      return res.status(400).json({
        message: "نوع رویداد و تاریخ الزامی است",
      });
    }

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const lifeEvent = await prisma.lifeEvent.findFirst({
      where: {
        id: eventId,
        lifeCompanionId: companion.id,
      },
    });

    if (!lifeEvent) {
      return res.status(404).json({
        message: "رویداد پیدا نشد",
      });
    }

    if (lifeEvent.completed) {
      return res.status(400).json({
        message: "رویداد انجام‌شده قابل ویرایش نیست",
      });
    }

    const updatedEvent = await prisma.lifeEvent.update({
      where: {
        id: eventId,
      },
      data: {
        eventType,
        eventDate: new Date(eventDate),
        eventTime: eventTime || null,
        description: description || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    const receiverId =
  companion.user1Id === userId ? companion.user2Id : companion.user1Id;

const editorUser = await prisma.user.findUnique({
  where: {
    id: userId,
  },
  select: {
    firstName: true,
    lastName: true,
    fullName: true,
  },
});

const editorName =
  editorUser?.fullName ||
  `${editorUser?.firstName || ""} ${editorUser?.lastName || ""}`.trim() ||
  "همراه زندگی شما";

await prisma.notification.create({
  data: {
    userId: receiverId,
    type: "life_companion_event_updated",
    title: "ویرایش رویداد",
    body: `${editorName} رویداد ${updatedEvent.eventType} را ویرایش کرد.`,
    data: {
      lifeEventId: updatedEvent.id,
      editorId: userId,
      editorName,
      eventType: updatedEvent.eventType,
      targetPath: "/life-companion/events",
    },
  },
});

    return res.json({
      ok: true,
      lifeEvent: updatedEvent,
    });
  } catch (err) {
    console.error("UPDATE LIFE EVENT ERROR:", err);

    return res.status(500).json({
      message: "خطا در ویرایش رویداد",
    });
  }
});

// ===============================
// دریافت رویدادها و قرارهای مشترک
// ===============================
router.get("/life-events", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const companion = await prisma.lifeCompanion.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!companion) {
      return res.status(404).json({
        message: "همراه زندگی فعالی پیدا نشد",
      });
    }

    const lifeEvents = await prisma.lifeEvent.findMany({
      where: {
        lifeCompanionId: companion.id,
      },
      orderBy: {
        eventDate: "asc",
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      lifeEvents,
    });
  } catch (err) {
    console.error("GET LIFE EVENTS ERROR:", err);

    return res.status(500).json({
      message: "خطا در دریافت رویدادها",
    });
  }
});

  return router;
};