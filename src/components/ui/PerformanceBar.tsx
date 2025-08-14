import React from 'react'

interface PerformanceBarProps {
  score: number
  description: string
  colorTheme: string
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function PerformanceBar({ score, description, colorTheme }: PerformanceBarProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-100 font-semibold text-sm uppercase tracking-wide">Performance</h4>
        <span className="text-sm text-gray-400">{score}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-3">
        <div 
          className={`${getScoreBarColor(score)} h-2.5 rounded-full transition-all duration-300`}
          style={{width: `${score}%`}}
        ></div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
    </div>
  )
} 