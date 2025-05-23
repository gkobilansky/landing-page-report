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

function getScoreBadgeClass(score: number): string {
  if (score >= 90) return 'badge-success'
  if (score >= 80) return 'badge-warning'
  if (score >= 70) return 'badge-warning'
  return 'badge-error'
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
    <div className="badge badge-lg font-bold" data-testid={testId}>
      <span className={`badge ${getScoreBadgeClass(score)}`}>
        {score}
      </span>
    </div>
  )
}

function CategoryCard({ title, score, children }: { title: string; score?: number; children: React.ReactNode }) {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        <div className="card-title justify-between items-center">
          <h3 className="text-lg font-bold">{title}</h3>
          {score !== undefined && <ScoreBadge score={score} testId={`score-badge-${title.toLowerCase().replace(/\s+/g, '-')}`} />}
        </div>
        {children}
      </div>
    </div>
  )
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="hero bg-base-100 rounded-lg border border-base-300">
        <div className="hero-content flex-col lg:flex-row justify-between w-full py-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold">Analysis Results</h2>
            <p className="text-base-content/70 mt-2 max-w-lg">{result.url}</p>
          </div>
          <div className="stats shadow">
            <div className="stat place-items-center">
              <div className="stat-title">Overall Score</div>
              <div className="stat-value text-primary">{result.overallScore}</div>
              <div className="stat-desc">
                <div className={`badge ${getScoreBadgeClass(result.overallScore)}`}>
                  Grade: {getScoreGrade(result.overallScore)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Page Load Speed */}
        {result.pageLoadSpeed && (
          <CategoryCard title="Page Load Speed" score={result.pageLoadSpeed.score}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="stat">
                  <div className="stat-title text-xs">LCP</div>
                  <div className="stat-value text-sm">{Math.round(result.pageLoadSpeed.metrics.lcp)}ms</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">FCP</div>
                  <div className="stat-value text-sm">{Math.round(result.pageLoadSpeed.metrics.fcp)}ms</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">CLS</div>
                  <div className="stat-value text-sm">{result.pageLoadSpeed.metrics.cls.toFixed(3)}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Lighthouse</div>
                  <div className="stat-value text-sm">{result.pageLoadSpeed.lighthouseScore}</div>
                </div>
              </div>
              {result.pageLoadSpeed.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.pageLoadSpeed.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.pageLoadSpeed.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.pageLoadSpeed.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-info mr-2">•</span>
                        <span>{rec}</span>
                      </li>
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
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Font Families</span>
                  <div className="badge badge-neutral">{result.fontUsage.fontCount} fonts</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.fontUsage.fontFamilies.map((font, index) => (
                    <div key={index} className="badge badge-outline text-xs">
                      {font}
                    </div>
                  ))}
                </div>
              </div>
              {result.fontUsage.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.fontUsage.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.fontUsage.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.fontUsage.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-info mr-2">•</span>
                        <span>{rec}</span>
                      </li>
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
            <div className="space-y-4">
              <div className="stats stats-vertical lg:stats-horizontal shadow-sm">
                <div className="stat">
                  <div className="stat-title text-xs">Total</div>
                  <div className="stat-value text-sm">{result.imageOptimization.totalImages}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Modern</div>
                  <div className="stat-value text-sm">{result.imageOptimization.modernFormats}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Alt Text</div>
                  <div className="stat-value text-sm">{result.imageOptimization.withAltText}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Sized</div>
                  <div className="stat-value text-sm">{result.imageOptimization.appropriatelySized}</div>
                </div>
              </div>
              {result.imageOptimization.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.imageOptimization.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.imageOptimization.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.imageOptimization.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-info mr-2">•</span>
                        <span>{rec}</span>
                      </li>
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
            <div className="space-y-4">
              {result.ctaAnalysis.ctas.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">CTAs Found:</h4>
                  <div className="space-y-2">
                    {result.ctaAnalysis.ctas.slice(0, 5).map((cta, index) => (
                      <div key={index} className="card bg-base-200 p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="font-medium text-sm">{cta.text}</span>
                          <div className="flex flex-wrap gap-1">
                            {cta.confidence && (
                              <div className="badge badge-neutral badge-xs">
                                {(cta.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                            {cta.actionStrength && (
                              <div className="badge badge-info badge-xs">
                                {cta.actionStrength}
                              </div>
                            )}
                            {(cta.aboveFold || cta.isAboveFold) && (
                              <div className="badge badge-success badge-xs">
                                Above fold
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.ctaAnalysis.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.ctaAnalysis.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.ctaAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.ctaAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-info mr-2">•</span>
                        <span>{rec}</span>
                      </li>
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
            <div className="space-y-4">
              <div className="stats stats-vertical lg:stats-horizontal shadow-sm">
                <div className="stat">
                  <div className="stat-title text-xs">Whitespace</div>
                  <div className="stat-value text-sm">{(result.whitespaceAssessment.metrics.whitespaceRatio * 100).toFixed(0)}%</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Clutter</div>
                  <div className="stat-value text-sm">{result.whitespaceAssessment.metrics.clutterScore}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Max Density</div>
                  <div className="stat-value text-sm">{result.whitespaceAssessment.metrics.elementDensityPerSection.maxDensity}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs">Elements</div>
                  <div className="stat-value text-sm">{result.whitespaceAssessment.metrics.elementDensityPerSection.totalElements}</div>
                </div>
              </div>
              {result.whitespaceAssessment.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.whitespaceAssessment.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.whitespaceAssessment.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.whitespaceAssessment.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-info mr-2">•</span>
                        <span>{rec}</span>
                      </li>
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
            <div className="space-y-4">
              {result.socialProof.elements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Elements Found:</h4>
                  <div className="space-y-2">
                    {result.socialProof.elements.map((element, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-base-200 rounded">
                        <span className="capitalize text-sm">{element.type}:</span>
                        <div className="badge badge-primary">{element.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.socialProof.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Issues
                  </h4>
                  <ul className="text-sm space-y-1">
                    {result.socialProof.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error mr-2">•</span>
                        <span>{issue}</span>
                      </li>
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