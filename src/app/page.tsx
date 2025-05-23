'use client'

import { useState } from 'react'
import UrlInput from '@/components/UrlInput'
import AnalysisResults from '@/components/AnalysisResults'
import ProgressiveLoader from '@/components/ProgressiveLoader'

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
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-50 mb-4">
            Landing Page Analyzer
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get detailed insights into your landing page performance across 6 key criteria: 
            page speed, fonts, images, CTAs, whitespace, and social proof.
          </p>
        </div>

        {/* URL Input Section */}
        <div className="mb-12">
          <UrlInput 
            onAnalyze={handleAnalyze} 
            isLoading={analysisState.isLoading}
          />
        </div>

        {/* Loading State */}
        <ProgressiveLoader isLoading={analysisState.isLoading} />

        {/* Error State */}
        {analysisState.error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="border border-red-700 rounded-lg p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">
                    Analysis Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
                    <p>{analysisState.error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleReset}
                      className="bg-red-700 text-red-100 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
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
                className="bg-[#FFCC00] text-gray-900 px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-base font-semibold shadow-md"
              >
                Analyze Another Page
              </button>
            </div>
            <AnalysisResults result={analysisState.result} />
          </div>
        )}

        {/* Footer/Info Section - Only show when no results */}
        {!analysisState.result && !analysisState.isLoading && !analysisState.error && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">Page Speed</h3>
                <p className="text-gray-300 text-sm">Analyze Core Web Vitals and loading performance metrics</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">Images & Fonts</h3>
                <p className="text-gray-300 text-sm">Check image optimization and font usage best practices</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">CTAs & Layout</h3>
                <p className="text-gray-300 text-sm">Evaluate call-to-action effectiveness and whitespace usage</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}