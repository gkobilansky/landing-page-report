import { POST } from '../route';

// Mock the email service
jest.mock('@/lib/email-service', () => ({
  sendReportEmail: jest.fn()
}));

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe('/api/email', () => {
  const mockSendReportEmail = require('@/lib/email-service').sendReportEmail;
  const mockSupabaseFrom = require('@/lib/supabase').supabaseAdmin.from;
  const mockSupabaseSelect = jest.fn();
  const mockSupabaseEq = jest.fn();
  const mockSupabaseSingle = jest.fn();
  const mockSupabaseUpdate = jest.fn();
  const createRequest = (body: any) => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue(body),
      method: 'POST',
      headers: new Map([['Content-Type', 'application/json']]),
    };
    return mockRequest as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
    });
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
    });
    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
    });
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ error: null })
      })
    });
  });

  describe('Email collection for existing analysis', () => {
    it('should send email successfully for completed analysis', async () => {
      const mockAnalysis = {
        id: 'test-analysis-id',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        page_speed_analysis: { score: 90, grade: 'A' },
        font_analysis: { score: 80, fontCount: 2 },
        image_analysis: { score: 85, totalImages: 5 },
        cta_analysis: { score: 90, ctas: [{ text: 'Sign Up' }] },
        whitespace_analysis: { score: 75, grade: 'B' },
        social_proof_analysis: { score: 70, elements: [] },
        screenshot_url: 'https://example.com/screenshot.png',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnalysis,
        error: null,
      });

      mockSendReportEmail.mockResolvedValue({
        success: true,
        emailId: 'email-123'
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Report sent successfully');
      expect(mockSendReportEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          id: 'test-analysis-id',
          url: 'https://example.com',
          overallScore: 85
        }),
        expect.stringContaining('report?id=test-analysis-id')
      );
    });

    it('should return 400 for missing email', async () => {
      const request = createRequest({
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
      expect(mockSendReportEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for missing analysis ID', async () => {
      const request = createRequest({
        email: 'test@example.com'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Analysis ID is required');
      expect(mockSendReportEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const request = createRequest({
        email: 'invalid-email',
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
      expect(mockSendReportEmail).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent analysis', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { message: 'Analysis not found' },
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'non-existent-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Analysis not found');
      expect(mockSendReportEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for incomplete analysis', async () => {
      const mockIncompleteAnalysis = {
        id: 'incomplete-analysis-id',
        url: 'https://example.com',
        status: 'processing',
        overall_score: null,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockIncompleteAnalysis,
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'incomplete-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Analysis is not yet complete');
      expect(mockSendReportEmail).not.toHaveBeenCalled();
    });

    it('should handle email service errors', async () => {
      const mockAnalysis = {
        id: 'test-analysis-id',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnalysis,
        error: null,
      });

      mockSendReportEmail.mockResolvedValue({
        success: false,
        error: 'Email service unavailable'
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to send email: Email service unavailable');
    });

    it('should associate email with user record', async () => {
      const mockAnalysis = {
        id: 'test-analysis-id',
        user_id: 'user-123',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnalysis,
        error: null,
      });

      mockSendReportEmail.mockResolvedValue({
        success: true,
        emailId: 'email-123'
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should update user record with email if not already set
      expect(mockSupabaseUpdate).toHaveBeenCalled();
    });
  });

  describe('Email collection for anonymous reports', () => {
    it('should store email and send report for anonymous analysis', async () => {
      const mockAnonymousAnalysis = {
        id: 'anonymous-analysis-id',
        user_id: 'system-user-id',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnonymousAnalysis,
        error: null,
      });

      mockSendReportEmail.mockResolvedValue({
        success: true,
        emailId: 'email-123'
      });

      const request = createRequest({
        email: 'new-user@example.com',
        analysisId: 'anonymous-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendReportEmail).toHaveBeenCalled();
    });

    it('should validate email format for anonymous users', async () => {
      const request = createRequest({
        email: 'invalid-format',
        analysisId: 'anonymous-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });
  });

  describe('Report URL generation', () => {
    it('should generate correct report URLs based on environment', async () => {
      const mockAnalysis = {
        id: 'test-analysis-id',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnalysis,
        error: null,
      });

      mockSendReportEmail.mockResolvedValue({
        success: true,
        emailId: 'email-123'
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      await POST(request);

      expect(mockSendReportEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object),
        expect.stringMatching(/\/report\?id=test-analysis-id$/)
      );
    });

    it('should use production URL in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.VERCEL_URL;
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      process.env.VERCEL_URL = 'app.lansky.tech';

      const mockAnalysis = {
        id: 'test-analysis-id',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnalysis,
        error: null,
      });

      mockSendReportEmail.mockResolvedValue({
        success: true,
        emailId: 'email-123'
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      await POST(request);

      expect(mockSendReportEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object),
        expect.stringContaining('https://app.lansky.tech')
      );

      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
      process.env.VERCEL_URL = originalUrl;
    });
  });

  describe('Database operations', () => {
    it('should handle database connection errors gracefully', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error occurred');
    });

    it('should query analyses table with correct parameters', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-query-id'
      });

      await POST(request);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('analyses');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('*');
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-query-id');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle malformed request body', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']]),
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should handle unexpected email service responses', async () => {
      const mockAnalysis = {
        id: 'test-analysis-id',
        url: 'https://example.com',
        status: 'completed',
        overall_score: 85,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseSingle.mockResolvedValue({
        data: mockAnalysis,
        error: null,
      });

      // Mock unexpected response format
      mockSendReportEmail.mockResolvedValue({
        // Missing success field
        emailId: 'email-123'
      });

      const request = createRequest({
        email: 'test@example.com',
        analysisId: 'test-analysis-id'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to send email');
    });
  });
});