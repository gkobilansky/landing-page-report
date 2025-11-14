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
  puppeteer?: {
    forceBrowserless?: boolean;
  };
}

export async function analyzeSocialProof(urlOrHtml: string, options: AnalysisOptions = {}): Promise<SocialProofAnalysisResult> {
  console.log('🔍 Social Proof Analysis starting...');
  
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

    // Extract social proof elements using Puppeteer page evaluation
    console.log('🔍 Extracting social proof elements...');
    const socialProofData = await page.evaluate((viewport: { width: number; height: number }) => {
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
      
      const calculateCredibilityScore = (element: Element | null, text: string, type: string): number => {
        let score = 50; // Base score
        
        // Check for specific credibility indicators
        const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text) || 
                       element?.querySelector?.('.name, .author, [class*="name"], [class*="author"]');
        const hasCompany = /\b(CEO|CTO|Manager|Director|VP|President|Founder)\b/i.test(text) ||
                          element?.querySelector?.('.company, .title, [class*="company"], [class*="title"]');
        const hasImage = element?.querySelector?.('img, .avatar, [class*="avatar"], [class*="photo"]');
        const hasRating = element?.querySelector?.('.rating, .stars, [class*="rating"], [class*="star"]') ||
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

      const normalizeText = (value?: string | null): string => {
        if (!value) return '';
        return value.replace(/\s+/g, ' ').trim();
      };

      const collectElementText = (element: Element): string => {
        const chunks = new Set<string>();
        const push = (value?: string | null) => {
          const normalized = normalizeText(value);
          if (normalized) {
            chunks.add(normalized);
          }
        };

        push(element.textContent);

        const attributeCandidates = [
          'aria-label',
          'title',
          'data-name',
          'data-company',
          'data-client',
          'data-partner',
          'data-brand',
          'data-source'
        ];
        attributeCandidates.forEach(attr => push(element.getAttribute(attr)));

        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
          labelledBy.split(/\s+/).forEach(id => {
            const ref = document.getElementById(id);
            if (ref) push(ref.textContent);
          });
        }

        element.querySelectorAll('img, svg, picture, figure, [aria-label], [title], [data-company], [data-client], [data-partner]').forEach(node => {
          if (node instanceof HTMLImageElement) {
            push(node.alt);
            push(node.title);
            push(node.getAttribute('aria-label'));
            push(node.getAttribute('data-name'));
            push(node.getAttribute('data-company'));
            push(node.getAttribute('data-client'));
            push(node.getAttribute('data-partner'));
          } else {
            push(node.getAttribute('aria-label'));
            push(node.getAttribute('title'));
          }
        });

        return Array.from(chunks).join(' • ');
      };

      const deriveLogoText = (element: Element): string => {
        const names = new Set<string>();
        const push = (value?: string | null) => {
          const normalized = normalizeText(value);
          if (normalized) names.add(normalized);
        };

        const images = element.querySelectorAll('img');
        images.forEach(img => {
          push(img.alt);
          push(img.getAttribute('data-name'));
          push(img.getAttribute('data-company'));
          if (!img.alt) {
            const src = img.src || img.getAttribute('data-src') || '';
            if (src) {
              const filename = src.split(/[/?#]/).pop() || '';
              const clean = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ');
              push(clean);
            }
          }
        });

        if (names.size === 0) {
          const aria = element.getAttribute('aria-label') || element.getAttribute('title');
          if (aria) {
            push(aria);
          }
        }

        return Array.from(names).join(' • ');
      };

      const passesLengthConstraints = (text: string, type: string, options: { hasVisualEvidence?: boolean } = {}): boolean => {
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const hasVisualEvidence = options.hasVisualEvidence || false;
        
        if (wordCount === 0) {
          return hasVisualEvidence;
        }
        if (type === 'testimonial') {
          return wordCount >= 10 && wordCount <= 180;
        }
        if (type === 'review' || type === 'rating') {
          return wordCount >= 5 && wordCount <= 120;
        }
        if (type === 'case-study') {
          return wordCount >= 25 && wordCount <= 400;
        }
        if (type === 'customer-count') {
          return wordCount >= 3 && wordCount <= 80;
        }
        if (type === 'trust-badge' || type === 'certification') {
          return wordCount >= 2 && wordCount <= 60;
        }
        if (type === 'partnership') {
          return wordCount >= 1 || hasVisualEvidence;
        }
        return wordCount >= 3 && wordCount <= 250;
      };

      const isGenericContent = (text: string, type: string): boolean => {
        if (type === 'partnership' || type === 'news-mention') return false;
        const trimmed = text.trim();
        if (/^(home|about|contact|services|portfolio|blog|get started|learn more|our|we|you|your|build|design|develop|create|solution|offer|provide|built|terms|privacy|policy)/i.test(trimmed)) {
          return true;
        }
        if (/\b(click|button|link|menu|navigation|header|footer|sidebar|copyright|reserved|policy|terms|lansky|tech)\b/i.test(trimmed.toLowerCase())) {
          return true;
        }
        if (trimmed.includes('→') || trimmed.includes('↓')) return true;
        if (/^\s*[💡👩🏻‍💻💰😤]/.test(trimmed)) return true;
        return false;
      };

      const pushStructuredElement = (text: string, type: string, metadata: { hasImage?: boolean; hasName?: boolean; hasCompany?: boolean; hasRating?: boolean } = {}) => {
        const normalized = normalizeText(text);
        if (!normalized) return;
        if (!passesLengthConstraints(normalized, type)) return;
        if (isGenericContent(normalized, type)) return;
        
        const credibilityScore = calculateCredibilityScore(null, normalized, type);
        elements.push({
          type,
          text: normalized.length > 300 ? normalized.substring(0, 300) + '...' : normalized,
          score: credibilityScore,
          position: {
            top: 0,
            left: 0,
            width: 0,
            height: 0
          },
          isAboveFold: false,
          hasImage: !!metadata.hasImage,
          hasName: !!metadata.hasName,
          hasCompany: !!metadata.hasCompany,
          hasRating: !!metadata.hasRating,
          credibilityScore,
          visibility: 'medium',
          context: 'other'
        });
      };

      const getNameFromField = (field: any): string => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field.name || field.alternateName || '';
      };

      const processStructuredEntry = (entry: any) => {
        if (!entry) return;

        if (Array.isArray(entry)) {
          entry.forEach(processStructuredEntry);
          return;
        }

        if (entry['@graph']) {
          processStructuredEntry(entry['@graph']);
        }

        const typeField = entry['@type'];
        const typeCandidates = Array.isArray(typeField) ? typeField : [typeField];
        typeCandidates.forEach(typeName => {
          if (!typeName) return;
          const lowerType = String(typeName).toLowerCase();
          
          if (lowerType === 'review' || lowerType === 'testimonial') {
            const body = entry.reviewBody || entry.description || entry.name || '';
            if (!body) return;
            const authorName = getNameFromField(entry.author);
            const companyName = getNameFromField(entry.publisher) || getNameFromField(entry.itemReviewed);
            const ratingValue = entry.reviewRating?.ratingValue || entry.aggregateRating?.ratingValue;
            const ratingScale = entry.reviewRating?.bestRating;
            let text = body;
            if (ratingValue) {
              text = `${body} (Rated ${ratingValue}${ratingScale ? `/${ratingScale}` : ''})`;
            }
            if (authorName) {
              text = `${text} — ${authorName}`;
            }
            if (companyName) {
              text = `${text}, ${companyName}`;
            }
            pushStructuredElement(text, ratingValue ? 'review' : 'testimonial', {
              hasImage: !!entry.image,
              hasName: !!authorName,
              hasCompany: !!companyName,
              hasRating: !!ratingValue
            });
            return;
          }
          
          if (lowerType === 'aggregaterating') {
            const ratingValue = entry.ratingValue || entry.rating;
            const bestRating = entry.bestRating || entry.ratingScale;
            const reviewCount = entry.reviewCount || entry.ratingCount;
            if (ratingValue || reviewCount) {
              const parts = [];
              if (ratingValue) {
                parts.push(`Average rating ${ratingValue}${bestRating ? `/${bestRating}` : ''}`);
              }
              if (reviewCount) {
                parts.push(`based on ${reviewCount} reviews`);
              }
              pushStructuredElement(parts.join(' '), 'rating', { hasRating: !!ratingValue });
            }
            return;
          }
          
          if (lowerType === 'newsarticle' || lowerType === 'article' || lowerType === 'blogposting') {
            const publisherName = getNameFromField(entry.publisher);
            const headline = entry.headline || entry.name || entry.alternativeHeadline;
            if (publisherName || headline) {
              const text = `${publisherName ? `Featured in ${publisherName}` : 'Media mention'}${headline ? ` — "${headline}"` : ''}`;
              pushStructuredElement(text, 'news-mention', {
                hasCompany: !!publisherName
              });
            }
            return;
          }
          
          if (lowerType === 'organization' || lowerType === 'brand') {
            if (entry.aggregateRating) {
              processStructuredEntry(entry.aggregateRating);
            }
            if (entry.review) {
              processStructuredEntry(entry.review);
            }
            if (entry.award) {
              const awards = Array.isArray(entry.award) ? entry.award : [entry.award];
              awards.forEach((award: string) => {
                pushStructuredElement(`${entry.name || 'This company'} awarded ${award}`, 'trust-badge', { hasCompany: !!entry.name });
              });
            }
            return;
          }
        });

        if (entry.review) {
          processStructuredEntry(entry.review);
        }
        if (entry.aggregateRating) {
          processStructuredEntry(entry.aggregateRating);
        }
        if (entry.testimonial) {
          processStructuredEntry(entry.testimonial);
        }
      };
      
      const parseStructuredData = () => {
        const scriptTags = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        scriptTags.forEach(script => {
          if (!script.textContent) return;
          try {
            const payload = JSON.parse(script.textContent);
            processStructuredEntry(payload);
          } catch (error) {
            // Ignore malformed JSON-LD
          }
        });
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
        
        // Logos and partnerships (case-insensitive to match classes like .UserLogo or .LogoGrid)
        { selector: '.logo, .Logo, .partner, .featured, .UserLogo, .LogoGrid, [class*="logo" i], [class*="partner" i], [class*="featured" i]', type: 'partnership' },
        
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
          
          const textContent = collectElementText(element);
          const hasLogoVisuals = !!element.querySelector('img, svg, [data-logo], [class*="logo"]');
          let text = textContent;
          
          if (!text && hasLogoVisuals) {
            text = deriveLogoText(element);
            if (!text && type === 'partnership') {
              const logoCount = element.querySelectorAll('img, svg').length;
              text = logoCount > 0 ? `Partner logos (${logoCount})` : 'Partner logos';
            }
          }
          
          if (!text) {
            return;
          }
          
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
          const classifiedType = classifyElement(element, text);
          const finalType = classifiedType === 'other' ? type : classifiedType;
          
          if (finalType === 'other') return;
          
          if (!passesLengthConstraints(text, finalType, { hasVisualEvidence: hasLogoVisuals })) {
            return;
          }
          
          if (isGenericContent(text, finalType)) {
            return;
          }
          
          const credibilityScore = calculateCredibilityScore(element, text, finalType);
          
          const hasImage = !!element.querySelector('img, .avatar, [class*="avatar"], [class*="photo"]');
          const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text) || 
                         !!element.querySelector('.name, .author, [class*="name"], [class*="author"]');
          const hasCompany = /\b(CEO|CTO|Manager|Director|VP|President|Founder)\b/i.test(text) ||
                            !!element.querySelector('.company, .title, [class*="company"], [class*="title"]');
          const hasRating = !!element.querySelector('.rating, .stars, [class*="rating"], [class*="star"]') ||
                           /★|⭐|stars?|rating/i.test(text);

          const socialProofElement = {
            type: finalType,
            text: text.length > 300 ? text.substring(0, 300) + '...' : text,
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
        
        const text = collectElementText(element);
        if (!text) return;
        
        const lowerText = text.toLowerCase();
        if (lowerText.length < 30) return;
        
        // Look for customer count patterns
        const hasCustomerCount = /\d+[,\.]?\d*\s*(customers?|users?|clients?|companies?|businesses?|people|members?)/i.test(text) ||
                                /over\s+\d+|more than\s+\d+|\d+\+\s*(customers?|users?|clients?)/i.test(text);
        
        // Look for testimonial patterns - be more strict
        const hasTestimonialPattern = (text.includes('"') || text.includes("'")) && 
                                     text.length > 40 && text.length < 600 &&
                                     /\b(amazing|excellent|great|fantastic|wonderful|outstanding|love|recommend|best|helped|improved|transformed|changed my|saved us|increased our)\b/i.test(text) &&
                                     !/\b(we|our|us|you|your|lansky|tech|build|design|development|service|solution|offer|provide)\b/i.test(text.substring(0, 80));
        
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
          
          let detectedType: string = 'testimonial';
          if (hasCustomerCount) detectedType = 'customer-count';
          else if (hasTrustPattern) detectedType = 'trust-badge';
          else if (!hasTestimonialPattern) return; // Skip if no clear social proof pattern
          
          if (!passesLengthConstraints(text, detectedType)) {
            return;
          }
          
          if (isGenericContent(text, detectedType)) {
            return;
          }
          
          const credibilityScore = calculateCredibilityScore(element, text, detectedType);
          
          const hasImage = !!element.querySelector('img, .avatar, [class*="avatar"], [class*="photo"]');
          const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text);
          const hasCompany = /\b(CEO|CTO|Manager|Director|VP|President|Founder)\b/i.test(text);
          const hasRating = /★|⭐|stars?|rating/i.test(text);

          const socialProofElement = {
            type: detectedType,
            text: text.length > 300 ? text.substring(0, 300) + '...' : text,
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
      
      parseStructuredData();
      return elements;
    }, viewport);

    console.log(`📊 Found ${socialProofData.length} social proof elements`);
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Remove duplicate elements based on text similarity
    const uniqueElements: SocialProofElement[] = [];
    socialProofData.forEach((element: SocialProofElement) => {
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
