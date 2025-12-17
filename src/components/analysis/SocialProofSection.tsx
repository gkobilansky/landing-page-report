import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import CategoryTag from '../ui/CategoryTag'
import { MetricsGrid, MetricItem } from '../ui/MetricsGrid'
import { IssuesWithFixesList } from '../IssueWithFix'
import { pairIssuesWithFixes } from '@/lib/issue-fix-pairer'

interface SocialProof {
  score: number
  elements: Array<{ 
    type: string
    text: string
    score: number
    isAboveFold: boolean
    hasImage: boolean
    hasName: boolean
    hasCompany: boolean
    hasRating: boolean
    credibilityScore: number
    visibility: string
    context: string
  }>
  summary: {
    totalElements: number
    aboveFoldElements: number
    testimonials: number
    reviews: number
    ratings: number
    trustBadges: number
    customerCounts: number
    socialMedia: number
    certifications: number
    partnerships: number
    caseStudies: number
    newsMentions: number
  }
  issues: string[]
  recommendations: string[]
}

interface SocialProofSectionProps {
  socialProof: SocialProof
}

const categoryConfig = {
  icon: '⭐',
  colorTheme: 'amber',
  bgClass: 'bg-amber-950/20', 
  borderClass: 'border-amber-800/40',
  iconClass: 'text-amber-400',
  impact: 'Medium Impact'
}

export default function SocialProofSection({ socialProof }: SocialProofSectionProps) {
  const pairs = pairIssuesWithFixes(socialProof.issues, socialProof.recommendations)
  const hasHighImpact = pairs.some(p => p.impact === 'High')

  return (
    <div>
      <div className={`rounded-xl border p-8 ${categoryConfig.bgClass} ${categoryConfig.borderClass}`}>
        <SectionHeader
          title="Social Proof"
          score={socialProof.score}
          config={categoryConfig}
        />

        <MetricsGrid className="mb-6">
          <MetricItem label="Total Elements" value={socialProof.summary.totalElements} />
          <MetricItem label="Above Fold" value={socialProof.summary.aboveFoldElements} />
          <MetricItem label="Testimonials" value={socialProof.summary.testimonials} />
          <MetricItem label="Reviews" value={socialProof.summary.reviews} />
          <MetricItem label="Trust Badges" value={socialProof.summary.trustBadges} />
          <MetricItem label="Customer Counts" value={socialProof.summary.customerCounts} />
        </MetricsGrid>

        {socialProof.elements.length > 0 ? (
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-100 mb-4">Social Proof Elements</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {socialProof.elements.map((element, index) => (
                <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <CategoryTag colorTheme={categoryConfig.colorTheme}>
                      {element.type.replace('-', ' ')}
                    </CategoryTag>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${element.isAboveFold ? 'bg-green-900/30 text-green-300' : 'bg-gray-700/30 text-gray-400'}`}>
                        {element.isAboveFold ? 'Above Fold' : 'Below Fold'}
                      </span>
                      <span className="text-gray-500">
                        {element.credibilityScore}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {element.text.length > 120 ? element.text.substring(0, 120) + '...' : element.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm mb-6">No social proof elements detected.</div>
        )}

        <IssuesWithFixesList
          pairs={pairs}
          defaultOpen={hasHighImpact}
        />
      </div>
    </div>
  )
} 