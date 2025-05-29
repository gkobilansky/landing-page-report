'use client'

import { useState } from 'react'
import Image from 'next/image'
import UrlInput from '@/components/UrlInput'
import EmailInput from '@/components/EmailInput'
import AnalysisResults from '@/components/AnalysisResults'
import ProgressiveLoader from '@/components/ProgressiveLoader'

interface AnalysisState {
  result: any
  isLoading: boolean
  error: string | null
  showEmailInput: boolean
  email: string | null
  currentUrl: string | null
  fromCache: boolean
  emailSubmitted: boolean
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
    emailSubmitted: false
  })

  const handleAnalyze = async (url: string, forceRescan = false) => {
    setAnalysisState({
      result: null,
      isLoading: true,
      error: null,
      showEmailInput: true,
      email: null,
      currentUrl: url,
      fromCache: false,
      emailSubmitted: false
    })

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, forceRescan }),
      })

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
        fromCache: result.fromCache || false
      }))
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        result: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }))
    }
  }

  const handleEmailSubmit = async (email: string) => {
    setAnalysisState(prev => ({
      ...prev,
      email,
      emailSubmitted: true
    }))
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
      emailSubmitted: false
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
        {/* Top Section with More Space and Arrow */}
        <div className="relative mb-20">
          {/* Mobile arrow (vertical) */}
        <div className="absolute right-2 top-full -translate-y-4 lg:hidden">
          <div className="flex flex-col items-end">
            <svg width="60" height="75" viewBox="0 0 60 100">
              <path
                d="M30,95 Q40,60 30,5 M15,30 L30,5 L45,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary"
                style={{ strokeDasharray: "5,5" }}
              />
            </svg>
            <span className="font-handwriting text-lg text-primary rotate-2 -translate-x-0 -translate-y-3">

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
                  <path fill="#ffffff" d="M314.441406 202.355469 L215.710938 202.355469 C204.042969 202.355469 194.550781 211.847656 194.550781 223.511719 L194.550781 294.035156 C194.550781 305.699219 204.042969 315.191406 215.710938 315.191406 L258.023438 315.191406 L258.023438 329.296875 L243.917969 329.296875 C240.019531 329.296875 236.867188 332.457031 236.867188 336.347656 C 236.867188 340.242188 240.019531 343.398438 243.917969 343.398438 L286.230469 343.398438 C 290.132812 343.398438 293.285156 340.242188 293.285156 336.347656 C 293.285156 332.457031 290.132812 329.296875 286.230469 329.296875 L 272.125 329.296875 L 272.125 308.140625 C 272.125 304.246094 268.976562 301.085938 265.074219 301.085938 L215.707031 301.085938 C 211.816406 301.085938 208.65625 297.921875 208.65625 294.035156 L 208.65625 286.984375 L 321.492188 286.984375 L 321.492188 294.035156 C 321.492188 297.921875 318.332031 301.085938 314.441406 301.085938 L 293.285156 301.085938 C 289.382812 301.085938 286.230469 304.246094 286.230469 308.140625 C 286.230469 312.03125 289.382812 315.191406 293.285156 315.191406 L 314.441406 315.191406 C 326.105469 315.191406 335.597656 305.699219 335.597656 294.035156 L 335.597656 223.511719 C 335.597656 211.847656 326.105469 202.355469 314.441406 202.355469 Z M 321.492188 272.875 L 208.65625 272.875 L 208.65625 223.511719 C 208.65625 219.625 211.816406 216.457031 215.710938 216.457031 L 314.441406 216.457031 C 318.332031 216.457031 321.492188 219.625 321.492188 223.511719 Z"/>
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
          {/* Fun Arrow with "built by lansky.tech" */}
          <div className="absolute right-0 top-full -translate-y-10 hidden lg:block">
          <div className="flex items-end gap-2">
            <svg width="120" height="80" viewBox="0 0 120 80" className="transform -scale-x-100 -translate-x-8">
              <path
                d="M5,60 Q40,60 60,30 T115,10 M90,0 L115,10 L90,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary"
                style={{ strokeDasharray: "5,5" }}
              />
            </svg>
            <span className="font-handwriting text-lg text-primary rotate-2 -translate-x-8">

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
                  <path fill="#ffffff" d="M314.441406 202.355469 L215.710938 202.355469 C204.042969 202.355469 194.550781 211.847656 194.550781 223.511719 L194.550781 294.035156 C194.550781 305.699219 204.042969 315.191406 215.710938 315.191406 L258.023438 315.191406 L258.023438 329.296875 L243.917969 329.296875 C240.019531 329.296875 236.867188 332.457031 236.867188 336.347656 C 236.867188 340.242188 240.019531 343.398438 243.917969 343.398438 L286.230469 343.398438 C 290.132812 343.398438 293.285156 340.242188 293.285156 336.347656 C 293.285156 332.457031 290.132812 329.296875 286.230469 329.296875 L 272.125 329.296875 L 272.125 308.140625 C 272.125 304.246094 268.976562 301.085938 265.074219 301.085938 L215.707031 301.085938 C 211.816406 301.085938 208.65625 297.921875 208.65625 294.035156 L 208.65625 286.984375 L 321.492188 286.984375 L 321.492188 294.035156 C 321.492188 297.921875 318.332031 301.085938 314.441406 301.085938 L 293.285156 301.085938 C 289.382812 301.085938 286.230469 304.246094 286.230469 308.140625 C 286.230469 312.03125 289.382812 315.191406 293.285156 315.191406 L 314.441406 315.191406 C 326.105469 315.191406 335.597656 305.699219 335.597656 294.035156 L 335.597656 223.511719 C 335.597656 211.847656 326.105469 202.355469 314.441406 202.355469 Z M 321.492188 272.875 L 208.65625 272.875 L 208.65625 223.511719 C 208.65625 219.625 211.816406 216.457031 215.710938 216.457031 L 314.441406 216.457031 C 318.332031 216.457031 321.492188 219.625 321.492188 223.511719 Z"/>
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
        



          {/* Header */}
          <div className="text-center pt-2">
            <h1 className="text-4xl font-bold text-gray-50 mb-4">
              <span className="text-primary">Landing Page Review</span>
            </h1>
            <p className="text-gray-300 text-sm">
              Is your landing page up to snuff? Let&apos;s find out.
            </p>
          </div>
        </div>

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
              isLoading={false}
            />
          </div>
        )}

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

        {/* Cache Notification */}
        {analysisState.result && !analysisState.isLoading && analysisState.fromCache && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-200 text-sm">
                      Returning cached result, since we already scanned this URL today
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleForceRescan}
                  disabled={analysisState.isLoading}
                  className="ml-4 px-4 py-2 bg-blue-600 text-blue-100 rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Force Rescan
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
                className="bg-[#FFCC00] text-gray-900 px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-base font-semibold shadow-md"
              >
                Analyze Another Page
              </button>
            </div>
            <AnalysisResults result={analysisState.result} />
            
            {/* Email Input after results */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <EmailInput 
                onEmailSubmit={handleEmailSubmit}
                isLoading={false}
                isAnalysisComplete={true}
                initialSubmittedState={analysisState.emailSubmitted}
              />
            </div>
          </div>
        )}

        {/* Footer/Info Section - Only show when no results */}
        {!analysisState.result && !analysisState.isLoading && !analysisState.error && !analysisState.showEmailInput && (
          
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">Page Speed & Core Web Vitals</h3>
                <p className="text-gray-300 text-sm">Analyze Core Web Vitals, loading performance, and overall page responsiveness.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">Image & Font Optimization</h3>
                <p className="text-gray-300 text-sm">Check image optimization, format, and font loading strategies.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">CTAs, Layout & Whitespace</h3>
                <p className="text-gray-300 text-sm">Evaluate call-to-action clarity, layout effectiveness, and whitespace usage.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-50 mb-2">Social Proof & Trust</h3>
                <p className="text-gray-300 text-sm">Assess the use of testimonials, reviews, and other trust-building signals.</p>
              </div>
            </div>
          </div>
          )}
   
                   {/* Letter Style Section */}
            <div className="max-w-3xl mx-auto text-left my-16 p-8 rounded-lg shadow-xl" style={{backgroundColor: 'var(--color-bg-card)'}}>
              <div className="flex items-start space-x-6 mb-8">
                <Image
                  src="/gene-kobilansky-headshot-yellow-bg.png"
                  alt="Gene Kobilansky"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 flex-shrink-0"
                />
                <div>
                  <p className="text-xl text-gray-200 leading-relaxed">
                    Hi, I&apos;m Gene. I&apos;ve been working on landing pages for almost 20 years and there&apos;s a few things I&apos;ve found that quickly and easily improve any landing page.
                  </p>
                </div>
              </div>
              <div className="text-gray-300 leading-relaxed space-y-4 mb-8">
                <p>Here are some key takeaways from my experience:</p>
                <ul className="list-disc list-inside space-y-3 pl-4">
                  <li>
                    <strong>Fast pages mean happy customers.</strong> Prioritize performance.
                  </li>
                  <li>
                    An <strong>action-oriented CTA in the header</strong> is a must. Make it clear what you want users to do.
                  </li>
                  <li>
                    <strong>Simplify your fonts.</strong> Too many can confuse readers and slow down loading times.
                  </li>
                  <li>
                    Most pages don&apos;t have enough <strong>whitespace</strong>. Give your content breathing room; it reduces visual clutter and improves focus.
                  </li>
                  <li>
                    Don&apos;t forget your <strong>social proof!</strong> Trust is the most valuable commodity we have. Showcase testimonials, reviews, or case studies.
                  </li>
                </ul>
              </div>
              <p className="text-gray-300 leading-relaxed mb-10">
                I built this tool to make it easier to test your pages and make &apos;em awesome. Have ideas on how to improve it? Want some help help improving your Landing Page? Send me a note <a href="mailto:gene@lansky.tech" className='text-yellow-300'>gene@lansky.tech</a>
              </p>
              <div className="text-right">
                <Image
                  src="/gk-initials-white.png"
                  alt="GK Signature"
                  width={128}
                  height={128}
                  className="w-32 h-auto inline-block"
                />
              </div>
            </div>
      </div>

      {/* Footer with Social Links */}
      <footer className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center space-x-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
          <span className="text-gray-400 text-sm hidden sm:block">Follow:</span>
          <div className="flex space-x-2">
            <a
              href="https://github.com/gkobilansky"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              aria-label="GitHub"
            >
              <Image
                src="/github-logo.svg"
                alt="GitHub"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </a>
            <a
              href="https://threads.net/@lansky.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              aria-label="Threads"
            >
              <Image
                src="/threads_logo.svg"
                alt="Threads"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </a>
            <a
              href="https://youtube.com/@lansky.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              aria-label="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a
              href="https://linkedin.com/in/gkobilansky"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}