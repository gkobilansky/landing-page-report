/**
 * Page Speed Recommendation Templates
 *
 * Action-oriented recommendations for performance improvements.
 * Based on Core Web Vitals thresholds.
 */

import { RecommendationTemplate, RecommendationContext } from '../types'

export const speedRecommendations: RecommendationTemplate[] = [
  // High Impact - Poor LCP
  {
    id: 'speed-poor-lcp',
    category: 'speed',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.lcp || 0) > 4000,
    templates: [
      'Reduce Largest Contentful Paint from {{lcp}}ms to under 2500ms. Slow LCP causes 53% of visitors to abandon.',
      'LCP of {{lcp}}ms is critically slow. Optimize hero images, preload key resources, and reduce server response time.',
      'Fix {{lcp}}ms LCP immediately. Pages loading over 4s lose half their visitors before seeing content.',
    ],
    affectedArea: 'largest content element',
  },

  // High Impact - Needs improvement LCP
  {
    id: 'speed-improve-lcp',
    category: 'speed',
    impact: 'High',
    condition: (ctx: RecommendationContext) =>
      (ctx.lcp || 0) > 2500 && (ctx.lcp || 0) <= 4000,
    templates: [
      'Improve LCP from {{lcp}}ms to under 2500ms. Optimize your largest visible element (hero image or headline).',
      'LCP of {{lcp}}ms needs work. Preload hero images and inline critical CSS to hit the 2.5s target.',
    ],
    affectedArea: 'hero section',
  },

  // High Impact - Slow FCP
  {
    id: 'speed-slow-fcp',
    category: 'speed',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.fcp || 0) > 3000,
    templates: [
      'First Contentful Paint of {{fcp}}ms is too slow. Reduce render-blocking resources to show content faster.',
      'Cut FCP from {{fcp}}ms to under 1800ms. Inline critical CSS and defer non-essential scripts.',
    ],
    affectedArea: 'initial render',
  },

  // High Impact - Poor CLS
  {
    id: 'speed-poor-cls',
    category: 'speed',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.cls || 0) > 0.25,
    templates: [
      'Fix layout shift (CLS: {{cls}}). Set explicit dimensions on images and embeds to prevent content jumping.',
      'CLS of {{cls}} is poor. Reserve space for dynamic content to stop the page from shifting while loading.',
      'Layout instability ({{cls}} CLS) frustrates users. Add width/height to images and preload fonts.',
    ],
  },

  // Medium Impact - Moderate CLS
  {
    id: 'speed-moderate-cls',
    category: 'speed',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.cls || 0) > 0.1 && (ctx.cls || 0) <= 0.25,
    templates: [
      'Reduce layout shift from {{cls}} to under 0.1. Add aspect-ratio or explicit sizes to media elements.',
      'CLS of {{cls}} needs improvement. Identify and fix elements causing layout jumps during page load.',
    ],
  },

  // High Impact - Slow TTFB
  {
    id: 'speed-slow-ttfb',
    category: 'speed',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.ttfb || 0) > 800,
    templates: [
      'Server response time (TTFB) of {{ttfb}}ms is slow. Consider caching, CDN, or server optimization.',
      'TTFB of {{ttfb}}ms delays everything. Enable server-side caching and use a CDN for static assets.',
    ],
    affectedArea: 'server response',
  },

  // Medium Impact - FCP needs work
  {
    id: 'speed-fcp-needs-work',
    category: 'speed',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.fcp || 0) > 1800 && (ctx.fcp || 0) <= 3000,
    templates: [
      'Improve FCP from {{fcp}}ms toward the 1800ms target. Move critical CSS inline and defer JavaScript.',
      'First paint at {{fcp}}ms can be faster. Eliminate render-blocking resources in the document head.',
    ],
  },

  // Medium Impact - General optimization
  {
    id: 'speed-optimize-resources',
    category: 'speed',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.speedScore || 100) < 90 && (ctx.speedScore || 100) >= 50,
    templates: [
      'Enable text compression (gzip/brotli) for HTML, CSS, and JavaScript files.',
      'Minify and combine CSS/JS files to reduce the number of network requests.',
      'Set up browser caching with appropriate Cache-Control headers for static assets.',
    ],
  },

  // Medium Impact - Image optimization for speed
  {
    id: 'speed-optimize-images',
    category: 'speed',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.lcp || 0) > 2000,
    templates: [
      'Optimize and compress images, especially the hero image that determines LCP.',
      'Convert images to WebP and add srcset for responsive loading to improve paint times.',
    ],
    affectedArea: 'images',
  },

  // Low Impact - Good performance fine-tuning
  {
    id: 'speed-fine-tune',
    category: 'speed',
    impact: 'Low',
    condition: (ctx: RecommendationContext) =>
      (ctx.speedScore || 0) >= 90 && (ctx.lcp || 0) > 1500,
    templates: [
      'Consider preconnecting to third-party origins to reduce connection setup time.',
      'Implement resource hints (preload, prefetch) for critical above-fold resources.',
    ],
  },

  // Low Impact - Module preloading
  {
    id: 'speed-preload-modules',
    category: 'speed',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.speedScore || 0) < 95,
    templates: [
      'Add modulepreload for critical JavaScript modules to improve script loading.',
      'Use <link rel="preload"> for fonts and critical images in the document head.',
    ],
    affectedArea: 'document head',
  },
]
