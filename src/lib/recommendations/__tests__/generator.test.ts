/**
 * Tests for the recommendation generator
 */

import {
  getFontRecommendations,
  getImageRecommendations,
  getCtaRecommendations,
  getSpeedRecommendations,
  getWhitespaceRecommendations,
  getSocialProofRecommendations,
  RecommendationContext,
} from '../index';

describe('Recommendation Generator', () => {
  describe('Font Recommendations', () => {
    it('should generate recommendations for too many web fonts', () => {
      const ctx: RecommendationContext = {
        webFontCount: 4,
        systemFontCount: 2,
        url: 'https://example.com',
      };

      const result = getFontRecommendations(ctx);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.legacyStrings.length).toBeGreaterThan(0);
      // Should mention reducing web fonts
      expect(result.legacyStrings.some((r) => r.includes('4'))).toBe(true);
    });

    it('should not generate recommendations for good font usage', () => {
      const ctx: RecommendationContext = {
        webFontCount: 1,
        systemFontCount: 2,
        url: 'https://example.com',
      };

      const result = getFontRecommendations(ctx);

      // Should only have low-impact preload/fallback recommendations
      const highImpact = result.recommendations.filter((r) => r.impact === 'High');
      expect(highImpact.length).toBe(0);
    });

    it('should vary recommendations for same conditions with different URLs', () => {
      const ctx1: RecommendationContext = {
        webFontCount: 4,
        systemFontCount: 2,
        url: 'https://site-a.com',
      };
      const ctx2: RecommendationContext = {
        webFontCount: 4,
        systemFontCount: 2,
        url: 'https://site-b.com',
      };

      const result1 = getFontRecommendations(ctx1);
      const result2 = getFontRecommendations(ctx2);

      // Both should have recommendations
      expect(result1.recommendations.length).toBeGreaterThan(0);
      expect(result2.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Image Recommendations', () => {
    it('should generate high-impact recommendations for missing alt text', () => {
      const ctx: RecommendationContext = {
        totalImages: 10,
        imagesWithoutAlt: 5,
        oversizedImages: 0,
        nonModernFormatCount: 0,
      };

      const result = getImageRecommendations(ctx);

      const highImpact = result.recommendations.filter((r) => r.impact === 'High');
      expect(highImpact.length).toBeGreaterThan(0);
      // Should mention the count
      expect(result.legacyStrings.some((r) => r.includes('5'))).toBe(true);
    });

    it('should recommend modern formats when legacy formats detected', () => {
      const ctx: RecommendationContext = {
        totalImages: 10,
        imagesWithoutAlt: 0,
        oversizedImages: 0,
        nonModernFormatCount: 5,
      };

      const result = getImageRecommendations(ctx);

      expect(result.legacyStrings.some((r) => r.toLowerCase().includes('webp'))).toBe(true);
    });
  });

  describe('CTA Recommendations', () => {
    it('should flag when no primary CTA detected', () => {
      const ctx: RecommendationContext = {
        ctaCount: 3,
        ctasAboveFold: 2,
        primaryCtaDetected: false,
      };

      const result = getCtaRecommendations(ctx);

      const highImpact = result.recommendations.filter((r) => r.impact === 'High');
      expect(highImpact.length).toBeGreaterThan(0);
    });

    it('should flag when no CTAs above fold', () => {
      const ctx: RecommendationContext = {
        ctaCount: 2,
        ctasAboveFold: 0,
        primaryCtaDetected: true,
      };

      const result = getCtaRecommendations(ctx);

      expect(
        result.legacyStrings.some((r) => r.toLowerCase().includes('above the fold') || r.toLowerCase().includes('above-fold'))
      ).toBe(true);
    });
  });

  describe('Speed Recommendations', () => {
    it('should generate high-impact recommendations for slow LCP', () => {
      const ctx: RecommendationContext = {
        lcp: 5000,
        fcp: 2000,
        cls: 0.05,
        speedScore: 40,
      };

      const result = getSpeedRecommendations(ctx);

      const highImpact = result.recommendations.filter((r) => r.impact === 'High');
      expect(highImpact.length).toBeGreaterThan(0);
      // Should include the actual LCP value
      expect(result.legacyStrings.some((r) => r.includes('5000'))).toBe(true);
    });

    it('should flag poor CLS', () => {
      const ctx: RecommendationContext = {
        lcp: 1500,
        fcp: 1000,
        cls: 0.3,
        speedScore: 60,
      };

      const result = getSpeedRecommendations(ctx);

      expect(result.legacyStrings.some((r) => r.toLowerCase().includes('layout') || r.toLowerCase().includes('cls'))).toBe(
        true
      );
    });
  });

  describe('Whitespace Recommendations', () => {
    it('should flag severely cluttered pages', () => {
      const ctx: RecommendationContext = {
        whitespaceRatio: 0.2,
        contentDensity: 0.8,
        avgLineHeight: 1.2,
        clutterScore: 75,
      };

      const result = getWhitespaceRecommendations(ctx);

      const highImpact = result.recommendations.filter((r) => r.impact === 'High');
      expect(highImpact.length).toBeGreaterThan(0);
    });

    it('should recommend better line height when too tight', () => {
      const ctx: RecommendationContext = {
        whitespaceRatio: 0.45,
        contentDensity: 0.5,
        avgLineHeight: 1.1,
        clutterScore: 30,
      };

      const result = getWhitespaceRecommendations(ctx);

      expect(result.legacyStrings.some((r) => r.toLowerCase().includes('line'))).toBe(true);
    });
  });

  describe('Social Proof Recommendations', () => {
    it('should recommend adding social proof when none exists', () => {
      const ctx: RecommendationContext = {
        testimonialCount: 0,
        reviewCount: 0,
        trustBadgeCount: 0,
        hasAboveFoldProof: false,
      };

      const result = getSocialProofRecommendations(ctx);

      const highImpact = result.recommendations.filter((r) => r.impact === 'High');
      expect(highImpact.length).toBeGreaterThan(0);
    });

    it('should recommend above-fold placement when proof exists but not visible', () => {
      const ctx: RecommendationContext = {
        testimonialCount: 3,
        reviewCount: 2,
        trustBadgeCount: 1,
        hasAboveFoldProof: false,
      };

      const result = getSocialProofRecommendations(ctx);

      expect(
        result.legacyStrings.some((r) => r.toLowerCase().includes('above') || r.toLowerCase().includes('fold'))
      ).toBe(true);
    });
  });

  describe('Action-oriented language', () => {
    it('should not include congratulatory language', () => {
      const goodCtx: RecommendationContext = {
        webFontCount: 1,
        systemFontCount: 2,
      };

      const result = getFontRecommendations(goodCtx);

      // Should not have "Excellent", "Great job", "Good work" etc.
      const congratulatoryPatterns = [/excellent/i, /great job/i, /good work/i, /well done/i, /congratulations/i];

      result.legacyStrings.forEach((rec) => {
        congratulatoryPatterns.forEach((pattern) => {
          expect(rec).not.toMatch(pattern);
        });
      });
    });
  });
});
