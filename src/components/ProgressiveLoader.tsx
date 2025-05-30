'use client'

import { useState, useEffect } from 'react'

interface ProgressStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  estimatedTime: number // in seconds
}

interface ProgressiveLoaderProps {
  isLoading: boolean
  screenshotUrl?: string | null
}

const steps: ProgressStep[] = [
  {
    id: 'browser',
    label: 'Launching browser',
    description: 'Setting up analysis environment',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    estimatedTime: 2
  },
  {
    id: 'page',
    label: 'Loading page',
    description: 'Fetching and parsing your landing page',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    estimatedTime: 3
  },
  {
    id: 'screenshot',
    label: 'Capturing screenshot',
    description: 'Taking a full-page visual snapshot for analysis',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    estimatedTime: 4
  },
  {
    id: 'speed',
    label: 'Analyzing page speed',
    description: 'Running Core Web Vitals and performance tests',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    estimatedTime: 6
  },
  {
    id: 'media',
    label: 'Checking fonts & images',
    description: 'Analyzing typography and media optimization',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    estimatedTime: 4
  },
  {
    id: 'cta',
    label: 'Evaluating CTAs',
    description: 'Finding and scoring call-to-action elements',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    estimatedTime: 5
  },
  {
    id: 'layout',
    label: 'Assessing layout',
    description: 'Analyzing whitespace and social proof elements',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    estimatedTime: 4
  },
  {
    id: 'results',
    label: 'Finalizing results',
    description: 'Calculating scores and generating your report',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    estimatedTime: 2
  }
]

export default function ProgressiveLoader({ isLoading, screenshotUrl }: ProgressiveLoaderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(0)
      setProgress(0)
      setStepProgress(0)
      return
    }

    let startTime = Date.now()
    let stepStartTime = Date.now()
    
    const interval = setInterval(() => {
      const now = Date.now()
      const totalElapsed = (now - startTime) / 1000
      const stepElapsed = (now - stepStartTime) / 1000
      
      const currentStep = steps[currentStepIndex]
      const stepProgressValue = Math.min((stepElapsed / currentStep.estimatedTime) * 100, 100)
      setStepProgress(stepProgressValue)
      
      // Calculate overall progress
      const completedStepsTime = steps.slice(0, currentStepIndex).reduce((sum, step) => sum + step.estimatedTime, 0)
      const currentStepProgress = (stepElapsed / currentStep.estimatedTime) * currentStep.estimatedTime
      const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0)
      const overallProgress = Math.min(((completedStepsTime + currentStepProgress) / totalTime) * 100, 100)
      setProgress(overallProgress)
      
      // Move to next step if current step is "complete" or after realistic timing
      if (stepProgressValue >= 100 && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
        stepStartTime = now
        setStepProgress(0)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading, currentStepIndex])

  if (!isLoading) return null

  const currentStep = steps[currentStepIndex]

  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-md mx-auto">
      {/* Main Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
        <div 
          className="bg-[#FFCC00] h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current Step */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-[#FFCC00] text-gray-900 rounded-full flex items-center justify-center">
          {currentStep.icon}
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-100">{currentStep.label}</h3>
          <p className="text-sm text-gray-400">{currentStep.description}</p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-1 mb-4">
        <div 
          className="bg-yellow-400 h-1 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${stepProgress}%` }}
        />
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-gray-300 text-sm mb-2">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      {/* Screenshot Preview with Scanning Animation */}
      {screenshotUrl && (
        <div className="mt-8 w-full">
          <div className="relative bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Page Screenshot</h4>
            <div className="relative overflow-hidden rounded-lg">
              <img 
                src={screenshotUrl} 
                alt="Page screenshot" 
                className="w-full max-h-64 object-cover object-top"
              />
              {/* Scanning Animation Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFCC00]/20 to-transparent h-8 animate-scan"></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Analyzing visual elements and layout...
            </p>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="mt-8 w-full">
        <div className="space-y-2">
          {steps.map((step, index) => {
            let status: 'completed' | 'current' | 'pending' = 'pending'
            if (index < currentStepIndex) status = 'completed'
            else if (index === currentStepIndex) status = 'current'

            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  status === 'current' 
                    ? 'bg-yellow-900/30 border border-yellow-600/30' 
                    : status === 'completed'
                    ? 'bg-green-900/20'
                    : 'bg-gray-800/30'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  status === 'completed'
                    ? 'bg-green-600 text-white'
                    : status === 'current'
                    ? 'bg-[#FFCC00] text-gray-900'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {status === 'completed' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : status === 'current' ? (
                    <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-sm ${
                  status === 'current' 
                    ? 'text-yellow-200 font-medium' 
                    : status === 'completed'
                    ? 'text-green-300'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}