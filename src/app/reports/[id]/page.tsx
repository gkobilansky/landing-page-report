'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AnalysisResults from '@/components/AnalysisResults'
import EmailInput from '@/components/EmailInput'

interface AnalysisData {
  id: string
  url: string
  url_title?: string
  url_description?: string
  schema_data?: {
    name?: string
    description?: string
    organization?: any
  } | null
  overall_score: number
  grade?: string
  screenshot_url?: string
  created_at: string
  status: string
  page_speed_analysis?: any
  font_analysis?: any
  image_analysis?: any
  cta_analysis?: any
  whitespace_analysis?: any
  social_proof_analysis?: any
}

// Helper function to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date()
  const analysisDate = new Date(date)
  const diffMs = now.getTime() - analysisDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

export default function IndividualReportPage() {
  const params = useParams()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareClicked, setShareClicked] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [hasSignedUpThisSession, setHasSignedUpThisSession] = useState(false)
  const cleanAnalysisUrl = analysis?.url
    ? analysis.url
      .replace(/^https?:\/\//, '')   // Remove http:// or https://
      .replace(/\/+$/, '')           // Remove trailing slashes
    : 'the page';

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis')
      }

      const data = await response.json()
      console.log(data)
      setAnalysis(data)
    } catch (err) {
      console.error('Error fetching analysis:', err)
      setError('Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading analysis...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Analysis Not Found</h2>
            <p className="text-gray-400 mb-6">{error || 'The requested analysis could not be found.'}</p>
            <Link
              href="/reports"
              className="px-6 py-3 bg-brand-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Back to Reports
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Transform database structure to AnalysisResults expected format
  const analysisResult = {
    url: analysis.url,
    pageLoadSpeed: analysis.page_speed_analysis,
    fontUsage: analysis.font_analysis,
    imageOptimization: analysis.image_analysis,
    ctaAnalysis: analysis.cta_analysis,
    whitespaceAssessment: analysis.whitespace_analysis,
    socialProof: analysis.social_proof_analysis,
    overallScore: analysis.overall_score || 0,
    status: analysis.status,
    screenshotUrl: analysis.screenshot_url,
    urlTitle: analysis.url_title,
  }

  const handleEmailSubmit = async (email: string) => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          analysisId: analysis?.id
        }),
      })

      if (response.ok) {
        setEmailSubmitted(true)
        setHasSignedUpThisSession(true)
        setTimeout(() => {
          setShowEmailModal(false)
          setEmailSubmitted(false)
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Email submission failed:', errorData)
        // Still mark as signed up to prevent repeated prompts
        setHasSignedUpThisSession(true)
        setShowEmailModal(false)
      }
    } catch (error) {
      console.error('Error submitting email:', error)
      // Still mark as signed up to prevent repeated prompts
      setHasSignedUpThisSession(true)
      setShowEmailModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/reports" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium mb-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Reports
          </Link>
          <h1 className="text-4xl font-bold text-gray-100 mb-6">
            {analysis.schema_data?.name ? `${analysis.schema_data.name} Landing Page Report` : (analysis.url_title || 'Landing Page Report')}
          </h1>
          
          <div className="flex items-start justify-between mb-8">
            {/* Screenshot thumbnail */}
            {analysis.screenshot_url && (
              <div className="flex-shrink-0 mr-8">
                <Image
                  src={analysis.screenshot_url}
                  alt={`Screenshot of ${analysis.url}`}
                  width={144}
                  height={112}
                  className="w-36 h-28 object-cover object-left-top rounded-lg border border-gray-700 shadow-lg"
                />
              </div>
            )}
            
            <div className="flex-1 space-y-2">
              <h2 className="text-gray-300 text-lg font-medium">{analysis.url}</h2>
              <p className="text-gray-500 text-sm">
                Analyzed {formatRelativeTime(analysis.created_at)}
              </p>
              <p className="text-2xl font-bold text-gray-100 leading-tight">
                {analysis.url_title || 'No Title in HTML'}
              </p>         
            </div>
            <div className="text-center ml-10 flex-shrink-0">
              <div className="text-4xl font-bold text-brand-yellow mb-1">{analysis.overall_score}/100</div>
              <div className="text-sm text-gray-400 mb-6">Overall Score</div>
              
              {/* Share Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  setShareClicked(true)
                  setTimeout(() => setShareClicked(false), 1000)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                {shareClicked ? 'Copied!' : 'Share Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
          <p className="text-gray-300 text-base leading-relaxed mb-3">
            We&apos;ve run {cleanAnalysisUrl} through a series of tests and found . We algorithmically analyzed the page and tried our best to find and rate the most important elements: <em className="text-gray-200">speed, space, and story.</em> 
          </p>

          <p className="text-gray-300 text-base leading-relaxed">
            <b>Story</b> is the hardest element to analyze algorithmically, but a clear engaging call to action is a pretty good proxy. Social proof tells it&apos;s own story, humans are social creatures after all.
          </p>
          <p className="text-gray-300 text-base leading-relaxed">
            <b>Speed</b> is the easiest element to analyze algorithmically. Some other page &quot;tools&quot; make this seem more complicated than it is. 
          </p>
          <p className="text-gray-300 text-base leading-relaxed">
            <b>Space</b> is the most important element to analyze algorithmically, but a clear engaging call to action is a pretty good proxy. Social proof tells it&apos;s own story, humans are social creatures after all.
          </p>

          {!hasSignedUpThisSession && (
            <p className="text-gray-300 text-base leading-relaxed mt-4 pt-3 border-t border-gray-700">
              <button
                onClick={() => setShowEmailModal(true)}
                className="text-blue-400 hover:text-blue-300 underline transition-colors font-medium"
              >
                Sign up to get notified
              </button>{' '}
              when we launch our more advanced, AI reviewed sentiment analysis service.
            </p>
          )}
        </div>

        {/* Email Collection Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className="text-xl font-bold text-gray-100 mb-2 text-center">
                Get Notified
              </h3>
              <p className="text-gray-400 text-sm mb-6 text-center">
                We&apos;ll let you know when our AI sentiment analysis is ready!
              </p>
              
              <EmailInput
                onEmailSubmit={handleEmailSubmit}
                isAnalysisComplete={true}
                initialSubmittedState={emailSubmitted}
              />
            </div>
          </div>
        )}

        {/* Analysis Results */}
        <AnalysisResults result={analysisResult} analysisId={analysis.id} />
      </div>
    </div>
  )
}