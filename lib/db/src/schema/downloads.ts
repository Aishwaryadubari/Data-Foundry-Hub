import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const downloadsTable = pgTable("downloads", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Download = typeof downloadsTable.$inferSelect;
