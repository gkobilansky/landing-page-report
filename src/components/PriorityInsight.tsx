'use client'

import { generatePriorityInsight, type AnalysisResult, type ImpactLevel } from '@/lib/priority-insight'
import { getVerdict } from '@/lib/verdict'

interface PriorityInsightProps {
  analysisResult: AnalysisResult
  overallScore: number
}

const impactStyles: Record<ImpactLevel, { borderClass: string; bgClass: string }> = {
  Critical: {
    borderClass: 'border-l-red-500',
    bgClass: 'bg-red-500/10'
  },
  High: {
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-500/10'
  },
  Medium: {
    borderClass: 'border-l-blue-500',
    bgClass: 'bg-blue-500/10'
  }
}

export default function PriorityInsight({ analysisResult, overallScore }: PriorityInsightProps) {
  const insight = generatePriorityInsight(analysisResult)
  const verdict = getVerdict(overallScore)

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // High-scoring report (>=85) - show congratulatory message
  if (overallScore >= 85) {
    return (
      <div className="border-l-4 border-l-emerald-500 bg-emerald-500/10 pl-4 py-3 rounded-r-lg">
        <p className="text-gray-200 text-base leading-relaxed">
          <span className="font-semibold text-emerald-400">Excellent work!</span>{' '}
          Your landing page performs well across all areas. Minor improvements available below.
        </p>
      </div>
    )
  }

  // No insight available
  if (!insight) {
    return null
  }

  const styles = impactStyles[insight.impactLevel]

  // Determine what metric is doing well (pick the highest-scoring section)
  const getMetricDescription = () => {
    const scores: { name: string; score: number }[] = []
    if (analysisResult.pageLoadSpeed) scores.push({ name: 'speed', score: analysisResult.pageLoadSpeed.score })
    if (analysisResult.ctaAnalysis) scores.push({ name: 'CTA', score: analysisResult.ctaAnalysis.score })
    if (analysisResult.socialProof) scores.push({ name: 'social proof', score: analysisResult.socialProof.score })
    if (analysisResult.whitespaceAssessment) scores.push({ name: 'whitespace', score: analysisResult.whitespaceAssessment.score })
    if (analysisResult.imageOptimization) scores.push({ name: 'images', score: analysisResult.imageOptimization.score })
    if (analysisResult.fontUsage) scores.push({ name: 'fonts', score: analysisResult.fontUsage.score })

    const highestScore = scores.sort((a, b) => b.score - a.score)[0]
    if (!highestScore) return null

    const description = highestScore.score >= 85 ? 'excellent' : highestScore.score >= 70 ? 'good' : 'fair'
    return { name: highestScore.name, description }
  }

  const bestMetric = getMetricDescription()

  return (
    <div className={`border-l-4 ${styles.borderClass} ${styles.bgClass} pl-4 py-3 rounded-r-lg`}>
      <p className="text-gray-200 text-base leading-relaxed">
        <span className="font-semibold">{verdict.text}.</span>
        {bestMetric && (
          <>
            {' '}Your {bestMetric.name} is {bestMetric.description}, but{' '}
          </>
        )}
        {!bestMetric && ' '}
        <button
          onClick={() => handleSectionClick(insight.sectionId)}
          className="font-bold text-blue-400 hover:text-blue-300 underline transition-colors cursor-pointer"
        >
          {insight.sectionName}
        </button>
        {' '}needs attention.{' '}
        {insight.primaryIssue && (
          <span className="text-gray-300">{insight.primaryIssue}</span>
        )}
      </p>
    </div>
  )
}
