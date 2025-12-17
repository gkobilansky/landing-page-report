import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import PerformanceBar from '../ui/PerformanceBar'
import { IssuesWithFixesList } from '../IssueWithFix'
import { pairIssuesWithFixes } from '@/lib/issue-fix-pairer'

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
  const pairs = pairIssuesWithFixes(pageLoadSpeed.issues, pageLoadSpeed.recommendations)
  const hasHighImpact = pairs.some(p => p.impact === 'High')

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

        <IssuesWithFixesList
          pairs={pairs}
          defaultOpen={hasHighImpact}
        />
      </div>
    </div>
  )
} 