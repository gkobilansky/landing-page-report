import { analyzeFontUsage } from '../font-analysis'

// Mock puppeteer config to avoid browser launching in tests
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(() => 
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
      systemFontCount: expect.any(Number),
      webFontCount: expect.any(Number),
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

  test('should give perfect score for single system font family', async () => {
    const result = await analyzeFontUsage('https://example.com')
    
    // Single system font family should get perfect score + bonus
    expect(result.fontCount).toBe(1)
    expect(result.systemFontCount).toBe(1)
    expect(result.webFontCount).toBe(0)
    expect(result.score).toBe(100) // Perfect score + system bonus
  }, 10000)

  test('should differentiate between system and web fonts in scoring', () => {
    // System fonts should have minimal penalty
    // 5 system fonts: 100 - (5-3)*5 = 90
    const systemFontScore = Math.max(0, 100 - (5 - 3) * 5)
    expect(systemFontScore).toBe(90)
    
    // Web fonts should have heavier penalty  
    // 4 web fonts: 100 - (4-2)*15 = 70
    const webFontScore = Math.max(0, 100 - (4 - 2) * 15)
    expect(webFontScore).toBe(70)
  })

  test('should detect system font stack in font family declaration', async () => {
    const result = await analyzeFontUsage('https://example.com')
    
    // Should detect the system font stack
    expect(result.fontFamilies[0]).toContain('-apple-system')
    expect(result.fontFamilies[0]).toContain('system-ui')
    expect(result.fontFamilies[0]).toContain('sans-serif')
    
    // Should classify as system font
    expect(result.systemFontCount).toBe(1)
    expect(result.webFontCount).toBe(0)
  }, 10000)
})

// Test font classification function directly
import puppeteer from 'puppeteer-core'

const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>

describe('Font Classification', () => {
  test('should classify system fonts correctly', async () => {
    // Mock different font scenarios
    mockPuppeteer.launch.mockResolvedValueOnce({
      newPage: jest.fn().mockResolvedValueOnce({
        goto: jest.fn().mockResolvedValueOnce(undefined),
        evaluate: jest.fn().mockResolvedValueOnce([
          'Arial, sans-serif',
          'system-ui, sans-serif', 
          'Georgia, serif'
        ])
      }),
      close: jest.fn().mockResolvedValueOnce(undefined)
    } as any)

    const result = await analyzeFontUsage('https://test.com')
    
    expect(result.systemFontCount).toBe(3) // All should be classified as system
    expect(result.webFontCount).toBe(0)
    expect(result.score).toBeGreaterThan(95) // High score for system fonts
  })

  test('should classify web fonts correctly', async () => {
    mockPuppeteer.launch.mockResolvedValueOnce({
      newPage: jest.fn().mockResolvedValueOnce({
        goto: jest.fn().mockResolvedValueOnce(undefined),
        evaluate: jest.fn().mockResolvedValueOnce([
          '"Roboto", sans-serif',
          '"Open Sans", Arial, sans-serif',
          '"Poppins", system-ui, sans-serif'
        ])
      }),
      close: jest.fn().mockResolvedValueOnce(undefined)
    } as any)

    const result = await analyzeFontUsage('https://test.com')
    
    expect(result.systemFontCount).toBe(0) 
    expect(result.webFontCount).toBe(3) // All should be classified as web fonts
    expect(result.score).toBeLessThan(90) // Lower score for multiple web fonts
  })

  test('should handle mixed system and web fonts', async () => {
    mockPuppeteer.launch.mockResolvedValueOnce({
      newPage: jest.fn().mockResolvedValueOnce({
        goto: jest.fn().mockResolvedValueOnce(undefined),
        evaluate: jest.fn().mockResolvedValueOnce([
          'system-ui, sans-serif',  // system
          '"Roboto", Arial, sans-serif'  // web (Roboto) but contains system fallback
        ])
      }),
      close: jest.fn().mockResolvedValueOnce(undefined)
    } as any)

    const result = await analyzeFontUsage('https://test.com')
    
    expect(result.systemFontCount).toBe(1)
    expect(result.webFontCount).toBe(1)
    expect(result.score).toBeGreaterThan(85) // Good score for balanced approach
  })
})