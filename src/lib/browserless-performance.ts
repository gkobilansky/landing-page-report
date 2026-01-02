/**
 * Browserless Performance API Client
 *
 * Uses Browserless.io's /performance REST API endpoint to get Lighthouse-based
 * performance metrics. This is more accurate than manual browser Performance API
 * measurements.
 *
 * @see https://docs.browserless.io/rest-apis/performance
 */

export interface BrowserlessPerformanceMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  fcp: number; // First Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time (ms)
  ttfb: number; // Time to First Byte (ms)
  speedIndex: number; // Speed Index (ms)
  performanceScore: number; // 0-100 Lighthouse performance score
}

export interface BrowserlessPerformanceResult {
  metrics: BrowserlessPerformanceMetrics;
  rawAudits?: Record<string, any>;
}

interface LighthouseAudit {
  id: string;
  title: string;
  score: number | null;
  numericValue?: number;
  displayValue?: string;
}

interface LighthouseCategory {
  id: string;
  title: string;
  score: number | null;
}

interface LighthouseResponse {
  audits: Record<string, LighthouseAudit>;
  categories?: Record<string, LighthouseCategory>;
}

/**
 * Fetches performance metrics using the Browserless /performance API
 */
export async function fetchBrowserlessPerformance(
  url: string,
  options: {
    token: string;
    timeout?: number;
  }
): Promise<BrowserlessPerformanceResult> {
  const { token, timeout = 60000 } = options;

  const endpoint = `https://production-sfo.browserless.io/performance?token=${token}`;

  console.log('📊 Fetching performance metrics from Browserless API...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        config: {
          extends: 'lighthouse:default',
          settings: {
            onlyCategories: ['performance'],
            // Use desktop settings for consistent measurements
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              width: 1920,
              height: 1080,
              deviceScaleFactor: 1,
            },
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless API error (${response.status}): ${errorText}`);
    }

    const data: LighthouseResponse = await response.json();

    // Extract metrics from Lighthouse audits
    const metrics = extractMetricsFromAudits(data);

    console.log('✅ Browserless performance metrics retrieved successfully');

    return {
      metrics,
      rawAudits: data.audits,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Browserless performance API timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Extracts standardized metrics from Lighthouse audit response
 */
function extractMetricsFromAudits(data: LighthouseResponse): BrowserlessPerformanceMetrics {
  const audits = data.audits;

  // Helper to safely get numeric value from audit
  const getNumericValue = (auditId: string): number => {
    const audit = audits[auditId];
    if (!audit) return 0;
    return audit.numericValue ?? 0;
  };

  // Helper to get score (0-1) and convert to 0-100
  const getScore = (auditId: string): number => {
    const audit = audits[auditId];
    if (!audit || audit.score === null) return 0;
    return Math.round(audit.score * 100);
  };

  // Extract Core Web Vitals and performance metrics
  const lcp = getNumericValue('largest-contentful-paint');
  const fcp = getNumericValue('first-contentful-paint');
  const cls = getNumericValue('cumulative-layout-shift');
  const tbt = getNumericValue('total-blocking-time');
  const ttfb = getNumericValue('server-response-time');
  const speedIndex = getNumericValue('speed-index');

  // Get overall performance score from categories if available
  let performanceScore = 0;
  if (data.categories?.performance?.score !== null && data.categories?.performance?.score !== undefined) {
    performanceScore = Math.round(data.categories.performance.score * 100);
  } else {
    // Fallback: calculate score based on metrics
    performanceScore = calculateFallbackScore({ lcp, fcp, cls, tbt, speedIndex });
  }

  return {
    lcp: Math.round(lcp),
    fcp: Math.round(fcp),
    cls: Math.round(cls * 1000) / 1000, // Round to 3 decimal places
    tbt: Math.round(tbt),
    ttfb: Math.round(ttfb),
    speedIndex: Math.round(speedIndex),
    performanceScore,
  };
}

/**
 * Fallback score calculation if Lighthouse doesn't return a category score
 */
function calculateFallbackScore(metrics: {
  lcp: number;
  fcp: number;
  cls: number;
  tbt: number;
  speedIndex: number;
}): number {
  let score = 100;

  // LCP scoring (weight: 25%)
  if (metrics.lcp > 4000) score -= 25;
  else if (metrics.lcp > 2500) score -= 15;
  else if (metrics.lcp > 1500) score -= 5;

  // FCP scoring (weight: 15%)
  if (metrics.fcp > 3000) score -= 15;
  else if (metrics.fcp > 1800) score -= 10;
  else if (metrics.fcp > 1000) score -= 3;

  // CLS scoring (weight: 25%)
  if (metrics.cls > 0.25) score -= 25;
  else if (metrics.cls > 0.1) score -= 15;
  else if (metrics.cls > 0.05) score -= 5;

  // TBT scoring (weight: 25%)
  if (metrics.tbt > 600) score -= 25;
  else if (metrics.tbt > 300) score -= 15;
  else if (metrics.tbt > 150) score -= 5;

  // Speed Index scoring (weight: 10%)
  if (metrics.speedIndex > 5800) score -= 10;
  else if (metrics.speedIndex > 4300) score -= 5;

  return Math.max(0, Math.round(score));
}

/**
 * Checks if Browserless performance API is available
 */
export function isBrowserlessAvailable(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasToken = !!process.env.BLESS_KEY;
  return isProduction && hasToken;
}
