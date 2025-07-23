-- Add screenshot_url field to analyses table
-- This field will store the URL of the page screenshot for the reports gallery

ALTER TABLE analyses 
ADD COLUMN screenshot_url TEXT;