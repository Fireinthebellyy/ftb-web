ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "buddy_offer_title" text DEFAULT 'Friendship Day Offer';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "buddy_offer_text" text DEFAULT 'Learning is better together! Enter your friend''s email below so they can get access that too at 20% off';
