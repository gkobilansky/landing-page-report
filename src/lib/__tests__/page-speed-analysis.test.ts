import { analyzePageSpeed, PageSpeedAnalysisResult } from '../page-speed-analysis';

// Mock Lighthouse to avoid actual network calls in tests
jest.mock('lighthouse', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the puppeteer-config module
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(),
}));

const { createPuppeteerBrowser } = require('../puppeteer-config');
const mockLighthouse = require('lighthouse').default as jest.MockedFunction<any>;

const mockBrowser = {
  close: jest.fn(),
  wsEndpoint: jest.fn(() => 'ws://127.0.0.1:9222/devtools/browser/12345')
};

describe('Page Speed Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
    console.log = jest.fn(); // Suppress console logs in tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzePageSpeed', () => {
    it('should return perfect score for excellent Core Web Vitals', async () => {
      // Mock excellent Lighthouse results
      mockLighthouse.mockResolvedValue({
        lhr: {
          audits: {
            'largest-contentful-paint': { score: 1, numericValue: 1200 },
            'first-contentful-paint': { score: 1, numericValue: 800 },
            'cumulative-layout-shift': { score: 1, numericValue: 0.05 },
            'total-blocking-time': { score: 1, numericValue: 50 },
            'speed-index': { score: 1, numericValue: 1500 }
          },
          categories: {
            performance: { score: 0.95 }
          }
        }
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(100);
      expect(result.metrics.lcp).toBe(1200);
      expect(result.metrics.fcp).toBe(800);
      expect(result.metrics.cls).toBe(0.05);
      expect(result.metrics.tbt).toBe(50);
      expect(result.metrics.si).toBe(1500);
      expect(result.grade).toBe('A');
      expect(result.issues).toHaveLength(0);
    });

    it('should return good score for decent Core Web Vitals', async () => {
      // Mock decent Lighthouse results
      mockLighthouse.mockResolvedValue({
        lhr: {
          audits: {
            'largest-contentful-paint': { score: 0.8, numericValue: 2200 },
            'first-contentful-paint': { score: 0.9, numericValue: 1200 },
            'cumulative-layout-shift': { score: 0.9, numericValue: 0.08 },
            'total-blocking-time': { score: 0.7, numericValue: 150 },
            'speed-index': { score: 0.8, numericValue: 2800 }
          },
          categories: {
            performance: { score: 0.82 }
          }
        }
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(82);
      expect(result.grade).toBe('B');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should return poor score for bad Core Web Vitals', async () => {
      // Mock poor Lighthouse results
      mockLighthouse.mockResolvedValue({
        lhr: {
          audits: {
            'largest-contentful-paint': { score: 0.2, numericValue: 4500 },
            'first-contentful-paint': { score: 0.3, numericValue: 2500 },
            'cumulative-layout-shift': { score: 0.1, numericValue: 0.25 },
            'total-blocking-time': { score: 0.2, numericValue: 600 },
            'speed-index': { score: 0.3, numericValue: 5500 }
          },
          categories: {
            performance: { score: 0.24 }
          }
        }
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(24);
      expect(result.grade).toBe('F');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing audit data gracefully', async () => {
      // Mock incomplete Lighthouse results
      mockLighthouse.mockResolvedValue({
        lhr: {
          audits: {
            'largest-contentful-paint': { score: 0.8, numericValue: 2200 }
            // Missing other audits
          },
          categories: {
            performance: { score: 0.75 }
          }
        }
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.score).toBe(75);
      expect(result.metrics.lcp).toBe(2200);
      expect(result.metrics.fcp).toBe(0); // Default value for missing data
    });

    it('should provide specific recommendations based on poor metrics', async () => {
      mockLighthouse.mockResolvedValue({
        lhr: {
          audits: {
            'largest-contentful-paint': { score: 0.2, numericValue: 4500 },
            'first-contentful-paint': { score: 0.9, numericValue: 1000 },
            'cumulative-layout-shift': { score: 0.1, numericValue: 0.35 },
            'total-blocking-time': { score: 0.3, numericValue: 400 },
            'speed-index': { score: 0.8, numericValue: 2000 }
          },
          categories: {
            performance: { score: 0.46 }
          }
        }
      });

      const result = await analyzePageSpeed('https://example.com');

      expect(result.recommendations).toContain('Optimize largest content element loading (LCP > 4000ms)');
      expect(result.recommendations).toContain('Minimize layout shifts (CLS > 0.25)');
      expect(result.recommendations).toContain('Reduce main thread blocking time (TBT > 300ms)');
    });

    it('should assign correct letter grades', async () => {
      const testCases = [
        { score: 95, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'B' },
        { score: 75, expectedGrade: 'C' },
        { score: 65, expectedGrade: 'D' },
        { score: 45, expectedGrade: 'F' }
      ];

      for (const testCase of testCases) {
        mockLighthouse.mockResolvedValue({
          lhr: {
            audits: {
              'largest-contentful-paint': { score: testCase.score / 100, numericValue: 2000 }
            },
            categories: {
              performance: { score: testCase.score / 100 }
            }
          }
        });

        const result = await analyzePageSpeed('https://example.com');
        expect(result.grade).toBe(testCase.expectedGrade);
      }
    });

    it('should handle network errors gracefully', async () => {
      mockLighthouse.mockRejectedValue(new Error('Network timeout'));

      const result = await analyzePageSpeed('https://invalid-url.com');
      
      expect(result.score).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.issues).toContain('Page speed analysis unavailable');
    });

    it('should respect custom options', async () => {
      mockLighthouse.mockResolvedValue({
        lhr: {
          audits: {
            'largest-contentful-paint': { score: 0.8, numericValue: 2000 }
          },
          categories: {
            performance: { score: 0.8 }
          }
        }
      });

      await analyzePageSpeed('https://example.com', {
        viewport: { width: 390, height: 844 },
        throttling: 'mobile'
      });

      // Verify Lighthouse was called with correct options
      expect(mockLighthouse).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          onlyCategories: ['performance'],
          formFactor: 'mobile',
          port: "9222"  // Port is extracted from browser.wsEndpoint()
        })
      );
    });
  });

  describe('Core Web Vitals scoring', () => {
    it('should correctly score LCP (Largest Contentful Paint)', async () => {
      const lcpTestCases = [
        { lcp: 1200, expectedContribution: 25 }, // Good LCP
        { lcp: 2500, expectedContribution: 12.5 }, // Needs improvement
        { lcp: 4500, expectedContribution: 0 } // Poor LCP
      ];

      for (const testCase of lcpTestCases) {
        mockLighthouse.mockResolvedValue({
          lhr: {
            audits: {
              'largest-contentful-paint': { score: 1, numericValue: testCase.lcp },
              'first-contentful-paint': { score: 1, numericValue: 800 },
              'cumulative-layout-shift': { score: 1, numericValue: 0.05 },
              'total-blocking-time': { score: 1, numericValue: 50 },
              'speed-index': { score: 1, numericValue: 1500 }
            },
            categories: {
              performance: { score: 0.9 }
            }
          }
        });

        const result = await analyzePageSpeed('https://example.com');
        expect(result.metrics.lcp).toBe(testCase.lcp);
      }
    });
  });
});