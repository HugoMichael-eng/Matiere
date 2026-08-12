import { createInsertSchema } from "drizzle-zod";
import { boolean, jsonb, pgTable, real, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const materialsTable = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  family: text("family").notNull(),
  origin: text("origin").notNull(),
  casNumber: text("cas_number"),
  allergens: jsonb("allergens").$type<string[]>().notNull().default([]),
  ifraCategory: text("ifra_category").notNull(),
  ifraLimit: real("ifra_limit").notNull(),
  usageNotes: text("usage_notes").notNull().default(""),
  inStock: boolean("in_stock").notNull().default(true),
  safetyStatus: text("safety_status").notNull().default("low"),
});

export const insertMaterialSchema = createInsertSchema(materialsTable).omit({
  id: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materialsTable.$inferSelect;