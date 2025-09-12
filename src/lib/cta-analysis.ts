import { Page } from 'puppeteer-core';
import { createPuppeteerBrowser } from './puppeteer-config';
import { CTA_DICTIONARY, CTA_HELPERS } from './cta-dictionary';

export interface CTAElement {
  text: string;
  type: 'primary' | 'secondary' | 'form-submit' | 'text-link' | 'other';
  isAboveFold: boolean;
  actionStrength: 'strong' | 'medium' | 'weak';
  urgency: 'high' | 'medium' | 'low';
  visibility: 'high' | 'medium' | 'low';
  context: 'hero' | 'header' | 'content' | 'sidebar' | 'footer' | 'form' | 'other';
  hasValueProposition: boolean;
  hasUrgency: boolean;
  hasGuarantee: boolean;
  mobileOptimized: boolean;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface CTAAnalysisResult {
  score: number;
  ctas: CTAElement[];
  primaryCTA?: CTAElement;
  secondaryCTAs: CTAElement[];
  issues: string[];
  recommendations: string[];
}

interface AnalysisOptions {
  viewport?: {
    width: number;
    height: number;
  };
  isHtml?: boolean; // Flag to indicate if input is HTML instead of URL
  puppeteer?: {
    forceBrowserless?: boolean;
  };
}


export async function analyzeCTA(urlOrHtml: string, options: AnalysisOptions = {}): Promise<CTAAnalysisResult> {
  console.log('🔍 CTA Analysis starting...');
  
  let browser;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const isHtml = options.isHtml || false;
    
    console.log('📱 Launching Puppeteer browser...');
    
    browser = await createPuppeteerBrowser(options.puppeteer || {});
    
    const page = await browser.newPage();
    await page.setViewport(viewport);
    
    if (isHtml) {
      console.log('📄 Setting HTML content directly...');
      await page.setContent(urlOrHtml);
    } else {
      console.log('🌐 Navigating to URL...');
      await page.goto(urlOrHtml, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
    }
    
    console.log('📄 Page loaded successfully');

    // Extract CTA elements using Puppeteer page evaluation
    console.log('🔍 Extracting CTA elements...');
    const ctaData = await page.evaluate((viewport: { width: number; height: number }, ctaDictionary: any) => {
      try {
      const ctas: any[] = [];
      const processedElements = new Set<Element>();
      
      // Browser-compatible helper functions
      const ctaHelpers = {
        containsAnyWord: (text: string, words: readonly string[]): boolean => {
          const lowerText = text.toLowerCase();
          return words.some(word => lowerText.includes(word));
        },
        
        matchesAnyPattern: (text: string, patterns: readonly string[]): boolean => {
          return patterns.some(patternStr => {
            const pattern = new RegExp(patternStr, 'i');
            return pattern.test(text);
          });
        },
        
        hasAnyClass: (element: Element, classes: readonly string[]): boolean => {
          return classes.some(className => element.classList.contains(className));
        },
        
        matchesAnyClassPattern: (element: Element, patterns: readonly string[]): boolean => {
          const className = element.className || '';
          return patterns.some(patternStr => {
            const pattern = new RegExp(patternStr, 'i');
            return pattern.test(String(className));
          });
        }
      };
      
      // More precise CTA selectors focusing on actual actionable elements
      const ctaSelectors = [
        // High priority: explicit CTA classes and purchase/checkout links
        { selector: '.cta-button, [class*="cta-button"], .cta, [class*="cta"]', type: 'primary' },
        { selector: 'a[href*="checkout"], a[href*="cart"], a[href*="purchase"], a[href*="buy"]', type: 'primary' },
        { selector: 'a[href*="signup"], a[href*="register"], a[href*="trial"], a[href*="order"]', type: 'primary' },
        
        // Medium priority: buttons and form submissions
        { selector: 'button[class*="primary"], .btn-primary, .button-primary', type: 'primary' },
        { selector: 'input[type="submit"], button[type="submit"]', type: 'form-submit' },
        { selector: '.btn, .button, button', type: 'secondary' },
        
        // Lower priority: general interactive elements (but more selective)
        { selector: '[role="button"]', type: 'secondary' },
        { selector: '[onclick]', type: 'other' }
      ];

      // Helper functions (moved inside evaluate)
      const determineContext = (element: Element): string => {
        // Check for hero/main section first (more specific patterns)
        if (element.closest('.hero, .banner, .jumbotron, .main-hero, [class*="hero"], [class*="banner"]')) {
          return 'hero';
        }
        
        // Check if element is in main content area above fold and not in header/footer
        const rect = element.getBoundingClientRect();
        const isInMainArea = rect.top > 100 && rect.top < viewport.height * 0.8; // Between header and fold
        const notInNavigation = !element.closest('nav, .nav, .navigation, .menu');
        const notInFooter = !element.closest('footer, .footer');
        const notInHeader = !element.closest('header, .header');
        
        if (isInMainArea && notInNavigation && notInFooter && notInHeader) {
          return 'hero';
        }
        
        // Standard context detection
        if (element.closest('header, nav, .header, .navigation, .nav, .menu')) return 'header';
        if (element.closest('footer, .footer')) return 'footer';
        if (element.closest('aside, .sidebar')) return 'sidebar';
        if (element.closest('form')) return 'form';
        
        return 'content';
      };
      
      const analyzeActionStrength = (text: string): string => {
        if (ctaHelpers.containsAnyWord(text, ctaDictionary.STRONG_ACTION_WORDS)) return 'strong';
        if (ctaHelpers.containsAnyWord(text, ctaDictionary.WEAK_ACTION_WORDS)) return 'weak';
        return 'medium';
      };
      
      const analyzeUrgency = (text: string): string => {
        if (ctaHelpers.containsAnyWord(text, ctaDictionary.URGENCY_WORDS)) return 'high';
        if (text.toLowerCase().includes('free') || text.toLowerCase().includes('trial')) return 'medium';
        return 'low';
      };
      
      const analyzeVisibility = (element: Element, computedStyle: CSSStyleDeclaration): string => {
        const fontSize = parseInt(computedStyle.fontSize || '16');
        const padding = parseInt(computedStyle.padding || '0');
        const backgroundColor = computedStyle.backgroundColor;
        const borderRadius = parseInt(computedStyle.borderRadius || '0');
        const border = computedStyle.border;
        const minHeight = parseInt(computedStyle.minHeight || '0');
        const rect = element.getBoundingClientRect();
        
        // Check if it's a proper button/CTA element
        const isButton = element.tagName === 'BUTTON' || 
                        (element.tagName === 'A' && (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent')) ||
                        element.hasAttribute('role') && element.getAttribute('role') === 'button';
        
        // Calculate visibility score based on multiple factors
        let visibilityScore = 0;
        
        // Font size contribution
        if (fontSize >= 16) visibilityScore += 25;
        else if (fontSize >= 14) visibilityScore += 15;
        else if (fontSize >= 12) visibilityScore += 5;
        
        // Padding/spacing contribution
        if (padding >= 12) visibilityScore += 20;
        else if (padding >= 8) visibilityScore += 15;
        else if (padding >= 4) visibilityScore += 10;
        
        // Background color contribution
        if (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          visibilityScore += 20;
        }
        
        // Button styling indicators
        if (borderRadius > 0) visibilityScore += 10; // Rounded corners
        if (border && border !== 'none' && !border.includes('0px')) visibilityScore += 10; // Has border
        if (isButton) visibilityScore += 20; // Is actual button element
        
        // Size contribution
        if (rect.width >= 120 && rect.height >= 40) visibilityScore += 15;
        else if (rect.width >= 80 && rect.height >= 32) visibilityScore += 10;
        
        // Min height for proper CTAs
        if (minHeight >= 40 || rect.height >= 40) visibilityScore += 10;
        
        if (visibilityScore >= 70) return 'high';
        if (visibilityScore >= 40) return 'medium';
        return 'low';
      };
      
      const getSurroundingText = (element: Element): string => {
        const parent = element.parentElement;
        if (!parent) return '';
        
        const siblingText = Array.from(parent.children)
          .filter(child => child !== element)
          .map(child => child.textContent?.trim() || '')
          .join(' ');
          
        return siblingText.toLowerCase();
      };
      
      const hasValueProposition = (surroundingText: string): boolean => {
        return ctaHelpers.containsAnyWord(surroundingText, ctaDictionary.VALUE_PROPOSITION_WORDS);
      };
      
      const hasGuarantee = (surroundingText: string): boolean => {
        return ctaHelpers.containsAnyWord(surroundingText, ctaDictionary.GUARANTEE_WORDS);
      };
      
      const isMobileOptimized = (element: Element, computedStyle: CSSStyleDeclaration, viewport: any): boolean => {
        if (viewport.width > 768) return true;
        
        const fontSize = parseInt(computedStyle.fontSize || '16');
        const padding = parseInt(computedStyle.padding || '0');
        const width = parseInt(computedStyle.width || '0');
        
        return fontSize >= 16 && padding >= 8 && (width >= 44 || width === 0);
      };
      
      const refineCTAType = (element: Element, initialType: string, text: string, computedStyle: CSSStyleDeclaration): string => {
        // Check for explicit primary CTA indicators
        if (ctaHelpers.hasAnyClass(element, ctaDictionary.PRIMARY_CTA_CLASSES)) {
          return 'primary';
        }
        
        // Check for primary CTA class patterns (e.g., btn-primary-3, button--primary-large)
        if (ctaHelpers.matchesAnyClassPattern(element, ctaDictionary.PRIMARY_CTA_CLASS_PATTERNS)) {
          return 'primary';
        }
        
        // Form submission elements
        if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'submit') {
          return 'form-submit';
        }
        
        if (element.tagName === 'BUTTON' && element.closest('form')) {
          return 'form-submit';
        }
        
        // Check if it's an actual interactive button element
        const isInteractiveButton = element.tagName === 'BUTTON' || 
                                   (element.tagName === 'A' && element.hasAttribute('href')) ||
                                   element.hasAttribute('onclick') ||
                                   (element.hasAttribute('role') && element.getAttribute('role') === 'button');
        
        const lowerText = text.toLowerCase();
        
        // Check for primary action phrases first
        const hasPrimaryPhrase = ctaHelpers.containsAnyWord(text, ctaDictionary.PRIMARY_CTA_PHRASES);
        if (hasPrimaryPhrase && isInteractiveButton) {
          return 'primary';
        }
        
        // Visual prominence check for primary classification
        const backgroundColor = computedStyle.backgroundColor;
        const hasProminentStyling = backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                   backgroundColor !== 'transparent' &&
                                   (backgroundColor.includes('rgb') || backgroundColor.includes('#'));
        
        // If it's a button with strong action words and prominent styling
        const hasStrongAction = ctaHelpers.containsAnyWord(text, ctaDictionary.STRONG_ACTION_WORDS);
        if (hasStrongAction && isInteractiveButton && hasProminentStyling && initialType === 'secondary') {
          return 'primary';
        }
        
        return initialType;
      };

      // Find all CTA elements
      for (const { selector, type } of ctaSelectors) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element) => {
          if (processedElements.has(element)) return;
          
          let text = element.textContent?.trim() || '';
          
          if (element.tagName === 'INPUT' && (element as HTMLInputElement).value) {
            text = (element as HTMLInputElement).value.trim();
          }
          
          if (text.length === 0) return;
          
          // Enhanced filtering for better CTA detection
          if (text.length < 2 || text.length > 150) return; // Slightly more lenient on length
          
          // Skip single names, short words, or testimonial signatures
          if (ctaHelpers.matchesAnyPattern(text, ctaDictionary.NAME_PATTERNS)) return;
          
          // Skip very long descriptive text (likely not a CTA button)
          if (text.length > 80 && !text.toLowerCase().includes('start') && !text.toLowerCase().includes('get')) return;
          
          // Skip logos and brand names (generic patterns)
          if (ctaHelpers.matchesAnyPattern(text, ctaDictionary.LOGO_PATTERNS)) return;
          
          // Skip if element has logo-related attributes or classes
          const hasLogoClass = element.className.toLowerCase().includes('logo') || 
                              element.closest('[class*="logo"], [alt*="logo"], [title*="logo"]');
          if (hasLogoClass) return;
          
          // Enhanced navigation filtering
          if (ctaHelpers.containsAnyWord(text, ctaDictionary.NAVIGATION_WORDS)) return;
          
          // Skip obvious navigation phrases
          if (ctaHelpers.containsAnyWord(text, ctaDictionary.NAVIGATION_PHRASES)) return;
          
          // Skip elements that are likely decorative or non-actionable
          if (ctaHelpers.matchesAnyPattern(text, ctaDictionary.DECORATIVE_PATTERNS)) return;

          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          // Skip hidden elements
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
            return;
          }

          const isAboveFold = rect.top < viewport.height;
          const context = determineContext(element);
          const actionStrength = analyzeActionStrength(text);
          const urgency = analyzeUrgency(text);
          const visibility = analyzeVisibility(element, computedStyle);
          const surroundingText = getSurroundingText(element);
          
          const cta = {
            text,
            type: refineCTAType(element, type, text, computedStyle),
            isAboveFold,
            actionStrength,
            urgency,
            visibility,
            context,
            hasValueProposition: hasValueProposition(surroundingText),
            hasUrgency: urgency === 'high',
            hasGuarantee: hasGuarantee(surroundingText),
            mobileOptimized: isMobileOptimized(element, computedStyle, viewport),
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          };

          ctas.push(cta);
          processedElements.add(element);
        });
      }

      // Additional search for clickable elements with action phrases that might have been missed
      const additionalClickableElements = document.querySelectorAll('a, button, input[type="submit"], [onclick], [role="button"]');
      additionalClickableElements.forEach(element => {
        if (processedElements.has(element)) return;
        
        let text = element.textContent?.trim() || '';
        
        // For input elements, get the value instead
        if (element.tagName === 'INPUT' && (element as HTMLInputElement).value) {
          const inputText = (element as HTMLInputElement).value.trim();
          if (inputText) text = inputText;
        }
        
        if (text.length < 2 || text.length > 200) return;
        
        // Filter out single names and testimonial patterns
        if (ctaHelpers.matchesAnyPattern(text, ctaDictionary.NAME_PATTERNS)) return;
        
        // Skip logos and brand names in additional search too
        if (ctaHelpers.matchesAnyPattern(text, ctaDictionary.LOGO_PATTERNS)) return;
        
        // Skip if element has logo-related attributes or classes
        const hasLogoClass = element.className.toLowerCase().includes('logo') || 
                            element.closest('[class*="logo"], [alt*="logo"], [title*="logo"]');
        if (hasLogoClass) return;
        
        // Enhanced action phrase detection for modern SaaS/e-commerce
        const hasActionPhrase = ctaHelpers.containsAnyWord(text, ctaDictionary.ACTION_PHRASES);
        
        if (hasActionPhrase) {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
            return;
          }

          const isAboveFold = rect.top < viewport.height;
          const context = determineContext(element);
          const actionStrength = analyzeActionStrength(text);
          const urgency = analyzeUrgency(text);
          const visibility = analyzeVisibility(element, computedStyle);
          const surroundingText = getSurroundingText(element);
          
          const cta = {
            text: text.length > 100 ? text.substring(0, 100) + '...' : text,
            type: refineCTAType(element, 'secondary', text, computedStyle),
            isAboveFold,
            actionStrength,
            urgency,
            visibility,
            context,
            hasValueProposition: hasValueProposition(surroundingText),
            hasUrgency: urgency === 'high',
            hasGuarantee: hasGuarantee(surroundingText),
            mobileOptimized: isMobileOptimized(element, computedStyle, viewport),
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          };

          ctas.push(cta);
          processedElements.add(element);
        }
      });
      
      return ctas;
      } catch (error) {
        console.error('Error in page.evaluate:', error);
        return [];
      }
    }, viewport, {
      ...CTA_DICTIONARY,
      // Convert regex patterns to strings for serialization
      DECORATIVE_PATTERNS: CTA_DICTIONARY.DECORATIVE_PATTERNS.map(r => r.source),
      LOGO_PATTERNS: CTA_DICTIONARY.LOGO_PATTERNS.map(r => r.source),
      NAME_PATTERNS: CTA_DICTIONARY.NAME_PATTERNS.map(r => r.source),
      PRIMARY_CTA_CLASS_PATTERNS: CTA_DICTIONARY.PRIMARY_CTA_CLASS_PATTERNS.map(r => r.source)
    });

    console.log(`📊 Found ${ctaData.length} potential CTAs`);
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Remove duplicate CTAs based on text similarity
    const uniqueCTAs: CTAElement[] = [];
    ctaData.forEach((cta: CTAElement) => {
      const isDuplicate = uniqueCTAs.some(existing => {
        // Consider duplicates if text is very similar or one contains the other
        const similarity = cta.text.toLowerCase().trim() === existing.text.toLowerCase().trim() ||
                          cta.text.toLowerCase().includes(existing.text.toLowerCase()) ||
                          existing.text.toLowerCase().includes(cta.text.toLowerCase());
        
        // If similar, keep the shorter, cleaner version
        if (similarity && cta.text.length < existing.text.length) {
          const index = uniqueCTAs.indexOf(existing);
          uniqueCTAs[index] = cta;
          return true;
        }
        
        return similarity;
      });
      
      if (!isDuplicate) {
        uniqueCTAs.push(cta);
      }
    });

    // Identify primary and secondary CTAs
    const primaryCTA = identifyPrimaryCTA(uniqueCTAs);
    const secondaryCTAs = uniqueCTAs.filter(cta => cta !== primaryCTA);

    // Calculate score and generate issues
    const score = calculateCTAScore(uniqueCTAs, primaryCTA, issues, recommendations);

    console.log(`🎯 CTA Analysis complete: ${uniqueCTAs.length} CTAs found (${ctaData.length} before deduplication), score: ${score}`);
    
    return {
      score,
      ctas: uniqueCTAs,
      primaryCTA,
      secondaryCTAs,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ CTA Analysis failed with error:', error);
    
    // Return empty results on error
    return {
      score: 0,
      ctas: [],
      primaryCTA: undefined,
      secondaryCTAs: [],
      issues: ['CTA analysis failed due to an error'],
      recommendations: []
    };
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
      console.log('✨ CTA analysis complete!');
    }
  }
}


function identifyPrimaryCTA(ctas: CTAElement[]): CTAElement | undefined {
  if (ctas.length === 0) return undefined;
  
  // Scoring function for CTA priority
  const scoreCTA = (cta: CTAElement): number => {
    let score = 0;
    
    // Hero section CTAs get highest priority (main conversion action)
    if (cta.context === 'hero') score += 50;
    
    // Form submissions are typically primary actions
    if (cta.type === 'form-submit') score += 40;
    
    // Higher score for checkout/purchase URLs (but lower than hero CTAs)
    if (cta.text.includes('checkout') || cta.text.includes('purchase') || cta.text.includes('cart')) score += 35;
    
    // Explicit CTA classes get priority
    if (cta.type === 'primary') score += 30;
    
    // Above fold gets priority
    if (cta.isAboveFold) score += 20;
    
    // Strong action words
    if (cta.actionStrength === 'strong') score += 15;
    else if (cta.actionStrength === 'medium') score += 10;
    
    // High visibility
    if (cta.visibility === 'high') score += 15;
    else if (cta.visibility === 'medium') score += 10;
    
    // Penalize header navigation links (they're typically secondary)
    if (cta.context === 'header' && !cta.text.toLowerCase().includes('start') && !cta.text.toLowerCase().includes('get')) score -= 10;
    
    // Content area CTAs are better than header navigation
    if (cta.context === 'content') score += 8;
    
    // Urgency indicators
    if (cta.urgency === 'high') score += 5;
    
    return score;
  };
  
  // Sort all CTAs by score and return the highest
  return ctas.sort((a, b) => scoreCTA(b) - scoreCTA(a))[0];
}

function calculateCTAScore(
  ctas: CTAElement[], 
  primaryCTA: CTAElement | undefined, 
  issues: string[], 
  recommendations: string[]
): number {
  let score = 100;
  
  const aboveFoldCTAs = ctas.filter(cta => cta.isAboveFold);
  
  // If we have CTAs but none above the fold
  if (ctas.length > 0 && aboveFoldCTAs.length === 0) {
    issues.push('No clear CTA above the fold');
    score -= 50;
  }
  
  // No primary CTA identified but we have CTAs
  if (!primaryCTA && ctas.length > 0) {
    issues.push('No clear primary CTA identified');
    score -= 30;
    recommendations.push('Add a prominent primary CTA with strong action words');
  }
  
  // No CTAs at all - severe penalty
  if (ctas.length === 0) {
    issues.push('No CTAs found on page');
    score -= 50;
  }
  
  // Too many competing CTAs above the fold
  if (aboveFoldCTAs.length > 4) {
    issues.push(`Too many competing CTAs above the fold (${aboveFoldCTAs.length} found) - focus on 1-2 primary actions`);
    score -= 20;
  }
  
  // Evaluate primary CTA quality
  if (primaryCTA) {
    if (primaryCTA.actionStrength === 'weak') {
      issues.push('Primary CTA uses weak action words');
      score -= 15;
      recommendations.push('Use stronger action words like "Get", "Start", "Buy", or "Join"');
    }
    
    if (primaryCTA.visibility === 'low') {
      issues.push('Primary CTA has low visibility');
      score -= 20;
      recommendations.push('Make primary CTA more prominent with better contrast, size, and spacing');
    }
    
    if (!primaryCTA.hasValueProposition) {
      score -= 10;
      recommendations.push('Add value proposition near your primary CTA');
    }
    
    if (primaryCTA.context === 'footer') {
      issues.push('Primary CTA is located in footer instead of above the fold');
      score -= 25;
    }
  }
  
  // Check for mobile optimization
  const mobileOptimizedCTAs = ctas.filter(cta => cta.mobileOptimized);
  if (mobileOptimizedCTAs.length < ctas.length * 0.8) {
    issues.push('Some CTAs may not be mobile-optimized');
    score -= 10;
    recommendations.push('Ensure CTAs have adequate touch target size (44px+) and readable text (16px+)');
  }
  
  // Check for very weak CTAs (only weak action words)
  const weakCTAs = ctas.filter(cta => cta.actionStrength === 'weak' && cta.type === 'other');
  if (weakCTAs.length === ctas.length && ctas.length > 0) {
    score -= 15; // Additional penalty for only having weak CTAs
  }
  
  // Bonus for best practices
  if (primaryCTA?.hasGuarantee) {
    score += 5;
  }
  
  if (primaryCTA?.hasValueProposition && primaryCTA?.context === 'hero') {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
