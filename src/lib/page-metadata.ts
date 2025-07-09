import { createPuppeteerBrowser } from './puppeteer-config';

export interface PageMetadata {
  title: string;
  description: string;
  url: string;
}

export async function extractPageMetadata(url: string, options: { puppeteer?: { forceBrowserless?: boolean } } = {}): Promise<PageMetadata> {
  const browser = await createPuppeteerBrowser({ 
    forceBrowserless: options.puppeteer?.forceBrowserless 
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.setDefaultTimeout(30000);
    
    // Navigate to the page
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Extract title and meta description
    const metadata = await page.evaluate(() => {
      const title = document.title || '';
      const descriptionMeta = document.querySelector('meta[name="description"]');
      const description = descriptionMeta?.getAttribute('content') || '';
      
      return {
        title: title.trim(),
        description: description.trim(),
        url: window.location.href
      };
    });

    return metadata;
  } catch (error) {
    console.error('Error extracting page metadata:', error);
    // Return fallback metadata
    return {
      title: 'Page Title Unavailable',
      description: 'Description not available',
      url: url
    };
  } finally {
    await browser.close();
  }
}