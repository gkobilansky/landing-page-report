'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TopPerformer {
  id: string
  url: string
  url_title?: string
  overall_score: number
  screenshot_url?: string
  created_at: string
}

export default function TopPerformingPages() {
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/top-performers')
        
        if (!response.ok) {
          throw new Error('Failed to fetch top performers')
        }
        
        const data = await response.json()
        setTopPerformers(data.topPerformers || [])
      } catch (error) {
        console.error('Error fetching top performers:', error)
        setError('Failed to load top performing pages')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopPerformers()
  }, [])

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-900/50 rounded-2xl">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              🏆 Top Performing Landing Pages
            </h2>
            <p className="text-gray-300 mb-8">
              Check out the highest-scoring pages from our reports
            </p>
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 h-48">
                    <div className="w-full h-24 bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-900/50 rounded-2xl">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              🏆 Top Performing Landing Pages
            </h2>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (topPerformers.length === 0) {
    return (
      <section className="py-16 bg-gray-900/50 rounded-2xl">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              🏆 Top Performing Landing Pages
            </h2>
            <p className="text-gray-300">
              No completed analyses available yet. Be the first to analyze a page!
            </p>
          </div>
        </div>
      </section>
    )
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (!title) return 'Untitled Page'
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
  }

  return (
    <section className="py-16 bg-gray-900/50 rounded-2xl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            🏆 Top Performing Landing Pages
          </h2>
          <p className="text-gray-300 text-lg">
            Check out the highest-scoring pages from our reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {topPerformers.map((performer, index) => (
          <div
            key={performer.id}
            className="bg-gray-800/70 border border-gray-700 rounded-lg overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            {/* Rank Badge */}
            <div className="relative">
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-[#FFCC00] text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                  #{index + 1}
                </div>
              </div>

              {/* Screenshot or Placeholder */}
              <div className="h-32 bg-gray-700 relative overflow-hidden">
                {performer.screenshot_url ? (
                  <img
                    src={performer.screenshot_url}
                    alt={`Screenshot of ${performer.url_title || performer.url}`}
                    className="w-full h-full object-cover object-top-left group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">📄</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Score */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        performer.overall_score >= 90 ? 'bg-green-400' :
                        performer.overall_score >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${performer.overall_score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${
                    performer.overall_score >= 90 ? 'text-green-400' :
                    performer.overall_score >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {performer.overall_score}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-white font-semibold text-sm mb-2 leading-tight">
                {truncateTitle(performer.url_title || 'Untitled Page')}
              </h3>

              {/* Domain */}
              <p className="text-gray-400 text-xs mb-3">
                {getDomainFromUrl(performer.url)}
              </p>

              {/* View Report Link */}
              <Link
                href={`/reports/${performer.id}`}
                className="inline-flex items-center text-[#FFCC00] hover:text-yellow-300 text-xs font-medium transition-colors"
              >
                View Report →
              </Link>
            </div>
          </div>
        ))}
      </div>

                {/* Call to action */}
          <div className="text-center mt-12 flex gap-4 justify-center">
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600 text-sm"
            >
              <span>View All Reports</span>
              <span>→</span>
            </Link>
            <a
              href="#url-input"
              onClick={(e) => {
                e.preventDefault()
                // First scroll to the section smoothly
                const section = document.getElementById('url-input')
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  // Then focus the input after a short delay to ensure scroll completes
                  setTimeout(() => {
                    const input = document.getElementById('url') as HTMLInputElement
                    if (input) {
                      input.focus()
                    }
                  }, 500)
                }
              }}
              className="inline-flex items-center gap-2 bg-[#FFCC00] text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-semibold"
            >
              <span>Check Your Page</span>
              <span>📊</span>
            </a>
          </div>
        </div>
      </section>
    )
  } 