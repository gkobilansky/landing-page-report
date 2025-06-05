'use client'

import { useState } from 'react'
import UrlInput from '@/components/UrlInput'
import EmailInput from '@/components/EmailInput'
import AnalysisResults from '@/components/AnalysisResults'
import ProgressiveLoader from '@/components/ProgressiveLoader'
import Header from '@/components/Header'
import ErrorNotification from '@/components/ErrorNotification'
import CacheNotification from '@/components/CacheNotification'
import FeaturesGrid from '@/components/FeaturesGrid'
import AboutSection from '@/components/AboutSection'
import SocialFooter from '@/components/SocialFooter'

interface AnalysisState {
  result: any
  isLoading: boolean
  error: string | null
  showEmailInput: boolean
  email: string | null
  currentUrl: string | null
  fromCache: boolean
  emailSubmitted: boolean
  screenshotUrl: string | null
  analysisId: string | null
  emailLoading: boolean
}

export default function Home() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    result: null,
    isLoading: false,
    error: null,
    showEmailInput: false,
    email: null,
    currentUrl: null,
    fromCache: false,
    emailSubmitted: false,
    screenshotUrl: null,
    analysisId: null,
    emailLoading: false
  })

  const handleAnalyze = async (url: string, forceRescan = false) => {
    console.log('🔥 Starting analysis for:', url);
    setAnalysisState({
      result: null,
      isLoading: true,
      error: null,
      showEmailInput: true,
      email: null,
      currentUrl: url,
      fromCache: false,
      emailSubmitted: false,
      screenshotUrl: null,
      analysisId: null,
      emailLoading: false
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
      
      setAnalysisState(prev => ({
        ...prev,
        result: analysisData,
        isLoading: false,
        error: null,
        fromCache: result.fromCache || false,
        analysisId: result.analysisId || null,
        // Keep screenshot URL if we got one from API response
        screenshotUrl: analysisData.screenshotUrl || prev.screenshotUrl
      }))

      // If user submitted email during loading, send it now that analysis is complete
      if (analysisState.email && !analysisState.emailSubmitted && result.analysisId) {
        console.log('Sending email for completed analysis...');
        sendEmailForCompletedAnalysis(analysisState.email, result.analysisId);
      }
    } catch (error) {
      console.error('💥 Analysis failed:', error);
      setAnalysisState(prev => ({
        ...prev,
        result: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }))
    }
  }

  const sendEmailForCompletedAnalysis = async (email: string, analysisId: string) => {
    setAnalysisState(prev => ({
      ...prev,
      emailLoading: true
    }))

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          analysisId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      setAnalysisState(prev => ({
        ...prev,
        emailSubmitted: true,
        emailLoading: false
      }))
    } catch (error) {
      console.error('Email sending failed:', error)
      setAnalysisState(prev => ({
        ...prev,
        emailSubmitted: true,
        emailLoading: false
      }))
    }
  }

  const handleEmailSubmit = async (email: string) => {
    if (!analysisState.analysisId) {
      // If no analysis ID yet (during loading), just store the email
      setAnalysisState(prev => ({
        ...prev,
        email,
        emailSubmitted: true
      }))
      return
    }

    // If we have an analysis ID, send the email immediately
    setAnalysisState(prev => ({
      ...prev,
      email,
      emailLoading: true
    }))

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          analysisId: analysisState.analysisId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      setAnalysisState(prev => ({
        ...prev,
        emailSubmitted: true,
        emailLoading: false
      }))
    } catch (error) {
      console.error('Email sending failed:', error)
      // Still mark as submitted to show the success message, but log the error
      setAnalysisState(prev => ({
        ...prev,
        emailSubmitted: true,
        emailLoading: false
      }))
    }
  }

  const handleReset = () => {
    setAnalysisState({
      result: null,
      isLoading: false,
      error: null,
      showEmailInput: false,
      email: null,
      currentUrl: null,
      fromCache: false,
      emailSubmitted: false,
      screenshotUrl: null,
      analysisId: null,
      emailLoading: false
    })
  }

  const handleForceRescan = () => {
    if (analysisState.currentUrl) {
      handleAnalyze(analysisState.currentUrl, true)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <Header />

        {/* URL Input Section */}
        {!analysisState.showEmailInput && !analysisState.result && (
          <div className="mb-12">
            <UrlInput 
              onAnalyze={handleAnalyze} 
              isLoading={analysisState.isLoading}
            />
          </div>
        )}

        {/* Email Input Section - shown while loading */}
        {analysisState.showEmailInput && analysisState.isLoading && (
          <div className="mb-12">
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
          <ErrorNotification error={analysisState.error} onReset={handleReset} />
        )}

        {/* Cache Notification */}
        {analysisState.result && !analysisState.isLoading && analysisState.fromCache && (
          <CacheNotification onForceRescan={handleForceRescan} isLoading={analysisState.isLoading} />
        )}

        {/* Results Section */}
        {analysisState.result && !analysisState.isLoading && (
          <div className="space-y-8">
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="bg-[#FFCC00] text-gray-900 px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-base font-semibold shadow-md"
              >
                Analyze Another Page
              </button>
            </div>
            <AnalysisResults result={analysisState.result} analysisId={analysisState.analysisId || undefined} />
            
            {/* Email Input after results */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <EmailInput 
                onEmailSubmit={handleEmailSubmit}
                isLoading={analysisState.emailLoading}
                isAnalysisComplete={true}
                initialSubmittedState={analysisState.emailSubmitted}
              />
            </div>
          </div>
        )}

        {/* Footer/Info Section - Only show when no results */}
        {!analysisState.result && !analysisState.isLoading && !analysisState.error && !analysisState.showEmailInput && (
          <FeaturesGrid />
        )}
   
        <AboutSection />
      </div>

      <SocialFooter />
    </main>
  )
}