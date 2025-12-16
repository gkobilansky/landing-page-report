'use client'

import { getTopPriorityFixes, type AnalysisResult, type ImpactLevel } from '@/lib/priority-insight'

interface PriorityFixListProps {
  analysisResult: AnalysisResult
}

const severityStyles: Record<ImpactLevel, { borderClass: string; bgClass: string; textClass: string }> = {
  Critical: {
    borderClass: 'border-red-500/50',
    bgClass: 'bg-red-900/30',
    textClass: 'text-red-300'
  },
  High: {
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-amber-900/30',
    textClass: 'text-amber-300'
  },
  Medium: {
    borderClass: 'border-blue-500/50',
    bgClass: 'bg-blue-900/30',
    textClass: 'text-blue-300'
  }
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 70) return 'bg-yellow-500'
  if (score >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-gray-900'
  return 'text-white'
}

export default function PriorityFixList({ analysisResult }: PriorityFixListProps) {
  const fixes = getTopPriorityFixes(analysisResult, 3)

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // All sections are performing well
  if (fixes.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <p className="text-emerald-300 font-medium">
          Great job! Your landing page is performing well across all areas.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {fixes.map((fix, index) => {
        const styles = severityStyles[fix.severity]
        const isFirst = index === 0

        return (
          <button
            key={fix.sectionId}
            onClick={() => handleSectionClick(fix.sectionId)}
            className={`text-left p-3 sm:p-4 rounded-lg border transition-all duration-200 cursor-pointer min-h-[44px]
              bg-gray-800/50 hover:bg-gray-800/80 hover:border-gray-600
              ${isFirst ? 'ring-2 ring-amber-500/30 border-amber-500/50' : 'border-gray-700'}
            `}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">{fix.sectionIcon}</span>
                <span className="font-semibold text-gray-100 text-sm sm:text-base">{fix.sectionName}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getScoreBgColor(fix.sectionScore)} ${getScoreTextColor(fix.sectionScore)}`}>
                {fix.sectionScore}
              </span>
            </div>

            <div className="mb-2 sm:mb-3">
              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${styles.bgClass} ${styles.textClass} ${styles.borderClass}`}>
                {fix.severity}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-2">
              {fix.recommendation}
            </p>
          </button>
        )
      })}
    </div>
  )
}
