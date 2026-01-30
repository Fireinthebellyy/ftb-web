import { relations } from "drizzle-orm/relations";
import { user, session, mentors, account, newsletterSubscribers, userToolkitProgress, toolkits, toolkitContentItems, ungatekeepPosts, comments, opportunities, userOnboardingProfiles, internships } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	mentors: many(mentors),
	accounts: many(account),
	newsletterSubscribers: many(newsletterSubscribers),
	userToolkitProgresses: many(userToolkitProgress),
	ungatekeepPosts: many(ungatekeepPosts),
	comments: many(comments),
	opportunities: many(opportunities),
	userOnboardingProfiles: many(userOnboardingProfiles),
	internships: many(internships),
}));

export const mentorsRelations = relations(mentors, ({one}) => ({
	user: one(user, {
		fields: [mentors.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const newsletterSubscribersRelations = relations(newsletterSubscribers, ({one}) => ({
	user: one(user, {
		fields: [newsletterSubscribers.userId],
		references: [user.id]
	}),
}));

export const userToolkitProgressRelations = relations(userToolkitProgress, ({one}) => ({
	user: one(user, {
		fields: [userToolkitProgress.userId],
		references: [user.id]
	}),
	toolkit: one(toolkits, {
		fields: [userToolkitProgress.toolkitId],
		references: [toolkits.id]
	}),
	toolkitContentItem: one(toolkitContentItems, {
		fields: [userToolkitProgress.contentItemId],
		references: [toolkitContentItems.id]
	}),
}));

export const toolkitsRelations = relations(toolkits, ({many}) => ({
	userToolkitProgresses: many(userToolkitProgress),
	toolkitContentItems: many(toolkitContentItems),
}));

export const toolkitContentItemsRelations = relations(toolkitContentItems, ({one, many}) => ({
	userToolkitProgresses: many(userToolkitProgress),
	toolkit: one(toolkits, {
		fields: [toolkitContentItems.toolkitId],
		references: [toolkits.id]
	}),
}));

export const ungatekeepPostsRelations = relations(ungatekeepPosts, ({one}) => ({
	user: one(user, {
		fields: [ungatekeepPosts.userId],
		references: [user.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	user: one(user, {
		fields: [comments.userId],
		references: [user.id]
	}),
	opportunity: one(opportunities, {
		fields: [comments.opportunityId],
		references: [opportunities.id]
	}),
}));

export const opportunitiesRelations = relations(opportunities, ({one, many}) => ({
	comments: many(comments),
	user: one(user, {
		fields: [opportunities.userId],
		references: [user.id]
	}),
}));

export const userOnboardingProfilesRelations = relations(userOnboardingProfiles, ({one}) => ({
	user: one(user, {
		fields: [userOnboardingProfiles.userId],
		references: [user.id]
	}),
}));

export const internshipsRelations = relations(internships, ({one}) => ({
	user: one(user, {
		fields: [internships.userId],
		references: [user.id]
	}),
}));