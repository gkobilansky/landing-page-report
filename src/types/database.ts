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