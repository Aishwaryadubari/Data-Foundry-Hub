import { Router } from "express";
import { db, templatesTable, categoriesTable, usersTable, ratingsTable, submissionsTable, downloadsTable } from "@workspace/db";
import { eq, sql, desc, count } from "drizzle-orm";

const router = Router();

router.get("/analytics/summary", async (req, res) => {
  try {
    const [templateCount] = await db.select({ count: count() }).from(templatesTable).where(eq(templatesTable.status, "published"));
    const [downloadSum] = await db.select({ total: sql<number>`coalesce(sum(${templatesTable.downloads}), 0)::int` }).from(templatesTable);
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [categoryCount] = await db.select({ count: count() }).from(categoriesTable);
    const [pendingCount] = await db.select({ count: count() }).from(submissionsTable).where(eq(submissionsTable.status, "pending"));
    const [ratingCount] = await db.select({ count: count() }).from(ratingsTable);

    return res.json({
      totalTemplates: Number(templateCount?.count) || 0,
      totalDownloads: Number(downloadSum?.total) || 0,
      totalUsers: Number(userCount?.count) || 0,
      totalCategories: Number(categoryCount?.count) || 0,
      pendingSubmissions: Number(pendingCount?.count) || 0,
      totalRatings: Number(ratingCount?.count) || 0,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/analytics/category-breakdown", async (req, res) => {
  try {
    const rows = await db
      .select({
        categoryId: templatesTable.categoryId,
        categoryName: categoriesTable.name,
        categorySlug: categoriesTable.slug,
        templateCount: count(templatesTable.id),
        downloads: sql<number>`coalesce(sum(${templatesTable.downloads}), 0)::int`,
      })
      .from(templatesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, templatesTable.categoryId))
      .where(eq(templatesTable.status, "published"))
      .groupBy(templatesTable.categoryId, categoriesTable.name, categoriesTable.slug)
      .orderBy(desc(sql`sum(${templatesTable.downloads})`));

    return res.json(rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categorySlug: r.categorySlug,
      templateCount: Number(r.templateCount) || 0,
      downloads: Number(r.downloads) || 0,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/analytics/top-contributors", async (req, res) => {
  try {
    const rows = await db
      .select({
        userId: templatesTable.authorId,
        name: usersTable.name,
        avatarUrl: usersTable.avatarUrl,
        templateCount: count(templatesTable.id),
        totalDownloads: sql<number>`coalesce(sum(${templatesTable.downloads}), 0)::int`,
      })
      .from(templatesTable)
      .innerJoin(usersTable, eq(usersTable.id, templatesTable.authorId))
      .where(eq(templatesTable.status, "published"))
      .groupBy(templatesTable.authorId, usersTable.name, usersTable.avatarUrl)
      .orderBy(desc(sql`sum(${templatesTable.downloads})`))
      .limit(10);

    return res.json(rows.map((r) => ({
      userId: r.userId, name: r.name, avatarUrl: r.avatarUrl,
      templateCount: Number(r.templateCount) || 0,
      totalDownloads: Number(r.totalDownloads) || 0,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/analytics/download-trends", async (req, res) => {
  try {
    // Generate last 30 days with mock trend data based on total downloads
    const [totalRow] = await db.select({ total: sql<number>`coalesce(sum(${templatesTable.downloads}), 0)::int` }).from(templatesTable);
    const total = Number(totalRow?.total) || 500;

    const trends = [];
    const base = Math.max(10, Math.floor(total / 30));
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variance = Math.floor(base * (0.5 + Math.random()));
      trends.push({ date: date.toISOString().split("T")[0], downloads: variance });
    }
    return res.json(trends);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
