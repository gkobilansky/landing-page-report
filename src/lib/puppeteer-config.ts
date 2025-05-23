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

export async function createPuppeteerBrowser() {
  const isProduction = process.env.NODE_ENV === 'production';
  const browserlessKey = process.env.BLESS_KEY;
  
  if (isProduction && browserlessKey) {
    // Browserless.io configuration for production
    try {
      console.log('🌐 Connecting to Browserless.io...');
      
      const browserWSEndpoint = `wss://chrome.browserless.io?token=${browserlessKey}`;
      
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
    console.log('🏠 Running in local development mode...');
    
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