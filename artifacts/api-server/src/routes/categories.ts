import { Router } from "express";
import { db, categoriesTable, templatesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
    const counts = await db
      .select({ categoryId: templatesTable.categoryId, count: sql<number>`count(*)::int` })
      .from(templatesTable)
      .where(eq(templatesTable.status, "published"))
      .groupBy(templatesTable.categoryId);

    const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c.count]));

    return res.json(
      cats.map((c) => ({
        id: c.id, name: c.name, slug: c.slug, icon: c.icon,
        description: c.description, color: c.color,
        templateCount: countMap[c.id] ?? 0,
      }))
    );
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
