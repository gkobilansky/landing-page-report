import React from 'react'
import PageSpeedSection from './analysis/PageSpeedSection'
import CTASection from './analysis/CTASection'
import SocialProofSection from './analysis/SocialProofSection'
import WhitespaceSection from './analysis/WhitespaceSection'
import ImageOptimizationSection from './analysis/ImageOptimizationSection'
import FontUsageSection from './analysis/FontUsageSection'
import ScreenshotSection from './analysis/ScreenshotSection'
import CollapsibleSection, { COLLAPSE_THRESHOLD } from './CollapsibleSection'

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

// Section configurations for CollapsibleSection
const sectionConfigs = {
  cta: {
    title: 'CTA Analysis',
    icon: '🎯',
    colorTheme: {
      bgClass: 'bg-purple-950/20',
      borderClass: 'border-purple-800/40'
    }
  },
  social: {
    title: 'Social Proof',
    icon: '⭐',
    colorTheme: {
      bgClass: 'bg-amber-950/20',
      borderClass: 'border-amber-800/40'
    }
  },
  speed: {
    title: 'Page Load Speed',
    icon: '⚡',
    colorTheme: {
      bgClass: 'bg-blue-950/20',
      borderClass: 'border-blue-800/40'
    }
  },
  images: {
    title: 'Image Optimization',
    icon: '🖼️',
    colorTheme: {
      bgClass: 'bg-cyan-950/20',
      borderClass: 'border-cyan-800/40'
    }
  },
  whitespace: {
    title: 'Whitespace',
    icon: '📐',
    colorTheme: {
      bgClass: 'bg-indigo-950/20',
      borderClass: 'border-indigo-800/40'
    }
  },
  fonts: {
    title: 'Font Usage',
    icon: '🔤',
    colorTheme: {
      bgClass: 'bg-rose-950/20',
      borderClass: 'border-rose-800/40'
    }
  }
}

export default function AnalysisResults({ result, analysisId }: AnalysisResultsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 gap-8">
        {/* CTA Analysis - 25% weight */}
        {result.ctaAnalysis && (
          <CollapsibleSection
            title={sectionConfigs.cta.title}
            score={result.ctaAnalysis.score}
            icon={sectionConfigs.cta.icon}
            colorTheme={sectionConfigs.cta.colorTheme}
            sectionId="cta-section"
          >
            <CTASection ctaAnalysis={result.ctaAnalysis} />
          </CollapsibleSection>
        )}

        {/* Social Proof - 20% weight */}
        {result.socialProof && (
          <CollapsibleSection
            title={sectionConfigs.social.title}
            score={result.socialProof.score}
            icon={sectionConfigs.social.icon}
            colorTheme={sectionConfigs.social.colorTheme}
            sectionId="social-section"
          >
            <SocialProofSection socialProof={result.socialProof} />
          </CollapsibleSection>
        )}

        {/* Page Load Speed - 25% weight */}
        {result.pageLoadSpeed && (
          <CollapsibleSection
            title={sectionConfigs.speed.title}
            score={result.pageLoadSpeed.score}
            icon={sectionConfigs.speed.icon}
            colorTheme={sectionConfigs.speed.colorTheme}
            sectionId="speed-section"
          >
            <PageSpeedSection pageLoadSpeed={result.pageLoadSpeed} />
          </CollapsibleSection>
        )}

        {/* Image Optimization - 10% weight */}
        {result.imageOptimization && (
          <CollapsibleSection
            title={sectionConfigs.images.title}
            score={result.imageOptimization.score}
            icon={sectionConfigs.images.icon}
            colorTheme={sectionConfigs.images.colorTheme}
            sectionId="images-section"
          >
            <ImageOptimizationSection imageOptimization={result.imageOptimization} />
          </CollapsibleSection>
        )}

        {/* Whitespace Assessment - 15% weight */}
        {result.whitespaceAssessment && (
          <CollapsibleSection
            title={sectionConfigs.whitespace.title}
            score={result.whitespaceAssessment.score}
            icon={sectionConfigs.whitespace.icon}
            colorTheme={sectionConfigs.whitespace.colorTheme}
            sectionId="whitespace-section"
          >
            <WhitespaceSection whitespaceAssessment={result.whitespaceAssessment} />
          </CollapsibleSection>
        )}

        {/* Font Usage - 5% weight */}
        {result.fontUsage && (
          <CollapsibleSection
            title={sectionConfigs.fonts.title}
            score={result.fontUsage.score}
            icon={sectionConfigs.fonts.icon}
            colorTheme={sectionConfigs.fonts.colorTheme}
            sectionId="fonts-section"
          >
            <FontUsageSection fontUsage={result.fontUsage} />
          </CollapsibleSection>
        )}
      </div>

      {/* Screenshot Section */}
      {result.screenshotUrl && (
        <ScreenshotSection screenshotUrl={result.screenshotUrl} url={result.url} />
      )}
    </div>
  )
}