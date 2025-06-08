import puppeteer from 'puppeteer-core';

// Import puppeteer for local development executable path
let localPuppeteer: any;

async function getLocalExecutablePath() {
  if (!localPuppeteer) {
    try {
      localPuppeteer = await import('puppeteer');
      return localPuppeteer.executablePath();
    } catch (error) {
      console.warn('Local puppeteer not available, using system Chrome');
      return null;
    }
  }
  return localPuppeteer.executablePath();
}

export async function createPuppeteerBrowser(options: { forceBrowserless?: boolean } = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const browserlessKey = process.env.BLESS_KEY;
  const { forceBrowserless = false } = options;
  
  if ((isProduction || forceBrowserless) && browserlessKey) {
    // Browserless.io configuration for production
    try {
      console.log('🌐 Connecting to Browserless.io...');
      
      // Use regional endpoint with WebSocket protocol and BaaS v2 compatible parameters
      // Note: blockConsentModals and humanlike are not supported in BaaS v2 WebSocket
      const browserWSEndpoint = `wss://production-sfo.browserless.io?token=${browserlessKey}&headless=false&stealth=true&blockAds=true`;
      
      console.log('🔗 Connecting to browser WebSocket endpoint...');
      
      return await puppeteer.connect({
        browserWSEndpoint,
        defaultViewport: { width: 1920, height: 1080 },
      });
    } catch (error) {
      console.error('❌ Failed to connect to Browserless:', error);
      throw new Error(`Browserless connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Local development configuration
    console.log(forceBrowserless ? '🏠 Browserless disabled - running locally...' : '🏠 Running in local development mode...');
    
    return await puppeteer.launch({
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: await getLocalExecutablePath(),
      headless: true,
    });
  }
}