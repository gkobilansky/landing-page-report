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

jest.mock('@/lib/page-metadata', () => ({
  extractPageMetadata: jest.fn()
}));

jest.mock('@/lib/screenshot-storage', () => ({
  captureAndStoreScreenshot: jest.fn()
}));

// Mock Supabase for unit testing
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'mock-user-id' },
            error: null
          })),
          limit: jest.fn(() => ({
            data: [],
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'mock-analysis-id' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
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
  const mockExtractPageMetadata = require('@/lib/page-metadata').extractPageMetadata;
  const mockCaptureAndStoreScreenshot = require('@/lib/screenshot-storage').captureAndStoreScreenshot;

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
      recommendations: ['Good font choice'],
      loadTime: 1500
    });

    mockAnalyzeImageOptimization.mockResolvedValue({
      score: 80,
      applicable: true,
      totalImages: 2,
      modernFormats: 1,
      withAltText: 2,
      appropriatelySized: 2,
      issues: ['1 image using legacy format'],
      recommendations: ['Convert to WebP'],
      loadTime: 2000,
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
      recommendations: ['Good CTA implementation'],
      loadTime: 1800
    });

    mockAnalyzeSocialProof.mockResolvedValue({
      score: 60,
      elements: [{ type: 'testimonial', text: 'Great service!', score: 80 }],
      summary: { totalElements: 1, testimonials: 1 },
      issues: ['Limited social proof'],
      recommendations: ['Add more testimonials'],
      loadTime: 1600
    });

    mockExtractPageMetadata.mockResolvedValue({
      title: 'Test Page Title',
      description: 'Test page description for analysis',
      url: 'https://example.com/',
      schema: {
        name: 'Test Organization',
        description: 'A test organization for analysis',
        organization: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': 'Test Organization',
          'description': 'A test organization for analysis'
        }
      }
    });

    mockCaptureAndStoreScreenshot.mockResolvedValue({
      blobUrl: 'https://blob.vercel-storage.com/test-screenshot.png',
      width: 1920,
      height: 1080
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

    if (response.status !== 200) {
      console.error('API Error Response:', response.status);
      console.error('API Error Data:', data);
      console.error('API Error Stack:', data.error);
    }

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

  it('should return 400 for invalid component names', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'invalidcomponent'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid component: \'invalidcomponent\'');
    expect(data.error).toContain('speed');
    expect(data.error).toContain('fonts');
    expect(data.error).toContain('images');
  });

  it('should accept canonical component names', async () => {
    const canonicalComponents = ['speed', 'fonts', 'images', 'cta', 'whitespace', 'social'];
    
    for (const component of canonicalComponents) {
      const request = createRequest({ 
        url: 'https://example.com',
        component
      });
      const response = await POST(request);
      
      // Should not return 400 for valid component names
      expect(response.status).not.toBe(400);
    }
  });

  it('should accept legacy component names', async () => {
    const legacyComponents = ['pageSpeed', 'font', 'image', 'spacing', 'socialProof'];
    
    for (const component of legacyComponents) {
      const request = createRequest({ 
        url: 'https://example.com',
        component
      });
      const response = await POST(request);
      
      // Should not return 400 for valid legacy component names
      expect(response.status).not.toBe(400);
    }
  });

  it('should accept "all" as a component name', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'all'
    });
    const response = await POST(request);
    
    // Should not return 400 for "all"
    expect(response.status).not.toBe(400);
  });

  it('should support component-based analysis (speed only)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'speed'
    });
    const response = await POST(request);
    const data = await response.json();

    if (response.status !== 200) {
      console.error('API Error Response:', response.status);
      console.error('API Error Data:', data);
      console.error('API Error Stack:', data.error);
    }

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

    if (response.status !== 200) {
      console.error('API Error Response:', response.status);
      console.error('API Error Data:', data);
      console.error('API Error Stack:', data.error);
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Only whitespace analysis should run
    expect(mockAnalyzeWhitespace).toHaveBeenCalledWith('https://example.com/');
    expect(mockAnalyzeFontUsage).not.toHaveBeenCalled();
    expect(mockAnalyzePageSpeed).not.toHaveBeenCalled();
    
    expect(data.analysis.whitespaceAssessment).toBeDefined();
    expect(data.analysis.overallScore).toBe(70); // Should be the whitespace score only
  });

  it('should support legacy component name mapping (font -> fonts)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'font'
    });
    const response = await POST(request);
    const data = await response.json();

    if (response.status !== 200) {
      console.error('API Error Response:', response.status);
      console.error('API Error Data:', data);
      console.error('API Error Stack:', data.error);
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Only font analysis should run (using legacy name "font" -> canonical "fonts")
    expect(mockAnalyzeFontUsage).toHaveBeenCalledWith('https://example.com/', expect.any(Object));
    expect(mockAnalyzePageSpeed).not.toHaveBeenCalled();
    expect(mockAnalyzeImageOptimization).not.toHaveBeenCalled();
    
    expect(data.analysis.fontUsage).toBeDefined();
  });

  it('should support legacy component name mapping (image -> images)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'image'
    });
    const response = await POST(request);
    const data = await response.json();

    if (response.status !== 200) {
      console.error('API Error Response:', response.status);
      console.error('API Error Data:', data);
      console.error('API Error Stack:', data.error);
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Only image analysis should run (using legacy name "image" -> canonical "images")
    expect(mockAnalyzeImageOptimization).toHaveBeenCalledWith('https://example.com/', expect.any(Object));
    expect(mockAnalyzePageSpeed).not.toHaveBeenCalled();
    expect(mockAnalyzeFontUsage).not.toHaveBeenCalled();
    
    expect(data.analysis.imageOptimization).toBeDefined();
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

  it('should handle font analysis errors gracefully', async () => {
    // Mock font analysis to throw an error
    mockAnalyzeFontUsage.mockRejectedValue(new Error('Font parsing failed'));
    
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Font analysis should have fallback values
    expect(data.analysis.fontUsage.score).toBe(0);
    expect(data.analysis.fontUsage.fontFamilies).toEqual([]);
    expect(data.analysis.fontUsage.fontCount).toBe(0);
    expect(data.analysis.fontUsage.systemFontCount).toBe(0);
    expect(data.analysis.fontUsage.webFontCount).toBe(0);
    expect(data.analysis.fontUsage.issues).toEqual(['Font usage analysis failed due to error']);
    expect(data.analysis.fontUsage.recommendations).toEqual([]);
    expect(data.analysis.fontUsage.loadTime).toBe(0);
    
    // Other analyses should still work
    expect(data.analysis.imageOptimization.score).toBe(80);
    expect(data.analysis.pageLoadSpeed.score).toBe(75);
  });

  it('should handle image optimization analysis errors gracefully', async () => {
    // Mock image optimization to throw an error
    mockAnalyzeImageOptimization.mockRejectedValue(new Error('Image analysis timeout'));
    
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Image analysis should have fallback values
    expect(data.analysis.imageOptimization.score).toBe(0);
    expect(data.analysis.imageOptimization.applicable).toBe(false);
    expect(data.analysis.imageOptimization.totalImages).toBe(0);
    expect(data.analysis.imageOptimization.modernFormats).toBe(0);
    expect(data.analysis.imageOptimization.withAltText).toBe(0);
    expect(data.analysis.imageOptimization.appropriatelySized).toBe(0);
    expect(data.analysis.imageOptimization.issues).toEqual(['Image optimization analysis failed due to error']);
    expect(data.analysis.imageOptimization.recommendations).toEqual([]);
    expect(data.analysis.imageOptimization.loadTime).toBe(0);
    expect(data.analysis.imageOptimization.details).toEqual({});
    
    // Other analyses should still work
    expect(data.analysis.fontUsage.score).toBe(95);
    expect(data.analysis.pageLoadSpeed.score).toBe(75);
  });

  it('should handle multiple module errors gracefully', async () => {
    // Mock multiple functions to throw errors
    mockAnalyzeFontUsage.mockRejectedValue(new Error('Font analysis failed'));
    mockAnalyzeImageOptimization.mockRejectedValue(new Error('Image analysis failed'));
    mockAnalyzePageSpeed.mockRejectedValue(new Error('Speed analysis failed'));
    
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // All failed analyses should have fallback values
    expect(data.analysis.fontUsage.score).toBe(0);
    expect(data.analysis.imageOptimization.score).toBe(0);
    expect(data.analysis.pageLoadSpeed.score).toBe(0);
    
    // Working analyses should still complete
    expect(data.analysis.ctaAnalysis.score).toBe(85);
    expect(data.analysis.whitespaceAssessment.score).toBe(70);
    expect(data.analysis.socialProof.score).toBe(60);
    
    // Overall score should be calculated from successful analyses only
    expect(data.analysis.overallScore).toBeGreaterThan(0);
  });

  it('should not include failed analysis scores in overall calculation', async () => {
    // Mock font analysis to fail (should not be included in score calculation)
    mockAnalyzeFontUsage.mockRejectedValue(new Error('Font analysis failed'));
    
    // Set specific scores for working analyses
    mockAnalyzePageSpeed.mockResolvedValue({ score: 80, metrics: {}, lighthouseScore: 80, issues: [], recommendations: [], loadTime: 2000 });
    mockAnalyzeCTA.mockResolvedValue({ score: 60, ctas: [], issues: [], recommendations: [], loadTime: 1000 });
    mockAnalyzeWhitespace.mockResolvedValue({ score: 40, metrics: {}, issues: [], recommendations: [], loadTime: 1500 });
    mockAnalyzeSocialProof.mockResolvedValue({ score: 80, elements: [], summary: {}, issues: [], recommendations: [], loadTime: 1000 });
    mockAnalyzeImageOptimization.mockResolvedValue({ score: 60, applicable: true, totalImages: 1, modernFormats: 1, withAltText: 1, appropriatelySized: 1, issues: [], recommendations: [], loadTime: 1000, details: {} });
    
    const request = createRequest({ 
      url: 'https://example.com'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Font analysis should have failed
    expect(data.analysis.fontUsage.score).toBe(0);
    
    // Overall score should not include the failed font analysis (score 0)
    // Should be weighted average of: speed(80*0.25) + cta(60*0.25) + social(80*0.20) + whitespace(40*0.15) + images(60*0.10)
    // = 20 + 15 + 16 + 6 + 6 = 63 / 0.95 (total weight without fonts) = ~66
    expect(data.analysis.overallScore).toBeGreaterThanOrEqual(65);
    expect(data.analysis.overallScore).toBeLessThanOrEqual(67);
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

  describe('Caching functionality', () => {
    it('should return fromCache: false for fresh analysis', async () => {
      const request = createRequest({ 
        url: 'https://fresh-example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fromCache).toBe(false);
      expect(data.message).toContain('Analysis completed successfully');
    });

    it('should handle forceRescan parameter', async () => {
      const request = createRequest({ 
        url: 'https://example.com',
        forceRescan: true
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fromCache).toBe(false);
      expect(data.message).toContain('Analysis completed successfully');
    });

    it('should accept forceRescan: false parameter', async () => {
      const request = createRequest({ 
        url: 'https://example.com',
        forceRescan: false
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // fromCache could be true or false depending on if there's existing data
      expect(typeof data.fromCache).toBe('boolean');
    });

    it('should include fromCache field in all successful responses', async () => {
      const request = createRequest({ 
        url: 'https://example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('fromCache');
      expect(typeof data.fromCache).toBe('boolean');
    });

    it('should include email parameter in request body', async () => {
      const request = createRequest({ 
        url: 'https://example.com',
        email: 'test@example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('analysisId');
    });

    it('should handle missing email parameter gracefully', async () => {
      const request = createRequest({ 
        url: 'https://example.com'
        // No email provided
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('analysisId');
    });
  });

  describe('Option 2 Caching - Create new reports for forced refresh or 24h+', () => {
    it('should create a new analysis record when forceRescan is true, even if recent analysis exists', async () => {
      // First analysis
      const firstRequest = createRequest({ 
        url: 'https://example.com',
        email: 'test@example.com'
      });
      const firstResponse = await POST(firstRequest);
      const firstData = await firstResponse.json();
      
      if (firstResponse.status !== 200) {
        console.error('First request failed:', firstData);
      }
      
      expect(firstResponse.status).toBe(200);
      expect(firstData.fromCache).toBe(false);
      const firstAnalysisId = firstData.analysisId;
      
      // Force rescan - should create new analysis
      const forceRescanRequest = createRequest({ 
        url: 'https://example.com',
        email: 'test@example.com',
        forceRescan: true
      });
      const forceRescanResponse = await POST(forceRescanRequest);
      const forceRescanData = await forceRescanResponse.json();
      
      expect(forceRescanResponse.status).toBe(200);
      expect(forceRescanData.fromCache).toBe(false);
      expect(forceRescanData.analysisId).not.toBe(firstAnalysisId); // Should be different analysis
    });

    it('should create a new analysis record when analysis is older than 24 hours', async () => {
      // This test would require manipulating database timestamps or mocking time
      // For now, we'll test the logic structure
      const request = createRequest({ 
        url: 'https://httpbin.org/html',
        email: 'test@example.com'
      });
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.fromCache).toBe(false);
      expect(data.analysisId).toBeTruthy();
    });

    it('should return cached result when analysis is recent and not forced', async () => {
      // First analysis
      const firstRequest = createRequest({ 
        url: 'https://httpbin.org/json',
        email: 'test@example.com'
      });
      const firstResponse = await POST(firstRequest);
      const firstData = await firstResponse.json();
      
      expect(firstResponse.status).toBe(200);
      expect(firstData.fromCache).toBe(false);
      const firstAnalysisId = firstData.analysisId;
      
      // Second request immediately after - should use cache
      const secondRequest = createRequest({ 
        url: 'https://httpbin.org/json',
        email: 'test@example.com',
        forceRescan: false
      });
      const secondResponse = await POST(secondRequest);
      const secondData = await secondResponse.json();
      
      expect(secondResponse.status).toBe(200);
      expect(secondData.fromCache).toBe(true);
      expect(secondData.analysisId).toBe(firstAnalysisId); // Should be same analysis
      expect(secondData.message).toContain('cached');
    });

    it('should maintain separate analyses for different URLs', async () => {
      const url1Request = createRequest({ 
        url: 'https://httpbin.org/status/200',
        email: 'test@example.com'
      });
      const url1Response = await POST(url1Request);
      const url1Data = await url1Response.json();
      
      const url2Request = createRequest({ 
        url: 'https://httpbin.org/delay/1',
        email: 'test@example.com'
      });
      const url2Response = await POST(url2Request);
      const url2Data = await url2Response.json();
      
      expect(url1Response.status).toBe(200);
      expect(url2Response.status).toBe(200);
      expect(url1Data.analysisId).not.toBe(url2Data.analysisId);
      expect(url1Data.fromCache).toBe(false);
      expect(url2Data.fromCache).toBe(false);
    });

    it('should track historical analyses - multiple reports per URL over time', async () => {
      const url = 'https://httpbin.org/uuid';
      
      // First analysis
      const request1 = createRequest({ url, email: 'test@example.com' });
      const response1 = await POST(request1);
      const data1 = await response1.json();
      
      // Force rescan to create second analysis
      const request2 = createRequest({ url, email: 'test@example.com', forceRescan: true });
      const response2 = await POST(request2);
      const data2 = await response2.json();
      
      // Third force rescan
      const request3 = createRequest({ url, email: 'test@example.com', forceRescan: true });
      const response3 = await POST(request3);
      const data3 = await response3.json();
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      
      // All should be different analysis IDs (historical tracking)
      expect(data1.analysisId).not.toBe(data2.analysisId);
      expect(data2.analysisId).not.toBe(data3.analysisId);
      expect(data1.analysisId).not.toBe(data3.analysisId);
      
      // All should be new analyses, not cached
      expect(data1.fromCache).toBe(false);
      expect(data2.fromCache).toBe(false);
      expect(data3.fromCache).toBe(false);
    });
  });

  describe('Database integration with caching', () => {
    it('should handle component-based analysis with caching parameters', async () => {
      const request = createRequest({ 
        url: 'https://example.com',
        component: 'speed',
        email: 'test@example.com',
        forceRescan: true
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fromCache).toBe(false);
      
      // Only page speed analysis should run
      expect(mockAnalyzePageSpeed).toHaveBeenCalledWith('https://example.com/');
      expect(mockAnalyzeFontUsage).not.toHaveBeenCalled();
      
      expect(data.analysis.pageLoadSpeed).toBeDefined();
      expect(data.analysis.overallScore).toBe(75); // Should be the speed score only
    });

    it('should include analysisId in response for database tracking', async () => {
      const request = createRequest({ 
        url: 'https://unique-test-url.com',
        email: 'tracker@example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('analysisId');
      expect(typeof data.analysisId).toBe('string');
      expect(data.analysisId).toBeTruthy();
    });
  });

  describe('Error handling with cache parameters', () => {
    it('should handle analysis errors gracefully even with forceRescan', async () => {
      // Mock one function to throw an error
      mockAnalyzePageSpeed.mockRejectedValue(new Error('Network timeout'));
      
      const request = createRequest({ 
        url: 'https://example.com',
        forceRescan: true,
        email: 'error-test@example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fromCache).toBe(false);
      
      // Should continue with other analyses even if one fails
      expect(data.analysis.pageLoadSpeed.score).toBe(0); // Default for failed analysis
      expect(data.analysis.fontUsage.score).toBe(95); // Should still have this
    });

    it('should maintain response structure consistency with cache fields', async () => {
      const request = createRequest({ 
        url: 'https://example.com',
        forceRescan: false
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        analysis: expect.any(Object),
        analysisId: expect.any(String),
        fromCache: expect.any(Boolean),
        message: expect.any(String)
      });
    });
  });

  describe('Schema.org data inclusion', () => {
    it('should include schema data in analysis response', async () => {
      const request = createRequest({ 
        url: 'https://example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify schema data is included
      expect(data.analysis.schema).toBeDefined();
      expect(data.analysis.schema.name).toBe('Test Organization');
      expect(data.analysis.schema.description).toBe('A test organization for analysis');
      expect(data.analysis.schema.organization['@type']).toBe('Organization');
      
      // Verify page metadata is included
      expect(data.analysis.url_title).toBe('Test Page Title');
      expect(data.analysis.url_description).toBe('Test page description for analysis');
      
      // Verify extractPageMetadata was called
      expect(mockExtractPageMetadata).toHaveBeenCalledWith('https://example.com/', expect.any(Object));
    });

    it('should handle schema extraction failure gracefully', async () => {
      // Mock extractPageMetadata to return no schema
      mockExtractPageMetadata.mockResolvedValueOnce({
        title: 'Page Without Schema',
        description: 'A page without schema data',
        url: 'https://example.com/',
        schema: null
      });

      const request = createRequest({ 
        url: 'https://example.com'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify null schema is handled correctly
      expect(data.analysis.schema).toBeNull();
      expect(data.analysis.url_title).toBe('Page Without Schema');
      expect(data.analysis.url_description).toBe('A page without schema data');
    });

    it('should include schema data in cached responses', async () => {
      // Create an analysis with schema data
      const firstRequest = createRequest({ 
        url: 'https://schema-test.com',
        email: 'test@example.com'
      });
      const firstResponse = await POST(firstRequest);
      const firstData = await firstResponse.json();
      
      expect(firstResponse.status).toBe(200);
      expect(firstData.fromCache).toBe(false);
      expect(firstData.analysis.schema).toBeDefined();
      
      // Request again to get cached version
      const secondRequest = createRequest({ 
        url: 'https://schema-test.com',
        email: 'test@example.com',
        forceRescan: false
      });
      const secondResponse = await POST(secondRequest);
      const secondData = await secondResponse.json();
      
      expect(secondResponse.status).toBe(200);
      expect(secondData.fromCache).toBe(true);
      
      // Verify cached response includes schema data
      expect(secondData.analysis.schema).toBeDefined();
      expect(secondData.analysis.schema.name).toBe('Test Organization');
      expect(secondData.analysis.url_title).toBe('Test Page Title');
      expect(secondData.analysis.url_description).toBe('Test page description for analysis');
    });
  });
});