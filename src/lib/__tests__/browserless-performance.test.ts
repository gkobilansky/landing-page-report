import {
  fetchBrowserlessPerformance,
  isBrowserlessAvailable,
} from '../browserless-performance';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Browserless Performance API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    console.log = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('isBrowserlessAvailable', () => {
    it('should return true when in production with BLESS_KEY', () => {
      process.env.NODE_ENV = 'production';
      process.env.BLESS_KEY = 'test-token';
      expect(isBrowserlessAvailable()).toBe(true);
    });

    it('should return false when not in production', () => {
      process.env.NODE_ENV = 'development';
      process.env.BLESS_KEY = 'test-token';
      expect(isBrowserlessAvailable()).toBe(false);
    });

    it('should return false when BLESS_KEY is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.BLESS_KEY;
      expect(isBrowserlessAvailable()).toBe(false);
    });

    it('should return false when both conditions are not met', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.BLESS_KEY;
      expect(isBrowserlessAvailable()).toBe(false);
    });
  });

  describe('fetchBrowserlessPerformance', () => {
    const mockLighthouseResponse = {
      audits: {
        'largest-contentful-paint': {
          id: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          score: 0.95,
          numericValue: 1200,
        },
        'first-contentful-paint': {
          id: 'first-contentful-paint',
          title: 'First Contentful Paint',
          score: 0.98,
          numericValue: 800,
        },
        'cumulative-layout-shift': {
          id: 'cumulative-layout-shift',
          title: 'Cumulative Layout Shift',
          score: 1.0,
          numericValue: 0.02,
        },
        'total-blocking-time': {
          id: 'total-blocking-time',
          title: 'Total Blocking Time',
          score: 0.9,
          numericValue: 150,
        },
        'server-response-time': {
          id: 'server-response-time',
          title: 'Server Response Time',
          score: 1.0,
          numericValue: 50,
        },
        'speed-index': {
          id: 'speed-index',
          title: 'Speed Index',
          score: 0.95,
          numericValue: 1500,
        },
      },
      categories: {
        performance: {
          id: 'performance',
          title: 'Performance',
          score: 0.95,
        },
      },
    };

    it('should fetch and parse performance metrics successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLighthouseResponse,
      });

      const result = await fetchBrowserlessPerformance('https://example.com', {
        token: 'test-token',
      });

      expect(result.metrics).toEqual({
        lcp: 1200,
        fcp: 800,
        cls: 0.02,
        tbt: 150,
        ttfb: 50,
        speedIndex: 1500,
        performanceScore: 95,
      });

      // Verify fetch was called with correct params
      expect(mockFetch).toHaveBeenCalledWith(
        'https://production-sfo.browserless.io/performance?token=test-token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );

      // Verify request body
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.url).toBe('https://example.com');
      expect(body.config.settings.onlyCategories).toContain('performance');
    });

    it('should handle missing audit values gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audits: {
            'largest-contentful-paint': {
              id: 'largest-contentful-paint',
              title: 'LCP',
              score: 0.9,
              // numericValue missing
            },
          },
          categories: {
            performance: {
              id: 'performance',
              title: 'Performance',
              score: 0.85,
            },
          },
        }),
      });

      const result = await fetchBrowserlessPerformance('https://example.com', {
        token: 'test-token',
      });

      // Missing metrics should default to 0
      expect(result.metrics.lcp).toBe(0);
      expect(result.metrics.fcp).toBe(0);
      expect(result.metrics.performanceScore).toBe(85);
    });

    it('should calculate fallback score when categories are missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audits: {
            'largest-contentful-paint': { numericValue: 2000 },
            'first-contentful-paint': { numericValue: 1000 },
            'cumulative-layout-shift': { numericValue: 0.05 },
            'total-blocking-time': { numericValue: 200 },
            'speed-index': { numericValue: 3000 },
          },
          // No categories
        }),
      });

      const result = await fetchBrowserlessPerformance('https://example.com', {
        token: 'test-token',
      });

      // Should have calculated a fallback score
      expect(result.metrics.performanceScore).toBeGreaterThan(0);
      expect(result.metrics.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        fetchBrowserlessPerformance('https://example.com', { token: 'test-token' })
      ).rejects.toThrow('Browserless API error (500): Internal Server Error');
    });

    it('should handle timeout', async () => {
      // Mock a fetch that never resolves
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      await expect(
        fetchBrowserlessPerformance('https://example.com', {
          token: 'test-token',
          timeout: 100, // Very short timeout for testing
        })
      ).rejects.toThrow('Browserless performance API timeout');
    });

    it('should round CLS to 3 decimal places', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audits: {
            'cumulative-layout-shift': { numericValue: 0.123456789 },
          },
          categories: {
            performance: { score: 0.9 },
          },
        }),
      });

      const result = await fetchBrowserlessPerformance('https://example.com', {
        token: 'test-token',
      });

      expect(result.metrics.cls).toBe(0.123);
    });

    it('should include raw audits in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLighthouseResponse,
      });

      const result = await fetchBrowserlessPerformance('https://example.com', {
        token: 'test-token',
      });

      expect(result.rawAudits).toBeDefined();
      expect(result.rawAudits!['largest-contentful-paint']).toBeDefined();
    });
  });
});
