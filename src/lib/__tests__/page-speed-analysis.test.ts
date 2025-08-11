import { analyzePageSpeed } from '../page-speed-analysis';

// Mock the page-speed-puppeteer module instead of Lighthouse
jest.mock('../page-speed-puppeteer', () => ({
  analyzePageSpeedPuppeteer: jest.fn()
}));

const { analyzePageSpeedPuppeteer } = require('../page-speed-puppeteer');

describe('Page Speed Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Suppress console logs in tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzePageSpeed', () => {
    it('should return perfect score with marketing-friendly metrics', async () => {
      // Mock excellent Puppeteer results
      analyzePageSpeedPuppeteer.mockResolvedValue({
        score: 95,
        metrics: {
          lcp: 1200,
          fcp: 800,
          cls: 0.05,
          tbt: 50,
          domContentLoaded: 500,
          loadComplete: 1200,
          resourceCount: 30,
          totalSize: 1500000 // 1.5MB
        },
        issues: [],
        recommendations: ['Excellent performance! Monitor regularly and maintain optimization practices'],
        loadTime: 3000
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(95);
      expect(result.metrics.loadTime).toBe(1.2); // Converted to seconds
      expect(result.metrics.speedDescription).toContain('Lightning fast');
      expect(result.metrics.relativeTo).toBe('Faster than 90% of websites');
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations.join(' ')).toContain('Great job');
    });

    it('should return good score with moderate performance', async () => {
      // Mock decent Puppeteer results
      analyzePageSpeedPuppeteer.mockResolvedValue({
        score: 82,
        metrics: {
          lcp: 2200,
          fcp: 1200,
          cls: 0.08,
          tbt: 150,
          domContentLoaded: 800,
          loadComplete: 2200,
          resourceCount: 45,
          totalSize: 2500000 // 2.5MB
        },
        issues: ['Moderate loading speed - room for improvement'],
        recommendations: ['Optimize above-the-fold content to improve first impressions'],
        loadTime: 4000
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(82);
      expect(result.metrics.loadTime).toBe(2.2); // Converted to seconds
      expect(result.metrics.speedDescription).toContain('Very fast');
      expect(result.metrics.relativeTo).toBe('Faster than 75% of websites');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should return poor score for bad performance', async () => {
      // Mock poor Puppeteer results
      analyzePageSpeedPuppeteer.mockResolvedValue({
        score: 24,
        metrics: {
          lcp: 4500,
          fcp: 2500,
          cls: 0.25,
          tbt: 600,
          domContentLoaded: 2000,
          loadComplete: 4500,
          resourceCount: 120,
          totalSize: 8000000 // 8MB
        },
        issues: [
          'Poor LCP: 4500ms (should be ≤ 2500ms)',
          'Poor CLS: 0.350 (should be ≤ 0.1)'
        ],
        recommendations: [
          'Optimize your main images and content to load faster',
          'Fix layout shifts to improve user experience',
          'Combine and optimize your website files'
        ],
        loadTime: 6000
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(24);
      expect(result.metrics.loadTime).toBe(4.5); // Converted to seconds
      expect(result.metrics.speedDescription).toContain('Slow');
      expect(result.metrics.relativeTo).toBe('Slower than most websites');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      // LCP mapping present
      expect(result.issues.join(' ')).toContain('loads slowly');
    });

    it('should handle analysis errors gracefully', async () => {
      analyzePageSpeedPuppeteer.mockRejectedValue(new Error('Browser connection failed'));

      const result = await analyzePageSpeed('https://invalid-url.com');
      
      expect(result.score).toBe(0);
      expect(result.metrics.speedDescription).toBe('Unable to measure');
      expect(result.issues).toContain('Page speed analysis temporarily unavailable');
      expect(result.recommendations).toContain('Please try again in a few minutes');
    });

    it('should convert marketing recommendations properly', async () => {
      analyzePageSpeedPuppeteer.mockResolvedValue({
        score: 46,
        metrics: {
          lcp: 4500,
          fcp: 1000,
          cls: 0.35,
          tbt: 400,
          domContentLoaded: 2000,
          loadComplete: 4500,
          resourceCount: 50,
          totalSize: 3000000
        },
        issues: [
          'Poor LCP: 4500ms (should be ≤ 2500ms)',
          'Poor CLS: 0.350 (should be ≤ 0.1)'
        ],
        recommendations: [
          'Optimize largest content element (images, hero sections)',
          'Add size attributes to images and videos',
          'Use image optimization and modern formats (WebP/AVIF)'
        ],
        loadTime: 6000
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.issues).toContain('Main content loads slowly - visitors may leave before seeing your page');
      expect(result.issues).toContain('Page elements shift around - creates confusing user experience');
      expect(result.recommendations).toContain('Optimize images to load faster and keep visitors engaged');
    });

    it('should respect custom options', async () => {
      analyzePageSpeedPuppeteer.mockResolvedValue({
        score: 80,
        metrics: {
          lcp: 2000,
          fcp: 1000,
          cls: 0.05,
          tbt: 100,
          domContentLoaded: 1000,
          loadComplete: 2000,
          resourceCount: 30,
          totalSize: 2000000
        },
        issues: [],
        recommendations: [],
        loadTime: 3000
      });

      await analyzePageSpeed('https://example.com', {
        viewport: { width: 390, height: 844 },
        throttling: 'mobile'
      });

      // Verify Puppeteer analyzer was called with correct options
      expect(analyzePageSpeedPuppeteer).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          viewport: { width: 390, height: 844 },
          throttling: 'mobile'
        })
      );
    });
  });
});