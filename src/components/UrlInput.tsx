'use client'

import { useState, useEffect } from 'react'

interface UrlInputProps {
  onAnalyze: (url: string) => void
  isLoading?: boolean
  initialUrl?: string
}

export default function UrlInput({ onAnalyze, isLoading = false, initialUrl = '' }: UrlInputProps) {
  const [url, setUrl] = useState(initialUrl)

  // Update url when initialUrl changes
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl)
    }
  }, [initialUrl])
  const [error, setError] = useState('')

  const validateUrl = (input: string): boolean => {
    try {
      const url = new URL(input)
      // Check protocol
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false
      }
      // Check hostname exists and is not empty
      if (!url.hostname || url.hostname.trim() === '') {
        return false
      }
      // Check hostname contains at least one dot (domain.tld)
      if (!url.hostname.includes('.')) {
        return false
      }
      // Check hostname doesn't end with just a dot
      if (url.hostname.endsWith('.')) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 UrlInput handleSubmit called with:', url);
    setError('')

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    if (!validateUrl(normalizedUrl)) {
      setError('Please enter a valid URL')
      return
    }

    console.log('✅ UrlInput calling onAnalyze with:', normalizedUrl);
    onAnalyze(normalizedUrl)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (error) {
      setError('')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto" id="url-input">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-3">
            Analyze Your Landing Page Now
          </h2>
          <p className="text-gray-400 text-lg">
            Test one of your landing pages for a free report
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="stripe.com"
              className="flex-1 px-6 py-4 bg-gray-700/50 border border-gray-600 text-gray-100 rounded-xl focus:ring-2 focus:ring-[#FFCC00] focus:border-[#FFCC00] outline-none placeholder-gray-400 text-lg"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-[#FFCC00] text-gray-900 font-bold rounded-xl hover:bg-yellow-400 focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg flex items-center gap-2"
            >
              {isLoading ? 'Analyzing...' : (
                <>
                  Run Your Report Now
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </form>

        {/* Benefits */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>No signup required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>Results in about a minute</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>Free to try</span>
          </div>
        </div>
      </div>
    </div>
  )
}