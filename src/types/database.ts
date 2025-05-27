// ===== NEW DATABASE SCHEMA TYPES =====

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company?: string
  website?: string
  phone?: string
  
  // Marketing and preferences
  marketing_consent: boolean
  email_frequency: 'weekly' | 'monthly' | 'quarterly' | 'never'
  industry?: string // 'saas', 'ecommerce', 'consulting', 'agency', etc.
  company_size?: string // 'solo', 'small', 'medium', 'enterprise'
  
  // Lead qualification
  lead_score: number
  lead_source?: string // 'organic', 'paid', 'referral', etc.
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  last_login_at?: string
  
  // Soft delete for GDPR compliance
  deleted_at?: string
}

export interface Analysis {
  id: string
  user_id: string
  
  // Analysis target
  url: string
  url_title?: string
  url_description?: string
  detected_industry?: string
  
  // Processing status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'queued'
  priority: number
  
  // Core analysis results (current 6 modules)
  page_speed_analysis?: PageSpeedAnalysis
  font_analysis?: FontAnalysis
  image_analysis?: ImageAnalysis
  cta_analysis?: CtaAnalysis
  whitespace_analysis?: WhitespaceAnalysis
  social_proof_analysis?: SocialProofAnalysis
  
  // Future analysis modules (Phase 2 enhancements)
  value_proposition_analysis?: ValuePropositionAnalysis
  psychological_triggers_analysis?: PsychologicalTriggersAnalysis
  form_optimization_analysis?: FormOptimizationAnalysis
  mobile_conversion_analysis?: MobileConversionAnalysis
  copy_effectiveness_analysis?: CopyEffectivenessAnalysis
  conversion_prediction?: ConversionPrediction
  competitive_analysis?: CompetitiveAnalysis
  
  // Scoring and recommendations
  overall_score?: number
  industry_adjusted_score?: number
  conversion_probability?: number // 0.0000 to 1.0000
  grade?: string // A, B, C, D, F
  
  // Analysis metadata
  algorithm_version: string
  analysis_duration_ms?: number
  lighthouse_available: boolean
  puppeteer_version?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  
  // Error handling
  error_message?: string
  retry_count: number
  
  // Future features
  is_baseline: boolean // For A/B testing
  parent_analysis_id?: string // For comparison analyses
}

export interface UserPreferences {
  id: string
  user_id: string
  
  // Analysis preferences
  preferred_analysis_depth: 'quick' | 'standard' | 'comprehensive'
  auto_analyze_frequency?: string // 'weekly', 'monthly', null for manual only
  notification_preferences: {
    email: boolean
    sms: boolean
  }
  
  // Dashboard customization
  dashboard_layout?: Record<string, any>
  favorite_metrics?: string[] // Array of metric names to highlight
  
  // Export preferences
  report_format: 'pdf' | 'html' | 'json'
  include_recommendations: boolean
  include_competitor_data: boolean
  
  created_at: string
  updated_at: string
}

export interface Recommendation {
  id: string
  analysis_id: string
  
  // Recommendation details
  category: string // 'cta', 'speed', 'social_proof', etc.
  priority: number // 1 = highest priority
  title: string
  description: string
  expected_impact: 'low' | 'medium' | 'high'
  estimated_lift_percentage?: number // Expected conversion lift
  implementation_difficulty: 'easy' | 'medium' | 'hard'
  estimated_hours?: number
  
  // A/B testing suggestions
  test_hypothesis?: string
  suggested_variants?: Record<string, any>[] // Array of suggested changes to test
  success_metrics?: string[] // Metrics to track
  
  // Implementation guidance
  technical_requirements?: string[]
  design_requirements?: string[]
  copy_suggestions?: Record<string, any>
  
  // Tracking
  status: 'suggested' | 'planned' | 'testing' | 'implemented' | 'dismissed'
  user_feedback?: string
  implementation_notes?: string
  
  created_at: string
  updated_at: string
}

export interface AnalysisHistory {
  id: string
  analysis_id: string
  
  // Version tracking
  algorithm_version: string
  module_name: string // 'page_speed', 'cta', etc.
  
  // Results
  previous_score?: number
  new_score?: number
  changes_summary?: Record<string, any>
  
  created_at: string
}

// ===== LEGACY TYPE FOR BACKWARD COMPATIBILITY =====
export interface LandingPageAnalysis {
  id: string
  url: string
  email: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  page_speed_analysis?: PageSpeedAnalysis
  font_analysis?: FontAnalysis
  image_analysis?: ImageAnalysis
  cta_analysis?: CtaAnalysis
  whitespace_analysis?: WhitespaceAnalysis
  social_proof_analysis?: SocialProofAnalysis
  overall_score?: number
  summary_recommendations?: string
  created_at: string
  updated_at: string
  completed_at?: string
  error_message?: string
}

export interface PageSpeedAnalysis {
  score: number
  metrics: {
    fcp: number // First Contentful Paint
    lcp: number // Largest Contentful Paint
    cls: number // Cumulative Layout Shift
    fid: number // First Input Delay
    ttfb: number // Time to First Byte
  }
  recommendations: string[]
}

export interface FontAnalysis {
  score: number
  font_families: string[]
  font_count: number
  recommendations: string[]
}

export interface ImageAnalysis {
  score: number
  total_images: number
  optimized_images: number
  unoptimized_images: number
  formats_used: string[]
  recommendations: string[]
}

export interface CtaAnalysis {
  score: number
  desktop: {
    ctas_above_fold: number
    primary_cta_detected: boolean
    cta_visibility: number
  }
  mobile: {
    ctas_above_fold: number
    primary_cta_detected: boolean
    cta_visibility: number
  }
  recommendations: string[]
}

export interface WhitespaceAnalysis {
  score: number
  whitespace_ratio: number
  content_density: number
  recommendations: string[]
}

export interface SocialProofAnalysis {
  score: number
  testimonials_found: number
  reviews_found: number
  trust_badges_found: number
  social_media_links: number
  recommendations: string[]
}

// ===== FUTURE ANALYSIS MODULE TYPES (Phase 2) =====

export interface ValuePropositionAnalysis {
  score: number
  headline_clarity_score: number
  benefit_vs_feature_ratio: number
  unique_value_proposition_detected: boolean
  time_to_comprehension_ms: number
  recommendations: string[]
}

export interface PsychologicalTriggersAnalysis {
  score: number
  scarcity_elements: number
  urgency_language_detected: boolean
  authority_signals: number
  reciprocity_elements: number
  social_proof_strength: number
  countdown_timers: number
  recommendations: string[]
}

export interface FormOptimizationAnalysis {
  score: number
  form_field_count: number
  progressive_disclosure_used: boolean
  mobile_usability_score: number
  trust_signals_near_forms: number
  conversion_barriers: string[]
  recommendations: string[]
}

export interface MobileConversionAnalysis {
  score: number
  mobile_cta_accessibility: number
  thumb_friendly_zones: number
  touch_target_sizing: number
  mobile_checkout_flow_score: number
  mobile_specific_barriers: string[]
  recommendations: string[]
}

export interface CopyEffectivenessAnalysis {
  score: number
  emotional_vs_rational_balance: number
  reading_level: number
  clarity_score: number
  persuasion_techniques: string[]
  benefit_language_percentage: number
  recommendations: string[]
}

export interface ConversionPrediction {
  probability: number // 0.0 to 1.0
  confidence_interval: {
    low: number
    high: number
  }
  improvement_potential: number
  key_factors: string[]
  predictions: Record<string, number>
}

export interface CompetitiveAnalysis {
  score: number
  industry_benchmark: number
  market_position: 'above_average' | 'average' | 'below_average'
  best_practices_identified: string[]
  gaps_vs_leaders: string[]
  competitive_advantages: string[]
  recommendations: string[]
}