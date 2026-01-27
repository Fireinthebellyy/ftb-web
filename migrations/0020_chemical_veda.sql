CREATE TYPE "public"."persona_type" AS ENUM('student', 'society');--> statement-breakpoint
CREATE TABLE "user_onboarding_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"persona" "persona_type" NOT NULL,
	"location_type" text,
	"location_value" text,
	"education_level" text,
	"field_of_study" text,
	"field_other" text,
	"opportunity_interests" text[] DEFAULT '{}',
	"domain_preferences" text[] DEFAULT '{}',
	"struggles" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_onboarding_profiles" ADD CONSTRAINT "user_onboarding_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_onboarding_profiles_user_id_unique" ON "user_onboarding_profiles" USING btree ("user_id");