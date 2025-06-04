'use client'

import { useState } from 'react'

interface EmailInputProps {
  onEmailSubmit: (email: string) => void
  isLoading?: boolean
  isAnalysisComplete?: boolean
  initialSubmittedState?: boolean
}

export default function EmailInput({ onEmailSubmit, isLoading = false, isAnalysisComplete = false, initialSubmittedState = false }: EmailInputProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(initialSubmittedState)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitted(true)
    onEmailSubmit(email.trim())
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) {
      setError('')
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 font-medium">Thanks!</span>
          </div>
          <p className="text-gray-300 text-sm">
            I&apos;ll keep you posted as we add more testing capabilities to this tool.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-4">
          {isAnalysisComplete ? (
            <p className="text-gray-300 text-lg mb-2">
              We&apos;re working on more advanced testing, add your email to automatically receive updates once they&apos;re out.
            </p>
          ) : (
              <>
                <p className="text-gray-300 text-lg mb-2">
                  No need to wait, we can send the report to your email. 
                </p>
              <p className="text-gray-400 text-sm">
                (Takes about 45 sec - 1 min to analyze your page)
              </p>
            </>
          )}
        </div>
        
        <div>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your.email@example.com"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[#FFCC00] text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Notify Me'}
            </button>
          </div>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </form>
    </div>
  )
}