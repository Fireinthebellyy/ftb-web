ALTER TABLE sprint_orders
ADD COLUMN IF NOT EXISTS registration_consent BOOLEAN,
ADD COLUMN IF NOT EXISTS registration_mobile_number TEXT,
ADD COLUMN IF NOT EXISTS registration_city TEXT;