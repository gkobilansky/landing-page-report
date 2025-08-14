'use client'

import { useState } from 'react'

export type ImpactLevel = 'Low' | 'Medium' | 'High'

interface AccordionSectionProps {
  title: string
  impact: ImpactLevel
  items: string[]
  type: 'issues' | 'recommendations'
  defaultOpen?: boolean
}

const ImpactBadge = ({ impact }: { impact: ImpactLevel }) => {
  const getImpactStyle = (level: ImpactLevel) => {
    switch (level) {
      case 'High':
        return 'bg-red-900/30 text-red-300 border-red-700'
      case 'Medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
      case 'Low':
        return 'bg-gray-700/30 text-gray-400 border-gray-600'
    }
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${getImpactStyle(impact)}`}>
      {impact} Impact
    </span>
  )
}

export default function AccordionSection({ 
  title, 
  impact, 
  items, 
  type, 
  defaultOpen = false 
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (items.length === 0) return null

  const typeColor = type === 'issues' ? 'text-red-400' : 'text-blue-400'
  const typeIcon = type === 'issues' ? '⚠️' : '💡'

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{typeIcon}</span>
          <div className="flex items-center gap-3">
            <span className={`font-medium ${typeColor}`}>{title}</span>
            <ImpactBadge impact={impact} />
            <span className="text-sm text-gray-500">({items.length})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 bg-gray-900/20">
          <ul className={`list-disc list-inside`}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}