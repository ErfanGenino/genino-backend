// controllers/uploadController.js
const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// ✅ S3 Client (Arvan S3 compatible)
const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT, // e.g. https://s3.ir-thr-at1.arvanstorage.ir
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // ✅ مهم برای اکثر S3-compatible ها
});

function randomId(len = 16) {
  return crypto.randomBytes(len).toString("hex");
}

function sanitizeExt(ext) {
  const cleaned = String(ext || "").toLowerCase().replace(".", "").trim();
  // فقط پسوندهای مجاز برای آواتار
  const allowed = ["jpg", "jpeg", "png", "webp"];
  return allowed.includes(cleaned) ? cleaned : null;
}

function sanitizeContentType(ct) {
  const v = String(ct || "").toLowerCase().trim();
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  return allowed.includes(v) ? v : null;
}

/**
 * POST /api/uploads/presign
 * body: { ext: "jpg"|"png"|"webp", contentType: "image/jpeg"|... }
 * auth: JWT required
 */
exports.createPresignedAvatarUpload = async (req, res) => {
  try {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return res
        .status(500)
        .json({ ok: false, message: "S3_BUCKET تنظیم نشده است." });
    }

    const userId = req.user?.userId; // از authMiddleware
    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const { ext, contentType } = req.body || {};

    const safeExt = sanitizeExt(ext);
    const safeCT = sanitizeContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل مجاز نیست. فقط jpg / png / webp",
      });
    }

    // مسیر ذخیره سازی: avatars/{userId}/{YYYY}/{MM}/{random}.{ext}
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const key = `avatars/${userId}/${yyyy}/${mm}/${randomId(12)}.${safeExt}`;

    // لینک آپلود با PUT
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
      // ACL: "public-read", // ❌ بهتره با Bucket Policy عمومی‌سازی کنیم (مرحله بعد)
    });

    // لینک موقت (مثلا 2 دقیقه)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });

    // URL نهایی فایل (برای ذخیره در DB) — فعلاً مستقیم endpoint
    // بعداً می‌تونیم CDN/دامنه اختصاصی بذاریم
    const publicUrl = `${process.env.S3_ENDPOINT}/${bucket}/${key}`;

    return res.json({
      ok: true,
      uploadUrl,
      key,
      publicUrl,
      expiresIn: 120,
    });
  } catch (err) {
    console.error("PRESIGN ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور در presign." });
  }
};

// ✅ medical attachments (image + pdf)
function sanitizeMedicalExt(ext) {
  const cleaned = String(ext || "").toLowerCase().replace(".", "").trim();
  const allowed = ["jpg", "jpeg", "png", "webp", "pdf"];
  return allowed.includes(cleaned) ? cleaned : null;
}

function sanitizeMedicalContentType(ct) {
  const v = String(ct || "").toLowerCase().trim();
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  return allowed.includes(v) ? v : null;
}

// محدودیت حجم (مثلا 10MB) — قابل تغییر
function validateFileSize(fileSize, maxBytes = 10 * 1024 * 1024) {
  const n = Number(fileSize);
  if (!n || Number.isNaN(n)) return false;
  return n > 0 && n <= maxBytes;
}

/**
 * POST /api/uploads/presign/medical-attachment
 * body: { recordId, ext, contentType, fileName?, fileSize? }
 * auth: JWT required
 */
exports.createPresignedMedicalAttachmentUpload = async (req, res) => {
  try {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return res
        .status(500)
        .json({ ok: false, message: "S3_BUCKET تنظیم نشده است." });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "دسترسی غیرمجاز." });
    }

    const { recordId, ext, contentType, fileName, fileSize } = req.body || {};

    const rid = Number(recordId);
    if (!rid || Number.isNaN(rid)) {
      return res.status(400).json({ ok: false, message: "recordId نامعتبر است." });
    }

    // ✅ چک مالکیت رکورد پزشکی
    const rec = await req.prisma.medicalRecord.findFirst({
      where: { id: rid, userId },
      select: { id: true },
    });

    if (!rec) {
      return res.status(404).json({
        ok: false,
        message: "رکورد پزشکی یافت نشد یا متعلق به شما نیست.",
      });
    }

    const safeExt = sanitizeMedicalExt(ext);
    const safeCT = sanitizeMedicalContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل مجاز نیست. فقط jpg / png / webp / pdf",
      });
    }

    if (fileSize !== undefined && !validateFileSize(fileSize)) {
      return res.status(400).json({
        ok: false,
        message: "حجم فایل نامعتبر است (حداکثر 10MB).",
      });
    }

    // مسیر: medical-records/{userId}/{recordId}/{YYYY}/{MM}/{random}.{ext}
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const key = `medical-records/${userId}/${rid}/${yyyy}/${mm}/${randomId(12)}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
      // Metadata اختیاری (برای ردیابی)
      Metadata: {
        userId: String(userId),
        recordId: String(rid),
        originalName: fileName ? String(fileName).slice(0, 200) : "",
      },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
    const publicUrl = `${process.env.S3_ENDPOINT}/${bucket}/${key}`;

    return res.json({
      ok: true,
      uploadUrl,
      key,
      publicUrl,
      expiresIn: 120,
    });
  } catch (err) {
    console.error("PRESIGN MEDICAL ATTACHMENT ERROR:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور در presign." });
  }
};