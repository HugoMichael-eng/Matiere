import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const formulaEvents = pgTable("formula_events", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").notNull(),
  formulaName: text("formula_name").notNull(),
  ownerId: text("owner_id").notNull(),
  type: text("type").notNull(), // created | updated | status_changed | ingredients_changed | deleted
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertFormulaEventSchema = createInsertSchema(formulaEvents).omit({
  id: true,
  createdAt: true,
});

export type FormulaEvent = typeof formulaEvents.$inferSelect;
export type InsertFormulaEvent = z.infer<typeof insertFormulaEventSchema>;
