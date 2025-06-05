import { GET } from '../route';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe('/api/reports', () => {
  const mockSupabaseFrom = require('@/lib/supabase').supabaseAdmin.from;
  const mockSupabaseSelect = jest.fn();
  const mockSupabaseEq = jest.fn();
  const mockSupabaseNot = jest.fn();
  const mockSupabaseRange = jest.fn();
  const mockSupabaseOrder = jest.fn();
  const mockSupabaseGte = jest.fn();

  const createRequest = (searchParams: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/reports');
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    const mockRequest = {
      url: url.toString(),
      method: 'GET',
    };
    return mockRequest as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock chain
    const mockChain = {
      select: mockSupabaseSelect,
      eq: mockSupabaseEq,
      not: mockSupabaseNot,
      range: mockSupabaseRange,
      order: mockSupabaseOrder,
      gte: mockSupabaseGte,
    };

    mockSupabaseFrom.mockReturnValue(mockChain);
    mockSupabaseSelect.mockReturnValue(mockChain);
    mockSupabaseEq.mockReturnValue(mockChain);
    mockSupabaseNot.mockReturnValue(mockChain);
    mockSupabaseRange.mockReturnValue(mockChain);
    mockSupabaseOrder.mockReturnValue(mockChain);
    mockSupabaseGte.mockReturnValue(mockChain);
  });

  describe('GET /api/reports', () => {
    it('should return reports successfully with default parameters', async () => {
      const mockReports = [
        {
          id: 'report-1',
          url: 'https://example.com',
          url_title: 'Example Site',
          overall_score: 85,
          grade: 'A',
          screenshot_url: 'https://example.com/screenshot.png',
          created_at: '2024-01-01T00:00:00Z',
          status: 'completed',
          page_speed_analysis: { grade: 'A' }
        },
        {
          id: 'report-2',
          url: 'https://test.com',
          url_title: null,
          overall_score: 72,
          grade: 'B',
          screenshot_url: null,
          created_at: '2024-01-02T00:00:00Z',
          status: 'completed',
          page_speed_analysis: { grade: 'B' }
        }
      ];

      mockSupabaseOrder.mockResolvedValue({
        data: mockReports,
        error: null,
      });

      // Mock count query
      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports).toHaveLength(2);
      expect(data.reports[0]).toEqual({
        id: 'report-1',
        url: 'https://example.com',
        url_title: 'Example Site',
        overall_score: 85,
        grade: 'A',
        screenshot_url: 'https://example.com/screenshot.png',
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed'
      });
      expect(data.reports[1].url_title).toBe('test.com'); // Fallback domain extraction
      expect(data.total).toBe(2);
      expect(data.offset).toBe(0);
      expect(data.limit).toBe(50);
    });

    it('should handle pagination parameters', async () => {
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 100,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest({
        limit: '20',
        offset: '40'
      });

      await GET(request);

      expect(mockSupabaseRange).toHaveBeenCalledWith(40, 59); // offset to offset + limit - 1
    });

    it('should handle sorting parameters', async () => {
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest({
        sortBy: 'overall_score',
        sortOrder: 'asc'
      });

      await GET(request);

      expect(mockSupabaseOrder).toHaveBeenCalledWith('overall_score', { ascending: true });
    });

    it('should handle minimum score filter', async () => {
      mockSupabaseGte.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest({
        minScore: '80'
      });

      await GET(request);

      expect(mockSupabaseGte).toHaveBeenCalledWith('overall_score', 80);
    });

    it('should return empty results when no reports found', async () => {
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch reports from database');
    });

    it('should handle null analyses data', async () => {
      mockSupabaseOrder.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should handle count query errors gracefully', async () => {
      const mockReports = [
        {
          id: 'report-1',
          url: 'https://example.com',
          url_title: 'Example',
          overall_score: 85,
          grade: 'A',
          screenshot_url: null,
          created_at: '2024-01-01T00:00:00Z',
          status: 'completed',
          page_speed_analysis: null
        }
      ];

      mockSupabaseOrder.mockResolvedValue({
        data: mockReports,
        error: null,
      });

      // Mock count query failure
      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: null,
              error: { message: 'Count failed' },
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports).toHaveLength(1);
      expect(data.total).toBe(1); // Fallback to reports length
    });

    it('should extract domain from URL when title is missing', async () => {
      const mockReports = [
        {
          id: 'report-1',
          url: 'https://www.example.com/page',
          url_title: null,
          overall_score: 85,
          grade: null,
          screenshot_url: null,
          created_at: '2024-01-01T00:00:00Z',
          status: 'completed',
          page_speed_analysis: { grade: 'A' }
        }
      ];

      mockSupabaseOrder.mockResolvedValue({
        data: mockReports,
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              count: 1,
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports[0].url_title).toBe('example.com'); // www. removed
      expect(data.reports[0].grade).toBe('A'); // Fallback from page_speed_analysis
    });
  });
});