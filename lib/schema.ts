import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
  date,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "member", "admin"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "hackathon",
  "grant",
  "competition",
  "ideathon",
]);

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
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: opportunityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  images: text("images").array().default([]),
  tags: text("tags").array().default([]),
  location: text("location"),
  organiserInfo: text("organiser_info"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  upvoterIds: text("upvoter_ids").array().default([]),
  upvoteCount: integer("upvote_count").default(0),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  fieldInterests: text("field_interests").array().default([]),
  opportunityInterests: text("opportunity_interests").array().default([]),
  dateOfBirth: date("date_of_birth"),
  collegeInstitute: text("college_institute"),
  contactNumber: text("contact_number"),
  currentRole: text("current_role"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
  role: userRoleEnum("role").default("user").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("bookmarks_user_opportunity_unique").on(
      table.userId,
      table.opportunityId
    ),
  ]
);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  feedback: text("feedback"),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  opportunityLink: text("opportunity_link"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  mood: integer("mood").notNull(), // 1-5
  meaning: text("meaning").notNull(),
  message: text("message"),
  path: text("path"),
  userAgent: text("user_agent"),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tags for autosuggest
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
  }
);

export const schema = {
  user,
  mentors,
  opportunities,
  comments,
  session,
  account,
  verification,
  bookmarks,
  waitlist,
  tasks,
  feedback,
  tags,
};
