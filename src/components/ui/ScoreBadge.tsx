interface ScoreBadgeProps {
  score: number
  testId?: string
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export default function ScoreBadge({ score, testId }: ScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(score)} border border-current bg-current/10`}
      data-testid={testId}
    >
      {score}/100
    </span>
  )
} 