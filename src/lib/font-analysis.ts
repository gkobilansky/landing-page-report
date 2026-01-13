import { createPuppeteerBrowser } from './puppeteer-config';
import { getFontRecommendations, RecommendationContext } from './recommendations';

export interface FontLoadingStrategy {
  fontFamily: string;
  fontDisplay?: string;
  preloaded: boolean;
}

export interface VariableFontInfo {
  fontFamily: string;
  variationAxes: string[];
}

export interface FontPerformanceImpact {
  estimatedLoadTime: number; // ms
  renderBlockingFonts: number;
  criticalFonts: string[];
  totalFontRequests: number;
}

export interface FontAnalysisResult {
  fontFamilies: string[]
  fontCount: number
  systemFontCount: number
  webFontCount: number
  score: number
  issues: string[]
  recommendations: string[]
  // New enhanced fields
  variableFonts: VariableFontInfo[]
  fontLoadingStrategies: FontLoadingStrategy[]
  performanceImpact: FontPerformanceImpact
  subsettingDetected: boolean
}

import type { Browser } from 'puppeteer-core';

export interface FontAnalysisOptions {
  puppeteer?: {
    browser?: Browser;
    forceBrowserless?: boolean;
  };
}

export async function analyzeFontUsage(url: string, options: FontAnalysisOptions = {}): Promise<FontAnalysisResult> {
  console.log(`🚀 Starting font analysis for: ${url}`)
  
  console.log('📱 Launching Puppeteer browser...')

  const providedBrowser = options.puppeteer?.browser;
  const shouldCloseBrowser = !providedBrowser;
  const browser = providedBrowser || await createPuppeteerBrowser({
    forceBrowserless: options.puppeteer?.forceBrowserless
  });
  
  try {
    console.log('🌐 Creating new page and navigating to URL...')
    const page = await browser.newPage()
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    })
    
    console.log('🔍 Extracting font families and advanced font data from page elements...')
    // Extract unique font-family declarations and advanced font information
    const fontData = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      const fontDeclarations = new Set<string>()
      const variableFontsFound: Array<{ fontFamily: string; variationAxes: string[] }> = []
      const loadingStrategies: Array<{ fontFamily: string; fontDisplay?: string; preloaded: boolean }> = []
      let subsettingDetected = false

      // Get all font-family declarations
      elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        const fontFamily = computedStyle.fontFamily

        if (fontFamily && fontFamily !== 'inherit') {
          fontDeclarations.add(fontFamily)

          // Check for variable font usage via font-variation-settings
          const fontVariationSettings = computedStyle.fontVariationSettings
          if (fontVariationSettings && fontVariationSettings !== 'normal') {
            // Extract axis names from font-variation-settings
            const axisMatches = fontVariationSettings.match(/"([^"]+)"/g) || []
            const axes = axisMatches.map(m => m.replace(/"/g, ''))
            if (axes.length > 0) {
              const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '')
              const existing = variableFontsFound.find(v => v.fontFamily === firstFont)
              if (!existing) {
                variableFontsFound.push({ fontFamily: firstFont, variationAxes: axes })
              }
            }
          }
        }
      })

      // Check for font-display in stylesheets
      try {
        const styleSheets = Array.from(document.styleSheets)
        styleSheets.forEach(sheet => {
          try {
            const rules = sheet.cssRules || sheet.rules
            if (rules) {
              Array.from(rules).forEach(rule => {
                if (rule instanceof CSSFontFaceRule) {
                  const fontFamily = rule.style.fontFamily?.replace(/['"]/g, '') || ''
                  const fontDisplay = rule.style.getPropertyValue('font-display') || undefined
                  const unicodeRange = rule.style.getPropertyValue('unicode-range')

                  if (unicodeRange && unicodeRange !== 'U+0-10FFFF') {
                    subsettingDetected = true
                  }

                  if (fontFamily) {
                    const existing = loadingStrategies.find(s => s.fontFamily === fontFamily)
                    if (!existing) {
                      loadingStrategies.push({
                        fontFamily,
                        fontDisplay: fontDisplay || undefined,
                        preloaded: false // Will be updated below
                      })
                    }
                  }

                  // Check for variable font src
                  const src = rule.style.getPropertyValue('src')
                  if (src && (src.includes('format("woff2-variations")') ||
                              src.includes("format('woff2-variations')") ||
                              src.includes('format("truetype-variations")') ||
                              src.includes("format('truetype-variations')"))) {
                    const existing = variableFontsFound.find(v => v.fontFamily === fontFamily)
                    if (!existing) {
                      variableFontsFound.push({ fontFamily, variationAxes: ['wght'] }) // At minimum weight axis
                    }
                  }
                }
              })
            }
          } catch (e) {
            // CORS restriction on stylesheet - skip
          }
        })
      } catch (e) {
        // Stylesheet access error
      }

      // Check for preloaded fonts
      const preloadLinks = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]'))
      preloadLinks.forEach(link => {
        const href = link.getAttribute('href') || ''
        // Try to match preloaded fonts with loading strategies
        loadingStrategies.forEach(strategy => {
          if (href.toLowerCase().includes(strategy.fontFamily.toLowerCase().replace(/\s+/g, ''))) {
            strategy.preloaded = true
          }
        })
      })

      return {
        fontDeclarations: Array.from(fontDeclarations),
        variableFonts: variableFontsFound,
        loadingStrategies,
        subsettingDetected,
        preloadedFontsCount: preloadLinks.length
      }
    })
    
    const fontFamilyDeclarations = fontData.fontDeclarations
    console.log(`📊 Found ${fontFamilyDeclarations.length} unique font-family declarations:`, fontFamilyDeclarations)
    console.log(`📊 Variable fonts: ${fontData.variableFonts.length}`)
    console.log(`📊 Font loading strategies: ${fontData.loadingStrategies.length}`)
    console.log(`📊 Subsetting detected: ${fontData.subsettingDetected}`)

    // Classify fonts as system vs web fonts
    const fontClassification = classifyFonts(fontFamilyDeclarations)
    const fontCount = fontFamilyDeclarations.length
    const systemFontCount = fontClassification.systemFonts.length
    const webFontCount = fontClassification.webFonts.length

    console.log(`✅ Total font families: ${fontCount} (${systemFontCount} system, ${webFontCount} web)`)

    // Calculate performance impact
    const performanceImpact = calculatePerformanceImpact(
      webFontCount,
      fontData.loadingStrategies,
      fontData.variableFonts.length
    )

    // Calculate enhanced score with new features
    const score = calculateEnhancedFontScore(
      systemFontCount,
      webFontCount,
      fontData.variableFonts.length,
      fontData.loadingStrategies,
      fontData.subsettingDetected,
      performanceImpact
    )

    const issues = generateEnhancedIssues(
      systemFontCount,
      webFontCount,
      fontData.loadingStrategies,
      performanceImpact
    )

    const recommendations = generateRecommendationsForFonts(
      systemFontCount,
      webFontCount,
      fontFamilyDeclarations,
      url
    )

    console.log(`💯 Font usage score: ${score}/100 (${fontCount} font families)`)

    return {
      fontFamilies: fontFamilyDeclarations,
      fontCount,
      systemFontCount,
      webFontCount,
      score,
      issues,
      recommendations,
      variableFonts: fontData.variableFonts,
      fontLoadingStrategies: fontData.loadingStrategies,
      performanceImpact,
      subsettingDetected: fontData.subsettingDetected
    }
    
  } finally {
    if (shouldCloseBrowser) {
      console.log('🔒 Closing browser...')
      await browser.close()
    }
    console.log('✨ Font analysis complete!')
  }
}

interface FontClassification {
  systemFonts: string[]
  webFonts: string[]
}

// Comprehensive list of system and commonly available fonts
const SYSTEM_FONT_NAMES = [
  // System UI fonts (modern)
  'system-ui', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded',
  // Generic families
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  // Modern system fonts (bundled with OS or browsers)
  'Segoe UI', 'SF Pro', 'SF Pro Display', 'SF Pro Text', 'SF Mono',
  'Roboto', 'Roboto Mono', // Android system font, also on ChromeOS
  'Ubuntu', 'Ubuntu Mono', // Linux system font
  'Inter', // Often bundled or preinstalled in modern contexts
  'Noto Sans', 'Noto Serif', // Google's comprehensive font family
  // Classic system fonts (Windows/Mac/Linux)
  'Arial', 'Helvetica', 'Helvetica Neue',
  'Times', 'Times New Roman',
  'Georgia', 'Verdana', 'Tahoma',
  'Trebuchet MS', 'Impact', 'Comic Sans MS',
  'Courier', 'Courier New', 'Lucida Console', 'Palatino', 'Palatino Linotype',
  'Lucida Grande', 'Lucida Sans Unicode',
  'Geneva', 'Monaco', 'Menlo', 'Consolas',
  // CJK system fonts
  'PingFang SC', 'PingFang TC', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN',
  'Microsoft YaHei', 'Microsoft JhengHei', 'Meiryo', 'Yu Gothic',
  'Noto Sans CJK', 'Noto Serif CJK',
  // Arabic system fonts
  'Geeza Pro', 'Al Nile', 'Baghdad'
]

function classifyFonts(fontDeclarations: string[]): FontClassification {
  const systemFonts: string[] = []
  const webFonts: string[] = []

  fontDeclarations.forEach(declaration => {
    // Check if the first font in the stack is a system font
    // Remove quotes and get the first font family
    const firstFont = declaration.split(',')[0].trim().replace(/['"]/g, '')

    const isSystemFont = SYSTEM_FONT_NAMES.some(systemFont =>
      firstFont.toLowerCase() === systemFont.toLowerCase()
    )

    if (isSystemFont) {
      systemFonts.push(declaration)
    } else {
      webFonts.push(declaration)
    }
  })

  return { systemFonts, webFonts }
}

function calculateFontScore(systemFontCount: number, webFontCount: number): number {
  // System fonts have minimal performance impact, so lighter penalty
  // Web fonts have loading impact, so heavier penalty
  
  let score = 100
  
  // System font penalty - very light since no performance impact
  if (systemFontCount > 3) {
    score -= (systemFontCount - 3) * 5 // Only 5 points per extra system font
  }
  
  // Web font penalty - heavier since they affect loading
  if (webFontCount > 2) {
    score -= (webFontCount - 2) * 15 // 15 points per extra web font
  } else if (webFontCount === 2) {
    score -= 5 // Small penalty for 2 web fonts
  }
  
  // Bonus for using only system fonts
  if (webFontCount === 0 && systemFontCount <= 3) {
    score = Math.min(100, score + 5) // Small bonus for system-only approach
  }
  
  return Math.max(0, score)
}

function generateIssues(systemFontCount: number, webFontCount: number): string[] {
  const issues: string[] = []
  
  if (webFontCount > 2) {
    issues.push(`Too many web fonts detected (${webFontCount}). Each web font requires additional network requests and can slow page loading.`)
  }
  
  if (systemFontCount > 5) {
    issues.push(`Excessive system font variety (${systemFontCount}) can create visual inconsistency despite not affecting performance.`)
  }
  
  if (webFontCount > 3) {
    issues.push('Excessive web font usage may significantly impact page performance and user experience.')
  }
  
  return issues
}

function generateRecommendationsForFonts(
  systemFontCount: number,
  webFontCount: number,
  fontFamilies: string[],
  url?: string
): string[] {
  const ctx: RecommendationContext = {
    systemFontCount,
    webFontCount,
    fontFamilies,
    url,
  }

  const result = getFontRecommendations(ctx)
  return result.legacyStrings
}

function calculatePerformanceImpact(
  webFontCount: number,
  loadingStrategies: FontLoadingStrategy[],
  variableFontsCount: number
): FontPerformanceImpact {
  // Estimate load time based on typical web font sizes
  // Average web font: ~20-50KB, assuming average network speed
  const avgFontLoadTime = 100 // ms per font on average
  let estimatedLoadTime = webFontCount * avgFontLoadTime

  // Variable fonts reduce requests (multiple weights in one file)
  if (variableFontsCount > 0) {
    estimatedLoadTime -= variableFontsCount * 50 // Savings from consolidated files
  }

  // Count render-blocking fonts (those without proper font-display)
  const renderBlockingFonts = loadingStrategies.filter(
    strategy => !strategy.fontDisplay || strategy.fontDisplay === 'block' || strategy.fontDisplay === 'auto'
  ).length

  // Add time for render-blocking fonts
  estimatedLoadTime += renderBlockingFonts * 100

  // Identify critical fonts (preloaded ones are considered critical)
  const criticalFonts = loadingStrategies
    .filter(s => s.preloaded)
    .map(s => s.fontFamily)

  return {
    estimatedLoadTime: Math.max(0, Math.round(estimatedLoadTime)),
    renderBlockingFonts,
    criticalFonts,
    totalFontRequests: webFontCount
  }
}

function calculateEnhancedFontScore(
  systemFontCount: number,
  webFontCount: number,
  variableFontsCount: number,
  loadingStrategies: FontLoadingStrategy[],
  subsettingDetected: boolean,
  performanceImpact: FontPerformanceImpact
): number {
  let score = 100

  // Base penalties (keeping existing logic)
  if (systemFontCount > 3) {
    score -= (systemFontCount - 3) * 5
  }
  if (webFontCount > 2) {
    score -= (webFontCount - 2) * 15
  } else if (webFontCount === 2) {
    score -= 5
  }

  // Bonus for using only system fonts
  if (webFontCount === 0 && systemFontCount <= 3) {
    score = Math.min(100, score + 5)
  }

  // NEW: Variable font bonus (up to +10)
  if (variableFontsCount > 0) {
    score += Math.min(10, variableFontsCount * 5)
  }

  // NEW: Font loading strategy bonus/penalty
  const fontsWithStrategy = loadingStrategies.filter(
    s => s.fontDisplay && s.fontDisplay !== 'auto' && s.fontDisplay !== 'block'
  ).length
  if (webFontCount > 0 && loadingStrategies.length > 0) {
    const strategyScore = (fontsWithStrategy / loadingStrategies.length) * 10
    score += strategyScore - 5 // -5 to +5 points
  }

  // NEW: Performance impact penalty (up to -20)
  if (performanceImpact.renderBlockingFonts > 0) {
    score -= Math.min(20, performanceImpact.renderBlockingFonts * 5)
  }

  // NEW: Font subsetting bonus (+5)
  if (subsettingDetected) {
    score += 5
  }

  // NEW: Preloaded critical fonts bonus (+5)
  if (performanceImpact.criticalFonts.length > 0) {
    score += Math.min(5, performanceImpact.criticalFonts.length * 2)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function generateEnhancedIssues(
  systemFontCount: number,
  webFontCount: number,
  loadingStrategies: FontLoadingStrategy[],
  performanceImpact: FontPerformanceImpact
): string[] {
  const issues: string[] = []

  if (webFontCount > 2) {
    issues.push(`Too many web fonts detected (${webFontCount}). Each web font requires additional network requests and can slow page loading.`)
  }

  if (systemFontCount > 5) {
    issues.push(`Excessive system font variety (${systemFontCount}) can create visual inconsistency despite not affecting performance.`)
  }

  if (webFontCount > 3) {
    issues.push('Excessive web font usage may significantly impact page performance and user experience.')
  }

  // NEW: Font loading strategy issues
  const renderBlockingCount = performanceImpact.renderBlockingFonts
  if (renderBlockingCount > 0) {
    issues.push(`${renderBlockingCount} font(s) may cause render-blocking. Consider using font-display: swap or optional.`)
  }

  // NEW: No preloaded fonts warning
  if (webFontCount > 0 && performanceImpact.criticalFonts.length === 0) {
    issues.push('No fonts are preloaded. Consider preloading critical fonts for faster initial rendering.')
  }

  // NEW: Missing font-display
  const fontsWithoutDisplay = loadingStrategies.filter(
    s => !s.fontDisplay || s.fontDisplay === 'auto'
  )
  if (fontsWithoutDisplay.length > 0) {
    issues.push(`${fontsWithoutDisplay.length} font(s) missing font-display property, which may cause FOIT (Flash of Invisible Text).`)
  }

  return issues
}
