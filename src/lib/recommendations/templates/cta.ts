/**
 * CTA Analysis Recommendation Templates
 *
 * Action-oriented recommendations for call-to-action improvements.
 * Focused on conversion optimization.
 */

import { RecommendationTemplate, RecommendationContext } from '../types'

export const ctaRecommendations: RecommendationTemplate[] = [
  // High Impact - No primary CTA
  {
    id: 'cta-no-primary',
    category: 'cta',
    impact: 'High',
    condition: (ctx: RecommendationContext) => ctx.primaryCtaDetected === false,
    templates: [
      'Add a prominent primary CTA button. Visitors need a clear next step to convert.',
      'Create a standout primary CTA with contrasting color and compelling action text.',
      'Missing primary CTA. Add a visually distinct button that tells visitors exactly what to do next.',
    ],
    affectedArea: 'hero section',
  },

  // High Impact - No CTAs above fold
  {
    id: 'cta-none-above-fold',
    category: 'cta',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.ctasAboveFold || 0) === 0,
    templates: [
      'Place at least one CTA above the fold. Most visitors never scroll, so capture them immediately.',
      'Add a CTA visible without scrolling. Above-fold CTAs capture visitors before they bounce.',
      'No CTA visible on initial page load. Move your primary action into the hero section.',
    ],
    affectedArea: 'above the fold',
  },

  // High Impact - Weak action words
  {
    id: 'cta-weak-action-words',
    category: 'cta',
    impact: 'High',
    condition: (ctx: RecommendationContext) =>
      (ctx.weakActionWords || []).length > 0,
    templates: [
      'Replace weak CTA text with action verbs. Use "Start", "Get", "Join", or "Try" instead of generic labels.',
      'Strengthen CTA copy. Action-oriented text like "Start Free Trial" outperforms "Submit" or "Click Here".',
      'Upgrade CTA language from passive to active. "Get Started Now" converts better than "Learn More".',
    ],
  },

  // High Impact - No CTAs at all
  {
    id: 'cta-none-found',
    category: 'cta',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.ctaCount || 0) === 0,
    templates: [
      'Add call-to-action buttons. Without CTAs, visitors have no clear path to convert.',
      'Critical: No CTAs detected. Every landing page needs clear action buttons to drive conversions.',
    ],
    affectedArea: 'entire page',
  },

  // Medium Impact - Only one CTA
  {
    id: 'cta-add-more',
    category: 'cta',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.ctaCount || 0) === 1 && ctx.primaryCtaDetected === true,
    templates: [
      'Add secondary CTAs throughout the page. Repeat your offer as visitors scroll through content.',
      'Include CTAs after each major section. Give visitors multiple opportunities to convert.',
      'Place additional CTAs at scroll milestones. One CTA limits conversion opportunities.',
    ],
  },

  // Medium Impact - CTA visibility
  {
    id: 'cta-improve-visibility',
    category: 'cta',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      ctx.primaryCtaDetected === true && (ctx.ctasAboveFold || 0) >= 1,
    templates: [
      'Increase CTA button contrast. The primary action should be the most visually prominent element.',
      'Make CTAs stand out with larger size, bolder color, or added whitespace around them.',
      'Ensure CTA buttons have at least 3:1 contrast ratio against surrounding elements.',
    ],
    affectedArea: 'CTA buttons',
  },

  // Medium Impact - Add value proposition near CTA
  {
    id: 'cta-add-value-prop',
    category: 'cta',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => ctx.primaryCtaDetected === true,
    templates: [
      'Add supporting text near your CTA explaining the benefit: "Start free trial - no credit card required".',
      'Include a micro-copy below CTAs addressing objections: "Cancel anytime" or "14-day free trial".',
      'Place benefit-focused text adjacent to CTAs to reduce friction and increase clicks.',
    ],
  },

  // Medium Impact - Mobile touch targets
  {
    id: 'cta-mobile-touch-targets',
    category: 'cta',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.ctaCount || 0) > 0,
    templates: [
      'Ensure CTA buttons are at least 44x44 pixels for mobile tap targets.',
      'Increase CTA button padding to minimum 12px for comfortable mobile tapping.',
      'Verify CTA touch targets meet 48px minimum height on mobile devices.',
    ],
    affectedArea: 'mobile CTAs',
  },

  // Low Impact - CTA copy personalization
  {
    id: 'cta-personalize-copy',
    category: 'cta',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.ctaCount || 0) >= 2,
    templates: [
      'Test first-person CTA copy: "Start My Free Trial" often outperforms "Start Your Free Trial".',
      'Experiment with specific CTA text: "Get My Report" vs generic "Download Now".',
    ],
  },

  // Low Impact - Sticky CTA
  {
    id: 'cta-add-sticky',
    category: 'cta',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.ctaCount || 0) >= 1,
    templates: [
      'Consider a sticky header or floating CTA button to keep the action visible while scrolling.',
      'Add a persistent CTA that follows users as they scroll through longer content.',
    ],
  },
]
