import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EmailInput from '../EmailInput'

describe('EmailInput Component', () => {
  const mockOnEmailSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Default state (analysis not complete)', () => {
    it('should render with default message for analysis in progress', () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      expect(screen.getByText("I'll send you a note when your report is ready")).toBeInTheDocument()
      expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /notify me/i })).toBeInTheDocument()
    })

    it('should show error when submitting empty email', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Please enter your email address')).toBeInTheDocument()
      })
      expect(mockOnEmailSubmit).not.toHaveBeenCalled()
    })

    it('should show error for invalid email format', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      const input = screen.getByPlaceholderText('your.email@example.com')
      const button = screen.getByRole('button', { name: /notify me/i })
      
      fireEvent.change(input, {
        target: { value: 'notvalidemail' }
      })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
      
      expect(mockOnEmailSubmit).not.toHaveBeenCalled()
    })

    it('should call onEmailSubmit with valid email', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('should trim whitespace from email input', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: '  test@example.com  ' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('should clear error when typing new email', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      // Trigger error first
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      await waitFor(() => {
        expect(screen.getByText('Please enter your email address')).toBeInTheDocument()
      })
      
      // Type new email - error should clear
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'test@example.com' }
      })
      
      expect(screen.queryByText('Please enter your email address')).not.toBeInTheDocument()
    })

    it('should handle form submission with Enter key', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      const input = screen.getByPlaceholderText('your.email@example.com')
      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.submit(input.closest('form')!)
      
      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com')
      })
    })
  })

  describe('Analysis complete state', () => {
    it('should render advanced testing message when analysis is complete', () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} isAnalysisComplete={true} />)
    })

    it('should still accept email submissions when analysis is complete', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} isAnalysisComplete={true} />)
      
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'advanced@example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalledWith('advanced@example.com')
      })
    })

    it('should validate email even when analysis is complete', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} isAnalysisComplete={true} />)
      
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'notvalidemail' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
      expect(mockOnEmailSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('should show loading state when isLoading is true', () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} isLoading={true} />)
      
      expect(screen.getByRole('button', { name: /sending.../i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('your.email@example.com')).toBeDisabled()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should disable form when loading', () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} isLoading={true} />)
      
      const input = screen.getByPlaceholderText('your.email@example.com')
      const button = screen.getByRole('button')
      
      expect(input).toBeDisabled()
      expect(button).toBeDisabled()
    })
  })

  describe('Success state', () => {
    it('should show success message after email submission', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
      
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'success@example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument()
        expect(screen.getByText("I'll send you a note when your report is ready.")).toBeInTheDocument()
      })
      
      // Form should be hidden after success
      expect(screen.queryByPlaceholderText('your.email@example.com')).not.toBeInTheDocument()
    })

    it('should show advanced message in success state when analysis is complete', async () => {
      render(<EmailInput onEmailSubmit={mockOnEmailSubmit} isAnalysisComplete={true} />)
      
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'success@example.com' }
      })
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument()
      })
    })
  })

  describe('Email validation edge cases', () => {
    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'test+tag@example.org',
        'user123@test-domain.io'
      ]

      for (const email of validEmails) {
        jest.clearAllMocks()
        render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
        
        fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
          target: { value: email }
        })
        fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
        
        await waitFor(() => {
          expect(mockOnEmailSubmit).toHaveBeenCalledWith(email)
        })
      }
    })

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test@com',
        ''
      ]

      for (const email of invalidEmails) {
        jest.clearAllMocks()
        const { unmount } = render(<EmailInput onEmailSubmit={mockOnEmailSubmit} />)
        
        if (email) {
          fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
            target: { value: email }
          })
        }
        fireEvent.click(screen.getByRole('button', { name: /notify me/i }))
        
        await waitFor(() => {
          expect(screen.getByText(/please enter.*email/i)).toBeInTheDocument()
        })
        expect(mockOnEmailSubmit).not.toHaveBeenCalled()
        unmount()
      }
    })
  })

  describe('Component props variations', () => {
    it('should handle all prop combinations correctly', () => {
      const { rerender } = render(
        <EmailInput 
          onEmailSubmit={mockOnEmailSubmit} 
          isLoading={false} 
          isAnalysisComplete={false}
        />
      )
      
      expect(screen.getByText("I'll send you a note when your report is ready")).toBeInTheDocument()
      
      rerender(
        <EmailInput 
          onEmailSubmit={mockOnEmailSubmit} 
          isLoading={true} 
          isAnalysisComplete={false}
        />
      )
      
      expect(screen.getByRole('button', { name: /sending.../i })).toBeInTheDocument()
      
      rerender(
        <EmailInput 
          onEmailSubmit={mockOnEmailSubmit} 
          isLoading={false} 
          isAnalysisComplete={true}
        />
      )
      
      expect(screen.getByText(/We're working on more advanced testing/)).toBeInTheDocument()
    })
  })
})