import React from 'react'

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
}

interface AnalysisResultsProps {
  result: AnalysisResult
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

function CategoryCard({ title, score, children }: { title: string; score?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-700 p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        {score !== undefined && <ScoreBadge score={score} testId={`score-badge-${title.toLowerCase().replace(/\s+/g, '-')}`} />}
      </div>
      {children}
    </div>
  )
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const [showAllCtas, setShowAllCtas] = React.useState(false)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-700 p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Analysis Results</h2>
            <p className="text-gray-400 mt-1">{result.url}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-100 mb-1">{result.overallScore}</div>
            <div className="text-sm text-gray-400">Overall Score</div>
            <div className="text-sm text-gray-500 mt-2">Status: {result.status}</div>
          </div>
        </div>
      </div>

      {/* Analysis Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Page Load Speed */}
        {result.pageLoadSpeed && (
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
              {result.pageLoadSpeed.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {result.pageLoadSpeed.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.pageLoadSpeed.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-400 space-y-1">
                    {result.pageLoadSpeed.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CategoryCard>
        )}

        {/* Font Usage */}
        {result.fontUsage && (
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
              {result.fontUsage.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {result.fontUsage.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.fontUsage.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-400 space-y-1">
                    {result.fontUsage.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CategoryCard>
        )}

        {/* Image Optimization */}
        {result.imageOptimization && (
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
              {result.imageOptimization.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {result.imageOptimization.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.imageOptimization.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-400 space-y-1">
                    {result.imageOptimization.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CategoryCard>
        )}

        {/* CTA Analysis */}
        {result.ctaAnalysis && (
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
              {result.ctaAnalysis.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Issues:</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {result.ctaAnalysis.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.ctaAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Recommendations:</h4>
                  <ul className="text-sm text-blue-400 space-y-1">
                    {result.ctaAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CategoryCard>
        )}

        {/* Whitespace Assessment */}
        {result.whitespaceAssessment && (
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
              {result.whitespaceAssessment.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Issues:</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {result.whitespaceAssessment.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.whitespaceAssessment.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Recommendations:</h4>
                  <ul className="text-sm text-blue-400 space-y-1">
                    {result.whitespaceAssessment.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CategoryCard>
        )}

        {/* Social Proof */}
        {result.socialProof && (
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
              
              {result.socialProof.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Issues:</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {result.socialProof.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.socialProof.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2 mt-3">Recommendations:</h4>
                  <ul className="text-sm text-blue-400 space-y-1">
                    {result.socialProof.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CategoryCard>
        )}
      </div>
    </div>
  )
}