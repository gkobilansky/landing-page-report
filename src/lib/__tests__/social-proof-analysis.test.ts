import { analyzeSocialProof } from '../social-proof-analysis';

// Mock the puppeteer-config module
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(),
}));

const { createPuppeteerBrowser } = require('../puppeteer-config');

const mockPage = {
  setViewport: jest.fn(),
  goto: jest.fn(),
  setContent: jest.fn(),
  evaluate: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

describe('Social Proof Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  describe('analyzeSocialProof', () => {
    it('should detect testimonials with names and companies', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: '"This product changed our business completely. Highly recommend!" - John Smith, CEO of TechCorp',
          score: 85,
          position: { top: 100, left: 50, width: 400, height: 100 },
          isAboveFold: true,
          hasImage: false,
          hasName: true,
          hasCompany: true,
          hasRating: false,
          credibilityScore: 85,
          visibility: 'high',
          context: 'hero'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].type).toBe('testimonial');
      expect(result.elements[0].hasName).toBe(true);
      expect(result.elements[0].hasCompany).toBe(true);
      expect(result.summary.testimonials).toBe(1);
    });

    it('should detect customer count social proof', async () => {
      const mockSocialProofData = [
        {
          type: 'customer-count',
          text: 'Trusted by over 10,000 customers worldwide',
          score: 75,
          position: { top: 200, left: 100, width: 300, height: 50 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 75,
          visibility: 'medium',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.elements[0].type).toBe('customer-count');
      expect(result.summary.customerCounts).toBe(1);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('should detect reviews with ratings', async () => {
      const mockSocialProofData = [
        {
          type: 'review',
          text: 'Excellent service! ★★★★★ 5/5 stars',
          score: 80,
          position: { top: 300, left: 50, width: 250, height: 80 },
          isAboveFold: false,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: true,
          credibilityScore: 80,
          visibility: 'high',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.elements[0].type).toBe('review');
      expect(result.elements[0].hasRating).toBe(true);
      expect(result.summary.reviews).toBe(1);
    });

    it('should detect trust badges and certifications', async () => {
      const mockSocialProofData = [
        {
          type: 'trust-badge',
          text: 'SSL Secured & Verified',
          score: 90,
          position: { top: 50, left: 200, width: 150, height: 60 },
          isAboveFold: true,
          hasImage: true,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 90,
          visibility: 'high',
          context: 'header'
        },
        {
          type: 'certification',
          text: 'ISO 27001 Certified',
          score: 85,
          position: { top: 120, left: 200, width: 150, height: 40 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 85,
          visibility: 'medium',
          context: 'header'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.summary.trustBadges).toBe(1);
      expect(result.summary.certifications).toBe(1);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('should detect partnership and news mentions', async () => {
      const mockSocialProofData = [
        {
          type: 'partnership',
          text: 'Trusted by Microsoft and Google',
          score: 75,
          position: { top: 400, left: 100, width: 300, height: 50 },
          isAboveFold: false,
          hasImage: true,
          hasName: false,
          hasCompany: true,
          hasRating: false,
          credibilityScore: 75,
          visibility: 'medium',
          context: 'content'
        },
        {
          type: 'news-mention',
          text: 'Featured in TechCrunch and Forbes',
          score: 80,
          position: { top: 450, left: 100, width: 300, height: 50 },
          isAboveFold: false,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 80,
          visibility: 'medium',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.summary.partnerships).toBe(1);
      expect(result.summary.newsMentions).toBe(1);
    });

    it('should handle pages with no social proof', async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.score).toBe(0);
      expect(result.elements).toHaveLength(0);
      expect(result.issues).toContain('No social proof elements found on the page');
      expect(result.recommendations).toContain('Add testimonials, reviews, or trust badges to build credibility');
    });

    it('should penalize lack of above-fold social proof', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: 'Great product!',
          score: 60,
          position: { top: 1200, left: 50, width: 300, height: 80 },
          isAboveFold: false,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 60,
          visibility: 'medium',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.issues).toContain('No social proof elements above the fold');
      expect(result.recommendations).toContain('Place at least one testimonial or trust indicator above the fold');
      expect(result.score).toBeLessThan(70);
    });

    it('should reward diversity of social proof types', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: '"Amazing service!" - Jane Doe, Marketing Director',
          score: 80,
          position: { top: 100, left: 50, width: 300, height: 80 },
          isAboveFold: true,
          hasImage: false,
          hasName: true,
          hasCompany: true,
          hasRating: false,
          credibilityScore: 80,
          visibility: 'high',
          context: 'hero'
        },
        {
          type: 'review',
          text: '5 stars - Highly recommended!',
          score: 75,
          position: { top: 200, left: 50, width: 250, height: 60 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: true,
          credibilityScore: 75,
          visibility: 'high',
          context: 'content'
        },
        {
          type: 'trust-badge',
          text: 'Secure Payment',
          score: 85,
          position: { top: 300, left: 50, width: 150, height: 50 },
          isAboveFold: true,
          hasImage: true,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 85,
          visibility: 'high',
          context: 'content'
        },
        {
          type: 'customer-count',
          text: '50,000+ happy customers',
          score: 70,
          position: { top: 400, left: 50, width: 200, height: 40 },
          isAboveFold: false,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 70,
          visibility: 'medium',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.score).toBeGreaterThan(85); // Should get bonus for diversity
      expect(result.summary.testimonials).toBe(1);
      expect(result.summary.reviews).toBe(1);
      expect(result.summary.trustBadges).toBe(1);
      expect(result.summary.customerCounts).toBe(1);
    });

    it('should penalize low-quality social proof', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: 'lorem ipsum placeholder text',
          score: 25,
          position: { top: 100, left: 50, width: 300, height: 80 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 25,
          visibility: 'low',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.issues).toContain('Some social proof elements appear generic or low-quality');
      expect(result.recommendations).toContain('Replace generic social proof with authentic customer feedback');
      expect(result.score).toBeLessThan(60);
    });

    it('should detect social media social proof', async () => {
      const mockSocialProofData = [
        {
          type: 'social-media',
          text: '10K followers on Instagram',
          score: 65,
          position: { top: 150, left: 300, width: 200, height: 50 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 65,
          visibility: 'medium',
          context: 'header'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.summary.socialMedia).toBe(1);
      expect(result.elements[0].type).toBe('social-media');
    });

    it('should detect case studies', async () => {
      const mockSocialProofData = [
        {
          type: 'case-study',
          text: 'Read our success story: How Company X increased revenue by 300%',
          score: 85,
          position: { top: 500, left: 50, width: 400, height: 100 },
          isAboveFold: false,
          hasImage: false,
          hasName: false,
          hasCompany: true,
          hasRating: false,
          credibilityScore: 85,
          visibility: 'high',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.summary.caseStudies).toBe(1);
      expect(result.elements[0].type).toBe('case-study');
    });

    it('should remove duplicate social proof elements', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: 'Great product, highly recommend!',
          score: 70,
          position: { top: 100, left: 50, width: 300, height: 80 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 70,
          visibility: 'medium',
          context: 'content'
        },
        {
          type: 'testimonial',
          text: 'Great product, highly recommend! - John',
          score: 75,
          position: { top: 200, left: 50, width: 300, height: 80 },
          isAboveFold: true,
          hasImage: false,
          hasName: true,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 75,
          visibility: 'medium',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].credibilityScore).toBe(75); // Should keep the higher quality one
      expect(result.elements[0].hasName).toBe(true);
    });

    it('should provide specific recommendations based on missing elements', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: 'Good product',
          score: 50,
          position: { top: 100, left: 50, width: 200, height: 60 },
          isAboveFold: true,
          hasImage: false,
          hasName: false,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 50,
          visibility: 'low',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const result = await analyzeSocialProof('https://example.com');

      expect(result.recommendations).toContain('Add different types of social proof (testimonials, reviews, trust badges, customer counts)');
      expect(result.recommendations).toContain('Add security badges or certifications to increase trust');
      expect(result.recommendations).toContain('Display customer counts or usage statistics to show popularity');
    });

    it('should handle browser errors gracefully', async () => {
      createPuppeteerBrowser.mockRejectedValueOnce(new Error('Browser launch failed'));

      const result = await analyzeSocialProof('https://example.com');

      expect(result.score).toBe(0);
      expect(result.elements).toHaveLength(0);
      expect(result.issues).toContain('Social proof analysis failed due to an error');
    });

    it('should work with HTML content instead of URL', async () => {
      const mockSocialProofData = [
        {
          type: 'testimonial',
          text: '"Excellent service!" - Sarah Johnson',
          score: 80,
          position: { top: 100, left: 50, width: 300, height: 80 },
          isAboveFold: true,
          hasImage: false,
          hasName: true,
          hasCompany: false,
          hasRating: false,
          credibilityScore: 80,
          visibility: 'high',
          context: 'content'
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockSocialProofData);

      const htmlContent = '<div class="testimonial">"Excellent service!" - Sarah Johnson</div>';
      const result = await analyzeSocialProof(htmlContent, { isHtml: true });

      expect(mockPage.setContent).toHaveBeenCalledWith(htmlContent);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].hasName).toBe(true);
    });
  });
});