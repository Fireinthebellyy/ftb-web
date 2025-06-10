ALTER TABLE public.users
ADD COLUMN auth_id UUID REFERENCES neon_auth.users_sync(id);

ALTER TABLE public.users
ADD COLUMN display_name VARCHAR(255);

ALTER TABLE public.users
ADD COLUMN last_active_at_millis BIGINT;

ALTER TABLE public.users
ADD COLUMN primary_email_verified BOOLEAN;