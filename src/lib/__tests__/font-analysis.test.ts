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

describe('Font Usage Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  test('should detect font families from example.com', async () => {
    // Mock example.com's single font-family declaration
    mockPage.evaluate.mockResolvedValue(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif']);
    
    const result = await analyzeFontUsage('https://example.com')
    
    expect(result).toEqual({
      fontFamilies: expect.any(Array),
      fontCount: expect.any(Number),
      systemFontCount: expect.any(Number),
      webFontCount: expect.any(Number),
      score: expect.any(Number),
      issues: expect.any(Array),
      recommendations: expect.any(Array)
    })
    
    // Should detect exactly 1 font-family declaration for example.com
    expect(result.fontCount).toBe(1)
    expect(result.fontFamilies.length).toBe(1)
    expect(result.fontFamilies[0]).toContain('system') // Should contain system font indicators
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  }, 10000)

  test('should give high score for single system font family', async () => {
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
    mockPage.evaluate.mockResolvedValueOnce(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", sans-serif']);
    const systemFontResult = await analyzeFontUsage('https://test.com')
    
    // Reset and test web fonts
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
    mockPage.evaluate.mockResolvedValueOnce([
      '"Roboto", sans-serif',
      '"Open Sans", Arial',
      '"Poppins", serif',
      '"Montserrat", sans-serif'
    ]);
    
    const webFontResult = await analyzeFontUsage('https://web-font-heavy.com')
    
    // System fonts should score higher than many web fonts
    expect(systemFontResult.score).toBeGreaterThan(webFontResult.score)
    expect(systemFontResult.systemFontCount).toBeGreaterThan(0)
    expect(webFontResult.webFontCount).toBeGreaterThan(0)
  })

  test('should detect system font stack in font family declaration', async () => {
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
    mockPage.evaluate.mockResolvedValue([
      'Arial, sans-serif',
      'system-ui, sans-serif', 
      'Georgia, serif'
    ]);

    const result = await analyzeFontUsage('https://test.com')
    
    expect(result.systemFontCount).toBe(3) // All should be classified as system
    expect(result.webFontCount).toBe(0)
    expect(result.score).toBeGreaterThan(95) // High score for system fonts
  })

  test('should classify web fonts correctly', async () => {
    mockPage.evaluate.mockResolvedValue([
      '"Roboto", sans-serif',
      '"Open Sans", Arial, sans-serif',
      '"Poppins", system-ui, sans-serif'
    ]);

    const result = await analyzeFontUsage('https://test.com')
    
    expect(result.systemFontCount).toBe(0) 
    expect(result.webFontCount).toBe(3) // All should be classified as web fonts
    expect(result.score).toBeLessThan(90) // Lower score for multiple web fonts
  })

  test('should handle mixed system and web fonts', async () => {
    mockPage.evaluate.mockResolvedValue([
      'system-ui, sans-serif',  // system
      '"Roboto", Arial, sans-serif'  // web (Roboto) but contains system fallback
    ]);

    const result = await analyzeFontUsage('https://test.com')
    
    expect(result.systemFontCount).toBe(1)
    expect(result.webFontCount).toBe(1)
    expect(result.score).toBeGreaterThan(85) // Good score for balanced approach
  })
})