-- Migration to normalize opportunity_interests in user and user_onboarding_profiles tables

-- Function to map legacy values to new values
CREATE OR REPLACE FUNCTION normalize_opportunity_interest(interest text) RETURNS text AS $$
BEGIN
    RETURN CASE
        WHEN interest = 'Internships' THEN 'Fellowships'
        WHEN interest = 'Scholarships' THEN 'Grants & Scholarships'
        WHEN interest = 'Competitions' THEN 'Competitions/Open Calls'
        WHEN interest = 'Research programs' THEN 'Research Paper Conferences/RA calls'
        WHEN interest = 'Bootcamps' THEN 'Upskilling Courses/Certification/Events'
        ELSE interest
    END;
END;
$$ LANGUAGE plpgsql;

-- Update user table
UPDATE "user"
SET opportunity_interests = ARRAY(
    SELECT DISTINCT normalize_opportunity_interest(interest)
    FROM unnest(opportunity_interests) AS interest
)
WHERE opportunity_interests IS NOT NULL AND cardinality(opportunity_interests) > 0;

-- Update user_onboarding_profiles table
UPDATE user_onboarding_profiles
SET opportunity_interests = ARRAY(
    SELECT DISTINCT normalize_opportunity_interest(interest)
    FROM unnest(opportunity_interests) AS interest
)
WHERE opportunity_interests IS NOT NULL AND cardinality(opportunity_interests) > 0;

-- Drop the helper function
DROP FUNCTION normalize_opportunity_interest(text);
