import React from 'react'
import Image from 'next/image'
import AccordionSection from './AccordionSection'
import { categorizeContent, groupByImpact } from '@/lib/impact-analyzer'

interface AnalysisResult {
  url: string
  pageLoadSpeed?: {
    score: number
    metrics: {
      loadTime: number; // Page load time in seconds (marketing-friendly)
      speedDescription: string; // Marketing-friendly description
      relativeTo: string; // Comparison to other websites
    }
    issues: string[]
    recommendations: string[]
    loadTime: number
  }
  fontUsage?: {
    score: number
    fontFamilies: string[]
    fontCount: number
    systemFontCount?: number
    webFontCount?: number
    issues: string[]
    recommendations: string[]
  }
  imageOptimization?: {
    score: number
    totalImages: number
    modernFormats: number
    withAltText: number
    appropriatelySized: number
    issues: string[]
    recommendations: string[]
    details: any
  }
  ctaAnalysis?: {
    score: number
    ctas: Array<{ 
      text: string; 
      type?: string;
      confidence?: number; 
      aboveFold?: boolean;
      isAboveFold?: boolean;
      actionStrength?: string;
      urgency?: string;
      visibility?: string;
      context?: string;
    }>
    primaryCTA?: {
      text: string;
      type?: string;
      actionStrength?: string;
      visibility?: string;
      context?: string;
    }
    issues: string[]
    recommendations: string[]
  }
  whitespaceAssessment?: {
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
  socialProof?: {
    score: number
    elements: Array<{ 
      type: string; 
      text: string;
      score: number;
      isAboveFold: boolean;
      hasImage: boolean;
      hasName: boolean;
      hasCompany: boolean;
      hasRating: boolean;
      credibilityScore: number;
      visibility: string;
      context: string;
    }>
    summary: {
      totalElements: number;
      aboveFoldElements: number;
      testimonials: number;
      reviews: number;
      ratings: number;
      trustBadges: number;
      customerCounts: number;
      socialMedia: number;
      certifications: number;
      partnerships: number;
      caseStudies: number;
      newsMentions: number;
    }
    issues: string[]
    recommendations: string[]
  }
  overallScore: number
  status: string
  screenshotUrl?: string | null
}

interface AnalysisResultsProps {
  result: AnalysisResult
  analysisId?: string
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Standardized Badge Components
function ScoreBadge({ score, testId }: { score: number; testId?: string }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(score)} border border-current bg-current/10`}
      data-testid={testId}
    >
      {score}/100
    </span>
  )
}

function ImpactBadge({ impact, colorTheme }: { impact: string; colorTheme: string }) {
  const getImpactStyle = (level: string, theme: string) => {
    switch (level) {
      case 'High Impact':
        return 'bg-red-900/30 text-red-300 border-red-700/50'
      case 'Medium Impact':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50'
      case 'Low Impact':
        return 'bg-blue-900/30 text-blue-300 border-blue-700/50'
      case 'Needs Attention':
        return 'bg-orange-900/30 text-orange-300 border-orange-700/50'
      default:
        return `bg-${theme}-900/30 text-${theme}-300 border-${theme}-700/50`
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactStyle(impact, colorTheme)}`}>
      {impact}
    </span>
  )
}

function CategoryTag({ children, colorTheme }: { children: React.ReactNode; colorTheme: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-${colorTheme}-900/20 text-${colorTheme}-300 border border-${colorTheme}-800/30`}>
      {children}
    </span>
  )
}

// Category configuration with icons and color themes
const categoryConfig = {
  'Page Load Speed': {
    icon: '⚡',
    colorTheme: 'blue',
    bgClass: 'bg-blue-950/20',
    borderClass: 'border-blue-800/40',
    iconClass: 'text-blue-400',
    impact: 'High Impact'
  },
  'CTA Analysis': {
    icon: '🎯',
    colorTheme: 'purple', 
    bgClass: 'bg-purple-950/20',
    borderClass: 'border-purple-800/40',
    iconClass: 'text-purple-400',
    impact: 'Needs Attention'
  },
  'Social Proof': {
    icon: '⭐',
    colorTheme: 'amber',
    bgClass: 'bg-amber-950/20', 
    borderClass: 'border-amber-800/40',
    iconClass: 'text-amber-400',
    impact: 'Medium Impact'
  },
  'Whitespace Assessment': {
    icon: '📐',
    colorTheme: 'green',
    bgClass: 'bg-green-950/20',
    borderClass: 'border-green-800/40', 
    iconClass: 'text-green-400',
    impact: 'Medium Impact'
  },
  'Image Optimization': {
    icon: '🖼️',
    colorTheme: 'indigo',
    bgClass: 'bg-indigo-950/20',
    borderClass: 'border-indigo-800/40',
    iconClass: 'text-indigo-400',
    impact: 'Low Impact'
  },
  'Font Usage': {
    icon: '🔤',
    colorTheme: 'teal',
    bgClass: 'bg-teal-950/20',
    borderClass: 'border-teal-800/40',
    iconClass: 'text-teal-400',
    impact: 'Low Impact'
  }
} as const;

// Standardized Section Header Component
function SectionHeader({ title, score, config }: { title: string; score: number; config: any }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className={`text-2xl ${config.iconClass}`} aria-hidden="true">
          {config.icon}
        </span>
        <h3 className="text-xl font-bold text-gray-100">{title}</h3>
        <ImpactBadge impact={config.impact} colorTheme={config.colorTheme} />
      </div>
      <ScoreBadge score={score} testId={`score-badge-${title.toLowerCase().replace(/\s+/g, '-')}`} />
    </div>
  )
}

// Standardized Metrics Grid Component
function MetricsGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-4 text-sm mb-6 ${className}`}>
      {children}
    </div>
  )
}

function MetricItem({ label, value, colorTheme = "gray" }: { label: string; value: string | number; colorTheme?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</span>
      <span className={`text-gray-100 font-semibold`}>{value}</span>
    </div>
  )
}

// Standardized Performance Bar Component
function PerformanceBar({ score, description, colorTheme }: { score: number; description: string; colorTheme: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-100 font-semibold text-sm uppercase tracking-wide">Performance</h4>
        <span className="text-sm text-gray-400">{score}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-3">
        <div 
          className={`${getScoreBarColor(score)} h-2.5 rounded-full transition-all duration-300`}
          style={{width: `${score}%`}}
        ></div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
    </div>
  )
}

export default function AnalysisResults({ result, analysisId }: AnalysisResultsProps) {
  const [showAllCtas, setShowAllCtas] = React.useState(false)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Analysis Categories - Ordered by Priority/Weight */}
      <div className="grid grid-cols-1 gap-8">
        {/* Page Load Speed - 25% weight */}
        {result.pageLoadSpeed && (
          <div id="speed-section">
            <div className={`rounded-xl border p-8 ${categoryConfig['Page Load Speed'].bgClass} ${categoryConfig['Page Load Speed'].borderClass}`}>
              <SectionHeader 
                title="Page Load Speed" 
                score={result.pageLoadSpeed.score} 
                config={categoryConfig['Page Load Speed']} 
              />

              <PerformanceBar 
                score={result.pageLoadSpeed.score}
                description={`${result.pageLoadSpeed.metrics.speedDescription} - ${result.pageLoadSpeed.metrics.relativeTo}`}
                colorTheme={categoryConfig['Page Load Speed'].colorTheme}
              />

              {(() => {
                const categorized = categorizeContent(result.pageLoadSpeed.issues, result.pageLoadSpeed.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
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
                )
              })()}
            </div>
          </div>
        )}

        {/* CTA Analysis - 25% weight */}
        {result.ctaAnalysis && (
          <div id="cta-section">
            <div className={`rounded-xl border p-8 ${categoryConfig['CTA Analysis'].bgClass} ${categoryConfig['CTA Analysis'].borderClass}`}>
              <SectionHeader 
                title="CTA Analysis" 
                score={result.ctaAnalysis.score} 
                config={categoryConfig['CTA Analysis']} 
              />

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                {/* Left Column - Primary CTA */}
                <div>
                  <h4 className="text-gray-100 font-semibold text-sm uppercase tracking-wide mb-4">Primary CTA</h4>
                  {result.ctaAnalysis.primaryCTA ? (
                    <div className="space-y-4">
                      <div className="text-xl font-semibold text-gray-100 leading-relaxed">
                        "{result.ctaAnalysis.primaryCTA.text}"
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2.5">
                        <div 
                          className={`${getScoreBarColor(result.ctaAnalysis.score)} h-2.5 rounded-full transition-all duration-300`}
                          style={{width: `${result.ctaAnalysis.score}%`}}
                        ></div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Strength:</span>
                          <CategoryTag colorTheme={categoryConfig['CTA Analysis'].colorTheme}>
                            {result.ctaAnalysis.primaryCTA.actionStrength}
                          </CategoryTag>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Visibility:</span>
                          <CategoryTag colorTheme={categoryConfig['CTA Analysis'].colorTheme}>
                            {result.ctaAnalysis.primaryCTA.visibility}
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
                  {result.ctaAnalysis.ctas && result.ctaAnalysis.ctas.length > 1 ? (
                    <div className="space-y-3">
                      {result.ctaAnalysis.ctas.slice(1, 4).map((cta, index) => (
                        <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                          <div className="text-sm font-medium text-gray-200 mb-2">"{cta.text}"</div>
                          <div className="flex items-center gap-2 text-xs">
                            <CategoryTag colorTheme={categoryConfig['CTA Analysis'].colorTheme}>
                              {cta.actionStrength}
                            </CategoryTag>
                            <CategoryTag colorTheme={categoryConfig['CTA Analysis'].colorTheme}>
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

              {(() => {
                const categorized = categorizeContent(result.ctaAnalysis.issues, result.ctaAnalysis.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
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
                )
              })()}
            </div>
          </div>
        )}

        {/* Social Proof - 20% weight */}
        {result.socialProof && (
          <div id="social-section">
            <div className={`rounded-xl border p-8 ${categoryConfig['Social Proof'].bgClass} ${categoryConfig['Social Proof'].borderClass}`}>
              <SectionHeader 
                title="Social Proof" 
                score={result.socialProof.score} 
                config={categoryConfig['Social Proof']} 
              />
              
              <MetricsGrid className="mb-6">
                <MetricItem label="Total Elements" value={result.socialProof.summary.totalElements} />
                <MetricItem label="Above Fold" value={result.socialProof.summary.aboveFoldElements} />
                <MetricItem label="Testimonials" value={result.socialProof.summary.testimonials} />
                <MetricItem label="Reviews" value={result.socialProof.summary.reviews} />
                <MetricItem label="Trust Badges" value={result.socialProof.summary.trustBadges} />
                <MetricItem label="Customer Counts" value={result.socialProof.summary.customerCounts} />
              </MetricsGrid>
              
              {result.socialProof.elements.length > 0 ? (
                <div className="mb-6">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-100 mb-4">Social Proof Elements</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {result.socialProof.elements.map((element, index) => (
                      <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <CategoryTag colorTheme={categoryConfig['Social Proof'].colorTheme}>
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
              
              {(() => {
                const categorized = categorizeContent(result.socialProof.issues, result.socialProof.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-4">
                    {Object.entries(groupedIssues).map(([impact, items]) => (
                      <AccordionSection
                        key={`social-issues-${impact}`}
                        title="Issues"
                        impact={impact as any}
                        items={items}
                        type="issues"
                        defaultOpen={impact === 'High'}
                      />
                    ))}
                    {Object.entries(groupedRecommendations).map(([impact, items]) => (
                      <AccordionSection
                        key={`social-recommendations-${impact}`}
                        title="Recommendations"
                        impact={impact as any}
                        items={items}
                        type="recommendations"
                        defaultOpen={impact === 'High'}
                      />
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Whitespace Assessment - 15% weight */}
        {result.whitespaceAssessment && (
          <div id="whitespace-section">
            <div className={`rounded-xl border p-8 ${categoryConfig['Whitespace Assessment'].bgClass} ${categoryConfig['Whitespace Assessment'].borderClass}`}>
              <SectionHeader 
                title="Whitespace Assessment" 
                score={result.whitespaceAssessment.score} 
                config={categoryConfig['Whitespace Assessment']} 
              />
              
              <MetricsGrid className="mb-6">
                <MetricItem label="Whitespace Ratio" value={result.whitespaceAssessment.metrics.whitespaceRatio.toFixed(2)} />
                <MetricItem label="Clutter Score" value={result.whitespaceAssessment.metrics.clutterScore} />
                <MetricItem label="Avg Element Density" value={result.whitespaceAssessment.metrics.elementDensityPerSection.averageDensity.toFixed(2)} />
                <MetricItem label="Spacing Adequate" value={result.whitespaceAssessment.metrics.hasAdequateSpacing ? 'Yes' : 'No'} />
              </MetricsGrid>

              {(() => {
                const categorized = categorizeContent(result.whitespaceAssessment.issues, result.whitespaceAssessment.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
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
                )
              })()}
            </div>
          </div>
        )}

        {/* Image Optimization - 10% weight */}
        {result.imageOptimization && (
          <div id="images-section">
            <div className={`rounded-xl border p-8 ${categoryConfig['Image Optimization'].bgClass} ${categoryConfig['Image Optimization'].borderClass}`}>
              <SectionHeader 
                title="Image Optimization" 
                score={result.imageOptimization.score} 
                config={categoryConfig['Image Optimization']} 
              />
              
              <MetricsGrid className="mb-6">
                <MetricItem label="Total Images" value={result.imageOptimization.totalImages} />
                <MetricItem label="Modern Formats" value={result.imageOptimization.modernFormats} />
                <MetricItem label="With Alt Text" value={result.imageOptimization.withAltText} />
                <MetricItem label="Properly Sized" value={result.imageOptimization.appropriatelySized} />
              </MetricsGrid>

              {(() => {
                const categorized = categorizeContent(result.imageOptimization.issues, result.imageOptimization.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
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
                )
              })()}
            </div>
          </div>
        )}

        {/* Font Usage - 5% weight */}
        {result.fontUsage && (
          <div id="fonts-section">
            <div className={`rounded-xl border p-8 ${categoryConfig['Font Usage'].bgClass} ${categoryConfig['Font Usage'].borderClass}`}>
              <SectionHeader 
                title="Font Usage" 
                score={result.fontUsage.score} 
                config={categoryConfig['Font Usage']} 
              />
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-100">Font Families</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">Total: <span className="text-gray-100 font-semibold">{result.fontUsage.fontCount}</span></span>
                    {result.fontUsage.systemFontCount !== undefined && result.fontUsage.webFontCount !== undefined && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">System: <span className="text-gray-100">{result.fontUsage.systemFontCount}</span></span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">Web: <span className="text-gray-100">{result.fontUsage.webFontCount}</span></span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.fontUsage.fontFamilies.map((font, index) => (
                    <CategoryTag key={index} colorTheme={categoryConfig['Font Usage'].colorTheme}>
                      {font}
                    </CategoryTag>
                  ))}
                </div>
              </div>

              {(() => {
                const categorized = categorizeContent(result.fontUsage.issues, result.fontUsage.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-4">
                    {Object.entries(groupedIssues).map(([impact, items]) => (
                      <AccordionSection
                        key={`fonts-issues-${impact}`}
                        title="Issues"
                        impact={impact as any}
                        items={items}
                        type="issues"
                        defaultOpen={impact === 'High'}
                      />
                    ))}
                    {Object.entries(groupedRecommendations).map(([impact, items]) => (
                      <AccordionSection
                        key={`fonts-recommendations-${impact}`}
                        title="Recommendations"
                        impact={impact as any}
                        items={items}
                        type="recommendations"
                        defaultOpen={impact === 'High'}
                      />
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Screenshot Section */}
      {result.screenshotUrl && (
        <div className="rounded-xl border border-gray-700 p-8 bg-gray-800/20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl text-blue-400" aria-hidden="true">📸</span>
            <h3 className="text-xl font-bold text-gray-100">Full Landing Page Screenshot</h3>
          </div>
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <Image 
                src={result.screenshotUrl} 
                alt={`Screenshot of ${result.url}`}
                width={800}
                height={600}
                className="w-full object-cover object-top border border-gray-600 rounded"
              />
            </div>
            
            {/* Scroll indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2">
              <span>Scroll to see full page</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            Full-page screenshot captured during analysis for visual reference and whitespace assessment.
          </p>
        </div>
      )}
    </div>
  )
}