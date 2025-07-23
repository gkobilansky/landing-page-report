import { analyzeWhitespace, WhitespaceAnalysisResult } from '../whitespace-assessment';

// Mock Jimp to avoid native dependencies
jest.mock('jimp', () => ({
  read: jest.fn(() => Promise.resolve({
    bitmap: {
      width: 1920,
      height: 1080,
      data: new Array(1920 * 1080 * 4).fill(255),
    },
    scan: jest.fn((x, y, w, h, callback) => {
      // Mock scan that simulates some content
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          const idx = ((y + dy) * w + (x + dx)) << 2;
          callback.call(this, x + dx, y + dy, idx);
        }
      }
      return this;
    }),
  })),
}));

// Mock the puppeteer-config module
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(),
}));

const { createPuppeteerBrowser } = require('../puppeteer-config');

const mockPage = {
  setViewport: jest.fn(),
  setContent: jest.fn(),
  goto: jest.fn(),
  evaluate: jest.fn()
};

const mockBrowser = {
  close: jest.fn(),
  newPage: jest.fn().mockResolvedValue(mockPage)
};

describe('Whitespace Assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
    console.log = jest.fn(); // Suppress console logs in tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeWhitespace', () => {
    it('should return perfect score for well-spaced content with adequate spacing', async () => {
      // Mock excellent whitespace metrics based on PRD requirements
      mockPage.evaluate
        .mockResolvedValueOnce({
          // Grid-based element density analysis (PRD requirement)
          gridSections: 12, // 3x4 grid
          elementDensityPerSection: [2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1], // Well distributed
          maxDensityPerSection: 4,
          averageDensityPerSection: 2.1,
          viewportWidth: 1920,
          viewportHeight: 1080
        })
        .mockResolvedValueOnce({
          // Spacing around key elements (PRD requirement)
          headlineSpacing: {
            marginTop: 32,
            marginBottom: 24,
            adequate: true
          },
          ctaSpacing: {
            marginTop: 40,
            marginBottom: 40,
            marginLeft: 20,
            marginRight: 20,
            adequate: true
          },
          contentBlockSpacing: {
            averageMarginBetween: 32,
            adequate: true
          },
          lineHeight: {
            average: 1.6,
            adequate: true
          }
        })
        .mockResolvedValueOnce({
          // Overall whitespace metrics
          totalElements: 45,
          whitespaceRatio: 0.58,
          clutterScore: 15, // Low clutter
          hasAdequateSpacing: true
        });


      const result = await analyzeWhitespace('https://example.com');

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.grade).toBe('B');
      expect(result.metrics.elementDensityPerSection.maxDensity).toBe(4);
      expect(result.metrics.spacingAnalysis.headlineSpacing.adequate).toBe(true);
      expect(result.metrics.spacingAnalysis.ctaSpacing.adequate).toBe(true);
      expect(result.metrics.whitespaceRatio).toBe(0.58);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toContain('Excellent whitespace usage! Content is well-spaced and digestible');
    });

    it('should detect cluttered layout with high element density per section', async () => {
      // Mock cluttered layout (PRD "clutter flags")
      mockPage.evaluate
        .mockResolvedValueOnce({
          gridSections: 12,
          elementDensityPerSection: [8, 12, 15, 9, 11, 14, 13, 10, 16, 12, 9, 11], // High density
          maxDensity: 16,
          averageDensity: 11.7,
          totalElements: 140,
          viewportWidth: 1920,
          viewportHeight: 1080
        })
        .mockResolvedValueOnce({
          headlineSpacing: {
            marginTop: 8,
            marginBottom: 4,
            adequate: false
          },
          ctaSpacing: {
            marginTop: 12,
            marginBottom: 8,
            marginLeft: 4,
            marginRight: 4,
            adequate: false
          },
          contentBlockSpacing: {
            averageMarginBetween: 8,
            adequate: false
          },
          lineHeight: {
            average: 1.2,
            adequate: false
          }
        })
        .mockResolvedValueOnce({
          totalElements: 140,
          whitespaceRatio: 0.25,
          viewportArea: 2073600,
          contentArea: 1555200,
          whitespaceArea: 518400,
          contentElementsFound: 140
        });


      const result = await analyzeWhitespace('https://example.com');

      expect(result.score).toBeLessThanOrEqual(30);
      expect(result.grade).toBe('F');
      expect(result.metrics.elementDensityPerSection.maxDensity).toBe(16);
      expect(result.metrics.spacingAnalysis.headlineSpacing.adequate).toBe(false);
      expect(result.metrics.spacingAnalysis.ctaSpacing.adequate).toBe(false);
      expect(result.issues).toContain('Page layout appears cluttered');
      expect(result.issues).toContain('Insufficient spacing around headlines');
      expect(result.issues).toContain('CTA elements lack adequate spacing');
      expect(result.recommendations).toContain('Reduce element density per section');
    });

    it('should analyze line height adequacy for text blocks', async () => {
      // Mock poor line height (PRD requirement)
      mockPage.evaluate
        .mockResolvedValueOnce({
          gridSections: 12,
          elementDensityPerSection: [3, 4, 2, 5, 3, 2, 4, 3, 2, 3, 4, 2],
          maxDensity: 5,
          averageDensity: 3.1,
          totalElements: 50,
          viewportWidth: 1920,
          viewportHeight: 1080
        })
        .mockResolvedValueOnce({
          headlineSpacing: {
            marginTop: 24,
            marginBottom: 16,
            adequate: true
          },
          ctaSpacing: {
            marginTop: 32,
            marginBottom: 32,
            marginLeft: 16,
            marginRight: 16,
            adequate: true
          },
          contentBlockSpacing: {
            averageMarginBetween: 24,
            adequate: true
          },
          lineHeight: {
            average: 1.1, // Too tight
            adequate: false
          }
        })
        .mockResolvedValueOnce({
          totalElements: 50,
          whitespaceRatio: 0.45,
          viewportArea: 2073600,
          contentArea: 1140480,
          whitespaceArea: 933120,
          contentElementsFound: 50
        });


      const result = await analyzeWhitespace('https://example.com');

      expect(result.score).toBeLessThanOrEqual(75);
      expect(result.issues).toContain('Line height too tight for optimal readability');
      expect(result.recommendations).toContain('Increase line height to at least 1.4 for better text readability');
    });

    it('should support HTML input for testing', async () => {
      const testHTML = `
        <html>
          <body style="margin: 0; padding: 20px;">
            <h1 style="margin: 20px 0;">Well Spaced Title</h1>
            <p style="line-height: 1.6; margin: 16px 0;">Good paragraph spacing</p>
            <button style="margin: 30px 10px; padding: 15px 30px;">CTA Button</button>
          </body>
        </html>
      `;

      mockPage.evaluate
        .mockResolvedValueOnce({
          gridSections: 12,
          elementDensityPerSection: [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
          maxDensity: 1,
          averageDensity: 0.25,
          totalElements: 3,
          viewportWidth: 1920,
          viewportHeight: 1080
        })
        .mockResolvedValueOnce({
          headlineSpacing: { marginTop: 20, marginBottom: 20, adequate: true },
          ctaSpacing: { marginTop: 30, marginBottom: 30, marginLeft: 10, marginRight: 10, adequate: true },
          contentBlockSpacing: { averageMarginBetween: 20, adequate: true },
          lineHeight: { average: 1.6, adequate: true }
        })
        .mockResolvedValueOnce({
          totalElements: 3,
          whitespaceRatio: 0.85,
          viewportArea: 2073600,
          contentArea: 311040,
          whitespaceArea: 1762560,
          contentElementsFound: 3
        });


      const result = await analyzeWhitespace(testHTML, { isHtml: true });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(mockPage.setContent).toHaveBeenCalledWith(testHTML);
      expect(mockPage.goto).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      createPuppeteerBrowser.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await analyzeWhitespace('https://invalid-url.com');

      expect(result.score).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.issues).toContain('Whitespace analysis failed due to error');
      expect(result.recommendations).toContain('Unable to analyze whitespace - please check URL accessibility');
    });

    it('should assign correct letter grades based on scores', async () => {
      // Test the grade assignment logic directly by checking actual results
      // A grade test case - expect A for scores >= 90
      mockPage.evaluate
        .mockResolvedValueOnce({
          gridSections: 12,
          elementDensityPerSection: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Very low density
          maxDensity: 1,
          averageDensity: 1,
          totalElements: 12,
          viewportWidth: 1920,
          viewportHeight: 1080
        })
        .mockResolvedValueOnce({
          headlineSpacing: { marginTop: 32, marginBottom: 24, adequate: true },
          ctaSpacing: { marginTop: 40, marginBottom: 40, marginLeft: 20, marginRight: 20, adequate: true },
          contentBlockSpacing: { averageMarginBetween: 32, adequate: true },
          lineHeight: { average: 1.6, adequate: true }
        })
        .mockResolvedValueOnce({
          totalElements: 12,
          whitespaceRatio: 0.70,
          viewportArea: 2073600,
          contentArea: 621600,
          whitespaceArea: 1452000,
          contentElementsFound: 12
        });


      const result = await analyzeWhitespace('https://example.com');
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.grade).toBe('A');
    });
  });
});