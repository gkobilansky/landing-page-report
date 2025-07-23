import { createPuppeteerBrowser } from './puppeteer-config';

// Conditional import for Jimp to avoid test environment issues
let Jimp: any;
if (process.env.NODE_ENV !== 'test') {
  Jimp = require('jimp');
}

export interface ElementDensityAnalysis {
  gridSections: number;
  elementDensityPerSection: number[];
  maxDensity: number;
  averageDensity: number;
  totalElements: number;
}

export interface SpacingAnalysis {
  headlineSpacing: {
    marginTop: number;
    marginBottom: number;
    adequate: boolean;
  };
  ctaSpacing: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    adequate: boolean;
  };
  contentBlockSpacing: {
    averageMarginBetween: number;
    adequate: boolean;
  };
  lineHeight: {
    average: number;
    adequate: boolean;
  };
}

export interface ScreenshotAnalysis {
  totalPixels: number;
  contentPixels: number;
  whitespacePixels: number;
  visualWhitespaceRatio: number;
  threshold: number;
}

export interface WhitespaceMetrics {
  whitespaceRatio: number; // Percentage of page that is whitespace
  elementDensityPerSection: ElementDensityAnalysis;
  spacingAnalysis: SpacingAnalysis;
  screenshotAnalysis: ScreenshotAnalysis;
  clutterScore: number; // 0-100, higher = more cluttered
  hasAdequateSpacing: boolean;
}

export interface WhitespaceAnalysisResult {
  score: number; // 0-100 overall whitespace score
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: WhitespaceMetrics;
  issues: string[];
  recommendations: string[];
  loadTime: number; // Total analysis time in ms
}

interface WhitespaceOptions {
  viewport?: {
    width: number;
    height: number;
  };
  isHtml?: boolean; // Flag to indicate if input is HTML instead of URL
  gridColumns?: number; // Number of grid columns for density analysis
  gridRows?: number; // Number of grid rows for density analysis
  useScreenshot?: boolean; // Use screenshot-based analysis (default: true)
  pixelThreshold?: number; // Pixel intensity threshold for content detection (0-255, default: 240)
  screenshotUrl?: string; // Use existing screenshot instead of capturing new one
  puppeteer?: {
    forceBrowserless?: boolean;
  };
}

async function analyzeScreenshotWhitespace(
  pageOrScreenshotUrl: any | string, 
  threshold: number = 240,
  isScreenshotUrl: boolean = false
): Promise<ScreenshotAnalysis> {
  console.log(`📸 Analyzing screenshot for pixel-level whitespace analysis (threshold: ${threshold})...`);
  
  let screenshotBuffer: Buffer;
  
  if (isScreenshotUrl && typeof pageOrScreenshotUrl === 'string') {
    // Use existing screenshot from URL
    console.log(`🔗 Fetching existing screenshot from: ${pageOrScreenshotUrl}`);
    const response = await fetch(pageOrScreenshotUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch screenshot: ${response.statusText}`);
    }
    screenshotBuffer = Buffer.from(await response.arrayBuffer());
  } else {
    // Capture new screenshot from page
    const page = pageOrScreenshotUrl;
    const isProduction = process.env.NODE_ENV === 'production';
    const browserlessKey = process.env.BLESS_KEY;
    
    if (isProduction && browserlessKey) {
      // Use Browserless screenshot API for production
      const url = await page.url();
      const viewport = page.viewport();
      
      const screenshotResponse = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          options: {
            viewport: {
              width: viewport?.width || 1920,
              height: viewport?.height || 1080
            },
            type: 'png',
            fullPage: true // Use full page for better whitespace analysis
          }
        })
      });
      
      if (!screenshotResponse.ok) {
        throw new Error(`Screenshot API failed: ${screenshotResponse.statusText}`);
      }
      
      screenshotBuffer = Buffer.from(await screenshotResponse.arrayBuffer());
    } else {
      // Use Puppeteer screenshot for local development
      screenshotBuffer = await page.screenshot({ 
        type: 'png',
        fullPage: true // Use full page for better whitespace analysis
      });
    }
  }
  
  
  console.log('🔍 Processing screenshot for pixel analysis...');
  
  // Load and process the image with Jimp
  const img = await Jimp.read(screenshotBuffer);
  const { width, height } = img.bitmap;
  
  let contentPixels = 0;
  const totalPixels = width * height;
  
  // Process every pixel
  img.scan(0, 0, width, height, (x: number, y: number, idx: number) => {
    // Get RGBA values from bitmap data
    const r = img.bitmap.data[idx];
    const g = img.bitmap.data[idx + 1];
    const b = img.bitmap.data[idx + 2];
    // Skip alpha channel (img.bitmap.data[idx + 3])
    
    // Convert to grayscale using luminance formula
    const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // If pixel is darker than threshold, it's "content"
    if (grayscale < threshold) {
      contentPixels++;
    }
  });
  
  const whitespacePixels = totalPixels - contentPixels;
  const visualWhitespaceRatio = whitespacePixels / totalPixels;
  
  console.log(`📊 Screenshot analysis: ${totalPixels} total pixels, ${contentPixels} content pixels (${Math.round((1 - visualWhitespaceRatio) * 100)}% content), ${Math.round(visualWhitespaceRatio * 100)}% whitespace`);
  
  return {
    totalPixels,
    contentPixels,
    whitespacePixels,
    visualWhitespaceRatio,
    threshold
  };
}

export async function analyzeWhitespace(
  urlOrHtml: string, 
  options: WhitespaceOptions = {}
): Promise<WhitespaceAnalysisResult> {
  console.log(`🚀 Starting whitespace assessment for: ${options.isHtml ? 'HTML content' : urlOrHtml}`);
  const startTime = Date.now();
  
  let browser;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const isHtml = options.isHtml || false;
    const gridColumns = options.gridColumns || 3;
    const gridRows = options.gridRows || 4;

    console.log('📱 Launching Puppeteer browser...');
    
    browser = await createPuppeteerBrowser(options.puppeteer || {});

    const page = await browser.newPage();
    await page.setViewport(viewport);

    console.log('🌐 Navigating to content...');
    if (isHtml) {
      await page.setContent(urlOrHtml);
    } else {
      await page.goto(urlOrHtml, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      });
    }

    // Wait for potential dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Analyzing element density per grid section...');
    
    // 1. Grid-based element density analysis (PRD requirement)
    const densityAnalysis = await page.evaluate((cols: number, rows: number) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const sectionWidth = viewportWidth / cols;
      const sectionHeight = viewportHeight / rows;
      
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               rect.top >= 0 && rect.top < viewportHeight;
      });

      const elementDensityPerSection: number[] = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const sectionLeft = col * sectionWidth;
          const sectionTop = row * sectionHeight;
          const sectionRight = sectionLeft + sectionWidth;
          const sectionBottom = sectionTop + sectionHeight;
          
          let elementsInSection = 0;
          
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;
            
            if (elementCenterX >= sectionLeft && elementCenterX < sectionRight &&
                elementCenterY >= sectionTop && elementCenterY < sectionBottom) {
              elementsInSection++;
            }
          });
          
          elementDensityPerSection.push(elementsInSection);
        }
      }

      const maxDensity = Math.max(...elementDensityPerSection);
      const averageDensity = elementDensityPerSection.reduce((sum, density) => sum + density, 0) / elementDensityPerSection.length;

      return {
        gridSections: cols * rows,
        elementDensityPerSection,
        maxDensity,
        averageDensity,
        totalElements: elements.length,
        viewportWidth,
        viewportHeight
      };
    }, gridColumns, gridRows);

    console.log('📏 Analyzing spacing around key elements...');
    
    // 2. Spacing analysis around key elements (PRD requirement)
    const spacingAnalysis = await page.evaluate(() => {
      // Analyze headline spacing
      const headlines = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let totalHeadlineMarginTop = 0;
      let totalHeadlineMarginBottom = 0;
      let headlineCount = 0;

      headlines.forEach(headline => {
        const computedStyle = window.getComputedStyle(headline);
        const marginTop = parseFloat(computedStyle.marginTop) || 0;
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
        
        if (marginTop > 0 || marginBottom > 0) {
          totalHeadlineMarginTop += marginTop;
          totalHeadlineMarginBottom += marginBottom;
          headlineCount++;
        }
      });

      const avgHeadlineMarginTop = headlineCount > 0 ? totalHeadlineMarginTop / headlineCount : 0;
      const avgHeadlineMarginBottom = headlineCount > 0 ? totalHeadlineMarginBottom / headlineCount : 0;

      // Analyze CTA spacing
      const ctas = Array.from(document.querySelectorAll('button, [class*="cta"], [class*="btn"], input[type="submit"]'));
      let totalCtaMarginTop = 0;
      let totalCtaMarginBottom = 0;
      let totalCtaMarginLeft = 0;
      let totalCtaMarginRight = 0;
      let ctaCount = 0;

      ctas.forEach(cta => {
        const computedStyle = window.getComputedStyle(cta);
        totalCtaMarginTop += parseFloat(computedStyle.marginTop) || 0;
        totalCtaMarginBottom += parseFloat(computedStyle.marginBottom) || 0;
        totalCtaMarginLeft += parseFloat(computedStyle.marginLeft) || 0;
        totalCtaMarginRight += parseFloat(computedStyle.marginRight) || 0;
        ctaCount++;
      });

      const avgCtaMarginTop = ctaCount > 0 ? totalCtaMarginTop / ctaCount : 0;
      const avgCtaMarginBottom = ctaCount > 0 ? totalCtaMarginBottom / ctaCount : 0;
      const avgCtaMarginLeft = ctaCount > 0 ? totalCtaMarginLeft / ctaCount : 0;
      const avgCtaMarginRight = ctaCount > 0 ? totalCtaMarginRight / ctaCount : 0;

      // Analyze content block spacing
      const contentBlocks = Array.from(document.querySelectorAll('div, section, article, p'));
      let totalContentMargin = 0;
      let contentBlockCount = 0;

      contentBlocks.forEach(block => {
        const computedStyle = window.getComputedStyle(block);
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
        if (marginBottom > 0) {
          totalContentMargin += marginBottom;
          contentBlockCount++;
        }
      });

      const avgContentBlockMargin = contentBlockCount > 0 ? totalContentMargin / contentBlockCount : 0;

      // Analyze line height
      const textElements = Array.from(document.querySelectorAll('p, div, span, li, td, th')).filter(el => {
        return el.textContent && el.textContent.trim().length > 20; // Only elements with substantial text
      });
      
      let totalLineHeight = 0;
      let textElementCount = 0;

      textElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const lineHeight = computedStyle.lineHeight;
        const fontSize = parseFloat(computedStyle.fontSize) || 16;
        
        let lineHeightValue;
        if (lineHeight === 'normal') {
          lineHeightValue = 1.2; // Browser default
        } else if (lineHeight.includes('px')) {
          lineHeightValue = parseFloat(lineHeight) / fontSize;
        } else {
          lineHeightValue = parseFloat(lineHeight) || 1.2;
        }
        
        if (lineHeightValue > 0.8 && lineHeightValue < 3) { // Reasonable bounds
          totalLineHeight += lineHeightValue;
          textElementCount++;
        }
      });

      const avgLineHeight = textElementCount > 0 ? totalLineHeight / textElementCount : 1.2;

      return {
        headlineSpacing: {
          marginTop: avgHeadlineMarginTop,
          marginBottom: avgHeadlineMarginBottom,
          adequate: avgHeadlineMarginTop >= 16 && avgHeadlineMarginBottom >= 12
        },
        ctaSpacing: {
          marginTop: avgCtaMarginTop,
          marginBottom: avgCtaMarginBottom,
          marginLeft: avgCtaMarginLeft,
          marginRight: avgCtaMarginRight,
          adequate: avgCtaMarginTop >= 20 && avgCtaMarginBottom >= 20
        },
        contentBlockSpacing: {
          averageMarginBetween: avgContentBlockMargin,
          adequate: avgContentBlockMargin >= 16
        },
        lineHeight: {
          average: avgLineHeight,
          adequate: avgLineHeight >= 1.4
        }
      };
    });

    console.log('📸 Taking screenshot for visual analysis...');
    
    // 3. Screenshot-based whitespace analysis (more accurate than DOM-based)
    let screenshotAnalysis: ScreenshotAnalysis;
    
    if (options.useScreenshot !== false) {
      try {
        if (options.screenshotUrl) {
          // Use existing screenshot
          console.log(`📷 Using existing screenshot: ${options.screenshotUrl}`);
          screenshotAnalysis = await analyzeScreenshotWhitespace(
            options.screenshotUrl, 
            options.pixelThreshold || 240, 
            true
          );
        } else {
          // Capture new screenshot
          screenshotAnalysis = await analyzeScreenshotWhitespace(
            page, 
            options.pixelThreshold || 240, 
            false
          );
        }
      } catch (error) {
        console.warn('⚠️ Screenshot analysis failed, falling back to DOM-based analysis:', error);
        screenshotAnalysis = {
          totalPixels: viewport.width * viewport.height,
          contentPixels: 0,
          whitespacePixels: 0,
          visualWhitespaceRatio: 0,
          threshold: options.pixelThreshold || 240
        };
      }
    } else {
      screenshotAnalysis = {
        totalPixels: viewport.width * viewport.height,
        contentPixels: 0,
        whitespacePixels: 0,
        visualWhitespaceRatio: 0,
        threshold: options.pixelThreshold || 240
      };
    }

    console.log('🔍 Calculating overall whitespace metrics...');
    
    // 4. Overall whitespace calculation using point sampling approach (fallback)
    const overallMetrics = await page.evaluate(() => {
      const viewportArea = window.innerWidth * window.innerHeight;
      
      // Filter to actual content elements, excluding structural containers
      const contentElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const tagName = el.tagName.toLowerCase();
        const rect = el.getBoundingClientRect();
        
        // Exclude structural elements
        if (['html', 'body', 'head', 'script', 'style', 'meta', 'link', 'title'].includes(tagName)) {
          return false;
        }
        
        // Only visible elements in viewport
        if (rect.width <= 0 || rect.height <= 0 || rect.top >= window.innerHeight || rect.bottom < 0) {
          return false;
        }
        
        // Exclude large container elements that span most of the viewport
        const isLargeContainer = (rect.width / window.innerWidth > 0.8 && rect.height / window.innerHeight > 0.5);
        if (isLargeContainer && !el.textContent?.trim()) {
          return false;
        }
        
        return true;
      });

      // Improved whitespace calculation: find actual visible content areas
      const contentRects: { x: number; y: number; width: number; height: number; area: number }[] = [];
      contentElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const tagName = el.tagName.toLowerCase();
        
        // Only count elements with meaningful content
        const hasText = el.textContent?.trim() && el.textContent.trim().length > 3;
        const isContentElement = ['img', 'video', 'canvas', 'svg', 'button', 'input', 'iframe'].includes(tagName);
        
        if ((hasText || isContentElement) && 
            rect.top >= 0 && rect.top < window.innerHeight && 
            rect.width > 10 && rect.height > 10) {
          
          // For text elements, use a more conservative height
          if (hasText && !isContentElement) {
            const lines = Math.ceil((el.textContent?.trim() || '').length / 80); // Rough estimate
            const estimatedHeight = Math.min(rect.height, lines * 20);
            contentRects.push({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: estimatedHeight,
              area: rect.width * estimatedHeight
            });
          } else {
            contentRects.push({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              area: rect.width * rect.height
            });
          }
        }
      });
      
      // Calculate total content area accounting for overlaps
      let totalContentArea = 0;
      const processedRects: { x: number; y: number; width: number; height: number; area: number }[] = [];
      
      contentRects.sort((a, b) => b.area - a.area); // Process largest first
      
      for (const rect of contentRects) {
        let overlap = 0;
        for (const processed of processedRects) {
          const overlapX = Math.max(0, Math.min(rect.x + rect.width, processed.x + processed.width) - Math.max(rect.x, processed.x));
          const overlapY = Math.max(0, Math.min(rect.y + rect.height, processed.y + processed.height) - Math.max(rect.y, processed.y));
          overlap += overlapX * overlapY;
        }
        
        const uniqueArea = Math.max(0, rect.area - overlap);
        totalContentArea += uniqueArea;
        processedRects.push(rect);
      }
      
      const whitespaceArea = Math.max(0, viewportArea - totalContentArea);
      const whitespaceRatio = whitespaceArea / viewportArea;
      
      console.log(`Content calculation: ${contentRects.length} content elements, total area: ${totalContentArea}, viewport: ${viewportArea}, whitespace ratio: ${whitespaceRatio}`);

      return {
        totalElements: contentElements.length,
        whitespaceRatio: Math.round(whitespaceRatio * 100) / 100,
        viewportArea,
        contentArea: totalContentArea,
        whitespaceArea: whitespaceArea,
        contentElementsFound: contentRects.length
      };
    });

    // Calculate clutter score and final assessment
    const metrics = calculateWhitespaceMetrics(densityAnalysis, spacingAnalysis, overallMetrics, screenshotAnalysis);
    const score = calculateWhitespaceScore(metrics);
    const grade = getLetterGrade(score);
    const { issues, recommendations } = generateWhitespaceRecommendations(metrics);
    
    
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Whitespace analysis completed in ${loadTime}ms with score: ${score}`);
    
    return {
      score,
      grade,
      metrics,
      issues,
      recommendations,
      loadTime
    };

  } catch (error) {
    console.error('❌ Whitespace analysis failed:', error);
    const loadTime = Date.now() - startTime;
    
    return {
      score: 0,
      grade: 'F',
      metrics: {
        whitespaceRatio: 0,
        elementDensityPerSection: {
          gridSections: 0,
          elementDensityPerSection: [],
          maxDensity: 0,
          averageDensity: 0,
          totalElements: 0
        },
        spacingAnalysis: {
          headlineSpacing: { marginTop: 0, marginBottom: 0, adequate: false },
          ctaSpacing: { marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, adequate: false },
          contentBlockSpacing: { averageMarginBetween: 0, adequate: false },
          lineHeight: { average: 0, adequate: false }
        },
        screenshotAnalysis: {
          totalPixels: 0,
          contentPixels: 0,
          whitespacePixels: 0,
          visualWhitespaceRatio: 0,
          threshold: 240
        },
        clutterScore: 100,
        hasAdequateSpacing: false
      },
      issues: ['Whitespace analysis failed due to error'],
      recommendations: ['Unable to analyze whitespace - please check URL accessibility'],
      loadTime
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function calculateWhitespaceMetrics(
  densityAnalysis: any,
  spacingAnalysis: any,
  overallMetrics: any,
  screenshotAnalysis: ScreenshotAnalysis
): WhitespaceMetrics {

  // Calculate clutter score based on multiple factors
  let clutterScore = 0;

  // Use screenshot-based whitespace ratio if available, otherwise fall back to DOM-based
  const whitespaceRatio = screenshotAnalysis.visualWhitespaceRatio > 0 
    ? screenshotAnalysis.visualWhitespaceRatio 
    : overallMetrics.whitespaceRatio;

  // Whitespace ratio contribution (60% - primary factor)
  if (whitespaceRatio < 0.25) clutterScore += 60;        // Very cluttered
  else if (whitespaceRatio < 0.35) clutterScore += 40;   // Cluttered  
  else if (whitespaceRatio < 0.45) clutterScore += 20;   // Somewhat cluttered
  else if (whitespaceRatio < 0.55) clutterScore += 5;    // Slightly cluttered

  // Element density contribution (25% - reduced weight)
  const maxDensity = densityAnalysis?.maxDensity || densityAnalysis?.maxDensityPerSection || 0;
  // More realistic thresholds for element density
  if (maxDensity > 50) clutterScore += 25;               // Very high density
  else if (maxDensity > 30) clutterScore += 15;          // High density
  else if (maxDensity > 20) clutterScore += 8;           // Moderate density

  // Spacing adequacy contribution (15% - reduced weight)
  const spacingPenalties = [
    !spacingAnalysis.headlineSpacing.adequate ? 4 : 0,
    !spacingAnalysis.ctaSpacing.adequate ? 5 : 0,
    !spacingAnalysis.contentBlockSpacing.adequate ? 3 : 0,
    !spacingAnalysis.lineHeight.adequate ? 3 : 0
  ];
  clutterScore += spacingPenalties.reduce((sum, penalty) => sum + penalty, 0);

  const hasAdequateSpacing = spacingAnalysis.headlineSpacing.adequate &&
                           spacingAnalysis.ctaSpacing.adequate &&
                           spacingAnalysis.contentBlockSpacing.adequate &&
                           spacingAnalysis.lineHeight.adequate;

  return {
    whitespaceRatio: screenshotAnalysis.visualWhitespaceRatio > 0 ? screenshotAnalysis.visualWhitespaceRatio : overallMetrics.whitespaceRatio,
    elementDensityPerSection: {
      gridSections: densityAnalysis.gridSections,
      elementDensityPerSection: densityAnalysis.elementDensityPerSection,
      maxDensity: densityAnalysis.maxDensity || densityAnalysis.maxDensityPerSection,
      averageDensity: densityAnalysis.averageDensity || densityAnalysis.averageDensityPerSection,
      totalElements: densityAnalysis.totalElements
    },
    spacingAnalysis,
    screenshotAnalysis,
    clutterScore: Math.min(100, Math.max(0, clutterScore)),
    hasAdequateSpacing
  };
}

function calculateWhitespaceScore(metrics: WhitespaceMetrics): number {
  let score = 100;

  // Ensure we have valid numbers to work with
  const clutterScore = isNaN(metrics.clutterScore) ? 0 : metrics.clutterScore;
  const whitespaceRatio = isNaN(metrics.whitespaceRatio) ? 0 : metrics.whitespaceRatio;
  const maxDensity = isNaN(metrics.elementDensityPerSection.maxDensity) ? 0 : metrics.elementDensityPerSection.maxDensity;

  // Deduct based on clutter score
  score -= clutterScore;

  // Bonus for excellent whitespace ratio (screenshot-based is more accurate)
  if (metrics.screenshotAnalysis.visualWhitespaceRatio > 0) {
    // Use screenshot-based bonuses
    if (metrics.screenshotAnalysis.visualWhitespaceRatio >= 0.6) {
      score += 10; // Excellent whitespace
    } else if (metrics.screenshotAnalysis.visualWhitespaceRatio >= 0.5) {
      score += 5;  // Good whitespace
    }
  } else if (whitespaceRatio >= 0.5) {
    score += 5; // Fallback to DOM-based bonus
  }

  // Bonus for low maximum density (with more realistic thresholds)
  if (maxDensity <= 15) {
    score += 5;
  } else if (maxDensity <= 25) {
    score += 2;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  
  return finalScore;
}

function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateWhitespaceRecommendations(
  metrics: WhitespaceMetrics
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for clutter flags (PRD requirement)
  if (metrics.clutterScore > 70) {
    issues.push('Page layout appears cluttered');
    recommendations.push('Significantly reduce element density and increase spacing');
  } else if (metrics.clutterScore > 50) {
    issues.push('Page layout shows signs of clutter');
    recommendations.push('Consider reducing element density per section');
  }

  // Element density issues
  if (metrics.elementDensityPerSection.maxDensity > 12) {
    issues.push(`High element density detected (${metrics.elementDensityPerSection.maxDensity} elements in one section)`);
    recommendations.push('Reduce element density per section');
  }

  // Spacing-specific issues and recommendations
  if (!metrics.spacingAnalysis.headlineSpacing.adequate) {
    issues.push('Insufficient spacing around headlines');
    recommendations.push('Increase margins around headlines (minimum 16px top, 12px bottom)');
  }

  if (!metrics.spacingAnalysis.ctaSpacing.adequate) {
    issues.push('CTA elements lack adequate spacing');
    recommendations.push('Add more spacing around call-to-action buttons (minimum 20px margins)');
  }

  if (!metrics.spacingAnalysis.contentBlockSpacing.adequate) {
    issues.push('Insufficient spacing between content blocks');
    recommendations.push('Increase spacing between major content sections (minimum 16px)');
  }

  if (!metrics.spacingAnalysis.lineHeight.adequate) {
    issues.push('Line height too tight for optimal readability');
    recommendations.push('Increase line height to at least 1.4 for better text readability');
  }

  // Whitespace ratio issues (prefer screenshot analysis if available)
  const displayRatio = metrics.screenshotAnalysis.visualWhitespaceRatio > 0 
    ? metrics.screenshotAnalysis.visualWhitespaceRatio 
    : metrics.whitespaceRatio;
  const analysisMethod = metrics.screenshotAnalysis.visualWhitespaceRatio > 0 
    ? 'visual analysis' 
    : 'DOM analysis';

  if (displayRatio < 0.25) {
    issues.push(`Very low whitespace ratio (${Math.round(displayRatio * 100)}% via ${analysisMethod})`);
    recommendations.push('Significantly increase whitespace - aim for at least 35% of page area');
  } else if (displayRatio < 0.35) {
    issues.push(`Low whitespace ratio (${Math.round(displayRatio * 100)}% via ${analysisMethod})`);
    recommendations.push('Increase overall whitespace for better visual breathing room');
  } else if (displayRatio < 0.45) {
    issues.push(`Moderate whitespace ratio (${Math.round(displayRatio * 100)}% via ${analysisMethod})`);
    recommendations.push('Consider adding more spacing between content sections');
  }

  // Positive feedback for good whitespace
  if (issues.length === 0) {
    recommendations.push('Excellent whitespace usage! Content is well-spaced and digestible');
  } else if (issues.length <= 2 && metrics.clutterScore < 30) {
    recommendations.push('Good whitespace foundation - minor improvements will enhance readability');
  }

  return { issues, recommendations };
}