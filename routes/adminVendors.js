const express = require("express");

const {
  createVendorReviewHistory,
} = require("../utils/vendorReviewHistory");

module.exports = function (prisma) {
  const router = express.Router();


  router.get("/", async (req, res) => {
    try {
      const vendors = await prisma.vendorAccount.findMany({
        where: {
  OR: [
    {
      accountStatus: {
        in: [
          "CONTRACT_AND_DOCUMENTS_SUBMITTED",
          "UNDER_REVIEW",
          "NEEDS_CORRECTION",
          "APPROVED",
          "ACTIVE",
          "REJECTED",
          "SUSPENDED",
        ],
      },
    },
    {
      reviewStatus: {
        in: [
          "UNDER_REVIEW",
          "NEEDS_CORRECTION",
          "APPROVED",
          "REJECTED",
        ],
      },
    },
  ],
},
        include: {
  documents: {
    orderBy: { createdAt: "desc" },
  },
},
        orderBy: {
          updatedAt: "desc",
        },
      });

      return res.json({
        ok: true,
        vendors,
      });
    } catch (err) {
      console.error("ADMIN VENDORS LIST ERROR:", err);

      return res.status(500).json({
        ok: false,
        message: "خطای داخلی سرور",
      });
    }
  });

  router.get("/:id/review-history", async (req, res) => {
  try {
    const vendorId = Number(req.params.id);

    const history = await prisma.vendorReviewHistory.findMany({
      where: {
        vendorId,
      },
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ok: true,
      history,
    });
  } catch (err) {
    console.error("GET_VENDOR_REVIEW_HISTORY_ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطا در دریافت تاریخچه بررسی فروشنده.",
    });
  }
});

  // تأیید فروشنده
router.post("/:id/approve", async (req, res) => {
  try {
    const vendorId = Number(req.params.id);


    const historyResult = await createVendorReviewHistory({
  prisma,
  vendorId,
  adminId: req.admin?.id || null,
  action: "APPROVED",
  message: "فروشنده توسط مدیریت تأیید شد.",
  correctionFields: [],
});

if (!historyResult.ok) {
  return res.status(historyResult.status).json(historyResult);
}

const vendor = await prisma.vendorAccount.update({
  where: {
    id: vendorId,
  },
  data: {
    accountStatus: "ACTIVE",
    publishStatus: "ALLOWED",

    reviewStatus: "APPROVED",
    documentsStatus: "APPROVED",

    approvedAt: new Date(),

    rejectionReason: null,
    correctionReason: null,
    correctionFields: [],
  },
});

    return res.json({
      ok: true,
      vendor,
    });
  } catch (err) {
    console.error("APPROVE_VENDOR_ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور",
    });
  }
});

// درخواست اصلاح مدارک یا اطلاعات فروشنده
router.post("/:id/request-correction", async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    const { reason, fields } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        ok: false,
        message: "علت درخواست اصلاح الزامی است.",
      });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
  return res.status(400).json({
    ok: false,
    message: "حداقل یک مورد برای اصلاح باید انتخاب شود.",
  });
}


const historyResult = await createVendorReviewHistory({
  prisma,
  vendorId,
  adminId: req.admin?.id || null,
  action: "CORRECTION_REQUESTED",
  message: reason.trim(),
  correctionFields: fields,
});

if (!historyResult.ok) {
  return res.status(historyResult.status).json(historyResult);
}


    const vendor = await prisma.vendorAccount.update({
      where: { id: vendorId },
      data: {
        accountStatus: "NEEDS_CORRECTION",
        reviewStatus: "NEEDS_CORRECTION",
        documentsStatus: "REJECTED",
        publishStatus: "NOT_ALLOWED",

        correctionReason: reason.trim(),
        correctionFields: fields,
        rejectionReason: null,
      },
    });



    return res.json({
      ok: true,
      vendor,
    });
  } catch (err) {
    console.error("REQUEST_VENDOR_CORRECTION_ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور",
    });
  }
});

// رد فروشنده
router.post("/:id/reject", async (req, res) => {
  try {
    const vendorId = Number(req.params.id);
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        ok: false,
        message: "علت رد فروشنده الزامی است.",
      });
    }

    const historyResult = await createVendorReviewHistory({
  prisma,
  vendorId,
  adminId: req.admin?.id || null,
  action: "REJECTED",
  message: reason.trim(),
  correctionFields: [],
});

if (!historyResult.ok) {
  return res.status(historyResult.status).json(historyResult);
}


    const vendor = await prisma.vendorAccount.update({
      where: { id: vendorId },
      data: {
        accountStatus: "REJECTED",
        reviewStatus: "REJECTED",
        documentsStatus: "REJECTED",
        publishStatus: "NOT_ALLOWED",

        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
        correctionReason: null,
        correctionFields: [],
      },
    });



    return res.json({
      ok: true,
      vendor,
    });
  } catch (err) {
    console.error("REJECT_VENDOR_ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای داخلی سرور",
    });
  }
});

  return router;
};