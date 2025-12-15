/**
 * Image Optimization Recommendation Templates
 *
 * Action-oriented recommendations for image issues.
 * Grounded in specific analysis findings.
 */

import { RecommendationTemplate, RecommendationContext } from '../types'

export const imageRecommendations: RecommendationTemplate[] = [
  // High Impact - Missing alt text
  {
    id: 'images-missing-alt',
    category: 'images',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.imagesWithoutAlt || 0) > 0,
    templates: [
      'Add descriptive alt text to {{imagesWithoutAlt}} images. Screen readers need this for accessibility, and it improves SEO.',
      'Fix {{imagesWithoutAlt}} images missing alt attributes. This is a WCAG compliance issue affecting 15% of users.',
      '{{imagesWithoutAlt}} images lack alt text. Add descriptions that convey the image purpose for accessibility.',
    ],
    affectedArea: 'images',
  },

  // High Impact - Many images without alt
  {
    id: 'images-many-missing-alt',
    category: 'images',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.imagesWithoutAlt || 0) > 5,
    templates: [
      'Accessibility alert: {{imagesWithoutAlt}} images without alt text. Audit all images and add meaningful descriptions.',
      'Critical: {{imagesWithoutAlt}} images need alt attributes. This impacts both accessibility compliance and search rankings.',
    ],
  },

  // High Impact - Oversized images
  {
    id: 'images-oversized',
    category: 'images',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.oversizedImages || 0) > 0,
    templates: [
      'Resize {{oversizedImages}} oversized images to their display dimensions. Serving larger images than needed wastes bandwidth.',
      'Compress {{oversizedImages}} images that exceed their container size. This directly impacts page load speed.',
      '{{oversizedImages}} images are larger than displayed. Resize to actual dimensions to cut page weight.',
    ],
    affectedArea: 'images',
  },

  // High Impact - Non-modern formats
  {
    id: 'images-use-modern-formats',
    category: 'images',
    impact: 'High',
    condition: (ctx: RecommendationContext) => (ctx.nonModernFormatCount || 0) > 3,
    templates: [
      'Convert {{nonModernFormatCount}} images from JPG/PNG to WebP format. WebP provides 25-35% better compression.',
      'Switch {{nonModernFormatCount}} legacy format images to WebP or AVIF. Modern formats load significantly faster.',
      'Migrate {{nonModernFormatCount}} images to WebP. This single change can reduce image payload by 30%.',
    ],
    affectedArea: 'images',
  },

  // Medium Impact - Some non-modern formats
  {
    id: 'images-consider-modern-formats',
    category: 'images',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) =>
      (ctx.nonModernFormatCount || 0) > 0 && (ctx.nonModernFormatCount || 0) <= 3,
    templates: [
      'Convert remaining {{nonModernFormatCount}} JPG/PNG images to WebP for better compression.',
      'Use WebP format for {{nonModernFormatCount}} more images to optimize load time.',
    ],
  },

  // Medium Impact - Add responsive images
  {
    id: 'images-add-srcset',
    category: 'images',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.totalImages || 0) > 3,
    templates: [
      'Add srcset and sizes attributes to serve appropriately sized images for each device.',
      'Implement responsive images with srcset to avoid loading desktop-sized images on mobile.',
      'Use srcset to provide multiple image resolutions. Mobile users should not download 2000px images.',
    ],
    affectedArea: 'images',
  },

  // Medium Impact - Lazy loading
  {
    id: 'images-lazy-load',
    category: 'images',
    impact: 'Medium',
    condition: (ctx: RecommendationContext) => (ctx.totalImages || 0) > 5,
    templates: [
      'Add loading="lazy" to below-fold images. With {{totalImages}} images, lazy loading significantly improves initial load.',
      'Implement lazy loading for images below the fold. Only load what users will see first.',
      'Use native lazy loading (loading="lazy") for {{totalImages}} images to defer off-screen image loading.',
    ],
  },

  // Low Impact - Blur placeholders
  {
    id: 'images-blur-placeholder',
    category: 'images',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.totalImages || 0) > 3,
    templates: [
      'Add blur-up placeholders or dominant color backgrounds while images load.',
      'Use LQIP (Low Quality Image Placeholders) to improve perceived loading speed.',
    ],
  },

  // Low Impact - Image CDN
  {
    id: 'images-use-cdn',
    category: 'images',
    impact: 'Low',
    condition: (ctx: RecommendationContext) => (ctx.totalImages || 0) > 10,
    templates: [
      'Consider an image CDN (Cloudinary, imgix) to automatically optimize and serve images at optimal quality.',
      'With {{totalImages}} images, an image CDN can automate format selection, resizing, and compression.',
    ],
  },
]
