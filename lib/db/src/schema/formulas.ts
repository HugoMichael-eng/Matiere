import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const formulaIngredientsSchema = z.array(
  z.object({
    materialId: z.number(),
    materialName: z.string(),
    percentage: z.number(),
    grams: z.number(),
    role: z.enum(["top", "heart", "base", "modifier"]),
    allergenFlags: z.array(z.string()).optional(),
  }),
);

export type FormulaIngredientRecord = z.infer<typeof formulaIngredientsSchema>[number];

export const formulasTable = pgTable("formulas", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  brief: text("brief").notNull().default(""),
  status: text("status").notNull().default("draft"),
  concentration: real("concentration").notNull().default(15),
  totalMl: real("total_ml").notNull().default(30),
  version: integer("version").notNull().default(1),
  ingredients: jsonb("ingredients").$type<FormulaIngredientRecord[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  ifraCategory: text("ifra_category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFormulaSchema = createInsertSchema(formulasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Formula = typeof formulasTable.$inferSelect;