import puppeteer, { Browser, Page } from 'puppeteer';
import lighthouse, { RunnerResult } from 'lighthouse';
import { analyzeFontUsage, FontAnalysisResult } from './font-analysis';
import { analyzeCTA, CTAAnalysisResult } from './cta-analysis';

export interface AnalysisResult {
  url: string;
  email: string;
  pageLoadSpeed: {
    score: number;
    metrics: {
      firstContentfulPaint?: number;
      largestContentfulPaint?: number;
      cumulativeLayoutShift?: number;
      totalBlockingTime?: number;
    };
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
    issues: string[];
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
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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
        this.analyzeCTAWrapper(page),
        this.analyzeWhitespace(page),
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
      const result = await lighthouse(url, {
        onlyCategories: ['performance'],
        port: 0
      });
      
      if (!result || !result.lhr) {
        throw new Error('Lighthouse analysis failed');
      }
      
      const { lhr } = result;

      const metrics = lhr.audits;
      const performanceScore = (lhr.categories.performance.score || 0) * 100;

      return {
        score: Math.round(performanceScore),
        metrics: {
          firstContentfulPaint: metrics['first-contentful-paint']?.numericValue,
          largestContentfulPaint: metrics['largest-contentful-paint']?.numericValue,
          cumulativeLayoutShift: metrics['cumulative-layout-shift']?.numericValue,
          totalBlockingTime: metrics['total-blocking-time']?.numericValue
        }
      };
    } catch (error) {
      console.error('Lighthouse analysis failed:', error);
      return {
        score: 0,
        metrics: {}
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

  private async analyzeCTAWrapper(page: Page) {
    try {
      console.log('🔍 Starting CTA analysis...');
      
      // Get the HTML content of the page
      const htmlContent = await page.content();
      console.log(`📄 HTML content length: ${htmlContent.length}`);
      
      // Use the new CTA analysis module
      console.log('About to call analyzeCTA...');
      const result = await analyzeCTA(htmlContent);
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

  private async analyzeWhitespace(page: Page) {
    const whitespaceAnalysis = await page.evaluate(() => {
      const body = document.body;
      const elements = Array.from(body.querySelectorAll('*'));
      
      let totalElements = elements.length;
      let densityScore = 0;

      // Simple density calculation based on element count vs viewport
      const viewportArea = window.innerWidth * window.innerHeight;
      const elementDensity = totalElements / (viewportArea / 10000);

      if (elementDensity > 5) densityScore -= 30;
      else if (elementDensity > 3) densityScore -= 15;

      return {
        elementCount: totalElements,
        density: elementDensity
      };
    });

    const issues: string[] = [];
    let score = 100 + whitespaceAnalysis.density;

    if (whitespaceAnalysis.density > 5) {
      issues.push('Page appears cluttered with too many elements');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues
    };
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