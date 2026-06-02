// controllers/medicalRecordController.js

// controllers/medicalRecordController.js

exports.listMedicalRecords = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const childId = req.query.childId ? Number(req.query.childId) : null;

if (childId) {
  const admin = await prisma.childAdmin.findFirst({
    where: {
      childId,
      userId,
      status: "CONNECTED",
      role: {
        in: ["father", "mother"],
      },
    },
  });

  if (!admin) {
    return res.status(403).json({
      ok: false,
      message: "شما دسترسی به پرونده پزشکی این کودک ندارید.",
    });
  }
}

const where = childId
  ? { childId }
  : { userId, childId: null };

const items = await prisma.medicalRecord.findMany({
  where,
  orderBy: { recordDate: "desc" },
  include: {
    attachments: {
      orderBy: { id: "asc" },
    },
  },
});

    return res.json({ ok: true, items });
  } catch (err) {
    console.error("LIST MEDICAL RECORDS ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};



exports.getMedicalRecordById = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;
    const recordId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!recordId || Number.isNaN(recordId)) {
      return res.status(400).json({ ok: false, message: "شناسه نامعتبر است." });
    }

    const item = await prisma.medicalRecord.findFirst({
  where: { id: recordId },
  include: {
    attachments: { orderBy: { id: "asc" } },
  },
});

if (!item) {
  return res.status(404).json({ ok: false, message: "رکورد یافت نشد." });
}

if (item.childId) {
  const admin = await prisma.childAdmin.findFirst({
    where: {
      childId: item.childId,
      userId,
      status: "CONNECTED",
      role: {
        in: ["father", "mother"],
      },
    },
  });

  if (!admin) {
    return res.status(403).json({
      ok: false,
      message: "شما اجازه مشاهده این پرونده پزشکی کودک را ندارید.",
    });
  }
} else if (item.userId !== userId) {
  return res.status(403).json({
    ok: false,
    message: "شما اجازه مشاهده این پرونده پزشکی را ندارید.",
  });
}


    return res.json({ ok: true, item });
  } catch (err) {
    console.error("GET MEDICAL RECORD BY ID ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};



exports.createMedicalRecord = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const {
  title,
  doctor,
  category,
  recordDate,
  description,
  childId,
} = req.body;

    if (!title || !category || !recordDate) {
      return res.status(400).json({
        ok: false,
        message: "عنوان، دسته و تاریخ الزامی است.",
      });
    }

    const numericChildId = childId ? Number(childId) : null;

if (numericChildId) {
  const admin = await prisma.childAdmin.findFirst({
    where: {
      childId: numericChildId,
      userId,
      status: "CONNECTED",
      role: {
        in: ["father", "mother"],
      },
    },
  });

  if (!admin) {
    return res.status(403).json({
      ok: false,
      message: "شما اجازه ثبت پرونده پزشکی برای این کودک را ندارید.",
    });
  }
}

    const newRecord = await prisma.medicalRecord.create({
      data: {
        userId,
        childId: numericChildId,
        title,
        doctor,
        category,
        recordDate: new Date(recordDate),
        description,
      },
    });

    return res.json({ ok: true, debug: "medical-create-v2", item: newRecord });
  } catch (err) {
    console.error("CREATE MEDICAL RECORD ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};



exports.updateMedicalRecord = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;
    const recordId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    if (!recordId || Number.isNaN(recordId)) {
      return res.status(400).json({ ok: false, message: "شناسه نامعتبر است." });
    }

    const { title, doctor, category, recordDate, description } = req.body || {};

    // حداقل‌ها: اگر کاربر چیزی برای آپدیت نفرستاده باشد
    const hasAnyField =
      title !== undefined ||
      doctor !== undefined ||
      category !== undefined ||
      recordDate !== undefined ||
      description !== undefined;

    if (!hasAnyField) {
      return res.status(400).json({
        ok: false,
        message: "حداقل یک فیلد برای ویرایش ارسال کنید.",
      });
    }

    // چک مالکیت
    const existing = await prisma.medicalRecord.findFirst({
  where: { id: recordId },
  select: {
    id: true,
    userId: true,
    childId: true,
  },
});

if (!existing) {
  return res.status(404).json({ ok: false, message: "رکورد یافت نشد." });
}

if (existing.childId) {
  const admin = await prisma.childAdmin.findFirst({
    where: {
      childId: existing.childId,
      userId,
      status: "CONNECTED",
      role: {
        in: ["father", "mother"],
      },
    },
  });

  if (!admin) {
    return res.status(403).json({
      ok: false,
      message: "شما اجازه ویرایش این پرونده پزشکی کودک را ندارید.",
    });
  }
} else if (existing.userId !== userId) {
  return res.status(403).json({
    ok: false,
    message: "شما اجازه ویرایش این پرونده پزشکی را ندارید.",
  });
}


    // آماده‌سازی دیتا (فقط فیلدهایی که ارسال شده‌اند)
    const data = {};
    if (title !== undefined) data.title = title;
    if (doctor !== undefined) data.doctor = doctor;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;

    if (recordDate !== undefined) {
      const d = new Date(recordDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({
          ok: false,
          message: "فرمت تاریخ نامعتبر است. مثل 2026-02-25 ارسال کنید.",
        });
      }
      data.recordDate = d;
    }

    // اعتبارسنجی حداقلی (اگر فیلدها فرستاده شده‌اند)
    if (data.title !== undefined && !String(data.title).trim()) {
      return res.status(400).json({ ok: false, message: "عنوان نمی‌تواند خالی باشد." });
    }
    if (data.category !== undefined && !String(data.category).trim()) {
      return res.status(400).json({ ok: false, message: "دسته درمانی نمی‌تواند خالی باشد." });
    }

    const updated = await prisma.medicalRecord.update({
      where: { id: recordId },
      data,
      include: { attachments: { orderBy: { id: "asc" } } },
    });

    return res.json({ ok: true, item: updated });
  } catch (err) {
    console.error("UPDATE MEDICAL RECORD ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};



exports.deleteMedicalRecord = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;
    const recordId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    // بررسی اینکه رکورد متعلق به همین کاربر باشد
   const existing = await prisma.medicalRecord.findFirst({
  where: { id: recordId },
  select: {
    id: true,
    userId: true,
    childId: true,
  },
});

if (!existing) {
  return res.status(404).json({
    ok: false,
    message: "رکورد یافت نشد.",
  });
}

if (existing.childId) {
  const admin = await prisma.childAdmin.findFirst({
    where: {
      childId: existing.childId,
      userId,
      status: "CONNECTED",
      role: {
        in: ["father", "mother"],
      },
    },
  });

  if (!admin) {
    return res.status(403).json({
      ok: false,
      message: "شما اجازه حذف این پرونده پزشکی کودک را ندارید.",
    });
  }
} else if (existing.userId !== userId) {
  return res.status(403).json({
    ok: false,
    message: "شما اجازه حذف این پرونده پزشکی را ندارید.",
  });
}

    await prisma.medicalRecord.delete({
      where: { id: recordId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE MEDICAL RECORD ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};