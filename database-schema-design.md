# Enhanced Database Schema Design

## Overview
This schema separates user data from analysis data, supports multiple analyses per user, and provides flexibility for the 15 planned enhancements.

## Core Tables

### 1. users
```sql
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
```

### 2. analyses
```sql
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
```

### 3. user_preferences
```sql
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
```

### 4. recommendations (Future: Phase 3)
```sql
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
```

### 5. analysis_history (For tracking algorithm improvements)
```sql
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
```

## Indexes for Performance

```sql
-- Core performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_industry ON users(industry) WHERE industry IS NOT NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_url ON analyses(url);
CREATE INDEX idx_analyses_overall_score ON analyses(overall_score) WHERE overall_score IS NOT NULL;
CREATE INDEX idx_analyses_industry ON analyses(detected_industry) WHERE detected_industry IS NOT NULL;

CREATE INDEX idx_recommendations_analysis_id ON recommendations(analysis_id);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- Composite indexes for common queries
CREATE INDEX idx_analyses_user_status ON analyses(user_id, status);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at DESC);
```

## Benefits of This Design

### 1. **User Management & Lead Generation**
- Comprehensive user profiles for marketing follow-up
- Lead scoring and source tracking
- Marketing consent and preference management
- Industry classification for targeted messaging

### 2. **Scalability for Future Features**
- JSONB fields ready for 15 planned enhancements
- Flexible recommendation system
- A/B testing support with parent/child analysis relationships
- Algorithm versioning for continuous improvement

### 3. **Analytics & Business Intelligence**
- Track analysis volume by industry
- Monitor conversion rates by lead source
- Analyze user engagement patterns
- Measure algorithm performance over time

### 4. **Data Compliance**
- Soft delete for GDPR compliance
- Marketing consent tracking
- User preference management
- Data retention policies ready

### 5. **Performance Optimization**
- Strategic indexes for fast queries
- Normalized structure reduces data duplication
- JSONB for flexible analysis data storage
- Queue management for high-volume processing

## Migration Strategy
1. Create new tables alongside existing one
2. Migrate existing data to new structure
3. Update API to use new schema
4. Remove old table after verification