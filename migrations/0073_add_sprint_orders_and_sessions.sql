-- Create sprint_upgrade_plans if not exists
CREATE TABLE IF NOT EXISTS "sprint_upgrade_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_id" uuid NOT NULL REFERENCES "sprints"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text,
	"section_label" text,
	"price" integer NOT NULL,
	"original_price" integer,
	"is_all_in_one" boolean DEFAULT false NOT NULL,
	"included_session_count" integer,
	"included_session_ids" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create user_sprint_target_plans if not exists
CREATE TABLE IF NOT EXISTS "user_sprint_target_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"sprint_id" uuid NOT NULL REFERENCES "sprints"("id") ON DELETE CASCADE,
	"plan_id" uuid NOT NULL REFERENCES "sprint_upgrade_plans"("id") ON DELETE CASCADE,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sprint_target_plans_user_sprint_plan_unique" UNIQUE("user_id", "sprint_id", "plan_id")
);

-- Create sprint_orders if not exists
CREATE TABLE IF NOT EXISTS "sprint_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_id" uuid REFERENCES "sprints"("id") ON DELETE CASCADE,
	"user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"buddy_email" text,
	"selected_tier_id" uuid REFERENCES "sprint_tiers"("id") ON DELETE SET NULL,
	"selected_upgrade_plan_id" uuid REFERENCES "sprint_upgrade_plans"("id") ON DELETE RESTRICT,
	"selected_addon_ids" jsonb DEFAULT '[]'::jsonb,
	"selected_toolkit_ids" jsonb DEFAULT '[]'::jsonb,
	"selected_session_ids" jsonb DEFAULT '[]'::jsonb,
	"amount_paid" integer NOT NULL,
	"coupon_id" uuid REFERENCES "coupons"("id") ON DELETE SET NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"status" text NOT NULL,
	"registration_name" text,
	"registration_college" text,
	"registration_course" text,
	"registration_year" text,
	"registration_expectations" text,
	"registration_completed_at" timestamp,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

-- Create sprint_sessions if not exists
CREATE TABLE IF NOT EXISTS "sprint_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_id" uuid NOT NULL REFERENCES "sprints"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text,
	"price" integer,
	"original_price" integer,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_in_dashboard" boolean DEFAULT true NOT NULL,
	"show_in_home" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create sprint_session_contents if not exists
CREATE TABLE IF NOT EXISTS "sprint_session_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL REFERENCES "sprint_sessions"("id") ON DELETE CASCADE,
	"section_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"locked_message" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"live_session_link" text,
	"video_url" text,
	"images" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create sprint_session_resources if not exists
CREATE TABLE IF NOT EXISTS "sprint_session_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL REFERENCES "sprint_session_contents"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'file',
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Create sprint_session_queries if not exists
CREATE TABLE IF NOT EXISTS "sprint_session_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL REFERENCES "sprint_sessions"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"question" text NOT NULL,
	"answer" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create sprint_session_mentors if not exists
CREATE TABLE IF NOT EXISTS "sprint_session_mentors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL REFERENCES "sprint_session_contents"("id") ON DELETE CASCADE,
	"sprint_mentor_id" uuid REFERENCES "sprint_mentors"("id") ON DELETE SET NULL,
	"name" text,
	"role" text,
	"image_url" text,
	"bio" text,
	"linkedin_url" text,
	"other_links" jsonb DEFAULT '[]'::jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
