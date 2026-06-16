import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  code: text("code").notNull(),
  documentation: text("documentation").notNull().default(""),
  language: text("language"),
  complexity: text("complexity"),
  status: text("status").notNull().default("pending"),
  submittedById: integer("submitted_by_id").notNull(),
  reviewedById: integer("reviewed_by_id"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const submissionTagsTable = pgTable("submission_tags", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  tagName: text("tag_name").notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
