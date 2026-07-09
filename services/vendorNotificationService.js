async function createVendorNotification(prisma, {
  vendorId,
  type,
  title,
  body = null,
  data = null,
}) {
  if (!vendorId || !type || !title) {
    return null;
  }

  return prisma.vendorNotification.create({
    data: {
      vendorId: Number(vendorId),
      type,
      title,
      body,
      data,
    },
  });
}

module.exports = {
  createVendorNotification,
};