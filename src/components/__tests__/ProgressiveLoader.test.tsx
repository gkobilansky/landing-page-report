import { render, screen, act } from '@testing-library/react';
import ProgressiveLoader from '../ProgressiveLoader';
import { jest } from '@jest/globals';

// Mock setTimeout for animations
jest.useFakeTimers();

describe('ProgressiveLoader', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should not render when not loading', () => {
    const { container } = render(<ProgressiveLoader isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render loading state with progress bars', () => {
    render(<ProgressiveLoader isLoading={true} />);
    
    // Check for main progress bar
    expect(screen.getByRole('generic')).toBeInTheDocument();
    
    // Check for step indicators
    expect(screen.getByText('Launching browser')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
  });

  it('should display screenshot when provided', () => {
    const screenshotUrl = 'https://blob.vercel-storage.com/screenshot-test-123.png';
    
    render(
      <ProgressiveLoader 
        isLoading={true} 
        screenshotUrl={screenshotUrl} 
      />
    );
    
    // Check for screenshot section
    expect(screen.getByText('Page Screenshot')).toBeInTheDocument();
    expect(screen.getByText('Analyzing visual elements and layout...')).toBeInTheDocument();
    
    // Check for screenshot image
    const screenshot = screen.getByAltText('Page screenshot');
    expect(screenshot).toBeInTheDocument();
    expect(screenshot).toHaveAttribute('src', screenshotUrl);
  });

  it('should not display screenshot section when no URL provided', () => {
    render(<ProgressiveLoader isLoading={true} />);
    
    expect(screen.queryByText('Page Screenshot')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Page screenshot')).not.toBeInTheDocument();
  });

  it('should progress through steps over time', () => {
    render(<ProgressiveLoader isLoading={true} />);
    
    // Initially should be on first step
    expect(screen.getByText('Launching browser')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
    
    // Fast-forward time to progress through steps
    act(() => {
      jest.advanceTimersByTime(3000); // Advance by 3 seconds
    });
    
    // Should progress to next step
    expect(screen.getByText('Step 2 of 7')).toBeInTheDocument();
  });

  it('should show all expected steps', () => {
    render(<ProgressiveLoader isLoading={true} />);
    
    const expectedSteps = [
      'Launching browser',
      'Loading page',
      'Capturing screenshot',
      'Analyzing page speed',
      'Checking fonts & images',
      'Evaluating CTAs',
      'Assessing layout',
      'Finalizing results'
    ];
    
    expectedSteps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('should show correct step statuses', () => {
    render(<ProgressiveLoader isLoading={true} />);
    
    // First step should be current (has animate-pulse)
    const firstStepIndicator = screen.getByText('Launching browser')
      .parentElement?.querySelector('.animate-pulse');
    expect(firstStepIndicator).toBeInTheDocument();
    
    // Other steps should be pending (show numbers)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should reset progress when loading stops', () => {
    const { rerender } = render(<ProgressiveLoader isLoading={true} />);
    
    // Progress through some steps
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Stop loading
    rerender(<ProgressiveLoader isLoading={false} />);
    
    // Start loading again
    rerender(<ProgressiveLoader isLoading={true} />);
    
    // Should be back to step 1
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for screenshot animation', () => {
    const screenshotUrl = 'https://blob.vercel-storage.com/screenshot-test-123.png';
    
    render(
      <ProgressiveLoader 
        isLoading={true} 
        screenshotUrl={screenshotUrl} 
      />
    );
    
    // Check for scanning animation class
    const scanningOverlay = document.querySelector('.animate-scan');
    expect(scanningOverlay).toBeInTheDocument();
    expect(scanningOverlay).toHaveClass('bg-gradient-to-b');
  });

  it('should handle screenshot URL changes', () => {
    const { rerender } = render(<ProgressiveLoader isLoading={true} />);
    
    // Initially no screenshot
    expect(screen.queryByText('Page Screenshot')).not.toBeInTheDocument();
    
    // Add screenshot
    const screenshotUrl = 'https://blob.vercel-storage.com/screenshot-test-123.png';
    rerender(
      <ProgressiveLoader 
        isLoading={true} 
        screenshotUrl={screenshotUrl} 
      />
    );
    
    // Should now show screenshot
    expect(screen.getByText('Page Screenshot')).toBeInTheDocument();
    expect(screen.getByAltText('Page screenshot')).toHaveAttribute('src', screenshotUrl);
  });

  it('should have proper accessibility attributes', () => {
    const screenshotUrl = 'https://blob.vercel-storage.com/screenshot-test-123.png';
    
    render(
      <ProgressiveLoader 
        isLoading={true} 
        screenshotUrl={screenshotUrl} 
      />
    );
    
    // Screenshot should have alt text
    const screenshot = screen.getByAltText('Page screenshot');
    expect(screenshot).toBeInTheDocument();
    
    // Progress information should be accessible
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
  });
});