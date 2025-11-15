export interface PatternDefinition {
  pattern: string;
  flags?: string;
}

export interface SelectorGroupDefinition {
  type: string;
  selectors: string[];
}

export interface TypeRuleDefinition {
  type: string;
  classKeywords?: string[];
  textPatternKeys?: string[];
  selectorQueries?: string[];
  requiresRatingIndicator?: boolean;
}

interface LengthBoundDefinition {
  minWords: number;
  maxWords: number;
}

interface QuoteDetectionDefinition {
  minLength: number;
  maxLength: number;
  positivePatternKey: string;
  negativePrefixKey?: string;
  negativePrefixWindow?: number;
}

interface SocialProofDictionary {
  ACCESSIBILITY_ATTRIBUTES: string[];
  SELECTOR_GROUPS: SelectorGroupDefinition[];
  TYPE_RULES: TypeRuleDefinition[];
  TEXT_PATTERNS: Record<string, PatternDefinition[]>;
  GENERIC_CONTENT: {
    prefixes: string[];
    keywords: string[];
    arrowCharacters: string[];
    emojiPattern?: PatternDefinition;
    allowedTypes: string[];
  };
  LENGTH_BOUNDS: Record<string, LengthBoundDefinition>;
  ADDITIONAL_TEXT_TAGS: string[];
  LOGO_INDICATOR_SELECTORS: string[];
  QUOTE_DETECTION: QuoteDetectionDefinition;
  RATING_INDICATOR_QUERIES: string[];
}

export const SOCIAL_PROOF_DICTIONARY: SocialProofDictionary = {
  ACCESSIBILITY_ATTRIBUTES: [
    'aria-label',
    'title',
    'data-name',
    'data-company',
    'data-client',
    'data-partner',
    'data-brand',
    'data-source'
  ],
  SELECTOR_GROUPS: [
    {
      type: 'testimonial',
      selectors: [
        '.testimonial',
        '.quote',
        '.client-quote',
        '[class*="testimonial"]',
        '[class*="quote"]',
        'blockquote'
      ]
    },
    {
      type: 'review',
      selectors: [
        '.review',
        '.rating',
        '.stars',
        '[class*="review"]',
        '[class*="rating"]',
        '[class*="star"]'
      ]
    },
    {
      type: 'trust-badge',
      selectors: [
        '.trust-badge',
        '.security',
        '.ssl',
        '.certified',
        '[class*="trust"]',
        '[class*="secure"]',
        '[class*="ssl"]'
      ]
    },
    {
      type: 'customer-count',
      selectors: [
        '.stats',
        '.counter',
        '.customer-count',
        '[class*="stats"]',
        '[class*="counter"]',
        '[class*="customer"]'
      ]
    },
    {
      type: 'social-media',
      selectors: [
        '.social',
        '.followers',
        '[class*="social"]',
        '[class*="follow"]'
      ]
    },
    {
      type: 'partnership',
      selectors: [
        '.logo',
        '.Logo',
        '.partner',
        '.featured',
        '.UserLogo',
        '.LogoGrid',
        '[class*="logo" i]',
        '[class*="partner" i]',
        '[class*="featured" i]'
      ]
    },
    {
      type: 'case-study',
      selectors: [
        '.case-study',
        '.success-story',
        '[class*="case"]',
        '[class*="success"]'
      ]
    },
    {
      type: 'news-mention',
      selectors: [
        '.press',
        '.media',
        '.news',
        '[class*="press"]',
        '[class*="media"]',
        '[class*="news"]'
      ]
    }
  ],
  TYPE_RULES: [
    {
      type: 'testimonial',
      classKeywords: ['testimonial', 'quote', 'client-quote'],
      textPatternKeys: ['testimonial']
    },
    {
      type: 'review',
      classKeywords: ['review'],
      textPatternKeys: ['review'],
      requiresRatingIndicator: true
    },
    {
      type: 'rating',
      textPatternKeys: ['rating'],
      requiresRatingIndicator: true
    },
    {
      type: 'trust-badge',
      classKeywords: ['trust', 'badge', 'secure', 'ssl', 'certified'],
      textPatternKeys: ['trustBadge']
    },
    {
      type: 'customer-count',
      classKeywords: ['stats', 'counter', 'customer-count'],
      textPatternKeys: ['customerCount']
    },
    {
      type: 'social-media',
      classKeywords: ['social', 'follow'],
      textPatternKeys: ['socialMedia'],
      selectorQueries: [
        '[class*="social"]',
        '[class*="facebook"]',
        '[class*="twitter"]',
        '[class*="instagram"]'
      ]
    },
    {
      type: 'certification',
      classKeywords: ['certification', 'compliance'],
      textPatternKeys: ['certification']
    },
    {
      type: 'partnership',
      classKeywords: ['partner', 'featured', 'logo'],
      textPatternKeys: ['partnership']
    },
    {
      type: 'case-study',
      classKeywords: ['case-study', 'success'],
      textPatternKeys: ['caseStudy']
    },
    {
      type: 'news-mention',
      classKeywords: ['press', 'media', 'news'],
      textPatternKeys: ['newsMention']
    }
  ],
  TEXT_PATTERNS: {
    testimonial: [
      { pattern: 'testimonial', flags: 'i' }
    ],
    review: [
      { pattern: 'review', flags: 'i' }
    ],
    rating: [
      { pattern: '★|⭐|stars?|rating|\\d+/\\d+|\\d+\\.\\d+/\\d+', flags: 'i' }
    ],
    trustBadge: [
      { pattern: 'ssl|secure|verified|trusted|guarantee|certified|award', flags: 'i' }
    ],
    certification: [
      { pattern: 'certified|accredited|compliant|gdpr|hipaa|soc\\s?\\d+', flags: 'i' }
    ],
    customerCount: [
      { pattern: '\\d+[,\\.]?\\d*\\s*(customers?|users?|clients?|companies?|businesses?|people|members?)', flags: 'i' },
      { pattern: 'over\\s+\\d+|more than\\s+\\d+|\\d+\\+\\s*(customers?|users?|clients?)', flags: 'i' }
    ],
    socialMedia: [
      { pattern: 'followers?|likes?|shares?|facebook|twitter|instagram|linkedin|youtube', flags: 'i' }
    ],
    partnership: [
      { pattern: 'partner|partnership|powered by|featured in|trusted by', flags: 'i' }
    ],
    caseStudy: [
      { pattern: 'case study|success story|customer story|client story', flags: 'i' }
    ],
    newsMention: [
      { pattern: 'featured in|mentioned in|press|news|media|forbes|techcrunch|reuters', flags: 'i' }
    ],
    testimonialPositive: [
      { pattern: '\\b(amazing|excellent|great|fantastic|wonderful|outstanding|love|recommend|best|helped|improved|transformed|changed my|saved us|increased our)\\b', flags: 'i' }
    ],
    testimonialNegativePrefix: [
      { pattern: '\\b(we|our|us|you|your|lansky|tech|build|design|development|service|solution|offer|provide)\\b', flags: 'i' }
    ],
    trustIndicator: [
      { pattern: 'ssl|secure|verified|trusted|guarantee|certified|award|safe|protected', flags: 'i' }
    ],
    suspiciousContent: [
      { pattern: 'lorem ipsum|placeholder|sample|test', flags: 'i' }
    ]
  },
  GENERIC_CONTENT: {
    prefixes: [
      'home',
      'about',
      'contact',
      'services',
      'portfolio',
      'blog',
      'get started',
      'learn more',
      'our',
      'we',
      'you',
      'your',
      'build',
      'design',
      'develop',
      'create',
      'solution',
      'offer',
      'provide',
      'built',
      'terms',
      'privacy',
      'policy'
    ],
    keywords: [
      'click',
      'button',
      'link',
      'menu',
      'navigation',
      'header',
      'footer',
      'sidebar',
      'copyright',
      'reserved',
      'policy',
      'terms',
      'lansky',
      'tech',
      'founder',
      'web development',
      'done right'
    ],
    arrowCharacters: ['→', '↓'],
    emojiPattern: { pattern: '^\\s*[💡👩🏻‍💻💰😤]', flags: '' },
    allowedTypes: ['partnership', 'news-mention']
  },
  LENGTH_BOUNDS: {
    testimonial: { minWords: 10, maxWords: 180 },
    review: { minWords: 5, maxWords: 120 },
    rating: { minWords: 5, maxWords: 120 },
    caseStudy: { minWords: 25, maxWords: 400 },
    customerCount: { minWords: 3, maxWords: 80 },
    trustBadge: { minWords: 2, maxWords: 60 },
    certification: { minWords: 2, maxWords: 60 },
    partnership: { minWords: 1, maxWords: 40 },
    newsMention: { minWords: 3, maxWords: 120 }
  },
  ADDITIONAL_TEXT_TAGS: ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  LOGO_INDICATOR_SELECTORS: ['img', 'svg', '[data-logo]', '[class*="logo" i]', '.Logo', '.UserLogo', '.LogoGrid'],
  QUOTE_DETECTION: {
    minLength: 30,
    maxLength: 300,
    positivePatternKey: 'testimonialPositive',
    negativePrefixKey: 'testimonialNegativePrefix',
    negativePrefixWindow: 80
  },
  RATING_INDICATOR_QUERIES: ['.rating', '.stars', '[class*="rating"]', '[class*="star"]']
};
