import { ImpactLevel } from '@/components/AccordionSection'

export interface IssueFix {
  issue: string | null
  fix: string | null
  impact: ImpactLevel
}

// Common keywords to extract for matching
const MATCHING_KEYWORDS = [
  // CTA related
  'cta', 'button', 'call-to-action', 'action', 'click', 'primary', 'secondary',
  // Speed related
  'load', 'speed', 'performance', 'slow', 'fast', 'lcp', 'fcp', 'cls', 'cache', 'compress',
  // Image related
  'image', 'img', 'alt', 'webp', 'avif', 'jpeg', 'png', 'resize', 'optimize', 'lazy',
  // Font related
  'font', 'typeface', 'typography', 'text', 'family', 'weight',
  // Social proof related
  'testimonial', 'review', 'rating', 'trust', 'badge', 'social', 'proof', 'customer',
  // Whitespace related
  'whitespace', 'spacing', 'clutter', 'density', 'margin', 'padding', 'layout',
  // General
  'above fold', 'below fold', 'mobile', 'desktop', 'accessibility', 'contrast'
]

function extractKeywords(text: string): Set<string> {
  const lowerText = text.toLowerCase()
  const keywords = new Set<string>()

  for (const keyword of MATCHING_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      keywords.add(keyword)
    }
  }

  return keywords
}

function calculateMatchScore(issueKeywords: Set<string>, fixKeywords: Set<string>): number {
  let matches = 0
  for (const keyword of issueKeywords) {
    if (fixKeywords.has(keyword)) {
      matches++
    }
  }
  return matches
}

function getImpactFromText(text: string): ImpactLevel {
  const lowerText = text.toLowerCase()

  // High impact keywords
  const highImpactKeywords = [
    'slow', 'loading', 'speed', 'performance', 'critical', 'major', 'significant',
    'conversion', 'cta', 'call-to-action', 'above fold', 'primary', 'user experience',
    'accessibility', 'mobile', 'responsive', 'broken', 'error', 'failed',
    'social proof', 'trust', 'credibility', 'testimonial', 'review'
  ]

  // Medium impact keywords
  const mediumImpactKeywords = [
    'optimize', 'improve', 'enhance', 'reduce', 'compress', 'minify',
    'font', 'image', 'alt text', 'spacing', 'whitespace', 'layout',
    'consistency', 'modern', 'format', 'webp', 'avif'
  ]

  if (highImpactKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'High'
  }

  if (mediumImpactKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'Medium'
  }

  return 'Low'
}

/**
 * Pairs issues with their most relevant fixes based on keyword matching
 *
 * @param issues - Array of issue strings
 * @param recommendations - Array of recommendation strings
 * @returns Array of paired issue-fix objects sorted by impact
 */
export function pairIssuesWithFixes(
  issues: string[] = [],
  recommendations: string[] = []
): IssueFix[] {
  const pairs: IssueFix[] = []
  const usedRecommendations = new Set<number>()

  // First pass: pair each issue with its best matching recommendation
  for (const issue of issues) {
    const issueKeywords = extractKeywords(issue)
    let bestMatchIndex = -1
    let bestMatchScore = 0

    // Find the best matching recommendation
    for (let i = 0; i < recommendations.length; i++) {
      const fixKeywords = extractKeywords(recommendations[i])
      const score = calculateMatchScore(issueKeywords, fixKeywords)

      if (score > bestMatchScore) {
        bestMatchScore = score
        bestMatchIndex = i
      }
    }

    // Create the pair
    const fix = bestMatchIndex >= 0 ? recommendations[bestMatchIndex] : null
    if (bestMatchIndex >= 0) {
      usedRecommendations.add(bestMatchIndex)
    }

    pairs.push({
      issue,
      fix,
      impact: getImpactFromText(issue)
    })
  }

  // Second pass: add orphan recommendations (not matched to any issue)
  for (let i = 0; i < recommendations.length; i++) {
    if (!usedRecommendations.has(i)) {
      pairs.push({
        issue: null,
        fix: recommendations[i],
        impact: getImpactFromText(recommendations[i])
      })
    }
  }

  // Sort by impact level (High first, then Medium, then Low)
  const impactOrder: Record<ImpactLevel, number> = { High: 0, Medium: 1, Low: 2 }
  pairs.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])

  return pairs
}

/**
 * Groups paired issues/fixes by impact level
 */
export function groupPairsByImpact(pairs: IssueFix[]): Record<ImpactLevel, IssueFix[]> {
  return pairs.reduce((acc, pair) => {
    if (!acc[pair.impact]) {
      acc[pair.impact] = []
    }
    acc[pair.impact].push(pair)
    return acc
  }, {} as Record<ImpactLevel, IssueFix[]>)
}
