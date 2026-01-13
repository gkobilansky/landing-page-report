import { analyzeFontUsage } from '../font-analysis'

// Mock the puppeteer-config module
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(),
}));

const { createPuppeteerBrowser } = require('../puppeteer-config');

const mockPage = {
  goto: jest.fn(),
  evaluate: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

// Helper to create mock font data response
const createFontData = (fontDeclarations: string[], options: {
  variableFonts?: Array<{ fontFamily: string; variationAxes: string[] }>;
  loadingStrategies?: Array<{ fontFamily: string; fontDisplay?: string; preloaded: boolean }>;
  subsettingDetected?: boolean;
  preloadedFontsCount?: number;
} = {}) => ({
  fontDeclarations,
  variableFonts: options.variableFonts || [],
  loadingStrategies: options.loadingStrategies || [],
  subsettingDetected: options.subsettingDetected || false,
  preloadedFontsCount: options.preloadedFontsCount || 0
});

describe('Font Usage Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  test('should detect font families from example.com', async () => {
    // Mock example.com's single font-family declaration
    mockPage.evaluate.mockResolvedValue(createFontData(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif']));

    const result = await analyzeFontUsage('https://example.com')

    expect(result).toEqual({
      fontFamilies: expect.any(Array),
      fontCount: expect.any(Number),
      systemFontCount: expect.any(Number),
      webFontCount: expect.any(Number),
      score: expect.any(Number),
      issues: expect.any(Array),
      recommendations: expect.any(Array),
      variableFonts: expect.any(Array),
      fontLoadingStrategies: expect.any(Array),
      performanceImpact: expect.any(Object),
      subsettingDetected: expect.any(Boolean)
    })

    // Should detect exactly 1 font-family declaration for example.com
    expect(result.fontCount).toBe(1)
    expect(result.fontFamilies.length).toBe(1)
    expect(result.fontFamilies[0]).toContain('system') // Should contain system font indicators
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  }, 10000)

  test('should give high score for single system font family', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif']));

    const result = await analyzeFontUsage('https://example.com')

    // Single system font family should get high score
    expect(result.fontCount).toBe(1)
    expect(result.systemFontCount).toBe(1)
    expect(result.webFontCount).toBe(0)
    expect(result.score).toBeGreaterThanOrEqual(95) // High score for system fonts
    expect(result.score).toBeLessThanOrEqual(100) // But not hardcoded to exact value
  }, 10000)

  test('should differentiate between system and web fonts in scoring', async () => {
    // Test system fonts first
    mockPage.evaluate.mockResolvedValueOnce(createFontData(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", sans-serif']));
    const systemFontResult = await analyzeFontUsage('https://test.com')

    // Reset and test web fonts
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
    mockPage.evaluate.mockResolvedValueOnce(createFontData([
      '"Roboto", sans-serif',
      '"Open Sans", Arial',
      '"Poppins", serif',
      '"Montserrat", sans-serif'
    ]));

    const webFontResult = await analyzeFontUsage('https://web-font-heavy.com')

    // System fonts should score higher than many web fonts
    expect(systemFontResult.score).toBeGreaterThan(webFontResult.score)
    expect(systemFontResult.systemFontCount).toBeGreaterThan(0)
    expect(webFontResult.webFontCount).toBeGreaterThan(0)
  })

  test('should detect system font stack in font family declaration', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif']));

    const result = await analyzeFontUsage('https://example.com')

    // Should detect system font indicators in the stack
    const fontStack = result.fontFamilies[0].toLowerCase()
    const hasSystemIndicators = fontStack.includes('system') ||
                               fontStack.includes('apple-system') ||
                               fontStack.includes('sans-serif') ||
                               fontStack.includes('arial')
    expect(hasSystemIndicators).toBe(true)

    // Should classify as system font
    expect(result.systemFontCount).toBeGreaterThan(0)
    expect(result.webFontCount).toBe(0)
  }, 10000)
})

describe('Font Classification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  test('should classify system fonts correctly', async () => {
    // Mock different font scenarios
    mockPage.evaluate.mockResolvedValue(createFontData([
      'Arial, sans-serif',
      'system-ui, sans-serif',
      'Georgia, serif'
    ]));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.systemFontCount).toBe(3) // All should be classified as system
    expect(result.webFontCount).toBe(0)
    expect(result.score).toBeGreaterThan(95) // High score for system fonts
  })

  test('should classify web fonts correctly', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Poppins", sans-serif',
      '"Open Sans", Arial, sans-serif',
      '"Montserrat", system-ui, sans-serif'
    ]));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.systemFontCount).toBe(0)
    expect(result.webFontCount).toBe(3) // All should be classified as web fonts
    expect(result.score).toBeLessThan(90) // Lower score for multiple web fonts
  })

  test('should handle mixed system and web fonts', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      'system-ui, sans-serif',  // system
      '"Poppins", Arial, sans-serif'  // web (Poppins) but contains system fallback
    ]));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.systemFontCount).toBe(1)
    expect(result.webFontCount).toBe(1)
    expect(result.score).toBeGreaterThan(85) // Good score for balanced approach
  })

  test('should recognize modern system fonts like Segoe UI and Inter', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Segoe UI", sans-serif',
      '"Inter", system-ui, sans-serif',
      '"SF Pro Display", -apple-system, sans-serif'
    ]));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.systemFontCount).toBe(3) // All modern fonts should be classified as system
    expect(result.webFontCount).toBe(0)
    expect(result.score).toBeGreaterThan(95)
  })
})

describe('Enhanced Font Analysis Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  test('should detect variable fonts', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Inter Variable", sans-serif'
    ], {
      variableFonts: [{ fontFamily: 'Inter Variable', variationAxes: ['wght', 'slnt'] }]
    }));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.variableFonts.length).toBe(1)
    expect(result.variableFonts[0].fontFamily).toBe('Inter Variable')
    expect(result.variableFonts[0].variationAxes).toContain('wght')
    // Variable font bonus should improve score
    expect(result.score).toBeGreaterThan(95)
  })

  test('should detect font loading strategies', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Custom Font", sans-serif'
    ], {
      loadingStrategies: [
        { fontFamily: 'Custom Font', fontDisplay: 'swap', preloaded: true }
      ]
    }));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.fontLoadingStrategies.length).toBe(1)
    expect(result.fontLoadingStrategies[0].fontDisplay).toBe('swap')
    expect(result.fontLoadingStrategies[0].preloaded).toBe(true)
    expect(result.performanceImpact.criticalFonts).toContain('Custom Font')
  })

  test('should penalize render-blocking fonts', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Blocking Font", sans-serif'
    ], {
      loadingStrategies: [
        { fontFamily: 'Blocking Font', fontDisplay: 'block', preloaded: false }
      ]
    }));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.performanceImpact.renderBlockingFonts).toBe(1)
    expect(result.issues.some(issue => issue.includes('render-blocking'))).toBe(true)
  })

  test('should reward font subsetting', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Subsetted Font", sans-serif'
    ], {
      subsettingDetected: true
    }));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.subsettingDetected).toBe(true)
    // Subsetting bonus should improve score
    expect(result.score).toBeGreaterThan(95)
  })

  test('should calculate performance impact correctly', async () => {
    mockPage.evaluate.mockResolvedValue(createFontData([
      '"Font1", sans-serif',
      '"Font2", serif',
      '"Font3", monospace'
    ], {
      loadingStrategies: [
        { fontFamily: 'Font1', fontDisplay: 'swap', preloaded: true },
        { fontFamily: 'Font2', fontDisplay: 'auto', preloaded: false },
        { fontFamily: 'Font3', preloaded: false }
      ]
    }));

    const result = await analyzeFontUsage('https://test.com')

    expect(result.performanceImpact.totalFontRequests).toBe(3)
    expect(result.performanceImpact.renderBlockingFonts).toBe(2) // Font2 and Font3
    expect(result.performanceImpact.criticalFonts).toContain('Font1')
    expect(result.performanceImpact.estimatedLoadTime).toBeGreaterThan(0)
  })
})