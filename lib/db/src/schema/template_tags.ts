import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const templateTagsTable = pgTable("template_tags", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (t) => ({
  uniq: unique().on(t.templateId, t.tagId),
}));

export type Tag = typeof tagsTable.$inferSelect;
export type TemplateTag = typeof templateTagsTable.$inferSelect;
