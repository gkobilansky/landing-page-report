import { render, screen, waitFor } from '@testing-library/react';
import AnalysisPage from '../../analysis/page';

// Mock Next.js router
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock the supabase client
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mockSupabaseFrom,
  },
}));

// Mock the AnalysisResults component
jest.mock('@/components/AnalysisResults', () => {
  return function MockAnalysisResults({ analysis, analysisId }: any) {
    return (
      <div data-testid="analysis-results">
        <div>Analysis ID: {analysisId}</div>
        <div>Overall Score: {analysis?.overallScore || 0}</div>
        <div>URL: {analysis?.url}</div>
      </div>
    );
  };
});

describe('Report Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    
    // Setup default mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
    });
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
    });
    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
    });
  });

  it('should display loading state when no analysis ID is provided', async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    render(<AnalysisPage />);
    
    expect(screen.getByText(/loading report/i)).toBeInTheDocument();
  });

  it('should display error when analysis ID is not found', async () => {
    mockSearchParams.set('id', 'non-existent-id');
    
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: { message: 'Analysis not found' },
    });

    render(<AnalysisPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/report not found/i)).toBeInTheDocument();
    });
  });

  it('should display analysis results when valid analysis ID is provided', async () => {
    const mockAnalysis = {
      id: 'test-analysis-id',
      url: 'https://example.com',
      status: 'completed',
      overall_score: 85,
      page_speed_analysis: {
        score: 90,
        grade: 'A',
        metrics: { lcp: 1200, fcp: 800, cls: 0.05 },
        recommendations: ['Great performance!']
      },
      font_analysis: {
        score: 80,
        fontFamilies: ['Arial, sans-serif'],
        fontCount: 1,
        recommendations: ['Good font choice']
      },
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSearchParams.set('id', 'test-analysis-id');
    
    mockSupabaseSingle.mockResolvedValue({
      data: mockAnalysis,
      error: null,
    });

    render(<AnalysisPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('analysis-results')).toBeInTheDocument();
      expect(screen.getByText('Analysis ID: test-analysis-id')).toBeInTheDocument();
      expect(screen.getByText('Overall Score: 85')).toBeInTheDocument();
      expect(screen.getByText('URL: https://example.com')).toBeInTheDocument();
    });
  });

  it('should handle database errors gracefully', async () => {
    mockSearchParams.set('id', 'test-analysis-id');
    
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database connection error' },
    });

    render(<AnalysisPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading report/i)).toBeInTheDocument();
    });
  });

  it('should display incomplete analysis message for processing status', async () => {
    const mockIncompleteAnalysis = {
      id: 'processing-analysis-id',
      url: 'https://example.com',
      status: 'processing',
      overall_score: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSearchParams.set('id', 'processing-analysis-id');
    
    mockSupabaseSingle.mockResolvedValue({
      data: mockIncompleteAnalysis,
      error: null,
    });

    render(<AnalysisPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/analysis is still processing/i)).toBeInTheDocument();
    });
  });

  it('should call correct database query with analysis ID', async () => {
    mockSearchParams.set('id', 'test-query-id');
    
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    render(<AnalysisPage />);
    
    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('analyses');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('*');
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-query-id');
      expect(mockSupabaseSingle).toHaveBeenCalled();
    });
  });

  it('should format analysis data correctly for AnalysisResults component', async () => {
    const mockRawAnalysis = {
      id: 'test-format-id',
      url: 'https://example.com',
      status: 'completed',
      overall_score: 75,
      page_speed_analysis: { score: 80, grade: 'B' },
      font_analysis: { score: 70, fontCount: 2 },
      image_analysis: { score: 85, totalImages: 5 },
      cta_analysis: { score: 90, ctas: [{ text: 'Sign Up' }] },
      whitespace_analysis: { score: 65, grade: 'C' },
      social_proof_analysis: { score: 55, elements: [] },
      screenshot_url: 'https://example.com/screenshot.png',
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSearchParams.set('id', 'test-format-id');
    
    mockSupabaseSingle.mockResolvedValue({
      data: mockRawAnalysis,
      error: null,
    });

    render(<AnalysisPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('analysis-results')).toBeInTheDocument();
      expect(screen.getByText('Overall Score: 75')).toBeInTheDocument();
    });
  });
});