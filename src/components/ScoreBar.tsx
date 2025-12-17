'use client'

import { getVerdict } from '@/lib/verdict'

interface ScoreBarProps {
  pageSpeed?: { score: number }
  fontUsage?: { score: number }
  imageOptimization?: { score: number }
  ctaAnalysis?: { score: number }
  whitespaceAssessment?: { score: number }
  socialProof?: { score: number }
  overallScore?: number
  sticky?: boolean
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

function getStatusIndicator(score: number) {
  if (score >= 85) {
    return {
      icon: (
        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ),
      ariaLabel: 'Passing'
    }
  }
  if (score >= 70) {
    return {
      icon: <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />,
      ariaLabel: 'Needs improvement'
    }
  }
  return {
    icon: (
      <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    ariaLabel: 'Needs attention'
  }
}

const ScoreItem = ({
  emoji,
  label,
  score,
  sectionId,
  compact = false
}: {
  emoji: string
  label: string
  score: number
  sectionId: string
  compact?: boolean
}) => {
  const handleClick = () => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const status = getStatusIndicator(score)

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-lg border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group min-h-[44px]"
      >
        <span className="text-base">{emoji}</span>
        <div className="flex items-center gap-1.5">
          <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</div>
          <span aria-label={status.ariaLabel}>{status.icon}</span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/60 rounded-xl border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group min-w-[100px] sm:min-w-[130px] min-h-[44px] flex-shrink-0"
    >
      <span className="text-base sm:text-lg group-hover:scale-110 transition-transform">{emoji}</span>
      <div className="text-left">
        <div className="text-xs sm:text-sm text-gray-400 font-medium">{label}</div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`text-lg sm:text-xl font-bold ${getScoreColor(score)}`}>{score}</div>
          <span aria-label={status.ariaLabel}>{status.icon}</span>
        </div>
      </div>
    </button>
  )
}

export default function ScoreBar({
  pageSpeed,
  fontUsage,
  imageOptimization,
  ctaAnalysis,
  whitespaceAssessment,
  socialProof,
  overallScore,
  sticky = false
}: ScoreBarProps) {
  const scores = [
    { emoji: '⚡', label: 'Speed', score: pageSpeed?.score || 0, sectionId: 'speed-section' },
    { emoji: '🎯', label: 'CTA', score: ctaAnalysis?.score || 0, sectionId: 'cta-section' },
    { emoji: '⭐', label: 'Social', score: socialProof?.score || 0, sectionId: 'social-section' },
    { emoji: '📐', label: 'Space', score: whitespaceAssessment?.score || 0, sectionId: 'whitespace-section' },
    { emoji: '🖼️', label: 'Images', score: imageOptimization?.score || 0, sectionId: 'images-section' },
    { emoji: '🔤', label: 'Fonts', score: fontUsage?.score || 0, sectionId: 'fonts-section' }
  ]

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const verdict = overallScore !== undefined ? getVerdict(overallScore) : null

  const containerClasses = sticky
    ? 'sticky top-0 z-40 bg-[var(--color-bg-main)] shadow-lg py-3 sm:py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 overflow-x-auto'
    : 'mb-8'

  return (
    <div className={containerClasses}>
      <div className={`flex flex-wrap gap-2 sm:gap-4 justify-center items-center max-w-5xl mx-auto ${sticky ? 'gap-2' : ''}`}>
        {/* Overall Score (only shown when sticky and overallScore is provided) */}
        {sticky && overallScore !== undefined && verdict && (
          <button
            onClick={handleScrollToTop}
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 rounded-lg sm:rounded-xl border border-gray-600 hover:border-gray-500 hover:bg-gray-800 transition-all duration-200 cursor-pointer group mr-1 sm:mr-2 min-h-[44px]"
          >
            <div className="text-left">
              <div className="text-lg sm:text-xl font-bold text-brand-yellow">{overallScore}/100</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${verdict.bgClass} ${verdict.colorClass}`}>
              {verdict.text}
            </span>
          </button>
        )}

        {scores.map(({ emoji, label, score, sectionId }) => (
          <ScoreItem
            key={sectionId}
            emoji={emoji}
            label={label}
            score={score}
            sectionId={sectionId}
            compact={sticky}
          />
        ))}
      </div>
      {!sticky && (
        <p className="text-sm text-gray-400 mt-6 text-center">
          Click any score to jump to that section
        </p>
      )}
    </div>
  )
}