import { JSDOM } from 'jsdom';

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
}

const STRONG_ACTION_WORDS = [
  'buy', 'purchase', 'order', 'get', 'start', 'begin', 'join', 'sign up', 'register',
  'download', 'grab', 'claim', 'unlock', 'access', 'discover', 'try', 'create'
];

const URGENCY_WORDS = [
  'now', 'today', 'instant', 'immediately', 'limited', 'exclusive', 'urgent',
  'hurry', 'fast', 'quick', 'deadline', 'expires', 'only', 'last chance'
];

const WEAK_ACTION_WORDS = [
  'learn', 'read', 'view', 'see', 'browse', 'explore', 'submit', 'send', 'click'
];

export async function analyzeCTA(html: string, options: AnalysisOptions = {}): Promise<CTAAnalysisResult> {
  console.log('🔍 CTA Analysis starting...');
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const dom = new JSDOM(html, { 
      pretendToBeVisual: true,
      resources: 'usable',
      // Ignore CSS parsing errors for real-world websites
      virtualConsole: new (require('jsdom').VirtualConsole)().sendTo(console, { omitJSDOMErrors: true })
    });
    const { document, window } = dom.window;
    
    console.log('📄 JSDOM created successfully');

  // Set viewport for above-fold calculations
  Object.defineProperty(window, 'innerWidth', { value: viewport.width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: viewport.height, writable: true });

  // Mock getBoundingClientRect for JSDOM
  const mockGetBoundingClientRect = function(this: Element) {
    const computedStyle = window.getComputedStyle(this);
    const display = computedStyle.display;
    const visibility = computedStyle.visibility;
    
    // Return zero rect for hidden elements
    if (display === 'none' || visibility === 'hidden') {
      return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };
    }
    
    // Check for explicit positioning from style attribute
    const style = (this as HTMLElement).style;
    let top = 0;
    
    if (style.marginTop) {
      const marginTop = parseInt(style.marginTop);
      if (!isNaN(marginTop)) {
        top = marginTop;
      }
    } else {
      // Simple positioning for visible elements based on document order
      const allElements = Array.from(document.querySelectorAll('*'));
      const index = allElements.indexOf(this);
      top = index * 50; // Rough spacing
    }
    
    return {
      top,
      left: 0,
      width: 100,
      height: 40,
      right: 100,
      bottom: top + 40
    };
  };

  // Apply mock to all elements
  document.querySelectorAll('*').forEach(el => {
    (el as any).getBoundingClientRect = mockGetBoundingClientRect.bind(el);
  });

  const ctas: CTAElement[] = [];
  const issues: string[] = [];
  const recommendations: string[] = [];

  // More precise CTA selectors focusing on actual actionable elements
  const ctaSelectors = [
    // High priority: explicit CTA classes and purchase/checkout links
    { selector: '.cta-button, [class*="cta-button"], .cta, [class*="cta"]', type: 'primary' as const },
    { selector: 'a[href*="checkout"], a[href*="cart"], a[href*="purchase"], a[href*="buy"]', type: 'primary' as const },
    { selector: 'a[href*="signup"], a[href*="register"], a[href*="trial"], a[href*="order"]', type: 'primary' as const },
    
    // Medium priority: buttons and form submissions
    { selector: 'button[class*="primary"], .btn-primary, .button-primary', type: 'primary' as const },
    { selector: 'input[type="submit"], button[type="submit"]', type: 'form-submit' as const },
    { selector: '.btn, .button, button', type: 'secondary' as const },
    
    // Lower priority: general interactive elements (but more selective)
    { selector: '[role="button"]', type: 'secondary' as const },
    { selector: '[onclick]', type: 'other' as const }
  ];

  // Find all CTA elements
  const processedElements = new Set<Element>();
  
  for (const { selector, type } of ctaSelectors) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element) => {
      if (processedElements.has(element)) return; // Skip already processed elements
      
      let text = element.textContent?.trim() || '';
      
      // Handle input elements with value attribute
      if (element.tagName === 'INPUT' && (element as HTMLInputElement).value) {
        text = (element as HTMLInputElement).value.trim();
      }
      
      if (text.length === 0) return; // Skip empty elements
      
      // Filter out non-CTA patterns early
      if (text.length < 3 || text.length > 200) return;
      
      // Skip single names, short words, or testimonial signatures
      if (text.match(/^[A-Z][a-z]+ ?[A-Z]?\.?$/)) return; // "John R", "Tamara N", etc.
      if (text.match(/^[A-Z][a-z]+$/)) return; // "Maxwell", "Regina", etc.
      if (text.match(/^[A-Z]{1,3}$/)) return; // "US", "CA", etc.
      
      // Skip navigation-like text
      const navigationWords = ['home', 'about', 'contact', 'help', 'faq', 'blog', 'news', 'terms', 'privacy'];
      if (navigationWords.includes(text.toLowerCase())) return;

      // Apply getBoundingClientRect if not already applied
      if (!(element as any).getBoundingClientRect) {
        (element as any).getBoundingClientRect = mockGetBoundingClientRect.bind(element);
      }

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
      
      const cta: CTAElement = {
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

  // Additional text-based search for price CTAs and action phrases (more selective)
  const allElements = document.querySelectorAll('span, div, p, a, button');
  allElements.forEach(element => {
    if (processedElements.has(element)) return;
    
    const text = element.textContent?.trim() || '';
    
    // Filter out short texts and common non-CTA patterns
    if (text.length < 5 || text.length > 200) return;
    
    // Filter out single names and testimonial patterns
    if (text.match(/^[A-Z][a-z]+ ?[A-Z]?\.?$/)) return; // "John R", "Tamara N", etc.
    if (text.match(/^[A-Z][a-z]+$/)) return; // "Maxwell", "Regina", etc.
    
    // Look for price indicators and strong action phrases
    const hasPrice = text.match(/\$\d+/);
    const hasActionPhrase = text.toLowerCase().includes('build your') ||
                           text.toLowerCase().includes('get started') ||
                           text.toLowerCase().includes('start free') ||
                           text.toLowerCase().includes('join now') ||
                           text.toLowerCase().includes('sign up') ||
                           text.toLowerCase().includes('try free') ||
                           text.toLowerCase().includes('buy now') ||
                           text.toLowerCase().includes('get ') ||
                           text.toLowerCase().includes('start ') ||
                           text.toLowerCase().includes('access');
    
    // Only proceed if it has price or strong action phrases
    if (hasPrice || hasActionPhrase) {
      
      // Apply getBoundingClientRect if not already applied
      if (!(element as any).getBoundingClientRect) {
        (element as any).getBoundingClientRect = mockGetBoundingClientRect.bind(element);
      }

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
      
      const cta: CTAElement = {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        type: text.match(/\$\d+/) ? 'primary' : refineCTAType(element, 'secondary', text),
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

  // Remove duplicate CTAs based on text similarity
  const uniqueCTAs: CTAElement[] = [];
  ctas.forEach(cta => {
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

  console.log(`🎯 CTA Analysis complete: ${uniqueCTAs.length} CTAs found (${ctas.length} before deduplication), score: ${score}`);
  
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
  }
}

function determineContext(element: Element): CTAElement['context'] {
  const parent = element.closest('header, nav, .header, .navigation') ? 'header' :
                 element.closest('footer, .footer') ? 'footer' :
                 element.closest('.hero, .banner, .jumbotron') ? 'hero' :
                 element.closest('aside, .sidebar') ? 'sidebar' :
                 element.closest('form') ? 'form' : 'content';
  
  return parent;
}

function analyzeActionStrength(text: string): CTAElement['actionStrength'] {
  const lowerText = text.toLowerCase();
  
  if (STRONG_ACTION_WORDS.some(word => lowerText.includes(word))) {
    return 'strong';
  }
  
  if (WEAK_ACTION_WORDS.some(word => lowerText.includes(word))) {
    return 'weak';
  }
  
  return 'medium';
}

function analyzeUrgency(text: string): CTAElement['urgency'] {
  const lowerText = text.toLowerCase();
  
  if (URGENCY_WORDS.some(word => lowerText.includes(word))) {
    return 'high';
  }
  
  if (lowerText.includes('free') || lowerText.includes('trial')) {
    return 'medium';
  }
  
  return 'low';
}

function analyzeVisibility(element: Element, computedStyle: CSSStyleDeclaration): CTAElement['visibility'] {
  const fontSize = parseInt(computedStyle.fontSize || '16');
  const padding = parseInt(computedStyle.padding || '0');
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  
  // High visibility: large, well-padded, contrasting colors
  if (fontSize >= 16 && padding >= 10 && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
    return 'high';
  }
  
  // Low visibility: small text, minimal padding
  if (fontSize < 12 || (padding < 5 && backgroundColor === 'rgba(0, 0, 0, 0)')) {
    return 'low';
  }
  
  return 'medium';
}

function getSurroundingText(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return '';
  
  // Get text from parent and siblings
  const siblingText = Array.from(parent.children)
    .filter(child => child !== element)
    .map(child => child.textContent?.trim() || '')
    .join(' ');
    
  return siblingText.toLowerCase();
}

function hasValueProposition(surroundingText: string): boolean {
  const valueWords = [
    'free', 'save', 'discount', 'offer', 'deal', 'benefit', 'advantage',
    'result', 'outcome', 'guarantee', 'promise', 'increase', 'improve',
    'boost', 'double', 'triple', 'roi', 'return', 'profit'
  ];
  
  return valueWords.some(word => surroundingText.includes(word));
}

function hasGuarantee(surroundingText: string): boolean {
  const guaranteeWords = [
    'guarantee', 'money back', 'refund', 'risk free', 'no risk',
    'satisfaction guaranteed', 'promise', 'assured'
  ];
  
  return guaranteeWords.some(word => surroundingText.includes(word));
}

function isMobileOptimized(element: Element, computedStyle: CSSStyleDeclaration, viewport: { width: number; height: number }): boolean {
  if (viewport.width > 768) return true; // Not mobile viewport
  
  const fontSize = parseInt(computedStyle.fontSize || '16');
  const padding = parseInt(computedStyle.padding || '0');
  const width = parseInt(computedStyle.width || '0');
  
  // Mobile-friendly: adequate touch target size, readable font
  return fontSize >= 16 && padding >= 8 && (width >= 44 || width === 0); // width 0 means auto
}

function refineCTAType(element: Element, initialType: CTAElement['type'], text: string): CTAElement['type'] {
  // Refine type based on element properties and text
  if (element.classList.contains('btn-primary') || element.classList.contains('cta-primary')) {
    return 'primary';
  }
  
  if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'submit') {
    return 'form-submit';
  }
  
  if (element.tagName === 'BUTTON' && element.closest('form')) {
    return 'form-submit';
  }
  
  const strongText = STRONG_ACTION_WORDS.some(word => text.toLowerCase().includes(word));
  if (strongText && initialType === 'secondary') {
    return 'primary';
  }
  
  return initialType;
}

function identifyPrimaryCTA(ctas: CTAElement[]): CTAElement | undefined {
  if (ctas.length === 0) return undefined;
  
  // Scoring function for CTA priority
  const scoreCTA = (cta: CTAElement): number => {
    let score = 0;
    
    // Higher score for checkout/purchase URLs (highest priority)
    if (cta.text.includes('checkout') || cta.text.includes('purchase') || cta.text.includes('cart')) score += 50;
    
    // Price CTAs get high priority
    if (cta.text.match(/\$\d+/)) score += 40;
    
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
    
    // Hero context gets priority
    if (cta.context === 'hero') score += 10;
    else if (cta.context === 'header') score += 5;
    
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