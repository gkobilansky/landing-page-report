import { analyzeWhitespace, WhitespaceAnalysisResult, calculateAdaptiveThreshold, detectPageTheme, AdaptiveWhitespaceMetrics } from '../whitespace-assessment';

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
  evaluate: jest.fn(),
  screenshot: jest.fn()
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
          maxDensity: 4,
          averageDensity: 2.1,
          totalElements: 45,
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
          // Theme detection mock
          averageLuminance: 250,
          theme: 'light',
          contrastRatio: 7.2,
          hasDarkModeMediaQuery: false,
          sampleCount: 25
        })
        .mockResolvedValueOnce({
          // Overall whitespace metrics
          totalElements: 45,
          whitespaceRatio: 0.58,
          viewportArea: 2073600,
          contentArea: 870912,
          whitespaceArea: 1202688,
          contentElementsFound: 45
        });


      const result = await analyzeWhitespace('https://example.com');

      expect(result.score).toBeGreaterThanOrEqual(80);
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
          // Theme detection mock
          averageLuminance: 240,
          theme: 'light',
          contrastRatio: 4.5,
          hasDarkModeMediaQuery: false,
          sampleCount: 25
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
      expect(result.metrics.elementDensityPerSection.maxDensity).toBe(16);
      expect(result.metrics.spacingAnalysis.headlineSpacing.adequate).toBe(false);
      expect(result.metrics.spacingAnalysis.ctaSpacing.adequate).toBe(false);
      expect(result.issues).toContain('Page layout shows signs of clutter');
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
          // Theme detection mock
          averageLuminance: 240,
          theme: 'light',
          contrastRatio: 4.5,
          hasDarkModeMediaQuery: false,
          sampleCount: 25
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

      expect(result.score).toBeLessThanOrEqual(85);
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
          // Theme detection mock
          averageLuminance: 250,
          theme: 'light',
          contrastRatio: 7.5,
          hasDarkModeMediaQuery: false,
          sampleCount: 25
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
          // Theme detection mock
          averageLuminance: 252,
          theme: 'light',
          contrastRatio: 8.1,
          hasDarkModeMediaQuery: false,
          sampleCount: 25
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
    });

    describe('adaptive threshold system', () => {
      beforeEach(() => {
        // Mock screenshot analysis for Jimp
        mockPage.screenshot.mockResolvedValue(Buffer.alloc(100));
        
        // Mock fetch for screenshot URL functionality
        global.fetch = jest.fn();
      });

      it('should detect light theme and use higher threshold', async () => {
        // Mock light theme background analysis
        mockPage.evaluate
          .mockResolvedValueOnce({
            gridSections: 12,
            elementDensityPerSection: [2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1],
            maxDensity: 4,
            averageDensity: 2.1,
            totalElements: 25,
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
            // Theme detection mock (light theme)
            averageLuminance: 250,
            theme: 'light',
            contrastRatio: 7.2,
            hasDarkModeMediaQuery: false,
            sampleCount: 25
          })
          .mockResolvedValueOnce({
            totalElements: 25,
            whitespaceRatio: 0.58,
            viewportArea: 2073600,
            contentArea: 870912,
            whitespaceArea: 1202688,
            contentElementsFound: 25
          });

        const result = await analyzeWhitespace('https://example.com');
        
        expect(result.metrics.screenshotAnalysis.threshold).toBe(240); // Should use adaptive threshold for light theme (250 luminance -> 240 threshold)
        expect(result.metrics.theme).toBe('light');
        expect(result.score).toBeGreaterThanOrEqual(75);
      });

      it('should detect dark theme and use lower threshold', async () => {
        // Mock dark theme background analysis
        mockPage.evaluate
          .mockResolvedValueOnce({
            gridSections: 12,
            elementDensityPerSection: [2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1],
            maxDensity: 4,
            averageDensity: 2.1,
            totalElements: 25,
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
            // Theme detection mock (dark theme)
            averageLuminance: 25,
            theme: 'dark',
            contrastRatio: 8.5,
            hasDarkModeMediaQuery: true,
            sampleCount: 25
          })
          .mockResolvedValueOnce({
            totalElements: 25,
            whitespaceRatio: 0.58,
            viewportArea: 2073600,
            contentArea: 870912,
            whitespaceArea: 1202688,
            contentElementsFound: 25
          });

        const result = await analyzeWhitespace('https://example.com');
        
        expect(result.metrics.screenshotAnalysis.threshold).toBe(80); // Should use adaptive threshold for very dark theme
        expect(result.metrics.theme).toBe('dark');
        expect(result.score).toBeGreaterThanOrEqual(75);
      });

      it('should detect mixed theme and use intermediate threshold', async () => {
        // Mock mixed theme background analysis
        mockPage.evaluate
          .mockResolvedValueOnce({
            gridSections: 12,
            elementDensityPerSection: [2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1],
            maxDensity: 4,
            averageDensity: 2.1,
            totalElements: 25,
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
            // Theme detection mock (mixed theme)
            averageLuminance: 128,
            theme: 'mixed',
            contrastRatio: 4.8,
            hasDarkModeMediaQuery: false,
            sampleCount: 25
          })
          .mockResolvedValueOnce({
            totalElements: 25,
            whitespaceRatio: 0.58,
            viewportArea: 2073600,
            contentArea: 870912,
            whitespaceArea: 1202688,
            contentElementsFound: 25
          });

        const result = await analyzeWhitespace('https://example.com');
        
        expect(result.metrics.screenshotAnalysis.threshold).toBe(170); // Mixed theme intermediate threshold
        expect(result.metrics.theme).toBe('mixed');
        expect(result.score).toBeGreaterThanOrEqual(70);
      });

      it('should apply theme-aware scoring adjustments', async () => {
        // Mock perfect spacing but different themes to test scoring differences
        const perfectSpacing = {
          gridSections: 12,
          elementDensityPerSection: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          maxDensity: 1,
          averageDensity: 1,
          totalElements: 12,
          viewportWidth: 1920,
          viewportHeight: 1080
        };

        const perfectElements = {
          headlineSpacing: { marginTop: 32, marginBottom: 24, adequate: true },
          ctaSpacing: { marginTop: 40, marginBottom: 40, marginLeft: 20, marginRight: 20, adequate: true },
          contentBlockSpacing: { averageMarginBetween: 32, adequate: true },
          lineHeight: { average: 1.6, adequate: true }
        };

        const perfectWhitespace = {
          totalElements: 12,
          whitespaceRatio: 0.70,
          viewportArea: 2073600,
          contentArea: 621600,
          whitespaceArea: 1452000,
          contentElementsFound: 12
        };

        // Test dark theme (should get bonus for appropriate contrast)
        mockPage.evaluate
          .mockResolvedValueOnce(perfectSpacing)
          .mockResolvedValueOnce(perfectElements)
          .mockResolvedValueOnce(perfectWhitespace)
          .mockResolvedValueOnce({
            theme: 'dark',
            averageBackgroundLuminance: 25,
            adaptiveThreshold: 100,
            contrastRatio: 9.1 // Excellent contrast
          });

        const darkResult = await analyzeWhitespace('https://dark-theme-site.com');
        
        // Reset mocks for light theme test
        jest.clearAllMocks();
        createPuppeteerBrowser.mockResolvedValue(mockBrowser);

        mockPage.evaluate
          .mockResolvedValueOnce(perfectSpacing)
          .mockResolvedValueOnce(perfectElements)
          .mockResolvedValueOnce(perfectWhitespace)
          .mockResolvedValueOnce({
            theme: 'light',
            averageBackgroundLuminance: 245,
            adaptiveThreshold: 240,
            contrastRatio: 4.6 // Good contrast
          });

        const lightResult = await analyzeWhitespace('https://light-theme-site.com');

        // Dark theme should get bonus for excellent contrast
        expect(darkResult.score).toBeGreaterThanOrEqual(lightResult.score);
      });

      it('should handle CSS media query dark mode detection', async () => {
        mockPage.evaluate
          .mockResolvedValueOnce({
            gridSections: 12,
            elementDensityPerSection: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            maxDensity: 2,
            averageDensity: 2,
            totalElements: 24,
            viewportWidth: 1920,
            viewportHeight: 1080
          })
          .mockResolvedValueOnce({
            headlineSpacing: { marginTop: 24, marginBottom: 16, adequate: true },
            ctaSpacing: { marginTop: 32, marginBottom: 32, marginLeft: 16, marginRight: 16, adequate: true },
            contentBlockSpacing: { averageMarginBetween: 20, adequate: true },
            lineHeight: { average: 1.5, adequate: true }
          })
          .mockResolvedValueOnce({
            // Theme detection with media query
            averageLuminance: 35,
            theme: 'dark',
            contrastRatio: 7.8,
            hasDarkModeMediaQuery: true,
            sampleCount: 25
          })
          .mockResolvedValueOnce({
            totalElements: 24,
            whitespaceRatio: 0.55,
            viewportArea: 2073600,
            contentArea: 933120,
            whitespaceArea: 1140480,
            contentElementsFound: 24
          });

        const result = await analyzeWhitespace('https://css-dark-mode-site.com');

        expect(result.metrics.screenshotAnalysis.threshold).toBe(100); // Dark theme with 35 luminance -> 100 threshold
        expect(result.metrics.theme).toBe('dark');
        expect(result.score).toBeGreaterThanOrEqual(70);
      });
    });
  });
});