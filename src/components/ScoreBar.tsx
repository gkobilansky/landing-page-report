'use client'

interface ScoreBarProps {
  pageSpeed?: { score: number }
  fontUsage?: { score: number }
  imageOptimization?: { score: number }
  ctaAnalysis?: { score: number }
  whitespaceAssessment?: { score: number }
  socialProof?: { score: number }
}

const ScoreItem = ({ 
  emoji, 
  label, 
  score, 
  sectionId 
}: { 
  emoji: string
  label: string
  score: number
  sectionId: string
}) => {
  const handleClick = () => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 bg-gray-800/60 rounded-xl border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group min-w-[130px] flex-shrink-0"
    >
      <span className="text-lg group-hover:scale-110 transition-transform">{emoji}</span>
      <div className="text-left">
        <div className="text-sm text-gray-400 font-medium">{label}</div>
        <div className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</div>
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
  socialProof 
}: ScoreBarProps) {
  const scores = [
    { emoji: '⚡', label: 'Speed', score: pageSpeed?.score || 0, sectionId: 'speed-section' },
    { emoji: '🎯', label: 'CTA', score: ctaAnalysis?.score || 0, sectionId: 'cta-section' },
    { emoji: '⭐', label: 'Social', score: socialProof?.score || 0, sectionId: 'social-section' },
    { emoji: '📐', label: 'Space', score: whitespaceAssessment?.score || 0, sectionId: 'whitespace-section' },
    { emoji: '🖼️', label: 'Images', score: imageOptimization?.score || 0, sectionId: 'images-section' },
    { emoji: '🔤', label: 'Fonts', score: fontUsage?.score || 0, sectionId: 'fonts-section' }
  ]

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-4 justify-center max-w-5xl mx-auto">
        {scores.map(({ emoji, label, score, sectionId }) => (
          <ScoreItem
            key={sectionId}
            emoji={emoji}
            label={label}
            score={score}
            sectionId={sectionId}
          />
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-6 text-center">
        Click any score to jump to that section
      </p>
    </div>
  )
}