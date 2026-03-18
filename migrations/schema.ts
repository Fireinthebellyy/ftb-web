import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  boolean,
  date,
  foreignKey,
  integer,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const internshipTiming = pgEnum("internship_timing", [
  "full-time",
  "part-time",
  "shift-based",
]);
export const internshipType = pgEnum("internship_type", [
  "part-time",
  "full-time",
  "contract",
  "remote",
  "work-from-home",
  "in-office",
  "hybrid",
]);
export const opportunityType = pgEnum("opportunity_type", [
  "hackathon",
  "grant application",
  "competition",
  "ideathon",
]);
export const personaType = pgEnum("persona_type", ["student", "society"]);
export const toolkitContentItemType = pgEnum("toolkit_content_item_type", [
  "article",
  "video",
]);
export const ungatekeepTag = pgEnum("ungatekeep_tag", [
  "announcement",
  "company_experience",
  "resources",
]);
export const userRole = pgEnum("user_role", ["user", "member", "admin"]);

export const bookmarks = pgTable("bookmarks", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  opportunityId: uuid("opportunity_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    feedback: text(),
  },
  (table) => [unique("waitlist_email_unique").on(table.email)]
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    role: text().default("user").notNull(),
    fieldInterests: text("field_interests").array().default([""]),
    opportunityInterests: text("opportunity_interests").array().default([""]),
    dateOfBirth: date("date_of_birth"),
    collegeInstitute: text("college_institute"),
    contactNumber: text("contact_number"),
    currentRole: text("current_role"),
  },
  (table) => [unique("user_email_unique").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ]
);

export const mentors = pgTable(
  "mentors",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    mentorName: text("mentor_name").notNull(),
    mentorNumber: text("mentor_number"),
    mentorImage: text("mentor_image"),
    description: text(),
    mentorEmail: text("mentor_email").notNull(),
    isVerified: boolean("is_verified").default(false),
    tags: text().array().default([""]),
    calLink: text("cal_link"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    rating: integer(),
    availability: boolean().default(true),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "mentors_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    userId: text("user_id"),
    isSubscribed: boolean("is_subscribed").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "newsletter_subscribers_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("newsletter_subscribers_email_unique").on(table.email),
  ]
);

export const userToolkitProgress = pgTable(
  "user_toolkit_progress",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    toolkitId: uuid("toolkit_id").notNull(),
    contentItemId: uuid("content_item_id").notNull(),
    completedAt: timestamp("completed_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("user_content_item_unique").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.contentItemId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_toolkit_progress_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.toolkitId],
      foreignColumns: [toolkits.id],
      name: "user_toolkit_progress_toolkit_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.contentItemId],
      foreignColumns: [toolkitContentItems.id],
      name: "user_toolkit_progress_content_item_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const ungatekeepPosts = pgTable(
  "ungatekeep_posts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    content: text().notNull(),
    images: text().array().default(["RAY"]),
    linkUrl: text("link_url"),
    linkTitle: text("link_title"),
    linkImage: text("link_image"),
    tag: ungatekeepTag(),
    isPinned: boolean("is_pinned").default(false),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "ungatekeep_posts_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    userId: text("user_id").notNull(),
    opportunityId: uuid("opportunity_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "comments_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.opportunityId],
      foreignColumns: [opportunities.id],
      name: "comments_opportunity_id_opportunities_id_fk",
    }).onDelete("cascade"),
  ]
);

export const tasks = pgTable("tasks", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text().notNull(),
  description: text(),
  completed: boolean().default(false),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  userId: text("user_id").notNull(),
  opportunityLink: text("opportunity_link"),
});

export const tags = pgTable("tags", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    location: text(),
    organiserInfo: text("organiser_info"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    publishAt: timestamp("publish_at", { mode: "string" }),
    isFlagged: boolean("is_flagged").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),
    userId: text("user_id").notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    images: text().array().default([""]),
    type: text().default("hackathon").notNull(),
    upvoterIds: text("upvoter_ids").array().default([""]),
    upvoteCount: integer("upvote_count").default(0),
    tagIds: uuid("tag_ids").array().default([""]),
  },
  (table) => [
    index("opportunities_tag_ids_idx").using(
      "gin",
      table.tagIds.asc().nullsLast().op("array_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "opportunities_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const feedback = pgTable("feedback", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  mood: integer().notNull(),
  meaning: text().notNull(),
  message: text(),
  path: text(),
  userAgent: text("user_agent"),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const userOnboardingProfiles = pgTable(
  "user_onboarding_profiles",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    persona: personaType().notNull(),
    locationType: text("location_type"),
    locationValue: text("location_value"),
    educationLevel: text("education_level"),
    fieldOfStudy: text("field_of_study"),
    fieldOther: text("field_other"),
    opportunityInterests: text("opportunity_interests").array().default([""]),
    domainPreferences: text("domain_preferences").array().default([""]),
    struggles: text().array().default([""]),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("user_onboarding_profiles_user_id_unique").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_onboarding_profiles_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userToolkits = pgTable("user_toolkits", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  toolkitId: uuid("toolkit_id").notNull(),
  purchaseDate: timestamp("purchase_date", { mode: "string" }).defaultNow(),
  razorpayOrderId: text("razorpay_order_id"),
  paymentId: text("payment_id"),
  paymentStatus: text("payment_status"),
  amountPaid: integer("amount_paid"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const toolkitContentItems = pgTable(
  "toolkit_content_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    toolkitId: uuid("toolkit_id").notNull(),
    title: text().notNull(),
    type: toolkitContentItemType().notNull(),
    content: text(),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    bunnyVideoUrl: text("bunny_video_url"),
  },
  (table) => [
    index("idx_toolkit_content_items_order").using(
      "btree",
      table.toolkitId.asc().nullsLast().op("int4_ops"),
      table.orderIndex.asc().nullsLast().op("int4_ops")
    ),
    foreignKey({
      columns: [table.toolkitId],
      foreignColumns: [toolkits.id],
      name: "toolkit_content_items_toolkit_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const toolkits = pgTable(
  "toolkits",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    price: integer().notNull(),
    coverImageUrl: text("cover_image_url"),
    videoUrl: text("video_url"),
    contentUrl: text("content_url"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    userId: text("user_id").notNull(),
    originalPrice: integer("original_price"),
    category: text(),
    highlights: text().array(),
    totalDuration: text("total_duration"),
    lessonCount: integer("lesson_count").default(0),
    showSaleBadge: boolean("show_sale_badge").default(false),
  },
  (table) => [
    index("idx_toolkits_category")
      .using("btree", table.category.asc().nullsLast().op("text_ops"))
      .where(sql`(category IS NOT NULL)`),
  ]
);

export const internships = pgTable(
  "internships",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    type: internshipType().notNull(),
    timing: internshipTiming().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    link: text(),
    poster: text().notNull(),
    tagIds: uuid("tag_ids").array().default([""]),
    location: text(),
    deadline: date(),
    stipend: integer(),
    hiringOrganization: text("hiring_organization").notNull(),
    hiringManager: text("hiring_manager"),
    hiringManagerEmail: text("hiring_manager_email"),
    experience: text(),
    isFlagged: boolean("is_flagged").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),
    viewCount: integer("view_count").default(0),
    applicationCount: integer("application_count").default(0),
    userId: text("user_id").notNull(),
    eligibility: text().array().default([""]),
    duration: text(),
  },
  (table) => [
    index("idx_internships_created_at").using(
      "btree",
      table.createdAt.desc().nullsFirst().op("timestamp_ops")
    ),
    index("idx_internships_deleted_at").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("idx_internships_is_active").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops")
    ),
    index("idx_internships_timing").using(
      "btree",
      table.timing.asc().nullsLast().op("enum_ops")
    ),
    index("idx_internships_type").using(
      "btree",
      table.type.asc().nullsLast().op("enum_ops")
    ),
    index("idx_internships_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "internships_user_id_fkey",
    }).onDelete("cascade"),
  ]
);
