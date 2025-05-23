import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import UrlInput from '../UrlInput'

describe('UrlInput Component', () => {
  const mockOnAnalyze = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render input field and analyze button', () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    expect(screen.getByLabelText(/enter your landing page url/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument()
  })

  it('should show error when submitting empty URL', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a URL')).toBeInTheDocument()
    })
    expect(mockOnAnalyze).not.toHaveBeenCalled()
  })

  it('should show error for invalid URL', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'not a valid url with spaces' }
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
    })
    expect(mockOnAnalyze).not.toHaveBeenCalled()
  })

  it('should call onAnalyze with valid URL', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com')
    })
  })

  it('should add https:// prefix to URL without protocol', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com')
    })
  })

  it('should show loading state when isLoading is true', () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} isLoading={true} />)
    
    expect(screen.getByRole('button', { name: /analyzing.../i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://example.com')).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should clear error when typing new URL', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    // Trigger error first
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
    await waitFor(() => {
      expect(screen.getByText('Please enter a URL')).toBeInTheDocument()
    })
    
    // Type new URL - error should clear
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://example.com' }
    })
    
    expect(screen.queryByText('Please enter a URL')).not.toBeInTheDocument()
  })

  it('should handle form submission with Enter key', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.submit(input.closest('form')!)
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com')
    })
  })

  it('should accept http:// URLs as valid', async () => {
    render(<UrlInput onAnalyze={mockOnAnalyze} />)
    
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'http://example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('http://example.com')
    })
  })
})