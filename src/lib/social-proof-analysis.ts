import { Page } from 'puppeteer-core';
import { createPuppeteerBrowser } from './puppeteer-config';

export interface SocialProofElement {
  type: 'testimonial' | 'review' | 'rating' | 'trust-badge' | 'customer-count' | 'social-media' | 'certification' | 'partnership' | 'case-study' | 'news-mention';
  text: string;
  score: number; // Individual element quality score
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  isAboveFold: boolean;
  hasImage: boolean;
  hasName: boolean;
  hasCompany: boolean;
  hasRating: boolean;
  credibilityScore: number; // How credible this element appears
  visibility: 'high' | 'medium' | 'low';
  context: 'hero' | 'header' | 'content' | 'sidebar' | 'footer' | 'other';
}

export interface SocialProofAnalysisResult {
  score: number;
  elements: SocialProofElement[];
  summary: {
    totalElements: number;
    aboveFoldElements: number;
    testimonials: number;
    reviews: number;
    ratings: number;
    trustBadges: number;
    customerCounts: number;
    socialMedia: number;
    certifications: number;
    partnerships: number;
    caseStudies: number;
    newsMentions: number;
  };
  issues: string[];
  recommendations: string[];
}

interface AnalysisOptions {
  viewport?: {
    width: number;
    height: number;
  };
  isHtml?: boolean;
}

export async function analyzeSocialProof(urlOrHtml: string, options: AnalysisOptions = {}): Promise<SocialProofAnalysisResult> {
  console.log('🔍 Social Proof Analysis starting...');
  
  let browser;
  
  try {
    const viewport = options.viewport || { width: 1920, height: 1080 };
    const isHtml = options.isHtml || false;
    
    console.log('📱 Launching Puppeteer browser...');
    
    browser = await createPuppeteerBrowser();
    
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

    // Extract social proof elements using Puppeteer page evaluation
    console.log('🔍 Extracting social proof elements...');
    const socialProofData = await page.evaluate((viewport) => {
      const elements: any[] = [];
      const processedElements = new Set<Element>();
      
      // Helper functions (moved inside evaluate)
      const determineContext = (element: Element): string => {
        const parent = element.closest('header, nav, .header, .navigation') ? 'header' :
                       element.closest('footer, .footer') ? 'footer' :
                       element.closest('.hero, .banner, .jumbotron') ? 'hero' :
                       element.closest('aside, .sidebar') ? 'sidebar' : 'content';
        return parent;
      };
      
      const analyzeVisibility = (element: Element, computedStyle: CSSStyleDeclaration): string => {
        const fontSize = parseInt(computedStyle.fontSize || '16');
        const rect = element.getBoundingClientRect();
        
        if (fontSize >= 14 && rect.width > 200 && rect.height > 50) {
          return 'high';
        }
        if (fontSize < 12 || rect.width < 100 || rect.height < 30) {
          return 'low';
        }
        return 'medium';
      };
      
      const calculateCredibilityScore = (element: Element, text: string, type: string): number => {
        let score = 50; // Base score
        
        // Check for specific credibility indicators
        const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text) || 
                       element.querySelector('.name, .author, [class*="name"], [class*="author"]');
        const hasCompany = /\b(CEO|CTO|Manager|Director|VP|President|Founder)\b/i.test(text) ||
                          element.querySelector('.company, .title, [class*="company"], [class*="title"]');
        const hasImage = element.querySelector('img, .avatar, [class*="avatar"], [class*="photo"]');
        const hasRating = element.querySelector('.rating, .stars, [class*="rating"], [class*="star"]') ||
                         /★|⭐|stars?|rating/i.test(text);
        
        // Boost score for credibility indicators
        if (hasName) score += 15;
        if (hasCompany) score += 20;
        if (hasImage) score += 10;
        if (hasRating) score += 15;
        
        // Type-specific scoring
        if (type === 'testimonial' && hasName && hasCompany) score += 10;
        if (type === 'review' && hasRating) score += 10;
        if (type === 'trust-badge' || type === 'certification') score += 20;
        
        // Length and quality indicators
        if (text.length > 100 && text.length < 500) score += 10; // Good length for testimonials
        if (text.split(' ').length > 15) score += 5; // Detailed content
        
        // Penalty for generic or low-quality content
        if (text.length < 20) score -= 20;
        if (/lorem ipsum|placeholder|sample|test/i.test(text)) score -= 30;
        
        return Math.max(0, Math.min(100, score));
      };
      
      const classifyElement = (element: Element, text: string): string => {
        const lowerText = text.toLowerCase();
        const classList = element.className?.toString().toLowerCase() || '';
        
        // Testimonial patterns
        if (classList.includes('testimonial') || classList.includes('quote') ||
            lowerText.includes('testimonial') || 
            (lowerText.includes('"') && lowerText.length > 50)) {
          return 'testimonial';
        }
        
        // Review patterns - be more strict, require actual rating indicators
        if ((classList.includes('review') || lowerText.includes('review')) &&
            (element.querySelector('.rating, .stars, [class*="rating"], [class*="star"]') ||
             /★|⭐|stars?|rating|\d+\/\d+|\d+\.\d+\/\d+/i.test(text))) {
          return 'review';
        }
        
        // Trust badge patterns
        if (classList.includes('trust') || classList.includes('badge') || classList.includes('secure') ||
            classList.includes('ssl') || classList.includes('certified') ||
            /ssl|secure|verified|trusted|guarantee|certified|award/i.test(text)) {
          return 'trust-badge';
        }
        
        // Customer count patterns
        if (/\d+[,\.]?\d*\s*(customers?|users?|clients?|companies?|businesses?|people|members?)/i.test(text) ||
            /over\s+\d+|more than\s+\d+|\d+\+/i.test(text)) {
          return 'customer-count';
        }
        
        // Social media patterns
        if (classList.includes('social') || classList.includes('follow') ||
            /followers?|likes?|shares?|facebook|twitter|instagram|linkedin|youtube/i.test(text) ||
            element.querySelector('[class*="social"], [class*="facebook"], [class*="twitter"], [class*="instagram"]')) {
          return 'social-media';
        }
        
        // Certification patterns
        if (/iso\s?\d+|certified|accredited|compliant|gdpr|hipaa|soc\s?\d+/i.test(text) ||
            classList.includes('certification') || classList.includes('compliance')) {
          return 'certification';
        }
        
        // Partnership patterns
        if (/partner|partnership|powered by|featured in|trusted by/i.test(text) ||
            classList.includes('partner') || classList.includes('featured')) {
          return 'partnership';
        }
        
        // Case study patterns
        if (/case study|success story|customer story|client story/i.test(text) ||
            classList.includes('case-study') || classList.includes('success')) {
          return 'case-study';
        }
        
        // News mention patterns
        if (/featured in|mentioned in|press|news|media|forbes|techcrunch|reuters/i.test(text) ||
            classList.includes('press') || classList.includes('media') || classList.includes('news')) {
          return 'news-mention';
        }
        
        // Rating patterns (specific check)
        if (/★|⭐|stars?|rating|\d+\/\d+|\d+\.\d+\/\d+/i.test(text)) {
          return 'rating';
        }
        
        // Default to testimonial for quote-like content only if it looks like actual feedback
        if ((lowerText.includes('"') || lowerText.includes("'")) && 
            lowerText.length > 30 && lowerText.length < 300 &&
            /\b(helped|improved|transformed|changed|saved|increased|love|recommend|amazing|excellent|great|fantastic|wonderful|outstanding)\b/i.test(text) &&
            !/\b(we|our|build|design|create|offer|provide|service|solution)\b/i.test(text.substring(0, 50))) {
          return 'testimonial';
        }
        
        // Don't classify as social proof if it doesn't match specific patterns
        return 'other';
      };

      // Define selectors for different types of social proof
      const socialProofSelectors = [
        // Testimonials and quotes
        { selector: '.testimonial, .quote, .client-quote, [class*="testimonial"], [class*="quote"]', type: 'testimonial' },
        { selector: 'blockquote', type: 'testimonial' },
        
        // Reviews and ratings
        { selector: '.review, .rating, .stars, [class*="review"], [class*="rating"], [class*="star"]', type: 'review' },
        
        // Trust badges and certifications
        { selector: '.trust-badge, .security, .ssl, .certified, [class*="trust"], [class*="secure"], [class*="ssl"]', type: 'trust-badge' },
        
        // Customer counts and stats
        { selector: '.stats, .counter, .customer-count, [class*="stats"], [class*="counter"], [class*="customer"]', type: 'customer-count' },
        
        // Social media indicators
        { selector: '.social, .followers, [class*="social"], [class*="follow"]', type: 'social-media' },
        
        // Logos and partnerships
        { selector: '.logo, .partner, .featured, [class*="logo"], [class*="partner"], [class*="featured"]', type: 'partnership' },
        
        // Case studies
        { selector: '.case-study, .success-story, [class*="case"], [class*="success"]', type: 'case-study' },
        
        // Press mentions
        { selector: '.press, .media, .news, [class*="press"], [class*="media"], [class*="news"]', type: 'news-mention' }
      ];

      // Process specific selectors
      for (const { selector, type } of socialProofSelectors) {
        const foundElements = document.querySelectorAll(selector);
        
        foundElements.forEach((element) => {
          if (processedElements.has(element)) return;
          
          let text = element.textContent?.trim() || '';
          if (text.length === 0) return;
          
          // Skip very short or very long content, and filter out obvious non-social proof
          if (text.length < 10 || text.length > 1000) return;
          
          // Filter out navigation, page copy, and generic content
          const isGenericContent = /^(home|about|contact|services|portfolio|blog|get started|learn more|our|we|you|your|build|design|develop|create|solution|offer|provide|built|copyright|all rights|terms|privacy|policy)/i.test(text.trim()) ||
                                  /\b(click|button|link|menu|navigation|header|footer|sidebar|copyright|reserved|policy|terms|lansky|tech)\b/i.test(text.toLowerCase()) ||
                                  text.includes('→') || text.includes('↓') || // Arrow indicators suggest UI elements
                                  /^\s*[💡👩🏻‍💻💰😤]\s*/.test(text) || // Starts with emojis (likely design elements)
                                  text.toLowerCase().includes('founder') || // Company bio content
                                  /\b(web development|done right|copyright)\b/i.test(text) ||
                                  text.length > 200; // Very long text is likely page content, not social proof
          
          if (isGenericContent) return;
          
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          // Skip hidden elements
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || 
              rect.width === 0 || rect.height === 0) {
            return;
          }

          const isAboveFold = rect.top < viewport.height;
          const context = determineContext(element);
          const visibility = analyzeVisibility(element, computedStyle);
          const actualType = classifyElement(element, text);
          
          // Skip elements that don't classify as actual social proof
          if (actualType === 'other') return;
          
          const credibilityScore = calculateCredibilityScore(element, text, actualType);
          
          const hasImage = !!element.querySelector('img, .avatar, [class*="avatar"], [class*="photo"]');
          const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text) || 
                         !!element.querySelector('.name, .author, [class*="name"], [class*="author"]');
          const hasCompany = /\b(CEO|CTO|Manager|Director|VP|President|Founder)\b/i.test(text) ||
                            !!element.querySelector('.company, .title, [class*="company"], [class*="title"]');
          const hasRating = !!element.querySelector('.rating, .stars, [class*="rating"], [class*="star"]') ||
                           /★|⭐|stars?|rating/i.test(text);

          const socialProofElement = {
            type: actualType,
            text: text.length > 200 ? text.substring(0, 200) + '...' : text,
            score: credibilityScore,
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            isAboveFold,
            hasImage,
            hasName,
            hasCompany,
            hasRating,
            credibilityScore,
            visibility,
            context
          };

          elements.push(socialProofElement);
          processedElements.add(element);
        });
      }

      // Additional text-based search for social proof patterns
      const allTextElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
      allTextElements.forEach(element => {
        if (processedElements.has(element)) return;
        
        const text = element.textContent?.trim() || '';
        if (text.length < 20 || text.length > 500) return;
        
        // Look for customer count patterns
        const hasCustomerCount = /\d+[,\.]?\d*\s*(customers?|users?|clients?|companies?|businesses?|people|members?)/i.test(text) ||
                                /over\s+\d+|more than\s+\d+|\d+\+\s*(customers?|users?|clients?)/i.test(text);
        
        // Look for testimonial patterns - be more strict
        const hasTestimonialPattern = (text.includes('"') || text.includes("'")) && 
                                     text.length > 30 && text.length < 300 &&
                                     /\b(amazing|excellent|great|fantastic|wonderful|outstanding|love|recommend|best|helped|improved|transformed|changed my|saved us|increased our)\b/i.test(text) &&
                                     !/\b(we|our|us|you|your|lansky|tech|build|design|development|service|solution|offer|provide)\b/i.test(text.substring(0, 50)); // Avoid first-person company copy
        
        // Look for trust indicators
        const hasTrustPattern = /ssl|secure|verified|trusted|guarantee|certified|award|safe|protected/i.test(text);
        
        if (hasCustomerCount || hasTestimonialPattern || hasTrustPattern) {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || 
              rect.width === 0 || rect.height === 0) {
            return;
          }

          const isAboveFold = rect.top < viewport.height;
          const context = determineContext(element);
          const visibility = analyzeVisibility(element, computedStyle);
          
          let detectedType = 'testimonial';
          if (hasCustomerCount) detectedType = 'customer-count';
          else if (hasTrustPattern) detectedType = 'trust-badge';
          else if (!hasTestimonialPattern) return; // Skip if no clear social proof pattern
          
          const credibilityScore = calculateCredibilityScore(element, text, detectedType);
          
          const hasImage = !!element.querySelector('img, .avatar, [class*="avatar"], [class*="photo"]');
          const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text);
          const hasCompany = /\b(CEO|CTO|Manager|Director|VP|President|Founder)\b/i.test(text);
          const hasRating = /★|⭐|stars?|rating/i.test(text);

          const socialProofElement = {
            type: detectedType,
            text: text.length > 200 ? text.substring(0, 200) + '...' : text,
            score: credibilityScore,
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            isAboveFold,
            hasImage,
            hasName,
            hasCompany,
            hasRating,
            credibilityScore,
            visibility,
            context
          };

          elements.push(socialProofElement);
          processedElements.add(element);
        }
      });
      
      return elements;
    }, viewport);

    console.log(`📊 Found ${socialProofData.length} social proof elements`);
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Remove duplicate elements based on text similarity
    const uniqueElements: SocialProofElement[] = [];
    socialProofData.forEach(element => {
      const isDuplicate = uniqueElements.some(existing => {
        const similarity = element.text.toLowerCase().trim() === existing.text.toLowerCase().trim() ||
                          element.text.toLowerCase().includes(existing.text.toLowerCase()) ||
                          existing.text.toLowerCase().includes(element.text.toLowerCase());
        
        if (similarity && element.credibilityScore > existing.credibilityScore) {
          const index = uniqueElements.indexOf(existing);
          uniqueElements[index] = element;
          return true;
        }
        
        return similarity;
      });
      
      if (!isDuplicate) {
        uniqueElements.push(element);
      }
    });

    // Calculate summary statistics
    const summary = {
      totalElements: uniqueElements.length,
      aboveFoldElements: uniqueElements.filter(e => e.isAboveFold).length,
      testimonials: uniqueElements.filter(e => e.type === 'testimonial').length,
      reviews: uniqueElements.filter(e => e.type === 'review').length,
      ratings: uniqueElements.filter(e => e.type === 'rating').length,
      trustBadges: uniqueElements.filter(e => e.type === 'trust-badge').length,
      customerCounts: uniqueElements.filter(e => e.type === 'customer-count').length,
      socialMedia: uniqueElements.filter(e => e.type === 'social-media').length,
      certifications: uniqueElements.filter(e => e.type === 'certification').length,
      partnerships: uniqueElements.filter(e => e.type === 'partnership').length,
      caseStudies: uniqueElements.filter(e => e.type === 'case-study').length,
      newsMentions: uniqueElements.filter(e => e.type === 'news-mention').length
    };

    // Calculate score and generate recommendations
    const score = calculateSocialProofScore(uniqueElements, summary, issues, recommendations);

    console.log(`🎯 Social Proof Analysis complete: ${uniqueElements.length} elements found, score: ${score}`);
    
    return {
      score,
      elements: uniqueElements,
      summary,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Social Proof Analysis failed with error:', error);
    
    return {
      score: 0,
      elements: [],
      summary: {
        totalElements: 0,
        aboveFoldElements: 0,
        testimonials: 0,
        reviews: 0,
        ratings: 0,
        trustBadges: 0,
        customerCounts: 0,
        socialMedia: 0,
        certifications: 0,
        partnerships: 0,
        caseStudies: 0,
        newsMentions: 0
      },
      issues: ['Social proof analysis failed due to an error'],
      recommendations: []
    };
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
      console.log('✨ Social proof analysis complete!');
    }
  }
}

function calculateSocialProofScore(
  elements: SocialProofElement[], 
  summary: any,
  issues: string[], 
  recommendations: string[]
): number {
  let score = 100;
  
  // Base penalties for missing social proof
  if (elements.length === 0) {
    issues.push('No social proof elements found on the page');
    recommendations.push('Add testimonials, reviews, or trust badges to build credibility');
    return 0;
  }
  
  // No social proof above the fold
  if (summary.aboveFoldElements === 0) {
    issues.push('No social proof elements above the fold');
    recommendations.push('Place at least one testimonial or trust indicator above the fold');
    score -= 30;
  }
  
  // Diversity of social proof types
  const typesPresent = [
    summary.testimonials > 0,
    summary.reviews > 0,
    summary.trustBadges > 0,
    summary.customerCounts > 0,
    summary.certifications > 0
  ].filter(Boolean).length;
  
  if (typesPresent < 2) {
    issues.push('Limited variety of social proof types');
    recommendations.push('Add different types of social proof (testimonials, reviews, trust badges, customer counts)');
    score -= 20;
  } else if (typesPresent >= 4) {
    score += 10; // Bonus for good variety
  }
  
  // Quality assessment
  const highQualityElements = elements.filter(e => e.credibilityScore >= 70);
  if (highQualityElements.length === 0) {
    issues.push('Social proof elements lack credibility indicators');
    recommendations.push('Add names, companies, photos, and specific details to testimonials');
    score -= 25;
  }
  
  // Testimonial quality
  if (summary.testimonials > 0) {
    const testimonialElements = elements.filter(e => e.type === 'testimonial');
    const qualityTestimonials = testimonialElements.filter(e => e.hasName && e.credibilityScore >= 60);
    
    if (qualityTestimonials.length / testimonialElements.length < 0.5) {
      issues.push('Testimonials lack names or credibility indicators');
      recommendations.push('Include full names, titles, and companies in testimonials');
      score -= 15;
    }
  } else {
    recommendations.push('Add customer testimonials with names and companies for stronger credibility');
    score -= 15;
  }
  
  // Trust indicators
  if (summary.trustBadges === 0 && summary.certifications === 0) {
    recommendations.push('Add security badges or certifications to increase trust');
    score -= 10;
  }
  
  // Customer count/stats
  if (summary.customerCounts === 0) {
    recommendations.push('Display customer counts or usage statistics to show popularity');
    score -= 10;
  }
  
  // Element visibility
  const lowVisibilityElements = elements.filter(e => e.visibility === 'low');
  if (lowVisibilityElements.length > elements.length * 0.3) {
    issues.push('Some social proof elements have low visibility');
    recommendations.push('Make social proof elements more prominent with better styling and positioning');
    score -= 10;
  }
  
  // Positioning assessment
  const heroElements = elements.filter(e => e.context === 'hero' && e.isAboveFold);
  if (heroElements.length === 0) {
    recommendations.push('Place social proof in the hero section for maximum impact');
    score -= 5;
  }
  
  // Bonus for excellent implementation
  if (elements.length >= 3 && summary.aboveFoldElements >= 2 && 
      highQualityElements.length >= 2 && typesPresent >= 3) {
    score += 10;
  }
  
  // Check for potential fake social proof patterns
  const suspiciousElements = elements.filter(e => 
    e.text.includes('lorem ipsum') || 
    e.text.includes('sample') || 
    e.text.includes('placeholder') ||
    e.credibilityScore < 30
  );
  
  if (suspiciousElements.length > 0) {
    issues.push('Some social proof elements appear generic or low-quality');
    recommendations.push('Replace generic social proof with authentic customer feedback');
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}