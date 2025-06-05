'use client'

import { useState } from 'react'

interface UrlInputProps {
  onAnalyze: (url: string) => void
  isLoading?: boolean
}

export default function UrlInput({ onAnalyze, isLoading = false }: UrlInputProps) {
  const [url, setUrl] = useState('')
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
            Enter your landing page URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[#FFCC00] text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>
    </form>
  )
}