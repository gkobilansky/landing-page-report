import { createPuppeteerBrowser } from './puppeteer-config';

export interface FontAnalysisResult {
  fontFamilies: string[]
  fontCount: number
  systemFontCount: number
  webFontCount: number
  score: number
  issues: string[]
  recommendations: string[]
  loadTime: number // Total analysis time in ms
}

export interface FontAnalysisOptions {
  puppeteer?: {
    forceBrowserless?: boolean;
  };
}

export async function analyzeFontUsage(url: string, options: FontAnalysisOptions = {}): Promise<FontAnalysisResult> {
  const startTime = Date.now()
  console.log(`🚀 Starting font analysis for: ${url}`)
  
  console.log('📱 Launching Puppeteer browser...')
  
  const browser = await createPuppeteerBrowser(options.puppeteer || {})
  
  try {
    console.log('🌐 Creating new page and navigating to URL...')
    const page = await browser.newPage()
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    })
    
    console.log('🔍 Extracting font families from page elements...')
    // Extract unique font-family declarations (not individual fonts from stacks)
    const fontFamilyDeclarations = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      const fontDeclarations = new Set<string>()
      
      elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        const fontFamily = computedStyle.fontFamily
        
        if (fontFamily && fontFamily !== 'inherit') {
          // Store the entire font-family declaration as one unit
          fontDeclarations.add(fontFamily)
        }
      })
      
      return Array.from(fontDeclarations)
    })
    
    console.log(`📊 Found ${fontFamilyDeclarations.length} unique font-family declarations:`, fontFamilyDeclarations)
    
    // Classify fonts as system vs web fonts
    const fontClassification = classifyFonts(fontFamilyDeclarations)
    const fontCount = fontFamilyDeclarations.length
    const systemFontCount = fontClassification.systemFonts.length
    const webFontCount = fontClassification.webFonts.length
    
    console.log(`✅ Total font families: ${fontCount} (${systemFontCount} system, ${webFontCount} web)`)
    
    const score = calculateFontScore(systemFontCount, webFontCount)
    const issues = generateIssues(systemFontCount, webFontCount)
    const recommendations = generateRecommendations(systemFontCount, webFontCount)
    
    console.log(`💯 Font usage score: ${score}/100 (${fontCount} font families)`)
    
    const loadTime = Date.now() - startTime
    
    return {
      fontFamilies: fontFamilyDeclarations,
      fontCount,
      systemFontCount,
      webFontCount,
      score,
      issues,
      recommendations,
      loadTime
    }
    
  } finally {
    console.log('🔒 Closing browser...')
    await browser.close()
    console.log('✨ Font analysis complete!')
  }
}

interface FontClassification {
  systemFonts: string[]
  webFonts: string[]
}

function classifyFonts(fontDeclarations: string[]): FontClassification {
  const systemFonts: string[] = []
  const webFonts: string[] = []
  
  fontDeclarations.forEach(declaration => {
    // Check if the first font in the stack is a system font
    // Remove quotes and get the first font family
    const firstFont = declaration.split(',')[0].trim().replace(/['"]/g, '')
    
    const systemFontNames = [
      // System UI fonts
      'system-ui', '-apple-system', 'BlinkMacSystemFont',
      // Generic families  
      'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
      // Common system fonts
      'Arial', 'Helvetica', 'Times', 'Times New Roman', 'Georgia', 
      'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
      'Courier', 'Courier New', 'Lucida Console', 'Palatino'
    ]
    
    const isSystemFont = systemFontNames.some(systemFont =>
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

function generateRecommendations(systemFontCount: number, webFontCount: number): string[] {
  const recommendations: string[] = []
  
  if (webFontCount > 2) {
    recommendations.push('Limit web fonts to 1-2 maximum for optimal performance.')
    recommendations.push('Consider using system fonts for body text and save web fonts for headings or branding.')
  }
  
  if (systemFontCount > 3 && webFontCount <= 2) {
    recommendations.push('Consider consolidating system fonts for better visual consistency.')
  }
  
  if (webFontCount === 0) {
    recommendations.push('Excellent choice using system fonts! This ensures fast loading and good cross-platform compatibility.')
  } else if (webFontCount <= 2 && systemFontCount <= 3) {
    recommendations.push('Good font balance! Limited web fonts with system font fallbacks provide good performance.')
  }
  
  recommendations.push('Use font weights and styles instead of different font families for text variation.')
  recommendations.push('Ensure web fonts are preloaded and have proper fallbacks to system fonts.')
  
  return recommendations
}