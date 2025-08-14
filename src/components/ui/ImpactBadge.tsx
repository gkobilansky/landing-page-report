interface ImpactBadgeProps {
  impact: string
  colorTheme: string
}

function getImpactStyle(level: string, theme: string) {
  switch (level) {
    case 'High Impact':
      return 'bg-red-900/30 text-red-300 border-red-700/50'
    case 'Medium Impact':
      return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50'
    case 'Low Impact':
      return 'bg-blue-900/30 text-blue-300 border-blue-700/50'
    case 'Needs Attention':
      return 'bg-orange-900/30 text-orange-300 border-orange-700/50'
    default:
      return `bg-${theme}-900/30 text-${theme}-300 border-${theme}-700/50`
  }
}

export default function ImpactBadge({ impact, colorTheme }: ImpactBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactStyle(impact, colorTheme)}`}>
      {impact}
    </span>
  )
} 