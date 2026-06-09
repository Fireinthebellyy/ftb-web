CREATE TABLE IF NOT EXISTS "digital_product_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "order_index" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "toolkits"
  ADD COLUMN IF NOT EXISTS "digital_product_section_id" uuid;

DO $$ BEGIN
 ALTER TABLE "toolkits"
  ADD CONSTRAINT "toolkits_digital_product_section_id_digital_product_sections_id_fk"
  FOREIGN KEY ("digital_product_section_id")
  REFERENCES "public"."digital_product_sections"("id")
  ON DELETE set null
  ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
