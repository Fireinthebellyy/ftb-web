CREATE TABLE "cohort_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid,
	"name" text NOT NULL,
	"price_delta" integer NOT NULL,
	"description" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cohort_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid,
	"icon" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cohort_mentors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"image_url" text,
	"bio" text,
	"link" text,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cohort_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid,
	"user_id" text,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"buddy_email" text,
	"selected_tier_id" uuid,
	"selected_addon_ids" jsonb DEFAULT '[]'::jsonb,
	"selected_toolkit_ids" jsonb DEFAULT '[]'::jsonb,
	"amount_paid" integer NOT NULL,
	"coupon_id" uuid,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cohort_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price_delta" integer DEFAULT 0,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cohort_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"original_price" integer,
	"description" text NOT NULL,
	"what_included" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"badge1" text,
	"badge2" text,
	"subtitle" text,
	"cover_image_url" text,
	"card_image_url" text,
	"start_date" text,
	"highlights" text[],
	"mentors_heading" text DEFAULT 'Meet Your Mentors',
	"mentors_link_target" text,
	"mentors_limit" integer DEFAULT 4,
	"features_heading" text DEFAULT 'What You Get',
	"investment_label" text DEFAULT 'Total Investment',
	"base_price" integer NOT NULL,
	"original_price" integer,
	"toolkit_id" uuid,
	"is_active" boolean DEFAULT true,
	"is_best_seller" boolean DEFAULT false,
	"is_filling_fast" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cohorts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "toolkit_testimonial_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mentors" ALTER COLUMN "mentor_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "linkedin_link" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "github_link" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "insta_link" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "custom_link" text;--> statement-breakpoint
ALTER TABLE "mentorship_carousel_slides" ADD COLUMN "mobile_image_url" text;--> statement-breakpoint
ALTER TABLE "mentorship_carousel_slides" ADD COLUMN "desktop_image_url" text;--> statement-breakpoint
ALTER TABLE "cohort_addons" ADD CONSTRAINT "cohort_addons_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_features" ADD CONSTRAINT "cohort_features_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_mentors" ADD CONSTRAINT "cohort_mentors_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_orders" ADD CONSTRAINT "cohort_orders_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_orders" ADD CONSTRAINT "cohort_orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_orders" ADD CONSTRAINT "cohort_orders_selected_tier_id_cohort_tiers_id_fk" FOREIGN KEY ("selected_tier_id") REFERENCES "public"."cohort_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_orders" ADD CONSTRAINT "cohort_orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_sessions" ADD CONSTRAINT "cohort_sessions_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_tiers" ADD CONSTRAINT "cohort_tiers_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "public"."toolkits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" DROP COLUMN "cal_link";--> statement-breakpoint
ALTER TABLE "mentorship_carousel_slides" DROP COLUMN "image_url";