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
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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

    onAnalyze(normalizedUrl)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (error) {
      setError('')
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-lg font-medium">Enter your landing page URL</span>
            </label>
            <div className="join w-full">
              <input
                type="text"
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className={`input input-bordered join-item flex-1 ${error ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary join-item"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Analyzing...
                  </>
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
            {error && (
              <label className="label">
                <span className="label-text-alt text-error">{error}</span>
              </label>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}