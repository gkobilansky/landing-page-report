'use client'

import { useState } from 'react'

interface AlgorithmModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AlgorithmModal({ isOpen, onClose }: AlgorithmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-2xl font-bold text-gray-100 mb-4">
          How Our Analysis Works
        </h3>
        <p className="text-gray-400 text-base mb-6">
          Understanding our automated analysis helps you trust and act on the recommendations. Here&apos;s exactly how we evaluate each aspect of your landing page:
        </p>
        
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
              🚀 Page Speed Analysis
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              We use Google Lighthouse and browser Performance APIs to measure Core Web Vitals (LCP, FCP, CLS). Our system runs your page in a controlled Chrome browser and captures real loading metrics, then converts technical data into actionable scores with letter grades (A-F).
            </p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
              🎯 Call-to-Action Detection
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              Our browser automation scans for buttons, links, and forms, then analyzes their text against our action-word dictionary and evaluates positioning. We filter out navigation elements and prioritize CTAs with strong action words like &quot;Start,&quot; &quot;Get,&quot; or &quot;Try.&quot;
            </p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
              📏 Whitespace Assessment
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              We divide your page into a 3x4 grid and count elements in each section to detect overcrowding. Our algorithm also measures spacing between key elements like headlines and CTAs, comparing against design best practices for readability.
            </p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
              ⭐ Social Proof Detection
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              We scan for testimonials, reviews, ratings, trust badges, and customer counts using pattern matching on text and images. Elements are scored higher when they include names, companies, or appear above-the-fold where visitors see them first.
            </p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
              🔤 Font Analysis
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              We extract font-family declarations from all page elements and count unique font families used. Pages score higher with 2 or fewer font families, as too many fonts create visual inconsistency and slower loading times.
            </p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
              🖼️ Image Optimization
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              We analyze image formats (preferring modern WebP/AVIF), check for alt text accessibility, and identify oversized images. Our scoring weighs format efficiency (40%), alt text coverage (35%), and appropriate sizing (25%).
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm text-center">
            Our algorithms combine technical precision with conversion best practices to give you actionable insights.
          </p>
        </div>
      </div>
    </div>
  )
}

// Reusable button component for triggering the modal
interface AlgorithmModalButtonProps {
  onClick: () => void
  variant?: 'default' | 'compact'
  className?: string
}

export function AlgorithmModalButton({ onClick, variant = 'default', className = '' }: AlgorithmModalButtonProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`text-blue-400 hover:text-blue-300 underline transition-colors text-sm font-medium ${className}`}
      >
        How we analyze
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      How we analyze
    </button>
  )
}