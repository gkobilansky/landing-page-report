import puppeteer, { Page } from 'puppeteer';

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
}


export async function analyzeCTA(urlOrHtml: string, options: AnalysisOptions = {}): Promise<CTAAnalysisResult> {
  console.log('🔍 CTA Analysis starting...');
  
  let browser;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const isHtml = options.isHtml || false;
    
    console.log('📱 Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
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
    const ctaData = await page.evaluate((viewport) => {
      const ctas: any[] = [];
      const processedElements = new Set<Element>();
      
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
        const lowerText = text.toLowerCase();
        const strongWords = ['buy', 'purchase', 'order', 'get', 'start', 'begin', 'join', 'sign up', 'register', 'download', 'grab', 'claim', 'unlock', 'access', 'discover', 'try', 'create'];
        const weakWords = ['learn', 'read', 'view', 'see', 'browse', 'explore', 'submit', 'send', 'click'];
        
        if (strongWords.some(word => lowerText.includes(word))) return 'strong';
        if (weakWords.some(word => lowerText.includes(word))) return 'weak';
        return 'medium';
      };
      
      const analyzeUrgency = (text: string): string => {
        const lowerText = text.toLowerCase();
        const urgencyWords = ['now', 'today', 'instant', 'immediately', 'limited', 'exclusive', 'urgent', 'hurry', 'fast', 'quick', 'deadline', 'expires', 'only', 'last chance'];
        
        if (urgencyWords.some(word => lowerText.includes(word))) return 'high';
        if (lowerText.includes('free') || lowerText.includes('trial')) return 'medium';
        return 'low';
      };
      
      const analyzeVisibility = (element: Element, computedStyle: CSSStyleDeclaration): string => {
        const fontSize = parseInt(computedStyle.fontSize || '16');
        const padding = parseInt(computedStyle.padding || '0');
        const backgroundColor = computedStyle.backgroundColor;
        
        if (fontSize >= 16 && padding >= 10 && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          return 'high';
        }
        if (fontSize < 12 || (padding < 5 && backgroundColor === 'rgba(0, 0, 0, 0)')) {
          return 'low';
        }
        return 'medium';
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
        const valueWords = ['free', 'save', 'discount', 'offer', 'deal', 'benefit', 'advantage', 'result', 'outcome', 'guarantee', 'promise', 'increase', 'improve', 'boost', 'double', 'triple', 'roi', 'return', 'profit'];
        return valueWords.some(word => surroundingText.includes(word));
      };
      
      const hasGuarantee = (surroundingText: string): boolean => {
        const guaranteeWords = ['guarantee', 'money back', 'refund', 'risk free', 'no risk', 'satisfaction guaranteed', 'promise', 'assured'];
        return guaranteeWords.some(word => surroundingText.includes(word));
      };
      
      const isMobileOptimized = (element: Element, computedStyle: CSSStyleDeclaration, viewport: any): boolean => {
        if (viewport.width > 768) return true;
        
        const fontSize = parseInt(computedStyle.fontSize || '16');
        const padding = parseInt(computedStyle.padding || '0');
        const width = parseInt(computedStyle.width || '0');
        
        return fontSize >= 16 && padding >= 8 && (width >= 44 || width === 0);
      };
      
      const refineCTAType = (element: Element, initialType: string, text: string): string => {
        if (element.classList.contains('btn-primary') || element.classList.contains('cta-primary')) {
          return 'primary';
        }
        
        if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'submit') {
          return 'form-submit';
        }
        
        if (element.tagName === 'BUTTON' && element.closest('form')) {
          return 'form-submit';
        }
        
        const strongWords = ['buy', 'purchase', 'order', 'get', 'start', 'begin', 'join', 'sign up', 'register', 'download', 'grab', 'claim', 'unlock', 'access', 'discover', 'try', 'create'];
        const strongText = strongWords.some(word => text.toLowerCase().includes(word));
        if (strongText && initialType === 'secondary') {
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
          
          // Filter out non-CTA patterns early
          if (text.length < 3 || text.length > 200) return;
          
          // Skip single names, short words, or testimonial signatures
          if (text.match(/^[A-Z][a-z]+ ?[A-Z]?\.?$/)) return;
          if (text.match(/^[A-Z][a-z]+$/)) return;
          if (text.match(/^[A-Z]{1,3}$/)) return;
          
          // Skip logos and brand names (generic patterns)
          const logoPatterns = [
            /logo$/i,
            /^[A-Z][a-z]+ logo$/i,
            /^[A-Z]+ logo$/i,
            /^[A-Z]{2,}$/,  // All caps brand names
            /^[A-Z][a-z]+\s+[A-Z][a-z]+$/  // Title Case Brand Names
          ];
          if (logoPatterns.some(pattern => pattern.test(text))) return;
          
          // Skip if element has logo-related attributes or classes
          const hasLogoClass = element.className.toLowerCase().includes('logo') || 
                              element.closest('[class*="logo"], [alt*="logo"], [title*="logo"]');
          if (hasLogoClass) return;
          
          // Skip navigation-like text and non-actionable elements
          const navigationWords = ['home', 'about', 'contact', 'help', 'faq', 'blog', 'news', 'terms', 'privacy'];
          if (navigationWords.includes(text.toLowerCase())) return;
          
          // Skip elements that are likely decorative or non-actionable
          const decorativePatterns = [
            /^(next|previous|prev)$/i,
            /^(slide|tab) \d+$/i,
            /^\d+\/\d+$/,
            /^page \d+$/i
          ];
          if (decorativePatterns.some(pattern => pattern.test(text))) return;

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
            type: refineCTAType(element, type, text),
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
        if (text.match(/^[A-Z][a-z]+ ?[A-Z]?\.?$/)) return;
        if (text.match(/^[A-Z][a-z]+$/)) return;
        
        // Skip logos and brand names in additional search too
        const logoPatterns = [
          /logo$/i,
          /^[A-Z][a-z]+ logo$/i,
          /^[A-Z]+ logo$/i,
          /^[A-Z]{2,}$/,  // All caps brand names
          /^[A-Z][a-z]+\s+[A-Z][a-z]+$/  // Title Case Brand Names
        ];
        if (logoPatterns.some(pattern => pattern.test(text))) return;
        
        // Skip if element has logo-related attributes or classes
        const hasLogoClass = element.className.toLowerCase().includes('logo') || 
                            element.closest('[class*="logo"], [alt*="logo"], [title*="logo"]');
        if (hasLogoClass) return;
        
        // Look for action phrases in clickable elements only
        const hasActionPhrase = text.toLowerCase().includes('build your') ||
                               text.toLowerCase().includes('get started') ||
                               text.toLowerCase().includes('start free') ||
                               text.toLowerCase().includes('join now') ||
                               text.toLowerCase().includes('sign up') ||
                               text.toLowerCase().includes('try free') ||
                               text.toLowerCase().includes('buy now') ||
                               text.toLowerCase().includes('learn more') ||
                               text.toLowerCase().includes('contact') ||
                               text.toLowerCase().includes('demo') ||
                               text.toLowerCase().includes('subscribe');
        
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
            type: refineCTAType(element, 'secondary', text),
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
    }, viewport);

    console.log(`📊 Found ${ctaData.length} potential CTAs`);
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Remove duplicate CTAs based on text similarity
    const uniqueCTAs: CTAElement[] = [];
    ctaData.forEach(cta => {
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
  
  // No CTA above the fold - major penalty
  if (aboveFoldCTAs.length === 0) {
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
    issues.push('No clear CTA above the fold');
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