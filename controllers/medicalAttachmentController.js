// controllers/medicalAttachmentController.js

exports.addMedicalAttachment = async (req, res, prisma) => {
  try {
    const userId = req.user?.userId;
    const recordId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }
    if (!recordId || Number.isNaN(recordId)) {
      return res.status(400).json({ ok: false, message: "شناسه رکورد نامعتبر است." });
    }

    // ✅ چک مالکیت رکورد
    const rec = await prisma.medicalRecord.findFirst({
      where: { id: recordId, userId },
      select: { id: true },
    });

    if (!rec) {
      return res.status(404).json({
        ok: false,
        message: "رکورد پزشکی یافت نشد یا متعلق به شما نیست.",
      });
    }

    const { fileName, mimeType, fileSize, url } = req.body || {};

    if (!fileName || !mimeType || !url) {
      return res.status(400).json({
        ok: false,
        message: "fileName و mimeType و url الزامی است.",
      });
    }

    // ✅ اعتبارسنجی ساده mimeType (فقط عکس + pdf)
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(String(mimeType).toLowerCase().trim())) {
      return res.status(400).json({
        ok: false,
        message: "mimeType مجاز نیست (فقط عکس یا PDF).",
      });
    }

    const created = await prisma.medicalAttachment.create({
      data: {
        recordId,
        fileName: String(fileName).slice(0, 255),
        mimeType: String(mimeType).slice(0, 100),
        fileSize: fileSize !== undefined && fileSize !== null ? Number(fileSize) : null,
        url: String(url),
      },
    });

    return res.json({ ok: true, item: created });
  } catch (err) {
    console.error("ADD MEDICAL ATTACHMENT ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور." });
  }
};