import { jest } from '@jest/globals';

// Mock @vercel/blob
const mockPut = jest.fn() as jest.MockedFunction<any>;
jest.mock('@vercel/blob', () => ({
  put: (...args: any[]) => mockPut(...args)
}));

// Mock puppeteer config
const mockBrowser = {
  newPage: jest.fn() as jest.MockedFunction<any>,
  close: jest.fn() as jest.MockedFunction<any>
};

const mockPage = {
  setViewport: jest.fn() as jest.MockedFunction<any>,
  goto: jest.fn() as jest.MockedFunction<any>,
  screenshot: jest.fn() as jest.MockedFunction<any>
};

jest.mock('../puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(() => Promise.resolve(mockBrowser))
}));

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

import { captureAndStoreScreenshot, captureScreenshotWithBrowserless, captureScreenshotFromPage } from '../screenshot-storage';

describe('Screenshot Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockPage.setViewport.mockResolvedValue(undefined);
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.screenshot.mockResolvedValue(Buffer.from('mock-screenshot-data'));
    
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/screenshot-test-123.png',
      pathname: 'screenshot-test-123.png',
      downloadUrl: 'https://blob.vercel-storage.com/screenshot-test-123.png?download=1',
      size: 12345,
    });

    // Mock setTimeout to resolve immediately in tests
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
      fn();
      return {} as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('captureAndStoreScreenshot', () => {
    it('should capture screenshot and upload to Vercel Blob', async () => {
      const url = 'https://example.com';
      const result = await captureAndStoreScreenshot(url);

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1920, height: 1080 });
      expect(mockPage.goto).toHaveBeenCalledWith(url, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      });
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'png',
        quality: undefined,
        fullPage: true,
        optimizeForSpeed: false
      });

      expect(mockPut).toHaveBeenCalledWith(
        expect.stringMatching(/^screenshot-.*\.png$/),
        expect.any(Buffer),
        {
          access: 'public',
          contentType: 'image/png',
          addRandomSuffix: false,
        }
      );

      expect(result).toMatchObject({
        url,
        blobUrl: 'https://blob.vercel-storage.com/screenshot-test-123.png',
        pathname: 'screenshot-test-123.png',
        downloadUrl: 'https://blob.vercel-storage.com/screenshot-test-123.png?download=1',
        size: 12345,
        uploadedAt: expect.any(String)
      });

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle custom options', async () => {
      const url = 'https://example.com';
      const options = {
        fullPage: false,
        format: 'jpeg' as const,
        quality: 90,
        viewport: { width: 1280, height: 720 }
      };

      await captureAndStoreScreenshot(url, options);

      expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'jpeg',
        quality: 90,
        fullPage: false,
        optimizeForSpeed: false
      });

      expect(mockPut).toHaveBeenCalledWith(
        expect.stringMatching(/^screenshot-.*\.jpeg$/),
        expect.any(Buffer),
        {
          access: 'public',
          contentType: 'image/jpeg',
          addRandomSuffix: false,
        }
      );
    });

    it('should handle errors and close browser', async () => {
      const url = 'https://example.com';
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(captureAndStoreScreenshot(url)).rejects.toThrow('Screenshot capture failed');
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('captureScreenshotWithBrowserless', () => {
    beforeEach(() => {
      // Reset environment
      Object.defineProperty(process.env, 'NODE_ENV', { value: undefined, writable: true });
      delete process.env.BLESS_KEY;
    });

    it('should use Browserless API in production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      process.env.BLESS_KEY = 'test-key';

      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const url = 'https://example.com';
      const result = await captureScreenshotWithBrowserless(url);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://chrome.browserless.io/screenshot?token=test-key',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            options: {
              viewport: { width: 1920, height: 1080 },
              type: 'png',
              quality: undefined,
              fullPage: true,
              optimizeForSpeed: false,
              blockConsentModals: true
            }
          })
        }
      );

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should use local Puppeteer in development', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });

      const url = 'https://example.com';
      const result = await captureScreenshotWithBrowserless(url);

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle Browserless API errors', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      process.env.BLESS_KEY = 'test-key';

      const mockResponse = {
        ok: false,
        statusText: 'Bad Request'
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const url = 'https://example.com';
      
      await expect(captureScreenshotWithBrowserless(url)).rejects.toThrow(
        'Browserless screenshot API failed: Bad Request'
      );
    });
  });

  describe('captureScreenshotFromPage', () => {
    it('should capture screenshot from existing page and upload', async () => {
      const url = 'https://example.com';
      const result = await captureScreenshotFromPage(mockPage, url);

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'png',
        quality: undefined,
        fullPage: true,
        optimizeForSpeed: false
      });

      expect(mockPut).toHaveBeenCalled();
      expect(result.url).toBe(url);
    });

    it('should handle screenshot errors', async () => {
      mockPage.screenshot.mockRejectedValue(new Error('Screenshot failed'));
      
      const url = 'https://example.com';
      
      await expect(captureScreenshotFromPage(mockPage, url)).rejects.toThrow(
        'Screenshot storage failed'
      );
    });
  });
});