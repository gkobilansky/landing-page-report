import { put } from '@vercel/blob';
import { createPuppeteerBrowser } from './puppeteer-config';

export interface ScreenshotResult {
  url: string;
  blobUrl: string;
  pathname: string;
  downloadUrl: string;
  size: number;
  uploadedAt: string;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  viewport?: {
    width: number;
    height: number;
  };
  puppeteer?: {
    forceBrowserless?: boolean;
  };
}

/**
 * Captures a full-page screenshot and stores it in Vercel Blob
 */
export async function captureAndStoreScreenshot(
  url: string, 
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  console.log(`📸 Starting screenshot capture for: ${url}`);
  
  const startTime = Date.now();
  let browser;
  
  try {
    const {
      fullPage = true,
      quality = 80,
      format = 'png',
      viewport = { width: 1920, height: 1080 }
    } = options;

    // Launch browser
    console.log('🌐 Launching browser for screenshot...');
    browser = await createPuppeteerBrowser(options.puppeteer || {});
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(viewport);
    
    // Navigate to page
    console.log(`🔗 Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Capture screenshot
    console.log(`📷 Capturing ${fullPage ? 'full-page' : 'viewport'} screenshot...`);
    const screenshotBuffer = await page.screenshot({ 
      type: format,
      quality: format === 'jpeg' ? quality : undefined,
      fullPage,
      optimizeForSpeed: false
    });
    
    // Generate filename with timestamp and URL hash
    const urlHash = Buffer.from(url).toString('base64url').slice(0, 10);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${urlHash}-${timestamp}.${format}`;
    
    console.log(`☁️ Uploading screenshot to Vercel Blob (${screenshotBuffer.length} bytes)...`);
    
    // Upload to Vercel Blob
    const blob = await put(filename, screenshotBuffer, {
      access: 'public',
      contentType: `image/${format}`,
      addRandomSuffix: false,
    });
    
    const captureTime = Date.now() - startTime;
    console.log(`✅ Screenshot captured and stored successfully in ${captureTime}ms`);
    console.log(`🔗 Blob URL: ${blob.url}`);
    console.log(`📊 Size: ${screenshotBuffer.length} bytes`);
    
    return {
      url,
      blobUrl: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
      size: screenshotBuffer.length,
      uploadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Captures a screenshot using Browserless API (production) or local Puppeteer (development)
 */
export async function captureScreenshotWithBrowserless(
  url: string,
  options: ScreenshotOptions = {}
): Promise<Buffer> {
  const isProduction = process.env.NODE_ENV === 'production';
  const browserlessKey = process.env.BLESS_KEY;
  
  const {
    fullPage = true,
    quality = 80,
    format = 'png',
    viewport = { width: 1920, height: 1080 }
  } = options;
  
  if (isProduction && browserlessKey) {
    console.log('☁️ Using Browserless API for screenshot...');
    
    const screenshotResponse = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        options: {
          viewport,
          type: format,
          quality: format === 'jpeg' ? quality : undefined,
          fullPage,
          optimizeForSpeed: false
        }
      })
    });
    
    if (!screenshotResponse.ok) {
      throw new Error(`Browserless screenshot API failed: ${screenshotResponse.statusText}`);
    }
    
    return Buffer.from(await screenshotResponse.arrayBuffer());
  } else {
    console.log('🏠 Using local Puppeteer for screenshot...');
    
    let browser;
    try {
      browser = await createPuppeteerBrowser();
      const page = await browser.newPage();
      await page.setViewport(viewport);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      });
      
      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const screenshot = await page.screenshot({ 
        type: format,
        quality: format === 'jpeg' ? quality : undefined,
        fullPage,
        optimizeForSpeed: false
      });
      
      return Buffer.from(screenshot);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

/**
 * Enhanced version that uses existing browser session or creates new one
 */
export async function captureScreenshotFromPage(
  page: any,
  url: string,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  console.log(`📸 Capturing screenshot from existing page session...`);
  
  const startTime = Date.now();
  
  try {
    const {
      fullPage = true,
      quality = 80,
      format = 'png'
    } = options;
    
    // Capture screenshot from existing page
    console.log(`📷 Capturing ${fullPage ? 'full-page' : 'viewport'} screenshot...`);
    const screenshotBuffer = await page.screenshot({ 
      type: format,
      quality: format === 'jpeg' ? quality : undefined,
      fullPage,
      optimizeForSpeed: false
    });
    
    // Generate filename
    const urlHash = Buffer.from(url).toString('base64url').slice(0, 10);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${urlHash}-${timestamp}.${format}`;
    
    console.log(`☁️ Uploading screenshot to Vercel Blob (${screenshotBuffer.length} bytes)...`);
    
    // Upload to Vercel Blob
    const blob = await put(filename, screenshotBuffer, {
      access: 'public',
      contentType: `image/${format}`,
      addRandomSuffix: false,
    });
    
    const captureTime = Date.now() - startTime;
    console.log(`✅ Screenshot stored successfully in ${captureTime}ms`);
    console.log(`🔗 Blob URL: ${blob.url}`);
    
    return {
      url,
      blobUrl: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
      size: screenshotBuffer.length,
      uploadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Screenshot storage failed:', error);
    throw new Error(`Screenshot storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}