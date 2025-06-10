import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "mentor", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }),
  bio: text("bio"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  role: userRoleEnum("role").notNull(),
  bookmarks: text("bookmarks").default("[]"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  interestedField: text("interested_field"),
});
