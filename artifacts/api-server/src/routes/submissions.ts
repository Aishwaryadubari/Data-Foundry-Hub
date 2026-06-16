import { Router } from "express";
import {
  db, submissionsTable, submissionTagsTable, categoriesTable, usersTable,
  templatesTable, tagsTable, templateTagsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

async function formatSubmission(s: any, catMap: Record<number, string>, userMap: Record<number, string>) {
  const tags = await db.select().from(submissionTagsTable).where(eq(submissionTagsTable.submissionId, s.id));
  return {
    id: s.id, title: s.title, description: s.description, categoryId: s.categoryId,
    categoryName: catMap[s.categoryId] ?? "",
    code: s.code, documentation: s.documentation,
    tags: tags.map((t) => t.tagName),
    status: s.status,
    submittedById: s.submittedById, submittedByName: userMap[s.submittedById] ?? "",
    reviewedById: s.reviewedById, reviewedByName: s.reviewedById ? userMap[s.reviewedById] : null,
    reviewNotes: s.reviewNotes, language: s.language, complexity: s.complexity,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

router.get("/submissions", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query as any;
    let query = db.select().from(submissionsTable).$dynamic();
    if (status) query = query.where(eq(submissionsTable.status, status));
    const subs = await query.orderBy(desc(submissionsTable.createdAt));

    const cats = await db.select().from(categoriesTable);
    const users = await db.select().from(usersTable);
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    const formatted = await Promise.all(subs.map((s) => formatSubmission(s, catMap, userMap)));
    return res.json(formatted);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/submissions", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { title, description, categoryId, code, documentation, tags, language, complexity } = req.body;

    const [sub] = await db.insert(submissionsTable).values({
      title, description, categoryId: parseInt(categoryId),
      code, documentation: documentation ?? "",
      language, complexity, status: "pending", submittedById: userId,
    }).returning();

    if (tags?.length) {
      for (const tagName of tags) {
        await db.insert(submissionTagsTable).values({ submissionId: sub.id, tagName });
      }
    }

    const cats = await db.select().from(categoriesTable);
    const users = await db.select().from(usersTable);
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    return res.status(201).json(await formatSubmission(sub, catMap, userMap));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/submissions/:id/approve", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = parseInt(req.params.id);

    const [sub] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, id));
    if (!sub) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(submissionsTable)
      .set({ status: "approved", reviewedById: userId, updatedAt: new Date() })
      .where(eq(submissionsTable.id, id))
      .returning();

    // Create actual template from submission
    const subTags = await db.select().from(submissionTagsTable).where(eq(submissionTagsTable.submissionId, id));
    const [newTemplate] = await db.insert(templatesTable).values({
      title: sub.title, description: sub.description, categoryId: sub.categoryId,
      authorId: sub.submittedById, code: sub.code, documentation: sub.documentation ?? "",
      version: "1.0.0", language: sub.language, complexity: sub.complexity, status: "published",
    }).returning();

    for (const st of subTags) {
      let [tag] = await db.select().from(tagsTable).where(eq(tagsTable.name, st.tagName));
      if (!tag) [tag] = await db.insert(tagsTable).values({ name: st.tagName }).returning();
      await db.insert(templateTagsTable).values({ templateId: newTemplate.id, tagId: tag.id }).onConflictDoNothing();
    }

    const cats = await db.select().from(categoriesTable);
    const users = await db.select().from(usersTable);
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    return res.json(await formatSubmission(updated, catMap, userMap));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/submissions/:id/reject", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = parseInt(req.params.id);
    const { reason } = req.body;

    const [updated] = await db.update(submissionsTable)
      .set({ status: "rejected", reviewedById: userId, reviewNotes: reason, updatedAt: new Date() })
      .where(eq(submissionsTable.id, id))
      .returning();

    const cats = await db.select().from(categoriesTable);
    const users = await db.select().from(usersTable);
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    return res.json(await formatSubmission(updated, catMap, userMap));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
