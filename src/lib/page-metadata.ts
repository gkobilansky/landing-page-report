import { createPuppeteerBrowser } from './puppeteer-config';

export interface PageMetadata {
  title: string;
  description: string;
  url: string;
  schema: {
    name?: string;
    description?: string;
    organization?: any;
  } | null;
}

export async function extractPageMetadata(url: string, options: { puppeteer?: { forceBrowserless?: boolean } } = {}): Promise<PageMetadata> {
  let browser;
  
  try {
    browser = await createPuppeteerBrowser({ 
      forceBrowserless: options.puppeteer?.forceBrowserless 
    });
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.setDefaultTimeout(30000);
    
    // Navigate to the page
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Extract title, meta description, and JSON-LD schema data
    const metadata = await page.evaluate(() => {
      const title = document.title || '';
      const descriptionMeta = document.querySelector('meta[name="description"]');
      const description = descriptionMeta?.getAttribute('content') || '';
      
      // Extract JSON-LD schema data
      let schema = null;
      try {
        const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of schemaScripts) {
          const schemaData = JSON.parse(script.textContent || '');
          
          // Handle both single objects and arrays
          const schemas = Array.isArray(schemaData) ? schemaData : [schemaData];
          
          // Look for Organization or WebSite schema
          for (const item of schemas) {
            if (item['@type'] === 'Organization') {
              schema = {
                name: item.name,
                description: item.description,
                organization: item
              };
              break;
            } else if (item['@type'] === 'WebSite' && item.name && !schema) {
              schema = {
                name: item.name,
                description: item.description,
                organization: item
              };
            }
          }
          
          if (schema) break;
        }
      } catch (error) {
        console.warn('Failed to parse JSON-LD schema:', error);
      }
      
      return {
        title: title.trim(),
        description: description.trim(),
        url: window.location.href,
        schema
      };
    });

    return metadata;
  } catch (error) {
    console.error('Error extracting page metadata:', error);
    // Return fallback metadata
    return {
      title: 'Page Title Unavailable',
      description: 'Description not available',
      url: url,
      schema: null
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}