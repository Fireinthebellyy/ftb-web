ALTER TABLE "coupons" ADD COLUMN "discount_type" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "is_trending" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "is_featured_home" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "display_index" integer;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "trending_index" integer;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "featured_home_index" integer;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "is_featured_home" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "is_trending" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "trending_index" integer;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "featured_home_index" integer;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "is_trending" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "is_featured_home" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "trending_index" integer;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "featured_home_index" integer;--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD COLUMN "is_trending" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD COLUMN "is_featured_home" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD COLUMN "trending_index" integer;--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD COLUMN "featured_home_index" integer;