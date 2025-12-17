interface ScoreBadgeProps {
  score: number
  testId?: string
  size?: 'default' | 'large'
}

function getScoreColors(score: number): { bg: string; text: string } {
  if (score >= 90) return { bg: 'bg-emerald-500', text: 'text-white' }
  if (score >= 70) return { bg: 'bg-yellow-500', text: 'text-gray-900' }
  if (score >= 50) return { bg: 'bg-orange-500', text: 'text-white' }
  return { bg: 'bg-red-500', text: 'text-white' }
}

export default function ScoreBadge({ score, testId, size = 'default' }: ScoreBadgeProps) {
  const colors = getScoreColors(score)
  const sizeClasses = size === 'large'
    ? 'px-3 py-1.5 text-lg min-w-[60px]'
    : 'px-3 py-1 text-sm min-w-[50px]'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${colors.bg} ${colors.text} ${sizeClasses}`}
      data-testid={testId}
    >
      {score}/100
    </span>
  )
} 