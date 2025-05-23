import { analyzeCTA, CTAAnalysisResult } from '../cta-analysis';

describe('CTA Analysis', () => {
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

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      expect(result.score).toBeGreaterThan(80);
      expect(result.ctas).toHaveLength(3);
      expect(result.ctas[0]).toMatchObject({
        text: 'Get Started',
        type: 'primary',
        isAboveFold: true,
        actionStrength: 'strong'
      });
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

      const result = await analyzeCTA(mockHTML, { isHtml: true });
      
      expect(result.ctas).toHaveLength(3); // Contact Us filtered out by our improved filtering
      expect(result.primaryCTA).toBeDefined();
      expect(result.primaryCTA?.text).toBe('Start Free Trial');
      expect(result.secondaryCTAs).toHaveLength(2);
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

      const result = await analyzeCTA(perfectCTAHTML, { isHtml: true });
      
      expect(result.score).toBeGreaterThan(95);
      expect(result.issues).toHaveLength(0);
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

      const result = await analyzeCTA(mobileHTML, { viewport: { width: 375, height: 667 }, isHtml: true });
      
      expect(result.ctas[0].mobileOptimized).toBe(true);
      expect(result.score).toBeGreaterThan(85);
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

      const result = await analyzeCTA(priceHTML, { isHtml: true });
      
      expect(result.ctas).toHaveLength(2); // Price CTA and Learn More, About Us filtered out
      expect(result.primaryCTA?.text).toBe('$150 – Build Your Physical Autonomy');
      expect(result.primaryCTA?.type).toBe('primary');
      expect(result.score).toBeGreaterThanOrEqual(70);
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

      const result = await analyzeCTA(duplicateHTML, { isHtml: true });
      
      // Should deduplicate "Get Started" variations but keep "Start Now" as different
      expect(result.ctas).toHaveLength(2);
      expect(result.ctas.some(cta => cta.text === 'Get Started')).toBe(true);
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

      const result = await analyzeCTA(testimonialHTML, { isHtml: true });
      
      // Should only detect actual CTAs, not customer names
      expect(result.ctas).toHaveLength(2);
      expect(result.ctas.every(cta => !['John R.', 'Sarah', 'Maxwell'].includes(cta.text))).toBe(true);
      expect(result.ctas.some(cta => cta.text === 'Get Started')).toBe(true);
      expect(result.ctas.some(cta => cta.text === 'Sign Up Today')).toBe(true);
    });
  });
});