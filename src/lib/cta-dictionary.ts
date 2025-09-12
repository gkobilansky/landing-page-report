/**
 * CTA Dictionary - Centralized word/phrase lists for CTA analysis
 * Replaces hardcoded OR statements with maintainable, categorized data structures
 */

export const CTA_DICTIONARY = {
  // Strong action verbs indicating conversion intent (exclude incentives)
  STRONG_ACTION_WORDS: [
    'buy', 'purchase', 'order', 'get', 'start', 'begin', 'join',
    'sign up', 'register', 'download', 'grab', 'claim', 'unlock',
    'access', 'discover', 'try', 'create', 'book', 'request',
    'apply', 'enroll', 'schedule'
  ],

  // Weak action words that suggest lower conversion intent
  WEAK_ACTION_WORDS: [
    'learn', 'read', 'view', 'see', 'browse', 'explore',
    'submit', 'send', 'click'
  ],

  // Incentives (not action strength)
  INCENTIVES: [
    'free', 'trial', 'demo', 'no credit card', 'no credit card required', 'no cc required'
  ],

  // Primary CTA phrases commonly used in modern SaaS/e-commerce
  PRIMARY_CTA_PHRASES: [
    'start your project', 'get started', 'try free', 'start free',
    'sign up free', 'start trial', 'book demo', 'request demo',
    'buy now', 'add to cart', 'purchase', 'order now', 'shop now',
    'get access', 'join now', 'start building', 'create account',
    'start today', 'join waitlist', 'join the waitlist',
    // Modern SaaS phrases
    'talk to sales', 'schedule a demo', 'see pricing', 'view plans',
    'start for free', 'get a quote', 'book a call', 'start now',
    'start your free trial'
  ],

  // Urgency indicators that create time pressure (remove lone 'only')
  URGENCY_WORDS: [
    'now', 'today', 'instant', 'immediately', 'limited', 'exclusive',
    'urgent', 'hurry', 'fast', 'quick', 'deadline', 'expires',
    'last chance', 'ending', 'ends soon'
  ],

  // Urgency patterns (token-aware), e.g., "only 3 left", "X left"
  URGENCY_PATTERNS: [
    /\bonly\s+\d+\s+left\b/i,
    /\b\d+\s+(spots|seats|slots)\s+left\b/i,
    /\blimited\s+time\b/i
  ],

  // Value proposition indicators
  VALUE_PROPOSITION_WORDS: [
    'free', 'save', 'discount', 'offer', 'deal', 'benefit', 'advantage',
    'result', 'outcome', 'guarantee', 'promise', 'increase', 'improve',
    'boost', 'double', 'triple', 'roi', 'return', 'profit'
  ],

  // Guarantee/trust indicators
  GUARANTEE_WORDS: [
    'guarantee', 'money back', 'refund', 'risk free', 'no risk',
    'satisfaction guaranteed', 'promise', 'assured'
  ],

  // Navigation words to filter out (not CTAs)
  NAVIGATION_WORDS: [
    'home', 'about', 'contact', 'help', 'faq', 'blog', 'news',
    'terms', 'privacy', 'documentation', 'docs', 'support',
    'community', 'resources', 'company', 'careers', 'partners',
    'investors', 'press', 'legal',
    // Common header items to treat as nav by default
    'pricing', 'features', 'solutions'
  ],

  // Navigation phrases to filter out
  NAVIGATION_PHRASES: [
    'learn more about', 'read more about', 'more information', 'find out more',
    // Pricing/plan exploration (treated as nav unless styled as hero CTA)
    'see pricing', 'view plans', 'view pricing', 'compare plans'
  ],

  // Action phrases for additional detection
  ACTION_PHRASES: [
    'build your', 'get started', 'start free', 'join now', 'sign up',
    'try free', 'buy now', 'learn more', 'contact', 'demo', 'subscribe',
    'start your project', 'request demo', 'book demo', 'start trial',
    'add to cart', 'shop now', 'order now', 'start building',
    'create account', 'get access', 'join waitlist', 'join the waitlist',
    // Modern SaaS phrases
    'talk to sales', 'schedule a demo', 'see pricing', 'view plans',
    'start for free', 'get a quote', 'book a call', 'start now',
    'start your free trial'
  ],

  // CSS class tokens for primary CTAs (exact matches)
  PRIMARY_CTA_CLASSES: [
    'btn-primary', 'cta-primary', 'primary-button', 'main-cta',
    'btn--primary', 'button--primary', 'button-primary', 'Button--cta',
    'btn-cta', 'bg-primary', 'is-primary'
  ],

  // CSS class patterns for primary CTAs (partial/safe primary matching)
  PRIMARY_CTA_CLASS_PATTERNS: [
    /(btn|button|cta|action)[-_]?primary[-_]?\d*/i, // Matches btn-primary, btn-primary-3, button_primary_2, etc.
    /\bbg-primary\b/i,
    /\bButton[^\s]*__[^\s]*\bprimary\b/i, // CSS modules variants like Button_primary__*
  ],

  // Decorative patterns to ignore
  DECORATIVE_PATTERNS: [
    /^(next|previous|prev)$/i,
    /^(slide|tab) \d+$/i,
    /^\d+\/\d+$/,
    /^page \d+$/i
  ],

  // Logo patterns to filter out
  LOGO_PATTERNS: [
    /logo$/i,
    /^[A-Z][a-z]+ logo$/i,
    /^[A-Z]+ logo$/i,
    /^[A-Z]{2,}$/, // All caps brand names like IBM, NASA
    /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+(Inc|LLC|Corp|Ltd)$/i // Company names with suffixes
  ],

  // Name patterns to filter out (testimonial signatures, etc.)
  NAME_PATTERNS: [
    /^[A-Z][a-z]+ ?[A-Z]?\.?$/, // First Last or First M.
    /^[A-Z][a-z]+$/, // Single name
    /^[A-Z]{1,3}$/ // Initials
  ]
} as const;

/**
 * Helper functions to work with the dictionary
 */
export const CTA_HELPERS = {
  /**
   * Escapes a string for safe use in a RegExp
   */
  escapeRegex: (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),

  /**
   * Builds a boundary-aware regex for a multi-word phrase.
   * Example: 'get started' -> /\bget\s+started\b/i
   */
  phraseToBoundaryRegex(phrase: string): RegExp {
    const tokens = phrase.trim().split(/\s+/).map(CTA_HELPERS.escapeRegex);
    const pattern = `\\b${tokens.join('\\s+')}\\b`;
    return new RegExp(pattern, 'i');
  },

  /**
   * Check if text contains any terms using word boundaries (token-aware for phrases)
   */
  containsAnyWord: (text: string, words: readonly string[]): boolean => {
    return words.some(word => CTA_HELPERS.phraseToBoundaryRegex(word).test(text));
  },

  /**
   * Check if text matches any pattern from a given array
   */
  matchesAnyPattern: (text: string, patterns: readonly RegExp[]): boolean => {
    return patterns.some(pattern => pattern.test(text));
  },

  /**
   * Check if element has any of the specified CSS class tokens (exact contains)
   */
  hasAnyClass: (element: Element, classes: readonly string[]): boolean => {
    return classes.some(className => element.classList.contains(className));
  },

  /**
   * Check if element's className matches any provided class regex patterns
   */
  matchesAnyClassPattern: (element: Element, patterns: readonly RegExp[]): boolean => {
    const className = element.className || '';
    return patterns.some(re => re.test(String(className)));
  }
};
