/**
 * Social Proof Recommendation Templates
 *
 * Action-oriented recommendations for credibility and trust elements.
 * Focused on conversion optimization through social validation.
 */

import { RecommendationTemplate, RecommendationContext } from '../types'

export const socialProofRecommendations: RecommendationTemplate[] = [
  // High Impact - No social proof at all
  {
    id: 'social-no-proof',
    category: 'social-proof',
    impact: 'High',
    condition: (ctx: RecommendationContext) =>
      (ctx.testimonialCount || 0) === 0 &&
      (ctx.reviewCount || 0) === 0 &&
      (ctx.trustBadgeCount || 0) === 0,
    templates: [
      'Add social proof immediately. Pages with testimonials convert 34% better than those without.',
      'Missing all social proof elements. Add customer testimonials, reviews, or trust badges to build credibility.',
      'No social proof detected. Include at least one form: testimonials, customer logos, reviews, or usage stats.',
    ],
    affectedArea: 'entire page',
  },

  // High Impact - No above-fold proof
  {
    id: 'social-none-above-fold',
    category: 'social-proof',
    impact: 'High',
    condition: (ctx: RecommendationContext) =>
      ctx.hasAboveFoldProof === false &&
      ((ctx.testimonialCount || 0) > 0 ||
        (ctx.reviewCount || 0) > 0 ||
        (ctx.trustBadgeCount || 0) > 0),
    templates: [
      'Move social proof above the fold. Trust indicators visible without scrolling increase conversions.',
      'Add a testimonial or trust badge to the hero section. First impressions need credibility signals.',
      'Place customer logos or a key testimonial in the above-fold area to build immediate trust.',
    ],
    affectedArea: 'hero section',
  },

  // High Impact - No testimonials
  {
    id: 'social-no-testimonials',
    category: 'social-proof',
    impact: 'High',
    condition: (ctx: RecommendationContext) =>
      (ctx.testimonialCount || 0) === 0 &&
      ((ctx.reviewCount || 0) > 0 || (ctx.trustBadgeCount || 0) > 0),
    templates: [
      'Add customer testimonials. Quotes from real customers are more persuasive than badges alone.',
      'Include 2-3 specific customer testimonials with names, titles, and companies.',
      'Missing testimonials. Collect and display quotes from satisfied customers for stronger social proof.',
    ],
    affectedArea: 'testimonials section',
  },

  // Medium Impact - Generic testimonials
  {
    id: 'social-improve-testimonials',
    category: 'social-proof',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.testimonialCount || 0) > 0 && (ctx.testimonialCount || 0) < 3,
    templates: [
      'Add more testimonials. With {{testimonialCount}} testimonial(s), aim for 3-5 for credibility.',
      'Expand testimonial section from {{testimonialCount}} to at least 3 with specific results and outcomes.',
      'Strengthen social proof: {{testimonialCount}} testimonial(s) is a start, but 3+ creates stronger validation.',
    ],
  },

  // Medium Impact - Add attribution
  {
    id: 'social-add-attribution',
    category: 'social-proof',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.testimonialCount || 0) > 0,
    templates: [
      'Include full names, job titles, and company names with testimonials for authenticity.',
      'Add photos to testimonials. Faces increase trust and make quotes more believable.',
      'Verify testimonials include specific details: name, role, company, and ideally a photo.',
    ],
  },

  // Medium Impact - No trust badges
  {
    id: 'social-add-trust-badges',
    category: 'social-proof',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.trustBadgeCount || 0) === 0 &&
      ((ctx.testimonialCount || 0) > 0 || (ctx.reviewCount || 0) > 0),
    templates: [
      'Add trust badges: security seals, payment icons, or certification logos near CTAs.',
      'Include trust indicators like "Secure checkout", SSL badges, or industry certifications.',
      'Add credibility badges (awards, certifications, guarantees) to complement testimonials.',
    ],
    affectedArea: 'near CTAs',
  },

  // Medium Impact - Add customer counts
  {
    id: 'social-add-customer-counts',
    category: 'social-proof',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.testimonialCount || 0) > 0 || (ctx.trustBadgeCount || 0) > 0,
    templates: [
      'Display customer counts or usage statistics: "Join 10,000+ customers" adds social validation.',
      'Add specific numbers: "Trusted by 500+ companies" or "1M+ downloads" provides scale evidence.',
      'Include a customer counter or "As seen in" logo strip to demonstrate market traction.',
    ],
  },

  // Medium Impact - Add specific results
  {
    id: 'social-add-results',
    category: 'social-proof',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.testimonialCount || 0) >= 2,
    templates: [
      'Include specific results in testimonials: "Increased conversions by 40%" is more persuasive than "Great product".',
      'Ask customers for measurable outcomes to quote. Specific numbers build stronger credibility.',
      'Feature case study snippets with concrete metrics alongside testimonials.',
    ],
  },

  // Low Impact - Video testimonials
  {
    id: 'social-add-video',
    category: 'social-proof',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.testimonialCount || 0) >= 3,
    templates: [
      'Consider video testimonials for higher engagement. Video reviews are perceived as more authentic.',
      'Add 1-2 video testimonials. They often outperform text quotes for trust-building.',
    ],
  },

  // Low Impact - Review platform integration
  {
    id: 'social-add-reviews',
    category: 'social-proof',
    impact: 'Low',
    condition: (ctx: RecommendationContext) =>
      (ctx.reviewCount || 0) === 0 && (ctx.testimonialCount || 0) > 0,
    templates: [
      'Integrate third-party reviews (G2, Capterra, Trustpilot). External reviews add independent validation.',
      'Embed reviews from platforms like Google, Yelp, or industry review sites for third-party credibility.',
    ],
  },

  // Low Impact - Logo strip
  {
    id: 'social-add-logos',
    category: 'social-proof',
    impact: 'Low',
    condition: (ctx: RecommendationContext) =>
      (ctx.testimonialCount || 0) > 0 || (ctx.trustBadgeCount || 0) > 0,
    templates: [
      'Add a customer logo strip to the hero section. Recognizable brands boost credibility instantly.',
      'Include "Trusted by" section with customer logos below the hero area.',
    ],
    affectedArea: 'hero section',
  },
]
