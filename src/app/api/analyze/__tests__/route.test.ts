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
    
    // Overall score
    expect(data.analysis.overallScore).toBe(100); // Average of both 100s
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
});