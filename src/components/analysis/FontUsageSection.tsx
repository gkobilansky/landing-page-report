import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import CategoryTag from '../ui/CategoryTag'
import { IssuesWithFixesList } from '../IssueWithFix'
import { pairIssuesWithFixes } from '@/lib/issue-fix-pairer'

interface FontUsage {
  score: number
  fontFamilies: string[]
  fontCount: number
  systemFontCount?: number
  webFontCount?: number
  issues: string[]
  recommendations: string[]
}

interface FontUsageSectionProps {
  fontUsage: FontUsage
}

const categoryConfig = {
  icon: '🔤',
  colorTheme: 'teal',
  bgClass: 'bg-teal-950/20',
  borderClass: 'border-teal-800/40',
  iconClass: 'text-teal-400',
  impact: 'Low Impact'
}

export default function FontUsageSection({ fontUsage }: FontUsageSectionProps) {
  const pairs = pairIssuesWithFixes(fontUsage.issues, fontUsage.recommendations)
  const hasHighImpact = pairs.some(p => p.impact === 'High')

  return (
    <div>
      <div className={`rounded-xl border p-8 ${categoryConfig.bgClass} ${categoryConfig.borderClass}`}>
        <SectionHeader
          title="Font Usage"
          score={fontUsage.score}
          config={categoryConfig}
        />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-100">Font Families</h4>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400">Total: <span className="text-gray-100 font-semibold">{fontUsage.fontCount}</span></span>
              {fontUsage.systemFontCount !== undefined && fontUsage.webFontCount !== undefined && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">System: <span className="text-gray-100">{fontUsage.systemFontCount}</span></span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Web: <span className="text-gray-100">{fontUsage.webFontCount}</span></span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {fontUsage.fontFamilies.map((font, index) => (
              <CategoryTag key={index} colorTheme={categoryConfig.colorTheme}>
                {font}
              </CategoryTag>
            ))}
          </div>
        </div>

        <IssuesWithFixesList
          pairs={pairs}
          defaultOpen={hasHighImpact}
        />
      </div>
    </div>
  )
} 