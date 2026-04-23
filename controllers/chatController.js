// controllers/chatController.js

exports.getConversation = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const otherUserId = Number(req.params.userId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!otherUserId || Number.isNaN(otherUserId)) {
      return res.status(400).json({ ok: false, message: "کاربر نامعتبر است." });
    }

    if (currentUserId === otherUserId) {
      return res.status(400).json({
        ok: false,
        message: "چت با خودتان مجاز نیست.",
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: currentUserId },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: currentUserId,
          user2Id: otherUserId,
        },
        select: { id: true },
      });
    }

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: currentUserId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: "read",
      },
    });

    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        messages: {
  orderBy: { createdAt: "asc" },
  include: {
    sender: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
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
        senderId: true,
        deletedForEveryoneAt: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            avatarUrl: true,
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
    senderId: true,
    deletedForEveryoneAt: true,
  },
},
    reactions: {
      select: {
        id: true,
        emoji: true,
        userId: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    },
  },
},
      },
    });

    return res.json({
      ok: true,
      conversationId: fullConversation.id,
      messages: fullConversation.messages,
    });
  } catch (err) {
    console.error("GET CONVERSATION ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.sendMessage = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const otherUserId = Number(req.params.userId);
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

    if (!otherUserId || Number.isNaN(otherUserId)) {
      return res.status(400).json({
        ok: false,
        message: "کاربر مقصد نامعتبر است.",
      });
    }

    if (currentUserId === otherUserId) {
      return res.status(400).json({
        ok: false,
        message: "نمی‌توانید به خودتان پیام بفرستید.",
      });
    }

    const safeText = typeof text === "string" ? text.trim() : "";
    const safeDuration =
      duration !== null && duration !== undefined ? Number(duration) : null;

    const hasForwardReference =
      forwardedFromMessageId !== null && forwardedFromMessageId !== undefined;

    if (!safeText && !fileUrl && !hasForwardReference) {
     return res.status(400).json({ ok: false, message: "پیام خالی است." });
    }

    if (!["text", "image", "video", "voice"].includes(type)) {
     return res.status(400).json({ ok: false, message: "نوع پیام نامعتبر است." });
    }

    if (type === "voice" && !fileUrl) {
  return res.status(400).json({
    ok: false,
    message: "برای پیام صوتی، فایل الزامی است.",
  });
}

if (
  type === "voice" &&
  (
    safeDuration === null ||
    Number.isNaN(safeDuration) ||
    safeDuration <= 0 ||
    safeDuration > 30
  )
) {
  return res.status(400).json({
    ok: false,
    message: "مدت پیام صوتی نامعتبر است.",
  });
}

    const safeReplyToMessageId =
  replyToMessageId !== null && replyToMessageId !== undefined
    ? Number(replyToMessageId)
    : null;

    const safeForwardedFromMessageId =
  forwardedFromMessageId !== null && forwardedFromMessageId !== undefined
    ? Number(forwardedFromMessageId)
    : null;

if (
  safeForwardedFromMessageId !== null &&
  (!safeForwardedFromMessageId || Number.isNaN(safeForwardedFromMessageId))
) {
  return res.status(400).json({
    ok: false,
    message: "پیام مرجع برای فوروارد نامعتبر است.",
  });
}

if (
  safeReplyToMessageId !== null &&
  (!safeReplyToMessageId || Number.isNaN(safeReplyToMessageId))
) {
  return res.status(400).json({
    ok: false,
    message: "پیام مرجع برای ریپلای نامعتبر است.",
  });
}

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: currentUserId },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: currentUserId,
          user2Id: otherUserId,
        },
        select: { id: true },
      });
    }

    if (safeReplyToMessageId !== null) {
  const replyTargetMessage = await prisma.message.findFirst({
    where: {
      id: safeReplyToMessageId,
      conversationId: conversation.id,
      deletedForEveryoneAt: null,
    },
    select: { id: true },
  });

  if (!replyTargetMessage) {
    return res.status(400).json({
      ok: false,
      message: "پیام مرجع برای ریپلای پیدا نشد.",
    });
  }
}

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUserId,
          text: safeText || null,
          type,
          fileUrl,
          duration: type === "voice" ? safeDuration : null,
          status: "sent",
          replyToMessageId: safeReplyToMessageId,
          forwardedFromMessageId: safeForwardedFromMessageId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.conversation.update({
       where: { id: conversation.id },
       data: {
         updatedAt: new Date(),
       },
      });

      return createdMessage;
    });

    return res.json({
      ok: true,
      item: message,
      conversationId: conversation.id,
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.listConversations = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            lastSocialSeenAt: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            lastSocialSeenAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: currentUserId },
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const items = conversations.map((conversation) => {
      const otherUser =
        conversation.user1Id === currentUserId
          ? conversation.user2
          : conversation.user1;

      const lastMessage = conversation.messages[0] || null;

      const otherUserName =
        otherUser?.fullName?.trim() ||
        `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() ||
        otherUser?.username ||
        "کاربر ژنینو";

      const isOnline =
        otherUser?.lastSocialSeenAt &&
        new Date(otherUser.lastSocialSeenAt).getTime() >= Date.now() - 60 * 1000;

      return {
        id: otherUser.id,
        conversationId: conversation.id,
        name: otherUserName,
        username: otherUser?.username || "",
        avatarUrl: otherUser?.avatarUrl || null,
        online: !!isOnline,
        subtitle: lastMessage
          ? lastMessage.type === "image"
            ? lastMessage.text?.trim()
              ? `آخرین گفتگو: ${lastMessage.text}`
              : "آخرین گفتگو: تصویر"
            : lastMessage.type === "video"
            ? lastMessage.text?.trim()
              ? `آخرین گفتگو: ${lastMessage.text}`
              : "آخرین گفتگو: ویدیو"
            : `آخرین گفتگو: ${lastMessage.text || ""}`
          : "گفت‌وگوی جدید",
        unreadCount: conversation._count?.messages || 0,
        lastMessageAt: lastMessage?.createdAt || conversation.updatedAt,
      };
    });

    return res.json({ ok: true, items });
  } catch (err) {
    console.error("LIST CONVERSATIONS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.deleteMessage = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const messageId = Number(req.params.messageId);

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!messageId || Number.isNaN(messageId)) {
      return res.status(400).json({ ok: false, message: "پیام نامعتبر است." });
    }

    const message = await prisma.message.findUnique({
    where: { id: messageId },
     include: {
      conversation: {
        select: {
         id: true,
         user1Id: true,
         user2Id: true,
         },
       },
      },
    });

    if (!message) {
      return res.status(404).json({ ok: false, message: "پیام پیدا نشد." });
    }

    const isParticipant =
    message.conversation?.user1Id === currentUserId ||
    message.conversation?.user2Id === currentUserId;

    if (!isParticipant) {
     return res.status(403).json({
    ok: false,
    message: "شما به این پیام دسترسی ندارید.",
      });
    }

    // اگر پیام مال خود کاربر است → حذف برای همه
    if (message.senderId === currentUserId) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          deletedForEveryoneAt: new Date(),
        },
      });

      return res.json({ ok: true, type: "delete_for_everyone" });
    }

    // اگر پیام برای کاربر دریافت شده → حذف فقط برای خودش
    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedByReceiverAt: new Date(),
      },
    });

    return res.json({ ok: true, type: "delete_for_me" });
  } catch (err) {
    console.error("DELETE MESSAGE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.reactToMessage = async (req, res, prisma) => {
  try {
    const currentUserId = req.user?.userId;
    const messageId = Number(req.params.messageId);
    const { emoji } = req.body || {};

    if (!currentUserId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!messageId || Number.isNaN(messageId)) {
      return res.status(400).json({ ok: false, message: "پیام نامعتبر است." });
    }

    const safeEmoji = typeof emoji === "string" ? emoji.trim() : "";

    if (!safeEmoji) {
      return res.status(400).json({ ok: false, message: "ری‌اکشن نامعتبر است." });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            id: true,
            user1Id: true,
            user2Id: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ ok: false, message: "پیام پیدا نشد." });
    }

    const isParticipant =
      message.conversation?.user1Id === currentUserId ||
      message.conversation?.user2Id === currentUserId;

    if (!isParticipant) {
      return res.status(403).json({
        ok: false,
        message: "شما به این پیام دسترسی ندارید.",
      });
    }

    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: currentUserId,
      },
    });

    if (existingReaction && existingReaction.emoji === safeEmoji) {
      await prisma.messageReaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
    } else if (existingReaction) {
      await prisma.messageReaction.update({
        where: {
          id: existingReaction.id,
        },
        data: {
          emoji: safeEmoji,
        },
      });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId: currentUserId,
          emoji: safeEmoji,
        },
      });
    }

    const updatedMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return res.json({
      ok: true,
      item: updatedMessage,
    });
  } catch (err) {
    console.error("REACT MESSAGE ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};

exports.deleteExpiredPrivateMessages = async (prisma) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.message.deleteMany({
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
    console.error("DELETE EXPIRED PRIVATE MESSAGES ERROR:", err);
    return {
      ok: false,
      count: 0,
    };
  }
};