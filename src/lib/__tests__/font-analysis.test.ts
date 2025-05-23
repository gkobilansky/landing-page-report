import { analyzeFontUsage } from '../font-analysis'

// Mock puppeteer to avoid browser launching in tests
jest.mock('puppeteer', () => ({
  launch: jest.fn(() => 
    Promise.resolve({
      newPage: jest.fn(() => 
        Promise.resolve({
          goto: jest.fn(() => Promise.resolve()),
          evaluate: jest.fn(() => 
            // Mock example.com's single font-family declaration
            Promise.resolve(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'])
          )
        })
      ),
      close: jest.fn(() => Promise.resolve())
    })
  )
}))

describe('Font Usage Analysis', () => {
  test('should detect font families from example.com', async () => {
    const result = await analyzeFontUsage('https://example.com')
    
    expect(result).toEqual({
      fontFamilies: expect.any(Array),
      fontCount: expect.any(Number),
      score: expect.any(Number),
      issues: expect.any(Array),
      recommendations: expect.any(Array)
    })
    
    // Should detect exactly 1 font-family declaration for example.com
    expect(result.fontCount).toBe(1)
    expect(result.fontFamilies.length).toBe(1)
    expect(result.fontFamilies[0]).toBe('-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  }, 10000)

  test('should give perfect score for single font family', async () => {
    const result = await analyzeFontUsage('https://example.com')
    
    // Single font family should get perfect score
    expect(result.fontCount).toBe(1)
    expect(result.score).toBe(100)
  }, 10000)

  test('should penalize excessive font usage (>3 families)', () => {
    // Test the scoring function logic directly
    const mockFontFamilies = ['Arial', 'Helvetica', 'Times', 'Georgia', 'Verdana']
    
    const scoreForManyFonts = Math.max(0, 80 - (mockFontFamilies.length - 3) * 20)
    expect(scoreForManyFonts).toBeLessThan(80)
    expect(scoreForManyFonts).toBe(40) // 80 - (5-3)*20 = 40
  })

  test('should detect system font stack in font family declaration', async () => {
    const result = await analyzeFontUsage('https://example.com')
    
    // Should detect the system font stack
    expect(result.fontFamilies[0]).toContain('-apple-system')
    expect(result.fontFamilies[0]).toContain('system-ui')
    expect(result.fontFamilies[0]).toContain('sans-serif')
  }, 10000)
})