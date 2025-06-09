'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface AnalysisReport {
  id: string
  url: string
  url_title?: string
  overall_score: number
  grade?: string
  screenshot_url?: string
  created_at: string
  status: string
}

interface ReportCardProps {
  report: AnalysisReport
}

function ReportCard({ report }: ReportCardProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <Link href={`/reports/${report.id}`} className="block group">
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02]">
        {/* Screenshot */}
        <div className="relative aspect-video bg-gray-700">
          {report.screenshot_url ? (
            <Image
              src={report.screenshot_url}
              alt={`Screenshot of ${report.url}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <div className="text-center">
                {/* Landing Page Icon */}
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-400">Landing Page</p>
                <p className="text-xs text-gray-500 mt-1">No screenshot available</p>
              </div>
            </div>
          )}
          
          {/* Score Badge */}
          <div className="absolute top-3 right-3">
            <div className={`${getScoreBgColor(report.overall_score)} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
              {report.overall_score}/100
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-100 text-lg mb-2 line-clamp-2 group-hover:text-brand-yellow transition-colors">
            {report.url_title || 'Untitled Page'}
          </h3>
          
          <p className="text-gray-400 text-sm mb-3 truncate">
            {report.url}
          </p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {new Date(report.created_at).toLocaleDateString()}
            </span>
            <span className={`font-medium ${getScoreColor(report.overall_score)}`}>
              Score: {report.overall_score}/100
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AnalysisReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports')
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Error Loading Reports</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={fetchReports}
              className="px-6 py-3 bg-brand-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Landing Page Analysis Reports
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Browse through all completed landing page analyses. Click on any report to view detailed insights and recommendations.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-yellow">{reports.length}</div>
              <div className="text-gray-400">Total Reports</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">
                {reports.filter(r => r.overall_score >= 90).length}
              </div>
              <div className="text-gray-400">Excellent Scores (90+)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-500">
                {Math.round(reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length) || 0}
              </div>
              <div className="text-gray-400">Average Score</div>
            </div>
          </div>
        </div>

        {/* New Report Button */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-brand-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Run New Report
          </Link>
        </div>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">No Reports Yet</h3>
            <p className="text-gray-400 mb-6">
              No completed analyses found. Start by analyzing a landing page to see reports here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-brand-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Analyze a Landing Page
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {/* Action Button */}
        {reports.length > 0 && (
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center px-10 py-5 bg-brand-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-lg shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Run New Report
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}