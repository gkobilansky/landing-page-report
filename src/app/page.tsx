'use client'

import { useState } from 'react'
import UrlInput from '@/components/UrlInput'
import AnalysisResults from '@/components/AnalysisResults'
import ThemeController from '@/components/ThemeController'

interface AnalysisState {
  result: any
  isLoading: boolean
  error: string | null
}

export default function Home() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    result: null,
    isLoading: false,
    error: null
  })

  const handleAnalyze = async (url: string) => {
    setAnalysisState({
      result: null,
      isLoading: true,
      error: null
    })

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      // Extract analysis data from API response structure
      const analysisData = result.analysis || result
      setAnalysisState({
        result: analysisData,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAnalysisState({
        result: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  }

  const handleReset = () => {
    setAnalysisState({
      result: null,
      isLoading: false,
      error: null
    })
  }

  return (
    <main className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <div className="btn btn-ghost text-xl">by lansky.tech</div>
        </div>
        <div className="navbar-end">
          {/* <ThemeController /> */}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="hero min-h-[300px]">
          <div className="hero-content text-center">
            <div className="max-w-4xl">
              <h1 className="text-5xl font-bold text-base-content mb-6">
                Landing Page Analyzer
              </h1>
              <p className="text-xl text-base-content/70 leading-relaxed">
                Get detailed insights into your landing page performance across 6 key criteria: 
                page speed, fonts, images, CTAs, whitespace, and social proof.
              </p>
            </div>
          </div>
        </div>

        {/* URL Input Section */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-2xl">
            <UrlInput 
              onAnalyze={handleAnalyze} 
              isLoading={analysisState.isLoading}
            />
          </div>
        </div>

        {/* Loading State */}
        {analysisState.isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-base-content text-lg font-medium">Analyzing your landing page...</p>
            <p className="text-base-content/60 text-sm mt-2">This may take 10-30 seconds</p>
          </div>
        )}

        {/* Error State */}
        {analysisState.error && (
          <div className="flex justify-center mb-8">
            <div className="alert alert-error max-w-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Analysis Failed</h3>
                <div className="text-xs">{analysisState.error}</div>
              </div>
              <div>
                <button
                  onClick={handleReset}
                  className="btn btn-sm btn-outline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {analysisState.result && !analysisState.isLoading && (
          <div className="space-y-8">
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="btn btn-outline btn-wide"
              >
                Analyze Another Page
              </button>
            </div>
            <AnalysisResults result={analysisState.result} />
          </div>
        )}

        {/* Footer/Info Section - Only show when no results */}
        {!analysisState.result && !analysisState.isLoading && !analysisState.error && (
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary text-primary-content rounded-full mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="card-title text-lg">Page Speed</h2>
                  <p className="text-base-content/70 text-sm">
                    Analyze Core Web Vitals and loading performance metrics
                  </p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-secondary text-secondary-content rounded-full mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="card-title text-lg">Images & Fonts</h2>
                  <p className="text-base-content/70 text-sm">
                    Check image optimization and font usage best practices
                  </p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-accent text-accent-content rounded-full mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h2 className="card-title text-lg">CTAs & Layout</h2>
                  <p className="text-base-content/70 text-sm">
                    Evaluate call-to-action effectiveness and whitespace usage
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}