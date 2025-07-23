-- Add schema_data column to analyses table
ALTER TABLE analyses ADD COLUMN schema_data JSONB DEFAULT NULL;

-- Add index for schema_data queries
CREATE INDEX idx_analyses_schema_data ON analyses USING GIN (schema_data);

-- Add comment for documentation
COMMENT ON COLUMN analyses.schema_data IS 'JSON-LD schema data extracted from the webpage, containing organization/website information';