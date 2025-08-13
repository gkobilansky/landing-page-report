'use client'

import { useState } from 'react'
import AlgorithmModal, { AlgorithmModalButton } from './AlgorithmModal'

export default function FeaturesGrid() {
  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false)

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
  
        
        </div>
        
        {/* How we analyze button */}
        <div className="mt-12 text-center">
          <AlgorithmModalButton 
            onClick={() => setShowAlgorithmModal(true)}
            className="mx-auto"
          />
        </div>
      </div>

      <AlgorithmModal 
        isOpen={showAlgorithmModal}
        onClose={() => setShowAlgorithmModal(false)}
      />
    </>
  )
}