/**
 * Priority Insight Generator
 * Analyzes all section scores to determine the #1 priority fix
 */

import { categorizeContent } from './impact-analyzer'

export type ImpactLevel = 'Critical' | 'High' | 'Medium'

export interface PriorityInsight {
  sectionName: string
  sectionId: string
  sectionScore: number
  sectionIcon: string
  primaryIssue: string
  impactLevel: ImpactLevel
}

export interface PriorityFix {
  sectionName: string
  sectionId: string
  sectionScore: number
  sectionIcon: string
  recommendation: string
  severity: ImpactLevel
}

export interface AnalysisResult {
  pageLoadSpeed?: { score: number; issues?: string[]; recommendations?: string[] }
  ctaAnalysis?: { score: number; issues?: string[]; recommendations?: string[] }
  socialProof?: { score: number; issues?: string[]; recommendations?: string[] }
  whitespaceAssessment?: { score: number; issues?: string[]; recommendations?: string[] }
  imageOptimization?: { score: number; issues?: string[]; recommendations?: string[] }
  fontUsage?: { score: number; issues?: string[]; recommendations?: string[] }
}

// Section configuration with weights (higher = more important)
// CTA (25%), Speed (25%), Social (20%), Whitespace (15%), Images (10%), Fonts (5%)
const SECTION_CONFIG = [
  { key: 'ctaAnalysis', name: 'CTA', id: 'cta-section', icon: '🎯', weight: 25 },
  { key: 'pageLoadSpeed', name: 'Page Speed', id: 'speed-section', icon: '⚡', weight: 25 },
  { key: 'socialProof', name: 'Social Proof', id: 'social-section', icon: '⭐', weight: 20 },
  { key: 'whitespaceAssessment', name: 'Whitespace', id: 'whitespace-section', icon: '📐', weight: 15 },
  { key: 'imageOptimization', name: 'Images', id: 'images-section', icon: '🖼️', weight: 10 },
  { key: 'fontUsage', name: 'Fonts', id: 'fonts-section', icon: '🔤', weight: 5 }
] as const

type SectionKey = typeof SECTION_CONFIG[number]['key']

/**
 * Get impact level based on score
 */
function getImpactLevel(score: number): ImpactLevel {
  if (score < 50) return 'Critical'
  if (score < 70) return 'High'
  return 'Medium'
}

/**
 * Get the first high-impact issue from a section, or the first issue if none are high-impact
 */
function getPrimaryIssue(issues: string[] = []): string {
  if (issues.length === 0) return ''

  const categorized = categorizeContent(issues, [])
  const highImpactIssue = categorized.issues.find(item => item.impact === 'High')

  return highImpactIssue?.text || categorized.issues[0]?.text || issues[0] || ''
}

/**
 * Get the first high-impact recommendation, or the first one if none are high-impact
 */
function getPrimaryRecommendation(recommendations: string[] = []): string {
  if (recommendations.length === 0) return ''

  const categorized = categorizeContent([], recommendations)
  const highImpactRec = categorized.recommendations.find(item => item.impact === 'High')

  return highImpactRec?.text || categorized.recommendations[0]?.text || recommendations[0] || ''
}

/**
 * Generate the #1 priority insight based on analysis results
 */
export function generatePriorityInsight(analysisResult: AnalysisResult): PriorityInsight | null {
  const sections = SECTION_CONFIG.map(config => {
    const section = analysisResult[config.key as SectionKey]
    if (!section) return null

    return {
      ...config,
      score: section.score,
      issues: section.issues || [],
      recommendations: section.recommendations || [],
      hasHighImpact: categorizeContent(section.issues || [], []).issues.some(i => i.impact === 'High')
    }
  }).filter((s): s is NonNullable<typeof s> => s !== null)

  if (sections.length === 0) return null

  // Sort by:
  // 1. Lowest score first
  // 2. Has high-impact issues
  // 3. Higher weight for tie-breaking
  sections.sort((a, b) => {
    // First by score (ascending)
    if (a.score !== b.score) return a.score - b.score

    // Then by high impact issues (prioritize sections with high-impact issues)
    if (a.hasHighImpact !== b.hasHighImpact) return a.hasHighImpact ? -1 : 1

    // Then by weight (descending - higher weight = more important)
    return b.weight - a.weight
  })

  const prioritySection = sections[0]
  const primaryIssue = getPrimaryIssue(prioritySection.issues)

  return {
    sectionName: prioritySection.name,
    sectionId: prioritySection.id,
    sectionScore: prioritySection.score,
    sectionIcon: prioritySection.icon,
    primaryIssue: primaryIssue || `Your ${prioritySection.name.toLowerCase()} score is ${prioritySection.score}/100`,
    impactLevel: getImpactLevel(prioritySection.score)
  }
}

/**
 * Get top priority fixes across all sections
 * Returns up to `limit` fixes, excluding sections that score >= 85
 */
export function getTopPriorityFixes(analysisResult: AnalysisResult, limit: number = 3): PriorityFix[] {
  const COLLAPSE_THRESHOLD = 85

  const sections = SECTION_CONFIG.map(config => {
    const section = analysisResult[config.key as SectionKey]
    if (!section || section.score >= COLLAPSE_THRESHOLD) return null

    return {
      ...config,
      score: section.score,
      issues: section.issues || [],
      recommendations: section.recommendations || [],
      hasHighImpact: categorizeContent(section.issues || [], []).issues.some(i => i.impact === 'High')
    }
  }).filter((s): s is NonNullable<typeof s> => s !== null)

  if (sections.length === 0) return []

  // Sort by:
  // 1. Lowest score first
  // 2. Has high-impact issues
  // 3. Higher weight for tie-breaking
  sections.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    if (a.hasHighImpact !== b.hasHighImpact) return a.hasHighImpact ? -1 : 1
    return b.weight - a.weight
  })

  return sections.slice(0, limit).map(section => ({
    sectionName: section.name,
    sectionId: section.id,
    sectionScore: section.score,
    sectionIcon: section.icon,
    recommendation: getPrimaryRecommendation(section.recommendations) ||
                    getPrimaryIssue(section.issues) ||
                    `Improve your ${section.name.toLowerCase()} score`,
    severity: getImpactLevel(section.score)
  }))
}
