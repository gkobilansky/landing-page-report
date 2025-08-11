import { createPuppeteerBrowser } from './puppeteer-config';

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
    
    browser = await createPuppeteerBrowser();

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
    const { issues, recommendations } = generateRecommendations(metrics);
    
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Puppeteer page speed analysis completed in ${loadTime}ms with score: ${score}`);
    
    return {
      score,
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

function generateRecommendations(
  metrics: PageSpeedMetrics
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Convert load time to seconds for easier understanding
  const loadTimeSeconds = Math.round(metrics.lcp / 1000 * 10) / 10;

  // LCP analysis with marketing language
  if (metrics.lcp > 4000) {
    issues.push(`Slow loading - visitors may leave before seeing your content`);
    recommendations.push('Optimize your main images and content to load faster');
    recommendations.push('Use modern image formats to reduce loading time');
    recommendations.push('Consider professional image optimization services');
  } else if (metrics.lcp > 2500) {
    issues.push(`Moderate loading speed - room for improvement`);
    recommendations.push('Optimize above-the-fold content to improve first impressions');
  }

  // FCP analysis with marketing focus
  if (metrics.fcp > 3000) {
    issues.push(`Takes too long to show content - impacts user experience`);
    recommendations.push('Streamline your page code to show content faster');
    recommendations.push('Remove unnecessary scripts that slow down loading');
  } else if (metrics.fcp > 1800) {
    issues.push(`Content appears slowly - could be faster`);
    recommendations.push('Optimize code delivery for better user experience');
  }

  // CLS analysis with user experience focus
  if (metrics.cls > 0.25) {
    issues.push(`Page content jumps around - creates confusing experience`);
    recommendations.push('Fix layout shifts to improve user experience');
    recommendations.push('Reserve proper space for images and dynamic content');
  } else if (metrics.cls > 0.1) {
    issues.push(`Some content shifting detected - minor user experience issue`);
    recommendations.push('Minimize unexpected content movements');
  }

  // Resource count analysis
  if (metrics.resourceCount > 100) {
    issues.push(`Too many files slow down your page - simplify for better performance`);
    recommendations.push('Combine and optimize your website files');
    recommendations.push('Remove unnecessary plugins and scripts');
  }

  // Page size analysis with business impact
  const sizeMB = Math.round((metrics.totalSize / (1024 * 1024)) * 10) / 10;
  if (sizeMB > 5) {
    issues.push(`Heavy page (${sizeMB}MB) - visitors on mobile may struggle`);
    recommendations.push('Compress images and files to improve mobile experience');
    recommendations.push('Consider a faster hosting solution');
    recommendations.push('Mobile users may abandon slow-loading pages');
  } else if (sizeMB > 3) {
    issues.push(`Moderate page size (${sizeMB}MB) - could be lighter`);
    recommendations.push('Further optimize images for better mobile performance');
  }

  // Add business-focused recommendations for good performance
  if (issues.length === 0) {
    recommendations.push('Excellent performance! Your page loads fast enough to keep visitors engaged');
    recommendations.push('Fast loading pages improve SEO rankings and conversion rates');
    recommendations.push('Monitor performance regularly to maintain this competitive advantage');
  }

  return { issues, recommendations };
}