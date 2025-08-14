import React from 'react'
import SectionHeader from '../ui/SectionHeader'
import CategoryTag from '../ui/CategoryTag'
import AccordionSection from '../AccordionSection'
import { categorizeContent, groupByImpact } from '@/lib/impact-analyzer'

interface CTAAnalysis {
  score: number
  ctas: Array<{ 
    text: string
    type?: string
    confidence?: number
    aboveFold?: boolean
    isAboveFold?: boolean
    actionStrength?: string
    urgency?: string
    visibility?: string
    context?: string
  }>
  primaryCTA?: {
    text: string
    type?: string
    actionStrength?: string
    visibility?: string
    context?: string
  }
  issues: string[]
  recommendations: string[]
}

interface CTASectionProps {
  ctaAnalysis: CTAAnalysis
}

const categoryConfig = {
  icon: '🎯',
  colorTheme: 'purple', 
  bgClass: 'bg-purple-950/20',
  borderClass: 'border-purple-800/40',
  iconClass: 'text-purple-400',
  impact: 'High Impact'
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function CTASection({ ctaAnalysis }: CTASectionProps) {
  const categorized = categorizeContent(ctaAnalysis.issues, ctaAnalysis.recommendations)
  const groupedIssues = groupByImpact(categorized.issues)
  const groupedRecommendations = groupByImpact(categorized.recommendations)

  return (
    <div id="cta-section">
      <div className={`rounded-xl border p-8 ${categoryConfig.bgClass} ${categoryConfig.borderClass}`}>
        <SectionHeader 
          title="CTA Analysis" 
          score={ctaAnalysis.score} 
          config={categoryConfig} 
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Left Column - Primary CTA */}
          <div>
            <h4 className="text-gray-100 font-semibold text-sm uppercase tracking-wide mb-4">Primary CTA</h4>
            {ctaAnalysis.primaryCTA ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold text-gray-100 leading-relaxed">
                  &ldquo;{ctaAnalysis.primaryCTA.text}&rdquo;
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div 
                    className={`${getScoreBarColor(ctaAnalysis.score)} h-2.5 rounded-full transition-all duration-300`}
                    style={{width: `${ctaAnalysis.score}%`}}
                  ></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Strength:</span>
                    <CategoryTag colorTheme={categoryConfig.colorTheme}>
                      {ctaAnalysis.primaryCTA.actionStrength}
                    </CategoryTag>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Visibility:</span>
                    <CategoryTag colorTheme={categoryConfig.colorTheme}>
                      {ctaAnalysis.primaryCTA.visibility}
                    </CategoryTag>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No primary CTA identified</div>
            )}
          </div>

          {/* Right Column - Secondary CTAs */}
          <div>
            <h4 className="text-gray-100 font-semibold text-sm uppercase tracking-wide mb-4">Secondary CTAs</h4>
            {ctaAnalysis.ctas && ctaAnalysis.ctas.length > 1 ? (
              <div className="space-y-3">
                {ctaAnalysis.ctas.slice(1, 4).map((cta, index) => (
                  <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-sm font-medium text-gray-200 mb-2">&ldquo;{cta.text}&rdquo;</div>
                    <div className="flex items-center gap-2 text-xs">
                      <CategoryTag colorTheme={categoryConfig.colorTheme}>
                        {cta.actionStrength}
                      </CategoryTag>
                      <CategoryTag colorTheme={categoryConfig.colorTheme}>
                        {cta.visibility}
                      </CategoryTag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No secondary CTAs found</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedIssues).map(([impact, items]) => (
            <AccordionSection
              key={`cta-issues-${impact}`}
              title="Issues"
              impact={impact as any}
              items={items}
              type="issues"
              defaultOpen={impact === 'High'}
            />
          ))}
          {Object.entries(groupedRecommendations).map(([impact, items]) => (
            <AccordionSection
              key={`cta-recommendations-${impact}`}
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