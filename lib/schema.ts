/* eslint-disable max-lines */
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
  smallint,
  date,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "member",
  "editor",
  "admin",
]);
export const personaEnum = pgEnum("persona_type", ["student", "society"]);
export const onboardingTrafficSourceEnum = pgEnum("onboarding_traffic_source", [
  "instagram",
  "reddit",
  "youtube",
  "linkedin",
  "chatgpt",
  "google_search",
  "whatsapp_group",
  "friend_or_senior",
  "campus_event",
  "other",
]);
export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "competitions_open_calls",
  "case_competitions",
  "hackathons",
  "fellowships",
  "ideathon_think_tanks",
  "leadership_programs",
  "awards_recognition",
  "grants_scholarships",
  "research_paper_ra_calls",
  "upskilling_events",
]);

export const mentors = pgTable("mentors", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorName: text("mentor_name").notNull(),
  mentorNumber: text("mentor_number"),
  mentorImage: text("mentor_image"),
  description: text("description"),
  mentorEmail: text("mentor_email"),
  isVerified: boolean("is_verified").default(false),
  tags: text("tags").array().default([]),
  linkedinLink: text("linkedin_link"),
  githubLink: text("github_link"),
  instaLink: text("insta_link"),
  customLink: text("custom_link"),
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
  attachments: text("attachments").array().default([]),
  tagIds: uuid("tag_ids").array().default([]),
  location: text("location"),
  organiserInfo: text("organiser_info"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  applyLink: text("apply_link"),
  isFlagged: boolean("is_flagged").default(false),
  publishAt: timestamp("publish_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete
  featuredHome: boolean("is_featured_home").default(false),
  trending: boolean("is_trending").default(false),
  displayIndex: integer("display_index"), 
  trendingIndex: integer("trending_index"),     
  featuredHomeIndex: integer("featured_home_index"), 
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  upvoterIds: text("upvoter_ids").array().default([]),
  upvoteCount: integer("upvote_count").default(0),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const internships = pgTable(
  "internships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type"),
    timing: text("timing"),
    link: text("link"),
    tags: text("tags").array().default([]),
    stipend: integer("stipend"),
    duration: text("duration"),
    experience: text("experience"),
    location: text("location"),
    deadline: date("deadline"),
    hiringOrganization: text("hiring_organization").notNull(),
    hiringManager: text("hiring_manager"),
    hiringManagerLinkedin: text("hiring_manager_linkedin"),
    hiringManagerEmail: text("hiring_manager_email"),
    field: text("field"),
    isVerified: boolean("is_verified").default(false),
    isFlagged: boolean("is_flagged").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    is_trending: boolean("is_trending").default(false),
    is_featured_home: boolean("is_featured_home").default(false),
    display_index: integer("display_index"),
    trending_index: integer("trending_index"),         
    featured_home_index: integer("featured_home_index"),
    trendingFeaturedExpiry: date("trending_featured_expiry"),
  },
  (table) => [
    index("internships_field_idx").on(table.field),
  ]
);

export const internshipSearchTerms = pgTable(
  "internship_search_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    term: text("term").notNull(),
    normalizedTerm: text("normalized_term").notNull(),
    searchCount: integer("search_count").notNull().default(1),
    lastSearchedAt: timestamp("last_searched_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("internship_search_terms_normalized_term_unique").on(
      table.normalizedTerm
    ),
    index("internship_search_terms_search_count_last_idx").on(
      table.searchCount,
      table.lastSearchedAt
    ),
  ]
);

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
  interestPromptCompletedAt: timestamp("interest_prompt_completed_at"),
  interestAreas: text("interest_areas").array().default([]),
  loginStreak: integer("login_streak").default(0).notNull(),
  lastLoginDate: date("last_login_date"),
}, (table) => [
  check("login_streak_range", sql`${table.loginStreak} BETWEEN 0 AND 30`)
]);

export const adminActivityLogs = pgTable(
  "admin_activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: text("admin_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("status_code").notNull(),
    success: boolean("success").default(false).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    metadata: jsonb("metadata"),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_activity_logs_admin_user_id_idx").on(table.adminUserId),
    index("admin_activity_logs_action_idx").on(table.action),
    index("admin_activity_logs_created_at_idx").on(table.createdAt),
  ]
);

export const userOnboardingProfiles = pgTable(
  "user_onboarding_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    persona: personaEnum("persona").notNull(),
    locationType: text("location_type"),
    locationValue: text("location_value"),
    educationLevel: text("education_level"),
    fieldOfStudy: text("field_of_study"),
    fieldOther: text("field_other"),
    opportunityInterests: text("opportunity_interests").array().default([]),
    domainPreferences: text("domain_preferences").array().default([]),
    struggles: text("struggles").array().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("user_onboarding_profiles_user_id_unique").on(table.userId),
  ]
);

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

export const onboardingSurveyResponses = pgTable(
  "onboarding_survey_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: onboardingTrafficSourceEnum("source").notNull(),
    sourceOther: text("source_other"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("onboarding_survey_responses_user_id_unique").on(table.userId),
  ]
);

// Tags for autosuggest
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface ToolkitTestimonial {
  name: string;
  role: string;
  message: string;
}

export interface ToolkitMentorshipDetails {
  mentorshipPacked?: string;
  formatOfMentorship?: string;
  mentor?: {
    name: string;
    imageUrl?: string;
    linkedinUrl?: string;
    instagramUrl?: string;
    mailId?: string;
    phoneNumber?: string;
    otherLinks?: { title: string; url: string }[];
  };
}

export const digitalProductSections = pgTable("digital_product_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mentorshipCarouselSlides = pgTable("mentorship_carousel_slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  mobileImageUrl: text("mobile_image_url"),
  desktopImageUrl: text("desktop_image_url"),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const toolkitTestimonialImages = pgTable("toolkit_testimonial_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// Toolkit tables for monetization
export const toolkits = pgTable("toolkits", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in rupees (converted to paisa when sent to Razorpay)
  originalPrice: integer("original_price"), // for displaying strikethrough discount price
  coverImageUrl: text("cover_image_url"),
  bannerImageUrl: text("banner_image_url"),
  videoUrl: text("video_url"), // YouTube promo video URL
  contentUrl: text("content_url"), // URL to toolkit content page (legacy)
  category: text("category"), // Category for filtering (e.g., "Career", "Skills")
  highlights: text("highlights").array(), // Bullet points like "10 lessons", "Lifetime access"
  summary: text("summary").array(), // Summary points for cards
  testimonials: jsonb("testimonials").$type<ToolkitTestimonial[]>(),
  mentorshipDetails: jsonb("mentorship_details").$type<ToolkitMentorshipDetails>(),
  totalDuration: text("total_duration"), // e.g., "2h 30m"
  rating: text("rating"), // e.g. "4.8"
  subtitle: text("subtitle"), // e.g. "1 lesson • 15 mins"
  lessonCount: integer("lesson_count").default(0),
  isActive: boolean("is_active").default(false),
  showSaleBadge: boolean("show_sale_badge").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  is_trending: boolean("is_trending").default(false),
  is_featured_home: boolean("is_featured_home").default(false),
  trending_index: integer("trending_index"),
  featured_home_index: integer("featured_home_index"),
  isBundle: boolean("is_bundle").default(false),
  bundleItems: jsonb("bundle_items").$type<string[]>().default([]),
  isBestSeller: boolean("is_best_seller").default(false),
  isLimitedSeats: boolean("is_limited_seats").default(false),
  digitalProductSectionId: uuid("digital_product_section_id").references(
    () => digitalProductSections.id,
    { onDelete: "set null" }
  ),
});

export const toolkitContentItemTypeEnum = pgEnum("toolkit_content_item_type", [
  "article",
  "video",
]);

export const ungatekeepTagEnum = pgEnum("ungatekeep_tag", [
  "announcement",
  "company_experience",
  "resources",
  "playbooks",
  "college_hacks",
  "interview",
  "ama_drops",
  "ftb_recommends",
]);

export const toolkitContentItems = pgTable("toolkit_content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolkitId: uuid("toolkit_id")
    .notNull()
    .references(() => toolkits.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: toolkitContentItemTypeEnum("type").notNull(),
  content: text("content"), // html for articles
  bunnyVideoUrl: text("bunny_video_url"), // Bunny CDN video URL for video type
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface ToolkitCommunityOption {
  text: string;
  isCorrect?: boolean;
}

export const toolkitCommunityPosts = pgTable("toolkit_community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolkitId: uuid("toolkit_id")
    .notNull()
    .references(() => toolkits.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("text"),
  title: text("title").notNull(),
  body: text("body"),
  options: jsonb("options").$type<ToolkitCommunityOption[]>().default([]),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const toolkitCommunityResponses = pgTable(
  "toolkit_community_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => toolkitCommunityPosts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    selectedOptionIndex: integer("selected_option_index"),
    textResponse: text("text_response"),
    attachmentUrl: text("attachment_url"),
    attachmentName: text("attachment_name"),
    attachmentType: text("attachment_type"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("toolkit_community_responses_post_user_unique").on(
      table.postId,
      table.userId
    ),
    index("toolkit_community_responses_post_id_idx").on(table.postId),
  ]
);

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // e.g., "SAVE100"
  discountAmount: integer("discount_amount").notNull(), // Fixed amount in rupees
  discountType: text("discount_type").notNull().default("fixed"), // "fixed" or "percentage"
  maxUses: integer("max_uses"), // Total usage limit (null = unlimited)
  maxUsesPerUser: integer("max_uses_per_user").default(1), // Per-user limit
  currentUses: integer("current_uses").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration
  createdAt: timestamp("created_at").defaultNow(),
});

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  background: text("background"), // CSS background property (e.g., linear-gradient)
  imageUrl: text("image_url"), // Optional background image
  link: text("link"), // Optional link when clicked
  priority: integer("priority").default(0), // For ordering posters
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userToolkits = pgTable("user_toolkits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  toolkitId: uuid("toolkit_id")
    .notNull()
    .references(() => toolkits.id, { onDelete: "cascade" }),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  razorpayOrderId: text("razorpay_order_id"), // Razorpay order ID
  paymentId: text("payment_id"), // Razorpay payment ID
  paymentStatus: text("payment_status").$type<
    "pending" | "completed" | "failed"
  >(),
  amountPaid: integer("amount_paid"), // Actual amount paid
  couponId: uuid("coupon_id").references(() => coupons.id, {
    onDelete: "set null",
  }), // Coupon used for this purchase
  createdAt: timestamp("created_at").defaultNow(),
});

// Track user progress on toolkit content items
export const userToolkitProgress = pgTable(
  "user_toolkit_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toolkitId: uuid("toolkit_id")
      .notNull()
      .references(() => toolkits.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => toolkitContentItems.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("user_content_item_unique").on(
      table.userId,
      table.contentItemId
    ),
  ]
);

// Ungatekeep broadcast posts
export const ungatekeepPosts = pgTable("ungatekeep_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  attachments: text("attachments").array().default([]), // Appwrite file IDs
  linkUrl: text("link_url"),
  linkTitle: text("link_title"),
  linkImage: text("link_image"),
  videoUrl: text("video_url"),
  tag: text("tag"),
  filterTags: text("filter_tags").array().default([]), // For frontend filtering: college_amas, upskill, entrance_exams
  isPinned: boolean("is_pinned").default(false),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  is_trending: boolean("is_trending").default(false),
  is_featured_home: boolean("is_featured_home").default(false),
  trending_index: integer("trending_index"),
  featured_home_index: integer("featured_home_index"),
  toolkitId: uuid("toolkit_id").references(() => toolkits.id, {
    onDelete: "set null",
  }),
});

export const ungatekeepComments = pgTable("ungatekeep_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  postId: uuid("post_id")
    .notNull()
    .references(() => ungatekeepPosts.id, { onDelete: "cascade" }),
});

export const ungatekeepPostVotes = pgTable(
  "ungatekeep_post_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => ungatekeepPosts.id, { onDelete: "cascade" }),
    vote: smallint("vote").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("ungatekeep_post_votes_user_post_unique").on(
      table.userId,
      table.postId
    ),
    check("vote_check", sql`${table.vote} IN (-1, 0, 1)`),
  ]
);

export const ungatekeepBookmarks = pgTable(
  "ungatekeep_bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => ungatekeepPosts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("ungatekeep_bookmarks_user_post_unique").on(
      table.userId,
      table.postId
    ),
  ]
);

// Newsletter subscribers for future Resend integration
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    isSubscribed: boolean("is_subscribed").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_unique").on(table.email),
  ]
);

// Define tables first
export const trackerItems = pgTable(
  "tracker_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    oppId: text("opp_id").notNull(),
    kind: text("kind").default("internship"), // 'internship' | 'opportunity'
    status: text("status").notNull(),
    notes: text("notes"),
    addedAt: timestamp("added_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    appliedAt: timestamp("applied_at"),
    result: text("result"),
    isManual: boolean("is_manual").default(false),
    manualData: text("manual_data"), // storing JSON stringified manual data
  },
  (table) => [
    uniqueIndex("tracker_items_user_kind_opp_unique").on(
      table.userId,
      table.kind,
      table.oppId
    ),
  ]
);

export const trackerEvents = pgTable(
  "tracker_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    date: timestamp("date").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("tracker_events_user_title_date_unique").on(
      table.userId,
      table.title,
      table.date
    ),
  ]
);

export const cohorts = pgTable("cohorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  badge1: text("badge1"),
  badge2: text("badge2"),
  subtitle: text("subtitle"),
  coverImageUrl: text("cover_image_url"),
  cardImageUrl: text("card_image_url"),
  startDate: text("start_date"),
  highlights: text("highlights").array(),
  mentorsHeading: text("mentors_heading").default("Meet Your Mentors"),
  mentorsLinkTarget: text("mentors_link_target"),
  mentorsLimit: integer("mentors_limit").default(4),
  featuresHeading: text("features_heading").default("What You Get"),
  investmentLabel: text("investment_label").default("Total Investment"),
  basePrice: integer("base_price").notNull(),
  originalPrice: integer("original_price"), // for displaying strikethrough discount price
  toolkitId: uuid("toolkit_id").references(() => toolkits.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cohortMentors = pgTable("cohort_mentors", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  imageUrl: text("image_url"),
  bio: text("bio"),
  link: text("link"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cohortFeatures = pgTable("cohort_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  icon: text("icon").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cohortTiers = pgTable("cohort_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"), // for displaying strikethrough discount price
  description: text("description").notNull(),
  whatIncluded: jsonb("what_included").$type<string[]>().default([]),
  isDefault: boolean("is_default").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cohortAddOns = pgTable("cohort_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceDelta: integer("price_delta").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cohortSessions = pgTable("cohort_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceDelta: integer("price_delta").default(0),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cohortOrders = pgTable("cohort_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone"),
  selectedTierId: uuid("selected_tier_id").references(() => cohortTiers.id, { onDelete: "set null" }),
  selectedAddOnIds: jsonb("selected_addon_ids").$type<string[]>().default([]),
  selectedToolkitIds: jsonb("selected_toolkit_ids").$type<string[]>().default([]),
  amountPaid: integer("amount_paid").notNull(),
  couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export schema object last
export const schema = {
  user,
  userOnboardingProfiles,
  mentors,
  opportunities,
  internships,
  internshipSearchTerms,
  comments,
  session,
  account,
  verification,
  bookmarks,
  waitlist,
  tasks,
  feedback,
  onboardingSurveyResponses,
  tags,
  toolkits,
  digitalProductSections,
  mentorshipCarouselSlides,
  toolkitTestimonialImages,
  toolkitContentItems,
  toolkitCommunityPosts,
  toolkitCommunityResponses,
  coupons,
  banners,
  userToolkits,
  userToolkitProgress,
  ungatekeepPosts,
  ungatekeepPostVotes,
  ungatekeepBookmarks,
  ungatekeepComments,
  newsletterSubscribers,
  trackerItems,
  trackerEvents,
  adminActivityLogs,
  cohorts,
  cohortMentors,
  cohortFeatures,
  cohortTiers,
  cohortAddOns,
  cohortSessions,
  cohortOrders,
};

