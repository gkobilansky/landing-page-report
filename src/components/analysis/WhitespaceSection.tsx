import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import { MetricsGrid, MetricItem } from '../ui/MetricsGrid'
import { IssuesWithFixesList } from '../IssueWithFix'
import { pairIssuesWithFixes } from '@/lib/issue-fix-pairer'

interface WhitespaceAssessment {
  score: number
  metrics: {
    whitespaceRatio: number
    elementDensityPerSection: {
      gridSections: number
      maxDensity: number
      averageDensity: number
      totalElements: number
    }
    spacingAnalysis: {
      headlineSpacing: { adequate: boolean }
      ctaSpacing: { adequate: boolean }
      contentBlockSpacing: { adequate: boolean }
      lineHeight: { adequate: boolean }
    }
    clutterScore: number
    hasAdequateSpacing: boolean
  }
  issues: string[]
  recommendations: string[]
  loadTime: number
}

interface WhitespaceSectionProps {
  whitespaceAssessment: WhitespaceAssessment
}

const categoryConfig = {
  icon: '📐',
  colorTheme: 'green',
  bgClass: 'bg-green-950/20',
  borderClass: 'border-green-800/40', 
  iconClass: 'text-green-400',
  impact: 'Medium Impact'
}

export default function WhitespaceSection({ whitespaceAssessment }: WhitespaceSectionProps) {
  const pairs = pairIssuesWithFixes(whitespaceAssessment.issues, whitespaceAssessment.recommendations)
  const hasHighImpact = pairs.some(p => p.impact === 'High')

  return (
    <div>
      <div className={`rounded-xl border p-8 ${categoryConfig.bgClass} ${categoryConfig.borderClass}`}>
        <SectionHeader
          title="Whitespace Assessment"
          score={whitespaceAssessment.score}
          config={categoryConfig}
        />

        <MetricsGrid className="mb-6">
          <MetricItem label="Whitespace Ratio" value={whitespaceAssessment.metrics.whitespaceRatio.toFixed(2)} />
          <MetricItem label="Clutter Score" value={whitespaceAssessment.metrics.clutterScore} />
          <MetricItem label="Avg Element Density" value={whitespaceAssessment.metrics.elementDensityPerSection.averageDensity.toFixed(2)} />
          <MetricItem label="Spacing Adequate" value={whitespaceAssessment.metrics.hasAdequateSpacing ? 'Yes' : 'No'} />
        </MetricsGrid>

        <IssuesWithFixesList
          pairs={pairs}
          defaultOpen={hasHighImpact}
        />
      </div>
    </div>
  )
} 