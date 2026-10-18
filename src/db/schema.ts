import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const textSubmissions = pgTable("text_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  content: text("content").notNull(),
  author: varchar("author", { length: 80 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("draft"),
  preset: varchar("preset", { length: 24 }).notNull().default("fade-up"),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
