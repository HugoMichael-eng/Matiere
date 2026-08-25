import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const uploadedFilesTable = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  category: text("category").notNull(),
  objectKey: text("object_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UploadedFile = typeof uploadedFilesTable.$inferSelect;