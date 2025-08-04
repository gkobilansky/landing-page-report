import { ImpactLevel } from '@/components/AccordionSection'

interface CategorizedItem {
  text: string
  impact: ImpactLevel
}

interface CategorizedContent {
  issues: CategorizedItem[]
  recommendations: CategorizedItem[]
}

// Keywords that indicate high impact issues/recommendations
const HIGH_IMPACT_KEYWORDS = [
  'slow', 'loading', 'speed', 'performance', 'critical', 'major', 'significant',
  'conversion', 'cta', 'call-to-action', 'above fold', 'primary', 'user experience',
  'accessibility', 'mobile', 'responsive', 'broken', 'error', 'failed',
  'social proof', 'trust', 'credibility', 'testimonial', 'review'
]

// Keywords that indicate medium impact
const MEDIUM_IMPACT_KEYWORDS = [
  'optimize', 'improve', 'enhance', 'reduce', 'compress', 'minify',
  'font', 'image', 'alt text', 'spacing', 'whitespace', 'layout',
  'consistency', 'modern', 'format', 'webp', 'avif'
]

// Keywords that indicate low impact (if not caught by high/medium)
const LOW_IMPACT_KEYWORDS = [
  'consider', 'minor', 'small', 'slight', 'optional', 'nice to have',
  'polish', 'refinement', 'tweak', 'adjustment'
]

function categorizeByImpact(text: string): ImpactLevel {
  const lowerText = text.toLowerCase()
  
  // Check for high impact keywords
  if (HIGH_IMPACT_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return 'High'
  }
  
  // Check for medium impact keywords
  if (MEDIUM_IMPACT_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return 'Medium'
  }
  
  // Check for explicit low impact keywords
  if (LOW_IMPACT_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return 'Low'
  }
  
  // Default to Medium if no clear indicators
  return 'Medium'
}

export function categorizeContent(
  issues: string[] = [], 
  recommendations: string[] = []
): CategorizedContent {
  const categorizedIssues = issues.map(issue => ({
    text: issue,
    impact: categorizeByImpact(issue)
  }))
  
  const categorizedRecommendations = recommendations.map(rec => ({
    text: rec,
    impact: categorizeByImpact(rec)
  }))
  
  // Sort by impact level (High, Medium, Low)
  const impactOrder = { 'High': 0, 'Medium': 1, 'Low': 2 }
  
  return {
    issues: categorizedIssues.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]),
    recommendations: categorizedRecommendations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
  }
}

export function groupByImpact(items: CategorizedItem[]): Record<ImpactLevel, string[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.impact]) {
      acc[item.impact] = []
    }
    acc[item.impact].push(item.text)
    return acc
  }, {} as Record<ImpactLevel, string[]>)
}