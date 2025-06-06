import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsPage from '../page';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<ReportsPage />);
    
    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument(); // Loading spinner
  });

  it('should render empty state when no reports exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reports: [],
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false
      })
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('No Reports Yet')).toBeInTheDocument();
    });

    expect(screen.getByText('No completed analyses found. Start by analyzing a landing page to see reports here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /analyze a landing page/i })).toHaveAttribute('href', '/');
  });

  it('should render reports when data is available', async () => {
    const mockReports = [
      {
        id: 'report-1',
        url: 'https://example.com',
        url_title: 'Example Landing Page',
        overall_score: 85,
        grade: 'A',
        screenshot_url: 'https://example.com/screenshot.png',
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed'
      },
      {
        id: 'report-2',
        url: 'https://test.com',
        url_title: 'Test Page',
        overall_score: 72,
        grade: 'B',
        screenshot_url: null,
        created_at: '2024-01-02T00:00:00Z',
        status: 'completed'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reports: mockReports,
        total: 2,
        offset: 0,
        limit: 50,
        hasMore: false
      })
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Landing Page Analysis Reports')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('2')).toBeInTheDocument(); // Total reports
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
    expect(screen.getByText('Excellent Scores (90+)')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();

    // Check report cards
    expect(screen.getByText('Example Landing Page')).toBeInTheDocument();
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('https://test.com')).toBeInTheDocument();
    expect(screen.getByText(/85.*\/100/)).toBeInTheDocument();
    expect(screen.getByText(/72.*\/100/)).toBeInTheDocument();

    // Check links to individual reports
    expect(screen.getByRole('link', { name: /example landing page/i })).toHaveAttribute('href', '/report?id=report-1');
    expect(screen.getByRole('link', { name: /test page/i })).toHaveAttribute('href', '/report?id=report-2');
  });

  it('should render error state when API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Reports')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Reports')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
  });

  it('should display correct score colors and badges', async () => {
    const mockReports = [
      {
        id: 'report-1',
        url: 'https://excellent.com',
        url_title: 'Excellent Page',
        overall_score: 95,
        grade: 'A',
        screenshot_url: null,
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed'
      },
      {
        id: 'report-2',
        url: 'https://poor.com',
        url_title: 'Poor Page',
        overall_score: 35,
        grade: 'F',
        screenshot_url: null,
        created_at: '2024-01-02T00:00:00Z',
        status: 'completed'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reports: mockReports,
        total: 2,
        offset: 0,
        limit: 50,
        hasMore: false
      })
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(/95.*\/100.*\(A\)/)).toBeInTheDocument();
      expect(screen.getByText(/35.*\/100.*\(F\)/)).toBeInTheDocument();
    });
  });

  it('should calculate and display correct statistics', async () => {
    const mockReports = [
      { id: '1', url: 'https://a.com', url_title: 'A', overall_score: 95, grade: 'A', screenshot_url: null, created_at: '2024-01-01T00:00:00Z', status: 'completed' },
      { id: '2', url: 'https://b.com', url_title: 'B', overall_score: 85, grade: 'B', screenshot_url: null, created_at: '2024-01-02T00:00:00Z', status: 'completed' },
      { id: '3', url: 'https://c.com', url_title: 'C', overall_score: 75, grade: 'C', screenshot_url: null, created_at: '2024-01-03T00:00:00Z', status: 'completed' }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reports: mockReports,
        total: 3,
        offset: 0,
        limit: 50,
        hasMore: false
      })
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total reports
      expect(screen.getByText('1')).toBeInTheDocument(); // Excellent scores (90+)
      expect(screen.getByText('85')).toBeInTheDocument(); // Average score (95+85+75)/3 = 85
    });
  });

  it('should make API call to correct endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reports: [],
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false
      })
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reports');
    });
  });

  it('should show placeholder when screenshot is missing', async () => {
    const mockReports = [
      {
        id: 'report-1',
        url: 'https://example.com',
        url_title: 'Example Page',
        overall_score: 85,
        grade: 'A',
        screenshot_url: null, // No screenshot
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reports: mockReports,
        total: 1,
        offset: 0,
        limit: 50,
        hasMore: false
      })
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Landing Page')).toBeInTheDocument();
      expect(screen.getByText('No screenshot available')).toBeInTheDocument();
    });
  });
});