import { createPuppeteerBrowser } from './puppeteer-config';

// Dynamic import for Lighthouse to handle server-side module loading issues
let lighthouse: any;
async function loadLighthouse() {
  if (!lighthouse) {
    try {
      // Try different import patterns for better Next.js compatibility
      const lighthouseModule = await import('lighthouse');
      lighthouse = lighthouseModule.default || lighthouseModule;
      
      // Verify lighthouse is actually a function
      if (typeof lighthouse !== 'function') {
        throw new Error('Lighthouse module did not export a function');
      }
    } catch (error) {
      console.error('Failed to load Lighthouse:', error);
      throw new Error(`Lighthouse is not available in this environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return lighthouse;
}

export interface PageSpeedMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  fcp: number; // First Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time (ms)
  si: number;  // Speed Index (ms)
}

export interface PageSpeedAnalysisResult {
  score: number; // 0-100 overall performance score
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: PageSpeedMetrics;
  lighthouseScore: number; // Raw Lighthouse performance score
  issues: string[];
  recommendations: string[];
  loadTime: number; // Total analysis time in ms
}

interface PageSpeedOptions {
  viewport?: {
    width: number;
    height: number;
  };
  throttling?: 'mobile' | 'desktop' | 'none';
  timeout?: number;
}

export async function analyzePageSpeed(
  url: string, 
  options: PageSpeedOptions = {}
): Promise<PageSpeedAnalysisResult> {
  console.log(`🚀 Starting page speed analysis for: ${url}`);
  const startTime = Date.now();
  
  // Try Lighthouse first, fallback to Puppeteer-based analysis
  try {
    console.log('🔬 Attempting Lighthouse analysis...');
    return await analyzeWithLighthouse(url, options, startTime);
  } catch (lighthouseError) {
    console.log('⚠️ Lighthouse failed, falling back to Puppeteer analysis...');
    console.error('Lighthouse error:', lighthouseError);
    return await analyzeWithPuppeteer(url, options, startTime);
  }
}

async function analyzeWithLighthouse(
  url: string, 
  options: PageSpeedOptions, 
  startTime: number
): Promise<PageSpeedAnalysisResult> {
  let browser;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const throttling = options.throttling || 'desktop';
    const timeout = options.timeout || 60000;

    console.log('📱 Launching Puppeteer browser for Lighthouse...');
    
    browser = await createPuppeteerBrowser();

    console.log('🔍 Running Lighthouse performance audit...');
    const lighthouseModule = await loadLighthouse();
    
    // Configure Lighthouse options more robustly
    const lighthouseOptions = {
      onlyCategories: ['performance'],
      formFactor: throttling === 'mobile' ? 'mobile' : 'desktop',
      // Remove port option that might be causing path issues
      logLevel: 'error', // Reduce noise
      output: 'json',
      // Add explicit browser instance
      ...(browser && { port: new URL(browser.wsEndpoint()).port })
    };
    
    const lighthouseResult = await lighthouseModule(url, lighthouseOptions);

    if (!lighthouseResult || !lighthouseResult.lhr) {
      throw new Error('Invalid Lighthouse result');
    }

    const audits = lighthouseResult.lhr.audits;
    const performanceScore = lighthouseResult.lhr.categories.performance.score;

    console.log('📊 Extracting Core Web Vitals metrics...');
    
    // Extract Core Web Vitals metrics
    const metrics: PageSpeedMetrics = {
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      tbt: audits['total-blocking-time']?.numericValue || 0,
      si: audits['speed-index']?.numericValue || 0
    };

    console.log('🎯 Calculating performance score and recommendations...');
    
    // Calculate our custom score (0-100) based on Lighthouse performance score
    let score = Math.round((performanceScore || 0) * 100);
    
    // Boost score to 100 if it's excellent (95+) and all Core Web Vitals are good
    if (score >= 95 && metrics.lcp <= 2500 && metrics.fcp <= 1800 && 
        metrics.cls <= 0.1 && metrics.tbt <= 200 && metrics.si <= 3400) {
      score = 100;
    }
    
    // Assign letter grade
    const grade = getLetterGrade(score);
    
    // Generate issues and recommendations
    const { issues, recommendations } = generateLighthouseRecommendations(metrics, audits);
    
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Lighthouse analysis completed in ${loadTime}ms with score: ${score}`);
    
    return {
      score,
      grade,
      metrics,
      lighthouseScore: Math.round((performanceScore || 0) * 100),
      issues,
      recommendations,
      loadTime
    };

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzeWithPuppeteer(
  url: string, 
  options: PageSpeedOptions, 
  startTime: number
): Promise<PageSpeedAnalysisResult> {
  // Import the Puppeteer-based analyzer
  const { analyzePageSpeedPuppeteer } = await import('./page-speed-puppeteer');
  
  try {
    const result = await analyzePageSpeedPuppeteer(url, options);
    
    // Convert to our expected format
    return {
      score: result.score,
      grade: result.grade,
      metrics: {
        lcp: result.metrics.lcp,
        fcp: result.metrics.fcp,
        cls: result.metrics.cls,
        tbt: result.metrics.tbt,
        si: result.metrics.loadComplete // Use load complete as SI approximation
      },
      lighthouseScore: result.score, // Use our score as lighthouse score
      issues: result.issues,
      recommendations: [...result.recommendations, 'Analysis performed using Puppeteer fallback (Lighthouse unavailable)'],
      loadTime: result.loadTime
    };
  } catch (error) {
    console.error('❌ Puppeteer fallback also failed:', error);
    const loadTime = Date.now() - startTime;
    
    // Provide more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isChromiumError = errorMessage.includes('libnss3.so') || errorMessage.includes('shared libraries');
    
    return {
      score: 0,
      grade: 'F',
      metrics: { lcp: 0, fcp: 0, cls: 0, tbt: 0, si: 0 },
      lighthouseScore: 0,
      issues: [
        'Page speed analysis unavailable', 
        isChromiumError ? 'Browser engine temporarily unavailable' : 'Analysis failed'
      ],
      recommendations: [
        isChromiumError 
          ? 'This is a temporary server issue - please try again in a few minutes'
          : 'Please check if the URL is accessible and try again',
        'Consider manual testing with Google PageSpeed Insights as an alternative'
      ],
      loadTime
    };
  }
}

function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateLighthouseRecommendations(
  metrics: PageSpeedMetrics, 
  audits: any
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // LCP (Largest Contentful Paint) analysis
  if (metrics.lcp > 4000) {
    issues.push(`Poor LCP: ${Math.round(metrics.lcp)}ms (should be ≤ 2500ms)`);
    recommendations.push('Optimize largest content element loading (LCP > 4000ms)');
  } else if (metrics.lcp > 2500) {
    issues.push(`Slow LCP: ${Math.round(metrics.lcp)}ms (should be ≤ 2500ms)`);
    recommendations.push('Improve largest content element loading time');
  } else if (metrics.lcp > 1500) {
    issues.push(`Moderate LCP: ${Math.round(metrics.lcp)}ms (good but could be better)`);
    recommendations.push('Consider optimizing LCP further for excellent performance');
  }

  // FCP (First Contentful Paint) analysis
  if (metrics.fcp > 3000) {
    issues.push(`Poor FCP: ${Math.round(metrics.fcp)}ms (should be ≤ 1800ms)`);
    recommendations.push('Optimize initial content rendering');
  } else if (metrics.fcp > 1800) {
    issues.push(`Slow FCP: ${Math.round(metrics.fcp)}ms (should be ≤ 1800ms)`);
    recommendations.push('Improve first content paint time');
  }

  // CLS (Cumulative Layout Shift) analysis
  if (metrics.cls > 0.25) {
    issues.push(`Poor CLS: ${metrics.cls.toFixed(3)} (should be ≤ 0.1)`);
    recommendations.push('Minimize layout shifts (CLS > 0.25)');
  } else if (metrics.cls > 0.1) {
    issues.push(`High CLS: ${metrics.cls.toFixed(3)} (should be ≤ 0.1)`);
    recommendations.push('Reduce unexpected layout shifts');
  }

  // TBT (Total Blocking Time) analysis
  if (metrics.tbt > 600) {
    issues.push(`Poor TBT: ${Math.round(metrics.tbt)}ms (should be ≤ 200ms)`);
    recommendations.push('Reduce main thread blocking time (TBT > 600ms)');
  } else if (metrics.tbt > 300) {
    issues.push(`High TBT: ${Math.round(metrics.tbt)}ms (should be ≤ 200ms)`);
    recommendations.push('Reduce main thread blocking time (TBT > 300ms)');
  } else if (metrics.tbt > 50) {
    recommendations.push('Fine-tune JavaScript execution for optimal blocking time');
  }

  // Speed Index analysis
  if (metrics.si > 5800) {
    issues.push(`Poor Speed Index: ${Math.round(metrics.si)}ms (should be ≤ 3400ms)`);
    recommendations.push('Optimize visual content loading speed');
  } else if (metrics.si > 3400) {
    issues.push(`Slow Speed Index: ${Math.round(metrics.si)}ms (should be ≤ 3400ms)`);
    recommendations.push('Improve visual loading performance');
  }

  // Add general recommendations if no specific issues
  if (issues.length === 0) {
    recommendations.push('Excellent performance! Consider monitoring Core Web Vitals regularly');
  }

  return { issues, recommendations };
}