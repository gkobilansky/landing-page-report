import { Browser, Page } from 'puppeteer-core';
import { createPuppeteerBrowser } from './puppeteer-config';
import { analyzeFontUsage } from './font-analysis';
import { analyzeCTA } from './cta-analysis';
import { analyzePageSpeed } from './page-speed-analysis';
import { analyzeWhitespace } from './whitespace-assessment';
import { analyzeSocialProof, SocialProofAnalysisResult, SocialProofElement } from './social-proof-analysis';

export interface AnalysisResult {
  url: string;
  email: string;
  pageLoadSpeed: {
    score: number;
    metrics: {
      loadTime: number; // Page load time in seconds (marketing-friendly)
      speedDescription: string; // Marketing-friendly description
      relativeTo: string; // Comparison to other websites
    };
    issues: string[];
    recommendations: string[];
    loadTime: number;
  };
  fontUsage: {
    score: number;
    fontFamilies: string[];
    fontCount: number;
    issues: string[];
    recommendations: string[];
  };
  imageOptimization: {
    score: number;
    images: Array<{
      src: string;
      format: string;
      size?: number;
      issues: string[];
    }>;
    issues: string[];
  };
  ctaAnalysis: {
    score: number;
    ctas: Array<{
      text: string;
      type: string;
      isAboveFold: boolean;
      actionStrength: string;
      urgency: string;
      visibility: string;
      context: string;
    }>;
    primaryCTA?: {
      text: string;
      type: string;
      actionStrength: string;
      visibility: string;
      context: string;
    };
    issues: string[];
    recommendations: string[];
  };
  whitespaceAssessment: {
    score: number;
    metrics: {
      whitespaceRatio: number;
      elementDensityPerSection: {
        gridSections: number;
        maxDensity: number;
        averageDensity: number;
        totalElements: number;
      };
      spacingAnalysis: {
        headlineSpacing: { adequate: boolean };
        ctaSpacing: { adequate: boolean };
        contentBlockSpacing: { adequate: boolean };
        lineHeight: { adequate: boolean };
      };
      clutterScore: number;
      hasAdequateSpacing: boolean;
    };
    issues: string[];
    recommendations: string[];
    loadTime: number;
  };
  socialProof: {
    score: number;
    elements: SocialProofElement[];
    summary: SocialProofAnalysisResult['summary'];
    issues: string[];
    recommendations: string[];
  };
  overallScore: number;
  status: 'pending' | 'completed' | 'failed';
}

export class LandingPageAnalyzer {
  private browser: Browser | null = null;

  async initialize() {
    this.browser = await createPuppeteerBrowser();
  }

  async analyze(url: string, email: string): Promise<AnalysisResult> {
    console.log(`🔍 Starting comprehensive analysis for: ${url}`)
    
    if (!this.browser) {
      console.log('🚀 Initializing browser...')
      await this.initialize();
    }

    console.log('📄 Creating new page...')
    const page = await this.browser!.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      console.log('🌐 Navigating to target URL...')
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      console.log('⚡ Running all analysis modules in parallel...')
      const [
        pageLoadSpeed,
        fontUsage,
        imageOptimization,
        ctaAnalysis,
        whitespaceAssessment,
        socialProof
      ] = await Promise.all([
        this.analyzePageLoadSpeed(url),
        analyzeFontUsage(url),
        this.analyzeImageOptimization(page),
        this.analyzeCTAWrapper(page, url),
        this.analyzeWhitespaceWrapper(url),
        this.analyzeSocialProofWrapper(page, url)
      ]);

      console.log('📊 Calculating overall score...')
      const overallScore = this.calculateOverallScore([
        pageLoadSpeed.score,
        fontUsage.score,
        imageOptimization.score,
        ctaAnalysis.score,
        whitespaceAssessment.score,
        socialProof.score
      ]);

      console.log(`🎯 Analysis complete! Overall score: ${overallScore}/100`)
      
      return {
        url,
        email,
        pageLoadSpeed,
        fontUsage,
        imageOptimization,
        ctaAnalysis,
        whitespaceAssessment,
        socialProof,
        overallScore,
        status: 'completed'
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async analyzePageLoadSpeed(url: string) {
    try {
      console.log('🚀 Starting comprehensive page speed analysis...');
      const result = await analyzePageSpeed(url);
      console.log(`✅ Page speed analysis complete. Score: ${result.score}`);
      return result;
    } catch (error) {
      console.error('❌ Page speed analysis failed:', error);
      return {
        score: 0,
        metrics: {
          loadTime: 0,
          speedDescription: 'Unable to measure',
          relativeTo: 'Analysis unavailable'
        },
        issues: ['Page speed analysis failed'],
        recommendations: ['Unable to analyze page speed'],
        loadTime: 0
      };
    }
  }


  private async analyzeImageOptimization(page: Page) {
    const images = await page.evaluate(() => {
      const imgElements = Array.from(document.querySelectorAll('img'));
      return imgElements.map(img => ({
        src: (img as HTMLImageElement).src,
        format: (img as HTMLImageElement).src.split('.').pop()?.toLowerCase() || 'unknown',
        width: (img as HTMLImageElement).naturalWidth,
        height: (img as HTMLImageElement).naturalHeight,
        alt: (img as HTMLImageElement).alt
      }));
    });

    const issues: string[] = [];
    let score = 100;

    images.forEach((img: any) => {
      if (!img.alt) {
        issues.push(`Missing alt text for image: ${img.src}`);
        score -= 5;
      }
      if (!['webp', 'avif', 'jpg', 'jpeg', 'png'].includes(img.format)) {
        issues.push(`Unoptimized format for image: ${img.src}`);
        score -= 10;
      }
    });

    return {
      score: Math.max(0, score),
      images: images.map((img: any) => ({
        src: img.src,
        format: img.format,
        issues: []
      })),
      issues
    };
  }

  private async analyzeCTAWrapper(page: Page, url: string) {
    try {
      console.log('🔍 Starting CTA analysis...');
      
      // Use the new CTA analysis module with URL
      console.log('About to call analyzeCTA...');
      const result = await analyzeCTA(url);
      console.log('analyzeCTA returned:', { score: result.score, ctaCount: result.ctas.length });
      console.log(`🎯 CTA analysis complete. Found ${result.ctas.length} CTAs, score: ${result.score}`);
      
      // Transform the result to match the expected interface
      return {
        score: result.score,
        ctas: result.ctas.map(cta => ({
          text: cta.text,
          type: cta.type,
          isAboveFold: cta.isAboveFold,
          actionStrength: cta.actionStrength,
          urgency: cta.urgency,
          visibility: cta.visibility,
          context: cta.context
        })),
        primaryCTA: result.primaryCTA ? {
          text: result.primaryCTA.text,
          type: result.primaryCTA.type,
          actionStrength: result.primaryCTA.actionStrength,
          visibility: result.primaryCTA.visibility,
          context: result.primaryCTA.context
        } : undefined,
        issues: result.issues,
        recommendations: result.recommendations
      };
    } catch (error) {
      console.error('❌ CTA analysis failed:', error);
      
      // Fallback to basic CTA detection using page evaluation
      const fallbackResult = await page.evaluate(() => {
        const clickableElements = Array.from(document.querySelectorAll('a, button, input[type="submit"], [onclick], [role="button"]'));
        const ctas = clickableElements
          .map(el => ({
            text: el.textContent?.trim() || '',
            href: (el as HTMLAnchorElement).href || '',
            tagName: el.tagName
          }))
          .filter(cta => cta.text.length > 0 && cta.text.length < 100)
          .slice(0, 20); // Limit to first 20 to avoid overwhelming results
          
        return ctas;
      });
      
      return {
        score: fallbackResult.length > 0 ? 50 : 0, // Basic scoring
        ctas: fallbackResult.map(cta => ({
          text: cta.text,
          type: 'text-link',
          isAboveFold: true, // Assume true for fallback
          actionStrength: 'medium',
          urgency: 'low',
          visibility: 'medium',
          context: 'content'
        })),
        primaryCTA: fallbackResult.length > 0 ? {
          text: fallbackResult[0].text,
          type: 'text-link',
          actionStrength: 'medium',
          visibility: 'medium',
          context: 'content'
        } : undefined,
        issues: ['CTA analysis module failed, using fallback detection'],
        recommendations: ['Unable to perform detailed CTA analysis']
      };
    }
  }

  private async analyzeWhitespaceWrapper(url: string) {
    try {
      console.log('🔍 Starting comprehensive whitespace analysis...');
      const result = await analyzeWhitespace(url);
      console.log(`✅ Whitespace analysis complete. Score: ${result.score}`);
      
      // Transform the result to match the expected interface
      return {
        score: result.score,
        metrics: {
          whitespaceRatio: result.metrics.whitespaceRatio,
          elementDensityPerSection: {
            gridSections: result.metrics.elementDensityPerSection.gridSections,
            maxDensity: result.metrics.elementDensityPerSection.maxDensity,
            averageDensity: result.metrics.elementDensityPerSection.averageDensity,
            totalElements: result.metrics.elementDensityPerSection.totalElements
          },
          spacingAnalysis: {
            headlineSpacing: { adequate: result.metrics.spacingAnalysis.headlineSpacing.adequate },
            ctaSpacing: { adequate: result.metrics.spacingAnalysis.ctaSpacing.adequate },
            contentBlockSpacing: { adequate: result.metrics.spacingAnalysis.contentBlockSpacing.adequate },
            lineHeight: { adequate: result.metrics.spacingAnalysis.lineHeight.adequate }
          },
          clutterScore: result.metrics.clutterScore,
          hasAdequateSpacing: result.metrics.hasAdequateSpacing
        },
        issues: result.issues,
        recommendations: result.recommendations,
        loadTime: result.loadTime
      };
    } catch (error) {
      console.error('❌ Whitespace analysis failed:', error);
      
      // Fallback to basic scoring
      return {
        score: 0,
        metrics: {
          whitespaceRatio: 0,
          elementDensityPerSection: {
            gridSections: 0,
            maxDensity: 0,
            averageDensity: 0,
            totalElements: 0
          },
          spacingAnalysis: {
            headlineSpacing: { adequate: false },
            ctaSpacing: { adequate: false },
            contentBlockSpacing: { adequate: false },
            lineHeight: { adequate: false }
          },
          clutterScore: 100,
          hasAdequateSpacing: false
        },
        issues: ['Whitespace analysis module failed'],
        recommendations: ['Unable to perform detailed whitespace analysis'],
        loadTime: 0
      };
    }
  }

  private async analyzeSocialProofWrapper(page: Page, url: string) {
    try {
      console.log('🔍 Starting social proof analysis...');
      const result = await analyzeSocialProof(url);
      console.log(`✅ Social proof analysis complete. Found ${result.elements.length} elements, score: ${result.score}`);
      return {
        score: result.score,
        elements: result.elements,
        summary: result.summary,
        issues: result.issues,
        recommendations: result.recommendations
      };
    } catch (error) {
      console.error('❌ Social proof analysis failed:', error);
      return this.legacySocialProofFallback(page);
    }
  }

  private async legacySocialProofFallback(page: Page): Promise<AnalysisResult['socialProof']> {
    const socialProofElements = await page.evaluate(() => {
      const indicators = [
        { selector: '[class*="testimonial"]', type: 'testimonial' },
        { selector: '[class*="review"]', type: 'review' },
        { selector: '[class*="rating"]', type: 'rating' },
        { selector: '[class*="trust"]', type: 'trust badge' },
        { selector: '[class*="logo"]', type: 'company logo' },
        { selector: '[class*="client"]', type: 'client' }
      ];

      const found: Array<{ type: string; text: string }> = [];

      indicators.forEach(({ selector, type }) => {
        const elements = Array.from(document.querySelectorAll(selector));
        elements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 0) {
            found.push({ type, text: text.substring(0, 120) });
          }
        });
      });

      return found;
    });

    const normalizedElements: SocialProofElement[] = socialProofElements.map(({ type, text }) => {
      const mappedType = this.mapLegacySocialProofType(type);
      return {
        type: mappedType,
        text,
        score: 40,
        position: { top: 0, left: 0, width: 0, height: 0 },
        isAboveFold: false,
        hasImage: mappedType === 'partnership',
        hasName: false,
        hasCompany: mappedType === 'partnership',
        hasRating: mappedType === 'review' || mappedType === 'rating',
        credibilityScore: 40,
        visibility: 'medium',
        context: 'content'
      };
    });

    const summary = this.buildSocialProofSummary(normalizedElements);
    const issues: string[] = [];
    const recommendations: string[] = [];

    let score = normalizedElements.length * 20;
    if (normalizedElements.length === 0) {
      issues.push('No social proof elements found');
      recommendations.push('Add testimonials, reviews, or trust badges to build credibility');
      score = 0;
    }

    return {
      score: Math.min(100, score),
      elements: normalizedElements,
      summary,
      issues,
      recommendations
    };
  }

  private mapLegacySocialProofType(type: string): SocialProofElement['type'] {
    const normalized = type.toLowerCase();
    if (normalized.includes('review')) return 'review';
    if (normalized.includes('rating')) return 'rating';
    if (normalized.includes('trust')) return 'trust-badge';
    if (normalized.includes('logo') || normalized.includes('client')) return 'partnership';
    return 'testimonial';
  }

  private buildSocialProofSummary(elements: SocialProofElement[]): SocialProofAnalysisResult['summary'] {
    return {
      totalElements: elements.length,
      aboveFoldElements: elements.filter(e => e.isAboveFold).length,
      testimonials: elements.filter(e => e.type === 'testimonial').length,
      reviews: elements.filter(e => e.type === 'review').length,
      ratings: elements.filter(e => e.type === 'rating').length,
      trustBadges: elements.filter(e => e.type === 'trust-badge').length,
      customerCounts: elements.filter(e => e.type === 'customer-count').length,
      socialMedia: elements.filter(e => e.type === 'social-media').length,
      certifications: elements.filter(e => e.type === 'certification').length,
      partnerships: elements.filter(e => e.type === 'partnership').length,
      caseStudies: elements.filter(e => e.type === 'case-study').length,
      newsMentions: elements.filter(e => e.type === 'news-mention').length
    };
  }

  private calculateOverallScore(scores: number[]): number {
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
