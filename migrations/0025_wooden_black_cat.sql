CREATE TYPE "public"."internship_timing" AS ENUM('full-time', 'part-time', 'shift-based');--> statement-breakpoint
CREATE TYPE "public"."internship_type" AS ENUM('in-office', 'work-from-home', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."toolkit_content_item_type" AS ENUM('article', 'video');--> statement-breakpoint
CREATE TYPE "public"."ungatekeep_tag" AS ENUM('announcement', 'company_experience', 'resources');--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"discount_amount" integer NOT NULL,
	"max_uses" integer,
	"max_uses_per_user" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "internship_type" NOT NULL,
	"timing" "internship_timing" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"link" text,
	"poster" text NOT NULL,
	"tag_ids" uuid[] DEFAULT '{}',
	"location" text,
	"deadline" date,
	"stipend" integer,
	"hiring_organization" text NOT NULL,
	"hiring_manager" text,
	"hiring_manager_email" text,
	"experience" text,
	"duration" text,
	"eligibility" text[] DEFAULT '{}',
	"is_flagged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"application_count" integer DEFAULT 0,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"is_subscribed" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "toolkit_content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"toolkit_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "toolkit_content_item_type" NOT NULL,
	"content" text,
	"bunny_video_url" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ungatekeep_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"link_url" text,
	"link_title" text,
	"link_image" text,
	"tag" "ungatekeep_tag",
	"is_pinned" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_toolkit_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"toolkit_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "toolkits" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "original_price" integer;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "highlights" text[];--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "total_duration" text;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "lesson_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "show_sale_badge" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_toolkits" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolkit_content_items" ADD CONSTRAINT "toolkit_content_items_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "public"."toolkits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD CONSTRAINT "ungatekeep_posts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_toolkit_progress" ADD CONSTRAINT "user_toolkit_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_toolkit_progress" ADD CONSTRAINT "user_toolkit_progress_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "public"."toolkits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_toolkit_progress" ADD CONSTRAINT "user_toolkit_progress_content_item_id_toolkit_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."toolkit_content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_unique" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_content_item_unique" ON "user_toolkit_progress" USING btree ("user_id","content_item_id");--> statement-breakpoint
ALTER TABLE "user_toolkits" ADD CONSTRAINT "user_toolkits_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;