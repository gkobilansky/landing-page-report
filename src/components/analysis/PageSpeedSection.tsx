import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import PerformanceBar from '../ui/PerformanceBar'
import AccordionSection from '../AccordionSection'
import { categorizeContent, groupByImpact } from '@/lib/impact-analyzer'

interface PageLoadSpeed {
  score: number
  metrics: {
    loadTime: number
    speedDescription: string
    relativeTo: string
  }
  issues: string[]
  recommendations: string[]
  loadTime: number
}

interface PageSpeedSectionProps {
  pageLoadSpeed: PageLoadSpeed
}

const categoryConfig = {
  icon: '⚡',
  colorTheme: 'blue',
  bgClass: 'bg-blue-950/20',
  borderClass: 'border-blue-800/40',
  iconClass: 'text-blue-400',
  impact: 'High Impact'
}

export default function PageSpeedSection({ pageLoadSpeed }: PageSpeedSectionProps) {
  const categorized = categorizeContent(pageLoadSpeed.issues, pageLoadSpeed.recommendations)
  const groupedIssues = groupByImpact(categorized.issues)
  const groupedRecommendations = groupByImpact(categorized.recommendations)

  return (
    <div>
      <div className={`rounded-xl border p-8 ${categoryConfig.bgClass} ${categoryConfig.borderClass}`}>
        <SectionHeader 
          title="Page Load Speed" 
          score={pageLoadSpeed.score} 
          config={categoryConfig} 
        />

        <PerformanceBar 
          score={pageLoadSpeed.score}
          description={`${pageLoadSpeed.metrics.speedDescription} - ${pageLoadSpeed.metrics.relativeTo}`}
          colorTheme={categoryConfig.colorTheme}
        />

        <div className="space-y-4">
          {Object.entries(groupedIssues).map(([impact, items]) => (
            <AccordionSection
              key={`issues-${impact}`}
              title="Issues"
              impact={impact as any}
              items={items}
              type="issues"
              defaultOpen={impact === 'High'}
            />
          ))}
          {Object.entries(groupedRecommendations).map(([impact, items]) => (
            <AccordionSection
              key={`recommendations-${impact}`}
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