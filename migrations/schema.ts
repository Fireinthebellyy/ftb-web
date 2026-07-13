/* eslint-disable max-lines */
import { pgTable, foreignKey, uuid, text, timestamp, unique, uniqueIndex, check, smallint, integer, index, boolean, jsonb, date, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const onboardingTrafficSource = pgEnum("onboarding_traffic_source", ['instagram', 'reddit', 'whatsapp_group', 'linkedin', 'youtube', 'chatgpt', 'google_search', 'friend_or_senior', 'campus_event', 'other'])
export const opportunityType = pgEnum("opportunity_type", ['competitions_open_calls', 'case_competitions', 'hackathons', 'fellowships', 'ideathon_think_tanks', 'leadership_programs', 'awards_recognition', 'grants_scholarships', 'research_paper_ra_calls', 'upskilling_events'])
export const personaType = pgEnum("persona_type", ['student', 'society'])
export const toolkitContentItemType = pgEnum("toolkit_content_item_type", ['article', 'video'])
export const ungatekeepTag = pgEnum("ungatekeep_tag", ['announcement', 'company_experience', 'resources', 'playbooks', 'college_hacks', 'interview', 'ama_drops', 'ftb_recommends'])
export const userRole = pgEnum("user_role", ['user', 'member', 'admin', 'editor'])


export const ungatekeepComments = pgTable("ungatekeep_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	postId: uuid("post_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ungatekeep_comments_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [ungatekeepPosts.id],
			name: "ungatekeep_comments_post_id_ungatekeep_posts_id_fk"
		}).onDelete("cascade"),
]);

export const waitlist = pgTable("waitlist", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	feedback: text(),
}, (table) => [
	unique("waitlist_email_unique").on(table.email),
]);

export const ungatekeepPostVotes = pgTable("ungatekeep_post_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	postId: uuid("post_id").notNull(),
	vote: smallint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("ungatekeep_post_votes_user_post_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ungatekeep_post_votes_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [ungatekeepPosts.id],
			name: "ungatekeep_post_votes_post_id_ungatekeep_posts_id_fk"
		}).onDelete("cascade"),
	check("ungatekeep_post_votes_vote_check", sql`vote = ANY (ARRAY['-1'::integer, 0, 1])`),
]);

export const userToolkits = pgTable("user_toolkits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	purchaseDate: timestamp("purchase_date", { mode: 'string' }).defaultNow(),
	razorpayOrderId: text("razorpay_order_id"),
	paymentId: text("payment_id"),
	paymentStatus: text("payment_status"),
	amountPaid: integer("amount_paid"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	couponId: uuid("coupon_id"),
}, (table) => [
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupons.id],
			name: "user_toolkits_coupon_id_coupons_id_fk"
		}).onDelete("set null"),
]);

export const adminActivityLogs = pgTable("admin_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adminUserId: text("admin_user_id"),
	action: text().notNull(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	method: text().notNull(),
	path: text().notNull(),
	statusCode: integer("status_code").notNull(),
	success: boolean().default(false).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	requestId: text("request_id"),
	metadata: jsonb(),
	beforeState: jsonb("before_state"),
	afterState: jsonb("after_state"),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_activity_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("admin_activity_logs_admin_user_id_idx").using("btree", table.adminUserId.asc().nullsLast().op("text_ops")),
	index("admin_activity_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.adminUserId],
			foreignColumns: [user.id],
			name: "admin_activity_logs_admin_user_id_user_id_fk"
		}).onDelete("set null"),
]);

export const digitalProductSections = pgTable("digital_product_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	orderIndex: integer("order_index").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const mentors = pgTable("mentors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mentorName: text("mentor_name").notNull(),
	mentorNumber: text("mentor_number"),
	mentorImage: text("mentor_image"),
	description: text(),
	mentorEmail: text("mentor_email"),
	isVerified: boolean("is_verified").default(false),
	tags: text().array().default([""]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	rating: integer(),
	availability: boolean().default(true),
	userId: text("user_id").notNull(),
	linkedinLink: text("linkedin_link"),
	githubLink: text("github_link"),
	instaLink: text("insta_link"),
	customLink: text("custom_link"),
});

export const ungatekeepPosts = pgTable("ungatekeep_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	linkUrl: text("link_url"),
	linkTitle: text("link_title"),
	linkImage: text("link_image"),
	tag: text(),
	isPinned: boolean("is_pinned").default(false),
	isPublished: boolean("is_published").default(false),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	attachments: text().array().default(["RAY"]),
	videoUrl: text("video_url"),
	isTrending: boolean("is_trending").default(false),
	isFeaturedHome: boolean("is_featured_home").default(false),
	trendingIndex: integer("trending_index"),
	featuredHomeIndex: integer("featured_home_index"),
	toolkitId: uuid("toolkit_id"),
	filterTags: text("filter_tags").array().default([""]),
}, (table) => [
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "ungatekeep_posts_toolkit_id_toolkits_id_fk"
		}).onDelete("set null"),
]);

export const toolkitCommunityPosts = pgTable("toolkit_community_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	type: text().default('text').notNull(),
	title: text().notNull(),
	body: text(),
	options: jsonb().default([]),
	attachmentUrl: text("attachment_url"),
	attachmentName: text("attachment_name"),
	attachmentType: text("attachment_type"),
	orderIndex: integer("order_index").default(0).notNull(),
	isPublished: boolean("is_published").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "toolkit_community_posts_toolkit_id_toolkits_id_fk"
		}).onDelete("cascade"),
]);

export const cohorts = pgTable("cohorts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	badge1: text(),
	badge2: text(),
	subtitle: text(),
	coverImageUrl: text("cover_image_url"),
	mentorsHeading: text("mentors_heading").default('Meet Your Mentors'),
	mentorsLinkTarget: text("mentors_link_target"),
	mentorsLimit: integer("mentors_limit").default(4),
	featuresHeading: text("features_heading").default('What You Get'),
	investmentLabel: text("investment_label").default('Total Investment'),
	basePrice: integer("base_price").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	toolkitId: uuid("toolkit_id"),
	originalPrice: integer("original_price"),
	cardImageUrl: text("card_image_url"),
	startDate: text("start_date"),
	highlights: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "cohorts_toolkit_id_fkey"
		}).onDelete("set null"),
	unique("cohorts_slug_key").on(table.slug),
	unique("cohorts_slug_unique").on(table.slug),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	completed: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	opportunityLink: text("opportunity_link"),
}, (table) => [
	index("tasks_user_completed_created_at_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.completed.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
]);

export const cohortMentors = pgTable("cohort_mentors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cohortId: uuid("cohort_id"),
	name: text().notNull(),
	role: text().notNull(),
	imageUrl: text("image_url"),
	bio: text(),
	link: text(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cohortId],
			foreignColumns: [cohorts.id],
			name: "cohort_mentors_cohort_id_fkey"
		}).onDelete("cascade"),
]);

export const toolkitCommunityResponses = pgTable("toolkit_community_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	userId: text("user_id").notNull(),
	selectedOptionIndex: integer("selected_option_index"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	textResponse: text("text_response"),
	attachmentUrl: text("attachment_url"),
	attachmentName: text("attachment_name"),
	attachmentType: text("attachment_type"),
}, (table) => [
	index("toolkit_community_responses_post_id_idx").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("toolkit_community_responses_post_user_unique").using("btree", table.postId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [toolkitCommunityPosts.id],
			name: "toolkit_community_responses_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "toolkit_community_responses_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userToolkitProgress = pgTable("user_toolkit_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	contentItemId: uuid("content_item_id").notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("user_content_item_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.contentItemId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "user_toolkit_progress_toolkit_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contentItemId],
			foreignColumns: [toolkitContentItems.id],
			name: "user_toolkit_progress_content_item_id_fkey"
		}).onDelete("cascade"),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	userId: text("user_id"),
	isSubscribed: boolean("is_subscribed").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),
}, (table) => [
	unique("newsletter_subscribers_email_unique").on(table.email),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	discountAmount: integer("discount_amount").notNull(),
	maxUses: integer("max_uses"),
	maxUsesPerUser: integer("max_uses_per_user").default(1),
	currentUses: integer("current_uses").default(0),
	isActive: boolean("is_active").default(true),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	discountType: text("discount_type").default('fixed').notNull(),
}, (table) => [
	unique("coupons_code_unique").on(table.code),
	check("coupons_discount_type_check", sql`discount_type = ANY (ARRAY['fixed'::text, 'percentage'::text])`),
]);

export const opportunities = pgTable("opportunities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	location: text(),
	organiserInfo: text("organiser_info"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	isFlagged: boolean("is_flagged").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isVerified: boolean("is_verified").default(false),
	isActive: boolean("is_active").default(true),
	userId: text("user_id").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	images: text().array().default([""]),
	type: opportunityType().notNull(),
	upvoterIds: text("upvoter_ids").array().default([""]),
	upvoteCount: integer("upvote_count").default(0),
	tagIds: uuid("tag_ids").array().default([""]),
	publishAt: timestamp("publish_at", { mode: 'string' }),
	attachments: text().array().default([""]),
	applyLink: text("apply_link"),
	isFeaturedHome: boolean("is_featured_home").default(false),
	isTrending: boolean("is_trending").default(false),
	trendingIndex: integer("trending_index"),
	featuredHomeIndex: integer("featured_home_index"),
	displayIndex: integer("display_index"),
}, (table) => [
	index("opportunities_active_feed_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")).where(sql`((deleted_at IS NULL) AND (is_active = true))`),
	index("opportunities_admin_feed_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")).where(sql`(deleted_at IS NULL)`),
	index("opportunities_description_trgm_idx").using("gin", table.description.asc().nullsLast().op("gin_trgm_ops")),
	index("opportunities_end_date_idx").using("btree", table.endDate.asc().nullsLast().op("date_ops")),
	index("opportunities_feed_type_created_at_idx").using("btree", table.type.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("timestamp_ops")).where(sql`((deleted_at IS NULL) AND (is_active = true))`),
	index("opportunities_tag_ids_gin_idx").using("gin", table.tagIds.asc().nullsLast().op("array_ops")),
	index("opportunities_tag_ids_idx").using("gin", table.tagIds.asc().nullsLast().op("array_ops")),
	index("opportunities_title_trgm_idx").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
]);

export const feedback = pgTable("feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mood: integer().notNull(),
	meaning: text().notNull(),
	message: text(),
	path: text(),
	userAgent: text("user_agent"),
	userId: text("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const toolkitTestimonialImages = pgTable("toolkit_testimonial_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	imageUrl: text("image_url").notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const toolkitContentItems = pgTable("toolkit_content_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	title: text().notNull(),
	type: toolkitContentItemType().notNull(),
	content: text(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	bunnyVideoUrl: text("bunny_video_url"),
}, (table) => [
	index("idx_toolkit_content_items_order").using("btree", table.toolkitId.asc().nullsLast().op("int4_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "toolkit_content_items_toolkit_id_fkey"
		}).onDelete("cascade"),
]);

export const userOnboardingProfiles = pgTable("user_onboarding_profiles", {
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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("user_onboarding_profiles_user_id_unique").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const mentorshipCarouselSlides = pgTable("mentorship_carousel_slides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	orderIndex: integer("order_index").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	mobileImageUrl: text("mobile_image_url"),
	desktopImageUrl: text("desktop_image_url"),
});

export const toolkits = pgTable("toolkits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	price: integer().notNull(),
	coverImageUrl: text("cover_image_url"),
	videoUrl: text("video_url"),
	contentUrl: text("content_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	originalPrice: integer("original_price"),
	category: text(),
	highlights: text().array(),
	totalDuration: text("total_duration"),
	lessonCount: integer("lesson_count").default(0),
	showSaleBadge: boolean("show_sale_badge").default(false),
	bannerImageUrl: text("banner_image_url"),
	testimonials: jsonb(),
	isTrending: boolean("is_trending").default(false),
	isFeaturedHome: boolean("is_featured_home").default(false),
	trendingIndex: integer("trending_index"),
	featuredHomeIndex: integer("featured_home_index"),
	bundleItems: jsonb("bundle_items"),
	isBestSeller: boolean("is_best_seller").default(false),
	isLimitedSeats: boolean("is_limited_seats").default(false),
	digitalProductSectionId: uuid("digital_product_section_id"),
	mentorshipDetails: jsonb("mentorship_details"),
	summary: text().array(),
	rating: text(),
	subtitle: text(),
	isBundle: boolean("is_bundle").default(false),
	isCohort: boolean("is_cohort").default(false),
	cohortDetails: jsonb("cohort_details"),
}, (table) => [
	index("idx_toolkits_category").using("btree", table.category.asc().nullsLast().op("text_ops")).where(sql`(category IS NOT NULL)`),
	foreignKey({
			columns: [table.digitalProductSectionId],
			foreignColumns: [digitalProductSections.id],
			name: "toolkits_digital_product_section_id_digital_product_sections_id"
		}).onDelete("set null"),
]);

export const internshipSearchTerms = pgTable("internship_search_terms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	term: text().notNull(),
	normalizedTerm: text("normalized_term").notNull(),
	searchCount: integer("search_count").default(1).notNull(),
	lastSearchedAt: timestamp("last_searched_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("internship_search_terms_normalized_term_key").on(table.normalizedTerm),
]);

export const comments = pgTable("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	opportunityId: uuid("opportunity_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "comments_opportunity_id_opportunities_id_fk"
		}).onDelete("cascade"),
]);

export const bookmarks = pgTable("bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	opportunityId: uuid("opportunity_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const session = pgTable("session", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	token: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id"),
	sessionToken: text(),
	expires: timestamp({ mode: 'string' }),
}, (table) => [
	index("session_sessionToken_idx").using("btree", table.sessionToken.asc().nullsLast().op("text_ops")),
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	role: userRole().default('user').notNull(),
	fieldInterests: text("field_interests").array().default([""]),
	opportunityInterests: text("opportunity_interests").array().default([""]),
	dateOfBirth: date("date_of_birth"),
	collegeInstitute: text("college_institute"),
	contactNumber: text("contact_number"),
	currentRole: text("current_role"),
	calendarReminderWeek: boolean("calendar_reminder_week").default(true),
	calendarReminderDay: boolean("calendar_reminder_day").default(true),
	calendarReminderHour: boolean("calendar_reminder_hour").default(true),
	interestPromptCompletedAt: timestamp("interest_prompt_completed_at", { mode: 'string' }),
	interestAreas: text("interest_areas").array().default([""]),
	loginStreak: integer("login_streak").default(0).notNull(),
	lastLoginDate: date("last_login_date"),
}, (table) => [
	unique("user_email_unique").on(table.email),
	check("login_streak_range", sql`(login_streak >= 0) AND (login_streak <= 30)`),
]);

export const internships = pgTable("internships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: text(),
	timing: text(),
	title: text().notNull(),
	description: text(),
	link: text(),
	location: text(),
	deadline: date(),
	stipend: integer(),
	hiringOrganization: text("hiring_organization").notNull(),
	hiringManager: text("hiring_manager"),
	experience: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	isVerified: boolean("is_verified").default(false),
	isActive: boolean("is_active").default(true),
	userId: text("user_id").notNull(),
	duration: text(),
	tags: text().array().default([""]),
	isFlagged: boolean("is_flagged").default(false),
	isTrending: boolean("is_trending").default(false),
	isFeaturedHome: boolean("is_featured_home").default(false),
	displayIndex: integer("display_index"),
	trendingIndex: integer("trending_index"),
	featuredHomeIndex: integer("featured_home_index"),
	hiringManagerLinkedin: text("hiring_manager_linkedin"),
	hiringManagerEmail: text("hiring_manager_email"),
	field: text(),
	trendingFeaturedExpiry: date("trending_featured_expiry"),
}, (table) => [
	index("idx_internships_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_internships_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_internships_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_internships_timing").using("btree", table.timing.asc().nullsLast().op("text_ops")),
	index("idx_internships_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_internships_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const cohortOnboardingResponses = pgTable("cohort_onboarding_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	stream: text().notNull(),
	futureOptions: text("future_options").array().default([""]),
	customOptions: text("custom_options"),
	mentorId: uuid("mentor_id").notNull(),
	customAnswers: jsonb("custom_answers"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("cohort_onboarding_user_toolkit_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.toolkitId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "cohort_onboarding_responses_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "cohort_onboarding_responses_toolkit_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mentorId],
			foreignColumns: [mentors.id],
			name: "cohort_onboarding_responses_mentor_id_fkey"
		}).onDelete("cascade"),
]);

export const chatRooms = pgTable("chat_rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	userId: text("user_id").notNull(),
	mentorId: uuid("mentor_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("chat_rooms_toolkit_user_mentor_unique").using("btree", table.toolkitId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops"), table.mentorId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "chat_rooms_toolkit_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_rooms_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mentorId],
			foreignColumns: [mentors.id],
			name: "chat_rooms_mentor_id_fkey"
		}).onDelete("cascade"),
]);

export const ungatekeepBookmarks = pgTable("ungatekeep_bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	postId: uuid("post_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("ungatekeep_bookmarks_user_post_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ungatekeep_bookmarks_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [ungatekeepPosts.id],
			name: "ungatekeep_bookmarks_post_id_ungatekeep_posts_id_fk"
		}).onDelete("cascade"),
]);

export const userPreferences = pgTable("user_preferences", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	lastRepoOwner: text(),
	lastRepoName: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	pinnedRepos: jsonb().default([]).notNull(),
	pinnedProjects: jsonb().default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_preferences_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("user_preferences_userId_unique").on(table.userId),
]);

export const account = pgTable("account", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: text("account_id"),
	providerId: text("provider_id"),
	userId: text("user_id"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	provider: text(),
	providerAccountId: text(),
	tokenType: text("token_type"),
	sessionState: text("session_state"),
	expiresAt: integer("expires_at"),
}, (table) => [
	index("account_provider_providerAccountId_idx").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.providerAccountId.asc().nullsLast().op("text_ops")),
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_fkey"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roomId: uuid("room_id").notNull(),
	senderId: text("sender_id").notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [chatRooms.id],
			name: "chat_messages_room_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [user.id],
			name: "chat_messages_sender_id_fkey"
		}).onDelete("cascade"),
]);

export const mentorAvailability = pgTable("mentor_availability", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mentorId: uuid("mentor_id").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	isBooked: boolean("is_booked").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.mentorId],
			foreignColumns: [mentors.id],
			name: "mentor_availability_mentor_id_fkey"
		}).onDelete("cascade"),
]);

export const analyticsEvents = pgTable("analytics_events", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	eventType: text().notNull(),
	status: text().notNull(),
	sessionId: text(),
	repoOwner: text(),
	repoName: text(),
	label: text(),
	latencyMs: integer(),
	errorCode: text(),
	metadata: jsonb(),
	occurredAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("analytics_events_status_occurred_idx").using("btree", table.status.asc().nullsLast().op("text_ops"), table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	index("analytics_events_type_occurred_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops"), table.occurredAt.asc().nullsLast().op("text_ops")),
	index("analytics_events_user_occurred_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "analytics_events_userId_fkey"
		}).onDelete("cascade"),
]);

export const issueContentLogs = pgTable("issue_content_logs", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	generationRequestId: text(),
	repoOwner: text(),
	repoName: text(),
	label: text(),
	rawInput: text(),
	generatedTitle: text(),
	generatedBody: text(),
	finalTitle: text(),
	finalBody: text(),
	rawInputLength: integer(),
	generatedBodyLength: integer(),
	finalBodyLength: integer(),
	issueUrl: text(),
	issueNumber: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("issue_content_logs_generation_request_idx").using("btree", table.generationRequestId.asc().nullsLast().op("text_ops")),
	index("issue_content_logs_repo_created_idx").using("btree", table.repoOwner.asc().nullsLast().op("text_ops"), table.repoName.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("issue_content_logs_user_created_idx").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "issue_content_logs_userId_fkey"
		}).onDelete("cascade"),
]);

export const mentorMeets = pgTable("mentor_meets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	availabilityId: uuid("availability_id").notNull(),
	userId: text("user_id").notNull(),
	mentorId: uuid("mentor_id").notNull(),
	toolkitId: uuid("toolkit_id").notNull(),
	meetLink: text("meet_link"),
	status: text().default('scheduled'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.availabilityId],
			foreignColumns: [mentorAvailability.id],
			name: "mentor_meets_availability_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "mentor_meets_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mentorId],
			foreignColumns: [mentors.id],
			name: "mentor_meets_mentor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toolkitId],
			foreignColumns: [toolkits.id],
			name: "mentor_meets_toolkit_id_fkey"
		}).onDelete("cascade"),
]);

export const cohortFeatures = pgTable("cohort_features", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cohortId: uuid("cohort_id"),
	icon: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cohortId],
			foreignColumns: [cohorts.id],
			name: "cohort_features_cohort_id_fkey"
		}).onDelete("cascade"),
]);

export const banners = pgTable("banners", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	subtitle: text(),
	background: text(),
	imageUrl: text("image_url"),
	link: text(),
	priority: integer().default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const trackerEvents = pgTable("tracker_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	type: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("tracker_events_user_title_date_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.title.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "tracker_events_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const cohortOrders = pgTable("cohort_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cohortId: uuid("cohort_id"),
	userId: text("user_id"),
	buyerName: text("buyer_name").notNull(),
	buyerEmail: text("buyer_email").notNull(),
	buyerPhone: text("buyer_phone"),
	selectedTierId: uuid("selected_tier_id"),
	selectedAddonIds: jsonb("selected_addon_ids").default([]),
	amountPaid: integer("amount_paid").notNull(),
	razorpayOrderId: text("razorpay_order_id").notNull(),
	razorpayPaymentId: text("razorpay_payment_id"),
	status: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	couponId: uuid("coupon_id"),
	selectedToolkitIds: jsonb("selected_toolkit_ids").default([]),
}, (table) => [
	foreignKey({
			columns: [table.cohortId],
			foreignColumns: [cohorts.id],
			name: "cohort_orders_cohort_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "cohort_orders_user_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.selectedTierId],
			foreignColumns: [cohortTiers.id],
			name: "cohort_orders_selected_tier_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupons.id],
			name: "cohort_orders_coupon_id_fkey"
		}).onDelete("set null"),
]);

export const onboardingSurveyResponses = pgTable("onboarding_survey_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	source: onboardingTrafficSource().notNull(),
	sourceOther: text("source_other"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("onboarding_survey_responses_user_id_unique").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "onboarding_survey_responses_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const trackerItems = pgTable("tracker_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	oppId: text("opp_id").notNull(),
	kind: text().default('internship'),
	status: text().notNull(),
	notes: text(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	appliedAt: timestamp("applied_at", { mode: 'string' }),
	result: text(),
	isManual: boolean("is_manual").default(false),
	manualData: text("manual_data"),
	calendarEventId: text("calendar_event_id"),
	calendarEventSyncedAt: timestamp("calendar_event_synced_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("tracker_items_user_kind_opp_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.kind.asc().nullsLast().op("text_ops"), table.oppId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "tracker_items_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const cohortAddons = pgTable("cohort_addons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cohortId: uuid("cohort_id"),
	name: text().notNull(),
	priceDelta: integer("price_delta").notNull(),
	description: text().notNull(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cohortId],
			foreignColumns: [cohorts.id],
			name: "cohort_addons_cohort_id_fkey"
		}).onDelete("cascade"),
]);

export const cohortTiers = pgTable("cohort_tiers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cohortId: uuid("cohort_id"),
	name: text().notNull(),
	price: integer().notNull(),
	description: text().notNull(),
	whatIncluded: jsonb("what_included").default([]),
	isDefault: boolean("is_default").default(false),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	originalPrice: integer("original_price"),
}, (table) => [
	foreignKey({
			columns: [table.cohortId],
			foreignColumns: [cohorts.id],
			name: "cohort_tiers_cohort_id_fkey"
		}).onDelete("cascade"),
]);

export const cohortSessions = pgTable("cohort_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cohortId: uuid("cohort_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cohortId],
			foreignColumns: [cohorts.id],
			name: "cohort_sessions_cohort_id_cohorts_id_fk"
		}).onDelete("cascade"),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
]);

export const authenticator = pgTable("authenticator", {
	credentialId: text().notNull(),
	userId: text().notNull(),
	providerAccountId: text().notNull(),
	credentialPublicKey: text().notNull(),
	counter: integer().notNull(),
	credentialDeviceType: text().notNull(),
	credentialBackedUp: integer().notNull(),
	transports: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "authenticator_userId_user_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.credentialId, table.userId], name: "authenticator_userId_credentialID_pk"}),
	unique("authenticator_credentialID_unique").on(table.credentialId),
]);
