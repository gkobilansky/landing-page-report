import puppeteer from 'puppeteer';

export interface PageSpeedMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  fcp: number; // First Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time (ms)
  domContentLoaded: number; // DOMContentLoaded time (ms)
  loadComplete: number; // Load complete time (ms)
  resourceCount: number; // Total resources loaded
  totalSize: number; // Total page size (bytes)
}

export interface PageSpeedAnalysisResult {
  score: number; // 0-100 overall performance score
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: PageSpeedMetrics;
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

export async function analyzePageSpeedPuppeteer(
  url: string, 
  options: PageSpeedOptions = {}
): Promise<PageSpeedAnalysisResult> {
  console.log(`🚀 Starting Puppeteer-based page speed analysis for: ${url}`);
  const startTime = Date.now();
  
  let browser;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const timeout = options.timeout || 60000;

    console.log('📱 Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport(viewport);

    // Set up performance tracking
    console.log('📊 Setting up performance tracking...');
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();

    // Track navigation timing and paint metrics
    const navigationStart = Date.now();
    
    console.log('🌐 Navigating to URL and measuring performance...');
    
    // Navigate and collect timing data
    const response = await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout 
    });

    if (!response) {
      throw new Error('Failed to load page');
    }

    // Wait for potential dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract performance metrics using browser APIs
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      let fcp = 0;
      let lcp = 0;
      
      // Get First Contentful Paint
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        fcp = fcpEntry.startTime;
      }

      // Get Largest Contentful Paint (approximated)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'largest-contentful-paint') {
            lcp = (entry as any).startTime;
          }
        }
      });

      // Check for layout shift events (CLS approximation)
      let cls = 0;
      try {
        // This is a simplified CLS calculation
        const layoutShiftEntries = performance.getEntriesByType('layout-shift') as any[];
        if (layoutShiftEntries.length > 0) {
          cls = layoutShiftEntries.reduce((sum, entry) => sum + entry.value, 0);
        }
      } catch (e) {
        // Layout shift API not available
        cls = 0;
      }

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        fcp: fcp || (navigation.responseEnd - navigation.fetchStart), // Fallback
        lcp: lcp || (navigation.loadEventEnd - navigation.fetchStart), // Fallback
        cls: cls,
        responseTime: navigation.responseEnd - navigation.fetchStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart
      };
    });

    // Get resource information
    const resources = await page.evaluate(() => {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let totalSize = 0;
      let resourceCount = resourceEntries.length;
      
      // Estimate total size based on transfer sizes where available
      resourceEntries.forEach(resource => {
        if ((resource as any).transferSize) {
          totalSize += (resource as any).transferSize;
        } else {
          // Fallback estimation based on resource type
          const resourceType = resource.initiatorType;
          switch (resourceType) {
            case 'img': totalSize += 50000; break; // ~50KB average
            case 'script': totalSize += 30000; break; // ~30KB average
            case 'link': totalSize += 10000; break; // ~10KB average
            default: totalSize += 5000; break; // ~5KB average
          }
        }
      });

      return { resourceCount, totalSize };
    });

    // Calculate TBT approximation (simplified)
    const tbt = Math.max(0, performanceMetrics.domInteractive - performanceMetrics.fcp - 50);

    // Compile final metrics
    const metrics: PageSpeedMetrics = {
      lcp: Math.round(performanceMetrics.lcp),
      fcp: Math.round(performanceMetrics.fcp),
      cls: Math.round(performanceMetrics.cls * 1000) / 1000, // Round to 3 decimal places
      tbt: Math.round(tbt),
      domContentLoaded: Math.round(performanceMetrics.domContentLoaded),
      loadComplete: Math.round(performanceMetrics.loadComplete),
      resourceCount: resources.resourceCount,
      totalSize: resources.totalSize
    };

    console.log('🎯 Calculating performance score and recommendations...');
    
    // Calculate score based on metrics
    const score = calculatePerformanceScore(metrics);
    const grade = getLetterGrade(score);
    const { issues, recommendations } = generateRecommendations(metrics);
    
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Puppeteer page speed analysis completed in ${loadTime}ms with score: ${score}`);
    
    return {
      score,
      grade,
      metrics,
      issues,
      recommendations,
      loadTime
    };

  } catch (error) {
    console.error('❌ Puppeteer page speed analysis failed:', error);
    throw new Error(`Failed to analyze page speed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function calculatePerformanceScore(metrics: PageSpeedMetrics): number {
  let score = 100;

  // LCP scoring (weight: 25%)
  if (metrics.lcp > 4000) score -= 25;
  else if (metrics.lcp > 2500) score -= 15;
  else if (metrics.lcp > 1500) score -= 5;

  // FCP scoring (weight: 20%)
  if (metrics.fcp > 3000) score -= 20;
  else if (metrics.fcp > 1800) score -= 12;
  else if (metrics.fcp > 1000) score -= 4;

  // CLS scoring (weight: 15%)
  if (metrics.cls > 0.25) score -= 15;
  else if (metrics.cls > 0.1) score -= 8;
  else if (metrics.cls > 0.05) score -= 3;

  // TBT scoring (weight: 15%)
  if (metrics.tbt > 600) score -= 15;
  else if (metrics.tbt > 300) score -= 10;
  else if (metrics.tbt > 150) score -= 5;

  // Resource count penalty (weight: 10%)
  if (metrics.resourceCount > 100) score -= 10;
  else if (metrics.resourceCount > 50) score -= 5;

  // Page size penalty (weight: 15%)
  const sizeMB = metrics.totalSize / (1024 * 1024);
  if (sizeMB > 5) score -= 15;
  else if (sizeMB > 3) score -= 10;
  else if (sizeMB > 2) score -= 5;

  return Math.max(0, Math.round(score));
}

function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateRecommendations(
  metrics: PageSpeedMetrics
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // LCP analysis
  if (metrics.lcp > 4000) {
    issues.push(`Poor LCP: ${metrics.lcp}ms (should be ≤ 2500ms)`);
    recommendations.push('Optimize largest content element (images, hero sections)');
    recommendations.push('Use image optimization and modern formats (WebP/AVIF)');
    recommendations.push('Implement lazy loading for below-fold content');
  } else if (metrics.lcp > 2500) {
    issues.push(`Slow LCP: ${metrics.lcp}ms (should be ≤ 2500ms)`);
    recommendations.push('Consider optimizing above-fold images and content');
  }

  // FCP analysis
  if (metrics.fcp > 3000) {
    issues.push(`Poor FCP: ${metrics.fcp}ms (should be ≤ 1800ms)`);
    recommendations.push('Minimize render-blocking resources (CSS/JS)');
    recommendations.push('Use critical CSS inlining');
  } else if (metrics.fcp > 1800) {
    issues.push(`Slow FCP: ${metrics.fcp}ms (should be ≤ 1800ms)`);
    recommendations.push('Optimize CSS delivery and reduce JavaScript execution time');
  }

  // CLS analysis
  if (metrics.cls > 0.25) {
    issues.push(`Poor CLS: ${metrics.cls.toFixed(3)} (should be ≤ 0.1)`);
    recommendations.push('Add size attributes to images and videos');
    recommendations.push('Reserve space for dynamic content and ads');
  } else if (metrics.cls > 0.1) {
    issues.push(`High CLS: ${metrics.cls.toFixed(3)} (should be ≤ 0.1)`);
    recommendations.push('Minimize layout shifts from dynamic content');
  }

  // Resource count analysis
  if (metrics.resourceCount > 100) {
    issues.push(`Too many resources: ${metrics.resourceCount} (consider bundling)`);
    recommendations.push('Bundle and minify CSS/JS files');
    recommendations.push('Use image sprites for small icons');
  }

  // Page size analysis
  const sizeMB = Math.round((metrics.totalSize / (1024 * 1024)) * 10) / 10;
  if (sizeMB > 5) {
    issues.push(`Large page size: ${sizeMB}MB (should be < 3MB)`);
    recommendations.push('Optimize and compress images');
    recommendations.push('Minify and compress CSS/JS files');
    recommendations.push('Enable gzip/brotli compression');
  } else if (sizeMB > 3) {
    issues.push(`Moderate page size: ${sizeMB}MB (could be optimized)`);
    recommendations.push('Consider further image optimization');
  }

  // Add general recommendations if performance is good
  if (issues.length === 0) {
    recommendations.push('Excellent performance! Monitor regularly and maintain optimization practices');
  }

  return { issues, recommendations };
}