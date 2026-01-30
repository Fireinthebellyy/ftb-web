-- Create coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
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

-- Add coupon_id column to user_toolkits table
ALTER TABLE "user_toolkits" ADD COLUMN IF NOT EXISTS "coupon_id" uuid;

-- Add foreign key constraint
ALTER TABLE "user_toolkits" 
ADD CONSTRAINT "user_toolkits_coupon_id_coupons_id_fk" 
FOREIGN KEY ("coupon_id") 
REFERENCES "public"."coupons"("id") 
ON DELETE set null 
ON UPDATE no action;
