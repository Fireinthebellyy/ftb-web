import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
  date,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "mentor", "admin"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "hackathon",
  "grant application",
  "competition",
  "ideathon",
]);

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

export const mentors = pgTable("mentors", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorName: text("mentor_name").notNull(),
  mentorNumber: text("mentor_number"),
  mentorImage: text("mentor_image"),
  description: text("description"),
  mentorEmail: text("mentor_email").notNull(),
  isVerified: boolean("is_verified").default(false),
  tags: text("tags").array().default([]),
  calLink: text("cal_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  rating: integer("rating"),
  availability: boolean("availability").default(true),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id").references(() => users_sync.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: opportunityTypeEnum("type").array().default([]),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  image: text("image"),
  tags: text("tags").array().default([]),
  location: text("location"),
  organiserInfo: text("organiser_info"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  comments: text("comments").array().default([]),
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdByUser: text("created_by_user").references(() => users_sync.id),
});
