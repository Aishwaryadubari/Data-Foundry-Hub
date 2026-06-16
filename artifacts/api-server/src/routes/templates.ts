import { Router } from "express";
import {
  db, templatesTable, categoriesTable, usersTable,
  tagsTable, templateTagsTable, favoritesTable,
  templateVersionsTable, downloadsTable,
} from "@workspace/db";
import { eq, sql, ilike, and, inArray, desc, asc } from "drizzle-orm";
import { authMiddleware, optionalAuth, getUserIdFromToken } from "../lib/auth";

const router = Router();

async function getTemplateTags(templateId: number): Promise<string[]> {
  const rows = await db
    .select({ name: tagsTable.name })
    .from(templateTagsTable)
    .innerJoin(tagsTable, eq(tagsTable.id, templateTagsTable.tagId))
    .where(eq(templateTagsTable.templateId, templateId));
  return rows.map((r) => r.name);
}

async function isFavorited(userId: number | null, templateId: number): Promise<boolean> {
  if (!userId) return false;
  const [f] = await db.select().from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.templateId, templateId)));
  return !!f;
}

async function formatTemplate(t: any, userId: number | null, includeTags = true) {
  const tags = includeTags ? await getTemplateTags(t.id) : [];
  const fav = await isFavorited(userId, t.id);
  return {
    id: t.id, title: t.title, description: t.description,
    categoryId: t.categoryId, categoryName: t.categoryName, categorySlug: t.categorySlug,
    authorId: t.authorId, authorName: t.authorName, authorAvatarUrl: t.authorAvatarUrl,
    version: t.version, status: t.status, downloads: t.downloads,
    averageRating: Number(t.averageRating) || 0, ratingCount: t.ratingCount,
    isFavorited: fav, tags, language: t.language, complexity: t.complexity,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
  };
}

router.get("/templates", optionalAuth, async (req, res) => {
  try {
    const userId = (req as any).userId ?? null;
    const { categoryId, search, tags, sortBy, page = "1", limit = "20" } = req.query as any;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = db
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
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .$dynamic();

    const conditions: any[] = [eq(templatesTable.status, "published")];
    if (categoryId) conditions.push(eq(templatesTable.categoryId, parseInt(categoryId)));
    if (search) conditions.push(ilike(templatesTable.title, `%${search}%`));

    baseQuery = baseQuery.where(and(...conditions));

    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .where(and(...conditions));
    const total = totalRows[0]?.count ?? 0;

    if (sortBy === "downloads") baseQuery = baseQuery.orderBy(desc(templatesTable.downloads));
    else if (sortBy === "rating") baseQuery = baseQuery.orderBy(desc(templatesTable.averageRating));
    else if (sortBy === "oldest") baseQuery = baseQuery.orderBy(asc(templatesTable.createdAt));
    else baseQuery = baseQuery.orderBy(desc(templatesTable.createdAt));

    const rows = await baseQuery.limit(limitNum).offset(offset);

    const templates = await Promise.all(rows.map((t) => formatTemplate(t, userId)));

    // Filter by tags if specified
    let filtered = templates;
    if (tags) {
      const tagList = (tags as string).split(",").map((t: string) => t.trim().toLowerCase());
      filtered = templates.filter((t) =>
        tagList.some((tag) => t.tags.map((tg: string) => tg.toLowerCase()).includes(tag))
      );
    }

    return res.json({ templates: filtered, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/templates/featured", optionalAuth, async (req, res) => {
  try {
    const userId = (req as any).userId ?? null;
    const rows = await db
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
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .where(and(eq(templatesTable.status, "published"), eq(templatesTable.isFeatured, 1)))
      .orderBy(desc(templatesTable.downloads))
      .limit(6);
    const templates = await Promise.all(rows.map((t) => formatTemplate(t, userId)));
    return res.json(templates);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/templates/popular", optionalAuth, async (req, res) => {
  try {
    const userId = (req as any).userId ?? null;
    const rows = await db
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
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .where(eq(templatesTable.status, "published"))
      .orderBy(desc(templatesTable.downloads))
      .limit(8);
    const templates = await Promise.all(rows.map((t) => formatTemplate(t, userId)));
    return res.json(templates);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/templates/recent", optionalAuth, async (req, res) => {
  try {
    const userId = (req as any).userId ?? null;
    const rows = await db
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
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .where(eq(templatesTable.status, "published"))
      .orderBy(desc(templatesTable.createdAt))
      .limit(8);
    const templates = await Promise.all(rows.map((t) => formatTemplate(t, userId)));
    return res.json(templates);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/templates/:id", optionalAuth, async (req, res) => {
  try {
    const userId = (req as any).userId ?? null;
    const id = parseInt(req.params.id);
    const [row] = await db
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
        code: templatesTable.code, documentation: templatesTable.documentation,
        usageExample: templatesTable.usageExample, prerequisites: templatesTable.prerequisites,
        changelog: templatesTable.changelog,
        createdAt: templatesTable.createdAt, updatedAt: templatesTable.updatedAt,
      })
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .where(eq(templatesTable.id, id));

    if (!row) return res.status(404).json({ error: "Not found" });

    const tags = await getTemplateTags(id);
    const fav = await isFavorited(userId, id);
    return res.json({
      ...row,
      averageRating: Number(row.averageRating) || 0,
      isFavorited: fav, tags,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/templates", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { title, description, categoryId, code, documentation, usageExample, prerequisites, tags, version, language, complexity } = req.body;
    const [t] = await db.insert(templatesTable).values({
      title, description, categoryId: parseInt(categoryId), authorId: userId,
      code, documentation: documentation ?? "", usageExample, prerequisites,
      version: version ?? "1.0.0", language, complexity, status: "published",
    }).returning();

    // Insert tags
    if (tags?.length) {
      for (const tagName of tags) {
        let [tag] = await db.select().from(tagsTable).where(eq(tagsTable.name, tagName));
        if (!tag) {
          [tag] = await db.insert(tagsTable).values({ name: tagName }).returning();
        }
        await db.insert(templateTagsTable).values({ templateId: t.id, tagId: tag.id }).onConflictDoNothing();
      }
    }

    return res.status(201).json({ ...t, tags: tags ?? [] });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/templates/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: any = {};
    const allowed = ["title", "description", "categoryId", "code", "documentation", "version", "status", "language", "complexity"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();
    const [t] = await db.update(templatesTable).set(updates).where(eq(templatesTable.id, id)).returning();
    return res.json(t);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/templates/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(templatesTable).where(eq(templatesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/templates/:id/versions", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const versions = await db
      .select({
        id: templateVersionsTable.id,
        templateId: templateVersionsTable.templateId,
        version: templateVersionsTable.version,
        changelog: templateVersionsTable.changelog,
        code: templateVersionsTable.code,
        createdAt: templateVersionsTable.createdAt,
        authorName: usersTable.name,
      })
      .from(templateVersionsTable)
      .innerJoin(usersTable, eq(usersTable.id, templateVersionsTable.authorId))
      .where(eq(templateVersionsTable.templateId, id))
      .orderBy(desc(templateVersionsTable.createdAt));

    return res.json(versions.map((v) => ({
      ...v,
      createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/templates/:id/download", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = (req as any).userId ?? null;

    const [t] = await db.select().from(templatesTable).where(eq(templatesTable.id, id));
    if (!t) return res.status(404).json({ error: "Not found" });

    await db.update(templatesTable).set({ downloads: t.downloads + 1 }).where(eq(templatesTable.id, id));
    if (userId) {
      await db.insert(downloadsTable).values({ templateId: id, userId });
    }

    const ext = t.language === "sql" ? "sql" : t.language === "yaml" ? "yaml" : t.language === "json" ? "json" : "txt";
    return res.json({ code: t.code, filename: `${t.title.toLowerCase().replace(/\s+/g, "-")}.${ext}` });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
