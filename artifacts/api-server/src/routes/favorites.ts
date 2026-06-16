import { Router } from "express";
import { db, favoritesTable, templatesTable, categoriesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const favs = await db
      .select({
        id: templatesTable.id, title: templatesTable.title, description: templatesTable.description,
        categoryId: templatesTable.categoryId, categoryName: categoriesTable.name,
        categorySlug: categoriesTable.slug,
        authorId: templatesTable.authorId, authorName: usersTable.name,
        authorAvatarUrl: usersTable.avatarUrl,
        version: templatesTable.version, status: templatesTable.status,
        downloads: templatesTable.downloads, averageRating: templatesTable.averageRating,
        ratingCount: templatesTable.ratingCount, language: templatesTable.language,
        complexity: templatesTable.complexity,
        createdAt: templatesTable.createdAt, updatedAt: templatesTable.updatedAt,
      })
      .from(favoritesTable)
      .innerJoin(templatesTable, eq(templatesTable.id, favoritesTable.templateId))
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .where(eq(favoritesTable.userId, userId))
      .orderBy(desc(favoritesTable.createdAt));

    return res.json(favs.map((t) => ({
      ...t,
      averageRating: Number(t.averageRating) || 0,
      isFavorited: true,
      tags: [],
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/favorites/:templateId", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const templateId = parseInt(req.params.templateId);
    await db.insert(favoritesTable).values({ userId, templateId }).onConflictDoNothing();
    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/favorites/:templateId", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const templateId = parseInt(req.params.templateId);
    await db.delete(favoritesTable).where(
      and(eq(favoritesTable.userId, userId), eq(favoritesTable.templateId, templateId))
    );
    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
