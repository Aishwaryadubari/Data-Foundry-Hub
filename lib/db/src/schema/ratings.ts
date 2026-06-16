import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  templateId: integer("template_id").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  uniq: unique().on(t.userId, t.templateId),
}));

export type Rating = typeof ratingsTable.$inferSelect;
