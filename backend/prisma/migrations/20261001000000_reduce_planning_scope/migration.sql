-- Remove obsolete completion targets. Existing module roadmaps remain intact.
ALTER TABLE "course_plans" DROP COLUMN "graduation_requirements";
ALTER TABLE "indexes"
    DROP COLUMN "vacancy",
    DROP COLUMN "waitlist",
    DROP COLUMN "last_vacancy_check_at";

-- Keep only supported UI preferences in existing profiles.
UPDATE "users"
SET "settings" = COALESCE((
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(CASE WHEN jsonb_typeof("settings") = 'object' THEN "settings" ELSE '{}'::jsonb END)
    WHERE key IN ('themeColor', 'theme', 'language', 'defaultSemester', 'preferences')
), '{}'::jsonb);
