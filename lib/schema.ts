import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "mentor", "admin"]);

export const users_sync = pgTable("users_sync", {
  raw_json: text("raw_json").$type<string>(),
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
  deleted_at: timestamp("deleted_at").$type<string | null>(),
  bookmarks: text("bookmarks").array(),
  role: userRoleEnum("role").default("student"),
  instrestedIn: text("instrestedIn").array().default([]),
});
