import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import { MetricsGrid, MetricItem } from '../ui/MetricsGrid'
import AccordionSection from '../AccordionSection'
import { categorizeContent, groupByImpact } from '@/lib/impact-analyzer'

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
  const categorized = categorizeContent(imageOptimization.issues, imageOptimization.recommendations)
  const groupedIssues = groupByImpact(categorized.issues)
  const groupedRecommendations = groupByImpact(categorized.recommendations)

  return (
    <div id="images-section">
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

        <div className="space-y-4">
          {Object.entries(groupedIssues).map(([impact, items]) => (
            <AccordionSection
              key={`images-issues-${impact}`}
              title="Issues"
              impact={impact as any}
              items={items}
              type="issues"
              defaultOpen={impact === 'High'}
            />
          ))}
          {Object.entries(groupedRecommendations).map(([impact, items]) => (
            <AccordionSection
              key={`images-recommendations-${impact}`}
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