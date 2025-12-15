/**
 * Whitespace Assessment Recommendation Templates
 *
 * Action-oriented recommendations for layout and spacing improvements.
 * Focused on readability and visual hierarchy.
 */

import { RecommendationTemplate, RecommendationContext } from '../types'

export const whitespaceRecommendations: RecommendationTemplate[] = [
  // High Impact - Severely cluttered
  {
    id: 'whitespace-severely-cluttered',
    category: 'whitespace',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.whitespaceRatio || 0) < 0.25,
    templates: [
      'Page is severely cluttered ({{whitespaceRatio}} whitespace ratio). Remove non-essential elements to improve focus.',
      'Only {{whitespaceRatio}} whitespace detected. Cluttered layouts overwhelm visitors - aim for 40%+ whitespace.',
      'Critical density issue: {{whitespaceRatio}} whitespace. Prioritize content and add breathing room between sections.',
    ],
    affectedArea: 'page layout',
  },

  // High Impact - Very low whitespace
  {
    id: 'whitespace-too-dense',
    category: 'whitespace',
    impact: 'High',
    condition: (ctx: RecommendationContext) =>
      (ctx.whitespaceRatio || 0) >= 0.25 && (ctx.whitespaceRatio || 0) < 0.35,
    templates: [
      'Increase whitespace from {{whitespaceRatio}} to at least 40%. Dense layouts reduce comprehension and conversions.',
      'Layout is too dense at {{whitespaceRatio}} whitespace. Add padding around sections and increase margins.',
    ],
  },

  // High Impact - Poor line height
  {
    id: 'whitespace-poor-line-height',
    category: 'whitespace',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.avgLineHeight || 0) < 1.3,
    templates: [
      'Line height of {{avgLineHeight}} is too tight. Increase to 1.5-1.6 for body text readability.',
      'Text is cramped with {{avgLineHeight}} line-height. Set body text to line-height: 1.5 minimum.',
    ],
    affectedArea: 'body text',
  },

  // Medium Impact - Moderate density
  {
    id: 'whitespace-moderate-density',
    category: 'whitespace',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.whitespaceRatio || 0) >= 0.35 && (ctx.whitespaceRatio || 0) < 0.4,
    templates: [
      'Whitespace ratio of {{whitespaceRatio}} is adequate but could improve. Target 40-50% for optimal readability.',
      'Add more whitespace around key elements. Current {{whitespaceRatio}} ratio is functional but dense.',
    ],
  },

  // Medium Impact - Line height needs work
  {
    id: 'whitespace-improve-line-height',
    category: 'whitespace',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.avgLineHeight || 0) >= 1.3 && (ctx.avgLineHeight || 0) < 1.4,
    templates: [
      'Increase line height from {{avgLineHeight}} to 1.5 for improved readability on paragraphs.',
      'Body text line-height of {{avgLineHeight}} is slightly tight. Set to 1.5-1.6 for comfortable reading.',
    ],
    affectedArea: 'typography',
  },

  // Medium Impact - Add section spacing
  {
    id: 'whitespace-section-spacing',
    category: 'whitespace',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.contentDensity || 0) > 0.6,
    templates: [
      'Add more vertical spacing between page sections. Use consistent padding (64px+) to create visual breathing room.',
      'Increase margins between content blocks. Clear section boundaries improve scanning and comprehension.',
      'Content sections are too close together. Add 48-80px vertical padding between major sections.',
    ],
    affectedArea: 'section dividers',
  },

  // Medium Impact - Headline spacing
  {
    id: 'whitespace-headline-spacing',
    category: 'whitespace',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.clutterScore || 0) > 50,
    templates: [
      'Increase whitespace around headlines. Add minimum 24px top margin and 16px bottom margin.',
      'Give headlines more breathing room. Adequate spacing improves visual hierarchy.',
    ],
    affectedArea: 'headlines',
  },

  // Medium Impact - CTA spacing
  {
    id: 'whitespace-cta-spacing',
    category: 'whitespace',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.whitespaceRatio || 0) < 0.45 && (ctx.contentDensity || 0) > 0.5,
    templates: [
      'Add more whitespace around CTA buttons (minimum 20px margins). Isolated CTAs draw more attention.',
      'Increase padding around call-to-action buttons. CTAs surrounded by whitespace get more clicks.',
    ],
    affectedArea: 'CTA buttons',
  },

  // Low Impact - Content width
  {
    id: 'whitespace-content-width',
    category: 'whitespace',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.contentDensity || 0) > 0.4,
    templates: [
      'Limit paragraph width to 65-75 characters for optimal reading comfort.',
      'Consider a narrower content column. Wide text blocks are harder to read.',
    ],
    affectedArea: 'content columns',
  },

  // Low Impact - Consistent spacing
  {
    id: 'whitespace-consistent-spacing',
    category: 'whitespace',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.whitespaceRatio || 0) < 0.5,
    templates: [
      'Establish a consistent spacing scale (8px base unit). Use multiples for all margins and padding.',
      'Create a spacing system with defined values. Consistent spacing creates visual rhythm.',
    ],
  },
]
