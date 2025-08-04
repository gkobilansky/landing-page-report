import React from 'react'
import Image from 'next/image'
import AccordionSection from './AccordionSection'
import { categorizeContent, groupByImpact } from '@/lib/impact-analyzer'

interface AnalysisResult {
  url: string
  pageLoadSpeed?: {
    score: number
    grade: string
    metrics: {
      loadTime: number; // Page load time in seconds (marketing-friendly)
      performanceGrade: string; // A, B, C, D, F
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
    grade: string
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
  if (score >= 90) return 'text-green-300';
  if (score >= 80) return 'text-yellow-300';
  if (score >= 70) return 'text-orange-300';
  return 'text-red-300';
}

function getScoreGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function ScoreBadge({ score, testId }: { score: number; testId?: string }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)} border border-current`}
      data-testid={testId}
    >
      {score}
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
    iconClass: 'text-blue-400'
  },
  'CTA Analysis': {
    icon: '🎯',
    colorTheme: 'purple', 
    bgClass: 'bg-purple-950/20',
    borderClass: 'border-purple-800/40',
    iconClass: 'text-purple-400'
  },
  'Social Proof': {
    icon: '⭐',
    colorTheme: 'amber',
    bgClass: 'bg-amber-950/20', 
    borderClass: 'border-amber-800/40',
    iconClass: 'text-amber-400'
  },
  'Whitespace Assessment': {
    icon: '📐',
    colorTheme: 'green',
    bgClass: 'bg-green-950/20',
    borderClass: 'border-green-800/40', 
    iconClass: 'text-green-400'
  },
  'Image Optimization': {
    icon: '🖼️',
    colorTheme: 'indigo',
    bgClass: 'bg-indigo-950/20',
    borderClass: 'border-indigo-800/40',
    iconClass: 'text-indigo-400'
  },
  'Font Usage': {
    icon: '🔤',
    colorTheme: 'teal',
    bgClass: 'bg-teal-950/20',
    borderClass: 'border-teal-800/40',
    iconClass: 'text-teal-400'
  }
} as const;

function CategoryCard({ title, score, children }: { title: string; score?: number; children: React.ReactNode }) {
  const config = categoryConfig[title as keyof typeof categoryConfig];
  const cardClasses = config 
    ? `rounded-lg border p-6 ${config.bgClass} ${config.borderClass}`
    : "rounded-lg border border-gray-700 p-6 bg-gray-800/20";

  return (
    <div className={cardClasses}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {config && (
            <span className={`text-2xl ${config.iconClass}`} aria-hidden="true">
              {config.icon}
            </span>
          )}
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        </div>
        {score !== undefined && <ScoreBadge score={score} testId={`score-badge-${title.toLowerCase().replace(/\s+/g, '-')}`} />}
      </div>
      {children}
    </div>
  )
}

export default function AnalysisResults({ result, analysisId }: AnalysisResultsProps) {
  const [showAllCtas, setShowAllCtas] = React.useState(false)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}

      {/* Analysis Categories - Ordered by Priority/Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Page Load Speed - 25% weight */}
        {result.pageLoadSpeed && (
          <div id="speed-section">
            <CategoryCard title="Page Load Speed" score={result.pageLoadSpeed.score}>
            <div className="space-y-3 text-gray-300">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Load Time:</span> 
                  <span className="font-medium">{result.pageLoadSpeed.metrics.loadTime}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Performance:</span> 
                  <span className="font-medium">{result.pageLoadSpeed.metrics.speedDescription}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Compared to others:</span> 
                  <span className="font-medium text-blue-400">{result.pageLoadSpeed.metrics.relativeTo}</span>
                </div>
              </div>
{(() => {
                const categorized = categorizeContent(result.pageLoadSpeed.issues, result.pageLoadSpeed.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-3 mt-4">
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
            </CategoryCard>
          </div>
        )}

        {/* CTA Analysis - 25% weight */}
        {result.ctaAnalysis && (
          <div id="cta-section">
            <CategoryCard title="CTA Analysis" score={result.ctaAnalysis.score}>
            <div className="space-y-3 text-gray-300">
              {result.ctaAnalysis.primaryCTA && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-1">Primary CTA:</h4>
                  <p className="text-sm">
                    {result.ctaAnalysis.primaryCTA.text}
                    <span className="text-xs text-gray-500 ml-2">
                       (Strength: {result.ctaAnalysis.primaryCTA.actionStrength}, Visibility: {result.ctaAnalysis.primaryCTA.visibility})
                    </span>
                  </p>
                </div>
              )}
              {result.ctaAnalysis.ctas && result.ctaAnalysis.ctas.length > 0 && (
                 <div>
                    <div className="flex items-center justify-between mb-1 mt-3">
                      <h4 className="font-medium text-gray-100">All CTAs ({result.ctaAnalysis.ctas.length}):</h4>
                      {result.ctaAnalysis.ctas.length > 5 && (
                        <button
                          onClick={() => setShowAllCtas(!showAllCtas)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {showAllCtas ? 'Show Less' : `Show All (${result.ctaAnalysis.ctas.length})`}
                        </button>
                      )}
                    </div>
                    <ul className="space-y-1 text-sm">
                        {(showAllCtas ? result.ctaAnalysis.ctas : result.ctaAnalysis.ctas.slice(0, 5)).map((cta, index) => (
                            <li key={index} className="border-b border-gray-700 py-1 last:border-b-0">
                                {cta.text}
                                <span className="text-xs text-gray-500 ml-2">
                                    ({cta.isAboveFold ? 'Above Fold' : 'Below Fold'}, Strength: {cta.actionStrength}, Visibility: {cta.visibility})
                                </span>
                            </li>
                        ))}
                    </ul>
                 </div>
              )}
{(() => {
                const categorized = categorizeContent(result.ctaAnalysis.issues, result.ctaAnalysis.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-3 mt-4">
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
            </CategoryCard>
          </div>
        )}

        {/* Social Proof - 20% weight */}
        {result.socialProof && (
          <div id="social-section">
            <CategoryCard title="Social Proof" score={result.socialProof.score}>
            <div className="space-y-3 text-gray-300">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Elements:</span> {result.socialProof.summary.totalElements}
                </div>
                <div>
                  <span className="text-gray-400">Above Fold:</span> {result.socialProof.summary.aboveFoldElements}
                </div>
                <div>
                  <span className="text-gray-400">Testimonials:</span> {result.socialProof.summary.testimonials}
                </div>
                <div>
                  <span className="text-gray-400">Reviews:</span> {result.socialProof.summary.reviews}
                </div>
                <div>
                  <span className="text-gray-400">Trust Badges:</span> {result.socialProof.summary.trustBadges}
                </div>
                <div>
                  <span className="text-gray-400">Customer Counts:</span> {result.socialProof.summary.customerCounts}
                </div>
              </div>
              
              {result.socialProof.elements.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Social Proof Elements:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {result.socialProof.elements.map((element, index) => (
                      <div key={index} className="border-b border-gray-700 py-2 last:border-b-0">
                        <div className="text-sm">
                          <span className="inline-block bg-gray-700 text-gray-200 px-2 py-1 rounded mr-2 text-xs capitalize">
                            {element.type.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({element.isAboveFold ? 'Above Fold' : 'Below Fold'}, 
                            Credibility: {element.credibilityScore}/100)
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-gray-300">
                          {element.text.length > 80 ? element.text.substring(0, 80) + '...' : element.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm">No social proof elements detected.</p>
              )}
              
{(() => {
                const categorized = categorizeContent(result.socialProof.issues, result.socialProof.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-3 mt-4">
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
            </CategoryCard>
          </div>
        )}

        {/* Whitespace Assessment - 15% weight */}
        {result.whitespaceAssessment && (
          <div id="whitespace-section">
            <CategoryCard title="Whitespace Assessment" score={result.whitespaceAssessment.score}>
            <div className="space-y-3 text-gray-300">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Whitespace Ratio:</span> {result.whitespaceAssessment.metrics.whitespaceRatio.toFixed(2)}
                </div>
                <div>
                  <span className="text-gray-400">Clutter Score:</span> {result.whitespaceAssessment.metrics.clutterScore}
                </div>
                <div>
                  <span className="text-gray-400">Avg Element Density:</span> {result.whitespaceAssessment.metrics.elementDensityPerSection.averageDensity.toFixed(2)}
                </div>
                 <div>
                  <span className="text-gray-400">Spacing Adequate:</span> {result.whitespaceAssessment.metrics.hasAdequateSpacing ? 'Yes' : 'No'}
                </div>
              </div>
{(() => {
                const categorized = categorizeContent(result.whitespaceAssessment.issues, result.whitespaceAssessment.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-3 mt-4">
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
            </CategoryCard>
          </div>
        )}

        {/* Image Optimization - 10% weight */}
        {result.imageOptimization && (
          <div id="images-section">
            <CategoryCard title="Image Optimization" score={result.imageOptimization.score}>
            <div className="space-y-3 text-gray-300">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Images:</span> {result.imageOptimization.totalImages}
                </div>
                <div>
                  <span className="text-gray-400">Modern Formats:</span> {result.imageOptimization.modernFormats}
                </div>
                <div>
                  <span className="text-gray-400">With Alt Text:</span> {result.imageOptimization.withAltText}
                </div>
                <div>
                  <span className="text-gray-400">Properly Sized:</span> {result.imageOptimization.appropriatelySized}
                </div>
              </div>
{(() => {
                const categorized = categorizeContent(result.imageOptimization.issues, result.imageOptimization.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-3 mt-4">
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
            </CategoryCard>
          </div>
        )}

        {/* Font Usage - 5% weight */}
        {result.fontUsage && (
          <div id="fonts-section">
            <CategoryCard title="Font Usage" score={result.fontUsage.score}>
            <div className="space-y-3 text-gray-300">
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-400">Total Font Families: {result.fontUsage.fontCount}</span>
                  {result.fontUsage.systemFontCount !== undefined && result.fontUsage.webFontCount !== undefined && (
                    <span className="text-gray-500 ml-2">
                      ({result.fontUsage.systemFontCount} system, {result.fontUsage.webFontCount} web)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400">Font Families:</span>
                  <div className="mt-1">
                    {result.fontUsage.fontFamilies.map((font, index) => (
                      <span key={index} className="inline-block bg-gray-700 text-gray-200 px-2 py-1 rounded mr-2 mb-1 text-xs">
                        {font}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
{(() => {
                const categorized = categorizeContent(result.fontUsage.issues, result.fontUsage.recommendations)
                const groupedIssues = groupByImpact(categorized.issues)
                const groupedRecommendations = groupByImpact(categorized.recommendations)
                
                return (
                  <div className="space-y-3 mt-4">
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
            </CategoryCard>
          </div>
        )}

        
      </div>

      {/* Screenshot Section */}
      {result.screenshotUrl && (
        <div className="rounded-lg border border-gray-700 p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl text-blue-400" aria-hidden="true">📸</span>
            <h3 className="text-lg font-semibold text-gray-100">Full Landing Page Screenshot</h3>
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
          <p className="text-sm text-gray-400 mt-3">
            Full-page screenshot captured during analysis for visual reference and whitespace assessment.
          </p>
        </div>
      )}
    </div>
  )
}