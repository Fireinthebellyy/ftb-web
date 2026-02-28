CREATE TYPE "public"."onboarding_traffic_source" AS ENUM(
  'instagram',
  'reddit',
  'youtube',
  'x_twitter',
  'linkedin',
  'chatgpt',
  'google_search',
  'whatsapp_group',
  'friend_or_senior',
  'campus_event',
  'other'
);
--> statement-breakpoint
CREATE TABLE "onboarding_survey_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "source" "onboarding_traffic_source" NOT NULL,
  "source_other" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "onboarding_survey_responses" ADD CONSTRAINT "onboarding_survey_responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_survey_responses_user_id_unique" ON "onboarding_survey_responses" USING btree ("user_id");
