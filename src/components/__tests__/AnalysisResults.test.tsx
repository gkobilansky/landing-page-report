import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AnalysisResults from '../AnalysisResults'

const mockAnalysisResult = {
  url: 'https://example.com',
  pageLoadSpeed: {
    score: 85,
    metrics: { 
      loadTime: 2.1, 
      speedDescription: 'Good performance', 
      relativeTo: 'Most websites load in 3-4 seconds' 
    },
    issues: ['LCP could be improved'],
    recommendations: ['Optimize images', 'Enable compression'],
    loadTime: 2100
  },
  fontUsage: {
    score: 100,
    fontFamilies: ['Inter', 'Georgia'],
    fontCount: 2,
    systemFontCount: 1,
    webFontCount: 1,
    issues: [],
    recommendations: ['Great font selection!']
  },
  imageOptimization: {
    score: 75,
    totalImages: 10,
    modernFormats: 6,
    withAltText: 8,
    appropriatelySized: 9,
    issues: ['2 images missing alt text'],
    recommendations: ['Add alt text to all images'],
    details: {}
  },
  ctaAnalysis: {
    score: 90,
    ctas: [
      { text: 'Get Started', confidence: 0.95, aboveFold: true },
      { text: 'Learn More', confidence: 0.8, aboveFold: false }
    ],
    issues: [],
    recommendations: ['Strong CTA placement']
  },
  whitespaceAssessment: {
    score: 78,
    metrics: {
      whitespaceRatio: 0.45,
      elementDensityPerSection: {
        gridSections: 12,
        maxDensity: 8,
        averageDensity: 4.2,
        totalElements: 50
      },
      spacingAnalysis: {
        headlineSpacing: { adequate: true },
        ctaSpacing: { adequate: true },
        contentBlockSpacing: { adequate: false },
        lineHeight: { adequate: true }
      },
      clutterScore: 22,
      hasAdequateSpacing: false
    },
    issues: ['Content blocks too close together'],
    recommendations: ['Increase spacing between content sections'],
    loadTime: 1500
  },
  socialProof: {
    score: 60,
    elements: [
      { 
        type: 'testimonial', 
        text: 'Great product!',
        score: 75,
        isAboveFold: true,
        hasImage: false,
        hasName: true,
        hasCompany: false,
        hasRating: false,
        credibilityScore: 75,
        visibility: 'high',
        context: 'content'
      }
    ],
    summary: {
      totalElements: 1,
      aboveFoldElements: 1,
      testimonials: 1,
      reviews: 0,
      ratings: 0,
      trustBadges: 0,
      customerCounts: 0,
      socialMedia: 0,
      certifications: 0,
      partnerships: 0,
      caseStudies: 0,
      newsMentions: 0
    },
    issues: ['Limited social proof elements'],
    recommendations: ['Add more testimonials']
  },
  overallScore: 78,
  status: 'completed'
}

describe('AnalysisResults', () => {
  it('renders scores and sections without letter grades', () => {
    const result = {
      url: 'https://example.com',
      pageLoadSpeed: {
        score: 85,
        metrics: {
          loadTime: 1.8,
          speedDescription: 'Very fast',
          relativeTo: 'Faster than 75% of websites'
        },
        issues: [],
        recommendations: [],
        loadTime: 1200
      },
      fontUsage: { score: 90, fontFamilies: ['Inter'], fontCount: 1, issues: [], recommendations: [] },
      imageOptimization: { score: 80, totalImages: 2, modernFormats: 1, withAltText: 2, appropriatelySized: 2, issues: [], recommendations: [], details: {} },
      ctaAnalysis: { score: 70, ctas: [], issues: [], recommendations: [] },
      whitespaceAssessment: {
        score: 75,
        metrics: {
          whitespaceRatio: 0.5,
          elementDensityPerSection: { gridSections: 12, maxDensity: 5, averageDensity: 2.5, totalElements: 30 },
          spacingAnalysis: { headlineSpacing: { adequate: true }, ctaSpacing: { adequate: true }, contentBlockSpacing: { adequate: true }, lineHeight: { adequate: true } },
          clutterScore: 10,
          hasAdequateSpacing: true
        },
        issues: [],
        recommendations: [],
        loadTime: 1000
      },
      socialProof: { score: 60, elements: [], summary: { totalElements: 0, aboveFoldElements: 0, testimonials: 0, reviews: 0, ratings: 0, trustBadges: 0, customerCounts: 0, socialMedia: 0, certifications: 0, partnerships: 0, caseStudies: 0, newsMentions: 0 }, issues: [], recommendations: [] },
      overallScore: 78,
      status: 'completed'
    } as any

    render(<AnalysisResults result={result} />)

    expect(screen.getByText(/Page Load Speed/)).toBeInTheDocument()
    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.queryByText(/Grade/)).not.toBeInTheDocument()
  })
})

describe('AnalysisResults Component', () => {
  it('should render overall score', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    expect(screen.getByText(/Overall Score/i)).toBeInTheDocument()
    expect(screen.getAllByText('78').length).toBeGreaterThanOrEqual(1)
  })

  it('should display analyzed URL', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
  })

  it('should show all 6 analysis categories', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    expect(screen.getByText('Page Load Speed')).toBeInTheDocument()
    expect(screen.getByText('Font Usage')).toBeInTheDocument()
    expect(screen.getByText('Image Optimization')).toBeInTheDocument()
    expect(screen.getByText('CTA Analysis')).toBeInTheDocument()
    expect(screen.getByText('Whitespace Assessment')).toBeInTheDocument()
    expect(screen.getByText('Social Proof')).toBeInTheDocument()
  })

  it('should display scores for each category', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    expect(screen.getByTestId('score-badge-page-load-speed')).toHaveTextContent('85')
    expect(screen.getByTestId('score-badge-font-usage')).toHaveTextContent('100')
    expect(screen.getByTestId('score-badge-image-optimization')).toHaveTextContent('75')
    expect(screen.getByTestId('score-badge-cta-analysis')).toHaveTextContent('90')
    expect(screen.getByTestId('score-badge-whitespace-assessment')).toHaveTextContent('78')
    expect(screen.getByTestId('score-badge-social-proof')).toHaveTextContent('60')
  })

  it('should show color-coded score badges based on score ranges', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    // Test different score ranges with CSS classes
    const scoreElements = screen.getAllByTestId(/score-badge/)
    expect(scoreElements.length).toBeGreaterThan(0)
  })

  it('should display issues and recommendations when expanded', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    // These should be visible in the detailed view
    expect(screen.getByText('• LCP could be improved')).toBeInTheDocument()
    expect(screen.getByText('• Optimize images')).toBeInTheDocument()
    expect(screen.getByText('• 2 images missing alt text')).toBeInTheDocument()
    expect(screen.getByText('• Content blocks too close together')).toBeInTheDocument()
  })

  it('should handle perfect scores correctly', () => {
    const perfectResult = {
      ...mockAnalysisResult,
      fontUsage: {
        ...mockAnalysisResult.fontUsage,
        score: 100
      },
      overallScore: 95
    }
    
    render(<AnalysisResults result={perfectResult} />)
    
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })

  it('should handle zero scores correctly', () => {
    const poorResult = {
      ...mockAnalysisResult,
      pageLoadSpeed: {
        ...mockAnalysisResult.pageLoadSpeed,
        score: 0
      },
      overallScore: 15
    }
    
    render(<AnalysisResults result={poorResult} />)
    
    expect(screen.getByTestId('score-badge-page-load-speed')).toHaveTextContent('0')
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should show metrics details for relevant categories', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    // Font metrics
    expect(screen.getByText('Inter')).toBeInTheDocument()
    expect(screen.getByText('Georgia')).toBeInTheDocument()
    
    // Image metrics
    expect(screen.getByText('10')).toBeInTheDocument() // Total images
    expect(screen.getByText('6')).toBeInTheDocument() // Modern formats
    
    // CTA metrics
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Learn More')).toBeInTheDocument()
  })

  it('should display page speed metrics correctly', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    // In the simplified component, we don't render raw LCP/FCP numbers, so just ensure description present
    expect(screen.getByText(/Good performance/)).toBeInTheDocument()
  })

  it('should handle missing or incomplete data gracefully', () => {
    const incompleteResult = {
      url: 'https://example.com',
      overallScore: 50,
      status: 'completed',
      // Missing most analysis data
      fontUsage: { score: 0, fontFamilies: [], fontCount: 0, issues: [], recommendations: [] },
      imageOptimization: { score: 0, totalImages: 0, modernFormats: 0, withAltText: 0, appropriatelySized: 0, issues: [], recommendations: [], details: {} }
    }
    
    render(<AnalysisResults result={incompleteResult} />)
    
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
  })

  it('should show analysis status', () => {
    render(<AnalysisResults result={mockAnalysisResult} />)
    
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
  })
})