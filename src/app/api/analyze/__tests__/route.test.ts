import { POST } from '../route';

// Mock the analysis functions
jest.mock('@/lib/font-analysis', () => ({
  analyzeFontUsage: jest.fn(() => 
    Promise.resolve({
      fontFamilies: ['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'],
      fontCount: 1,
      score: 100,
      issues: [],
      recommendations: ['Excellent font usage! Your minimal font selection promotes fast loading and clean design.']
    })
  )
}));

jest.mock('@/lib/image-optimization', () => ({
  analyzeImageOptimization: jest.fn(() => 
    Promise.resolve({
      score: 100,
      totalImages: 0,
      modernFormats: 0,
      withAltText: 0,
      appropriatelySized: 0,
      issues: [],
      recommendations: ['Consider adding relevant images to enhance user engagement'],
      details: {
        formatBreakdown: {},
        avgImageSize: null,
        largestImage: null
      }
    })
  )
}));

jest.mock('@/lib/page-speed-analysis', () => ({
  analyzePageSpeed: jest.fn(() => 
    Promise.resolve({
      score: 95,
      grade: 'A',
      metrics: {
        lcp: 1200,
        fcp: 800,
        cls: 0.05,
        tbt: 50,
        si: 1500
      },
      lighthouseScore: 95,
      issues: [],
      recommendations: ['Excellent performance! Consider monitoring Core Web Vitals regularly'],
      loadTime: 3000
    })
  )
}));

jest.mock('@/lib/whitespace-assessment', () => ({
  analyzeWhitespace: jest.fn(() => 
    Promise.resolve({
      score: 85,
      grade: 'B',
      metrics: {
        whitespaceRatio: 0.58,
        elementDensityPerSection: {
          gridSections: 12,
          elementDensityPerSection: [2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1],
          maxDensity: 4,
          averageDensity: 2.1,
          totalElements: 45
        },
        spacingAnalysis: {
          headlineSpacing: { marginTop: 32, marginBottom: 24, adequate: true },
          ctaSpacing: { marginTop: 40, marginBottom: 40, marginLeft: 20, marginRight: 20, adequate: true },
          contentBlockSpacing: { averageMarginBetween: 32, adequate: true },
          lineHeight: { average: 1.6, adequate: true }
        },
        clutterScore: 15,
        hasAdequateSpacing: true
      },
      issues: [],
      recommendations: ['Excellent whitespace usage! Content is well-spaced and digestible'],
      loadTime: 2500
    })
  )
}));

jest.mock('@/lib/cta-analysis', () => ({
  analyzeCTA: jest.fn(() => 
    Promise.resolve({
      score: 100,
      ctas: [
        {
          text: 'Get Started',
          type: 'primary',
          isAboveFold: true,
          actionStrength: 'strong',
          urgency: 'medium',
          visibility: 'high',
          context: 'hero',
          hasValueProposition: true,
          hasUrgency: false,
          hasGuarantee: false,
          mobileOptimized: true,
          position: { top: 200, left: 100, width: 120, height: 40 }
        }
      ],
      primaryCTA: {
        text: 'Get Started',
        type: 'primary',
        isAboveFold: true,
        actionStrength: 'strong',
        urgency: 'medium',
        visibility: 'high',
        context: 'hero',
        hasValueProposition: true,
        hasUrgency: false,
        hasGuarantee: false,
        mobileOptimized: true,
        position: { top: 200, left: 100, width: 120, height: 40 }
      },
      secondaryCTAs: [],
      issues: [],
      recommendations: ['Excellent CTA implementation!']
    })
  )
}));

describe('/api/analyze', () => {
  const createRequest = (body: any) => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue(body),
      method: 'POST',
      headers: new Map([['Content-Type', 'application/json']]),
    };
    return mockRequest as any;
  };

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
    expect(data.error).toBe('Invalid URL format');
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
    
    // Font usage analysis
    expect(data.analysis.fontUsage).toBeDefined();
    expect(data.analysis.fontUsage.score).toBe(100);
    expect(data.analysis.fontUsage.fontFamilies).toEqual(['-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif']);
    expect(data.analysis.fontUsage.fontCount).toBe(1);
    
    // Image optimization analysis
    expect(data.analysis.imageOptimization).toBeDefined();
    expect(data.analysis.imageOptimization.score).toBe(100);
    expect(data.analysis.imageOptimization.totalImages).toBe(0);
    expect(data.analysis.imageOptimization.recommendations).toContain('Consider adding relevant images to enhance user engagement');
    
    // Page speed analysis
    expect(data.analysis.pageLoadSpeed).toBeDefined();
    expect(data.analysis.pageLoadSpeed.score).toBe(95);
    expect(data.analysis.pageLoadSpeed.grade).toBe('A');
    expect(data.analysis.pageLoadSpeed.metrics.lcp).toBe(1200);
    
    // Overall score (Average of 95 + 100 + 100 + 100 = 98.75, rounded to 99)
    expect(data.analysis.overallScore).toBeGreaterThanOrEqual(95);
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
    expect(data.error).toBe('Invalid URL format');
  });

  it('should support page speed component analysis', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'speed'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.analysis.pageLoadSpeed).toBeDefined();
    expect(data.analysis.pageLoadSpeed.score).toBe(95);
    expect(data.analysis.pageLoadSpeed.grade).toBe('A');
    expect(data.analysis.pageLoadSpeed.metrics.lcp).toBe(1200);
    expect(data.analysis.pageLoadSpeed.metrics.fcp).toBe(800);
    expect(data.analysis.pageLoadSpeed.metrics.cls).toBe(0.05);
    expect(data.analysis.pageLoadSpeed.lighthouseScore).toBe(95);
    expect(data.analysis.overallScore).toBe(95); // Only speed analysis ran
  });

  it('should support pageSpeed component analysis (alternative name)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'pageSpeed'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis.pageLoadSpeed.score).toBe(95);
    expect(data.analysis.pageLoadSpeed.grade).toBe('A');
  });

  it('should support whitespace component analysis', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'whitespace'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.analysis.whitespaceAssessment).toBeDefined();
    expect(data.analysis.whitespaceAssessment.score).toBe(85);
    expect(data.analysis.whitespaceAssessment.grade).toBe('B');
    expect(data.analysis.whitespaceAssessment.metrics.whitespaceRatio).toBe(0.58);
    expect(data.analysis.whitespaceAssessment.metrics.elementDensityPerSection.maxDensity).toBe(4);
    expect(data.analysis.whitespaceAssessment.metrics.spacingAnalysis.headlineSpacing.adequate).toBe(true);
    expect(data.analysis.whitespaceAssessment.metrics.hasAdequateSpacing).toBe(true);
    expect(data.analysis.overallScore).toBe(85); // Only whitespace analysis ran
  });

  it('should support spacing component analysis (alternative name)', async () => {
    const request = createRequest({ 
      url: 'https://example.com',
      component: 'spacing'
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis.whitespaceAssessment.score).toBe(85);
    expect(data.analysis.whitespaceAssessment.grade).toBe('B');
  });
});