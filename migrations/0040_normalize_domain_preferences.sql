-- Migration to normalize domain_preferences and field_interests in user and user_onboarding_profiles tables

-- Function to map legacy domain values to new values
CREATE OR REPLACE FUNCTION normalize_domain_preference(domain text) RETURNS text AS $$
BEGIN
    RETURN CASE
        WHEN domain IN ('AI & ML', 'AI/ML', 'Web / App Dev', 'Web Development', 'App Development', 'Blockchain', 'Cybersecurity', 'Data Science', 'Open Source') THEN 'Tech & Data'
        WHEN domain IN ('Finance & Markets', 'Entrepreneurship') THEN 'Startup & Finance'
        WHEN domain IN ('Marketing', 'Design', 'Design/UI-UX') THEN 'Creative & Content'
        WHEN domain IN ('Consulting', 'Product Management', 'Product') THEN 'Business, Management & Consulting'
        WHEN domain = 'Social Impact' THEN 'Impact & Change'
        WHEN domain = 'Policy / Governance' THEN 'Law & Policy'
        WHEN domain = 'Psychology / Mental Health' THEN 'People & Mind'
        ELSE domain
    END;
END;
$$ LANGUAGE plpgsql;

-- Update user table (field_interests)
UPDATE "user"
SET field_interests = ARRAY(
    SELECT DISTINCT normalize_domain_preference(domain)
    FROM unnest(field_interests) AS domain
)
WHERE field_interests IS NOT NULL AND cardinality(field_interests) > 0;

-- Update user_onboarding_profiles table (domain_preferences)
UPDATE user_onboarding_profiles
SET domain_preferences = ARRAY(
    SELECT DISTINCT normalize_domain_preference(domain)
    FROM unnest(domain_preferences) AS domain
)
WHERE domain_preferences IS NOT NULL AND cardinality(domain_preferences) > 0;

-- Drop the helper function
DROP FUNCTION normalize_domain_preference(text);
