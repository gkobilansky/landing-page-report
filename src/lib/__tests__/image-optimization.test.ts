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

describe('Image Optimization Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  describe('Modern Image Formats', () => {
    it('should give perfect score for all WebP images', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'https://example.com/image1.webp', alt: 'Alt text 1', width: 800, height: 600 },
        { src: 'https://example.com/image2.webp', alt: 'Alt text 2', width: 400, height: 300 }
      ]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.score).toBe(100);
      expect(result.applicable).toBe(true); // Should be applicable when images are present
      expect(result.totalImages).toBe(2);
      expect(result.modernFormats).toBe(2);
      expect(result.withAltText).toBe(2);
      expect(result.appropriatelySized).toBe(2);
      expect(result.issues).toHaveLength(0);
      expect(result.loadTime).toBeGreaterThanOrEqual(0); // Should include analysis time
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
        { src: 'https://example.com/ultra-modern.avif', alt: 'Ultra modern', width: 800, height: 600 }
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

    it('should handle pages with no images', async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const result = await analyzeImageOptimization('https://example.com');

      expect(result.totalImages).toBe(0);
      expect(result.score).toBe(null); // null when not applicable (no images)
      expect(result.applicable).toBe(false); // Not applicable when no images
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toContain('Consider adding relevant images to enhance user engagement');
      expect(result.loadTime).toBeGreaterThanOrEqual(0); // Should include analysis time
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
      expect(result.score).toBe(null); // null when not applicable (no images)
      expect(result.applicable).toBe(false); // Not applicable when no images
      expect(result.recommendations).toContain('Consider adding relevant images to enhance user engagement');
      expect(result.loadTime).toBeGreaterThanOrEqual(0); // Should include analysis time
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
});