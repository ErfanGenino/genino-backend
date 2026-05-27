const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (prisma) => {
  const router = express.Router();

  async function isParentOfChild(prisma, childId, userId) {
  const parent = await prisma.childAdmin.findFirst({
    where: {
      childId,
      userId,
      role: {
        in: ["father", "mother"],
      },
    },
  });

  return !!parent;
}

  router.get("/child/:childId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const childId = Number(req.params.childId);

    if (!childId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه کودک معتبر نیست.",
      });
    }

    const access = await prisma.childAdmin.findFirst({
      where: {
        childId,
        userId,
      },
    });

    if (!access) {
      return res.status(403).json({
        ok: false,
        message: "شما به این کودک دسترسی ندارید.",
      });
    }

    const albums = await prisma.memoryAlbum.findMany({
      where: {
        childId,
      },
      include: {
  photos: {
    orderBy: { createdAt: "desc" },
  },

  likes: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },

  comments: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
},
      orderBy: {
        createdAt: "desc",
      },
    });

    const canManageAlbums = await isParentOfChild(prisma, childId, userId);

    res.json({
  ok: true,
  albums,
  canManageAlbums,
  currentUserId: userId,
});
  } catch (err) {
    console.error("GET CHILD MEMORY ALBUMS ERROR:", err);

    res.status(500).json({
      ok: false,
      message: "خطای سرور در دریافت آلبوم‌ها",
    });
  }
});

router.post("/child/:childId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const childId = Number(req.params.childId);
    const { title, description } = req.body;

    if (!childId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه کودک معتبر نیست.",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        ok: false,
        message: "نام آلبوم الزامی است.",
      });
    }

    const isParent = await isParentOfChild(prisma, childId, userId);

if (!isParent) {
  return res.status(403).json({
    ok: false,
    message: "دسترسی شما محدود است. فقط پدر یا مادر کودک می‌توانند آلبوم بسازند.",
  });
}

    const album = await prisma.memoryAlbum.create({
      data: {
        userId,
        childId,
        title: title.trim(),
        description: description?.trim() || null,
      },
      include: {
        photos: true,
      },
    });

    res.status(201).json({
      ok: true,
      album,
    });
  } catch (err) {
    console.error("CREATE MEMORY ALBUM ERROR:", err);

    res.status(500).json({
      ok: false,
      message: "خطای سرور در ساخت آلبوم",
    });
  }
});

router.post("/:albumId/photos", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const albumId = Number(req.params.albumId);
    const { url, fileName, mimeType, fileSize, caption } = req.body;

    if (!albumId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه آلبوم معتبر نیست.",
      });
    }

    if (!url || !String(url).trim()) {
      return res.status(400).json({
        ok: false,
        message: "آدرس عکس الزامی است.",
      });
    }

    const album = await prisma.memoryAlbum.findFirst({
  where: {
    id: albumId,
  },
  include: {
    photos: {
      select: { id: true },
    },
  },
});

if (!album) {
  return res.status(404).json({
    ok: false,
    message: "آلبوم یافت نشد.",
  });
}

const isParent = await isParentOfChild(prisma, album.childId, userId);

if (!isParent) {
  return res.status(403).json({
    ok: false,
    message: "دسترسی شما محدود است. فقط پدر یا مادر کودک می‌توانند عکس اضافه کنند.",
  });
}

  

    if ((album.photos?.length || 0) >= 30) {
      return res.status(400).json({
        ok: false,
        message: "حداکثر ۳۰ عکس برای هر آلبوم مجاز است.",
      });
    }

    const photo = await prisma.memoryAlbumPhoto.create({
      data: {
        albumId,
        url: String(url).trim(),
        fileName: fileName ? String(fileName).slice(0, 200) : null,
        mimeType: mimeType ? String(mimeType).slice(0, 100) : null,
        fileSize: fileSize ? Number(fileSize) : null,
        caption: caption ? String(caption).trim() : null,
      },
    });

    if (!album.coverUrl) {
      await prisma.memoryAlbum.update({
        where: { id: albumId },
        data: { coverUrl: photo.url },
      });
    }

    res.status(201).json({
      ok: true,
      photo,
    });
  } catch (err) {
    console.error("ADD MEMORY ALBUM PHOTO ERROR:", err);

    res.status(500).json({
      ok: false,
      message: "خطای سرور در ثبت عکس آلبوم",
    });
  }
});

router.delete("/photos/:photoId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const photoId = Number(req.params.photoId);

    if (!photoId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه عکس معتبر نیست.",
      });
    }

    const photo = await prisma.memoryAlbumPhoto.findFirst({
  where: {
    id: photoId,
  },
  include: {
    album: {
      select: {
        id: true,
        childId: true,
        coverUrl: true,
      },
    },
  },
});

    if (!photo) {
  return res.status(404).json({
    ok: false,
    message: "عکس یافت نشد.",
  });
}

const isParent = await isParentOfChild(prisma, photo.album.childId, userId);

if (!isParent) {
  return res.status(403).json({
    ok: false,
    message: "دسترسی شما محدود است. فقط پدر یا مادر کودک می‌توانند عکس را حذف کنند.",
  });
}

    await prisma.memoryAlbumPhoto.delete({
      where: {
        id: photoId,
      },
    });

    if (photo.album.coverUrl === photo.url) {
      const nextPhoto = await prisma.memoryAlbumPhoto.findFirst({
        where: {
          albumId: photo.album.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      await prisma.memoryAlbum.update({
        where: {
          id: photo.album.id,
        },
        data: {
          coverUrl: nextPhoto?.url || null,
        },
      });
    }

    res.json({
      ok: true,
      message: "عکس با موفقیت حذف شد.",
    });
  } catch (err) {
    console.error("DELETE MEMORY ALBUM PHOTO ERROR:", err);

    res.status(500).json({
      ok: false,
      message: "خطای سرور در حذف عکس آلبوم",
    });
  }
});

router.post("/:albumId/like", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const albumId = Number(req.params.albumId);

    const existing = await prisma.memoryAlbumLike.findUnique({
      where: {
        albumId_userId: { albumId, userId },
      },
    });

    if (existing) {
      await prisma.memoryAlbumLike.delete({
        where: { id: existing.id },
      });

      return res.json({ ok: true, liked: false });
    }

    await prisma.memoryAlbumLike.create({
      data: { albumId, userId },
    });

    res.json({ ok: true, liked: true });
  } catch (err) {
    console.error("TOGGLE MEMORY ALBUM LIKE ERROR:", err);
    res.status(500).json({ ok: false, message: "خطای سرور در لایک آلبوم" });
  }
});

router.post("/:albumId/comments", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const albumId = Number(req.params.albumId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, message: "متن نظر الزامی است." });
    }

    const comment = await prisma.memoryAlbumComment.create({
      data: {
        albumId,
        userId,
        text: text.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({ ok: true, comment });
  } catch (err) {
    console.error("ADD MEMORY ALBUM COMMENT ERROR:", err);
    res.status(500).json({ ok: false, message: "خطای سرور در ثبت نظر" });
  }
});

router.delete("/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const commentId = Number(req.params.commentId);

    const comment = await prisma.memoryAlbumComment.findFirst({
      where: { id: commentId },
      include: {
        album: {
          select: {
            childId: true,
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ ok: false, message: "نظر یافت نشد." });
    }

    const isParent = await isParentOfChild(prisma, comment.album.childId, userId);
    const isOwner = comment.userId === userId;

    if (!isParent && !isOwner) {
      return res.status(403).json({
        ok: false,
        message: "شما اجازه حذف این نظر را ندارید.",
      });
    }

    await prisma.memoryAlbumComment.delete({
      where: { id: commentId },
    });

    res.json({ ok: true, message: "نظر حذف شد." });
  } catch (err) {
    console.error("DELETE MEMORY ALBUM COMMENT ERROR:", err);
    res.status(500).json({ ok: false, message: "خطای سرور در حذف نظر" });
  }
});

router.delete("/:albumId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const albumId = Number(req.params.albumId);

    if (!albumId) {
      return res.status(400).json({
        ok: false,
        message: "شناسه آلبوم معتبر نیست.",
      });
    }

    const album = await prisma.memoryAlbum.findFirst({
  where: {
    id: albumId,
  },
  select: {
    id: true,
    childId: true,
  },
});

    if (!album) {
  return res.status(404).json({
    ok: false,
    message: "آلبوم یافت نشد.",
  });
}

const isParent = await isParentOfChild(prisma, album.childId, userId);

if (!isParent) {
  return res.status(403).json({
    ok: false,
    message: "دسترسی شما محدود است. فقط پدر یا مادر کودک می‌توانند آلبوم را حذف کنند.",
  });
}

    await prisma.memoryAlbum.delete({
      where: {
        id: albumId,
      },
    });

    res.json({
      ok: true,
      message: "آلبوم با موفقیت حذف شد.",
    });
  } catch (err) {
    console.error("DELETE MEMORY ALBUM ERROR:", err);

    res.status(500).json({
      ok: false,
      message: "خطای سرور در حذف آلبوم",
    });
  }
});

  return router;
};