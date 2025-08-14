import React from 'react'
import PageSpeedSection from './analysis/PageSpeedSection'
import CTASection from './analysis/CTASection'
import SocialProofSection from './analysis/SocialProofSection'
import WhitespaceSection from './analysis/WhitespaceSection'
import ImageOptimizationSection from './analysis/ImageOptimizationSection'
import FontUsageSection from './analysis/FontUsageSection'
import ScreenshotSection from './analysis/ScreenshotSection'

interface AnalysisResult {
  url: string
  pageLoadSpeed?: {
    score: number
    metrics: {
      loadTime: number; // Page load time in seconds (marketing-friendly)
      speedDescription: string; // Marketing-friendly description
      relativeTo: string; // Comparison to other websites
    }
    issues: string[]
    recommendations: string[]
    loadTime: number
  }
  fontUsage?: {
    score: number
    fontFamilies: string[]
    fontCount: number
    systemFontCount?: number
    webFontCount?: number
    issues: string[]
    recommendations: string[]
  }
  imageOptimization?: {
    score: number
    totalImages: number
    modernFormats: number
    withAltText: number
    appropriatelySized: number
    issues: string[]
    recommendations: string[]
    details: any
  }
  ctaAnalysis?: {
    score: number
    ctas: Array<{ 
      text: string; 
      type?: string;
      confidence?: number; 
      aboveFold?: boolean;
      isAboveFold?: boolean;
      actionStrength?: string;
      urgency?: string;
      visibility?: string;
      context?: string;
    }>
    primaryCTA?: {
      text: string;
      type?: string;
      actionStrength?: string;
      visibility?: string;
      context?: string;
    }
    issues: string[]
    recommendations: string[]
  }
  whitespaceAssessment?: {
    score: number
    metrics: {
      whitespaceRatio: number
      elementDensityPerSection: {
        gridSections: number
        maxDensity: number
        averageDensity: number
        totalElements: number
      }
      spacingAnalysis: {
        headlineSpacing: { adequate: boolean }
        ctaSpacing: { adequate: boolean }
        contentBlockSpacing: { adequate: boolean }
        lineHeight: { adequate: boolean }
      }
      clutterScore: number
      hasAdequateSpacing: boolean
    }
    issues: string[]
    recommendations: string[]
    loadTime: number
  }
  socialProof?: {
    score: number
    elements: Array<{ 
      type: string; 
      text: string;
      score: number;
      isAboveFold: boolean;
      hasImage: boolean;
      hasName: boolean;
      hasCompany: boolean;
      hasRating: boolean;
      credibilityScore: number;
      visibility: string;
      context: string;
    }>
    summary: {
      totalElements: number;
      aboveFoldElements: number;
      testimonials: number;
      reviews: number;
      ratings: number;
      trustBadges: number;
      customerCounts: number;
      socialMedia: number;
      certifications: number;
      partnerships: number;
      caseStudies: number;
      newsMentions: number;
    }
    issues: string[]
    recommendations: string[]
  }
  overallScore: number
  status: string
  screenshotUrl?: string | null
}

interface AnalysisResultsProps {
  result: AnalysisResult
  analysisId?: string
}



export default function AnalysisResults({ result, analysisId }: AnalysisResultsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Analysis Categories - Ordered by Priority/Weight */}
      <div className="grid grid-cols-1 gap-8">
        {/* Page Load Speed - 25% weight */}
        {result.pageLoadSpeed && (
          <PageSpeedSection pageLoadSpeed={result.pageLoadSpeed} />
        )}

        {/* CTA Analysis - 25% weight */}
        {result.ctaAnalysis && (
          <CTASection ctaAnalysis={result.ctaAnalysis} />
        )}

        {/* Social Proof - 20% weight */}
        {result.socialProof && (
          <SocialProofSection socialProof={result.socialProof} />
        )}

        {/* Whitespace Assessment - 15% weight */}
        {result.whitespaceAssessment && (
          <WhitespaceSection whitespaceAssessment={result.whitespaceAssessment} />
        )}

        {/* Image Optimization - 10% weight */}
        {result.imageOptimization && (
          <ImageOptimizationSection imageOptimization={result.imageOptimization} />
        )}

        {/* Font Usage - 5% weight */}
        {result.fontUsage && (
          <FontUsageSection fontUsage={result.fontUsage} />
        )}
      </div>

      {/* Screenshot Section */}
      {result.screenshotUrl && (
        <ScreenshotSection screenshotUrl={result.screenshotUrl} url={result.url} />
      )}
    </div>
  )
}