import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/admin/users", authMiddleware, async (req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id, email: usersTable.email, name: usersTable.name,
      role: usersTable.role, avatarUrl: usersTable.avatarUrl, bio: usersTable.bio,
      createdAt: usersTable.createdAt,
    }).from(usersTable);

    return res.json(users.map((u) => ({
      ...u,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/admin/users/:id/role", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });

    const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
    return res.json({
      id: user.id, email: user.email, name: user.name, role: user.role,
      avatarUrl: user.avatarUrl, bio: user.bio,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
