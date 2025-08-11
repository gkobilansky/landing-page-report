'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UrlInput from '@/components/UrlInput'
import EmailInput from '@/components/EmailInput'
import ProgressiveLoader from '@/components/ProgressiveLoader'
import Header from '@/components/Header'
import ErrorNotification from '@/components/ErrorNotification'
import FeaturesGrid from '@/components/FeaturesGrid'
import AboutSection from '@/components/AboutSection'
import SocialFooter from '@/components/SocialFooter'

interface AnalysisState {
  isLoading: boolean
  error: string | null
  showEmailInput: boolean
  currentUrl: string | null
  fromCache: boolean
  emailSubmitted: boolean
  emailSentToAPI: boolean
  screenshotUrl: string | null
  analysisId: string | null
  emailLoading: boolean
  siteTitle: string | null
  siteDescription: string | null
}

export default function Home() {
  const router = useRouter()
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    showEmailInput: false,
    currentUrl: null,
    fromCache: false,
    emailSubmitted: false,
    emailSentToAPI: false,
    screenshotUrl: null,
    analysisId: null,
    emailLoading: false,
    siteTitle: null,
    siteDescription: null
  })

  const [totalAnalyses, setTotalAnalyses] = useState<number>(0)

  // Store pending email submission
  const pendingEmailRef = useRef<string | null>(null)

  // Fetch total analyses count on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setTotalAnalyses(data.totalAnalyses)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Keep default value of 0 if fetch fails
      }
    }

    fetchStats()
  }, [])

  const handleAnalyze = async (url: string, forceRescan = false) => {
    setAnalysisState({
      isLoading: true,
      error: null,
      showEmailInput: true,
      currentUrl: url,
      fromCache: false,
      emailSubmitted: false,
      emailSentToAPI: false,
      screenshotUrl: null,
      analysisId: null,
      emailLoading: false,
      siteTitle: null,
      siteDescription: null
    })

    try {
      // Capture screenshot first for immediate visual feedback
      const screenshotPromise = fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      }).then(async (response) => {
        if (response.ok) {
          const screenshotResult = await response.json()
          setAnalysisState(prev => ({
            ...prev,
            screenshotUrl: screenshotResult.screenshot?.url || null
          }))
        }
      }).catch(error => {
        console.warn('Screenshot capture failed:', error)
        // Don't fail the entire analysis if screenshot fails
      })

      // Start analysis in parallel
      const analysisPromise = fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, forceRescan }),
      })

      // Wait for analysis to complete (screenshot runs in parallel)
      const response = await analysisPromise
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      // Extract analysis data from API response structure
      const analysisData = result.analysis || result
      
      // Update state with site metadata when available
      if (analysisData.url_title || analysisData.url_description) {
        setAnalysisState(prev => ({
          ...prev,
          siteTitle: analysisData.url_title || null,
          siteDescription: analysisData.url_description || null
        }))
      }
      
      // Process pending email submission if analysis is complete
      if (pendingEmailRef.current && result.analysisId) {
        await callEmailAPI(pendingEmailRef.current, result.analysisId);
        pendingEmailRef.current = null;
      }

      // Redirect to the individual report page
      if (result.analysisId) {
        router.push(`/reports/${result.analysisId}`)
      } else {
        // Fallback if no analysisId is returned
        setAnalysisState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Analysis completed but could not navigate to report',
        }))
      }
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }))
    }
  }

  const handleEmailSubmit = async (email: string) => {
    setAnalysisState(prev => ({
      ...prev,
      emailLoading: true,
      emailSubmitted: true
    }))

    if (analysisState.analysisId) {
      await callEmailAPI(email, analysisState.analysisId);
    } else {
      pendingEmailRef.current = email;
    }
  }

  const callEmailAPI = async (email: string, analysisId: string) => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, analysisId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      setAnalysisState(prev => ({
        ...prev,
        emailSentToAPI: true,
        emailLoading: false
      }))
    } catch (error) {
      console.error('Email sending failed:', error)
      setAnalysisState(prev => ({
        ...prev,
        emailSentToAPI: true,
        emailLoading: false
      }))
    }
  }

  const handleReset = () => {
    pendingEmailRef.current = null
    setAnalysisState({
      isLoading: false,
      error: null,
      showEmailInput: false,
      currentUrl: null,
      fromCache: false,
      emailSubmitted: false,
      emailSentToAPI: false,
      screenshotUrl: null,
      analysisId: null,
      emailLoading: false,
      siteTitle: null,
      siteDescription: null
    })
  }



  return (
    <main className="min-h-screen">
      {/* Traditional Header with Logo */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo - moved from Header component */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <span className="text-xl font-bold text-white">Landing Page Report</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex gap-6">
              <Link 
                href="/reports" 
                className="text-gray-300 hover:text-primary hover:underline transition-colors text-sm font-medium"
              >
                View All Reports
              </Link>
              <a 
                href="/blueprint" 
                className="text-gray-300 hover:text-primary hover:underline transition-colors text-sm font-medium"
              >
                The Conversion Blueprint
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        {/* Hero Section - Only show when no analysis in progress */}
        {!analysisState.showEmailInput && !analysisState.isLoading && !analysisState.error && (
          <div className="text-center py-20">
            {/* Free Analysis Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FFCC00]/20 text-[#FFCC00] px-3 py-1 rounded-full text-xs font-medium mb-8 border border-[#FFCC00]/30">
              ⚡ Free Landing Page Analysis
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight relative">
              Turn Your Landing Page Into<br />
              a <span className="text-[#FFCC00]">Conversion Machine</span>

              {/* Built by lansky.tech - Mobile */}
              <div className="absolute right-2 top-0 -translate-y-20 lg:hidden">
                <div className="flex flex-col items-end">
                  <span className="font-handwriting text-lg text-primary rotate-2 mb-2">
                    built by{' '}
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 375 375" 
                      className="inline-block"
                      fill="currentColor"
                    >
                      <rect width="375" height="375" fill="#ffcc00"/>
                      <rect x="0" y="0.75" width="375" height="187.5" fill="#0066cc"/>
                      <path fill="#ffffff" d="M159.292969 33.097656 L60.558594 33.097656 C48.894531 33.097656 39.402344 42.589844 39.402344 54.257812 L39.402344 124.777344 C39.402344 136.445312 48.894531 145.9375 60.558594 145.9375 L102.871094 145.9375 L102.871094 160.039062 L88.769531 160.039062 C84.867188 160.039062 81.714844 163.199219 81.714844 167.09375 C81.714844 170.984375 84.867188 174.144531 88.769531 174.144531 L131.082031 174.144531 C134.980469 174.144531 138.132812 170.984375 138.132812 167.09375 C 138.132812 163.199219 134.980469 160.039062 131.082031 160.039062 L116.976562 160.039062 L116.976562 138.882812 C116.976562 134.992188 113.824219 131.832031 109.925781 131.832031 L60.558594 131.832031 C56.664062 131.832031 53.507812 128.664062 53.507812 124.78125 L53.507812 117.726562 L166.34375 117.726562 L166.34375 124.78125 C166.34375 128.664062 163.183594 131.832031 159.292969 131.832031 L138.132812 131.832031 C134.234375 131.832031 131.082031 134.992188 131.082031 138.882812 C 131.082031 142.777344 134.234375 145.9375 138.132812 145.9375 L159.292969 145.9375 C170.957031 145.9375 180.449219 136.441406 180.449219 124.777344 L180.449219 54.257812 C 180.449219 42.589844 170.957031 33.097656 159.292969 33.097656 Z M 166.34375 103.621094 L 53.507812 103.621094 L 53.507812 54.257812 C 53.507812 50.371094 56.664062 47.203125 60.558594 47.203125 L 159.289062 47.203125 C 163.183594 47.203125 166.34375 50.371094 166.34375 54.257812 Z"/>
                      <path fill="#ffffff" d="M314.441406 202.355469 L215.710938 202.355469 C204.042969 202.355469 194.550781 211.847656 194.550781 223.511719 L194.550781 294.035156 C194.550781 305.699219 204.042969 315.191406 215.710938 315.191406 L258.023438 315.191406 L258.023438 329.296875 L243.917969 329.296875 C240.019531 329.296875 236.867188 332.457031 236.867188 336.347656 C 236.867188 340.242188 240.019531 343.398438 243.917969 343.398438 L286.230469 343.398438 C 290.132812 343.398438 293.285156 340.242188 293.285156 336.347656 C 293.285156 332.457031 290.132812 329.296875 286.230469 329.296875 L 272.125 329.296875 L 272.125 308.140625 C 272.125 304.246094 268.976562 301.085938 265.074219 301.085938 L215.707031 301.085938 C 211.816406 301.085938 208.65625 297.921875 208.65625 294.035156 L 208.65625 286.984375 L 321.492188 286.984375 L 321.492188 294.035156 C 321.492188 297.921875 318.332031 301.085938 314.441406 301.085938 L 293.285156 301.085938 C 289.382812 301.085938 286.230469 304.246094 286.230469 308.140625 C 286.230469 312.03125 289.382812 315.191406 293.285156 315.191406 L314.441406 315.191406 C 326.105469 315.191406 335.597656 305.699219 335.597656 294.035156 L 335.597656 223.511719 C 335.597656 211.847656 326.105469 202.355469 314.441406 202.355469 Z M 321.492188 272.875 L 208.65625 272.875 L 208.65625 223.511719 C 208.65625 219.625 211.816406 216.457031 215.710938 216.457031 L 314.441406 216.457031 C 318.332031 216.457031 321.492188 219.625 321.492188 223.511719 Z"/>
                    </svg>
                    <a 
                      href="https://lansky.tech" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-300 transition-colors underline"
                    >
                      lansky.tech
                    </a>
                  </span>
                </div>
              </div>

              {/* Built by lansky.tech - Desktop */}
              <div className="absolute right-0 top-0 -translate-y-16 hidden lg:block">
                <div className="flex items-center gap-2">
                  <span className="font-handwriting text-lg text-primary rotate-2">
                    built by{' '}
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 375 375" 
                      className="inline-block"
                      fill="currentColor"
                    >
                      <rect width="375" height="375" fill="#ffcc00"/>
                      <rect x="0" y="0.75" width="375" height="187.5" fill="#0066cc"/>
                      <path fill="#ffffff" d="M159.292969 33.097656 L60.558594 33.097656 C48.894531 33.097656 39.402344 42.589844 39.402344 54.257812 L39.402344 124.777344 C39.402344 136.445312 48.894531 145.9375 60.558594 145.9375 L102.871094 145.9375 L102.871094 160.039062 L88.769531 160.039062 C84.867188 160.039062 81.714844 163.199219 81.714844 167.09375 C81.714844 170.984375 84.867188 174.144531 88.769531 174.144531 L131.082031 174.144531 C134.980469 174.144531 138.132812 170.984375 138.132812 167.09375 C 138.132812 163.199219 134.980469 160.039062 131.082031 160.039062 L116.976562 160.039062 L116.976562 138.882812 C116.976562 134.992188 113.824219 131.832031 109.925781 131.832031 L60.558594 131.832031 C56.664062 131.832031 53.507812 128.664062 53.507812 124.78125 L53.507812 117.726562 L166.34375 117.726562 L166.34375 124.78125 C166.34375 128.664062 163.183594 131.832031 159.292969 131.832031 L138.132812 131.832031 C134.234375 131.832031 131.082031 134.992188 131.082031 138.882812 C 131.082031 142.777344 134.234375 145.9375 138.132812 145.9375 L159.292969 145.9375 C170.957031 145.9375 180.449219 136.441406 180.449219 124.777344 L180.449219 54.257812 C 180.449219 42.589844 170.957031 33.097656 159.292969 33.097656 Z M 166.34375 103.621094 L 53.507812 103.621094 L 53.507812 54.257812 C 53.507812 50.371094 56.664062 47.203125 60.558594 47.203125 L 159.289062 47.203125 C 163.183594 47.203125 166.34375 50.371094 166.34375 54.257812 Z"/>
                      <path fill="#ffffff" d="M314.441406 202.355469 L215.710938 202.355469 C204.042969 202.355469 194.550781 211.847656 194.550781 223.511719 L194.550781 294.035156 C194.550781 305.699219 204.042969 315.191406 215.710938 315.191406 L258.023438 315.191406 L258.023438 329.296875 L243.917969 329.296875 C240.019531 329.296875 236.867188 332.457031 236.867188 336.347656 C 236.867188 340.242188 240.019531 343.398438 243.917969 343.398438 L286.230469 343.398438 C 290.132812 343.398438 293.285156 340.242188 293.285156 336.347656 C 293.285156 332.457031 290.132812 329.296875 286.230469 329.296875 L 272.125 329.296875 L 272.125 308.140625 C 272.125 304.246094 268.976562 301.085938 265.074219 301.085938 L215.707031 301.085938 C 211.816406 301.085938 208.65625 297.921875 208.65625 294.035156 L 208.65625 286.984375 L 321.492188 286.984375 L 321.492188 294.035156 C 321.492188 297.921875 318.332031 301.085938 314.441406 301.085938 L 293.285156 301.085938 C 289.382812 301.085938 286.230469 304.246094 286.230469 308.140625 C 286.230469 312.03125 289.382812 315.191406 293.285156 315.191406 L314.441406 315.191406 C 326.105469 315.191406 335.597656 305.699219 335.597656 294.035156 L 335.597656 223.511719 C 335.597656 211.847656 326.105469 202.355469 314.441406 202.355469 Z M 321.492188 272.875 L 208.65625 272.875 L 208.65625 223.511719 C 208.65625 219.625 211.816406 216.457031 215.710938 216.457031 L 314.441406 216.457031 C 318.332031 216.457031 321.492188 219.625 321.492188 223.511719 Z"/>
                    </svg>
                    <a 
                      href="https://lansky.tech" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-300 transition-colors underline"
                    >
                      lansky.tech
                    </a>
                  </span>
                </div>
              </div>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Get a comprehensive analysis of your landing page in seconds. Discover what&apos;s 
              killing your conversions and get actionable insights to boost your results by up to 
              300%
            </p>

            {/* URL Input */}
            <UrlInput 
              onAnalyze={handleAnalyze} 
              isLoading={analysisState.isLoading}
            />

              {/* Statistics */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-16">
              <div className="flex items-center gap-3">
                <span className="text-[#FFCC00] text-2xl">👥</span>
                <span className="text-white font-semibold">
                  {totalAnalyses.toLocaleString()}+ pages analyzed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#FFCC00] text-2xl">📈</span>
                <span className="text-white font-semibold">Boost Conversions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#FFCC00] text-2xl">⭐</span>
                <span className="text-white font-semibold">Loved by Vibe Coders</span>
              </div>
            </div>

            {/* What We Analyze Section */}
            <div className="text-center mt-20">
              <h2 className="text-3xl font-bold text-white mb-4">
                What Does the Report Cover?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our automated report reviews these critical components that can impact your conversion rates
              </p>
            </div>
          </div>
        )}

        {/* Analysis Header - shown during loading */}
        {analysisState.isLoading && analysisState.currentUrl && (
          <div className="py-12">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Running report for{' '}
                <span className="text-[#FFCC00]">
                  {analysisState.currentUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}
                </span>
              </h1>
              
              {/* Show site title and description when available */}
              {(analysisState.siteTitle || analysisState.siteDescription) && (
                <div className="mt-6 p-6 bg-gray-800/40 rounded-xl border border-gray-700">
                  {analysisState.siteTitle && (
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">
                      {analysisState.siteTitle}
                    </h2>
                  )}
                  {analysisState.siteDescription && (
                    <p className="text-gray-400 leading-relaxed">
                      {analysisState.siteDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Input Section - shown while loading */}
        {analysisState.showEmailInput && analysisState.isLoading && (
          <div className="py-8">
            <EmailInput 
              onEmailSubmit={handleEmailSubmit}
              isLoading={analysisState.emailLoading}
            />
          </div>
        )}

        {/* Loading State */}
        <ProgressiveLoader 
          isLoading={analysisState.isLoading} 
          screenshotUrl={analysisState.screenshotUrl}
        />

        {/* Error State */}
        {analysisState.error && (
          <div className="py-16">
            <ErrorNotification error={analysisState.error} onReset={handleReset} />
          </div>
        )}

        {/* Features Grid - Only show when no analysis in progress */}
        {!analysisState.isLoading && !analysisState.error && !analysisState.showEmailInput && (
          <div className="pb-16">
            <FeaturesGrid />
          </div>
        )}
   
        <AboutSection />
      </div>

      <SocialFooter />
    </main>
  )
}