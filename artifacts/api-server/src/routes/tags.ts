import { Router } from "express";
import { db, tagsTable, templateTagsTable, templatesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/tags", async (req, res) => {
  try {
    const tags = await db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        count: sql<number>`count(${templateTagsTable.id})::int`,
      })
      .from(tagsTable)
      .leftJoin(templateTagsTable, eq(tagsTable.id, templateTagsTable.tagId))
      .groupBy(tagsTable.id, tagsTable.name)
      .orderBy(sql`count(${templateTagsTable.id}) desc`);

    return res.json(tags);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
