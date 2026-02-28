ALTER TABLE "user"
ADD COLUMN "calendar_reminder_week" boolean DEFAULT true,
ADD COLUMN "calendar_reminder_day" boolean DEFAULT true,
ADD COLUMN "calendar_reminder_hour" boolean DEFAULT true;
