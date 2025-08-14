import React from 'react'
import ScoreBadge from './ScoreBadge'
import ImpactBadge from './ImpactBadge'

interface SectionHeaderProps {
  title: string
  score: number
  config: {
    icon: string
    iconClass: string
    impact: string
    colorTheme: string
  }
}

export default function SectionHeader({ title, score, config }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className={`text-2xl ${config.iconClass}`} aria-hidden="true">
          {config.icon}
        </span>
        <h3 className="text-xl font-bold text-gray-100">{title}</h3>
        <ImpactBadge impact={config.impact} colorTheme={config.colorTheme} />
      </div>
      <ScoreBadge score={score} testId={`score-badge-${title.toLowerCase().replace(/\s+/g, '-')}`} />
    </div>
  )
} 