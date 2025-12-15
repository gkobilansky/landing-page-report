import { createPuppeteerBrowser } from './puppeteer-config';
import { getFontRecommendations, RecommendationContext } from './recommendations';

export interface FontAnalysisResult {
  fontFamilies: string[]
  fontCount: number
  systemFontCount: number
  webFontCount: number
  score: number
  issues: string[]
  recommendations: string[]
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
      recommendations
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
