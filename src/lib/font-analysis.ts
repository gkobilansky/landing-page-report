import puppeteer from 'puppeteer'

export interface FontAnalysisResult {
  fontFamilies: string[]
  fontCount: number
  score: number
  issues: string[]
  recommendations: string[]
}

export async function analyzeFontUsage(url: string): Promise<FontAnalysisResult> {
  console.log(`🚀 Starting font analysis for: ${url}`)
  
  console.log('📱 Launching Puppeteer browser...')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
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
    
    // Each font-family declaration represents one conceptual font choice
    // Even if it has fallbacks, it's still just one font design decision
    const fontCount = fontFamilyDeclarations.length
    
    console.log(`✅ Total font families used: ${fontCount}`)
    
    const score = calculateFontScore(fontCount)
    const issues = generateIssues(fontCount)
    const recommendations = generateRecommendations(fontCount)
    
    console.log(`💯 Font usage score: ${score}/100 (${fontCount} font families)`)
    
    return {
      fontFamilies: fontFamilyDeclarations,
      fontCount,
      score,
      issues,
      recommendations
    }
    
  } finally {
    console.log('🔒 Closing browser...')
    await browser.close()
    console.log('✨ Font analysis complete!')
  }
}

function calculateFontScore(fontCount: number): number {
  if (fontCount <= 2) {
    return 100
  } else if (fontCount === 3) {
    return 85
  } else {
    // Penalize heavily for more than 3 fonts
    return Math.max(0, 80 - (fontCount - 3) * 20)
  }
}

function generateIssues(fontCount: number): string[] {
  const issues: string[] = []
  
  if (fontCount > 3) {
    issues.push(`Too many font families detected (${fontCount}). This can slow down page loading and create visual inconsistency.`)
  }
  
  if (fontCount > 5) {
    issues.push('Excessive font usage may significantly impact page performance and user experience.')
  }
  
  return issues
}

function generateRecommendations(fontCount: number): string[] {
  const recommendations: string[] = []
  
  if (fontCount > 3) {
    recommendations.push('Limit font families to 2-3 maximum for optimal performance and visual consistency.')
    recommendations.push('Consider using font weights and styles instead of different font families for variation.')
  }
  
  if (fontCount <= 2) {
    recommendations.push('Excellent font usage! Your minimal font selection promotes fast loading and clean design.')
  }
  
  recommendations.push('Ensure all fonts are web-safe or properly loaded via Google Fonts or similar CDN.')
  
  return recommendations
}