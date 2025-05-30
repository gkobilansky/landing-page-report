-- Remove UNIQUE constraint to allow multiple analyses per URL (Option 2 caching)
-- This enables historical tracking of analyses over time

-- Drop the unique constraint that prevents multiple analyses for same user/URL
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_user_id_url_key;

-- Add comment explaining the change
COMMENT ON TABLE analyses IS 'Option 2 caching: Allows multiple analyses per URL for historical tracking. Cache logic handled in application layer based on created_at timestamps.';