// controllers/vendorDocumentController.js

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedDocumentTypes = [
  "NATIONAL_CARD",
  "SELFIE_WITH_NATIONAL_CARD",
  "BANK_DOCUMENT",
  "BUSINESS_LICENSE",
  "COMPANY_OFFICIAL_NEWSPAPER",
  "COMPANY_REGISTRATION",
  "REPRESENTATIVE_LETTER",
  "OTHER",
];

exports.addVendorDocument = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.vendorId);

    if (!vendorId || Number.isNaN(vendorId)) {
      return res.status(400).json({
        ok: false,
        message: "شناسه فروشنده نامعتبر است.",
      });
    }

    const vendor = await prisma.vendorAccount.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد.",
      });
    }

    if (req.user?.vendorId && Number(req.user.vendorId) !== vendorId) {
  return res.status(403).json({
    ok: false,
    message: "شما اجازه ثبت مدرک برای این فروشنده را ندارید.",
  });
}

    const { type, fileName, mimeType, fileSize, url } = req.body || {};

    if (!type || !fileName || !mimeType || !url) {
      return res.status(400).json({
        ok: false,
        message: "type و fileName و mimeType و url الزامی است.",
      });
    }

    if (!allowedDocumentTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        message: "نوع مدرک فروشنده نامعتبر است.",
      });
    }

    if (!allowedMimeTypes.includes(String(mimeType).toLowerCase().trim())) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل مجاز نیست.",
      });
    }

    const created = await prisma.vendorDocument.create({
      data: {
        vendorId,
        type,
        fileName: String(fileName).slice(0, 255),
        mimeType: String(mimeType).slice(0, 100),
        fileSize:
          fileSize !== undefined && fileSize !== null
            ? Number(fileSize)
            : null,
        url: String(url),
        status: "PENDING",
      },
    });

    return res.json({
      ok: true,
      item: created,
    });
  } catch (err) {
    console.error("ADD VENDOR DOCUMENT ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در ثبت مدرک فروشنده.",
    });
  }
};

exports.deleteVendorDocument = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.vendorId);
    const documentId = Number(req.params.documentId);

    if (
      !vendorId ||
      Number.isNaN(vendorId) ||
      !documentId ||
      Number.isNaN(documentId)
    ) {
      return res.status(400).json({
        ok: false,
        message: "شناسه نامعتبر است.",
      });
    }

    if (req.user?.vendorId && Number(req.user.vendorId) !== vendorId) {
  return res.status(403).json({
    ok: false,
    message: "شما اجازه حذف مدرک این فروشنده را ندارید.",
  });
}

    const document = await prisma.vendorDocument.findFirst({
      where: {
        id: documentId,
        vendorId,
      },
      select: { id: true },
    });

    if (!document) {
      return res.status(404).json({
        ok: false,
        message: "مدرک فروشنده پیدا نشد.",
      });
    }

    await prisma.vendorDocument.delete({
      where: { id: documentId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE VENDOR DOCUMENT ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در حذف مدرک فروشنده.",
    });
  }
};

exports.listVendorDocuments = async (req, res, prisma) => {
  try {
    const vendorId = Number(req.params.vendorId);

    if (!vendorId || Number.isNaN(vendorId)) {
      return res.status(400).json({
        ok: false,
        message: "شناسه فروشنده نامعتبر است.",
      });
    }

    if (req.user?.vendorId && Number(req.user.vendorId) !== vendorId) {
      return res.status(403).json({
        ok: false,
        message: "شما اجازه مشاهده مدارک این فروشنده را ندارید.",
      });
    }

    const vendor = await prisma.vendorAccount.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "فروشنده پیدا نشد.",
      });
    }

    const items = await prisma.vendorDocument.findMany({
      where: { vendorId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ok: true,
      items,
    });
  } catch (err) {
    console.error("LIST VENDOR DOCUMENTS ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در دریافت مدارک فروشنده.",
    });
  }
};