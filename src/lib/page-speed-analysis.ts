import type { Browser } from 'puppeteer-core';
import { analyzePageSpeedPuppeteer } from './page-speed-puppeteer';

export interface PageSpeedMetrics {
  loadTime: number; // Page load time in seconds (marketing-friendly)
  speedDescription: string; // Marketing-friendly description
  relativeTo: string; // Comparison to other websites
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
  puppeteer?: {
    browser?: Browser;
    forceBrowserless?: boolean;
  };
}

export async function analyzePageSpeed(
  url: string, 
  options: PageSpeedOptions = {}
): Promise<PageSpeedAnalysisResult> {
  console.log(`🚀 Starting page speed analysis for: ${url}`);
  const startTime = Date.now();
  
  try {
    const result = await analyzePageSpeedPuppeteer(url, options);
    
    // Convert to marketing-friendly format
    const marketingMetrics = convertToMarketingMetrics(result.metrics, result.score);
    const marketingIssues = convertToMarketingIssues(result.issues);
    const marketingRecommendations = convertToMarketingRecommendations(result.recommendations);
    
    return {
      score: result.score,
      metrics: marketingMetrics,
      issues: marketingIssues,
      recommendations: marketingRecommendations,
      loadTime: result.loadTime
    };
  } catch (error) {
    console.error('❌ Page speed analysis failed:', error);
    const loadTime = Date.now() - startTime;
    
    // Provide user-friendly error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isBrowserlessError = errorMessage.includes('Browserless connection failed') || errorMessage.includes('WebSocket');
    const isChromiumError = errorMessage.includes('libnss3.so') || errorMessage.includes('shared libraries');
    
    return {
      score: 0,
      metrics: {
        loadTime: 0,
        speedDescription: 'Unable to measure',
        relativeTo: 'Analysis unavailable'
      },
      issues: [
        'Page speed analysis temporarily unavailable', 
        isBrowserlessError ? 'Our speed testing service is temporarily down' : 
        isChromiumError ? 'Speed testing temporarily unavailable' : 'Unable to analyze this page'
      ],
      recommendations: [
        'Please try again in a few minutes',
        'You can manually test with Google PageSpeed Insights as an alternative'
      ],
      loadTime
    };
  }
}

function convertToMarketingMetrics(
  technicalMetrics: any,
  score: number
): PageSpeedMetrics {
  // Convert load time to user-friendly seconds
  const loadTimeSeconds = Math.round((technicalMetrics.lcp || technicalMetrics.loadComplete) / 1000 * 10) / 10;
  
  let speedDescription: string;
  let relativeTo: string;
  
  // Prioritize score-based descriptions, but enhance with load time details
  if (score >= 90) {
    speedDescription = loadTimeSeconds <= 1 ? 'Lightning fast - loads instantly' : 'Lightning fast';
    relativeTo = 'Faster than 90% of websites';
  } else if (score >= 80) {
    speedDescription = loadTimeSeconds <= 2 ? 'Very fast - loads quickly' : 'Very fast';
    relativeTo = 'Faster than 75% of websites';
  } else if (score >= 70) {
    speedDescription = loadTimeSeconds <= 3 ? 'Good speed - loads reasonably fast' : 'Good speed';
    relativeTo = 'Faster than 60% of websites';
  } else if (score >= 60) {
    speedDescription = 'Moderate speed';
    relativeTo = 'Average website speed';
  } else {
    speedDescription = loadTimeSeconds > 5 ? 'Slow - may lose visitors' : 'Needs improvement';
    relativeTo = 'Slower than most websites';
  }
  
  return {
    loadTime: loadTimeSeconds,
    speedDescription,
    relativeTo
  };
}

function convertToMarketingIssues(technicalIssues: string[]): string[] {
  return technicalIssues.map(issue => {
    // Convert technical language to marketing language
    if (issue.includes('LCP')) {
      return 'Main content loads slowly - visitors may leave before seeing your page';
    }
    if (issue.includes('FCP')) {
      return 'Page takes too long to show content - impacts first impressions';
    }
    if (issue.includes('CLS')) {
      return 'Page elements shift around - creates confusing user experience';
    }
    if (issue.includes('resources') || issue.includes('size')) {
      return 'Page is heavy with too many files - slows down loading';
    }
    if (issue.includes('TBT')) {
      return 'Page becomes unresponsive during loading - frustrates users';
    }
    return issue; // Keep as-is if no specific mapping
  }).filter((issue, index, array) => array.indexOf(issue) === index); // Remove duplicates
}

function convertToMarketingRecommendations(technicalRecs: string[]): string[] {
  const marketingRecs = technicalRecs.map(rec => {
    // Convert technical recommendations to marketing language
    if (rec.includes('image') || rec.includes('WebP') || rec.includes('AVIF')) {
      return 'Optimize images to load faster and keep visitors engaged';
    }
    if (rec.includes('CSS') || rec.includes('JavaScript') || rec.includes('JS')) {
      return 'Optimize code delivery to improve user experience';
    }
    if (rec.includes('layout shift') || rec.includes('size attributes') || rec.includes('Add size attributes')) {
      return 'Prevent content from jumping around to improve user experience';
    }
    if (rec.includes('bundle') || rec.includes('minify') || rec.includes('compress')) {
      return 'Reduce file sizes to make your page load faster';
    }
    if (rec.includes('lazy loading')) {
      return 'Load content as users scroll to improve initial page speed';
    }
    if (rec.includes('Excellent performance')) {
      return 'Great job! Your page loads fast enough to keep visitors happy';
    }
    return rec; // Keep as-is if no specific mapping
  }).filter((rec, index, array) => array.indexOf(rec) === index); // Remove duplicates
  
  // Add business-focused recommendations
  if (marketingRecs.length === 1 && marketingRecs[0].includes('Great job')) {
    marketingRecs.push('Monitor your page speed regularly to maintain this excellent performance');
    marketingRecs.push('Fast loading pages improve SEO rankings and conversion rates');
  }
  
  return marketingRecs;
}
