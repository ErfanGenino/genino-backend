// D:\projects\Genino\genino-backend\routes\vendorShopHeaderRoutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

module.exports = (prisma) => {
  const router = express.Router();

  const uploadDir = path.join(process.cwd(), "uploads", "vendor-shop-headers");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `vendor-${req.params.vendorId}-${Date.now()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];

      if (!allowed.includes(file.mimetype)) {
        return cb(new Error("فرمت تصویر معتبر نیست."));
      }

      cb(null, true);
    },
  });

  // دریافت عکس‌های هدر فروشگاه
  router.get("/:vendorId/header-images", async (req, res) => {
    try {
      const vendorId = Number(req.params.vendorId);

      const vendor = await prisma.vendorAccount.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          shopHeaderImages: true,
        },
      });

      if (!vendor) {
        return res.status(404).json({
          ok: false,
          message: "فروشنده پیدا نشد.",
        });
      }

      return res.json({
        ok: true,
        images: vendor.shopHeaderImages || [],
      });
    } catch (err) {
      console.error("GET SHOP HEADER IMAGES ERROR:", err);
      return res.status(500).json({
        ok: false,
        message: "خطا در دریافت تصاویر هدر فروشگاه.",
      });
    }
  });

  // آپلود عکس جدید
  router.post(
    "/:vendorId/header-images",
    upload.single("image"),
    async (req, res) => {
      try {
        const vendorId = Number(req.params.vendorId);

        if (!req.file) {
          return res.status(400).json({
            ok: false,
            message: "تصویری برای آپلود انتخاب نشده است.",
          });
        }

        const vendor = await prisma.vendorAccount.findUnique({
          where: { id: vendorId },
          select: {
            id: true,
            shopHeaderImages: true,
          },
        });

        if (!vendor) {
          return res.status(404).json({
            ok: false,
            message: "فروشنده پیدا نشد.",
          });
        }

        const currentImages = Array.isArray(vendor.shopHeaderImages)
          ? vendor.shopHeaderImages
          : [];

        if (currentImages.length >= 3) {
          fs.unlinkSync(req.file.path);

          return res.status(400).json({
            ok: false,
            message: "حداکثر ۳ تصویر برای هدر فروشگاه مجاز است.",
          });
        }

        const imageUrl = `/uploads/vendor-shop-headers/${req.file.filename}`;

        const nextImages = [
          ...currentImages,
          {
            url: imageUrl,
            fileName: req.file.filename,
            uploadedAt: new Date().toISOString(),
          },
        ];

        const updatedVendor = await prisma.vendorAccount.update({
          where: { id: vendorId },
          data: {
            shopHeaderImages: nextImages,
          },
          select: {
            id: true,
            shopHeaderImages: true,
          },
        });

        return res.json({
          ok: true,
          message: "تصویر هدر فروشگاه با موفقیت آپلود شد.",
          images: updatedVendor.shopHeaderImages || [],
        });
      } catch (err) {
        console.error("UPLOAD SHOP HEADER IMAGE ERROR:", err);
        return res.status(500).json({
          ok: false,
          message: "خطا در آپلود تصویر هدر فروشگاه.",
        });
      }
    }
  );

  // حذف عکس
  router.delete("/:vendorId/header-images/:index", async (req, res) => {
    try {
      const vendorId = Number(req.params.vendorId);
      const index = Number(req.params.index);

      const vendor = await prisma.vendorAccount.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          shopHeaderImages: true,
        },
      });

      if (!vendor) {
        return res.status(404).json({
          ok: false,
          message: "فروشنده پیدا نشد.",
        });
      }

      const currentImages = Array.isArray(vendor.shopHeaderImages)
        ? vendor.shopHeaderImages
        : [];

      if (index < 0 || index >= currentImages.length) {
        return res.status(400).json({
          ok: false,
          message: "تصویر انتخاب‌شده معتبر نیست.",
        });
      }

      const removedImage = currentImages[index];

      const nextImages = currentImages.filter((_, i) => i !== index);

      if (removedImage?.fileName) {
        const filePath = path.join(uploadDir, removedImage.fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const updatedVendor = await prisma.vendorAccount.update({
        where: { id: vendorId },
        data: {
          shopHeaderImages: nextImages,
        },
        select: {
          id: true,
          shopHeaderImages: true,
        },
      });

      return res.json({
        ok: true,
        message: "تصویر هدر فروشگاه حذف شد.",
        images: updatedVendor.shopHeaderImages || [],
      });
    } catch (err) {
      console.error("DELETE SHOP HEADER IMAGE ERROR:", err);
      return res.status(500).json({
        ok: false,
        message: "خطا در حذف تصویر هدر فروشگاه.",
      });
    }
  });

  return router;
};