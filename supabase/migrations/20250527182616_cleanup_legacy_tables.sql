-- Cleanup Legacy Tables Migration
-- Remove the old landing_page_analyses table and legacy view since we've migrated to the new schema

-- 1. Drop the legacy view first
DROP VIEW IF EXISTS legacy_landing_page_analyses;

-- 2. Drop the old table (it's empty anyway)
DROP TABLE IF EXISTS landing_page_analyses;

-- 3. Add any missing indexes or constraints that might be useful for the new schema
-- (These were implied but let's make them explicit)

-- Add constraint to ensure valid status values in analyses table
ALTER TABLE analyses 
ADD CONSTRAINT valid_analysis_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'queued'));

-- Add constraint to ensure valid grade values
ALTER TABLE analyses 
ADD CONSTRAINT valid_analysis_grade 
CHECK (grade IS NULL OR grade IN ('A', 'B', 'C', 'D', 'F'));

-- Add constraint to ensure analysis_duration_ms is positive when set
ALTER TABLE analyses 
ADD CONSTRAINT positive_analysis_duration 
CHECK (analysis_duration_ms IS NULL OR analysis_duration_ms >= 0);

-- Add constraint to ensure retry_count is non-negative
ALTER TABLE analyses 
ADD CONSTRAINT non_negative_retry_count 
CHECK (retry_count >= 0);

-- Add index for common query patterns
CREATE INDEX IF NOT EXISTS idx_analyses_status_created 
ON analyses(status, created_at DESC);

-- Add index for URL lookups (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_analyses_url_hash 
ON analyses USING hash(url);