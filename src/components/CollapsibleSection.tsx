'use client'

import { useState, ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  score: number
  icon: string
  colorTheme: {
    bgClass: string
    borderClass: string
    iconClass?: string
  }
  isCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
  children: ReactNode
  sectionId?: string
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 70) return 'bg-yellow-500'
  if (score >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

export const COLLAPSE_THRESHOLD = 85

export default function CollapsibleSection({
  title,
  score,
  icon,
  colorTheme,
  isCollapsed: controlledCollapsed,
  onToggle,
  children,
  sectionId
}: CollapsibleSectionProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(score >= COLLAPSE_THRESHOLD)

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed

  const handleToggle = () => {
    const newState = !isCollapsed
    if (onToggle) {
      onToggle(newState)
    } else {
      setInternalCollapsed(newState)
    }
  }

  // If collapsed, show compact summary row
  if (isCollapsed) {
    return (
      <div id={sectionId}>
        <button
          onClick={handleToggle}
          className={`w-full rounded-xl border p-4 ${colorTheme.bgClass} ${colorTheme.borderClass}
            hover:border-gray-600 transition-all duration-150 cursor-pointer group min-h-[60px]`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">{icon}</span>
              <span className="text-base sm:text-lg font-semibold text-gray-100">{title}</span>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getScoreBgColor(score)} text-white min-w-[50px] sm:min-w-[60px] text-center`}>
                {score}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 sm:gap-2 text-green-400">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Passed</span>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Expand section"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    )
  }

  // Expanded state - render children with collapse button
  return (
    <div id={sectionId} className="relative">
      {/* Collapse button for expanded sections that could be collapsed */}
      {score >= COLLAPSE_THRESHOLD && (
        <button
          onClick={handleToggle}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Collapse section"
        >
          <svg
            className="w-5 h-5 rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {children}
    </div>
  )
}
