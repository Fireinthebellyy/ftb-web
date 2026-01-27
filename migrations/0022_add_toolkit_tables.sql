-- Migration to add toolkit tables only, avoiding enum type conflicts
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

ALTER TABLE "toolkits" ADD CONSTRAINT "toolkits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "user_toolkits" ADD CONSTRAINT "user_toolkits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "user_toolkits" ADD CONSTRAINT "user_toolkits_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "toolkits"("id") ON DELETE cascade ON UPDATE no action;
