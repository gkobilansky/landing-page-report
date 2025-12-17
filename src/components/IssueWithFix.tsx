'use client'

import { useState } from 'react'
import { ImpactLevel } from './AccordionSection'
import { IssueFix } from '@/lib/issue-fix-pairer'

interface IssueWithFixProps {
  pair: IssueFix
  defaultExpanded?: boolean
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
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getImpactStyle(impact)}`}>
      {impact}
    </span>
  )
}

const MAX_TEXT_LENGTH = 150

export default function IssueWithFix({ pair, defaultExpanded = false }: IssueWithFixProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const issueText = pair.issue
  const fixText = pair.fix

  const issueNeedsTruncation = issueText && issueText.length > MAX_TEXT_LENGTH
  const fixNeedsTruncation = fixText && fixText.length > MAX_TEXT_LENGTH

  const shouldShowExpand = issueNeedsTruncation || fixNeedsTruncation

  const displayIssue = issueText
    ? isExpanded || !issueNeedsTruncation
      ? issueText
      : `${issueText.slice(0, MAX_TEXT_LENGTH)}...`
    : null

  const displayFix = fixText
    ? isExpanded || !fixNeedsTruncation
      ? fixText
      : `${fixText.slice(0, MAX_TEXT_LENGTH)}...`
    : null

  // If it's just an orphan recommendation (no issue)
  if (!pair.issue && pair.fix) {
    return (
      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-400">Recommendation</span>
              <ImpactBadge impact={pair.impact} />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {displayFix}
            </p>
            {fixNeedsTruncation && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Normal issue + fix pair
  return (
    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
      {/* Issue Row */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-red-400">Issue</span>
            <ImpactBadge impact={pair.impact} />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {displayIssue}
          </p>
        </div>
      </div>

      {/* Arrow Connector */}
      <div className="flex items-center gap-2 ml-8 mb-3">
        <div className="w-0.5 h-4 bg-gray-600"></div>
        <span className="text-gray-500 text-sm">→</span>
      </div>

      {/* Fix Row */}
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">💡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-blue-400">Fix</span>
          </div>
          {displayFix ? (
            <p className="text-sm text-gray-300 leading-relaxed">
              {displayFix}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No specific fix identified
            </p>
          )}
        </div>
      </div>

      {/* Show More/Less Button */}
      {shouldShowExpand && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-400 hover:text-blue-300 mt-3 ml-8 transition-colors"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

interface IssuesWithFixesListProps {
  pairs: IssueFix[]
  title?: string
  defaultOpen?: boolean
}

export function IssuesWithFixesList({ pairs, title = "Issues & Fixes", defaultOpen = true }: IssuesWithFixesListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (pairs.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No issues or recommendations for this section.
      </div>
    )
  }

  // Count by type
  const issueCount = pairs.filter(p => p.issue).length
  const fixOnlyCount = pairs.filter(p => !p.issue && p.fix).length
  const highImpactCount = pairs.filter(p => p.impact === 'High').length

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔧</span>
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-200">{title}</span>
            {highImpactCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded border bg-red-900/30 text-red-300 border-red-700">
                {highImpactCount} High
              </span>
            )}
            <span className="text-sm text-gray-500">
              ({issueCount} issue{issueCount !== 1 ? 's' : ''}{fixOnlyCount > 0 ? `, ${fixOnlyCount} tip${fixOnlyCount !== 1 ? 's' : ''}` : ''})
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-gray-900/20">
          {pairs.map((pair, index) => (
            <IssueWithFix
              key={index}
              pair={pair}
              defaultExpanded={pair.impact === 'High'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
