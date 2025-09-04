import { analyzeImageOptimization } from '../image-optimization';

// Mock the puppeteer-config module
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(),
}));

const { createPuppeteerBrowser } = require('../puppeteer-config');

const mockPage = {
  goto: jest.fn(),
  evaluate: jest.fn(),
  close: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

// Helper function to create image data with responsive attributes
const createImageData = (overrides = {}) => ({
  type: 'img',
  hasLazyLoading: false,
  hasSrcset: false,
  hasSizesAttribute: false,
  loadingPriority: 'auto',
  isAboveFold: false,
  hasBlurPlaceholder: false,
  fetchPriority: 'auto',
  ...overrides
});

describe('Image Optimization Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  describe('Modern Image Formats', () => {
    it('should give perfect score for all WebP images', async () => {
      mockPage.evaluate.mockResolvedValue([
        createImageData({ src: 'https://example.com/image1.webp', alt: 'Alt text 1', width: 800, height: 600, hasSrcset: true, hasSizesAttribute: true, isAboveFold: true, hasBlurPlaceholder: true, fetchPriority: 'high', loadingPriority: 'eager' }),
        createImageData({ src: 'https://example.com/image2.webp', alt: 'Alt text 2', width: 400, height: 300, hasSrcset: true, hasSizesAttribute: true, hasLazyLoading: true, loadingPriority: 'lazy', hasBlurPlaceholder: true })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.score).toBe(100);
      expect(result.totalImages).toBe(2);
      expect(result.modernFormats).toBe(2);
      expect(result.withAltText).toBe(2);
      expect(result.appropriatelySized).toBe(2);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect mixed format usage', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/modern.webp', alt: 'Modern image', width: 400, height: 300 },
        { src: 'https://example.com/legacy.jpg', alt: 'Legacy image', width: 800, height: 600 },
        { src: 'https://example.com/old.png', alt: 'Old image', width: 200, height: 150 }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(3);
      expect(result.modernFormats).toBe(1);
      expect(result.withAltText).toBe(3);
      expect(result.score).toBeLessThan(100);
      expect(result.issues).toContain('2 images using legacy formats (JPG/PNG)');
      expect(result.recommendations).toContain('Convert JPG/PNG images to WebP or AVIF for better compression');
    });

    it('should recognize AVIF as modern format', async () => {
      mockPage.evaluate.mockResolvedValue([
        createImageData({ src: 'https://example.com/ultra-modern.avif', alt: 'Ultra modern', width: 800, height: 600, hasSrcset: true, hasSizesAttribute: true, isAboveFold: true, hasBlurPlaceholder: true, fetchPriority: 'high', loadingPriority: 'eager' })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.modernFormats).toBe(1);
      expect(result.score).toBe(100);
    });
  });

  describe('Alt Text Analysis', () => {
    it('should penalize missing alt text', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/good.webp', alt: 'Descriptive alt text', width: 400, height: 300 },
        { src: 'https://example.com/bad.webp', alt: '', width: 400, height: 300 },
        { src: 'https://example.com/missing.webp', alt: null, width: 400, height: 300 }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(3);
      expect(result.withAltText).toBe(1);
      expect(result.score).toBeLessThan(100);
      expect(result.issues).toContain('2 images missing descriptive alt text');
      expect(result.recommendations).toContain('Add descriptive alt text to all images for accessibility');
    });

    it('should not penalize decorative images with empty alt', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/content.webp', alt: 'Important content image', width: 400, height: 300 },
        { src: 'https://example.com/decoration.webp', alt: '', width: 50, height: 50, role: 'presentation' }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.withAltText).toBe(2); // Both count as properly handled
      expect(result.issues.filter(issue => issue.includes('alt text'))).toHaveLength(0);
    });
  });

  describe('Image Sizing Analysis', () => {
    it('should detect oversized images', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/huge.webp', alt: 'Huge image', width: 4000, height: 3000 },
        { src: 'https://example.com/reasonable.webp', alt: 'Good size', width: 800, height: 600 }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(2);
      expect(result.appropriatelySized).toBe(1);
      expect(result.issues).toContain('1 images may be oversized (>2000px width/height)');
      expect(result.recommendations).toContain('Resize large images to appropriate dimensions for web display');
    });

    it('should handle missing dimensions gracefully', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/no-dims.webp', alt: 'No dimensions', width: 0, height: 0 }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.appropriatelySized).toBe(0);
      expect(result.issues).toContain('1 images have unknown dimensions');
    });
  });

  describe('Comprehensive Scoring', () => {
    it('should calculate score based on weighted criteria', async () => {
      mockPage.evaluate.mockResolvedValue([
        // Perfect image
        { src: 'https://example.com/perfect.webp', alt: 'Perfect image', width: 800, height: 600 },
        // Legacy format but good alt and size
        { src: 'https://example.com/legacy.jpg', alt: 'Legacy but good', width: 400, height: 300 },
        // Modern format but no alt
        { src: 'https://example.com/no-alt.webp', alt: '', width: 600, height: 400 },
        // Oversized legacy
        { src: 'https://example.com/big-old.png', alt: 'Big old image', width: 3000, height: 2000 }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(4);
      expect(result.modernFormats).toBe(2); // webp images
      expect(result.withAltText).toBe(3); // perfect, legacy, and big-old have alt text
      expect(result.appropriatelySized).toBe(3); // all but the 3000px one
      
      // Score should be between 0-100, penalized for issues
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle pages with no images by returning N/A status', async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(0);
      expect(result.score).toBe(null); // N/A instead of perfect score
      expect(result.status).toBe('not_applicable');
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toContain('Consider adding relevant images if appropriate for your content');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockPage.goto.mockRejectedValue(new Error('Network error'));

      const result = await analyzeImageOptimization('https://invalid-url.com');

      expect(result.score).toBe(0);
      expect(result.totalImages).toBe(0);
      expect(result.issues).toContain('Failed to analyze images: Network error');
    });

    it('should handle page evaluation errors', async () => {
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.evaluate.mockRejectedValue(new Error('Page evaluation failed'));

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.score).toBe(0);
      expect(result.issues).toContain('Failed to analyze images: Page evaluation failed');
    });
  });

  describe('Real-world Examples', () => {
    it('should analyze example.com correctly', async () => {
      // Mock example.com's actual image structure (it has no images)
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.evaluate.mockResolvedValue([]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(0);
      expect(result.score).toBe(null);
      expect(result.status).toBe('not_applicable');
      expect(result.recommendations).toContain('Consider adding relevant images if appropriate for your content');
    });

    it('should handle typical e-commerce site', async () => {
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.evaluate.mockResolvedValue([
        // Product images - mixed quality
        { src: 'https://shop.com/product1.jpg', alt: 'Product 1 Description', width: 800, height: 800 },
        { src: 'https://shop.com/product2.webp', alt: 'Product 2 Description', width: 600, height: 600 },
        { src: 'https://shop.com/banner.png', alt: '', width: 1920, height: 500 }, // Decorative banner
        { src: 'https://shop.com/logo.svg', alt: 'Company Logo', width: 200, height: 100 }
      ]);

      const result = await analyzeImageOptimization('https://shop.com');

      expect(result.totalImages).toBe(4);
      expect(result.modernFormats).toBe(1); // Only WebP counts as modern for raster images
      expect(result.withAltText).toBe(3); // Logo and products have alt, banner is missing alt but not decorative
      expect(result.appropriatelySized).toBe(4); // All within reasonable bounds
    });
  });

  describe('CSS Background Image Detection', () => {
    it('should detect CSS background images with proper alt handling', async () => {
      mockPage.evaluate.mockResolvedValue([
        // Regular img tag
        { src: 'https://example.com/content.webp', alt: 'Content image', width: 800, height: 600, type: 'img' },
        // CSS background with alt (content image)
        { src: 'https://example.com/hero-bg.jpg', alt: 'Hero background with people', width: 1920, height: 600, type: 'background' },
        // CSS background without alt (decorative, small)
        { src: 'https://example.com/pattern.png', alt: null, width: 50, height: 50, type: 'background' }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(3);
      expect(result.modernFormats).toBe(1); // Only WebP counts as modern
      expect(result.withAltText).toBe(3); // Content image + background with alt + small decorative background (assumed OK)
      expect(result.appropriatelySized).toBe(3); // All within bounds
      expect(result.status).toBe('analyzed');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should properly handle large CSS background images without alt', async () => {
      mockPage.evaluate.mockResolvedValue([
        // Large CSS background without alt (should be flagged)
        { src: 'https://example.com/large-hero.jpg', alt: null, width: 1920, height: 800, type: 'background' },
        // Small CSS background without alt (should be OK)
        { src: 'https://example.com/icon.png', alt: null, width: 32, height: 32, type: 'background' }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(2);
      expect(result.withAltText).toBe(1); // Only the small decorative one is considered properly handled
      expect(result.issues).toContain('1 images missing descriptive alt text');
    });

    it('should handle CSS backgrounds with role=presentation', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/decorative.jpg', alt: null, width: 500, height: 300, type: 'background', role: 'presentation' }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(1);
      expect(result.withAltText).toBe(1); // Decorative with role=presentation is OK
      expect(result.issues.filter(issue => issue.includes('alt text'))).toHaveLength(0);
    });

    it('should handle mixed img tags and CSS backgrounds', async () => {
      mockPage.evaluate.mockResolvedValue([
        // Mix of img tags and CSS backgrounds
        { src: 'https://example.com/product.webp', alt: 'Product photo', width: 400, height: 400, type: 'img' },
        { src: 'https://example.com/hero.jpg', alt: '', width: 32, height: 32, type: 'img', role: 'presentation' },
        { src: 'https://example.com/bg-pattern.png', alt: null, width: 100, height: 100, type: 'background' },
        { src: 'https://example.com/hero-bg.webp', alt: 'Team working together', width: 1600, height: 600, type: 'background' }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(4);
      expect(result.modernFormats).toBe(2); // Two WebP images
      expect(result.withAltText).toBe(4); // All should be considered properly handled
      expect(result.status).toBe('analyzed');
    });
  });

  describe('Responsive Image Analysis', () => {
    it('should detect responsive images with srcset and sizes', async () => {
      mockPage.evaluate.mockResolvedValue([
        createImageData({ src: 'https://example.com/responsive.webp', alt: 'Responsive image', width: 800, height: 600, hasSrcset: true, hasSizesAttribute: true }),
        createImageData({ src: 'https://example.com/non-responsive.webp', alt: 'Non-responsive image', width: 800, height: 600, hasSrcset: false, hasSizesAttribute: false })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.responsiveImages).toBe(1);
      expect(result.issues).toContain('1 images missing responsive attributes (srcset/sizes)');
      expect(result.recommendations).toContain('Add srcset and sizes attributes to images for responsive loading');
    });

    it('should detect proper loading strategies', async () => {
      mockPage.evaluate.mockResolvedValue([
        // Above-fold image with proper loading (eager/not lazy)
        createImageData({ src: 'https://example.com/above-fold.webp', alt: 'Above fold', width: 800, height: 600, isAboveFold: true, loadingPriority: 'eager', hasLazyLoading: false }),
        // Below-fold image with proper loading (lazy)
        createImageData({ src: 'https://example.com/below-fold.webp', alt: 'Below fold', width: 800, height: 600, isAboveFold: false, loadingPriority: 'lazy', hasLazyLoading: true }),
        // Above-fold image with WRONG loading (lazy)
        createImageData({ src: 'https://example.com/wrong-above.webp', alt: 'Wrong above', width: 800, height: 600, isAboveFold: true, loadingPriority: 'lazy', hasLazyLoading: true }),
        // Below-fold image with WRONG loading (not lazy)
        createImageData({ src: 'https://example.com/wrong-below.webp', alt: 'Wrong below', width: 800, height: 600, isAboveFold: false, loadingPriority: 'auto', hasLazyLoading: false })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.properlyLoadedImages).toBe(2);
      expect(result.aboveFoldImages).toBe(2);
      expect(result.issues).toContain('2 images have suboptimal loading strategy');
      expect(result.recommendations).toContain('Use loading="lazy" for below-fold images and loading="eager" for above-fold images');
    });

    it('should track fetch priority usage for above-fold images', async () => {
      mockPage.evaluate.mockResolvedValue([
        // Above-fold image with high priority
        createImageData({ src: 'https://example.com/priority-high.webp', alt: 'High priority', width: 800, height: 600, isAboveFold: true, fetchPriority: 'high' }),
        // Above-fold image without priority
        createImageData({ src: 'https://example.com/no-priority.webp', alt: 'No priority', width: 800, height: 600, isAboveFold: true, fetchPriority: 'auto' }),
        // Below-fold image (priority doesn't matter)
        createImageData({ src: 'https://example.com/below.webp', alt: 'Below fold', width: 800, height: 600, isAboveFold: false, fetchPriority: 'auto' })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.aboveFoldImages).toBe(2);
      expect(result.details.fetchPriorityUsage.high).toBe(1);
      expect(result.details.fetchPriorityUsage.auto).toBe(2);
      expect(result.issues).toContain('1 above-fold images missing fetchpriority="high"');
      expect(result.recommendations).toContain('Add fetchpriority="high" to above-fold images for faster loading');
    });

    it('should track placeholder usage', async () => {
      mockPage.evaluate.mockResolvedValue([
        createImageData({ src: 'https://example.com/with-placeholder.webp', alt: 'With placeholder', width: 800, height: 600, hasBlurPlaceholder: true }),
        createImageData({ src: 'https://example.com/without-placeholder.webp', alt: 'Without placeholder', width: 800, height: 600, hasBlurPlaceholder: false })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.details.placeholderUsage).toBe(1);
      expect(result.recommendations).toContain('Consider adding blur placeholders to more images for better perceived performance');
    });

    it('should provide proper loading strategy breakdown', async () => {
      mockPage.evaluate.mockResolvedValue([
        createImageData({ src: 'https://example.com/eager.webp', alt: 'Eager', width: 800, height: 600, loadingPriority: 'eager' }),
        createImageData({ src: 'https://example.com/lazy.webp', alt: 'Lazy', width: 800, height: 600, loadingPriority: 'lazy' }),
        createImageData({ src: 'https://example.com/auto.webp', alt: 'Auto', width: 800, height: 600, loadingPriority: 'auto' })
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.details.loadingStrategies.eager).toBe(1);
      expect(result.details.loadingStrategies.lazy).toBe(1);
      expect(result.details.loadingStrategies.auto).toBe(1);
    });
  });
});