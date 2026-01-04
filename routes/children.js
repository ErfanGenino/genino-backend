const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // GET /api/children
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const children = await prisma.child.findMany({
      where: {
        admins: {
          some: {
            userId,
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



// POST /api/children
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, gender, birthDate } = req.body;

    // 1️⃣ ساخت کودک (بدون userId)
    const child = await prisma.child.create({
      data: {
        fullName,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
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
      const { fullName, gender, birthDate } = req.body;

      const child = await prisma.child.findFirst({
  where: {
    id: childId,
    admins: {
      some: {
        userId,
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
      },
    },
  },
});


      if (!child) {
        return res.status(404).json({ message: "کودک پیدا نشد" });
      }

      await prisma.child.delete({
        where: { id: childId },
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("❌ Error deleting child:", error);
      res.status(500).json({ message: "خطا در حذف کودک" });
    }
  });

  return router;
};
