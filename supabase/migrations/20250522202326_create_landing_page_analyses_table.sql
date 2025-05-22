-- Create the landing_page_analyses table
CREATE TABLE landing_page_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Analysis results (JSON fields for flexibility)
    page_speed_analysis JSONB,
    font_analysis JSONB,
    image_analysis JSONB,
    cta_analysis JSONB,
    whitespace_analysis JSONB,
    social_proof_analysis JSONB,
    
    -- Overall scores and summary
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    summary_recommendations TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create indexes for performance
CREATE INDEX idx_landing_page_analyses_email ON landing_page_analyses(email);
CREATE INDEX idx_landing_page_analyses_status ON landing_page_analyses(status);
CREATE INDEX idx_landing_page_analyses_created_at ON landing_page_analyses(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_landing_page_analyses_updated_at 
    BEFORE UPDATE ON landing_page_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for security
ALTER TABLE landing_page_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own analyses
CREATE POLICY "Users can view their own analyses" ON landing_page_analyses
    FOR SELECT USING (true); -- For now, allow all reads since we're not using auth

-- Create policy to allow inserting new analyses
CREATE POLICY "Allow inserting new analyses" ON landing_page_analyses
    FOR INSERT WITH CHECK (true);

-- Create policy to allow updating analyses (for processing)
CREATE POLICY "Allow updating analyses" ON landing_page_analyses
    FOR UPDATE USING (true);