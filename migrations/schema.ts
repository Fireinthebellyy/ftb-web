import { pgTable, uuid, text, timestamp, unique, boolean, date, foreignKey, integer, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const opportunityType = pgEnum("opportunity_type", ['hackathon', 'grant application', 'competition', 'ideathon'])
export const userRole = pgEnum("user_role", ['user', 'member', 'admin'])


export const bookmarks = pgTable("bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	opportunityId: uuid("opportunity_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const waitlist = pgTable("waitlist", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	feedback: text(),
}, (table) => [
	unique("waitlist_email_unique").on(table.email),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	role: text().default('user').notNull(),
	fieldInterests: text("field_interests").array().default([""]),
	opportunityInterests: text("opportunity_interests").array().default([""]),
	dateOfBirth: date("date_of_birth"),
	collegeInstitute: text("college_institute"),
	contactNumber: text("contact_number"),
	currentRole: text("current_role"),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const mentors = pgTable("mentors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mentorName: text("mentor_name").notNull(),
	mentorNumber: text("mentor_number"),
	mentorImage: text("mentor_image"),
	description: text(),
	mentorEmail: text("mentor_email").notNull(),
	isVerified: boolean("is_verified").default(false),
	tags: text().array().default([""]),
	calLink: text("cal_link"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	rating: integer(),
	availability: boolean().default(true),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "mentors_user_id_user_id_fk"
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

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
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
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "comments_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "comments_opportunity_id_opportunities_id_fk"
		}).onDelete("cascade"),
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
});

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

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
	type: text().default('hackathon').notNull(),
	upvoterIds: text("upvoter_ids").array().default([""]),
	upvoteCount: integer("upvote_count").default(0),
	tagIds: uuid("tag_ids").array().default([""]),
	tags: text().array().default([""]),
}, (table) => [
	index("opportunities_tag_ids_idx").using("gin", table.tagIds.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "opportunities_user_id_user_id_fk"
		}).onDelete("cascade"),
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
