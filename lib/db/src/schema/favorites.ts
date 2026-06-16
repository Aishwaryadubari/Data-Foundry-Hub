import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  templateId: integer("template_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  uniq: unique().on(t.userId, t.templateId),
}));

export type Favorite = typeof favoritesTable.$inferSelect;
