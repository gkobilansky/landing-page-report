import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
  
  if (isProduction) {
    // Vercel/serverless configuration with optimized chromium
    try {
      console.log('🔧 Launching Chromium in serverless environment...');
      
      // Enhanced args for better compatibility on Vercel
      const args = [
        ...chromium.args,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-background-media-suspend'
      ];

      const executablePath = await chromium.executablePath();
      
      console.log(`🎯 Using Chromium executable at: ${executablePath}`);
      
      return await puppeteer.launch({
        args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        timeout: 60000,
      });
    } catch (error) {
      console.error('❌ Failed to launch Chromium:', error);
      throw new Error(`Chromium launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Local development configuration
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