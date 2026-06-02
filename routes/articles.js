const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = function (prisma) {
  const router = express.Router();

  // ✅ GET /api/articles/favorites
  // لیست مقالات ذخیره‌شده کاربر
  router.get("/favorites", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const savedArticles = await prisma.savedArticle.findMany({
        where: { userId },
        include: {
          article: true,
        },
        orderBy: {
          savedAt: "desc",
        },
      });

      return res.json({
        ok: true,
        articles: savedArticles.map((item) => ({
          id: item.article.id,
          title: item.article.title,
          slug: item.article.slug,
          category: item.article.category,
          image: item.article.image,
          link: item.article.link || `/articles/${item.article.slug}`,
          savedAt: item.savedAt,
        })),
      });
    } catch (error) {
      console.error("❌ Error fetching favorite articles:", error);
      return res.status(500).json({
        ok: false,
        message: "خطا در دریافت مقالات مورد علاقه",
      });
    }
  });

  // ✅ POST /api/articles/favorites
  // ذخیره مقاله در علاقه‌مندی‌ها
  router.post("/favorites", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { title, slug, image, category, link } = req.body;

      if (!title || !slug) {
        return res.status(400).json({
          ok: false,
          message: "عنوان و شناسه مقاله الزامی است.",
        });
      }

      const cleanSlug = String(slug).trim();

      const article = await prisma.article.upsert({
        where: { slug: cleanSlug },
        update: {
          title: String(title).trim(),
          image: image || null,
          category: category || null,
          link: link || null,
        },
        create: {
          title: String(title).trim(),
          slug: cleanSlug,
          image: image || null,
          category: category || null,
          link: link || null,
        },
      });

      const saved = await prisma.savedArticle.upsert({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id,
          },
        },
        update: {},
        create: {
          userId,
          articleId: article.id,
        },
      });

      return res.status(201).json({
        ok: true,
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          category: article.category,
          image: article.image,
          link: article.link || `/articles/${article.slug}`,
          savedAt: saved.savedAt,
        },
      });
    } catch (error) {
      console.error("❌ Error saving favorite article:", error);
      return res.status(500).json({
        ok: false,
        message: "خطا در ذخیره مقاله مورد علاقه",
      });
    }
  });

  // ✅ DELETE /api/articles/favorites/:slug
  // حذف مقاله از علاقه‌مندی‌ها
  router.delete("/favorites/:slug", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const slug = String(req.params.slug || "").trim();

      const article = await prisma.article.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!article) {
        return res.status(404).json({
          ok: false,
          message: "مقاله پیدا نشد.",
        });
      }

      await prisma.savedArticle.deleteMany({
        where: {
          userId,
          articleId: article.id,
        },
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("❌ Error removing favorite article:", error);
      return res.status(500).json({
        ok: false,
        message: "خطا در حذف مقاله از علاقه‌مندی‌ها",
      });
    }
  });

  return router;
};