import type { Browser } from 'puppeteer-core';
import { createPuppeteerBrowser } from './puppeteer-config';
import { getImageRecommendations, RecommendationContext } from './recommendations';

export interface ImageOptimizationResult {
  score: number | null;
  status: 'analyzed' | 'not_applicable' | 'error';
  totalImages: number;
  modernFormats: number;
  withAltText: number;
  appropriatelySized: number;
  // New responsive metrics
  responsiveImages: number;
  properlyLoadedImages: number;
  aboveFoldImages: number;
  issues: string[];
  recommendations: string[];
  details: {
    formatBreakdown: Record<string, number>;
    avgImageSize: { width: number; height: number } | null;
    largestImage: { width: number; height: number; src: string } | null;
    // New responsive details
    loadingStrategies: Record<string, number>;
    fetchPriorityUsage: Record<string, number>;
    placeholderUsage: number;
  };
}

interface ImageData {
  src: string;
  alt: string | null;
  width: number;
  height: number;
  role?: string;
  type?: 'img' | 'background';
  // Modern responsive attributes
  hasLazyLoading?: boolean;
  hasSrcset?: boolean;
  hasSizesAttribute?: boolean;
  loadingPriority?: 'eager' | 'lazy' | 'auto';
  isAboveFold?: boolean;
  hasBlurPlaceholder?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

const MODERN_FORMATS = ['webp', 'avif'];
const LEGACY_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
const MAX_REASONABLE_SIZE = 2000; // pixels

export interface ImageOptimizationOptions {
  puppeteer?: {
    browser?: Browser;
    forceBrowserless?: boolean;
  };
}

export async function analyzeImageOptimization(url: string, options: ImageOptimizationOptions = {}): Promise<ImageOptimizationResult> {
  console.log('🖼️ Starting image optimization analysis for:', url);
  
  const providedBrowser = options.puppeteer?.browser;
  const shouldCloseBrowser = !providedBrowser;
  let browser: Browser | null = providedBrowser || null;
  
  try {
    if (!browser) {
      browser = await createPuppeteerBrowser({
        forceBrowserless: options.puppeteer?.forceBrowserless
      });
    }
    
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
      
      // Get viewport info for above-fold detection
      const viewportHeight = window.innerHeight;
      
      // Extract img tag data with modern attributes
      const imgData = imgElements.map(img => {
        const computedStyle = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        
        // Check if image is above the fold
        const isAboveFold = rect.top < viewportHeight && rect.top + rect.height > 0;
        
        // Extract modern attributes
        const loadingAttr = img.getAttribute('loading') || 'auto';
        const hasLazyLoading = loadingAttr === 'lazy';
        const hasSrcset = Boolean(img.getAttribute('srcset'));
        const hasSizesAttribute = Boolean(img.getAttribute('sizes'));
        const fetchPriority = (img.getAttribute('fetchpriority') as 'high' | 'low' | 'auto') || 'auto';
        
        // Check for blur placeholder (data URL or low quality image)
        const hasBlurPlaceholder = Boolean(
          img.getAttribute('data-placeholder-blur') ||
          img.getAttribute('placeholder') ||
          (img.src && img.src.startsWith('data:image/'))
        );
        
        return {
          src: img.src || img.getAttribute('src') || '',
          alt: img.alt || null,
          width: img.naturalWidth || rect.width || 0,
          height: img.naturalHeight || rect.height || 0,
          role: img.getAttribute('role') || undefined,
          type: 'img' as const,
          // Modern responsive attributes
          hasLazyLoading,
          hasSrcset,
          hasSizesAttribute,
          loadingPriority: loadingAttr as 'eager' | 'lazy' | 'auto',
          isAboveFold,
          hasBlurPlaceholder,
          fetchPriority
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
        hasLazyLoading?: boolean;
        hasSrcset?: boolean;
        hasSizesAttribute?: boolean;
        loadingPriority?: 'eager' | 'lazy' | 'auto';
        isAboveFold?: boolean;
        hasBlurPlaceholder?: boolean;
        fetchPriority?: 'high' | 'low' | 'auto';
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
            
            // Check if background is above the fold
            const isAboveFold = rect.top < viewportHeight && rect.top + rect.height > 0;
            
            backgroundImages.push({
              src: urlMatch[1],
              alt: altText || null,
              width: rect.width || 0,
              height: rect.height || 0,
              role: element.getAttribute('role') || undefined,
              type: 'background',
              // CSS backgrounds don't have modern responsive attributes, set defaults
              hasLazyLoading: false,
              hasSrcset: false,
              hasSizesAttribute: false,
              loadingPriority: 'auto',
              isAboveFold,
              hasBlurPlaceholder: false,
              fetchPriority: 'auto'
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
      responsiveImages: 0,
      properlyLoadedImages: 0,
      aboveFoldImages: 0,
      issues: [`Failed to analyze images: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Please check the URL and try again'],
      details: {
        formatBreakdown: {},
        avgImageSize: null,
        largestImage: null,
        loadingStrategies: {},
        fetchPriorityUsage: {},
        placeholderUsage: 0
      }
    };
    
  } finally {
    if (shouldCloseBrowser && browser) {
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
      responsiveImages: 0,
      properlyLoadedImages: 0,
      aboveFoldImages: 0,
      issues: [],
      recommendations: ['Consider adding relevant images if appropriate for your content'],
      details: {
        formatBreakdown: {},
        avgImageSize: null,
        largestImage: null,
        loadingStrategies: {},
        fetchPriorityUsage: {},
        placeholderUsage: 0
      }
    };
  }
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  const formatBreakdown: Record<string, number> = {};
  const loadingStrategies: Record<string, number> = {};
  const fetchPriorityUsage: Record<string, number> = {};
  
  let modernFormats = 0;
  let withAltText = 0;
  let appropriatelySized = 0;
  let responsiveImages = 0;
  let properlyLoadedImages = 0;
  let aboveFoldImages = 0;
  let placeholderUsage = 0;
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
    
    // New responsive analysis (only for img tags, not CSS backgrounds)
    if (img.type === 'img') {
      // Track loading strategies
      const loadingStrategy = img.loadingPriority || 'auto';
      loadingStrategies[loadingStrategy] = (loadingStrategies[loadingStrategy] || 0) + 1;
      
      // Track fetch priority usage
      const fetchPriority = img.fetchPriority || 'auto';
      fetchPriorityUsage[fetchPriority] = (fetchPriorityUsage[fetchPriority] || 0) + 1;
      
      // Check if image is responsive (has srcset and sizes)
      if (img.hasSrcset && img.hasSizesAttribute) {
        responsiveImages++;
        console.log(`✅ Responsive image with srcset and sizes`);
      } else if (img.hasSrcset) {
        console.log(`⚠️ Has srcset but missing sizes attribute`);
      } else {
        console.log(`⚠️ Missing responsive image attributes`);
      }
      
      // Check loading optimization
      const isProperlyLoaded = 
        (img.isAboveFold && img.loadingPriority !== 'lazy') ||
        (!img.isAboveFold && img.hasLazyLoading);
      
      if (isProperlyLoaded) {
        properlyLoadedImages++;
        console.log(`✅ Proper loading strategy for ${img.isAboveFold ? 'above-fold' : 'below-fold'} image`);
      } else {
        console.log(`⚠️ Suboptimal loading: ${img.isAboveFold ? 'above-fold with lazy loading' : 'below-fold without lazy loading'}`);
      }
      
      // Track above-fold images
      if (img.isAboveFold) {
        aboveFoldImages++;
        console.log(`📍 Above-fold image detected`);
      }
      
      // Track placeholder usage
      if (img.hasBlurPlaceholder) {
        placeholderUsage++;
        console.log(`✅ Has blur placeholder`);
      }
    }
  });
  
  // Generate issues based on analysis
  const legacyCount = images.length - modernFormats;
  if (legacyCount > 0) {
    issues.push(`${legacyCount} images using legacy formats (JPG/PNG)`);
  }

  const missingAltCount = images.length - withAltText;
  if (missingAltCount > 0) {
    issues.push(`${missingAltCount} images missing descriptive alt text`);
  }

  const oversizedCount = images.length - appropriatelySized;
  const unknownSizeCount = images.filter(img => img.width === 0 || img.height === 0).length;

  if (oversizedCount > unknownSizeCount) {
    issues.push(`${oversizedCount - unknownSizeCount} images may be oversized (>2000px width/height)`);
  }

  if (unknownSizeCount > 0) {
    issues.push(`${unknownSizeCount} images have unknown dimensions`);
  }

  // New responsive image issues
  const imgTagsCount = images.filter(img => img.type === 'img').length;
  const nonResponsiveCount = imgTagsCount - responsiveImages;

  if (nonResponsiveCount > 0 && imgTagsCount > 0) {
    issues.push(`${nonResponsiveCount} images missing responsive attributes (srcset/sizes)`);
  }

  const improperlyLoadedCount = imgTagsCount - properlyLoadedImages;
  if (improperlyLoadedCount > 0 && imgTagsCount > 0) {
    issues.push(`${improperlyLoadedCount} images have suboptimal loading strategy`);
  }

  // Above-fold images without fetchpriority="high"
  const aboveFoldImgTags = images.filter(img => img.type === 'img' && img.isAboveFold);
  const aboveFoldWithoutPriority = aboveFoldImgTags.filter(img => img.fetchPriority !== 'high').length;

  if (aboveFoldWithoutPriority > 0 && aboveFoldImages > 0) {
    issues.push(`${aboveFoldWithoutPriority} above-fold images missing fetchpriority="high"`);
  }

  // Generate recommendations using the new system
  const ctx: RecommendationContext = {
    totalImages: images.length,
    imagesWithoutAlt: missingAltCount,
    oversizedImages: oversizedCount - unknownSizeCount,
    nonModernFormatCount: legacyCount,
    imageFormats: Object.keys(formatBreakdown),
  };
  const generatedRecs = getImageRecommendations(ctx);
  recommendations.push(...generatedRecs.legacyStrings);
  
  // Calculate weighted score with new responsive metrics
  const formatScore = (modernFormats / images.length) * 25; // Reduced from 40%
  const altTextScore = (withAltText / images.length) * 20; // Reduced from 35%
  const sizingScore = (appropriatelySized / images.length) * 15; // Reduced from 25%
  
  // New responsive scoring (for img tags only)
  let responsiveScore = 0;
  let loadingScore = 0;
  let performanceScore = 0;
  
  if (imgTagsCount > 0) {
    responsiveScore = (responsiveImages / imgTagsCount) * 20; // 20% weight for responsive
    loadingScore = (properlyLoadedImages / imgTagsCount) * 10; // 10% weight for loading
    performanceScore = (placeholderUsage / imgTagsCount) * 10; // 10% weight for performance features
  }
  
  const score = Math.round(formatScore + altTextScore + sizingScore + responsiveScore + loadingScore + performanceScore);
  
  console.log(`📊 Scoring breakdown:`);
  console.log(`   Format: ${modernFormats}/${images.length} = ${formatScore.toFixed(1)} points`);
  console.log(`   Alt text: ${withAltText}/${images.length} = ${altTextScore.toFixed(1)} points`);
  console.log(`   Sizing: ${appropriatelySized}/${images.length} = ${sizingScore.toFixed(1)} points`);
  if (imgTagsCount > 0) {
    console.log(`   Responsive: ${responsiveImages}/${imgTagsCount} = ${responsiveScore.toFixed(1)} points`);
    console.log(`   Loading: ${properlyLoadedImages}/${imgTagsCount} = ${loadingScore.toFixed(1)} points`);
    console.log(`   Performance: ${placeholderUsage}/${imgTagsCount} = ${performanceScore.toFixed(1)} points`);
  }
  
  return {
    score,
    status: 'analyzed',
    totalImages: images.length,
    modernFormats,
    withAltText,
    appropriatelySized,
    responsiveImages,
    properlyLoadedImages,
    aboveFoldImages,
    issues,
    recommendations,
    details: {
      formatBreakdown,
      avgImageSize: images.length > 0 ? {
        width: Math.round(totalWidth / images.length),
        height: Math.round(totalHeight / images.length)
      } : null,
      largestImage,
      loadingStrategies,
      fetchPriorityUsage,
      placeholderUsage
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
