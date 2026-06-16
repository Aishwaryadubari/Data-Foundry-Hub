import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  authorId: integer("author_id").notNull(),
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("published"),
  downloads: integer("downloads").notNull().default(0),
  averageRating: real("average_rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  code: text("code").notNull(),
  documentation: text("documentation").notNull().default(""),
  usageExample: text("usage_example"),
  prerequisites: text("prerequisites"),
  changelog: text("changelog"),
  language: text("language"),
  complexity: text("complexity"),
  isFeatured: integer("is_featured").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templatesTable.$inferSelect;
