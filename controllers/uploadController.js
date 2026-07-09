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

function sanitizeAlbumPhotoExt(ext) {
  const cleaned = String(ext || "")
    .toLowerCase()
    .replace(".", "")
    .trim();

  const allowed = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
    "heif",
    "gif",
  ];

  return allowed.includes(cleaned) ? cleaned : null;
}

function sanitizeAlbumPhotoContentType(ct, ext) {
  const v = String(ct || "").toLowerCase().trim();
  const safeExt = String(ext || "").toLowerCase().replace(".", "").trim();

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/gif",
  ];

  if (allowed.includes(v)) return v;

  // اگر گوشی contentType نفرستاد، از روی پسوند حدس می‌زنیم
  if (safeExt === "jpg" || safeExt === "jpeg") return "image/jpeg";
  if (safeExt === "png") return "image/png";
  if (safeExt === "webp") return "image/webp";
  if (safeExt === "heic") return "image/heic";
  if (safeExt === "heif") return "image/heif";
  if (safeExt === "gif") return "image/gif";

  return null;
}

function sanitizeVoiceExt(ext) {
  const cleaned = String(ext || "").toLowerCase().replace(".", "").trim();
  const allowed = ["webm"];
  return allowed.includes(cleaned) ? cleaned : null;
}

function sanitizeVoiceContentType(ct) {
  const v = String(ct || "").toLowerCase().trim();
  const allowed = ["audio/webm"];
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

function sanitizeAmbassadorDocumentExt(ext) {
  const cleaned = String(ext || "").toLowerCase().replace(".", "").trim();
  const allowed = ["jpg", "jpeg", "png", "webp"];
  return allowed.includes(cleaned) ? cleaned : null;
}

function sanitizeAmbassadorDocumentContentType(ct) {
  const v = String(ct || "").toLowerCase().trim();
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  return allowed.includes(v) ? v : null;
}

function sanitizeVendorDocumentExt(ext) {
  const cleaned = String(ext || "").toLowerCase().replace(".", "").trim();

  const allowed = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "pdf",
    "doc",
    "docx",
  ];

  return allowed.includes(cleaned) ? cleaned : null;
}

function sanitizeVendorDocumentContentType(ct) {
  const v = String(ct || "").toLowerCase().trim();

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  return allowed.includes(v) ? v : null;
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

exports.createPresignedChatImageUpload = async (req, res) => {
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

    const { ext, contentType, fileSize } = req.body || {};

    const safeExt = sanitizeExt(ext);
    const safeCT = sanitizeContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل مجاز نیست. فقط jpg / png / webp",
      });
    }

    // محدودیت حجم (مثلاً 8MB بعد از فشرده‌سازی)
    if (fileSize && fileSize > 8 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        message: "حجم تصویر بیش از حد مجاز است.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `chat-images/${userId}/${yyyy}/${mm}/${randomId(12)}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
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
    console.error("PRESIGN CHAT IMAGE ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, message: "خطای سرور در presign چت." });
  }
};

exports.createPresignedChatVoiceUpload = async (req, res) => {
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

    const { ext, contentType, fileSize } = req.body || {};

    const safeExt = sanitizeVoiceExt(ext);
    const safeCT = sanitizeVoiceContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل صوتی مجاز نیست. فقط webm",
      });
    }

    // برای ویس ۳۰ ثانیه‌ای معمولاً حجم خیلی بالا نمی‌رود
    // فعلاً سقف را 2MB می‌گذاریم
    if (fileSize && fileSize > 2 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        message: "حجم پیام صوتی بیش از حد مجاز است.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `chat-voices/${userId}/${yyyy}/${mm}/${randomId(12)}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
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
    console.error("PRESIGN CHAT VOICE ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطای سرور در presign پیام صوتی.",
    });
  }
};

exports.createPresignedChatRoomImageUpload = async (req, res) => {
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

    const { ext, contentType, fileSize } = req.body || {};

    const safeExt = sanitizeExt(ext);
    const safeCT = sanitizeContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل مجاز نیست. فقط jpg / png / webp",
      });
    }

    if (fileSize && fileSize > 8 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        message: "حجم تصویر بیش از حد مجاز است.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `chat-room-images/${userId}/${yyyy}/${mm}/${randomId(12)}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
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
    console.error("PRESIGN CHAT ROOM IMAGE ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "خطای سرور در presign عکس اتاق.",
    });
  }
};

exports.createPresignedMemoryAlbumPhotoUpload = async (req, res) => {
  try {
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        ok: false,
        message: "S3_BUCKET تنظیم نشده است.",
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "دسترسی غیرمجاز.",
      });
    }

    const { albumId, ext, contentType, fileName, fileSize } = req.body || {};
    const aid = Number(albumId);

    if (!aid || Number.isNaN(aid)) {
      return res.status(400).json({
        ok: false,
        message: "albumId نامعتبر است.",
      });
    }

    const album = await req.prisma.memoryAlbum.findFirst({
  where: {
    id: aid,
  },
  select: {
    id: true,
    childId: true,
  },
});

if (!album) {
  return res.status(404).json({
    ok: false,
    message: "آلبوم یافت نشد.",
  });
}

const isParent = await req.prisma.childAdmin.findFirst({
  where: {
    childId: album.childId,
    userId,
    status: "CONNECTED",
    role: {
      in: ["father", "mother"],
    },
  },
  select: { id: true },
});

if (!isParent) {
  return res.status(403).json({
    ok: false,
    message: "فقط پدر یا مادر کودک می‌توانند عکس اضافه کنند.",
  });
}
      

    const safeExt = sanitizeAlbumPhotoExt(ext);
    const safeCT = sanitizeAlbumPhotoContentType(contentType, ext);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message:
  "فرمت تصویر مجاز نیست. فرمت‌های رایج موبایل مثل jpg / png / webp / heic / heif / gif پشتیبانی می‌شوند.",
      });
    }

    if (fileSize && fileSize > 8 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        message: "حجم تصویر بیش از حد مجاز است.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `memory-albums/${album.childId}/${aid}/${yyyy}/${mm}/${randomId(
  12
)}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
      Metadata: {
        userId: String(userId),
        childId: String(album.childId),
        albumId: String(aid),
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
    console.error("PRESIGN MEMORY ALBUM PHOTO ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در presign عکس آلبوم خاطرات.",
    });
  }
};

exports.createPresignedAmbassadorDocumentUpload = async (req, res) => {
  try {
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        ok: false,
        message: "S3_BUCKET تنظیم نشده است.",
      });
    }

    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "دسترسی غیرمجاز.",
      });
    }

    const { documentType, ext, contentType, fileName, fileSize } = req.body || {};

    const allowedDocumentTypes = [
      "personalPhoto",
      "nationalCardImage",
      "birthCertificateImage",
    ];

    if (!allowedDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        ok: false,
        message: "نوع مدرک سفیر نامعتبر است.",
      });
    }

    const safeExt = sanitizeAmbassadorDocumentExt(ext);
    const safeCT = sanitizeAmbassadorDocumentContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت تصویر مجاز نیست. فقط jpg / png / webp",
      });
    }

    if (fileSize !== undefined && !validateFileSize(fileSize, 8 * 1024 * 1024)) {
      return res.status(400).json({
        ok: false,
        message: "حجم تصویر بیش از حد مجاز است. حداکثر ۸ مگابایت.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `ambassadors/${userId}/documents/${documentType}/${yyyy}/${mm}/${randomId(
      12
    )}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
      Metadata: {
        userId: String(userId),
        documentType: String(documentType),
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
    console.error("PRESIGN AMBASSADOR DOCUMENT ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در presign مدارک سفیر.",
    });
  }
};

exports.createPresignedVendorDocumentUpload = async (req, res) => {
  try {
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        ok: false,
        message: "S3_BUCKET تنظیم نشده است.",
      });
    }

    const vendorId = Number(req.body?.vendorId);

    if (!vendorId || Number.isNaN(vendorId)) {
      return res.status(400).json({
        ok: false,
        message: "شناسه فروشنده نامعتبر است.",
      });
    }

    const vendor = await req.prisma.vendorAccount.findUnique({
  where: { id: vendorId },
  select: { id: true },
});

if (!vendor) {
  return res.status(404).json({
    ok: false,
    message: "فروشنده پیدا نشد.",
  });
}

    const {
      documentType,
      ext,
      contentType,
      fileName,
      fileSize,
    } = req.body || {};

    const allowedDocumentTypes = [
      "NATIONAL_CARD",
      "SELFIE_WITH_NATIONAL_CARD",
      "BUSINESS_LICENSE",
      "COMPANY_OFFICIAL_NEWSPAPER",
      "COMPANY_REGISTRATION",
      "REPRESENTATIVE_LETTER",
      "OTHER",
    ];

    if (!allowedDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        ok: false,
        message: "نوع مدرک فروشنده نامعتبر است.",
      });
    }

    const safeExt = sanitizeVendorDocumentExt(ext);
    const safeCT = sanitizeVendorDocumentContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت فایل مجاز نیست.",
      });
    }

    if (
      fileSize !== undefined &&
      !validateFileSize(fileSize, 10 * 1024 * 1024)
    ) {
      return res.status(400).json({
        ok: false,
        message: "حجم فایل بیش از حد مجاز است.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `vendors/${vendorId}/documents/${documentType}/${yyyy}/${mm}/${randomId(
      12
    )}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
      Metadata: {
        vendorId: String(vendorId),
        documentType: String(documentType),
        originalName: fileName
          ? String(fileName).slice(0, 200)
          : "",
      },
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 600,
    });

    const publicUrl =
      `${process.env.S3_ENDPOINT}/${bucket}/${key}`;

    return res.json({
      ok: true,
      uploadUrl,
      key,
      publicUrl,
      expiresIn: 120,
    });
  } catch (err) {
    console.error(
      "PRESIGN VENDOR DOCUMENT ERROR:",
      err
    );

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در presign مدارک فروشنده.",
    });
  }
};


exports.createPresignedVendorProductImageUpload = async (req, res) => {
  try {
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        ok: false,
        message: "S3_BUCKET تنظیم نشده است.",
      });
    }

    const vendorId = req.user?.vendorId || Number(req.body?.vendorId);

    if (!vendorId || Number.isNaN(Number(vendorId))) {
      return res.status(401).json({
        ok: false,
        message: "فروشنده معتبر نیست. لطفاً دوباره وارد شوید.",
      });
    }

    const { ext, contentType, fileName, fileSize } = req.body || {};

    const safeExt = sanitizeExt(ext);
    const safeCT = sanitizeContentType(contentType);

    if (!safeExt || !safeCT) {
      return res.status(400).json({
        ok: false,
        message: "فرمت تصویر مجاز نیست. فقط jpg / png / webp",
      });
    }

    if (fileSize && fileSize > 8 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        message: "حجم تصویر بیش از حد مجاز است.",
      });
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const key = `vendors/${vendorId}/products/${yyyy}/${mm}/${randomId(12)}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeCT,
      Metadata: {
        vendorId: String(vendorId),
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
    console.error("PRESIGN VENDOR PRODUCT IMAGE ERROR:", err);

    return res.status(500).json({
      ok: false,
      message: "خطای سرور در آماده‌سازی آپلود تصویر محصول.",
    });
  }
};