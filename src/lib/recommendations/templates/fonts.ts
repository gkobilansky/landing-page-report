/**
 * Font Analysis Recommendation Templates
 *
 * Action-oriented recommendations for font usage issues.
 * No congratulatory language - focused on improvements.
 */

import { RecommendationTemplate, RecommendationContext } from '../types'

export const fontRecommendations: RecommendationTemplate[] = [
  // High Impact - Too many web fonts
  {
    id: 'fonts-too-many-web',
    category: 'fonts',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.webFontCount || 0) > 2,
    templates: [
      'Reduce web fonts from {{webFontCount}} to 2 or fewer. Each additional web font adds ~100-300ms to page load time.',
      'Cut web font count from {{webFontCount}} to maximum 2. Extra fonts block rendering and hurt conversions.',
      'Consolidate {{webFontCount}} web fonts down to 2. Users abandon pages that take too long to render text.',
    ],
    affectedArea: 'typography',
  },

  // High Impact - Excessive web fonts (severe)
  {
    id: 'fonts-excessive-web',
    category: 'fonts',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.webFontCount || 0) > 3,
    templates: [
      'Audit font usage immediately - {{webFontCount}} web fonts severely impacts performance. Target 1-2 fonts maximum.',
      'Font bloat detected: {{webFontCount}} web fonts. Prioritize reducing to 2 fonts to prevent visitor drop-off.',
    ],
  },

  // Medium Impact - Consider system fonts for body
  {
    id: 'fonts-use-system-for-body',
    category: 'fonts',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.webFontCount || 0) >= 2 && (ctx.webFontCount || 0) <= 3,
    templates: [
      'Switch body text to system fonts (system-ui, -apple-system) and reserve web fonts for headings only.',
      'Use system font stack for paragraphs. Keep web fonts for brand elements and headlines.',
      'Replace body web font with system-ui stack. This maintains readability while cutting load time.',
    ],
    affectedArea: 'body text',
  },

  // Medium Impact - System font inconsistency
  {
    id: 'fonts-system-inconsistency',
    category: 'fonts',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.systemFontCount || 0) > 3 && (ctx.webFontCount || 0) <= 2,
    templates: [
      'Standardize on fewer system fonts. {{systemFontCount}} different font stacks creates visual inconsistency.',
      'Reduce system font variety from {{systemFontCount}} to 2-3 for a more cohesive design.',
    ],
    affectedArea: 'typography',
  },

  // Medium Impact - Excessive system fonts
  {
    id: 'fonts-too-many-system',
    category: 'fonts',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.systemFontCount || 0) > 5,
    templates: [
      'Consolidate {{systemFontCount}} system font declarations. Use CSS variables for consistent typography.',
      'Too many font-family declarations ({{systemFontCount}}). Create a typography scale with 2-3 base stacks.',
    ],
  },

  // Low Impact - Use font weights instead of families
  {
    id: 'fonts-use-weights',
    category: 'fonts',
    impact: 'Low',
    condition: (ctx: RecommendationContext) =>
      (ctx.webFontCount || 0) > 0 || (ctx.systemFontCount || 0) > 2,
    templates: [
      'Create text hierarchy with font weights (400, 600, 700) rather than adding font families.',
      'Use font-weight variations instead of multiple families for visual distinction.',
      'Leverage font-weight and font-style for variety instead of loading additional typefaces.',
    ],
  },

  // Low Impact - Preload web fonts
  {
    id: 'fonts-preload',
    category: 'fonts',
    impact: 'Low',
    condition: (ctx: RecommendationContext) =>
      (ctx.webFontCount || 0) > 0 && (ctx.webFontCount || 0) <= 2,
    templates: [
      'Add <link rel="preload"> for web fonts to eliminate render-blocking delays.',
      'Preload web fonts in <head> with font-display: swap for faster text rendering.',
    ],
    affectedArea: 'document head',
  },

  // Low Impact - Font fallbacks
  {
    id: 'fonts-fallbacks',
    category: 'fonts',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.webFontCount || 0) > 0,
    templates: [
      'Ensure web fonts have matching system font fallbacks to prevent layout shift during loading.',
      'Add size-adjusted fallback fonts to minimize Cumulative Layout Shift (CLS) from font swapping.',
    ],
  },
]
