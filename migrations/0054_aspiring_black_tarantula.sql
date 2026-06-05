CREATE TABLE "digital_product_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "toolkit_community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"toolkit_id" uuid NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"options" jsonb DEFAULT '[]'::jsonb,
	"attachment_url" text,
	"attachment_name" text,
	"attachment_type" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "toolkit_community_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"selected_option_index" integer,
	"text_response" text,
	"attachment_url" text,
	"attachment_name" text,
	"attachment_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "link" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "summary" text[];--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "mentorship_details" jsonb;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "rating" text;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "subtitle" text;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "is_bundle" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "bundle_items" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "is_best_seller" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "is_limited_seats" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "toolkits" ADD COLUMN "digital_product_section_id" uuid;--> statement-breakpoint
ALTER TABLE "toolkit_community_posts" ADD CONSTRAINT "toolkit_community_posts_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "public"."toolkits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolkit_community_responses" ADD CONSTRAINT "toolkit_community_responses_post_id_toolkit_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."toolkit_community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolkit_community_responses" ADD CONSTRAINT "toolkit_community_responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "toolkit_community_responses_post_user_unique" ON "toolkit_community_responses" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "toolkit_community_responses_post_id_idx" ON "toolkit_community_responses" USING btree ("post_id");--> statement-breakpoint
ALTER TABLE "toolkits" ADD CONSTRAINT "toolkits_digital_product_section_id_digital_product_sections_id_fk" FOREIGN KEY ("digital_product_section_id") REFERENCES "public"."digital_product_sections"("id") ON DELETE set null ON UPDATE no action;