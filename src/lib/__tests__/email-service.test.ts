import { sendReportEmail, EmailTemplate } from '../email-service';

// Mock Resend
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend
    }
  }))
}));

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  describe('sendReportEmail', () => {
    const mockAnalysisData = {
      id: 'test-analysis-id',
      url: 'https://example.com',
      overallScore: 85,
      grade: 'A',
      pageSpeed: { score: 90, grade: 'A' },
      fonts: { score: 80, fontCount: 2 },
      images: { score: 85, totalImages: 5 },
      cta: { score: 90, ctas: [{ text: 'Sign Up' }] },
      whitespace: { score: 75, grade: 'B' },
      socialProof: { score: 70, elements: [] },
      screenshotUrl: 'https://example.com/screenshot.png',
      createdAt: '2024-01-01T00:00:00Z'
    };

    it('should send email successfully with valid data', async () => {
      mockSend.mockResolvedValue({ 
        data: { id: 'email-123' }, 
        error: null 
      });

      const result = await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-123');
      expect(mockSend).toHaveBeenCalledWith({
        from: 'reports@hi.lansky.tech',
        to: 'test@example.com',
        subject: 'Your Landing Page Analysis Report is Ready (Score: 85/100)',
        html: expect.stringContaining('https://example.com'),
        reply_to: 'gene@lansky.tech'
      });
    });

    it('should handle email sending errors gracefully', async () => {
      mockSend.mockResolvedValue({ 
        data: null, 
        error: { message: 'Email sending failed' } 
      });

      const result = await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email sending failed');
    });

    it('should handle Resend client errors', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      const result = await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should validate required parameters', async () => {
      const result = await sendReportEmail(
        '',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email address is required');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const result = await sendReportEmail(
        'invalid-email',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should validate report URL', async () => {
      const result = await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'invalid-url'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid report URL');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should include all analysis data in email template', async () => {
      mockSend.mockResolvedValue({ 
        data: { id: 'email-123' }, 
        error: null 
      });

      await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('https://example.com');
      expect(emailCall.html).toContain('85/100');
      expect(emailCall.html).toContain('Grade A');
      expect(emailCall.html).toContain('https://landingpage.report/report?id=test-analysis-id');
    });

    it('should handle missing environment variable', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should customize subject line based on score', async () => {
      mockSend.mockResolvedValue({ 
        data: { id: 'email-123' }, 
        error: null 
      });

      // Test high score
      await sendReportEmail(
        'test@example.com',
        { ...mockAnalysisData, overallScore: 95 },
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Landing Page Analysis Report is Ready (Score: 95/100)'
        })
      );

      // Test low score
      mockSend.mockClear();
      await sendReportEmail(
        'test@example.com',
        { ...mockAnalysisData, overallScore: 45 },
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Landing Page Analysis Report is Ready (Score: 45/100)'
        })
      );
    });

    it('should include screenshot in email when available', async () => {
      mockSend.mockResolvedValue({ 
        data: { id: 'email-123' }, 
        error: null 
      });

      await sendReportEmail(
        'test@example.com',
        mockAnalysisData,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain(mockAnalysisData.screenshotUrl);
    });

    it('should handle missing screenshot gracefully', async () => {
      mockSend.mockResolvedValue({ 
        data: { id: 'email-123' }, 
        error: null 
      });

      const dataWithoutScreenshot = { ...mockAnalysisData, screenshotUrl: undefined };

      const result = await sendReportEmail(
        'test@example.com',
        dataWithoutScreenshot,
        'https://landingpage.report/report?id=test-analysis-id'
      );

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('EmailTemplate', () => {
    const mockData = {
      id: 'test-id',
      url: 'https://example.com',
      overallScore: 75,
      grade: 'B',
      screenshotUrl: 'https://example.com/screenshot.png',
      createdAt: '2024-01-01T00:00:00Z'
    };

    it('should generate HTML template with all required elements', () => {
      const html = EmailTemplate.generateReportEmail(
        mockData,
        'https://landingpage.report/report?id=123'
      );

      expect(html).toContain('Landing Page Analysis Report');
      expect(html).toContain('https://example.com');
      expect(html).toContain('75/100');
      expect(html).toContain('Grade B');
      expect(html).toContain('https://landingpage.report/report?id=123');
      expect(html).toContain('View Full Report');
    });

    it('should handle different score ranges in template', () => {
      const highScoreData = { ...mockData, overallScore: 95, grade: 'A' };
      const lowScoreData = { ...mockData, overallScore: 35, grade: 'F' };

      const highScoreHtml = EmailTemplate.generateReportEmail(
        highScoreData,
        'https://landingpage.report/report?id=123'
      );
      const lowScoreHtml = EmailTemplate.generateReportEmail(
        lowScoreData,
        'https://landingpage.report/report?id=123'
      );

      expect(highScoreHtml).toContain('95/100');
      expect(highScoreHtml).toContain('Grade A');
      expect(lowScoreHtml).toContain('35/100');
      expect(lowScoreHtml).toContain('Grade F');
    });

    it('should include screenshot when provided', () => {
      const html = EmailTemplate.generateReportEmail(
        mockData,
        'https://landingpage.report/report?id=123'
      );

      expect(html).toContain('<img');
      expect(html).toContain(mockData.screenshotUrl);
    });

    it('should exclude screenshot section when not provided', () => {
      const dataWithoutScreenshot = { ...mockData, screenshotUrl: undefined };

      const html = EmailTemplate.generateReportEmail(
        dataWithoutScreenshot,
        'https://landingpage.report/report?id=123'
      );

      expect(html).not.toContain('<img');
      expect(html).toContain('View Full Report'); // But should still have report link
    });

    it('should escape HTML in user-provided content', () => {
      const dataWithHtml = {
        ...mockData,
        url: 'https://example.com/<script>alert("xss")</script>'
      };

      const html = EmailTemplate.generateReportEmail(
        dataWithHtml,
        'https://landingpage.report/report?id=123'
      );

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include branding and styling', () => {
      const html = EmailTemplate.generateReportEmail(
        mockData,
        'https://landingpage.report/report?id=123'
      );

      expect(html).toContain('lansky.tech');
      expect(html).toContain('style=');
      expect(html).toContain('background-color');
      expect(html).toContain('#FFCC00'); // Brand yellow
    });
  });
});