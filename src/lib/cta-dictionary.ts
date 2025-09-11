/**
 * CTA Dictionary - Centralized word/phrase lists for CTA analysis
 * Replaces hardcoded OR statements with maintainable, categorized data structures
 */

export const CTA_DICTIONARY = {
  // Strong action words that indicate high conversion intent
  STRONG_ACTION_WORDS: [
    'buy', 'purchase', 'order', 'get', 'start', 'begin', 'join', 
    'sign up', 'register', 'download', 'grab', 'claim', 'unlock', 
    'access', 'discover', 'try', 'create', 'book', 'request', 
    'demo', 'trial', 'free'
  ],

  // Weak action words that suggest lower conversion intent
  WEAK_ACTION_WORDS: [
    'learn', 'read', 'view', 'see', 'browse', 'explore', 
    'submit', 'send', 'click'
  ],

  // Primary CTA phrases commonly used in modern SaaS/e-commerce
  PRIMARY_CTA_PHRASES: [
    'start your project', 'get started', 'try free', 'start free', 
    'sign up free', 'start trial', 'book demo', 'request demo', 
    'buy now', 'add to cart', 'purchase', 'order now', 'shop now', 
    'get access', 'join now', 'start building', 'create account', 
    'start today', 'join waitlist', 'join the waitlist'
  ],

  // Urgency indicators that create time pressure
  URGENCY_WORDS: [
    'now', 'today', 'instant', 'immediately', 'limited', 'exclusive', 
    'urgent', 'hurry', 'fast', 'quick', 'deadline', 'expires', 
    'only', 'last chance'
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
    'investors', 'press', 'legal'
  ],

  // Navigation phrases to filter out
  NAVIGATION_PHRASES: [
    'learn more about', 'read more about', 'more information', 'find out more'
  ],

  // Action phrases for additional detection
  ACTION_PHRASES: [
    'build your', 'get started', 'start free', 'join now', 'sign up', 
    'try free', 'buy now', 'learn more', 'contact', 'demo', 'subscribe', 
    'start your project', 'request demo', 'book demo', 'start trial', 
    'add to cart', 'shop now', 'order now', 'start building', 
    'create account', 'get access', 'join waitlist', 'join the waitlist'
  ],

  // CSS class patterns for primary CTAs
  PRIMARY_CTA_CLASSES: [
    'btn-primary', 'cta-primary', 'primary-button', 'main-cta'
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
    /^[A-Z]{2,}$/, // All caps brand names
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/ // Title Case Brand Names
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
   * Check if text contains any words from a given array
   */
  containsAnyWord: (text: string, words: readonly string[]): boolean => {
    const lowerText = text.toLowerCase();
    return words.some(word => lowerText.includes(word));
  },

  /**
   * Check if text matches any pattern from a given array
   */
  matchesAnyPattern: (text: string, patterns: readonly RegExp[]): boolean => {
    return patterns.some(pattern => pattern.test(text));
  },

  /**
   * Check if element has any of the specified CSS classes
   */
  hasAnyClass: (element: Element, classes: readonly string[]): boolean => {
    return classes.some(className => element.classList.contains(className));
  }
};
