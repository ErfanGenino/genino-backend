// D:\projects\Genino\genino-backend\routes\vendorProductRoutes.js

const express = require("express");

module.exports = (prisma) => {
  const router = express.Router();
  const authMiddleware = require("../middleware/authMiddleware");


  router.post(
  "/create",
  authMiddleware,
  async (req, res) => {
    console.log("🔥 USER FROM TOKEN:", req.user);
    console.log("🔥 BODY RECEIVED:", req.body);

    try {
    const {
  title,
  price,
  description,
  categoryLinks,
  gender,
  seasons,
  ageRanges,
  inventoryRows,
  standards,
  careInstructions,
  careNote,

  brandFa,
  brandEn,
  material,
  madeInCountry,
  weight,
  length,
  width,
  height,
  hasWarranty,
  warrantyPeriod,
  warrantyUnit,
  mainImageIndex,
  physicalDetailsNote,
} = req.body;

      const images = req.body.images || [];

if (!Array.isArray(images) || images.length === 0) {
  return res.status(400).json({
    ok: false,
    message: "حداقل یک تصویر محصول لازم است",
  });
}

      const vendorId = req.user.vendorId;

      const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return JSON.parse(value);
};

const parsedCategoryLinks = parseArrayField(categoryLinks);
const parsedGender = parseArrayField(gender);
const parsedSeasons = parseArrayField(seasons);
const parsedAgeRanges = parseArrayField(ageRanges);
const parsedInventoryRows = parseArrayField(inventoryRows);
const parsedStandards = parseArrayField(standards);
const parsedCareInstructions = parseArrayField(careInstructions);

      

      // 🟡 1. گرفتن فروشنده + بسته
      const vendor = await prisma.vendorAccount.findUnique({
        where: { id: Number(vendorId) },
      });

      if (!vendor) {
        return res.status(404).json({ ok: false, message: "Vendor not found" });
      }

      const pkg = await prisma.vendorPackage.findUnique({
        where: { id: vendor.selectedPackageId },
      });

      if (!pkg) {
        return res.status(400).json({ ok: false, message: "Package not selected" });
      }

      // 🟡 2. چک limit
      if (vendor.usedProductCount >= pkg.windowCount) {
        return res.status(400).json({
          ok: false,
          message: "سقف محصولات بسته شما تمام شده",
        });
      }

      // 🟡 3. ساخت محصول
      const product = await prisma.vendorProduct.create({
        data: {
          vendorId: vendor.id,
          title,
          price: Number(price),
          description,

          images,

          categoryLinks: parsedCategoryLinks,
          gender: parsedGender,
          seasons: parsedSeasons,
          ageRanges: parsedAgeRanges,

          inventoryRows: parsedInventoryRows,
          standards: parsedStandards,
          careInstructions: parsedCareInstructions,
          careNote: careNote || null,
          brandFa: brandFa || null,
          brandEn: brandEn || null,
          material: material || null,
          madeInCountry: madeInCountry || null,

          weight: weight || null,
          length: length || null,
          width: width || null,
          height: height || null,
          physicalDetailsNote: physicalDetailsNote || null,

          hasWarranty: hasWarranty || null,
          warrantyPeriod: warrantyPeriod || null,
          warrantyUnit: warrantyUnit || null,
          mainImageIndex: Number(mainImageIndex || 0),

          status: "DRAFT",
        },
      });

      // 🟡 4. افزایش شمارنده
      await prisma.vendorAccount.update({
        where: { id: vendor.id },
        data: {
          usedProductCount: {
            increment: 1,
          },
        },
      });

      res.json({ ok: true, product });
    } catch (err) {
      console.error("CREATE PRODUCT ERROR:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

  router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const vendorId = Number(req.params.vendorId);

    const products = await prisma.vendorProduct.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      ok: true,
      products
    });

  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err.message
    });
  }
});

// دریافت نظرات عمومی محصول
router.get("/public/:productId/reviews", async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const reviews = await prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ok: true, reviews });
  } catch (err) {
    console.error("GET PRODUCT REVIEWS ERROR:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// دریافت محصولات منتشرشده برای صفحه فروشگاه عمومی
router.get("/public", async (req, res) => {
  try {
    const products = await prisma.vendorProduct.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    res.json({
      ok: true,
      products,
    });
  } catch (err) {
    console.error("GET PUBLIC PRODUCTS ERROR:", err);
    res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
});

// دریافت عمومی اطلاعات محصول برای صفحه ProductDetail
router.get("/public/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const product = await prisma.vendorProduct.findUnique({
  where: { id: productId },
  include: {
    vendor: {
      select: {
        id: true,
        businessName: true,
      },
    },
  },
});

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: "محصول پیدا نشد",
      });
    }

    res.json({
      ok: true,
      product,
    });
  } catch (err) {
    console.error("GET PUBLIC PRODUCT ERROR:", err);

    res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
});


// ثبت نظر کاربر برای محصول
router.post("/:productId/reviews", authMiddleware, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const userId = req.user.userId;
    const { rating, text } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "برای ثبت نظر باید وارد حساب کاربری شوید",
      });
    }

    if (!rating || !text?.trim()) {
      return res.status(400).json({
        ok: false,
        message: "امتیاز و متن نظر الزامی است",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        firstName: true,
        lastName: true,
        fullName: true,
      },
    });

    const userName =
      user?.fullName ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      "کاربر ژنینو";

    const review = await prisma.productReview.create({
      data: {
        productId,
        userId: Number(userId),
        userName,
        rating: Number(rating),
        text: text.trim(),
      },
    });

    res.json({ ok: true, review });
  } catch (err) {
    console.error("CREATE PRODUCT REVIEW ERROR:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// دریافت اطلاعات یک محصول برای ویرایش
router.get(
  "/:productId",
  authMiddleware,
  async (req, res) => {
    try {
      const vendorId = req.user.vendorId;
      const productId = Number(req.params.productId);

      const product = await prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId: vendorId,
        },
      });

      if (!product) {
        return res.status(404).json({
          ok: false,
          message: "محصول پیدا نشد",
        });
      }

      res.json({
        ok: true,
        product,
      });
    } catch (err) {
      console.error("GET PRODUCT ERROR:", err);

      res.status(500).json({
        ok: false,
        message: err.message,
      });
    }
  }
);

// ویرایش محصول فروشنده
router.put(
  "/:productId",
  authMiddleware,
  async (req, res) => {
    try {
      const vendorId = req.user.vendorId;
      const productId = Number(req.params.productId);

      const existingProduct = await prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({
          ok: false,
          message: "محصول پیدا نشد",
        });
      }

      const {
        title,
        price,
        description,
        images,
        categoryLinks,
        gender,
        seasons,
        ageRanges,
        inventoryRows,
        standards,
        careInstructions,
        careNote,
        brandFa,
        brandEn,
        material,
        madeInCountry,
        weight,
        length,
        width,
        height,
        hasWarranty,
        warrantyPeriod,
        warrantyUnit,
        mainImageIndex,
        physicalDetailsNote,
      } = req.body;

      const product = await prisma.vendorProduct.update({
        where: {
          id: productId,
        },
        data: {
          title,
          price: Number(price),
          description,

          images: Array.isArray(images) ? images : [],
          categoryLinks: Array.isArray(categoryLinks) ? categoryLinks : [],
          gender: Array.isArray(gender) ? gender : [],
          seasons: Array.isArray(seasons) ? seasons : [],
          ageRanges: Array.isArray(ageRanges) ? ageRanges : [],
          inventoryRows: Array.isArray(inventoryRows) ? inventoryRows : [],
          standards: Array.isArray(standards) ? standards : [],
          careInstructions: Array.isArray(careInstructions)
            ? careInstructions
            : [],

          careNote: careNote || null,
          brandFa: brandFa || null,
          brandEn: brandEn || null,
          material: material || null,
          madeInCountry: madeInCountry || null,

          weight: weight || null,
          length: length || null,
          width: width || null,
          height: height || null,
          physicalDetailsNote: physicalDetailsNote || null,

          hasWarranty: hasWarranty || null,
          warrantyPeriod: warrantyPeriod || null,
          warrantyUnit: warrantyUnit || null,
          mainImageIndex: Number(mainImageIndex || 0),
        },
      });

      res.json({
        ok: true,
        product,
      });
    } catch (err) {
      console.error("UPDATE PRODUCT ERROR:", err);
      res.status(500).json({
        ok: false,
        message: err.message,
      });
    }
  }
);


// انتشار محصول فروشنده
router.patch(
  "/:productId/publish",
  authMiddleware,
  async (req, res) => {
    try {
      const vendorId = req.user.vendorId;
      const productId = Number(req.params.productId);

      const product = await prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId,
        },
      });

      if (!product) {
        return res.status(404).json({
          ok: false,
          message: "محصول پیدا نشد",
        });
      }

      const updatedProduct = await prisma.vendorProduct.update({
        where: {
          id: productId,
        },
        data: {
          status: "PUBLISHED",
        },
      });

      res.json({
        ok: true,
        message: "محصول با موفقیت منتشر شد",
        product: updatedProduct,
      });
    } catch (err) {
      console.error("PUBLISH PRODUCT ERROR:", err);

      res.status(500).json({
        ok: false,
        message: err.message,
      });
    }
  }
);


// حذف محصول فروشنده
router.delete(
  "/:productId",
  authMiddleware,
  async (req, res) => {
    try {
      const vendorId = req.user.vendorId;
      const productId = Number(req.params.productId);

      const product = await prisma.vendorProduct.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return res.status(404).json({
          ok: false,
          message: "محصول پیدا نشد",
        });
      }

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          ok: false,
          message: "اجازه حذف این محصول را ندارید",
        });
      }

      await prisma.vendorProduct.delete({
        where: {
          id: productId,
        },
      });

      await prisma.vendorAccount.update({
        where: {
          id: vendorId,
        },
        data: {
          usedProductCount: {
            decrement: 1,
          },
        },
      });

      res.json({
        ok: true,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        ok: false,
        message: err.message,
      });
    }
  }
);

  return router;
};