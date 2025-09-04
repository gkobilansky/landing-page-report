import { createPuppeteerBrowser } from './puppeteer-config';

export interface ImageOptimizationResult {
  score: number | null;
  status: 'analyzed' | 'not_applicable' | 'error';
  totalImages: number;
  modernFormats: number;
  withAltText: number;
  appropriatelySized: number;
  issues: string[];
  recommendations: string[];
  details: {
    formatBreakdown: Record<string, number>;
    avgImageSize: { width: number; height: number } | null;
    largestImage: { width: number; height: number; src: string } | null;
  };
}

interface ImageData {
  src: string;
  alt: string | null;
  width: number;
  height: number;
  role?: string;
  type?: 'img' | 'background';
}

const MODERN_FORMATS = ['webp', 'avif'];
const LEGACY_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
const MAX_REASONABLE_SIZE = 2000; // pixels

export interface ImageOptimizationOptions {
  puppeteer?: {
    forceBrowserless?: boolean;
  };
}

export async function analyzeImageOptimization(url: string, options: ImageOptimizationOptions = {}): Promise<ImageOptimizationResult> {
  console.log('🖼️ Starting image optimization analysis for:', url);
  
  let browser;
  
  try {
    browser = await createPuppeteerBrowser(options.puppeteer || {});
    
    const page = await browser.newPage();
    
    console.log('📄 Navigating to page...');
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('🔍 Extracting image data...');
    const images = await page.evaluate(() => {
      const imgElements = Array.from(document.querySelectorAll('img'));
      const allElements = Array.from(document.querySelectorAll('*'));
      
      // Extract img tag data
      const imgData = imgElements.map(img => {
        const computedStyle = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        
        return {
          src: img.src || img.getAttribute('src') || '',
          alt: img.alt || null,
          width: img.naturalWidth || rect.width || 0,
          height: img.naturalHeight || rect.height || 0,
          role: img.getAttribute('role') || undefined,
          type: 'img' as const
        };
      }).filter(img => img.src && img.src !== '');
      
      // Extract CSS background images
      const backgroundImages: Array<{
        src: string;
        alt: string | null;
        width: number;
        height: number;
        role?: string;
        type: 'background';
      }> = [];
      
      allElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const backgroundImage = computedStyle.backgroundImage;
        
        if (backgroundImage && backgroundImage !== 'none') {
          // Extract URL from background-image property
          const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (urlMatch && urlMatch[1]) {
            const rect = element.getBoundingClientRect();
            const ariaLabel = element.getAttribute('aria-label');
            const altText = element.getAttribute('data-alt') || ariaLabel;
            
            backgroundImages.push({
              src: urlMatch[1],
              alt: altText || null,
              width: rect.width || 0,
              height: rect.height || 0,
              role: element.getAttribute('role') || undefined,
              type: 'background'
            });
          }
        }
      });
      
      return [...imgData, ...backgroundImages];
    });
    
    console.log(`📊 Found ${images.length} images to analyze`);
    
    const result = analyzeImages(images);
    
    console.log('✅ Image optimization analysis complete');
    console.log(`📈 Final score: ${result.score}/100`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error during image optimization analysis:', error);
    
    return {
      score: 0,
      status: 'error',
      totalImages: 0,
      modernFormats: 0,
      withAltText: 0,
      appropriatelySized: 0,
      issues: [`Failed to analyze images: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Please check the URL and try again'],
      details: {
        formatBreakdown: {},
        avgImageSize: null,
        largestImage: null
      }
    };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function analyzeImages(images: ImageData[]): ImageOptimizationResult {
  console.log(`🔬 Analyzing ${images.length} images...`);
  
  if (images.length === 0) {
    console.log('📭 No images found - returning N/A status');
    return {
      score: null,
      status: 'not_applicable',
      totalImages: 0,
      modernFormats: 0,
      withAltText: 0,
      appropriatelySized: 0,
      issues: [],
      recommendations: ['Consider adding relevant images if appropriate for your content'],
      details: {
        formatBreakdown: {},
        avgImageSize: null,
        largestImage: null
      }
    };
  }
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  const formatBreakdown: Record<string, number> = {};
  
  let modernFormats = 0;
  let withAltText = 0;
  let appropriatelySized = 0;
  let totalWidth = 0;
  let totalHeight = 0;
  let largestImage: { width: number; height: number; src: string } | null = null;
  
  images.forEach((img, index) => {
    console.log(`🔍 Analyzing image ${index + 1}: ${img.src}`);
    
    // Extract file extension
    const extension = getFileExtension(img.src);
    formatBreakdown[extension] = (formatBreakdown[extension] || 0) + 1;
    
    // Check format modernity
    if (MODERN_FORMATS.includes(extension.toLowerCase())) {
      modernFormats++;
      console.log(`✅ Modern format detected: ${extension}`);
    } else if (LEGACY_FORMATS.includes(extension.toLowerCase())) {
      console.log(`⚠️ Legacy format detected: ${extension}`);
    }
    
    // Check alt text (handle img tags and CSS backgrounds differently)
    let hasProperAltText = false;
    
    if (img.type === 'background') {
      // CSS background images are often decorative, so more lenient
      hasProperAltText = Boolean(img.alt && img.alt.trim().length > 0) || 
                        img.role === 'presentation' || 
                        img.role === 'img'; // Decorative background assumed if no alt
      
      if (!img.alt && img.role !== 'presentation') {
        // Only flag if it's clearly meant to be content
        const elementRect = { width: img.width, height: img.height };
        const isContentImage = elementRect.width > 100 && elementRect.height > 100;
        hasProperAltText = !isContentImage; // Small backgrounds assumed decorative
      } else {
        hasProperAltText = true;
      }
    } else {
      // Regular img tags need proper alt text or role="presentation"
      hasProperAltText = Boolean(img.alt && img.alt.trim().length > 0) || 
                        (img.role === 'presentation' && img.alt === '');
    }
    
    if (hasProperAltText) {
      withAltText++;
      console.log(`✅ Proper alt handling (${img.type}): "${img.alt}"`);
    } else {
      console.log(`⚠️ Missing alt text for ${img.type}: "${img.alt}"`);
    }
    
    // Check image sizing
    if (img.width > 0 && img.height > 0) {
      totalWidth += img.width;
      totalHeight += img.height;
      
      if (img.width <= MAX_REASONABLE_SIZE && img.height <= MAX_REASONABLE_SIZE) {
        appropriatelySized++;
        console.log(`✅ Appropriate size: ${img.width}x${img.height}`);
      } else {
        console.log(`⚠️ Oversized image: ${img.width}x${img.height}`);
      }
      
      // Track largest image
      if (!largestImage || (img.width * img.height) > (largestImage.width * largestImage.height)) {
        largestImage = { width: img.width, height: img.height, src: img.src };
      }
    } else {
      console.log(`⚠️ Unknown dimensions for image`);
    }
  });
  
  // Generate issues and recommendations
  const legacyCount = images.length - modernFormats;
  if (legacyCount > 0) {
    issues.push(`${legacyCount} images using legacy formats (JPG/PNG)`);
    recommendations.push('Convert JPG/PNG images to WebP or AVIF for better compression');
  }
  
  const missingAltCount = images.length - withAltText;
  if (missingAltCount > 0) {
    issues.push(`${missingAltCount} images missing descriptive alt text`);
    recommendations.push('Add descriptive alt text to all images for accessibility');
  }
  
  const oversizedCount = images.length - appropriatelySized;
  const unknownSizeCount = images.filter(img => img.width === 0 || img.height === 0).length;
  
  if (oversizedCount > unknownSizeCount) {
    issues.push(`${oversizedCount - unknownSizeCount} images may be oversized (>2000px width/height)`);
    recommendations.push('Resize large images to appropriate dimensions for web display');
  }
  
  if (unknownSizeCount > 0) {
    issues.push(`${unknownSizeCount} images have unknown dimensions`);
    recommendations.push('Ensure all images have proper width/height attributes');
  }
  
  // Calculate weighted score
  const formatScore = (modernFormats / images.length) * 40; // 40% weight
  const altTextScore = (withAltText / images.length) * 35; // 35% weight
  const sizingScore = (appropriatelySized / images.length) * 25; // 25% weight
  
  const score = Math.round(formatScore + altTextScore + sizingScore);
  
  console.log(`📊 Scoring breakdown:`);
  console.log(`   Format: ${modernFormats}/${images.length} = ${formatScore.toFixed(1)} points`);
  console.log(`   Alt text: ${withAltText}/${images.length} = ${altTextScore.toFixed(1)} points`);
  console.log(`   Sizing: ${appropriatelySized}/${images.length} = ${sizingScore.toFixed(1)} points`);
  
  return {
    score,
    status: 'analyzed',
    totalImages: images.length,
    modernFormats,
    withAltText,
    appropriatelySized,
    issues,
    recommendations,
    details: {
      formatBreakdown,
      avgImageSize: images.length > 0 ? {
        width: Math.round(totalWidth / images.length),
        height: Math.round(totalHeight / images.length)
      } : null,
      largestImage
    }
  };
}

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Handle common variations
    if (extension === 'jpeg') return 'jpg';
    
    return extension;
  } catch {
    return 'unknown';
  }
}