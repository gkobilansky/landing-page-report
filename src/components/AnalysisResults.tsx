interface AnalysisResult {
  url: string
  pageLoadSpeed?: {
    score: number
    grade: string
    metrics: { lcp: number; fcp: number; cls: number; tbt: number; si: number }
    lighthouseScore: number
    issues: string[]
    recommendations: string[]
    loadTime: number
  }
  fontUsage?: {
    score: number
    fontFamilies: string[]
    fontCount: number
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
    elements: Array<{ type: string; count: number }>
    issues: string[]
  }
  overallScore: number
  status: string
}

interface AnalysisResultsProps {
  result: AnalysisResult
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800'
  if (score >= 80) return 'bg-yellow-100 text-yellow-800'
  if (score >= 70) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
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
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}
      data-testid={testId}
    >
      {score}
    </span>
  )
}

function CategoryCard({ title, score, children }: { title: string; score?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {score !== undefined && <ScoreBadge score={score} testId={`score-badge-${title.toLowerCase().replace(/\s+/g, '-')}`} />}
      </div>
      {children}
    </div>
  )
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-gray-600 mt-1">{result.url}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{result.overallScore}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-sm text-gray-500 mt-2">Status: {result.status}</div>
          </div>
        </div>
      </div>

      {/* Analysis Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Page Load Speed */}
        {result.pageLoadSpeed && (
          <CategoryCard title="Page Load Speed" score={result.pageLoadSpeed.score}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">LCP:</span> {Math.round(result.pageLoadSpeed.metrics.lcp)}ms
                </div>
                <div>
                  <span className="text-gray-600">FCP:</span> {Math.round(result.pageLoadSpeed.metrics.fcp)}ms
                </div>
                <div>
                  <span className="text-gray-600">CLS:</span> {result.pageLoadSpeed.metrics.cls.toFixed(3)}
                </div>
                <div>
                  <span className="text-gray-600">Lighthouse:</span> {result.pageLoadSpeed.lighthouseScore}
                </div>
              </div>
              {result.pageLoadSpeed.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.pageLoadSpeed.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.pageLoadSpeed.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
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
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-600">Font Families ({result.fontUsage.fontCount}):</span>
                <div className="mt-1">
                  {result.fontUsage.fontFamilies.map((font, index) => (
                    <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-1 text-xs">
                      {font}
                    </span>
                  ))}
                </div>
              </div>
              {result.fontUsage.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.fontUsage.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.fontUsage.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Images:</span> {result.imageOptimization.totalImages}
                </div>
                <div>
                  <span className="text-gray-600">Modern Formats:</span> {result.imageOptimization.modernFormats}
                </div>
                <div>
                  <span className="text-gray-600">With Alt Text:</span> {result.imageOptimization.withAltText}
                </div>
                <div>
                  <span className="text-gray-600">Properly Sized:</span> {result.imageOptimization.appropriatelySized}
                </div>
              </div>
              {result.imageOptimization.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.imageOptimization.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.imageOptimization.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
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
            <div className="space-y-3">
              {result.ctaAnalysis.ctas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">CTAs Found:</h4>
                  <div className="space-y-2">
                    {result.ctaAnalysis.ctas.slice(0, 5).map((cta, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="font-medium">{cta.text}</span>
                        <div className="flex items-center space-x-2">
                          {cta.confidence && (
                            <span className="text-xs text-gray-600">
                              {(cta.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                          {cta.actionStrength && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {cta.actionStrength}
                            </span>
                          )}
                          {(cta.aboveFold || cta.isAboveFold) && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Above fold
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.ctaAnalysis.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.ctaAnalysis.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.ctaAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
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
          <CategoryCard title="Whitespace & Layout" score={result.whitespaceAssessment.score}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Whitespace Ratio:</span> {(result.whitespaceAssessment.metrics.whitespaceRatio * 100).toFixed(0)}%
                </div>
                <div>
                  <span className="text-gray-600">Clutter Score:</span> {result.whitespaceAssessment.metrics.clutterScore}
                </div>
                <div>
                  <span className="text-gray-600">Max Density:</span> {result.whitespaceAssessment.metrics.elementDensityPerSection.maxDensity}
                </div>
                <div>
                  <span className="text-gray-600">Total Elements:</span> {result.whitespaceAssessment.metrics.elementDensityPerSection.totalElements}
                </div>
              </div>
              {result.whitespaceAssessment.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.whitespaceAssessment.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.whitespaceAssessment.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
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
            <div className="space-y-3">
              {result.socialProof.elements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Elements Found:</h4>
                  <div className="space-y-1 text-sm">
                    {result.socialProof.elements.map((element, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="capitalize">{element.type}:</span>
                        <span>{element.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.socialProof.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.socialProof.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
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