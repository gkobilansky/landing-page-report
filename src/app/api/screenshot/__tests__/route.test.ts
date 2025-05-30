import { POST } from '../route';
import { NextRequest } from 'next/server';
import { jest } from '@jest/globals';

// Mock the screenshot storage module
const mockCaptureAndStoreScreenshot = jest.fn();
jest.mock('@/lib/screenshot-storage', () => ({
  captureAndStoreScreenshot: mockCaptureAndStoreScreenshot
}));

describe('/api/screenshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCaptureAndStoreScreenshot.mockResolvedValue({
      url: 'https://example.com',
      blobUrl: 'https://blob.vercel-storage.com/screenshot-test-123.png',
      pathname: 'screenshot-test-123.png',
      downloadUrl: 'https://blob.vercel-storage.com/screenshot-test-123.png?download=1',
      size: 12345,
      uploadedAt: '2023-12-01T10:00:00.000Z'
    });
  });

  it('should capture and return screenshot successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/screenshot', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      screenshot: {
        url: 'https://blob.vercel-storage.com/screenshot-test-123.png',
        size: 12345,
        uploadedAt: '2023-12-01T10:00:00.000Z'
      },
      message: 'Screenshot captured successfully'
    });

    expect(mockCaptureAndStoreScreenshot).toHaveBeenCalledWith('https://example.com/', {
      fullPage: true,
      format: 'png',
      quality: 80,
      viewport: { width: 1920, height: 1080 }
    });
  });

  it('should return 400 for missing URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/screenshot', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'URL is required'
    });

    expect(mockCaptureAndStoreScreenshot).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/screenshot', {
      method: 'POST',
      body: JSON.stringify({ url: 'invalid-url' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid URL format'
    });

    expect(mockCaptureAndStoreScreenshot).not.toHaveBeenCalled();
  });

  it('should return 400 for URL without domain extension', async () => {
    const request = new NextRequest('http://localhost:3000/api/screenshot', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://stripe' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid URL format'
    });

    expect(mockCaptureAndStoreScreenshot).not.toHaveBeenCalled();
  });

  it('should return 500 when screenshot capture fails', async () => {
    mockCaptureAndStoreScreenshot.mockRejectedValue(new Error('Browser launch failed'));

    const request = new NextRequest('http://localhost:3000/api/screenshot', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to capture screenshot'
    });

    expect(mockCaptureAndStoreScreenshot).toHaveBeenCalled();
  });

  it('should handle URLs with different protocols', async () => {
    const testCases = [
      'https://example.com',
      'http://example.com',
      'https://subdomain.example.co.uk'
    ];

    for (const url of testCases) {
      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });

  it('should reject non-HTTP protocols', async () => {
    const invalidUrls = [
      'ftp://example.com',
      'file:///path/to/file',
      'javascript:alert(1)'
    ];

    for (const url of invalidUrls) {
      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    }
  });
});