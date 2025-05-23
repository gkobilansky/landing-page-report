import { createPuppeteerBrowser } from './puppeteer-config';

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

export interface WhitespaceMetrics {
  whitespaceRatio: number; // Percentage of page that is whitespace
  elementDensityPerSection: ElementDensityAnalysis;
  spacingAnalysis: SpacingAnalysis;
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
    
    browser = await createPuppeteerBrowser();

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
    const densityAnalysis = await page.evaluate((cols, rows) => {
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

    console.log('🔍 Calculating overall whitespace metrics...');
    
    // 3. Overall whitespace calculation
    const overallMetrics = await page.evaluate(() => {
      const body = document.body;
      const viewportArea = window.innerWidth * window.innerHeight;
      
      // Estimate content area vs whitespace
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               rect.top >= 0 && rect.top < window.innerHeight;
      });

      let totalContentArea = 0;
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight) {
          totalContentArea += (rect.width * rect.height);
        }
      });

      // Account for overlapping elements (rough estimation)
      totalContentArea = totalContentArea * 0.6; // Overlap factor
      
      const whitespaceArea = Math.max(0, viewportArea - totalContentArea);
      const whitespaceRatio = whitespaceArea / viewportArea;

      return {
        totalElements: elements.length,
        whitespaceRatio: Math.round(whitespaceRatio * 100) / 100,
        viewportArea,
        contentArea: totalContentArea,
        whitespaceArea
      };
    });

    // Calculate clutter score and final assessment
    const metrics = calculateWhitespaceMetrics(densityAnalysis, spacingAnalysis, overallMetrics);
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
  overallMetrics: any
): WhitespaceMetrics {

  // Calculate clutter score based on multiple factors
  let clutterScore = 0;

  // Element density contribution (40%)
  const maxDensity = densityAnalysis?.maxDensity || densityAnalysis?.maxDensityPerSection || 0;
  const maxDensityPenalty = Math.min(maxDensity * 5, 40);
  clutterScore += maxDensityPenalty;

  // Spacing adequacy contribution (35%)
  const spacingPenalties = [
    !spacingAnalysis.headlineSpacing.adequate ? 8 : 0,
    !spacingAnalysis.ctaSpacing.adequate ? 10 : 0,
    !spacingAnalysis.contentBlockSpacing.adequate ? 8 : 0,
    !spacingAnalysis.lineHeight.adequate ? 9 : 0
  ];
  clutterScore += spacingPenalties.reduce((sum, penalty) => sum + penalty, 0);

  // Whitespace ratio contribution (25%)
  if (overallMetrics.whitespaceRatio < 0.2) clutterScore += 25;
  else if (overallMetrics.whitespaceRatio < 0.3) clutterScore += 15;
  else if (overallMetrics.whitespaceRatio < 0.4) clutterScore += 8;

  const hasAdequateSpacing = spacingAnalysis.headlineSpacing.adequate &&
                           spacingAnalysis.ctaSpacing.adequate &&
                           spacingAnalysis.contentBlockSpacing.adequate &&
                           spacingAnalysis.lineHeight.adequate;

  return {
    whitespaceRatio: overallMetrics.whitespaceRatio,
    elementDensityPerSection: {
      gridSections: densityAnalysis.gridSections,
      elementDensityPerSection: densityAnalysis.elementDensityPerSection,
      maxDensity: densityAnalysis.maxDensity || densityAnalysis.maxDensityPerSection,
      averageDensity: densityAnalysis.averageDensity || densityAnalysis.averageDensityPerSection,
      totalElements: densityAnalysis.totalElements
    },
    spacingAnalysis,
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

  // Bonus for excellent whitespace ratio
  if (whitespaceRatio >= 0.5) {
    score += 5;
  }

  // Bonus for low maximum density
  if (maxDensity <= 3) {
    score += 5;
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

  // Whitespace ratio issues
  if (metrics.whitespaceRatio < 0.2) {
    issues.push(`Very low whitespace ratio (${Math.round(metrics.whitespaceRatio * 100)}%)`);
    recommendations.push('Significantly increase whitespace - aim for at least 30% of page');
  } else if (metrics.whitespaceRatio < 0.3) {
    issues.push(`Low whitespace ratio (${Math.round(metrics.whitespaceRatio * 100)}%)`);
    recommendations.push('Increase overall whitespace for better visual breathing room');
  }

  // Positive feedback for good whitespace
  if (issues.length === 0) {
    recommendations.push('Excellent whitespace usage! Content is well-spaced and digestible');
  } else if (issues.length <= 2 && metrics.clutterScore < 30) {
    recommendations.push('Good whitespace foundation - minor improvements will enhance readability');
  }

  return { issues, recommendations };
}