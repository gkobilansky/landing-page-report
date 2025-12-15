/**
 * Recommendation System Types
 *
 * This module defines the types for the centralized recommendation system.
 * Recommendations are:
 * - Grounded in actual analysis data (not generic)
 * - Action-oriented (no congratulatory language)
 * - Variable (multiple templates for the same condition)
 */

export type ImpactLevel = 'High' | 'Medium' | 'Low'

export type RecommendationCategory =
  | 'fonts'
  | 'images'
  | 'cta'
  | 'speed'
  | 'whitespace'
  | 'social-proof'

/**
 * Context data passed to recommendation templates for interpolation
 */
export interface RecommendationContext {
  // Font analysis context
  webFontCount?: number
  systemFontCount?: number
  fontFamilies?: string[]

  // Image analysis context
  totalImages?: number
  imagesWithoutAlt?: number
  oversizedImages?: number
  nonModernFormatCount?: number
  imageFormats?: string[]

  // CTA analysis context
  ctaCount?: number
  ctasAboveFold?: number
  primaryCtaDetected?: boolean
  weakActionWords?: string[]

  // Page speed context
  lcp?: number
  fcp?: number
  cls?: number
  ttfb?: number
  speedScore?: number

  // Whitespace context
  whitespaceRatio?: number
  contentDensity?: number
  avgLineHeight?: number
  clutterScore?: number

  // Social proof context
  testimonialCount?: number
  reviewCount?: number
  trustBadgeCount?: number
  hasAboveFoldProof?: boolean

  // Generic context
  url?: string
  [key: string]: unknown
}

/**
 * A single recommendation template with variations
 */
export interface RecommendationTemplate {
  /** Unique identifier for this recommendation */
  id: string

  /** Which analysis module this belongs to */
  category: RecommendationCategory

  /** Impact level - explicit, not inferred from keywords */
  impact: ImpactLevel

  /**
   * Condition function - returns true if this recommendation applies
   * Receives the analysis context to make decisions
   */
  condition: (ctx: RecommendationContext) => boolean

  /**
   * Array of template variations - system will randomly select one
   * Templates can use {{variable}} syntax for interpolation
   */
  templates: string[]

  /**
   * Optional: specific elements or locations this applies to
   * e.g., "hero section", "primary CTA button"
   */
  affectedArea?: string
}

/**
 * A generated recommendation ready for display
 */
export interface GeneratedRecommendation {
  /** The recommendation ID from the template */
  id: string

  /** The rendered text with variables interpolated */
  text: string

  /** Impact level */
  impact: ImpactLevel

  /** Category for grouping */
  category: RecommendationCategory

  /** Optional: what area of the page this affects */
  affectedArea?: string
}

/**
 * Output from the recommendation generator
 */
export interface RecommendationOutput {
  recommendations: GeneratedRecommendation[]

  /** Legacy format for backward compatibility */
  legacyStrings: string[]
}
