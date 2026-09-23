ALTER TABLE sprints
    ADD COLUMN IF NOT EXISTS outer_subtitle TEXT;

ALTER TABLE sprints
    RENAME COLUMN subtitle TO inner_subtitle;