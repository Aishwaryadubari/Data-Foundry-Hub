import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken, storeToken, removeToken, getUserIdFromToken } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    storeToken(token, user.id);

    return res.json({
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        avatarUrl: user.avatarUrl, bio: user.bio, createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "All fields required" });

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const [user] = await db.insert(usersTable).values({
      email, name, passwordHash: hashPassword(password), role: "user",
    }).returning();

    const token = generateToken(user.id);
    storeToken(token, user.id);

    return res.status(201).json({
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        avatarUrl: user.avatarUrl, bio: user.bio, createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    removeToken(authHeader.slice(7));
  }
  return res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
  const token = authHeader.slice(7);
  const userId = getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "Invalid token" });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.json({
      id: user.id, email: user.email, name: user.name, role: user.role,
      avatarUrl: user.avatarUrl, bio: user.bio, createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
