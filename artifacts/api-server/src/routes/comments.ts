import { Router } from "express";
import { db, commentsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/templates/:id/comments", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const comments = await db
      .select({
        id: commentsTable.id,
        templateId: commentsTable.templateId,
        authorId: commentsTable.authorId,
        authorName: usersTable.name,
        authorAvatarUrl: usersTable.avatarUrl,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(usersTable.id, commentsTable.authorId))
      .where(eq(commentsTable.templateId, templateId))
      .orderBy(desc(commentsTable.createdAt));

    return res.json(comments.map((c) => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/templates/:id/comments", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const templateId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content required" });

    const [comment] = await db.insert(commentsTable).values({ templateId, authorId: userId, content }).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    return res.status(201).json({
      id: comment.id, templateId: comment.templateId,
      authorId: comment.authorId, authorName: user.name,
      authorAvatarUrl: user.avatarUrl, content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
