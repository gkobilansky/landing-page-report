import puppeteer, { Browser, Page } from 'puppeteer';
import lighthouse, { RunnerResult } from 'lighthouse';

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
    fonts: string[];
    issues: string[];
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
      position: string;
      isAboveFold: boolean;
    }>;
    issues: string[];
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
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const [
        pageLoadSpeed,
        fontUsage,
        imageOptimization,
        ctaAnalysis,
        whitespaceAssessment,
        socialProof
      ] = await Promise.all([
        this.analyzePageLoadSpeed(url),
        this.analyzeFontUsage(page),
        this.analyzeImageOptimization(page),
        this.analyzeCTA(page),
        this.analyzeWhitespace(page),
        this.analyzeSocialProof(page)
      ]);

      const overallScore = this.calculateOverallScore([
        pageLoadSpeed.score,
        fontUsage.score,
        imageOptimization.score,
        ctaAnalysis.score,
        whitespaceAssessment.score,
        socialProof.score
      ]);

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

  private async analyzeFontUsage(page: Page) {
    const fonts = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const fontFamilies = new Set<string>();

      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const fontFamily = computedStyle.fontFamily;
        if (fontFamily && fontFamily !== 'inherit') {
          fontFamilies.add(fontFamily);
        }
      });

      return Array.from(fontFamilies);
    });

    const issues: string[] = [];
    let score = 100;

    if (fonts.length > 3) {
      issues.push(`Too many font families (${fonts.length}). Recommended: 2-3 max.`);
      score -= (fonts.length - 3) * 15;
    }

    return {
      score: Math.max(0, score),
      fonts,
      issues
    };
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

  private async analyzeCTA(page: Page) {
    const ctas = await page.evaluate(() => {
      const selectors = [
        'button',
        'a[href*="signup"]',
        'a[href*="register"]',
        'a[href*="buy"]',
        'a[href*="purchase"]',
        '.cta',
        '.btn-primary',
        'input[type="submit"]'
      ];

      const ctaElements: Array<{
        text: string;
        position: string;
        isAboveFold: boolean;
      }> = [];

      selectors.forEach(selector => {
        const elements = Array.from(document.querySelectorAll(selector));
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const isAboveFold = rect.top < window.innerHeight;
          
          ctaElements.push({
            text: el.textContent?.trim() || '',
            position: `${Math.round(rect.top)}px from top`,
            isAboveFold
          });
        });
      });

      return ctaElements;
    });

    const issues: string[] = [];
    let score = 100;

    const aboveFoldCTAs = ctas.filter((cta: any) => cta.isAboveFold);
    
    if (aboveFoldCTAs.length === 0) {
      issues.push('No clear CTA above the fold');
      score -= 50;
    } else if (aboveFoldCTAs.length > 2) {
      issues.push('Too many CTAs above the fold - focus on one primary action');
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      ctas,
      issues
    };
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