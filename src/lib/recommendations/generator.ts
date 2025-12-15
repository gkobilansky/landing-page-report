/**
 * Recommendation Generator
 *
 * Generates recommendations from templates based on analysis context.
 * Handles:
 * - Template selection based on conditions
 * - Variable interpolation
 * - Random variation selection for variety
 */

import {
  RecommendationTemplate,
  RecommendationContext,
  GeneratedRecommendation,
  RecommendationOutput,
  RecommendationCategory,
} from './types'

/**
 * Interpolate variables in a template string
 * Replaces {{variableName}} with values from context
 */
function interpolate(template: string, ctx: RecommendationContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = ctx[key]
    if (value === undefined || value === null) {
      return match // Keep original if no value
    }
    // Format numbers nicely
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toString()
      }
      return value.toFixed(2)
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value)
  })
}

/**
 * Select a random template from the variations
 * Uses a seeded approach based on context for consistency within same analysis
 */
function selectTemplate(
  templates: string[],
  ctx: RecommendationContext,
  templateId: string
): string {
  if (templates.length === 1) {
    return templates[0]
  }

  // Create a simple hash from context for semi-random but consistent selection
  // This ensures the same URL gets the same variation, but different URLs get variety
  const seed = (ctx.url || '') + templateId
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  const index = Math.abs(hash) % templates.length
  return templates[index]
}

/**
 * Generate recommendations from a registry of templates
 */
export function generateRecommendations(
  templates: RecommendationTemplate[],
  ctx: RecommendationContext
): RecommendationOutput {
  const recommendations: GeneratedRecommendation[] = []

  for (const template of templates) {
    // Check if this recommendation applies
    if (!template.condition(ctx)) {
      continue
    }

    // Select a template variation
    const selectedTemplate = selectTemplate(template.templates, ctx, template.id)

    // Interpolate variables
    const text = interpolate(selectedTemplate, ctx)

    recommendations.push({
      id: template.id,
      text,
      impact: template.impact,
      category: template.category,
      affectedArea: template.affectedArea,
    })
  }

  // Sort by impact (High first, then Medium, then Low)
  const impactOrder = { High: 0, Medium: 1, Low: 2 }
  recommendations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])

  return {
    recommendations,
    legacyStrings: recommendations.map((r) => r.text),
  }
}

/**
 * Generate recommendations for a specific category
 */
export function generateCategoryRecommendations(
  templates: RecommendationTemplate[],
  ctx: RecommendationContext,
  category: RecommendationCategory
): RecommendationOutput {
  const categoryTemplates = templates.filter((t) => t.category === category)
  return generateRecommendations(categoryTemplates, ctx)
}

/**
 * Get recommendations grouped by impact level
 */
export function groupByImpact(
  recommendations: GeneratedRecommendation[]
): Record<string, GeneratedRecommendation[]> {
  return recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.impact]) {
        acc[rec.impact] = []
      }
      acc[rec.impact].push(rec)
      return acc
    },
    {} as Record<string, GeneratedRecommendation[]>
  )
}
