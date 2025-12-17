import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import { MetricsGrid, MetricItem } from '../ui/MetricsGrid'
import { IssuesWithFixesList } from '../IssueWithFix'
import { pairIssuesWithFixes } from '@/lib/issue-fix-pairer'

interface ImageOptimization {
  score: number
  totalImages: number
  modernFormats: number
  withAltText: number
  appropriatelySized: number
  issues: string[]
  recommendations: string[]
  details: any
}

interface ImageOptimizationSectionProps {
  imageOptimization: ImageOptimization
}

const categoryConfig = {
  icon: '🖼️',
  colorTheme: 'indigo',
  bgClass: 'bg-indigo-950/20',
  borderClass: 'border-indigo-800/40',
  iconClass: 'text-indigo-400',
  impact: 'Low Impact'
}

export default function ImageOptimizationSection({ imageOptimization }: ImageOptimizationSectionProps) {
  const pairs = pairIssuesWithFixes(imageOptimization.issues, imageOptimization.recommendations)
  const hasHighImpact = pairs.some(p => p.impact === 'High')

  return (
    <div>
      <div className={`rounded-xl border p-8 ${categoryConfig.bgClass} ${categoryConfig.borderClass}`}>
        <SectionHeader
          title="Image Optimization"
          score={imageOptimization.score}
          config={categoryConfig}
        />

        <MetricsGrid className="mb-6">
          <MetricItem label="Total Images" value={imageOptimization.totalImages} />
          <MetricItem label="Modern Formats" value={imageOptimization.modernFormats} />
          <MetricItem label="With Alt Text" value={imageOptimization.withAltText} />
          <MetricItem label="Properly Sized" value={imageOptimization.appropriatelySized} />
        </MetricsGrid>

        <IssuesWithFixesList
          pairs={pairs}
          defaultOpen={hasHighImpact}
        />
      </div>
    </div>
  )
} 