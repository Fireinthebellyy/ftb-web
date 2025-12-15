CREATE TYPE "public"."persona_type" AS ENUM('student', 'society');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mood" integer NOT NULL,
	"meaning" text NOT NULL,
	"message" text,
	"path" text,
	"user_agent" text,
	"user_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"opportunity_link" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toolkits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"cover_image_url" text,
	"video_url" text,
	"content_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "user_toolkits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"toolkit_id" uuid NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"payment_id" text,
	"payment_status" text,
	"amount_paid" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"feedback" text,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "opportunities" RENAME COLUMN "tags" TO "tag_ids";--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."opportunity_type";--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('hackathon', 'grant', 'competition', 'ideathon');--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE "public"."opportunity_type" USING "type"::"public"."opportunity_type";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'member', 'admin');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "upvoter_ids" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "upvote_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "field_interests" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "opportunity_interests" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "college_institute" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "contact_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "current_role" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolkits" ADD CONSTRAINT "toolkits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_onboarding_profiles" ADD CONSTRAINT "user_onboarding_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_toolkits" ADD CONSTRAINT "user_toolkits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_toolkits" ADD CONSTRAINT "user_toolkits_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "public"."toolkits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_opportunity_unique" ON "bookmarks" USING btree ("user_id","opportunity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_onboarding_profiles_user_id_unique" ON "user_onboarding_profiles" USING btree ("user_id");