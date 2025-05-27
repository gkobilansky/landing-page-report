-- Enhanced Database Schema Migration
-- This migration implements the improved schema design with user management and future growth support

-- 1. Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    website TEXT,
    phone TEXT,
    
    -- Marketing and preferences
    marketing_consent BOOLEAN DEFAULT false,
    email_frequency TEXT DEFAULT 'monthly' CHECK (email_frequency IN ('weekly', 'monthly', 'quarterly', 'never')),
    industry TEXT, -- 'saas', 'ecommerce', 'consulting', 'agency', etc.
    company_size TEXT, -- 'solo', 'small', 'medium', 'enterprise'
    
    -- Lead qualification
    lead_score INTEGER DEFAULT 0,
    lead_source TEXT, -- 'organic', 'paid', 'referral', etc.
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete for GDPR compliance
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create enhanced analyses table
CREATE TABLE analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis target
    url TEXT NOT NULL,
    url_title TEXT, -- Extracted page title
    url_description TEXT, -- Meta description
    detected_industry TEXT, -- Auto-detected from content
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'queued')),
    priority INTEGER DEFAULT 1, -- For queue management
    
    -- Core analysis results (current 6 modules)
    page_speed_analysis JSONB,
    font_analysis JSONB,
    image_analysis JSONB,
    cta_analysis JSONB,
    whitespace_analysis JSONB,
    social_proof_analysis JSONB,
    
    -- Future analysis modules (Phase 2 enhancements)
    value_proposition_analysis JSONB,
    psychological_triggers_analysis JSONB,
    form_optimization_analysis JSONB,
    mobile_conversion_analysis JSONB,
    copy_effectiveness_analysis JSONB,
    conversion_prediction JSONB,
    competitive_analysis JSONB,
    
    -- Scoring and recommendations
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    industry_adjusted_score INTEGER CHECK (industry_adjusted_score >= 0 AND industry_adjusted_score <= 100),
    conversion_probability DECIMAL(5,4), -- 0.0000 to 1.0000
    grade TEXT, -- A, B, C, D, F
    
    -- Analysis metadata
    algorithm_version TEXT DEFAULT '1.0.0',
    analysis_duration_ms INTEGER,
    lighthouse_available BOOLEAN DEFAULT false,
    puppeteer_version TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Future features
    is_baseline BOOLEAN DEFAULT false, -- For A/B testing
    parent_analysis_id UUID REFERENCES analyses(id), -- For comparison analyses
    
    UNIQUE(user_id, url) -- Prevent duplicate analyses for same user/URL
);

-- 3. Create user preferences table
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis preferences
    preferred_analysis_depth TEXT DEFAULT 'standard' CHECK (preferred_analysis_depth IN ('quick', 'standard', 'comprehensive')),
    auto_analyze_frequency TEXT, -- 'weekly', 'monthly', null for manual only
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
    
    -- Dashboard customization
    dashboard_layout JSONB,
    favorite_metrics TEXT[], -- Array of metric names to highlight
    
    -- Export preferences
    report_format TEXT DEFAULT 'pdf' CHECK (report_format IN ('pdf', 'html', 'json')),
    include_recommendations BOOLEAN DEFAULT true,
    include_competitor_data BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 4. Create recommendations table (for future use)
CREATE TABLE recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    
    -- Recommendation details
    category TEXT NOT NULL, -- 'cta', 'speed', 'social_proof', etc.
    priority INTEGER NOT NULL, -- 1 = highest priority
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_impact TEXT, -- 'low', 'medium', 'high'
    estimated_lift_percentage DECIMAL(5,2), -- Expected conversion lift
    implementation_difficulty TEXT, -- 'easy', 'medium', 'hard'
    estimated_hours DECIMAL(4,1),
    
    -- A/B testing suggestions
    test_hypothesis TEXT,
    suggested_variants JSONB, -- Array of suggested changes to test
    success_metrics TEXT[], -- Metrics to track
    
    -- Implementation guidance
    technical_requirements TEXT[],
    design_requirements TEXT[],
    copy_suggestions JSONB,
    
    -- Tracking
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'planned', 'testing', 'implemented', 'dismissed')),
    user_feedback TEXT,
    implementation_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create analysis history table (for tracking algorithm improvements)
CREATE TABLE analysis_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    
    -- Version tracking
    algorithm_version TEXT NOT NULL,
    module_name TEXT NOT NULL, -- 'page_speed', 'cta', etc.
    
    -- Results
    previous_score INTEGER,
    new_score INTEGER,
    changes_summary JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create performance indexes
-- User table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_industry ON users(industry) WHERE industry IS NOT NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Analyses table indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_url ON analyses(url);
CREATE INDEX idx_analyses_overall_score ON analyses(overall_score) WHERE overall_score IS NOT NULL;
CREATE INDEX idx_analyses_industry ON analyses(detected_industry) WHERE detected_industry IS NOT NULL;

-- Recommendations table indexes
CREATE INDEX idx_recommendations_analysis_id ON recommendations(analysis_id);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- Composite indexes for common queries
CREATE INDEX idx_analyses_user_status ON analyses(user_id, status);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at DESC);

-- 7. Create updated_at trigger functions for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at 
    BEFORE UPDATE ON analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at 
    BEFORE UPDATE ON recommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (true); -- For now, allow all reads since we're not using auth

CREATE POLICY "Allow inserting new users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (true);

-- Analyses table policies
CREATE POLICY "Users can view their own analyses" ON analyses
    FOR SELECT USING (true);

CREATE POLICY "Allow inserting new analyses" ON analyses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updating analyses" ON analyses
    FOR UPDATE USING (true);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR ALL USING (true);

-- Recommendations policies  
CREATE POLICY "Users can view recommendations for their analyses" ON recommendations
    FOR ALL USING (true);

-- Analysis history policies
CREATE POLICY "Allow viewing analysis history" ON analysis_history
    FOR SELECT USING (true);

CREATE POLICY "Allow inserting analysis history" ON analysis_history
    FOR INSERT WITH CHECK (true);

-- 10. Data migration from existing table
-- First, migrate users from existing analyses
INSERT INTO users (email, created_at, marketing_consent)
SELECT DISTINCT 
    email,
    MIN(created_at) as created_at,
    true as marketing_consent -- Assume consent since they used the tool
FROM landing_page_analyses
GROUP BY email;

-- Then, migrate analyses data
INSERT INTO analyses (
    user_id,
    url,
    status,
    page_speed_analysis,
    font_analysis,
    image_analysis,
    cta_analysis,
    whitespace_analysis,
    social_proof_analysis,
    overall_score,
    created_at,
    updated_at,
    completed_at,
    error_message
)
SELECT 
    u.id as user_id,
    lpa.url,
    lpa.status,
    lpa.page_speed_analysis,
    lpa.font_analysis,
    lpa.image_analysis,
    lpa.cta_analysis,
    lpa.whitespace_analysis,
    lpa.social_proof_analysis,
    lpa.overall_score,
    lpa.created_at,
    lpa.updated_at,
    lpa.completed_at,
    lpa.error_message
FROM landing_page_analyses lpa
JOIN users u ON u.email = lpa.email;

-- 11. Create default user preferences for migrated users
INSERT INTO user_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 12. Backup and drop old table (commented out for safety)
-- Uncomment these lines after verifying the migration worked correctly:
-- ALTER TABLE landing_page_analyses RENAME TO landing_page_analyses_backup;
-- DROP TABLE landing_page_analyses_backup; -- Only after thorough verification

-- 13. Create views for backward compatibility (optional)
CREATE VIEW legacy_landing_page_analyses AS
SELECT 
    a.id,
    u.email,
    a.url,
    a.status,
    a.page_speed_analysis,
    a.font_analysis,
    a.image_analysis,
    a.cta_analysis,
    a.whitespace_analysis,
    a.social_proof_analysis,
    a.overall_score,
    a.created_at,
    a.updated_at,
    a.completed_at,
    a.error_message
FROM analyses a
JOIN users u ON u.id = a.user_id;