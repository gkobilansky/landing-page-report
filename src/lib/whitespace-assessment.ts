import type { Browser } from 'puppeteer-core';
import { createPuppeteerBrowser } from './puppeteer-config';
import { getWhitespaceRecommendations, RecommendationContext } from './recommendations';

// Conditional import for Jimp to avoid test environment issues
let Jimp: any;
if (process.env.NODE_ENV !== 'test') {
  try {
    // Support both CJS and ESM shapes of jimp
    const mod = require('jimp');
    Jimp = (mod && typeof mod.read === 'function') ? mod : (mod && mod.default ? mod.default : mod);
  } catch {
    Jimp = null;
  }
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

export interface AdaptiveWhitespaceMetrics extends WhitespaceMetrics {
  theme: 'light' | 'dark' | 'mixed';
  adaptiveThreshold: number;
  contrastRatio: number;
}

export interface ThemeDetectionResult {
  theme: 'light' | 'dark' | 'mixed';
  averageBackgroundLuminance: number;
  adaptiveThreshold: number;
  contrastRatio: number;
  hasDarkModeMediaQuery?: boolean;
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
  metrics: AdaptiveWhitespaceMetrics;
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
    browser?: Browser;
    forceBrowserless?: boolean;
  };
}

export async function detectPageTheme(page: any): Promise<ThemeDetectionResult> {
  console.log('🎨 Detecting page theme...');
  
  const themeData = await page.evaluate(() => {
    // Check for CSS media query dark mode preference
    const hasDarkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Sample background colors across the viewport
    const samplePoints: { x: number; y: number }[] = [];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    
    // Create a grid of sample points (5x5 grid)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        samplePoints.push({
          x: (col + 0.5) * (viewport.width / 5),
          y: (row + 0.5) * (viewport.height / 5)
        });
      }
    }
    
    // Get background colors at sample points
    const luminanceValues: number[] = [];
    
    samplePoints.forEach(point => {
      const element = document.elementFromPoint(point.x, point.y);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        
        // Parse RGB values
        const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          
          // Calculate luminance using standard formula
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          luminanceValues.push(luminance);
        } else if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
          // Check parent elements for background
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            const parentBg = parentStyle.backgroundColor;
            const parentRgbMatch = parentBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            
            if (parentRgbMatch) {
              const r = parseInt(parentRgbMatch[1]);
              const g = parseInt(parentRgbMatch[2]);
              const b = parseInt(parentRgbMatch[3]);
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              luminanceValues.push(luminance);
              break;
            }
            parent = parent.parentElement;
          }
          
          // If no background found, assume white
          if (!parent || parent === document.body) {
            luminanceValues.push(255);
          }
        }
      }
    });
    
    // Calculate average luminance
    const averageLuminance = luminanceValues.length > 0 
      ? luminanceValues.reduce((sum, val) => sum + val, 0) / luminanceValues.length
      : 128; // Default to middle gray if no samples
    
    // Determine theme based on average luminance
    let theme: 'light' | 'dark' | 'mixed';
    let contrastRatio = 1;
    
    if (averageLuminance > 200) {
      theme = 'light';
      // Estimate contrast ratio for light theme (text usually dark on light bg)
      contrastRatio = (averageLuminance + 0.05) / (30 + 0.05); // Assuming dark text
    } else if (averageLuminance < 80) {
      theme = 'dark';
      // Estimate contrast ratio for dark theme (text usually light on dark bg)
      contrastRatio = (230 + 0.05) / (averageLuminance + 0.05); // Assuming light text
    } else {
      theme = 'mixed';
      // Mixed themes have moderate contrast
      contrastRatio = Math.max(
        (200 + 0.05) / (averageLuminance + 0.05),
        (averageLuminance + 0.05) / (80 + 0.05)
      );
    }
    
    return {
      averageLuminance,
      theme,
      contrastRatio,
      hasDarkModeMediaQuery,
      sampleCount: luminanceValues.length
    };
  });
  
  return {
    theme: themeData.theme,
    averageBackgroundLuminance: themeData.averageLuminance,
    adaptiveThreshold: calculateAdaptiveThreshold(themeData.theme, themeData.averageLuminance),
    contrastRatio: themeData.contrastRatio,
    hasDarkModeMediaQuery: themeData.hasDarkModeMediaQuery
  };
}

export function calculateAdaptiveThreshold(theme: 'light' | 'dark' | 'mixed', averageLuminance: number): number {
  // Base thresholds for different themes
  const thresholds = {
    light: 240,  // Higher threshold for light themes
    dark: 100,   // Lower threshold for dark themes  
    mixed: 170   // Intermediate threshold for mixed themes
  };
  
  let baseThreshold = thresholds[theme];
  
  // Fine-tune based on actual luminance values
  if (theme === 'light') {
    // For very bright backgrounds, might need even higher threshold
    if (averageLuminance > 250) {
      baseThreshold = 250;
    } else if (averageLuminance < 180) {
      // Not as bright as expected, reduce threshold slightly
      baseThreshold = 220;
    }
  } else if (theme === 'dark') {
    // For very dark backgrounds, might need even lower threshold
    if (averageLuminance < 30) {
      baseThreshold = 80;
    } else if (averageLuminance > 60) {
      // Not as dark as expected, increase threshold slightly
      baseThreshold = 120;
    }
  } else {
    // Mixed themes - adjust based on luminance
    baseThreshold = Math.max(100, Math.min(240, 170 + (averageLuminance - 128) * 0.5));
  }
  
  return Math.round(baseThreshold);
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
  
  // Load and process the image with Jimp (support dynamic ESM import)
  let J: any = Jimp;
  if (!J || typeof J.read !== 'function') {
    const mod: any = await import('jimp');
    J = mod?.default ?? mod;
  }
  const img = await J.read(screenshotBuffer);
  const { width, height } = img.bitmap;
  
  let contentPixels = 0;
  const totalPixels = width * height;
  
  // Helper to compute grayscale at a given pixel index
  const grayAt = (i: number) => {
    const r = img.bitmap.data[i];
    const g = img.bitmap.data[i + 1];
    const b = img.bitmap.data[i + 2];
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  // Process every pixel with a light local-contrast check so subtle
  // near-white graphics (watermarks, soft shadows/gradients) are not
  // over-counted as content.
  const nearWhiteBand = 20; // pixels within (threshold - 20 .. threshold) treated carefully
  const lowGradient = 10;   // small local change means likely background

  img.scan(0, 0, width, height, (x: number, y: number, idx: number) => {
    const g = grayAt(idx);

    // Fast path: clearly darker than band -> content
    if (g < threshold - nearWhiteBand) {
      contentPixels++;
      return;
    }

    // Border pixels: use only absolute threshold
    if (x === width - 1 || y === height - 1) {
      if (g < threshold) contentPixels++;
      return;
    }

    // Local gradient check against right/bottom neighbors
    const rightIdx = idx + 4; // (x+1, y)
    const downIdx = idx + width * 4; // (x, y+1)
    const grad = Math.abs(g - grayAt(rightIdx)) + Math.abs(g - grayAt(downIdx));

    // Treat as content only if either clearly darker than threshold or
    // shows sufficient local contrast (i.e., real edge/details)
    if (g < threshold && grad >= lowGradient) {
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
  
  const providedBrowser = options.puppeteer?.browser;
  const shouldCloseBrowser = !providedBrowser;
  let browser: Browser | null = providedBrowser || null;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const isHtml = options.isHtml || false;
    const gridColumns = options.gridColumns || 3;
    const gridRows = options.gridRows || 4;

    console.log('📱 Launching Puppeteer browser...');
    
    if (!browser) {
      browser = await createPuppeteerBrowser({
        forceBrowserless: options.puppeteer?.forceBrowserless
      });
    }

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
        const parent = headline.parentElement as HTMLElement | null;
        const parentStyle: any = parent ? window.getComputedStyle(parent) : {};
        const gap = parseFloat((parentStyle && (parentStyle.rowGap || parentStyle.gap)) || '0') || 0;
        const padTop = parseFloat((parentStyle && parentStyle.paddingTop) || '0') || 0;
        const padBottom = parseFloat((parentStyle && parentStyle.paddingBottom) || '0') || 0;

        // Effective vertical spacing: margins plus half of container gap/padding
        const effectiveTop = marginTop + gap * 0.5 + padTop * 0.5;
        const effectiveBottom = marginBottom + gap * 0.5 + padBottom * 0.5;
        
        if (effectiveTop > 0 || effectiveBottom > 0) {
          totalHeadlineMarginTop += effectiveTop;
          totalHeadlineMarginBottom += effectiveBottom;
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
        const parent = cta.parentElement as HTMLElement | null;
        const parentStyle: any = parent ? window.getComputedStyle(parent) : {};
        const gap = parseFloat((parentStyle && (parentStyle.rowGap || parentStyle.gap)) || '0') || 0;
        const padTop = parseFloat((parentStyle && parentStyle.paddingTop) || '0') || 0;
        const padBottom = parseFloat((parentStyle && parentStyle.paddingBottom) || '0') || 0;
        const padLeft = parseFloat((parentStyle && parentStyle.paddingLeft) || '0') || 0;
        const padRight = parseFloat((parentStyle && parentStyle.paddingRight) || '0') || 0;

        const effTop = (parseFloat(computedStyle.marginTop) || 0) + gap * 0.5 + padTop * 0.5;
        const effBottom = (parseFloat(computedStyle.marginBottom) || 0) + gap * 0.5 + padBottom * 0.5;
        const effLeft = (parseFloat(computedStyle.marginLeft) || 0) + padLeft * 0.25;
        const effRight = (parseFloat(computedStyle.marginRight) || 0) + padRight * 0.25;

        totalCtaMarginTop += effTop;
        totalCtaMarginBottom += effBottom;
        totalCtaMarginLeft += effLeft;
        totalCtaMarginRight += effRight;
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
        const parent = block.parentElement as HTMLElement | null;
        const parentStyle: any = parent ? window.getComputedStyle(parent) : {};
        const gap = parseFloat((parentStyle && (parentStyle.rowGap || parentStyle.gap)) || '0') || 0;
        const padBottom = parseFloat(computedStyle.paddingBottom || '0') || 0;
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
        const effective = marginBottom + gap + padBottom * 0.5; // count some padding as contributing spacing
        if (effective > 0) {
          totalContentMargin += effective;
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

    console.log('🎨 Detecting page theme for adaptive threshold...');
    
    // 3. Theme detection for adaptive threshold
    let themeDetection: ThemeDetectionResult;
    try {
      themeDetection = await detectPageTheme(page);
    } catch (error) {
      console.warn('⚠️ Theme detection failed, using default light theme:', error);
      themeDetection = {
        theme: 'light',
        averageBackgroundLuminance: 240,
        adaptiveThreshold: 240,
        contrastRatio: 4.5
      };
    }

    console.log(`📸 Taking screenshot for visual analysis (adaptive threshold: ${themeDetection.adaptiveThreshold})...`);
    
    // 4. Screenshot-based whitespace analysis with adaptive threshold
    let screenshotAnalysis: ScreenshotAnalysis;
    
    if (options.useScreenshot !== false) {
      try {
        // Use adaptive threshold instead of fixed one
        const adaptiveThreshold = options.pixelThreshold || themeDetection.adaptiveThreshold;
        
        if (options.screenshotUrl) {
          // Use existing screenshot
          console.log(`📷 Using existing screenshot: ${options.screenshotUrl}`);
          screenshotAnalysis = await analyzeScreenshotWhitespace(
            options.screenshotUrl, 
            adaptiveThreshold, 
            true
          );
        } else {
          // Capture new screenshot
          screenshotAnalysis = await analyzeScreenshotWhitespace(
            page, 
            adaptiveThreshold, 
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
          threshold: themeDetection.adaptiveThreshold
        };
      }
    } else {
      screenshotAnalysis = {
        totalPixels: viewport.width * viewport.height,
        contentPixels: 0,
        whitespacePixels: 0,
        visualWhitespaceRatio: 0,
        threshold: themeDetection.adaptiveThreshold
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
        // Preserve precision to avoid collapsing small but present whitespace to 0.0
        whitespaceRatio: parseFloat(whitespaceRatio.toFixed(4)),
        viewportArea,
        contentArea: totalContentArea,
        whitespaceArea: whitespaceArea,
        contentElementsFound: contentRects.length
      };
    });

    // Calculate clutter score and final assessment with theme-aware scoring
    const metrics = calculateWhitespaceMetrics(densityAnalysis, spacingAnalysis, overallMetrics, screenshotAnalysis);
    const adaptiveMetrics = enhanceMetricsWithThemeData(metrics, themeDetection);
    const score = calculateAdaptiveWhitespaceScore(adaptiveMetrics);
    const { issues, recommendations } = generateWhitespaceRecommendations(adaptiveMetrics);
    
    
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Whitespace analysis completed in ${loadTime}ms with score: ${score}`);
    
    return {
      score,
      metrics: adaptiveMetrics,
      issues,
      recommendations,
      loadTime
    };

  } catch (error) {
    console.error('❌ Whitespace analysis failed:', error);
    const loadTime = Date.now() - startTime;
    
    return {
      score: 0,
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
        hasAdequateSpacing: false,
        theme: 'light',
        adaptiveThreshold: 240,
        contrastRatio: 1
      },
      issues: ['Whitespace analysis failed due to error'],
      recommendations: ['Unable to analyze whitespace - please check URL accessibility'],
      loadTime
    };
  } finally {
    if (shouldCloseBrowser && browser) {
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

function enhanceMetricsWithThemeData(
  metrics: WhitespaceMetrics, 
  themeDetection: ThemeDetectionResult
): AdaptiveWhitespaceMetrics {
  return {
    ...metrics,
    theme: themeDetection.theme,
    adaptiveThreshold: themeDetection.adaptiveThreshold,
    contrastRatio: themeDetection.contrastRatio
  };
}

function calculateAdaptiveWhitespaceScore(metrics: AdaptiveWhitespaceMetrics): number {
  let score = 100;

  // Ensure we have valid numbers to work with
  const clutterScore = isNaN(metrics.clutterScore) ? 0 : metrics.clutterScore;
  const whitespaceRatio = isNaN(metrics.whitespaceRatio) ? 0 : metrics.whitespaceRatio;
  const maxDensity = isNaN(metrics.elementDensityPerSection.maxDensity) ? 0 : metrics.elementDensityPerSection.maxDensity;

  // Adaptive whitespace ratio thresholds based on theme
  const thresholds = {
    // Raise "very low" to be less punitive while leaving other bands
    // intact to preserve historical interpretation.
    light: { very: 0.30, cluttered: 0.35, somewhat: 0.45, slightly: 0.55 },
    dark:  { very: 0.24, cluttered: 0.30, somewhat: 0.40, slightly: 0.50 },
    mixed: { very: 0.28, cluttered: 0.33, somewhat: 0.43, slightly: 0.53 }
  };

  const t = thresholds[metrics.theme];

  // Recalculate clutter score with adaptive thresholds
  let adaptiveClutterScore = 0;

  // Dynamic cluttering scoring based on theme
  if (whitespaceRatio < t.very) adaptiveClutterScore += 60;
  else if (whitespaceRatio < t.cluttered) adaptiveClutterScore += 40;
  else if (whitespaceRatio < t.somewhat) adaptiveClutterScore += 20;
  else if (whitespaceRatio < t.slightly) adaptiveClutterScore += 5;

  // Element density contribution - more strict penalties
  if (maxDensity > 50) adaptiveClutterScore += 30;
  else if (maxDensity > 30) adaptiveClutterScore += 25;
  else if (maxDensity > 15) adaptiveClutterScore += 15; // Lower threshold
  else if (maxDensity > 10) adaptiveClutterScore += 8;

  // Spacing adequacy contribution - increased penalties
  const spacingPenalties = [
    !metrics.spacingAnalysis.headlineSpacing.adequate ? 8 : 0,
    !metrics.spacingAnalysis.ctaSpacing.adequate ? 10 : 0,
    !metrics.spacingAnalysis.contentBlockSpacing.adequate ? 6 : 0,
    !metrics.spacingAnalysis.lineHeight.adequate ? 18 : 0 // Higher penalty for line height
  ];
  adaptiveClutterScore += spacingPenalties.reduce((sum, penalty) => sum + penalty, 0);

  // Deduct based on adaptive clutter score
  score -= Math.min(100, Math.max(0, adaptiveClutterScore));

  // Bonus for excellent whitespace ratio (theme-adjusted)
  if (metrics.screenshotAnalysis.visualWhitespaceRatio > 0) {
    // Use screenshot-based bonuses with theme adjustment
    const excellentThreshold = metrics.theme === 'dark' ? 0.5 : 0.6;
    const goodThreshold = metrics.theme === 'dark' ? 0.4 : 0.5;
    
    if (metrics.screenshotAnalysis.visualWhitespaceRatio >= excellentThreshold) {
      score += 10; // Excellent whitespace
    } else if (metrics.screenshotAnalysis.visualWhitespaceRatio >= goodThreshold) {
      score += 5;  // Good whitespace
    }
  } else if (whitespaceRatio >= t.slightly) {
    score += 5; // Fallback to DOM-based bonus
  }

  // Bonus for low maximum density (with theme-aware thresholds)
  const densityThresholds = metrics.theme === 'dark' ? [12, 20] : [15, 25];
  if (maxDensity <= densityThresholds[0]) {
    score += 5;
  } else if (maxDensity <= densityThresholds[1]) {
    score += 2;
  }

  // Bonus for appropriate contrast ratio
  if (metrics.contrastRatio >= 7) {
    score += 5; // WCAG AAA
  } else if (metrics.contrastRatio >= 4.5) {
    score += 3; // WCAG AA
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  
  return finalScore;
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

function generateWhitespaceRecommendations(
  metrics: AdaptiveWhitespaceMetrics
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];

  // Check for clutter flags (PRD requirement)
  if (metrics.clutterScore > 70) {
    issues.push('Page layout appears cluttered');
  } else if (metrics.clutterScore > 50) {
    issues.push('Page layout shows signs of clutter');
  }

  // Element density issues
  if (metrics.elementDensityPerSection.maxDensity > 12) {
    issues.push(`High element density detected (${metrics.elementDensityPerSection.maxDensity} elements in one section)`);
  }

  // Spacing-specific issues
  if (!metrics.spacingAnalysis.headlineSpacing.adequate) {
    issues.push('Insufficient spacing around headlines');
  }

  if (!metrics.spacingAnalysis.ctaSpacing.adequate) {
    issues.push('CTA elements lack adequate spacing');
  }

  if (!metrics.spacingAnalysis.contentBlockSpacing.adequate) {
    issues.push('Insufficient spacing between content blocks');
  }

  if (!metrics.spacingAnalysis.lineHeight.adequate) {
    issues.push('Line height too tight for optimal readability');
  }

  // Theme-aware whitespace ratio issues
  const displayRatio = metrics.screenshotAnalysis.visualWhitespaceRatio > 0
    ? metrics.screenshotAnalysis.visualWhitespaceRatio
    : metrics.whitespaceRatio;
  const analysisMethod = metrics.screenshotAnalysis.visualWhitespaceRatio > 0
    ? `visual analysis with ${metrics.theme} theme (threshold: ${metrics.adaptiveThreshold})`
    : 'DOM analysis';

  // Use theme-specific thresholds for issues
  const thresholds = {
    light: { very: 0.30, low: 0.35, moderate: 0.45 },
    dark:  { very: 0.24, low: 0.30, moderate: 0.40 },
    mixed: { very: 0.28, low: 0.33, moderate: 0.43 }
  };

  const t = thresholds[metrics.theme];

  if (displayRatio < t.very) {
    issues.push(`Very low whitespace ratio (${Math.round(displayRatio * 100)}% via ${analysisMethod})`);
  } else if (displayRatio < t.low) {
    issues.push(`Low whitespace ratio (${Math.round(displayRatio * 100)}% via ${analysisMethod})`);
  } else if (displayRatio < t.moderate) {
    issues.push(`Moderate whitespace ratio (${Math.round(displayRatio * 100)}% via ${analysisMethod})`);
  }

  // Contrast ratio issues
  if (metrics.contrastRatio < 3) {
    issues.push('Poor contrast ratio - text may be difficult to read');
  }

  // Generate recommendations using the new system
  const ctx: RecommendationContext = {
    whitespaceRatio: displayRatio,
    contentDensity: metrics.elementDensityPerSection.averageDensity / 20, // Normalize to 0-1 range
    avgLineHeight: metrics.spacingAnalysis.lineHeight.average,
    clutterScore: metrics.clutterScore,
  };
  const generatedRecs = getWhitespaceRecommendations(ctx);

  return { issues, recommendations: generatedRecs.legacyStrings };
}
