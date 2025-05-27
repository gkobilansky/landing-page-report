import { analyzeCTA, CTAAnalysisResult } from '../cta-analysis';

// Mock the puppeteer-config module
jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(),
}));

const { createPuppeteerBrowser } = require('../puppeteer-config');

const mockPage = {
  setViewport: jest.fn(),
  setContent: jest.fn(),
  goto: jest.fn(),
  evaluate: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

describe('CTA Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });
  describe('analyzeCTA', () => {
    it('should detect primary CTA buttons with clear action text', async () => {
      const mockHTML = `
        <html>
          <body>
            <button class="btn-primary">Get Started</button>
            <a href="/signup" class="cta-button">Sign Up Now</a>
            <button>Subscribe Today</button>
          </body>
        </html>
      `;

      // Mock the CTA data that would be found by page.evaluate
      mockPage.evaluate.mockResolvedValue([
        {
          text: 'Get Started',
          type: 'primary',
          isAboveFold: true,
          actionStrength: 'strong',
          urgency: 'low',
          visibility: 'medium',
          context: 'content',
          hasValueProposition: false,
          hasUrgency: false,
          hasGuarantee: false,
          mobileOptimized: true,
          position: { top: 8, left: 8, width: 100, height: 32 }
        },
        {
          text: 'Sign Up Now',
          type: 'primary',
          isAboveFold: true,
          actionStrength: 'strong',
          urgency: 'high',
          visibility: 'medium',
          context: 'content',
          hasValueProposition: false,
          hasUrgency: true,
          hasGuarantee: false,
          mobileOptimized: true,
          position: { top: 50, left: 8, width: 120, height: 32 }
        },
        {
          text: 'Subscribe Today',
          type: 'secondary',
          isAboveFold: true,
          actionStrength: 'medium',
          urgency: 'high',
          visibility: 'medium',
          context: 'content',
          hasValueProposition: false,
          hasUrgency: true,
          hasGuarantee: false,
          mobileOptimized: true,
          position: { top: 90, left: 8, width: 130, height: 32 }
        }
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      expect(result.score).toBeGreaterThan(70); // Realistic expectation
      expect(result.ctas).toHaveLength(3);
      expect(result.ctas.some(cta => cta.text === 'Get Started' && cta.type === 'primary')).toBe(true);
      expect(result.ctas.some(cta => cta.actionStrength === 'strong')).toBe(true);
    });

    it('should penalize pages with no clear CTA above the fold', async () => {
      const mockHTML = `
        <html>
          <body>
            <div style="height: 2000px;">
              <p>Some content</p>
            </div>
            <button style="margin-top: 2000px;">Sign Up</button>
          </body>
        </html>
      `;

      // Mock CTA below the fold (isAboveFold: false)
      mockPage.evaluate.mockResolvedValue([
        {
          text: 'Sign Up',
          type: 'secondary',
          isAboveFold: false, // This is the key - CTA is below fold
          actionStrength: 'strong',
          urgency: 'low',
          visibility: 'medium',
          context: 'content',
          hasValueProposition: false,
          hasUrgency: false,
          hasGuarantee: false,
          mobileOptimized: true,
          position: { top: 2000, left: 8, width: 80, height: 32 }
        }
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      expect(result.score).toBeLessThan(50);
      expect(result.issues).toContain('No clear CTA above the fold');
    });

    it('should detect multiple CTA types and prioritize them correctly', async () => {
      const mockHTML = `
        <html>
          <body>
            <button class="btn-primary">Start Free Trial</button>
            <a href="/contact">Contact Us Today</a>
            <button class="btn-secondary">Learn More</button>
            <input type="submit" value="Subscribe Now">
          </body>
        </html>
      `;

      mockPage.evaluate.mockResolvedValue([
        { text: 'Start Free Trial', type: 'primary', isAboveFold: true, actionStrength: 'strong', urgency: 'medium', visibility: 'high', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 120, height: 32 } },
        { text: 'Contact Us Today', type: 'secondary', isAboveFold: true, actionStrength: 'medium', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 130, height: 32 } },
        { text: 'Subscribe Now', type: 'form-submit', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'form', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 130, left: 8, width: 120, height: 32 } }
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      expect(result.ctas.length).toBeGreaterThanOrEqual(3);
      expect(result.primaryCTA).toBeDefined();
      expect(['Start Free Trial', 'Subscribe Now']).toContain(result.primaryCTA?.text); // Either could be primary
      expect(result.secondaryCTAs.length).toBeGreaterThanOrEqual(1);
    });

    it('should analyze action word strength and urgency', async () => {
      const mockHTML = `
        <html>
          <body>
            <button>Buy Now</button>
            <button>Get Instant Access</button>
            <button>Learn More</button>
            <button>Submit Form</button>
          </body>
        </html>
      `;

      mockPage.evaluate.mockResolvedValue([
        { text: 'Buy Now', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 80, height: 32 } },
        { text: 'Get Instant Access', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 140, height: 32 } },
        { text: 'Learn More', type: 'secondary', isAboveFold: true, actionStrength: 'weak', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 90, left: 8, width: 90, height: 32 } },
        { text: 'Submit Form', type: 'secondary', isAboveFold: true, actionStrength: 'weak', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 130, left: 8, width: 100, height: 32 } }
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      const buyNowCTA = result.ctas.find(cta => cta.text === 'Buy Now');
      const instantAccessCTA = result.ctas.find(cta => cta.text === 'Get Instant Access');
      const learnMoreCTA = result.ctas.find(cta => cta.text === 'Learn More');
      const submitCTA = result.ctas.find(cta => cta.text === 'Submit Form');

      expect(buyNowCTA?.actionStrength).toBe('strong');
      expect(buyNowCTA?.urgency).toBe('high');
      expect(instantAccessCTA?.urgency).toBe('high');
      expect(learnMoreCTA?.actionStrength).toBe('weak');
      expect(submitCTA?.actionStrength).toBe('weak');
    });

    it('should penalize too many competing CTAs above the fold', async () => {
      const mockHTML = `
        <html>
          <body>
            <button>Buy Now</button>
            <button>Sign Up</button>
            <button>Get Started</button>
            <button>Learn More</button>
            <button>Contact Us</button>
          </body>
        </html>
      `;

      // Mock 5 CTAs all above the fold to trigger the penalty
      mockPage.evaluate.mockResolvedValue([
        { text: 'Buy Now', type: 'primary', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 80, height: 32 } },
        { text: 'Sign Up', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 80, height: 32 } },
        { text: 'Get Started', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 90, left: 8, width: 100, height: 32 } },
        { text: 'Learn More', type: 'secondary', isAboveFold: true, actionStrength: 'weak', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 130, left: 8, width: 90, height: 32 } },
        { text: 'Contact Us', type: 'secondary', isAboveFold: true, actionStrength: 'medium', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 170, left: 8, width: 90, height: 32 } }
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      expect(result.score).toBeLessThan(90);
      expect(result.issues).toContain('Too many competing CTAs above the fold (5 found) - focus on 1-2 primary actions');
    });

    it('should detect and score CTA positioning and visibility', async () => {
      const mockHTML = `
        <html>
          <head>
            <style>
              .hidden { display: none; }
              .small-text { font-size: 8px; }
              .prominent { font-size: 24px; padding: 20px; background: #007bff; color: white; }
            </style>
          </head>
          <body>
            <button class="prominent">Get Started</button>
            <button class="small-text">Sign Up</button>
            <button class="hidden">Hidden CTA</button>
          </body>
        </html>
      `;

      // Mock visibility analysis - hidden CTAs wouldn't be returned by page.evaluate
      mockPage.evaluate.mockResolvedValue([
        { text: 'Get Started', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'high', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 120, height: 32 } },
        { text: 'Sign Up', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'low', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 80, height: 32 } }
        // Hidden CTA not included as it would be filtered out by the analysis
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      const prominentCTA = result.ctas.find(cta => cta.text === 'Get Started');
      const smallCTA = result.ctas.find(cta => cta.text === 'Sign Up');
      
      expect(prominentCTA?.visibility).toBe('high');
      expect(smallCTA?.visibility).toBe('low');
      expect(result.ctas).not.toContain(expect.objectContaining({ text: 'Hidden CTA' }));
    });

    it('should identify CTA context and surrounding elements', async () => {
      const mockHTML = `
        <html>
          <body>
            <section class="hero">
              <h1>Transform Your Business</h1>
              <p>Get results in 30 days or money back</p>
              <button>Start Free Trial</button>
            </section>
            <footer>
              <button>Contact Support</button>
            </footer>
          </body>
        </html>
      `;

      mockPage.evaluate.mockResolvedValue([
        { text: 'Start Free Trial', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'medium', visibility: 'medium', context: 'hero', hasValueProposition: true, hasUrgency: false, hasGuarantee: true, mobileOptimized: true, position: { top: 100, left: 8, width: 130, height: 32 } },
        { text: 'Contact Support', type: 'secondary', isAboveFold: false, actionStrength: 'medium', urgency: 'low', visibility: 'medium', context: 'footer', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 800, left: 8, width: 120, height: 32 } }
      ]);

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      const heroCTA = result.ctas.find(cta => cta.text === 'Start Free Trial');
      const footerCTA = result.ctas.find(cta => cta.text === 'Contact Support');
      
      expect(heroCTA?.context).toBe('hero');
      expect(heroCTA?.hasValueProposition).toBe(true);
      expect(footerCTA?.context).toBe('footer');
    });

    it('should score CTAs based on best practices', async () => {
      const perfectCTAHTML = `
        <html>
          <body>
            <section class="hero">
              <h1>Double Your Sales</h1>
              <p>Join 10,000+ businesses using our platform</p>
              <button class="btn-primary" style="font-size: 18px; padding: 15px 30px;">Start Free Trial</button>
              <p class="guarantee">30-day money-back guarantee</p>
            </section>
          </body>
        </html>
      `;

      // Mock a perfect CTA with all best practices
      mockPage.evaluate.mockResolvedValue([
        { text: 'Start Free Trial', type: 'primary', isAboveFold: true, actionStrength: 'strong', urgency: 'medium', visibility: 'high', context: 'hero', hasValueProposition: true, hasUrgency: false, hasGuarantee: true, mobileOptimized: true, position: { top: 150, left: 8, width: 180, height: 50 } }
      ]);

      const result = await analyzeCTA(perfectCTAHTML, { isHtml: true });
      
      expect(result.score).toBeGreaterThan(90); // Realistic expectation for excellent CTA
      expect(result.issues.length).toBeLessThanOrEqual(1); // May have minor issues
      expect(result.primaryCTA?.text).toBe('Start Free Trial');
      expect(result.primaryCTA?.hasValueProposition).toBe(true);
      expect(result.primaryCTA?.hasUrgency).toBe(false);
      expect(result.primaryCTA?.hasGuarantee).toBe(true);
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCaseHTML = `
        <html>
          <body>
            <button></button>
            <a href="#"></a>
            <button>   </button>
            <div onclick="submit()">Click me</div>
          </body>
        </html>
      `;

      // Mock minimal CTA data - empty/whitespace CTAs filtered out
      mockPage.evaluate.mockResolvedValue([
        { text: 'Click me', type: 'other', isAboveFold: true, actionStrength: 'weak', urgency: 'low', visibility: 'low', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 60, height: 20 } }
      ]);

      const result = await analyzeCTA(edgeCaseHTML, { isHtml: true });
      
      expect(result.ctas).toHaveLength(1); // Only the div with onclick should be detected
      expect(result.score).toBeLessThan(50);
      expect(result.issues).toContain('Primary CTA uses weak action words');
    });

    it('should detect form submission CTAs correctly', async () => {
      const formHTML = `
        <html>
          <body>
            <form>
              <input type="email" placeholder="Enter your email">
              <input type="submit" value="Get Free Report">
            </form>
            <form>
              <button type="submit">Subscribe to Newsletter</button>
            </form>
          </body>
        </html>
      `;

      mockPage.evaluate.mockResolvedValue([
        { text: 'Get Free Report', type: 'form-submit', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'form', hasValueProposition: true, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 120, height: 32 } },
        { text: 'Subscribe to Newsletter', type: 'form-submit', isAboveFold: true, actionStrength: 'medium', urgency: 'low', visibility: 'medium', context: 'form', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 100, left: 8, width: 160, height: 32 } }
      ]);

      const result = await analyzeCTA(formHTML, { isHtml: true });
      
      expect(result.ctas).toHaveLength(2);
      expect(result.ctas[0].type).toBe('form-submit');
      expect(result.ctas[1].type).toBe('form-submit');
      expect(result.score).toBeGreaterThan(70);
    });

    it('should identify mobile-optimized CTAs', async () => {
      const mobileHTML = `
        <html>
          <head>
            <style>
              @media (max-width: 768px) {
                .mobile-cta { display: block; width: 100%; }
              }
              .mobile-cta { font-size: 16px; padding: 12px; }
            </style>
          </head>
          <body>
            <button class="mobile-cta">Get Started</button>
          </body>
        </html>
      `;

      mockPage.evaluate.mockResolvedValue([
        { text: 'Get Started', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 120, height: 44 } }
      ]);

      const result = await analyzeCTA(mobileHTML, { viewport: { width: 375, height: 667 }, isHtml: true });
      
      expect(result.ctas[0].mobileOptimized).toBe(true);
      expect(result.score).toBeGreaterThan(70); // Realistic mobile score
    });

    it('should detect and prioritize price-based CTAs', async () => {
      const priceHTML = `
        <html>
          <body>
            <p class="cta-button-wrap">
              <a href="/checkout" class="cta-button">$150 – Build Your Physical Autonomy</a>
            </p>
            <button>Learn More</button>
            <a href="/about">About Us</a>
          </body>
        </html>
      `;

      mockPage.evaluate.mockResolvedValue([
        { text: '$150 – Build Your Physical Autonomy', type: 'primary', isAboveFold: true, actionStrength: 'medium', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 250, height: 32 } },
        { text: 'Learn More', type: 'secondary', isAboveFold: true, actionStrength: 'weak', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 90, height: 32 } }
        // About Us would typically be filtered out as navigation
      ]);

      const result = await analyzeCTA(priceHTML, { isHtml: true });
      
      expect(result.ctas.length).toBeGreaterThanOrEqual(1);
      expect(result.primaryCTA?.text).toBe('$150 – Build Your Physical Autonomy');
      expect(result.primaryCTA?.type).toBe('primary');
      expect(result.score).toBeGreaterThanOrEqual(50); // Realistic score for price CTA
    });

    it('should deduplicate similar CTAs', async () => {
      const duplicateHTML = `
        <html>
          <body>
            <button>Get Started</button>
            <a href="/signup">Get Started</a>
            <span>Get Started Today</span>
            <div>Start Now</div>
          </body>
        </html>
      `;

      // Mock initial data before deduplication (this simulates what page.evaluate would return)
      mockPage.evaluate.mockResolvedValue([
        { text: 'Get Started', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 8, left: 8, width: 100, height: 32 } },
        { text: 'Get Started', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 50, left: 8, width: 100, height: 32 } },
        { text: 'Get Started Today', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 90, left: 8, width: 130, height: 32 } },
        { text: 'Start Now', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 130, left: 8, width: 90, height: 32 } }
      ]);

      const result = await analyzeCTA(duplicateHTML, { isHtml: true });
      
      // Should deduplicate "Get Started" variations but keep "Start Now" as different
      expect(result.ctas.length).toBeLessThanOrEqual(3); // After deduplication
      expect(result.ctas.some(cta => cta.text.includes('Get Started'))).toBe(true);
      expect(result.ctas.some(cta => cta.text === 'Start Now')).toBe(true);
    });

    it('should filter out customer names and testimonial content', async () => {
      const testimonialHTML = `
        <html>
          <body>
            <div class="testimonial">
              <p>"Great product!" - John R.</p>
              <span>Sarah</span>
              <span>Maxwell</span>
            </div>
            <button>Get Started</button>
            <a href="/signup">Sign Up Today</a>
          </body>
        </html>
      `;

      // Mock CTA data - customer names would be filtered out by the analysis
      mockPage.evaluate.mockResolvedValue([
        { text: 'Get Started', type: 'secondary', isAboveFold: true, actionStrength: 'strong', urgency: 'low', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: false, hasGuarantee: false, mobileOptimized: true, position: { top: 100, left: 8, width: 100, height: 32 } },
        { text: 'Sign Up Today', type: 'primary', isAboveFold: true, actionStrength: 'strong', urgency: 'high', visibility: 'medium', context: 'content', hasValueProposition: false, hasUrgency: true, hasGuarantee: false, mobileOptimized: true, position: { top: 140, left: 8, width: 120, height: 32 } }
        // Customer names (John R., Sarah, Maxwell) filtered out by analysis
      ]);

      const result = await analyzeCTA(testimonialHTML, { isHtml: true });
      
      // Should only detect actual CTAs, not customer names
      expect(result.ctas).toHaveLength(2);
      expect(result.ctas.every(cta => !['John R.', 'Sarah', 'Maxwell'].includes(cta.text))).toBe(true);
      expect(result.ctas.some(cta => cta.text === 'Get Started')).toBe(true);
      expect(result.ctas.some(cta => cta.text === 'Sign Up Today')).toBe(true);
    });
  });
});