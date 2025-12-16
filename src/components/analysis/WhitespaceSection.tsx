import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import { MetricsGrid, MetricItem } from '../ui/MetricsGrid'
import AccordionSection from '../AccordionSection'
import { categorizeContent, groupByImpact } from '@/lib/impact-analyzer'

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
  const categorized = categorizeContent(whitespaceAssessment.issues, whitespaceAssessment.recommendations)
  const groupedIssues = groupByImpact(categorized.issues)
  const groupedRecommendations = groupByImpact(categorized.recommendations)

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

        <div className="space-y-4">
          {Object.entries(groupedIssues).map(([impact, items]) => (
            <AccordionSection
              key={`whitespace-issues-${impact}`}
              title="Issues"
              impact={impact as any}
              items={items}
              type="issues"
              defaultOpen={impact === 'High'}
            />
          ))}
          {Object.entries(groupedRecommendations).map(([impact, items]) => (
            <AccordionSection
              key={`whitespace-recommendations-${impact}`}
              title="Recommendations"
              impact={impact as any}
              items={items}
              type="recommendations"
              defaultOpen={impact === 'High'}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 