import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../page'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock the API calls
global.fetch = jest.fn()

describe('Home Page', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial render', () => {
    it('should render the main components', () => {
      render(<Home />)
      
      expect(screen.getByText('Landing Page Review')).toBeInTheDocument()
      expect(screen.getByText('Is your landing page up to snuff? Let\'s find out.')).toBeInTheDocument()
      expect(screen.getByLabelText(/enter your landing page url/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument()
    })

    it('should show feature descriptions initially', () => {
      render(<Home />)
      
      expect(screen.getByText('Page Speed & Core Web Vitals')).toBeInTheDocument()
      expect(screen.getByText('Image & Font Optimization')).toBeInTheDocument()
      expect(screen.getByText('CTAs, Layout & Whitespace')).toBeInTheDocument()
      expect(screen.getByText('Social Proof & Trust')).toBeInTheDocument()
    })

    it('should show Gene\'s introduction section', () => {
      render(<Home />)
      
      expect(screen.getByText(/Hi, I'm Gene/)).toBeInTheDocument()
      expect(screen.getByText(/Fast pages mean happy customers/)).toBeInTheDocument()
    })
  })

  describe('Analysis flow without caching', () => {
    it('should start analysis and show email input immediately', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: false,
          analysis: {
            url: 'https://example.com',
            pageLoadSpeed: { score: 85, grade: 'B' },
            fontUsage: { score: 90 },
            imageOptimization: { score: 80 },
            ctaAnalysis: { score: 75 },
            whitespaceAssessment: { score: 70, grade: 'C' },
            socialProof: { score: 65 },
            overallScore: 78
          },
          message: 'Analysis completed successfully.'
        })
      }
      
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      render(<Home />)
      
      // Enter URL and submit
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      // Should immediately show email input and loading
      await waitFor(() => {
        expect(screen.getByText("I'll send you a note when your report is ready")).toBeInTheDocument()
        expect(screen.getByText('(Takes about 2-3 minutes to analyze your page)')).toBeInTheDocument()
      })
      
      // Should show loading animation
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
      
      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByText('Analyze Another Page')).toBeInTheDocument()
      })
      
      // Should show results
      expect(screen.getByText('78')).toBeInTheDocument() // Overall score
      
      // Should show email input after results (advanced testing)
      expect(screen.getByText("We're working on more advanced testing")).toBeInTheDocument()
      
      // Should NOT show cache notification
      expect(screen.queryByText(/cached result/i)).not.toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          error: 'Analysis failed'
        })
      }
      
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      render(<Home />)
      
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
        expect(screen.getByText('Analysis failed')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should allow retrying after error', async () => {
      const mockErrorResponse = {
        ok: false,
        json: async () => ({ error: 'Network error' })
      }
      
      mockFetch.mockResolvedValueOnce(mockErrorResponse as any)

      render(<Home />)
      
      // First attempt - error
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
      })
      
      // Click try again
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      
      // Should return to initial state
      expect(screen.getByLabelText(/enter your landing page url/i)).toBeInTheDocument()
      expect(screen.queryByText('Analysis Failed')).not.toBeInTheDocument()
    })
  })

  describe('Cache notification and force rescan', () => {
    it('should show cache notification when fromCache is true', async () => {
      const mockCachedResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: true,
          analysis: {
            url: 'https://example.com',
            pageLoadSpeed: { score: 85, grade: 'B' },
            fontUsage: { score: 90 },
            imageOptimization: { score: 80 },
            ctaAnalysis: { score: 75 },
            whitespaceAssessment: { score: 70, grade: 'C' },
            socialProof: { score: 65 },
            overallScore: 78
          },
          message: 'Returning cached analysis from within 24 hours.'
        })
      }
      
      mockFetch.mockResolvedValueOnce(mockCachedResponse as any)

      render(<Home />)
      
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Returning cached result, since we already scanned this URL today')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /force rescan/i })).toBeInTheDocument()
      })
      
      // Should show results
      expect(screen.getByText('78')).toBeInTheDocument()
    })

    it('should trigger force rescan when Force Rescan button is clicked', async () => {
      // First response - cached
      const mockCachedResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: true,
          analysis: { overallScore: 78 },
          message: 'Returning cached analysis from within 24 hours.'
        })
      }
      
      // Second response - fresh analysis
      const mockFreshResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: false,
          analysis: { overallScore: 82 },
          message: 'Analysis completed successfully.'
        })
      }
      
      mockFetch
        .mockResolvedValueOnce(mockCachedResponse as any)
        .mockResolvedValueOnce(mockFreshResponse as any)

      render(<Home />)
      
      // First analysis - get cached result
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/cached result/i)).toBeInTheDocument()
        expect(screen.getByText('78')).toBeInTheDocument()
      })
      
      // Force rescan
      fireEvent.click(screen.getByRole('button', { name: /force rescan/i }))
      
      // Should call API with forceRescan: true
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
      
      const secondCall = mockFetch.mock.calls[1]
      expect(secondCall[1]?.body).toContain('"forceRescan":true')
      
      // Should show fresh results without cache notification
      await waitFor(() => {
        expect(screen.queryByText(/cached result/i)).not.toBeInTheDocument()
        expect(screen.getByText('82')).toBeInTheDocument()
      })
    })

    it('should disable Force Rescan button during loading', async () => {
      const mockCachedResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: true,
          analysis: { overallScore: 78 },
          message: 'Returning cached analysis from within 24 hours.'
        })
      }
      
      // Mock a slow response for force rescan
      const slowMockResponse = new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            fromCache: false,
            analysis: { overallScore: 82 }
          })
        }), 100)
      )
      
      mockFetch
        .mockResolvedValueOnce(mockCachedResponse as any)
        .mockResolvedValueOnce(slowMockResponse as any)

      render(<Home />)
      
      // Get cached result first
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /force rescan/i })).toBeInTheDocument()
      })
      
      // Click Force Rescan
      fireEvent.click(screen.getByRole('button', { name: /force rescan/i }))
      
      // Button should be disabled during loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /force rescan/i })).toBeDisabled()
      })
    })
  })

  describe('Email collection flow', () => {
    it('should collect email during analysis', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: false,
          analysis: { overallScore: 78 }
        })
      }
      
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      render(<Home />)
      
      // Start analysis
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      // Email input should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument()
      })
      
      // Submit email
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument()
      })
      
      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByText('Analyze Another Page')).toBeInTheDocument()
      })
      
      // Should show email input again for advanced testing
      expect(screen.getByText("We're working on more advanced testing")).toBeInTheDocument()
    })

    it('should reset all state when Analyze Another Page is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: false,
          analysis: { overallScore: 78 }
        })
      }
      
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      render(<Home />)
      
      // Complete an analysis
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Analyze Another Page')).toBeInTheDocument()
      })
      
      // Click reset
      fireEvent.click(screen.getByRole('button', { name: /analyze another page/i }))
      
      // Should return to initial state
      expect(screen.getByLabelText(/enter your landing page url/i)).toBeInTheDocument()
      expect(screen.getByText('Page Speed & Core Web Vitals')).toBeInTheDocument()
      expect(screen.queryByText('Analyze Another Page')).not.toBeInTheDocument()
      expect(screen.queryByText(/cached result/i)).not.toBeInTheDocument()
    })
  })

  describe('API request validation', () => {
    it('should include forceRescan parameter in API calls', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          fromCache: false,
          analysis: { overallScore: 78 }
        })
      }
      
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      render(<Home />)
      
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"forceRescan":false')
        }))
      })
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<Home />)
      
      fireEvent.change(screen.getByLabelText(/enter your landing page url/i), {
        target: { value: 'https://example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })
})