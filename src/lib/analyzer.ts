import { Browser, Page } from 'puppeteer-core';
import { createPuppeteerBrowser } from './puppeteer-config';
import lighthouse, { RunnerResult } from 'lighthouse';
import { analyzeFontUsage, FontAnalysisResult } from './font-analysis';
import { analyzeCTA, CTAAnalysisResult } from './cta-analysis';
import { analyzePageSpeed, PageSpeedAnalysisResult } from './page-speed-analysis';
import { analyzeWhitespace, WhitespaceAnalysisResult } from './whitespace-assessment';

export interface AnalysisResult {
  url: string;
  email: string;
  pageLoadSpeed: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    metrics: {
      loadTime: number; // Page load time in seconds (marketing-friendly)
      performanceGrade: string; // A, B, C, D, F
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
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
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
    elements: Array<{
      type: string;
      text: string;
    }>;
    issues: string[];
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
        this.analyzeSocialProof(page)
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
      console.log(`✅ Page speed analysis complete. Score: ${result.score}, Grade: ${result.grade}`);
      return result;
    } catch (error) {
      console.error('❌ Page speed analysis failed:', error);
      return {
        score: 0,
        grade: 'F' as const,
        metrics: {
          loadTime: 0,
          performanceGrade: 'F',
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
        src: img.src,
        format: img.src.split('.').pop()?.toLowerCase() || 'unknown',
        width: img.naturalWidth,
        height: img.naturalHeight,
        alt: img.alt
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
      console.log(`✅ Whitespace analysis complete. Score: ${result.score}, Grade: ${result.grade}`);
      
      // Transform the result to match the expected interface
      return {
        score: result.score,
        grade: result.grade,
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
        grade: 'F' as const,
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

  private async analyzeSocialProof(page: Page) {
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
            found.push({ type, text: text.substring(0, 100) });
          }
        });
      });

      return found;
    });

    const issues: string[] = [];
    let score = socialProofElements.length * 20;

    if (socialProofElements.length === 0) {
      issues.push('No social proof elements found');
      score = 0;
    }

    return {
      score: Math.min(100, score),
      elements: socialProofElements,
      issues
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