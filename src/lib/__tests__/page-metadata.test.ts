import { extractPageMetadata } from '../page-metadata';

// Mock puppeteer-config
const mockPage = {
  setDefaultTimeout: jest.fn(),
  goto: jest.fn(),
  evaluate: jest.fn()
};

const mockBrowser = {
  newPage: jest.fn(),
  close: jest.fn()
};

jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn().mockResolvedValue({
    newPage: jest.fn(),
    close: jest.fn()
  })
}));

describe('Page Metadata Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockPage.goto.mockResolvedValue(true);
    
    // Mock the puppeteer-config module for each test
    const { createPuppeteerBrowser } = require('../puppeteer-config');
    createPuppeteerBrowser.mockResolvedValue(mockBrowser);
  });

  describe('extractPageMetadata', () => {
    it('should extract page title and description successfully', async () => {
      const mockMetadata = {
        title: 'Landing Page Report - Optimize Your Conversions',
        description: 'Get detailed analysis of your landing page performance with actionable recommendations.',
        url: 'https://example.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://example.com');

      expect(result).toEqual(mockMetadata);
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('should handle empty title gracefully', async () => {
      const mockMetadata = {
        title: '',
        description: 'Some description',
        url: 'https://example.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://example.com');

      expect(result.title).toBe('');
      expect(result.description).toBe('Some description');
    });

    it('should handle missing meta description', async () => {
      const mockMetadata = {
        title: 'Test Page',
        description: '',
        url: 'https://example.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://example.com');

      expect(result.title).toBe('Test Page');
      expect(result.description).toBe('');
    });

    it('should trim whitespace from title and description', async () => {
      const mockMetadata = {
        title: '  Landing Page Report  ',
        description: '  Get detailed analysis  ',
        url: 'https://example.com'
      };

      mockPage.evaluate.mockResolvedValue({
        title: 'Landing Page Report',
        description: 'Get detailed analysis',
        url: 'https://example.com',
        schema: null
      });

      const result = await extractPageMetadata('https://example.com');

      expect(result.title).toBe('Landing Page Report');
      expect(result.description).toBe('Get detailed analysis');
    });

    it('should handle long titles by preserving them', async () => {
      const longTitle = 'This is a very long page title that exceeds normal length limits and should still be captured correctly for reporting purposes';
      
      const mockMetadata = {
        title: longTitle,
        description: 'Description',
        url: 'https://example.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://example.com');

      expect(result.title).toBe(longTitle);
    });

    it('should handle special characters in title', async () => {
      const titleWithSpecialChars = 'Test & Company | Best Deals 50% Off! 🚀';
      
      const mockMetadata = {
        title: titleWithSpecialChars,
        description: 'Description with émojis 😊',
        url: 'https://example.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://example.com');

      expect(result.title).toBe(titleWithSpecialChars);
      expect(result.description).toBe('Description with émojis 😊');
    });

    it('should handle network errors with fallback metadata', async () => {
      mockPage.goto.mockRejectedValue(new Error('Network timeout'));

      const result = await extractPageMetadata('https://example.com');

      expect(result).toEqual({
        title: 'Page Title Unavailable',
        description: 'Description not available',
        url: 'https://example.com',
        schema: null
      });
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('should handle page evaluation errors with fallback metadata', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Page evaluation failed'));

      const result = await extractPageMetadata('https://example.com');

      expect(result).toEqual({
        title: 'Page Title Unavailable',
        description: 'Description not available',
        url: 'https://example.com',
        schema: null
      });
    });

    it('should handle browser creation errors', async () => {
      // Temporarily mock to reject for this test only
      const { createPuppeteerBrowser } = require('../puppeteer-config');
      const originalMock = createPuppeteerBrowser;
      createPuppeteerBrowser.mockRejectedValueOnce(new Error('Browser launch failed'));

      const result = await extractPageMetadata('https://example.com');

      expect(result).toEqual({
        title: 'Page Title Unavailable',
        description: 'Description not available',
        url: 'https://example.com',
        schema: null
      });
      
      // Restore the original mock for other tests
      createPuppeteerBrowser.mockImplementation(originalMock);
    });

    it('should pass puppeteer options correctly', async () => {
      const mockMetadata = {
        title: 'Test Title',
        description: 'Test Description',
        url: 'https://example.com'
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      await extractPageMetadata('https://example.com', {
        puppeteer: { forceBrowserless: true }
      });

      const { createPuppeteerBrowser } = require('../puppeteer-config');
      expect(createPuppeteerBrowser).toHaveBeenCalledWith({
        forceBrowserless: true
      });
    });

    it('should capture actual URL after redirects', async () => {
      const mockMetadata = {
        title: 'Redirected Page',
        description: 'Final destination',
        url: 'https://final-destination.com'
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://redirect.com');

      expect(result.url).toBe('https://final-destination.com');
    });

    it('should handle pages with dynamic titles (SPA)', async () => {
      // Simulate a page with a dynamic title that has already loaded
      const spaMetadata = {
        title: 'Dynamic App Title',
        description: 'SPA Description',
        url: 'https://spa-example.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(spaMetadata);

      const result = await extractPageMetadata('https://spa-example.com');

      expect(result.title).toBe('Dynamic App Title');
      expect(result.description).toBe('SPA Description');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle e-commerce product pages', async () => {
      const productMetadata = {
        title: 'iPhone 15 Pro - Apple Store',
        description: 'Buy iPhone 15 Pro with Pro camera system, A17 Pro chip, and titanium design.',
        url: 'https://apple.com/iphone-15-pro',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(productMetadata);

      const result = await extractPageMetadata('https://apple.com/iphone-15-pro');

      expect(result.title).toContain('iPhone 15 Pro');
      expect(result.description).toContain('camera system');
    });

    it('should handle SaaS landing pages', async () => {
      const saasMetadata = {
        title: 'Project Management Software | TaskMaster Pro',
        description: 'Streamline your workflow with powerful project management tools. Free 14-day trial.',
        url: 'https://taskmaster.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(saasMetadata);

      const result = await extractPageMetadata('https://taskmaster.com');

      expect(result.title).toContain('Project Management');
      expect(result.description).toContain('workflow');
    });

    it('should handle blog posts', async () => {
      const blogMetadata = {
        title: '10 Tips for Better Landing Pages | Marketing Blog',
        description: 'Learn how to optimize your landing pages for higher conversion rates with these proven strategies.',
        url: 'https://blog.example.com/landing-page-tips',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(blogMetadata);

      const result = await extractPageMetadata('https://blog.example.com/landing-page-tips');

      expect(result.title).toContain('Landing Pages');
      expect(result.description).toContain('conversion rates');
    });
  });

  describe('Schema.org JSON-LD extraction', () => {
    it('should extract Organization schema successfully', async () => {
      const mockMetadata = {
        title: 'Stripe | Financial Infrastructure',
        description: 'Stripe powers online payments.',
        url: 'https://stripe.com',
        schema: {
          name: 'Stripe',
          description: 'Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes.',
          organization: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': 'https://stripe.com/#organization',
            'url': 'https://stripe.com/',
            'name': 'Stripe',
            'legalName': 'Stripe, Inc.',
            'description': 'Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes.'
          }
        }
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://stripe.com');

      expect(result.schema).not.toBeNull();
      expect(result.schema?.name).toBe('Stripe');
      expect(result.schema?.description).toContain('payment processing');
      expect(result.schema?.organization['@type']).toBe('Organization');
    });

    it('should extract WebSite schema when Organization is not available', async () => {
      const mockMetadata = {
        title: 'My Website',
        description: 'A great website',
        url: 'https://example.com',
        schema: {
          name: 'Example Website',
          description: 'A comprehensive example website',
          organization: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'url': 'https://example.com/',
            'name': 'Example Website',
            'description': 'A comprehensive example website'
          }
        }
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://example.com');

      expect(result.schema).not.toBeNull();
      expect(result.schema?.name).toBe('Example Website');
      expect(result.schema?.organization['@type']).toBe('WebSite');
    });

    it('should handle array of schema objects', async () => {
      const mockMetadata = {
        title: 'Test Site',
        description: 'Test description',
        url: 'https://test.com',
        schema: {
          name: 'Test Organization',
          description: 'A test organization',
          organization: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': 'Test Organization',
            'description': 'A test organization'
          }
        }
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://test.com');

      expect(result.schema).not.toBeNull();
      expect(result.schema?.name).toBe('Test Organization');
    });

    it('should handle malformed JSON-LD gracefully', async () => {
      const mockMetadata = {
        title: 'Test Page',
        description: 'Test description',
        url: 'https://test.com',
        schema: null // This simulates failed JSON parsing
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://test.com');

      expect(result.schema).toBeNull();
      expect(result.title).toBe('Test Page');
      expect(result.description).toBe('Test description');
    });

    it('should prioritize Organization over WebSite schema', async () => {
      const mockMetadata = {
        title: 'Company Site',
        description: 'Our company website',
        url: 'https://company.com',
        schema: {
          name: 'Company Inc',
          description: 'A leading company in the industry',
          organization: {
            '@context': 'https://schema.org',
            '@type': 'Organization', // This should be prioritized over WebSite
            'name': 'Company Inc',
            'description': 'A leading company in the industry'
          }
        }
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://company.com');

      expect(result.schema).not.toBeNull();
      expect(result.schema?.name).toBe('Company Inc');
      expect(result.schema?.organization['@type']).toBe('Organization');
    });

    it('should handle pages without schema gracefully', async () => {
      const mockMetadata = {
        title: 'Simple Page',
        description: 'A simple page without schema',
        url: 'https://simple.com',
        schema: null
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://simple.com');

      expect(result.schema).toBeNull();
      expect(result.title).toBe('Simple Page');
      expect(result.description).toBe('A simple page without schema');
    });

    it('should handle schema with missing name field', async () => {
      const mockMetadata = {
        title: 'Incomplete Schema Page',
        description: 'Page with incomplete schema',
        url: 'https://incomplete.com',
        schema: {
          name: undefined,
          description: 'Some description',
          organization: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'description': 'Some description'
            // Missing 'name' field
          }
        }
      };

      mockPage.evaluate.mockResolvedValue(mockMetadata);

      const result = await extractPageMetadata('https://incomplete.com');

      expect(result.schema).not.toBeNull();
      expect(result.schema?.name).toBeUndefined();
      expect(result.schema?.description).toBe('Some description');
    });
  });
}); 