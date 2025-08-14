import React from 'react'
import Image from 'next/image'

interface ScreenshotSectionProps {
  screenshotUrl: string
  url: string
}

export default function ScreenshotSection({ screenshotUrl, url }: ScreenshotSectionProps) {
  return (
    <div className="rounded-xl border border-gray-700 p-8 bg-gray-800/20">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl text-blue-400" aria-hidden="true">📸</span>
        <h3 className="text-xl font-bold text-gray-100">Full Landing Page Screenshot</h3>
      </div>
      <div className="relative bg-gray-800 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <Image 
            src={screenshotUrl} 
            alt={`Screenshot of ${url}`}
            width={800}
            height={600}
            className="w-full object-cover object-top border border-gray-600 rounded"
          />
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2">
          <span>Scroll to see full page</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4 leading-relaxed">
        Full-page screenshot captured during analysis for visual reference and whitespace assessment.
      </p>
    </div>
  )
} 