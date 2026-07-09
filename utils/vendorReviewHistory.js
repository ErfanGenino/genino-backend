function buildVendorReviewSnapshot(vendor) {
  if (!vendor) return null;

  return {
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
      personType: vendor.personType,
      activityType: vendor.activityType,
      phone: vendor.phone,
      email: vendor.email,
      province: vendor.province,
      city: vendor.city,

      accountStatus: vendor.accountStatus,
      reviewStatus: vendor.reviewStatus,
      documentsStatus: vendor.documentsStatus,
      publishStatus: vendor.publishStatus,

      selectedPackageTitle: vendor.selectedPackageTitle,
      selectedPackagePrice: vendor.selectedPackagePrice,
      selectedPackageFinalPrice: vendor.selectedPackageFinalPrice,

      selectedAmbassadorCode: vendor.selectedAmbassadorCode,
      selectedAmbassadorName: vendor.selectedAmbassadorName,
      selectedAmbassadorPhone: vendor.selectedAmbassadorPhone,

      bankName: vendor.bankName,
      accountNumber: vendor.accountNumber,
      cardNumber: vendor.cardNumber,
      shebaNumber: vendor.shebaNumber,
    },

    documents: (vendor.documents || []).map((doc) => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      status: doc.status,
      adminNote: doc.adminNote,
      createdAt: doc.createdAt,
    })),
  };
}

async function createVendorReviewHistory({
  prisma,
  vendorId,
  adminId = null,
  action,
  message = "",
  correctionFields = [],
}) {
  const currentVendor = await prisma.vendorAccount.findUnique({
    where: {
      id: Number(vendorId),
    },
    include: {
      documents: true,
    },
  });

  if (!currentVendor) {
    return {
      ok: false,
      status: 404,
      message: "فروشنده پیدا نشد.",
    };
  }

  const history = await prisma.vendorReviewHistory.create({
    data: {
      vendorId: Number(vendorId),
      adminId: adminId || null,
      action,
      message,
      correctionFields,
      snapshot: buildVendorReviewSnapshot(currentVendor),
    },
  });

  return {
    ok: true,
    history,
    vendor: currentVendor,
  };
}

module.exports = {
  buildVendorReviewSnapshot,
  createVendorReviewHistory,
};