import { Router } from "express";
import { db, ratingsTable, templatesTable } from "@workspace/db";
import { eq, and, avg, count } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.post("/ratings/:templateId", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const templateId = parseInt(req.params.templateId);
    const { score } = req.body;
    if (!score || score < 1 || score > 5) return res.status(400).json({ error: "Score must be 1-5" });

    await db.insert(ratingsTable)
      .values({ userId, templateId, score })
      .onConflictDoUpdate({ target: [ratingsTable.userId, ratingsTable.templateId], set: { score, updatedAt: new Date() } });

    // Recalculate average
    const [stats] = await db
      .select({ avg: avg(ratingsTable.score), cnt: count(ratingsTable.id) })
      .from(ratingsTable)
      .where(eq(ratingsTable.templateId, templateId));

    const avgRating = Number(stats?.avg) || 0;
    const ratingCount = Number(stats?.cnt) || 0;

    await db.update(templatesTable)
      .set({ averageRating: avgRating, ratingCount })
      .where(eq(templatesTable.id, templateId));

    return res.json({ averageRating: avgRating, ratingCount, userScore: score });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
