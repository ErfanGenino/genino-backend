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
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 120 });

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
