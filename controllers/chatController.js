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
    const { text, type = "text", fileUrl = null } = req.body || {};

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

    if (!safeText && !fileUrl) {
      return res.status(400).json({ ok: false, message: "پیام خالی است." });
    }

    if (!["text", "image", "video"].includes(type)) {
      return res.status(400).json({ ok: false, message: "نوع پیام نامعتبر است." });
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

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUserId,
          text: safeText || null,
          type,
          fileUrl,
          status: "sent",
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
        data: {},
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