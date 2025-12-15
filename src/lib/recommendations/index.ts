/**
 * Recommendations System
 *
 * Central module for generating action-oriented, context-aware recommendations.
 *
 * Key features:
 * - Recommendations are grounded in actual analysis data
 * - Multiple template variations prevent repetitive output
 * - Action-oriented language (no congratulatory fluff)
 * - Impact levels are explicit, not keyword-based
 */

export * from './types'
export * from './generator'

// Import all template collections
import { fontRecommendations } from './templates/fonts'
import { imageRecommendations } from './templates/images'
import { ctaRecommendations } from './templates/cta'
import { speedRecommendations } from './templates/speed'
import { whitespaceRecommendations } from './templates/whitespace'
import { socialProofRecommendations } from './templates/social-proof'

import { RecommendationTemplate, RecommendationContext, RecommendationCategory } from './types'
import { generateRecommendations, generateCategoryRecommendations } from './generator'

/**
 * Complete registry of all recommendation templates
 */
export const allRecommendations: RecommendationTemplate[] = [
  ...fontRecommendations,
  ...imageRecommendations,
  ...ctaRecommendations,
  ...speedRecommendations,
  ...whitespaceRecommendations,
  ...socialProofRecommendations,
]

/**
 * Get recommendations for font analysis
 */
export function getFontRecommendations(ctx: RecommendationContext) {
  return generateCategoryRecommendations(allRecommendations, ctx, 'fonts')
}

/**
 * Get recommendations for image analysis
 */
export function getImageRecommendations(ctx: RecommendationContext) {
  return generateCategoryRecommendations(allRecommendations, ctx, 'images')
}

/**
 * Get recommendations for CTA analysis
 */
export function getCtaRecommendations(ctx: RecommendationContext) {
  return generateCategoryRecommendations(allRecommendations, ctx, 'cta')
}

/**
 * Get recommendations for page speed analysis
 */
export function getSpeedRecommendations(ctx: RecommendationContext) {
  return generateCategoryRecommendations(allRecommendations, ctx, 'speed')
}

/**
 * Get recommendations for whitespace analysis
 */
export function getWhitespaceRecommendations(ctx: RecommendationContext) {
  return generateCategoryRecommendations(allRecommendations, ctx, 'whitespace')
}

/**
 * Get recommendations for social proof analysis
 */
export function getSocialProofRecommendations(ctx: RecommendationContext) {
  return generateCategoryRecommendations(allRecommendations, ctx, 'social-proof')
}

/**
 * Get all recommendations across all categories
 */
export function getAllRecommendations(ctx: RecommendationContext) {
  return generateRecommendations(allRecommendations, ctx)
}

/**
 * Export template collections for testing and customization
 */
export {
  fontRecommendations,
  imageRecommendations,
  ctaRecommendations,
  speedRecommendations,
  whitespaceRecommendations,
  socialProofRecommendations,
}
