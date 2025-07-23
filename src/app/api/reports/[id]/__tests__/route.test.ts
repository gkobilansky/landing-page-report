import { GET } from '../route';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe('/api/reports/[id]', () => {
  const mockSupabaseFrom = require('@/lib/supabase').supabaseAdmin.from;
  const mockSupabaseSelect = jest.fn();
  const mockSupabaseEq = jest.fn();
  const mockSupabaseSingle = jest.fn();

  const createRequest = () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/reports/test-id',
      method: 'GET',
    };
    return mockRequest as any;
  };

  const createMockParams = (id: string) => {
    return Promise.resolve({ id });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock chain
    const mockChain = {
      select: mockSupabaseSelect,
      eq: mockSupabaseEq,
      single: mockSupabaseSingle,
    };

    mockSupabaseFrom.mockReturnValue(mockChain);
    mockSupabaseSelect.mockReturnValue(mockChain);
    mockSupabaseEq.mockReturnValue(mockChain);
    mockSupabaseSingle.mockReturnValue(mockChain);
  });

  describe('GET /api/reports/[id]', () => {
    it('should return individual report successfully with schema data', async () => {
      const mockReport = {
        id: 'test-analysis-id',
        url: 'https://stripe.com/',
        url_title: 'Stripe | Financial Infrastructure to Grow Your Revenue',
        url_description: 'Stripe is a suite of APIs powering online payment processing and commerce solutions for internet businesses of all sizes.',
        schema_data: {
          name: 'Stripe',
          description: 'Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes.',
          organization: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': 'https://stripe.com/#organization',
            'url': 'https://stripe.com/',
            'name': 'Stripe',
            'legalName': 'Stripe, Inc.',
            'description': 'Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes.'
          }
        },
        overall_score: 85,
        grade: 'A',
        screenshot_url: 'https://example.com/screenshot.png',
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed',
        page_speed_analysis: { score: 90, grade: 'A' },
        font_analysis: { score: 85 },
        image_analysis: { score: 80 },
        cta_analysis: { score: 88 },
        whitespace_analysis: { score: 75 },
        social_proof_analysis: { score: 70 }
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      const request = createRequest();
      const response = await GET(request, { params: createMockParams('test-analysis-id') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockReport);
      
      // Verify supabase was called correctly
      expect(mockSupabaseFrom).toHaveBeenCalledWith('analyses');
      expect(mockSupabaseSelect).toHaveBeenCalledWith(expect.stringContaining('schema_data'));
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-analysis-id');
      expect(mockSupabaseEq).toHaveBeenCalledWith('status', 'completed');
    });

    it('should return 400 when analysis ID is missing', async () => {
      const request = createRequest();
      const response = await GET(request, { params: createMockParams('') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Analysis ID is required');
    });

    it('should return 404 when analysis is not found', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' },
      });

      const request = createRequest();
      const response = await GET(request, { params: createMockParams('non-existent-id') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Analysis not found');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = createRequest();
      const response = await GET(request, { params: createMockParams('test-id') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Analysis not found');
    });

    it('should return report without schema data when schema_data is null', async () => {
      const mockReport = {
        id: 'test-analysis-id',
        url: 'https://example.com/',
        url_title: 'Example Site',
        url_description: 'An example website',
        schema_data: null, // No schema data available
        overall_score: 75,
        grade: 'B',
        screenshot_url: null,
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed',
        page_speed_analysis: { score: 75, grade: 'B' },
        font_analysis: { score: 80 },
        image_analysis: { score: 70 },
        cta_analysis: { score: 75 },
        whitespace_analysis: { score: 70 },
        social_proof_analysis: { score: 65 }
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      const request = createRequest();
      const response = await GET(request, { params: createMockParams('test-analysis-id') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.schema_data).toBeNull();
      expect(data.url_title).toBe('Example Site');
      expect(data.url_description).toBe('An example website');
    });

    it('should include all required fields in response', async () => {
      const mockReport = {
        id: 'complete-test-id',
        url: 'https://complete-test.com/',
        url_title: 'Complete Test Site',
        url_description: 'A complete test website with all fields',
        schema_data: {
          name: 'Test Organization',
          description: 'A test organization',
          organization: {
            '@type': 'Organization',
            'name': 'Test Organization'
          }
        },
        overall_score: 92,
        grade: 'A',
        screenshot_url: 'https://example.com/complete-screenshot.png',
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed',
        page_speed_analysis: { score: 95 },
        font_analysis: { score: 90 },
        image_analysis: { score: 88 },
        cta_analysis: { score: 92 },
        whitespace_analysis: { score: 90 },
        social_proof_analysis: { score: 85 }
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      const request = createRequest();
      const response = await GET(request, { params: createMockParams('complete-test-id') });
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify all expected fields are present
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('url_title');
      expect(data).toHaveProperty('url_description');
      expect(data).toHaveProperty('schema_data');
      expect(data).toHaveProperty('overall_score');
      expect(data).toHaveProperty('grade');
      expect(data).toHaveProperty('screenshot_url');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('page_speed_analysis');
      expect(data).toHaveProperty('font_analysis');
      expect(data).toHaveProperty('image_analysis');
      expect(data).toHaveProperty('cta_analysis');
      expect(data).toHaveProperty('whitespace_analysis');
      expect(data).toHaveProperty('social_proof_analysis');
    });

    it('should handle internal server errors', async () => {
      mockSupabaseFrom.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createRequest();
      const response = await GET(request, { params: createMockParams('test-id') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});