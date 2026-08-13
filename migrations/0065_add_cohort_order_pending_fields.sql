-- Add pending fields for add-on purchases to cohort_orders table
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "pending_addon_ids" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "pending_toolkit_ids" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "pending_coupon_id" uuid REFERENCES "coupons"("id") ON DELETE SET NULL;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "pending_amount" integer;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "pending_razorpay_order_id" text;