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
  
  return await puppeteer.launch({
    args: isProduction 
      ? chromium.args
      : ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: chromium.defaultViewport,
    executablePath: isProduction 
      ? await chromium.executablePath()
      : await getLocalExecutablePath(),
    headless: isProduction ? chromium.headless : true,
  });
}