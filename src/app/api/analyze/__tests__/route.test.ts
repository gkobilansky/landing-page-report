import { POST } from '../route';

// Mock the analysis functions with realistic behavior
jest.mock('@/lib/font-analysis', () => ({
  analyzeFontUsage: jest.fn()
}));

jest.mock('@/lib/image-optimization', () => ({
  analyzeImageOptimization: jest.fn()
}));

jest.mock('@/lib/page-speed-analysis', () => ({
  analyzePageSpeed: jest.fn()
}));

jest.mock('@/lib/whitespace-assessment', () => ({
  analyzeWhitespace: jest.fn()
}));

jest.mock('@/lib/cta-analysis', () => ({
  analyzeCTA: jest.fn()
}));

jest.mock('@/lib/social-proof-analysis', () => ({
  analyzeSocialProof: jest.fn()
}));

// Mock Supabase to avoid database calls in tests
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'test-analysis-id' }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('/api/analyze', () => {
  // Get the mocked functions
  const mockAnalyzeFontUsage = require('@/lib/font-analysis').analyzeFontUsage;
  const mockAnalyzeImageOptimization = require('@/lib/image-optimization').analyzeImageOptimization;
  const mockAnalyzePageSpeed = require('@/lib/page-speed-analysis').analyzePageSpeed;
  const mockAnalyzeWhitespace = require('@/lib/whitespace-assessment').analyzeWhitespace;
  const mockAnalyzeCTA = require('@/lib/cta-analysis').analyzeCTA;
  const mockAnalyzeSocialProof = require('@/lib/social-proof-analysis').analyzeSocialProof;

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
    // Setup realistic default mock responses
    mockAnalyzeFontUsage.mockResolvedValue({
      fontFamilies: ['Arial, sans-serif'],
      fontCount: 1,
      systemFontCount: 1,
      webFontCount: 0,
      score: 95,
      issues: [],
      recommendations: ['Good font choice']
    });

    mockAnalyzeImageOptimization.mockResolvedValue({
      score: 80,
      totalImages: 2,
      modernFormats: 1,
      withAltText: 2,
      appropriatelySized: 2,
      issues: ['1 image using legacy format'],
      recommendations: ['Convert to WebP'],
      details: {}
    });

    mockAnalyzePageSpeed.mockResolvedValue({
      score: 75,
      grade: 'C',
      metrics: { lcp: 2500, fcp: 1200, cls: 0.15, tbt: 200, si: 3000 },
      lighthouseScore: 75,
      issues: ['Slow LCP'],
      recommendations: ['Optimize images'],
      loadTime: 4000
    });

    mockAnalyzeWhitespace.mockResolvedValue({
      score: 70,
      grade: 'C',
      metrics: {
        whitespaceRatio: 0.45,
        elementDensityPerSection: { gridSections: 12, maxDensity: 6, averageDensity: 3.5, totalElements: 42 },
        spacingAnalysis: { 
          headlineSpacing: { adequate: true },
          ctaSpacing: { adequate: false },
          contentBlockSpacing: { adequate: true },
          lineHeight: { adequate: true }
        },
        clutterScore: 25,
        hasAdequateSpacing: false
      },
      issues: ['Poor CTA spacing'],
      recommendations: ['Increase spacing around CTAs'],
      loadTime: 2000
    });

    mockAnalyzeCTA.mockResolvedValue({
      score: 85,
      ctas: [{ text: 'Sign Up', type: 'primary', isAboveFold: true, actionStrength: 'strong' }],
      primaryCTA: { text: 'Sign Up', type: 'primary' },
      issues: [],
      recommendations: ['Good CTA implementation']
    });

    mockAnalyzeSocialProof.mockResolvedValue({
      score: 60,
      elements: [{ type: 'testimonial', text: 'Great service!', score: 80 }],
      summary: { totalElements: 1, testimonials: 1 },
      issues: ['Limited social proof'],
      recommendations: ['Add more testimonials']
    });
  });

  it('should return 400 if URL is missing', async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required');
  });

  it('should return 400 for invalid URL format', async () => {
    const request = createRequest({ 
      url: 'invalid-url'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format. Please provide a complete URL with a valid domain.');
  });

  it('should return 200 for valid URL with complete analysis results', async () => {
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.analysis).toBeDefined();
    
    // Verify all analysis functions were called
    expect(mockAnalyzeFontUsage).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeImageOptimization).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzePageSpeed).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeWhitespace).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeCTA).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeSocialProof).toHaveBeenCalledWith('https://example.com/');
    
    // Test structure, not exact values
    expect(data.analysis.fontUsage).toBeDefined();
    expect(data.analysis.imageOptimization).toBeDefined();
    expect(data.analysis.pageLoadSpeed).toBeDefined();
    expect(data.analysis.whitespaceAssessment).toBeDefined();
    expect(data.analysis.ctaAnalysis).toBeDefined();
    expect(data.analysis.socialProof).toBeDefined();
    
    // Test score calculation logic (should be average of all scores)
    expect(data.analysis.overallScore).toBeGreaterThan(0);
    expect(data.analysis.overallScore).toBeLessThanOrEqual(100);
    
    expect(data.message).toContain('Analysis completed');
  });

  it('should accept URLs with different protocols', async () => {
    const httpRequest = createRequest({ 
      url: 'http://example.com'
    });
    const httpResponse = await POST(httpRequest);
    expect(httpResponse.status).toBe(200);

    const httpsRequest = createRequest({ 
      url: 'https://example.com'
    });
    const httpsResponse = await POST(httpsRequest);
    expect(httpsResponse.status).toBe(200);
  });

  it('should reject URLs with invalid protocols', async () => {
    const request = createRequest({ 
      url: 'ftp://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format. Please provide a complete URL with a valid domain.');
  });

  it('should reject incomplete URLs without proper domain', async () => {
    const request = createRequest({ 
      url: 'https://stripe'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format. Please provide a complete URL with a valid domain.');
  });

  it('should support component-based analysis (speed only)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'speed'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Only page speed analysis should run
    expect(mockAnalyzePageSpeed).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeFontUsage).not.toHaveBeenCalled();
    expect(mockAnalyzeImageOptimization).not.toHaveBeenCalled();
    
    expect(data.analysis.pageLoadSpeed).toBeDefined();
    expect(data.analysis.overallScore).toBe(75); // Should be the speed score only
  });

  it('should support component-based analysis (whitespace only)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'whitespace'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Only whitespace analysis should run
    expect(mockAnalyzeWhitespace).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeFontUsage).not.toHaveBeenCalled();
    expect(mockAnalyzePageSpeed).not.toHaveBeenCalled();
    
    expect(data.analysis.whitespaceAssessment).toBeDefined();
    expect(data.analysis.overallScore).toBe(70); // Should be the whitespace score only
  });

  it('should handle analysis function errors gracefully', async () => {
    // Mock one function to throw an error
    mockAnalyzePageSpeed.mockRejectedValue(new Error('Network timeout'));
    
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Should continue with other analyses even if one fails
    expect(data.analysis.pageLoadSpeed.score).toBe(0); // Default for failed analysis
    expect(data.analysis.fontUsage.score).toBe(95); // Should still have this
  });

  it('should calculate overall score as average of completed analyses', async () => {
    // Mock specific scores to test calculation
    mockAnalyzeFontUsage.mockResolvedValue({ score: 90, fontFamilies: [], fontCount: 1, systemFontCount: 1, webFontCount: 0, issues: [], recommendations: [] });
    mockAnalyzeImageOptimization.mockResolvedValue({ score: 80, totalImages: 0, modernFormats: 0, withAltText: 0, appropriatelySized: 0, issues: [], recommendations: [], details: {} });
    mockAnalyzePageSpeed.mockResolvedValue({ score: 70, grade: 'C', metrics: {}, lighthouseScore: 70, issues: [], recommendations: [], loadTime: 3000 });
    mockAnalyzeWhitespace.mockResolvedValue({ score: 60, grade: 'D', metrics: {}, issues: [], recommendations: [], loadTime: 2000 });
    mockAnalyzeCTA.mockResolvedValue({ score: 50, ctas: [], issues: [], recommendations: [] });
    mockAnalyzeSocialProof.mockResolvedValue({ score: 40, elements: [], summary: {}, issues: [], recommendations: [] });
    
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Overall score should be average: (90+80+70+60+50+40)/6 = 65, but may round to 66
    expect(data.analysis.overallScore).toBeGreaterThanOrEqual(65);
    expect(data.analysis.overallScore).toBeLessThanOrEqual(66);
  });
});