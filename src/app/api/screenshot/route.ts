import { NextRequest, NextResponse } from 'next/server';
import { captureAndStoreScreenshot } from '@/lib/screenshot-storage';

export async function POST(request: NextRequest) {
  console.log('📸 API /screenshot endpoint called');
  
  try {
    const body = await request.json();
    const { url } = body;
    
    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      if (!validatedUrl.hostname || !validatedUrl.hostname.includes('.')) {
        throw new Error('Invalid hostname');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    console.log(`📸 Capturing screenshot for: ${validatedUrl.toString()}`);
    
    // Capture and store screenshot
    const screenshotResult = await captureAndStoreScreenshot(validatedUrl.toString(), {
      fullPage: true,
      format: 'png',
      quality: 80,
      viewport: { width: 1920, height: 1080 }
    });
    
    console.log(`✅ Screenshot captured successfully: ${screenshotResult.blobUrl}`);
    
    return NextResponse.json({
      success: true,
      screenshot: {
        url: screenshotResult.blobUrl,
        size: screenshotResult.size,
        uploadedAt: screenshotResult.uploadedAt
      },
      message: 'Screenshot captured successfully'
    });
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    return NextResponse.json(
      { error: 'Failed to capture screenshot' },
      { status: 500 }
    );
  }
}