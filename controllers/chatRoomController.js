exports.getRoomMessages = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    const messages = await prisma.chatRoomMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        replyToMessage: {
          select: {
            id: true,
            text: true,
            type: true,
            fileUrl: true,
            duration: true,
            deletedForEveryoneAt: true,
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        forwardedFromMessage: {
          select: {
            id: true,
            text: true,
            type: true,
            fileUrl: true,
            duration: true,
            deletedForEveryoneAt: true,
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return res.json({
      ok: true,
      messages,
    });
  } catch (err) {
    console.error("GET ROOM MESSAGES ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.sendRoomMessage = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);
    const {
      text,
      type = "text",
      fileUrl = null,
      duration = null,
      replyToMessageId = null,
      forwardedFromMessageId = null,
    } = req.body || {};

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    const isMuted = await prisma.chatRoomMute.findUnique({
  where: {
    roomId_userId: {
      roomId,
      userId: currentUserId,
    },
  },
  select: {
    id: true,
  },
});

if (isMuted) {
  return res.status(403).json({
    ok: false,
    message: "شما در این اتاق میوت شده‌اید و نمی‌توانید پیام ارسال کنید.",
  });
}

    const safeText = typeof text === "string" ? text.trim() : "";

    if (!safeText && !fileUrl) {
      return res.status(400).json({ ok: false, message: "پیام خالی است." });
    }

    const message = await prisma.chatRoomMessage.create({
      data: {
        roomId,
        senderId: currentUserId,
        text: safeText || null,
        type,
        fileUrl,
        duration: duration || null,
        replyToMessageId: replyToMessageId || null,
        forwardedFromMessageId: forwardedFromMessageId || null,
      },
      include: {
        sender: {
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
      item: message,
    });
  } catch (err) {
    console.error("SEND ROOM MESSAGE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.deleteRoomMessage = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const messageId = Number(req.params.messageId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!messageId || Number.isNaN(messageId)) {
      return res.status(400).json({ ok: false, message: "پیام نامعتبر است." });
    }

    const message = await prisma.chatRoomMessage.findUnique({
  where: { id: messageId },
  select: {
    id: true,
    roomId: true,
    senderId: true,
    deletedForEveryoneAt: true,
    room: {
      select: {
        id: true,
        creatorId: true,
      },
    },
  },
});

if (!message) {
  return res.status(404).json({ ok: false, message: "پیام پیدا نشد." });
}

const isSender = message.senderId === currentUserId;
const isRoomManager = Number(message.room?.creatorId || 0) === currentUserId;

if (!isSender && !isRoomManager) {
  return res.status(403).json({
    ok: false,
    message: "فقط فرستنده پیام یا مدیر اتاق می‌تواند آن را حذف کند.",
  });
}

    if (message.deletedForEveryoneAt) {
      return res.json({
        ok: true,
        item: {
          id: message.id,
          roomId: message.roomId,
          deletedForEveryoneAt: message.deletedForEveryoneAt,
        },
      });
    }

    const deletedMessage = await prisma.chatRoomMessage.update({
      where: { id: messageId },
      data: {
        deletedForEveryoneAt: new Date(),
        text: null,
        fileUrl: null,
      },
      select: {
        id: true,
        roomId: true,
        senderId: true,
        deletedForEveryoneAt: true,
      },
    });

    return res.json({
      ok: true,
      item: deletedMessage,
    });
  } catch (err) {
    console.error("DELETE ROOM MESSAGE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.reactToRoomMessage = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const messageId = Number(req.params.messageId);
    const emoji = typeof req.body?.emoji === "string" ? req.body.emoji.trim() : "";

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!messageId || Number.isNaN(messageId)) {
      return res.status(400).json({ ok: false, message: "پیام نامعتبر است." });
    }

    if (!emoji) {
      return res.status(400).json({ ok: false, message: "ایموجی نامعتبر است." });
    }

    const message = await prisma.chatRoomMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        roomId: true,
        deletedForEveryoneAt: true,
      },
    });

    if (!message) {
      return res.status(404).json({ ok: false, message: "پیام پیدا نشد." });
    }

    if (message.deletedForEveryoneAt) {
      return res.status(400).json({
        ok: false,
        message: "برای پیام حذف‌شده نمی‌توان ری‌اکشن ثبت کرد.",
      });
    }

    await prisma.chatRoomMessageReaction.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: currentUserId,
        },
      },
      update: {
        emoji,
      },
      create: {
        messageId,
        userId: currentUserId,
        emoji,
      },
    });

    const updatedMessage = await prisma.chatRoomMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        roomId: true,
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return res.json({
      ok: true,
      item: updatedMessage,
    });
  } catch (err) {
    console.error("REACT TO ROOM MESSAGE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.upsertRoomPresence = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);
    console.log("UPSERT ROOM PRESENCE HIT:", {
  currentUserId,
  roomId,
});



    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, isActive: true },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    const now = new Date();

    await prisma.chatRoomPresence.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId: currentUserId,
        },
      },
      update: {
        lastSeenAt: now,
      },
      create: {
        roomId,
        userId: currentUserId,
        joinedAt: now,
        lastSeenAt: now,
      },
    });
    console.log("UPSERT ROOM PRESENCE SAVED:", {
  currentUserId,
  roomId,
});


    return res.json({ ok: true });
  } catch (err) {
    console.error("UPSERT ROOM PRESENCE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.getRoomPresence = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);
    console.log("GET ROOM PRESENCE HIT:", {
  currentUserId,
  roomId,
});


    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, isActive: true },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    const activeSince = new Date(Date.now() - 60 * 1000);

    const items = await prisma.chatRoomPresence.findMany({
      where: {
        roomId,
        lastSeenAt: {
          gte: activeSince,
        },
      },
      orderBy: {
        lastSeenAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    console.log(
  "GET ROOM PRESENCE ITEMS:",
  items.map((item) => ({
    roomId: item.roomId,
    userId: item.userId,
    lastSeenAt: item.lastSeenAt,
    name:
      item.user.fullName?.trim() ||
      `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() ||
      item.user.username ||
      "کاربر ژنینو",
  }))
);


    return res.json({
      ok: true,
      items: items.map((item) => ({
        id: item.user.id,
        name:
          item.user.fullName?.trim() ||
          `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() ||
          item.user.username ||
          "کاربر ژنینو",
        avatarUrl: item.user.avatarUrl || null,
        lastSeenAt: item.lastSeenAt,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("GET ROOM PRESENCE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.getChatRooms = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const rooms = await prisma.chatRoom.findMany({
      where: {
        isActive: true,
        id: {
          notIn: [1, 2, 3, 4],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: {
      id: true,
      fullName: true,
      firstName: true,
      lastName: true,
      username: true,
    },
  },
  _count: {
    select: {
      favoritedBy: true,
    },
  },
},
    });

    return res.json({
      ok: true,
      items: rooms,
    });
  } catch (err) {
    console.error("GET CHAT ROOMS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.createChatRoom = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";
    const imageUrl =
      typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : "";

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!title) {
      return res.status(400).json({ ok: false, message: "نام اتاق الزامی است." });
    }

    if (title.length < 2) {
      return res.status(400).json({ ok: false, message: "نام اتاق خیلی کوتاه است." });
    }

    if (title.length > 60) {
      return res.status(400).json({ ok: false, message: "نام اتاق خیلی طولانی است." });
    }

    const room = await prisma.chatRoom.create({
      data: {
        title,
        description: description || "اتاق ساخته‌شده توسط کاربر",
        imageUrl: imageUrl || null,
        creatorId: currentUserId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      ok: true,
      item: room,
    });
  } catch (err) {
    console.error("CREATE CHAT ROOM ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};
exports.deleteChatRoom = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        creatorId: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    if (!room.creatorId || room.creatorId !== currentUserId) {
      return res.status(403).json({
        ok: false,
        message: "فقط سازنده اتاق می‌تواند آن را حذف کند.",
      });
    }

    const deletedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return res.json({
      ok: true,
      item: deletedRoom,
    });
  } catch (err) {
    console.error("DELETE CHAT ROOM ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.updateChatRoom = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);

    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";
    const imageUrl =
      typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : "";

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    if (!title) {
      return res.status(400).json({ ok: false, message: "نام اتاق الزامی است." });
    }

    if (title.length < 2) {
      return res.status(400).json({ ok: false, message: "نام اتاق خیلی کوتاه است." });
    }

    if (title.length > 60) {
      return res.status(400).json({ ok: false, message: "نام اتاق خیلی طولانی است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        creatorId: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    if (!room.creatorId || room.creatorId !== currentUserId) {
      return res.status(403).json({
        ok: false,
        message: "فقط سازنده اتاق می‌تواند آن را ویرایش کند.",
      });
    }

    const updatedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        title,
        description: description || "اتاق ساخته‌شده توسط کاربر",
        imageUrl: imageUrl || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      ok: true,
      item: updatedRoom,
    });
  } catch (err) {
    console.error("UPDATE CHAT ROOM ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.addFavoriteChatRoom = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    const favorite = await prisma.favoriteChatRoom.upsert({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId,
        },
      },
      update: {},
      create: {
        userId: currentUserId,
        roomId,
      },
      select: {
        id: true,
        userId: true,
        roomId: true,
        createdAt: true,
      },
    });

    return res.json({
      ok: true,
      item: favorite,
      message: `اتاق ${room.title} به علاقه‌مندی‌ها اضافه شد.`,
    });
  } catch (err) {
    console.error("ADD FAVORITE CHAT ROOM ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.removeFavoriteChatRoom = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const favorite = await prisma.favoriteChatRoom.findUnique({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId,
        },
      },
      select: {
        id: true,
        roomId: true,
      },
    });

    if (!favorite) {
      return res.json({
        ok: true,
        message: "این اتاق از قبل در علاقه‌مندی‌ها نبود.",
      });
    }

    await prisma.favoriteChatRoom.delete({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId,
        },
      },
    });

    return res.json({
      ok: true,
      message: "اتاق از علاقه‌مندی‌ها حذف شد.",
    });
  } catch (err) {
    console.error("REMOVE FAVORITE CHAT ROOM ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.getMyFavoriteChatRooms = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const items = await prisma.favoriteChatRoom.findMany({
      where: {
        userId: currentUserId,
        room: {
          isActive: true,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        roomId: true,
        createdAt: true,
        room: {
          select: {
           id: true,
           title: true,
           description: true,
           imageUrl: true,
           creatorId: true,
           createdAt: true,
           updatedAt: true,
           _count: {
           select: {
           favoritedBy: true,
            },
           },
          },
        },
      },
    });

    return res.json({
      ok: true,
      items,
    });
  } catch (err) {
    console.error("GET MY FAVORITE CHAT ROOMS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.deactivateInactiveChatRooms = async (prisma) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rooms = await prisma.chatRoom.findMany({
      where: {
        isActive: true,
        id: {
          notIn: [1, 2, 3, 4],
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    const roomIdsToDeactivate = rooms
      .filter((room) => {
        const lastMessage = room.messages[0];
        const lastActivityAt = lastMessage?.createdAt || room.createdAt;

        return lastActivityAt < sevenDaysAgo;
      })
      .map((room) => room.id);

    if (!roomIdsToDeactivate.length) {
      return {
        ok: true,
        count: 0,
      };
    }

    await prisma.chatRoom.updateMany({
      where: {
        id: {
          in: roomIdsToDeactivate,
        },
      },
      data: {
        isActive: false,
      },
    });

    return {
      ok: true,
      count: roomIdsToDeactivate.length,
      roomIds: roomIdsToDeactivate,
    };
  } catch (err) {
    console.error("DEACTIVATE INACTIVE CHAT ROOMS ERROR:", err);
    return {
      ok: false,
      count: 0,
    };
  }
};

exports.deleteExpiredRoomMessages = async (prisma) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.chatRoomMessage.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return {
      ok: true,
      count: Number(result?.count || 0),
    };
  } catch (err) {
    console.error("DELETE EXPIRED ROOM MESSAGES ERROR:", err);
    return {
      ok: false,
      count: 0,
    };
  }
};

exports.muteRoomUser = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);
    const targetUserId = Number(req.params.userId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return res.status(400).json({ ok: false, message: "کاربر نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        creatorId: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    if (Number(room.creatorId || 0) !== currentUserId) {
      return res.status(403).json({
        ok: false,
        message: "فقط مدیر اتاق می‌تواند کاربران را میوت کند.",
      });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        ok: false,
        message: "مدیر اتاق نمی‌تواند خودش را میوت کند.",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ ok: false, message: "کاربر پیدا نشد." });
    }

    const mute = await prisma.chatRoomMute.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
      update: {
        mutedById: currentUserId,
      },
      create: {
        roomId,
        userId: targetUserId,
        mutedById: currentUserId,
      },
      select: {
        id: true,
        roomId: true,
        userId: true,
        mutedById: true,
        createdAt: true,
      },
    });

    const targetUserName =
      targetUser.fullName?.trim() ||
      `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() ||
      targetUser.username ||
      "کاربر ژنینو";

    return res.json({
      ok: true,
      item: mute,
      message: `${targetUserName} در این اتاق میوت شد.`,
    });
  } catch (err) {
    console.error("MUTE ROOM USER ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.unmuteRoomUser = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);
    const targetUserId = Number(req.params.userId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return res.status(400).json({ ok: false, message: "کاربر نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        creatorId: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

    if (Number(room.creatorId || 0) !== currentUserId) {
      return res.status(403).json({
        ok: false,
        message: "فقط مدیر اتاق می‌تواند کاربران را آن‌میوت کند.",
      });
    }

    const existingMute = await prisma.chatRoomMute.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingMute) {
      return res.json({
        ok: true,
        message: "این کاربر از قبل میوت نبود.",
      });
    }

    await prisma.chatRoomMute.delete({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
    });

    return res.json({
      ok: true,
      message: "کاربر از حالت میوت خارج شد.",
    });
  } catch (err) {
    console.error("UNMUTE ROOM USER ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.getMutedRoomUsers = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const roomId = Number(req.params.roomId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!roomId || Number.isNaN(roomId)) {
      return res.status(400).json({ ok: false, message: "اتاق نامعتبر است." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        creatorId: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ ok: false, message: "اتاق پیدا نشد." });
    }

  

    const items = await prisma.chatRoomMute.findMany({
      where: {
        roomId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        roomId: true,
        userId: true,
        mutedById: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      items: items.map((item) => ({
        id: item.id,
        roomId: item.roomId,
        userId: item.userId,
        mutedById: item.mutedById,
        createdAt: item.createdAt,
        user: {
          id: item.user.id,
          name:
            item.user.fullName?.trim() ||
            `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() ||
            item.user.username ||
            "کاربر ژنینو",
          avatarUrl: item.user.avatarUrl || null,
        },
      })),
    });
  } catch (err) {
    console.error("GET MUTED ROOM USERS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};