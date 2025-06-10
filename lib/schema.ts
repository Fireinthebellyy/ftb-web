import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "mentor", "admin"]);

export const users_sync = pgTable("neon_auth.users_sync", {
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

export const mentors = pgTable("mentors", {
  id: text("id").primaryKey(),
  mentorName: text("mentor_name").notNull(),
  mentorNumber: text("mentor_number"),
  mentorImage: text("mentor_image"),
  description: text("description"),
  mentorEmail: text("mentor_email").notNull(),
  isVerified: boolean("is_verified").default(false),
  tags: text("tags"),
  calLink: text("cal_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  rating: integer("rating"),
  availability: boolean("availability").default(true),
});
