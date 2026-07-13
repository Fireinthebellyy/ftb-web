import { relations } from "drizzle-orm/relations";
import { user, ungatekeepComments, ungatekeepPosts, ungatekeepPostVotes, coupons, userToolkits, adminActivityLogs, toolkits, toolkitCommunityPosts, cohorts, cohortMentors, toolkitCommunityResponses, userToolkitProgress, toolkitContentItems, digitalProductSections, opportunities, comments, session, cohortOnboardingResponses, mentors, chatRooms, ungatekeepBookmarks, userPreferences, account, chatMessages, mentorAvailability, analyticsEvents, issueContentLogs, mentorMeets, cohortFeatures, trackerEvents, cohortOrders, cohortTiers, onboardingSurveyResponses, trackerItems, cohortAddons, cohortSessions, authenticator } from "./schema";

export const ungatekeepCommentsRelations = relations(ungatekeepComments, ({one}) => ({
	user: one(user, {
		fields: [ungatekeepComments.userId],
		references: [user.id]
	}),
	ungatekeepPost: one(ungatekeepPosts, {
		fields: [ungatekeepComments.postId],
		references: [ungatekeepPosts.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	ungatekeepComments: many(ungatekeepComments),
	ungatekeepPostVotes: many(ungatekeepPostVotes),
	adminActivityLogs: many(adminActivityLogs),
	toolkitCommunityResponses: many(toolkitCommunityResponses),
	sessions: many(session),
	cohortOnboardingResponses: many(cohortOnboardingResponses),
	chatRooms: many(chatRooms),
	ungatekeepBookmarks: many(ungatekeepBookmarks),
	userPreferences: many(userPreferences),
	accounts: many(account),
	chatMessages: many(chatMessages),
	analyticsEvents: many(analyticsEvents),
	issueContentLogs: many(issueContentLogs),
	mentorMeets: many(mentorMeets),
	trackerEvents: many(trackerEvents),
	cohortOrders: many(cohortOrders),
	onboardingSurveyResponses: many(onboardingSurveyResponses),
	trackerItems: many(trackerItems),
	authenticators: many(authenticator),
}));

export const ungatekeepPostsRelations = relations(ungatekeepPosts, ({one, many}) => ({
	ungatekeepComments: many(ungatekeepComments),
	ungatekeepPostVotes: many(ungatekeepPostVotes),
	toolkit: one(toolkits, {
		fields: [ungatekeepPosts.toolkitId],
		references: [toolkits.id]
	}),
	ungatekeepBookmarks: many(ungatekeepBookmarks),
}));

export const ungatekeepPostVotesRelations = relations(ungatekeepPostVotes, ({one}) => ({
	user: one(user, {
		fields: [ungatekeepPostVotes.userId],
		references: [user.id]
	}),
	ungatekeepPost: one(ungatekeepPosts, {
		fields: [ungatekeepPostVotes.postId],
		references: [ungatekeepPosts.id]
	}),
}));

export const userToolkitsRelations = relations(userToolkits, ({one}) => ({
	coupon: one(coupons, {
		fields: [userToolkits.couponId],
		references: [coupons.id]
	}),
}));

export const couponsRelations = relations(coupons, ({many}) => ({
	userToolkits: many(userToolkits),
	cohortOrders: many(cohortOrders),
}));

export const adminActivityLogsRelations = relations(adminActivityLogs, ({one}) => ({
	user: one(user, {
		fields: [adminActivityLogs.adminUserId],
		references: [user.id]
	}),
}));

export const toolkitsRelations = relations(toolkits, ({one, many}) => ({
	ungatekeepPosts: many(ungatekeepPosts),
	toolkitCommunityPosts: many(toolkitCommunityPosts),
	cohorts: many(cohorts),
	userToolkitProgresses: many(userToolkitProgress),
	toolkitContentItems: many(toolkitContentItems),
	digitalProductSection: one(digitalProductSections, {
		fields: [toolkits.digitalProductSectionId],
		references: [digitalProductSections.id]
	}),
	cohortOnboardingResponses: many(cohortOnboardingResponses),
	chatRooms: many(chatRooms),
	mentorMeets: many(mentorMeets),
}));

export const toolkitCommunityPostsRelations = relations(toolkitCommunityPosts, ({one, many}) => ({
	toolkit: one(toolkits, {
		fields: [toolkitCommunityPosts.toolkitId],
		references: [toolkits.id]
	}),
	toolkitCommunityResponses: many(toolkitCommunityResponses),
}));

export const cohortsRelations = relations(cohorts, ({one, many}) => ({
	toolkit: one(toolkits, {
		fields: [cohorts.toolkitId],
		references: [toolkits.id]
	}),
	cohortMentors: many(cohortMentors),
	cohortFeatures: many(cohortFeatures),
	cohortOrders: many(cohortOrders),
	cohortAddons: many(cohortAddons),
	cohortTiers: many(cohortTiers),
	cohortSessions: many(cohortSessions),
}));

export const cohortMentorsRelations = relations(cohortMentors, ({one}) => ({
	cohort: one(cohorts, {
		fields: [cohortMentors.cohortId],
		references: [cohorts.id]
	}),
}));

export const toolkitCommunityResponsesRelations = relations(toolkitCommunityResponses, ({one}) => ({
	toolkitCommunityPost: one(toolkitCommunityPosts, {
		fields: [toolkitCommunityResponses.postId],
		references: [toolkitCommunityPosts.id]
	}),
	user: one(user, {
		fields: [toolkitCommunityResponses.userId],
		references: [user.id]
	}),
}));

export const userToolkitProgressRelations = relations(userToolkitProgress, ({one}) => ({
	toolkit: one(toolkits, {
		fields: [userToolkitProgress.toolkitId],
		references: [toolkits.id]
	}),
	toolkitContentItem: one(toolkitContentItems, {
		fields: [userToolkitProgress.contentItemId],
		references: [toolkitContentItems.id]
	}),
}));

export const toolkitContentItemsRelations = relations(toolkitContentItems, ({one, many}) => ({
	userToolkitProgresses: many(userToolkitProgress),
	toolkit: one(toolkits, {
		fields: [toolkitContentItems.toolkitId],
		references: [toolkits.id]
	}),
}));

export const digitalProductSectionsRelations = relations(digitalProductSections, ({many}) => ({
	toolkits: many(toolkits),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	opportunity: one(opportunities, {
		fields: [comments.opportunityId],
		references: [opportunities.id]
	}),
}));

export const opportunitiesRelations = relations(opportunities, ({many}) => ({
	comments: many(comments),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const cohortOnboardingResponsesRelations = relations(cohortOnboardingResponses, ({one}) => ({
	user: one(user, {
		fields: [cohortOnboardingResponses.userId],
		references: [user.id]
	}),
	toolkit: one(toolkits, {
		fields: [cohortOnboardingResponses.toolkitId],
		references: [toolkits.id]
	}),
	mentor: one(mentors, {
		fields: [cohortOnboardingResponses.mentorId],
		references: [mentors.id]
	}),
}));

export const mentorsRelations = relations(mentors, ({many}) => ({
	cohortOnboardingResponses: many(cohortOnboardingResponses),
	chatRooms: many(chatRooms),
	mentorAvailabilities: many(mentorAvailability),
	mentorMeets: many(mentorMeets),
}));

export const chatRoomsRelations = relations(chatRooms, ({one, many}) => ({
	toolkit: one(toolkits, {
		fields: [chatRooms.toolkitId],
		references: [toolkits.id]
	}),
	user: one(user, {
		fields: [chatRooms.userId],
		references: [user.id]
	}),
	mentor: one(mentors, {
		fields: [chatRooms.mentorId],
		references: [mentors.id]
	}),
	chatMessages: many(chatMessages),
}));

export const ungatekeepBookmarksRelations = relations(ungatekeepBookmarks, ({one}) => ({
	user: one(user, {
		fields: [ungatekeepBookmarks.userId],
		references: [user.id]
	}),
	ungatekeepPost: one(ungatekeepPosts, {
		fields: [ungatekeepBookmarks.postId],
		references: [ungatekeepPosts.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(user, {
		fields: [userPreferences.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatRoom: one(chatRooms, {
		fields: [chatMessages.roomId],
		references: [chatRooms.id]
	}),
	user: one(user, {
		fields: [chatMessages.senderId],
		references: [user.id]
	}),
}));

export const mentorAvailabilityRelations = relations(mentorAvailability, ({one, many}) => ({
	mentor: one(mentors, {
		fields: [mentorAvailability.mentorId],
		references: [mentors.id]
	}),
	mentorMeets: many(mentorMeets),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({one}) => ({
	user: one(user, {
		fields: [analyticsEvents.userId],
		references: [user.id]
	}),
}));

export const issueContentLogsRelations = relations(issueContentLogs, ({one}) => ({
	user: one(user, {
		fields: [issueContentLogs.userId],
		references: [user.id]
	}),
}));

export const mentorMeetsRelations = relations(mentorMeets, ({one}) => ({
	mentorAvailability: one(mentorAvailability, {
		fields: [mentorMeets.availabilityId],
		references: [mentorAvailability.id]
	}),
	user: one(user, {
		fields: [mentorMeets.userId],
		references: [user.id]
	}),
	mentor: one(mentors, {
		fields: [mentorMeets.mentorId],
		references: [mentors.id]
	}),
	toolkit: one(toolkits, {
		fields: [mentorMeets.toolkitId],
		references: [toolkits.id]
	}),
}));

export const cohortFeaturesRelations = relations(cohortFeatures, ({one}) => ({
	cohort: one(cohorts, {
		fields: [cohortFeatures.cohortId],
		references: [cohorts.id]
	}),
}));

export const trackerEventsRelations = relations(trackerEvents, ({one}) => ({
	user: one(user, {
		fields: [trackerEvents.userId],
		references: [user.id]
	}),
}));

export const cohortOrdersRelations = relations(cohortOrders, ({one}) => ({
	cohort: one(cohorts, {
		fields: [cohortOrders.cohortId],
		references: [cohorts.id]
	}),
	user: one(user, {
		fields: [cohortOrders.userId],
		references: [user.id]
	}),
	cohortTier: one(cohortTiers, {
		fields: [cohortOrders.selectedTierId],
		references: [cohortTiers.id]
	}),
	coupon: one(coupons, {
		fields: [cohortOrders.couponId],
		references: [coupons.id]
	}),
}));

export const cohortTiersRelations = relations(cohortTiers, ({one, many}) => ({
	cohortOrders: many(cohortOrders),
	cohort: one(cohorts, {
		fields: [cohortTiers.cohortId],
		references: [cohorts.id]
	}),
}));

export const onboardingSurveyResponsesRelations = relations(onboardingSurveyResponses, ({one}) => ({
	user: one(user, {
		fields: [onboardingSurveyResponses.userId],
		references: [user.id]
	}),
}));

export const trackerItemsRelations = relations(trackerItems, ({one}) => ({
	user: one(user, {
		fields: [trackerItems.userId],
		references: [user.id]
	}),
}));

export const cohortAddonsRelations = relations(cohortAddons, ({one}) => ({
	cohort: one(cohorts, {
		fields: [cohortAddons.cohortId],
		references: [cohorts.id]
	}),
}));

export const cohortSessionsRelations = relations(cohortSessions, ({one}) => ({
	cohort: one(cohorts, {
		fields: [cohortSessions.cohortId],
		references: [cohorts.id]
	}),
}));

export const authenticatorRelations = relations(authenticator, ({one}) => ({
	user: one(user, {
		fields: [authenticator.userId],
		references: [user.id]
	}),
}));