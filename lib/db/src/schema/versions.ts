import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const templateVersionsTable = pgTable("template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  version: text("version").notNull(),
  code: text("code").notNull(),
  changelog: text("changelog").notNull().default(""),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TemplateVersion = typeof templateVersionsTable.$inferSelect;
