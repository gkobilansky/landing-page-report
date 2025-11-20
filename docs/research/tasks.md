# Module Enhancement Tasks

This document breaks down the module analysis improvements into actionable tasks for implementation. Each task follows the TDD approach outlined in CLAUDE.md.

## Executive Summary

This task list is derived from a comprehensive analysis of the Landing Page Report codebase, identifying areas where the current implementation uses naive logic, hardcoded values, or lacks nuance. The analysis revealed several patterns across all modules:

### Key Issues Identified:
1. **Hardcoded Thresholds**: Fixed values that don't adapt to context (e.g., 2000px max image size, 240 pixel threshold for whitespace)
2. **English-Only Bias**: CTA detection and social proof analysis only work for English content
3. **Single Viewport Analysis**: Most modules only analyze desktop view, missing mobile-specific issues
4. **Lack of Context Awareness**: Same scoring for all industries, page types, and cultural contexts
5. **Missing Modern Web Features**: No detection of lazy loading, srcset, variable fonts, etc.
6. **Over-Simplified Scoring**: Binary pass/fail instead of nuanced evaluation

### Core Improvements to Implement:
1. **Dynamic Thresholds**: Replace hardcoded values with context-aware calculations
2. **Multi-Language Support**: Add i18n capabilities to text-based analysis
3. **Responsive Analysis**: Test across multiple viewports (mobile, tablet, desktop)
4. **Industry & Cultural Adaptation**: Adjust expectations based on detected context
5. **Confidence Scoring**: Add certainty levels to all analyses
6. **Modern Web Standards**: Detect and reward current best practices

### Implementation Approach:
- Follow TDD methodology (write tests first)
- Maintain backwards compatibility
- Add new features progressively
- Document all changes
- Benchmark performance impact

## General Guidelines for Implementation

1. **Test-Driven Development**: Write tests first, then implement
2. **Documentation**: Update relevant docs after completing each task
3. **Backwards Compatibility**: Maintain existing API contracts while adding new features
4. **Progressive Enhancement**: Add new capabilities without breaking existing functionality

## 1. Font Analysis Module Tasks

### Task 1.1: Modernize Font Detection System
**Priority**: High  
**Files**: `src/lib/font-analysis.ts`

#### Subtasks:
1. **Update system font list** (Lines 100-109)
   - Add modern system fonts: Inter, Segoe UI, SF Pro, Roboto, Ubuntu
   - Create comprehensive font category mappings
   - Test with modern websites using these fonts

2. **Implement variable font detection**
   - Detect `@supports (font-variation-settings: normal)` usage
   - Check for fonts with variation axes (weight, width, slant)
   - Add `variableFonts` array to FontAnalysisResult interface
   - Award bonus points for variable font usage

3. **Add font loading strategy detection**
   - Check for `font-display` CSS property values
   - Detect `<link rel="preload" as="font">` in HTML
   - Track loading strategies per font family
   - Add recommendations for missing strategies

**Expected Output**:
```typescript
interface EnhancedFontAnalysisResult extends FontAnalysisResult {
  variableFonts: string[]
  fontLoadingStrategies: Record<string, string>
  totalFontWeight: number // KB
  subsettingDetected: boolean
  performanceImpact: {
    estimatedLoadTime: number
    renderBlockingFonts: number
    criticalFonts: string[]
  }
}
```

**Tests Required**:
- Test variable font detection
- Test font-display strategy detection
- Test performance impact calculations
- Test with real-world sites (Inter, Google Fonts, self-hosted)

#### Scoring Updates:
```typescript
function calculateEnhancedFontScore(analysis: EnhancedFontAnalysisResult): number {
  let score = 100
  
  // Base penalties (keeping existing logic)
  if (analysis.systemFontCount > 3) {
    score -= (analysis.systemFontCount - 3) * 5
  }
  if (analysis.webFontCount > 2) {
    score -= (analysis.webFontCount - 2) * 15
  } else if (analysis.webFontCount === 2) {
    score -= 5
  }
  
  // NEW: Variable font bonus (up to +10)
  if (analysis.variableFonts.length > 0) {
    score += Math.min(10, analysis.variableFonts.length * 5)
  }
  
  // NEW: Font loading strategy bonus/penalty
  const fontsWithStrategy = Object.values(analysis.fontLoadingStrategies).filter(Boolean).length
  const strategyScore = (fontsWithStrategy / analysis.webFontCount) * 10
  score += strategyScore - 5 // -5 to +5 points
  
  // NEW: Performance impact penalty (up to -20)
  if (analysis.performanceImpact.renderBlockingFonts > 0) {
    score -= Math.min(20, analysis.performanceImpact.renderBlockingFonts * 5)
  }
  
  // NEW: Font subsetting bonus (+5)
  if (analysis.subsettingDetected) {
    score += 5
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

### Task 1.2: Implement Context-Aware Scoring
**Priority**: Medium  
**Files**: `src/lib/font-analysis.ts`, `src/lib/page-metadata.ts`

#### Subtasks:
1. **Detect and reward optimization techniques**
   - Font subsetting detection (unicode-range)
   - WOFF2 format usage
   - Critical font identification (above-fold usage)
   - Self-hosted vs CDN analysis

**Tests Required**:
- Test optimization technique detection

#### Scoring Updates:
```typescript
interface FontOptimizationContext {
  pageType: 'blog' | 'ecommerce' | 'saas' | 'portfolio' | 'other'
  isTextHeavy: boolean
  hasHeroText: boolean
  culturalContext: string // locale
}

function calculateContextAwareFontScore(
  analysis: EnhancedFontAnalysisResult,
  context: FontOptimizationContext
): number {
  let score = calculateEnhancedFontScore(analysis)
  
  // Adjust thresholds based on page type
  const fontLimits = {
    blog: { system: 4, web: 3 }, // More lenient for blogs
    ecommerce: { system: 3, web: 2 }, // Stricter for performance
    saas: { system: 3, web: 2 },
    portfolio: { system: 4, web: 4 }, // Design-focused, more lenient
    other: { system: 3, web: 2 }
  }
  
  const limits = fontLimits[context.pageType]
  
  // Recalculate penalties with context-aware limits
  // ... (adjust the base penalty calculation)
  
  // Cultural adjustments
  if (['ja', 'zh', 'ko'].includes(context.culturalContext)) {
    // CJK fonts are larger, adjust penalties
    score += 5 // Slight bonus for dealing with complex typography
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

## 2. Image Optimization Module Tasks

### Task 2.1: Fix "No Images" Logic and Add N/A Support
**Priority**: High  
**Files**: `src/lib/image-optimization.ts`

#### Subtasks:
1. **Replace perfect score with N/A** (Lines 107-123)
   ```typescript
   if (images.length === 0) {
     return {
       score: null, // Not 100
       status: 'not_applicable',
       message: 'No images found to analyze',
       recommendations: ['Consider adding relevant images if appropriate for your content']
     }
   }
   ```

2. **Add CSS background image detection**
   - Scan for `background-image` CSS properties
   - Extract URLs from `url()` values
   - Include in analysis if images found

**Tests Required**:
- Test N/A status for pages without images
- Test CSS background image detection
- Test mixed content (img tags + CSS backgrounds)

#### Scoring Updates:
```typescript
interface ImageOptimizationResultV2 {
  score: number | null
  status: 'analyzed' | 'not_applicable' | 'error'
  // ... rest of interface
}

// When calculating overall page score:
function calculateOverallScore(moduleScores: ModuleScore[]): number {
  const applicableScores = moduleScores.filter(m => m.score !== null)
  if (applicableScores.length === 0) return 0
  
  // Weight redistribution when modules are N/A
  const totalWeight = applicableScores.reduce((sum, m) => sum + m.weight, 0)
  const normalizedScores = applicableScores.map(m => ({
    ...m,
    weight: (m.weight / totalWeight) * 100
  }))
  
  return normalizedScores.reduce((sum, m) => sum + (m.score * m.weight / 100), 0)
}
```

### Task 2.2: Implement Responsive Image Analysis
**Priority**: High  
**Files**: `src/lib/image-optimization.ts`

#### Subtasks:
1. **Add modern attribute detection**
   ```typescript
   interface EnhancedImageData extends ImageData {
     hasLazyLoading: boolean // loading="lazy"
     hasSrcset: boolean
     hasSizesAttribute: boolean
     loadingPriority: 'eager' | 'lazy' | 'auto'
     isAboveFold: boolean
     hasBlurPlaceholder: boolean
   }
   ```

2. **Calculate wasted bytes**
   - Compare intrinsic size vs display size
   - Factor in device pixel ratio
   - Calculate potential savings

3. **Context-aware size thresholds**
   - Above-fold: viewport.width * devicePixelRatio
   - Below-fold: Math.min(1200, viewport.width)
   - Hero images: allow larger sizes
   - Thumbnails: stricter limits

**Tests Required**:
- Test srcset/sizes detection
- Test lazy loading detection
- Test wasted bytes calculation
- Test viewport-aware sizing

#### Scoring Updates:
```typescript
function calculateResponsiveImageScore(images: EnhancedImageData[]): number {
  const weights = {
    format: 0.25,      // Reduced from 0.40
    altText: 0.20,     // Reduced from 0.35
    sizing: 0.15,      // Reduced from 0.25
    // NEW weights:
    responsiveness: 0.20,
    loading: 0.10,
    performance: 0.10
  }
  
  // Format scoring (existing but adjusted weight)
  const formatScore = (images.filter(img => isModernFormat(img)).length / images.length) * weights.format * 100
  
  // Alt text scoring (existing but adjusted weight)
  const altTextScore = (images.filter(img => img.hasAltText).length / images.length) * weights.altText * 100
  
  // NEW: Responsive image scoring
  const responsiveImages = images.filter(img => img.hasSrcset && img.hasSizesAttribute)
  const responsiveScore = (responsiveImages.length / images.length) * weights.responsiveness * 100
  
  // NEW: Loading optimization scoring
  const properlyLoadedImages = images.filter(img => 
    (img.isAboveFold && img.loadingPriority === 'eager') ||
    (!img.isAboveFold && img.hasLazyLoading)
  )
  const loadingScore = (properlyLoadedImages.length / images.length) * weights.loading * 100
  
  // NEW: Performance scoring (based on wasted bytes)
  const performanceScore = calculatePerformanceScore(images) * weights.performance
  
  // Enhanced sizing score with context
  const sizingScore = calculateContextAwareSizingScore(images) * weights.sizing
  
  return Math.round(formatScore + altTextScore + sizingScore + responsiveScore + loadingScore + performanceScore)
}

function calculateContextAwareSizingScore(images: EnhancedImageData[]): number {
  let appropriatelySized = 0
  
  images.forEach(img => {
    const maxWidth = img.isAboveFold 
      ? window.innerWidth * window.devicePixelRatio
      : Math.min(1200, window.innerWidth)
    
    // Allow hero images to be larger
    const isHero = img.width > window.innerWidth * 0.8 && img.isAboveFold
    const threshold = isHero ? maxWidth * 1.5 : maxWidth
    
    if (img.width <= threshold && img.height <= threshold) {
      appropriatelySized++
    }
  })
  
  return (appropriatelySized / images.length) * 100
}
```

### Task 2.3: Add LCP Image Detection
**Priority**: Medium  
**Files**: `src/lib/image-optimization.ts`, `src/lib/page-speed-puppeteer.ts`

#### Subtasks:
1. **Identify LCP element**
   - Use Performance Observer API
   - Check if LCP element is an image
   - Special scoring for LCP image optimization

2. **Add fetchpriority detection**
   - Check for `fetchpriority="high"` on LCP images
   - Recommend if missing on critical images

#### Scoring Updates:
```typescript
interface LCPImageScoring {
  isLCPOptimized: boolean
  lcpImageScore: number
}

function calculateLCPImageScore(images: EnhancedImageData[], lcpElement: Element | null): LCPImageScoring {
  if (!lcpElement || lcpElement.tagName !== 'IMG') {
    return { isLCPOptimized: true, lcpImageScore: 100 }
  }
  
  const lcpImage = images.find(img => img.src === lcpElement.getAttribute('src'))
  if (!lcpImage) return { isLCPOptimized: false, lcpImageScore: 50 }
  
  let score = 100
  
  // Critical checks for LCP image
  if (!lcpImage.hasAttribute('fetchpriority') || lcpImage.getAttribute('fetchpriority') !== 'high') {
    score -= 20 // Missing priority hint
  }
  
  if (lcpImage.loadingPriority === 'lazy') {
    score -= 30 // LCP should never be lazy loaded
  }
  
  if (!isModernFormat(lcpImage)) {
    score -= 25 // LCP image should use modern format
  }
  
  if (!lcpImage.hasSrcset) {
    score -= 15 // LCP should be responsive
  }
  
  return { isLCPOptimized: score >= 70, lcpImageScore: score }
}

// Integrate into main scoring
function calculateFinalImageScore(images: EnhancedImageData[], lcpData: LCPImageScoring): number {
  const baseScore = calculateResponsiveImageScore(images)
  
  // LCP optimization affects up to 15% of total score
  const lcpWeight = 0.15
  const lcpAdjustment = (lcpData.lcpImageScore / 100) * lcpWeight
  
  return Math.round(baseScore * (1 - lcpWeight) + baseScore * lcpAdjustment)
}
```

## 3. Whitespace Assessment Module Tasks

### Task 3.1: Implement Adaptive Threshold System
**Priority**: High  
**Files**: `src/lib/whitespace-assessment.ts`

#### Subtasks:
1. **Replace fixed threshold (Line 74)** with dynamic calculation
   ```typescript
   async function calculateAdaptiveThreshold(page: Page): Promise<number> {
     // Sample background colors across viewport
     // Calculate average luminance
     // Return appropriate threshold for light/dark themes
   }
   ```

2. **Add theme detection**
   - Detect dark mode via CSS media queries
   - Sample dominant background colors
   - Adjust pixel threshold accordingly

**Tests Required**:
- Test with light theme sites (threshold ~240)
- Test with dark theme sites (threshold ~100)
- Test with mixed/gradient backgrounds

#### Scoring Updates:
```typescript
interface AdaptiveWhitespaceMetrics extends WhitespaceMetrics {
  theme: 'light' | 'dark' | 'mixed'
  adaptiveThreshold: number
  contrastRatio: number
}

function calculateAdaptiveWhitespaceScore(metrics: AdaptiveWhitespaceMetrics): number {
  let score = 100
  let clutterScore = 0
  
  // Adaptive whitespace ratio thresholds based on theme
  const thresholds = {
    light: { very: 0.25, cluttered: 0.35, somewhat: 0.45, slightly: 0.55 },
    dark: { very: 0.20, cluttered: 0.30, somewhat: 0.40, slightly: 0.50 }, // Tighter for dark themes
    mixed: { very: 0.23, cluttered: 0.33, somewhat: 0.43, slightly: 0.53 }
  }
  
  const t = thresholds[metrics.theme]
  
  // Dynamic cluttering scoring
  if (metrics.whitespaceRatio < t.very) clutterScore += 60
  else if (metrics.whitespaceRatio < t.cluttered) clutterScore += 40
  else if (metrics.whitespaceRatio < t.somewhat) clutterScore += 20
  else if (metrics.whitespaceRatio < t.slightly) clutterScore += 5
  
  // Rest of scoring logic...
  score -= clutterScore
  
  // Bonus for appropriate contrast
  if (metrics.contrastRatio >= 7) score += 5 // WCAG AAA
  else if (metrics.contrastRatio >= 4.5) score += 3 // WCAG AA
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

### Task 3.2: Replace Pixel-Based with Relative Spacing
**Priority**: High  
**Files**: `src/lib/whitespace-assessment.ts`

#### Subtasks:
1. **Convert hardcoded pixel values to relative units** (Lines 369-384)
   ```typescript
   interface RelativeSpacingRequirements {
     headlineSpacing: { top: number, bottom: number } // in em
     ctaSpacing: { all: number } // in em
     contentBlockSpacing: number // in em
     lineHeight: number // unitless
   }
   ```

2. **Detect design system patterns**
   - Identify 8px grid usage
   - Detect golden ratio spacing
   - Recognize common frameworks (Material, Bootstrap)

3. **Add cultural density preferences**
   - Detect page language/locale
   - Apply density multipliers
   - Asian markets: 0.8x spacing
   - Western markets: 1.0x spacing

**Tests Required**:
- Test em-based calculations
- Test design system detection
- Test cultural adaptations

#### Scoring Updates:
```typescript
interface CulturalSpacingContext {
  locale: string
  designSystem: 'material' | 'bootstrap' | 'tailwind' | 'custom' | null
  gridUnit: number // Detected base unit (e.g., 8px)
  densityPreference: number // Multiplier: 0.8 for dense, 1.0 for normal, 1.2 for airy
}

function calculateRelativeSpacingScore(
  spacing: RelativeSpacingAnalysis,
  context: CulturalSpacingContext
): number {
  let score = 100
  
  // Adjust requirements based on cultural context
  const baseRequirements = {
    headlineSpacing: { top: 2.5, bottom: 1.5 }, // em
    ctaSpacing: 2.0, // em
    contentBlockSpacing: 1.5, // em
    lineHeight: 1.6
  }
  
  // Apply cultural density preference
  const adjusted = {
    headlineSpacing: {
      top: baseRequirements.headlineSpacing.top * context.densityPreference,
      bottom: baseRequirements.headlineSpacing.bottom * context.densityPreference
    },
    ctaSpacing: baseRequirements.ctaSpacing * context.densityPreference,
    contentBlockSpacing: baseRequirements.contentBlockSpacing * context.densityPreference,
    lineHeight: baseRequirements.lineHeight // Line height doesn't change with density
  }
  
  // Score based on meeting adjusted requirements
  if (spacing.headlineSpacing.top < adjusted.headlineSpacing.top * 0.7) score -= 10
  if (spacing.headlineSpacing.bottom < adjusted.headlineSpacing.bottom * 0.7) score -= 10
  if (spacing.ctaSpacing < adjusted.ctaSpacing * 0.7) score -= 15
  if (spacing.contentBlockSpacing < adjusted.contentBlockSpacing * 0.7) score -= 15
  if (spacing.lineHeight < adjusted.lineHeight * 0.9) score -= 10
  
  // Bonus for consistent grid usage
  if (context.gridUnit && spacing.usesConsistentGrid) {
    score += 10
  }
  
  // Design system compliance bonus
  if (context.designSystem && spacing.followsDesignSystem) {
    score += 5
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

### Task 3.3: Improve Visual Hierarchy Analysis
**Priority**: Medium  
**Files**: `src/lib/whitespace-assessment.ts`

#### Subtasks:
1. **Differentiate productive density vs clutter**
   - Analyze element importance (headings vs decorative)
   - Check for clear visual hierarchy
   - Evaluate information grouping

2. **Add F-pattern and Z-pattern detection**
   - Analyze element positioning
   - Check for pattern compliance
   - Score based on readability patterns

#### Scoring Updates:
```typescript
interface VisualHierarchyMetrics {
  hasCleanHierarchy: boolean
  followsReadingPattern: 'f-pattern' | 'z-pattern' | 'none'
  informationGrouping: number // 0-100 score
  visualNoise: number // 0-100, lower is better
}

function calculateHierarchyAdjustedScore(
  baseScore: number,
  hierarchyMetrics: VisualHierarchyMetrics
): number {
  let score = baseScore
  
  // Productive density bonus (up to +15)
  if (hierarchyMetrics.hasCleanHierarchy && hierarchyMetrics.visualNoise < 30) {
    score += 15 // Dense but well-organized
  } else if (hierarchyMetrics.visualNoise > 70) {
    score -= 20 // Cluttered without purpose
  }
  
  // Reading pattern compliance (up to +10)
  if (hierarchyMetrics.followsReadingPattern !== 'none') {
    score += 10
  }
  
  // Information grouping bonus
  score += (hierarchyMetrics.informationGrouping / 100) * 10
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

## 4. CTA Analysis Module Tasks

### Task 4.1: Add Multi-Language Support
**Priority**: High  
**Files**: `src/lib/cta-analysis.ts`, `src/lib/cta-dictionary.ts`

#### Subtasks:
1. **Create language detection system**
   ```typescript
   interface I18nCTADictionary {
     [language: string]: {
       strongActionWords: string[]
       weakActionWords: string[]
       urgencyWords: string[]
       // ... other categories
     }
   }
   ```

2. **Add language-specific dictionaries**
   - Start with: Spanish, German, French, Japanese, Chinese
   - Include cultural context (directness preferences)
   - Account for character-based languages

3. **Implement context-aware word detection**
   - "Get updates" (weak) vs "Get started" (strong)
   - Industry-specific variations
   - Compound word handling

**Tests Required**:
- Test each language dictionary
- Test context disambiguation
- Test with multilingual sites

#### Scoring Updates:
```typescript
interface MultilingualCTAScoring {
  detectedLanguage: string
  languageConfidence: number
  culturalAppropriateness: number
}

function calculateMultilingualCTAScore(
  ctas: CTAElement[],
  multilingualData: MultilingualCTAScoring
): number {
  let score = calculateBaseCTAScore(ctas)
  
  // Confidence penalty for uncertain language detection
  if (multilingualData.languageConfidence < 0.8) {
    score *= multilingualData.languageConfidence // Reduce score proportionally
  }
  
  // Cultural appropriateness adjustments
  const culturalMultiplier = multilingualData.culturalAppropriateness / 100
  score = score * (0.7 + 0.3 * culturalMultiplier) // Cultural factor affects up to 30%
  
  // Specific cultural adjustments
  if (['ja', 'ko'].includes(multilingualData.detectedLanguage)) {
    // More formal cultures might have subtler CTAs
    if (ctas.some(cta => cta.isTooAggressive)) {
      score -= 10
    }
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

### Task 4.2: Implement Multi-Viewport Analysis
**Priority**: High  
**Files**: `src/lib/cta-analysis.ts`

#### Subtasks:
1. **Add viewport configurations**
   ```typescript
   const VIEWPORT_CONFIGS = {
     mobile: { width: 375, height: 667, scaleFactor: 1 },
     tablet: { width: 768, height: 1024, scaleFactor: 1 },
     desktop: { width: 1920, height: 1080, scaleFactor: 1 }
   }
   ```

2. **Implement parallel viewport analysis**
   - Run analysis for all viewports
   - Synthesize results
   - Track viewport-specific CTAs

3. **Add touch target validation**
   - Minimum 44x44px for mobile
   - Check spacing between targets
   - Validate thumb reachability

**Tests Required**:
- Test viewport-specific CTA detection
- Test touch target sizing
- Test result synthesis

#### Scoring Updates:
```typescript
interface ViewportCTAResults {
  mobile: CTAAnalysisResult
  tablet: CTAAnalysisResult
  desktop: CTAAnalysisResult
}

function calculateResponsiveCTAScore(viewportResults: ViewportCTAResults): number {
  // Weight viewports by importance
  const weights = {
    mobile: 0.5,   // 50% - mobile-first
    desktop: 0.35, // 35%
    tablet: 0.15   // 15%
  }
  
  let weightedScore = 0
  let severeIssues = 0
  
  // Calculate weighted average
  Object.entries(viewportResults).forEach(([viewport, result]) => {
    weightedScore += result.score * weights[viewport]
    
    // Additional penalties for mobile-specific issues
    if (viewport === 'mobile') {
      const mobileCTAs = result.ctas
      
      // Touch target violations
      const smallTargets = mobileCTAs.filter(cta => 
        cta.position.width < 44 || cta.position.height < 44
      )
      if (smallTargets.length > 0) {
        severeIssues += 15 * (smallTargets.length / mobileCTAs.length)
      }
      
      // Spacing violations (targets too close)
      const spacingViolations = checkTouchTargetSpacing(mobileCTAs)
      if (spacingViolations > 0) {
        severeIssues += 10 * (spacingViolations / mobileCTAs.length)
      }
      
      // Thumb unreachable (top of screen on mobile)
      const unreachable = mobileCTAs.filter(cta => 
        cta.position.top < 100 && cta.isPrimary
      )
      if (unreachable.length > 0) {
        severeIssues += 10
      }
    }
  })
  
  return Math.max(0, Math.min(100, Math.round(weightedScore - severeIssues)))
}
```

### Task 4.3: Add Visual CTA Detection
**Priority**: Medium  
**Files**: `src/lib/cta-analysis.ts`

#### Subtasks:
1. **Detect icon-only buttons**
   - Find buttons with SVG/icon fonts
   - Check for aria-labels
   - Infer purpose from icon type

2. **Implement Fitts's Law scoring**
   - Calculate target size and distance
   - Score clickability
   - Consider viewport center as optimal position

3. **Add micro-interaction detection**
   - Hover state changes
   - Animation presence
   - Loading state indicators

#### Scoring Updates:
```typescript
interface VisualCTAMetrics {
  hasIconCTAs: boolean
  iconAccessibility: number // 0-100
  fittsLawScore: number // 0-100
  hasMicroInteractions: boolean
  visualProminence: number // 0-100
}

function calculateVisualCTAScore(
  ctas: CTAElement[],
  visualMetrics: VisualCTAMetrics
): number {
  let score = calculateBaseCTAScore(ctas)
  
  // Icon-only CTA handling
  if (visualMetrics.hasIconCTAs) {
    // Penalize if accessibility is poor
    if (visualMetrics.iconAccessibility < 50) {
      score -= 20
    } else if (visualMetrics.iconAccessibility > 80) {
      score += 5 // Bonus for well-implemented icon CTAs
    }
  }
  
  // Fitts's Law bonus/penalty (up to ±15 points)
  const fittsAdjustment = (visualMetrics.fittsLawScore - 50) * 0.3
  score += fittsAdjustment
  
  // Micro-interactions bonus
  if (visualMetrics.hasMicroInteractions) {
    score += 5
  }
  
  // Visual prominence affects primary CTA effectiveness
  const primaryCTA = ctas.find(cta => cta.isPrimary)
  if (primaryCTA && visualMetrics.visualProminence < 60) {
    score -= 15 // Primary CTA not prominent enough
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

## 5. Social Proof Module Tasks

### Task 5.1: Implement Authenticity Scoring
**Priority**: High  
**Files**: `src/lib/social-proof-analysis.ts`

#### Subtasks:
1. **Add fake content detection**
   ```typescript
   const FAKE_INDICATORS = {
     genericNames: ['John Doe', 'Jane Smith', 'Test User'],
     stockPhotoPhrases: ['happy customer', 'satisfied client'],
     overlyGenericTestimonials: ['great product', 'highly recommend']
   }
   ```

2. **Implement specificity scoring**
   - Check for metrics (percentages, ROI, time saved)
   - Detect feature mentions
   - Validate company names against known entities

3. **Add recency analysis**
   - Parse dates from testimonials
   - Penalize old content (>1 year)
   - Bonus for fresh content (<30 days)

**Tests Required**:
- Test fake content detection
- Test specificity scoring
- Test date parsing and recency

#### Scoring Updates:
```typescript
interface AuthenticityMetrics {
  averageSpecificity: number // 0-100
  suspiciousElements: number
  recencyScore: number // 0-100
  verifiedElements: number
}

function calculateAuthenticSocialProofScore(
  elements: SocialProofElement[],
  authenticity: AuthenticityMetrics
): number {
  let score = 100
  
  // Base scoring (existing logic)
  if (elements.length === 0) return 0
  
  // Authenticity-based adjustments
  
  // Heavy penalty for suspicious content
  if (authenticity.suspiciousElements > 0) {
    const suspiciousRatio = authenticity.suspiciousElements / elements.length
    score -= Math.min(40, suspiciousRatio * 100) // Up to -40 points
  }
  
  // Specificity bonus/penalty
  if (authenticity.averageSpecificity < 30) {
    score -= 20 // Too generic
  } else if (authenticity.averageSpecificity > 70) {
    score += 10 // Very specific, credible
  }
  
  // Recency factor
  if (authenticity.recencyScore < 30) {
    score -= 15 // Outdated social proof
  } else if (authenticity.recencyScore > 80) {
    score += 5 // Fresh content bonus
  }
  
  // Verification bonus
  const verificationRatio = authenticity.verifiedElements / elements.length
  score += Math.min(15, verificationRatio * 30) // Up to +15 for verified content
  
  // Continue with existing diversity and placement scoring...
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

### Task 5.2: Add Modern Social Proof Detection
**Priority**: Medium  
**Files**: `src/lib/social-proof-analysis.ts`

#### Subtasks:
1. **Detect embedded social content**
   ```typescript
   const MODERN_SOCIAL_SELECTORS = {
     twitterEmbed: '[class*="twitter-tweet"]',
     instagramEmbed: '[class*="instagram-embed"]',
     videoTestimonial: '[data-testimonial-video]',
     reviewWidgets: '[class*="trustpilot"], [class*="g2crowd"]',
     liveMetrics: '[data-customer-count]'
   }
   ```

2. **Add verification badge detection**
   - Blue checkmarks
   - Verified purchase badges
   - Platform verification

3. **Implement industry-specific expectations**
   - B2B SaaS: case studies, ROI metrics
   - E-commerce: product reviews, user photos
   - Healthcare: certifications, credentials

**Tests Required**:
- Test modern format detection
- Test verification detection
- Test industry-specific scoring

#### Scoring Updates:
```typescript
interface ModernSocialProofMetrics {
  hasEmbeddedSocial: boolean
  hasVideoTestimonials: boolean
  hasLiveMetrics: boolean
  platformIntegrations: string[]
  industryAlignment: number // 0-100
}

function calculateModernSocialProofScore(
  elements: SocialProofElement[],
  modernMetrics: ModernSocialProofMetrics,
  industry: string
): number {
  let score = calculateAuthenticSocialProofScore(elements, authenticity)
  
  // Modern format bonuses
  if (modernMetrics.hasVideoTestimonials) {
    score += 10 // Video testimonials are highly effective
  }
  
  if (modernMetrics.hasLiveMetrics) {
    score += 8 // Dynamic/live social proof
  }
  
  if (modernMetrics.hasEmbeddedSocial) {
    score += 5 // Real social media integration
  }
  
  // Platform integration bonus (up to +10)
  const platformBonus = Math.min(10, modernMetrics.platformIntegrations.length * 3)
  score += platformBonus
  
  // Industry-specific scoring
  const industryExpectations = {
    'b2b-saas': ['case-study', 'roi-metrics', 'integration-logos'],
    'ecommerce': ['product-reviews', 'user-photos', 'ratings'],
    'healthcare': ['certifications', 'credentials', 'compliance'],
    'education': ['student-testimonials', 'success-rates', 'accreditation']
  }
  
  // Penalty if missing expected social proof types for industry
  if (industryExpectations[industry]) {
    const expected = industryExpectations[industry]
    const missing = expected.filter(type => 
      !elements.some(el => el.type.includes(type))
    )
    score -= missing.length * 5
  }
  
  // Industry alignment bonus
  score += (modernMetrics.industryAlignment / 100) * 10
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

## 6. Page Speed Module Tasks

### Task 6.1: Integrate Real-World Performance Data
**Priority**: High  
**Files**: `src/lib/page-speed-analysis.ts`

  #### Subtasks:
  1. **Add CrUX API integration**
     ```typescript
     async function fetchCrUXData(url: string): Promise<CrUXMetrics> {
       // Fetch Chrome UX Report data
       // Return p75 metrics for origin
       // Handle API errors gracefully
     }
     ```

  2. **Implement percentile-based scoring**
     - Compare against real-world data
     - Industry-specific benchmarks
     - Device-type considerations

  3. **Add field data vs lab data comparison**
     - Show both when available
     - Explain differences
     - Recommend based on gaps

  **Tests Required**:
  - Test CrUX API integration
  - Test percentile calculations
  - Test fallback handling

#### Scoring Updates:
```typescript
interface RealWorldPerformanceContext {
  cruxData?: {
    lcp_p75: number
    fcp_p75: number
    cls_p75: number
    inp_p75: number
  }
  industryBenchmarks: {
    lcp: { good: number, needs_improvement: number }
    fcp: { good: number, needs_improvement: number }
    cls: { good: number, needs_improvement: number }
  }
  deviceType: 'mobile' | 'desktop'
}

function calculateRealWorldAdjustedScore(
  labMetrics: PageSpeedMetrics,
  context: RealWorldPerformanceContext
): number {
  let score = 100
  
  // Use percentile-based scoring when CrUX data available
  if (context.cruxData) {
    // Compare lab vs field data
    const lcpDelta = Math.abs(labMetrics.lcp - context.cruxData.lcp_p75)
    const fcpDelta = Math.abs(labMetrics.fcp - context.cruxData.fcp_p75)
    
    // If lab data is significantly better than field, there might be issues
    if (labMetrics.lcp < context.cruxData.lcp_p75 * 0.5) {
      // Lab is too optimistic, adjust score down
      score -= 10
    }
  }
  
  // Industry-adjusted thresholds
  const benchmarks = context.industryBenchmarks
  
  // LCP scoring with industry context (25% weight)
  if (labMetrics.lcp > benchmarks.lcp.needs_improvement) {
    score -= 25
  } else if (labMetrics.lcp > benchmarks.lcp.good) {
    score -= 15
  } else {
    score += 5 // Bonus for excellent LCP
  }
  
  // Similar adjustments for other metrics...
  
  // Device-specific adjustments
  if (context.deviceType === 'mobile') {
    // Mobile users have less patience
    if (labMetrics.lcp > 3000) score -= 10 // Additional penalty
    if (labMetrics.tbt > 300) score -= 10 // Mobile interactivity crucial
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

  ### Task 6.2: Add Detailed Performance Diagnostics
  **Priority**: Medium  
  **Files**: `src/lib/page-speed-analysis.ts`, `src/lib/page-speed-puppeteer.ts`

  #### Subtasks:
  1. **Expand metrics collection**
     - Time to Interactive (TTI)
     - Total Blocking Time (TBT)
     - First Input Delay (FID)
     - Interaction to Next Paint (INP)

  2. **Add resource breakdown**
     ```typescript
     interface ResourceBreakdown {
       javascript: { count: number; size: number; blockingTime: number }
       css: { count: number; size: number; renderBlocking: boolean }
       images: { count: number; size: number; lcpImpact: boolean }
       fonts: { count: number; size: number; blockingTime: number }
       thirdParty: { domains: string[]; totalSize: number }
     }
     ```

  3. **Generate specific optimization opportunities**
     - Identify render-blocking resources
     - Calculate potential savings
     - Prioritize by impact

  **Tests Required**:
  - Test expanded metrics collection
  - Test resource categorization
  - Test opportunity identification

#### Scoring Updates:
```typescript
interface DetailedPerformanceScoring {
  coreWebVitals: number      // 40% - LCP, FID/INP, CLS
  loadPerformance: number    // 20% - FCP, TTI
  resourceOptimization: number // 20% - Size, count, optimization
  thirdPartyImpact: number   // 10% - Third-party overhead
  bestPractices: number      // 10% - HTTP/2, compression, caching
}

function calculateDetailedPerformanceScore(
  metrics: ExtendedPageSpeedMetrics,
  breakdown: ResourceBreakdown
): DetailedPerformanceScoring {
  // Core Web Vitals (40% of total)
  let cwvScore = 100
  
  // LCP (40% of CWV)
  if (metrics.lcp > 4000) cwvScore -= 16
  else if (metrics.lcp > 2500) cwvScore -= 10
  else if (metrics.lcp > 1500) cwvScore -= 4
  
  // INP/FID (30% of CWV)
  if (metrics.inp > 500) cwvScore -= 12
  else if (metrics.inp > 200) cwvScore -= 7
  else if (metrics.inp > 100) cwvScore -= 3
  
  // CLS (30% of CWV)
  if (metrics.cls > 0.25) cwvScore -= 12
  else if (metrics.cls > 0.1) cwvScore -= 7
  else if (metrics.cls > 0.05) cwvScore -= 3
  
  // Resource optimization (20% of total)
  let resourceScore = 100
  
  // JavaScript impact
  if (breakdown.javascript.blockingTime > 500) resourceScore -= 30
  else if (breakdown.javascript.blockingTime > 250) resourceScore -= 15
  
  // Render-blocking CSS
  if (breakdown.css.renderBlocking) resourceScore -= 20
  
  // Image optimization (check if LCP element)
  if (breakdown.images.lcpImpact && !breakdown.images.optimized) {
    resourceScore -= 25
  }
  
  // Third-party impact (10% of total)
  let thirdPartyScore = 100
  const thirdPartyRatio = breakdown.thirdParty.totalSize / metrics.totalSize
  if (thirdPartyRatio > 0.5) thirdPartyScore = 40
  else if (thirdPartyRatio > 0.3) thirdPartyScore = 70
  else if (thirdPartyRatio > 0.1) thirdPartyScore = 90
  
  return {
    coreWebVitals: cwvScore,
    loadPerformance: calculateLoadScore(metrics),
    resourceOptimization: resourceScore,
    thirdPartyImpact: thirdPartyScore,
    bestPractices: calculateBestPracticesScore(metrics, breakdown)
  }
}

function calculateFinalDetailedScore(scoring: DetailedPerformanceScoring): number {
  const weights = {
    coreWebVitals: 0.4,
    loadPerformance: 0.2,
    resourceOptimization: 0.2,
    thirdPartyImpact: 0.1,
    bestPractices: 0.1
  }
  
  return Math.round(
    scoring.coreWebVitals * weights.coreWebVitals +
    scoring.loadPerformance * weights.loadPerformance +
    scoring.resourceOptimization * weights.resourceOptimization +
    scoring.thirdPartyImpact * weights.thirdPartyImpact +
    scoring.bestPractices * weights.bestPractices
  )
}
```

  ## Cross-Module Enhancement Tasks

  ### Task 7.1: Add Confidence Scoring System
  **Priority**: Medium  
  **Files**: All analysis modules

  #### Implementation Pattern:
  ```typescript
  interface ModuleResult {
    score: number | null
    confidence: number // 0-1
    confidenceFactors: {
      sampleSize?: number
      coveragePercent?: number
      ambiguityLevel?: number
      limitations: string[]
    }
  }
  ```

#### Scoring Integration:
```typescript
interface ConfidenceAdjustedScore {
  rawScore: number
  confidence: number
  adjustedScore: number
  explanation: string
}

function applyConfidenceAdjustment(
  rawScore: number,
  confidence: number,
  moduleWeight: number
): ConfidenceAdjustedScore {
  // Low confidence reduces the module's impact on overall score
  const adjustedScore = rawScore * confidence
  
  // For overall page scoring, also adjust the module weight
  const adjustedWeight = moduleWeight * confidence
  
  let explanation = ''
  if (confidence < 0.5) {
    explanation = 'Low confidence - results may not be fully accurate'
  } else if (confidence < 0.8) {
    explanation = 'Moderate confidence - some aspects could not be fully analyzed'
  } else {
    explanation = 'High confidence'
  }
  
  return {
    rawScore,
    confidence,
    adjustedScore,
    explanation
  }
}

// Example: Font analysis with confidence
function analyzeFontsWithConfidence(data): FontAnalysisWithConfidence {
  const result = analyzeFonts(data)
  
  let confidence = 1.0
  const factors = {
    limitations: []
  }
  
  // Reduce confidence for various factors
  if (data.cssLoadErrors > 0) {
    confidence *= 0.8
    factors.limitations.push('Some stylesheets could not be loaded')
  }
  
  if (data.fontLoadErrors > 0) {
    confidence *= 0.9
    factors.limitations.push('Some web fonts could not be analyzed')
  }
  
  if (data.iframeContent && !data.iframeAccessible) {
    confidence *= 0.7
    factors.limitations.push('Iframe content could not be analyzed')
  }
  
  return {
    ...result,
    confidence,
    confidenceFactors: factors
  }
}
```

  ### Task 7.2: Implement Industry Detection
  **Priority**: High  
  **Files**: `src/lib/analyzer.ts`, `src/lib/page-metadata.ts`

  #### Subtasks:
  1. **Create industry classifier**
     - Use page content analysis
     - Check meta descriptions
     - Analyze schema.org data
     - Look for industry-specific keywords

  2. **Apply industry-specific scoring**
     - Different weights per module
     - Industry-specific thresholds
     - Tailored recommendations

#### Scoring Integration:
```typescript
interface IndustryContext {
  detected: string // 'ecommerce' | 'saas' | 'blog' | 'portfolio' | etc.
  confidence: number
  signals: string[] // What led to this classification
}

interface IndustryWeights {
  [industry: string]: {
    [module: string]: number // Module importance 0-1
  }
}

const INDUSTRY_WEIGHTS: IndustryWeights = {
  ecommerce: {
    imageOptimization: 1.0,    // Critical for product images
    pageSpeed: 1.0,           // Conversion impact
    cta: 0.9,                 // Add to cart, checkout
    socialProof: 0.8,         // Reviews crucial
    fonts: 0.6,               // Less critical
    whitespace: 0.7           // Product grid layouts
  },
  'b2b-saas': {
    cta: 1.0,                 // Demo requests, trials
    socialProof: 0.9,         // Case studies, logos
    whitespace: 0.8,          // Professional appearance
    pageSpeed: 0.8,           // Important but not critical
    fonts: 0.7,               // Readability matters
    imageOptimization: 0.6     // Fewer images typically
  },
  blog: {
    fonts: 1.0,               // Readability is key
    whitespace: 0.9,          // Reading experience
    pageSpeed: 0.7,           // Important for SEO
    imageOptimization: 0.6,    // Featured images
    cta: 0.5,                 // Newsletter signups
    socialProof: 0.4          // Less critical
  },
  portfolio: {
    imageOptimization: 1.0,    // Visual showcase
    whitespace: 0.9,          // Design aesthetic
    fonts: 0.8,               // Typography matters
    pageSpeed: 0.7,           // User experience
    cta: 0.6,                 // Contact/hire me
    socialProof: 0.5          // Testimonials helpful
  }
}

function calculateIndustryAdjustedScores(
  moduleScores: Record<string, number>,
  industry: IndustryContext
): number {
  const weights = INDUSTRY_WEIGHTS[industry.detected] || INDUSTRY_WEIGHTS['other']
  
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(moduleScores).forEach(([module, score]) => {
    const weight = weights[module] || 0.5
    // Apply confidence to industry-specific weighting
    const adjustedWeight = weight * industry.confidence + (1 - industry.confidence) * 0.5
    
    totalScore += score * adjustedWeight
    totalWeight += adjustedWeight
  })
  
  return Math.round(totalScore / totalWeight)
}
```

  ## Testing Strategy

  ### For Each Task:
  1. **Write unit tests first** (TDD approach)
  2. **Include edge cases**
  3. **Test with real-world examples**
  4. **Verify backwards compatibility**
  5. **Update documentation**

  ### Integration Testing:
  - Test module interactions
  - Verify API response structure
  - Test with various page types
  - Performance benchmarking

  ## Implementation Order

  ### Phase 1 (Week 1-2): Critical Fixes
  1. Task 2.1: Fix "No Images" logic
  2. Task 3.1: Adaptive threshold system
  3. Task 1.1: Modernize font detection

  ### Phase 2 (Week 3-4): High-Value Features
  1. Task 4.2: Multi-viewport CTA analysis
  2. Task 5.1: Authenticity scoring
  3. Task 6.1: Real-world performance data

  ### Phase 3 (Week 5-6): Enhanced Intelligence
  1. Task 7.2: Industry detection
  2. Task 2.2: Responsive image analysis
  3. Task 4.1: Multi-language support

  ### Phase 4 (Week 7-8): Polish & Integration
  1. Task 7.1: Confidence scoring
  2. Remaining medium-priority tasks
  3. Cross-module integration testing

  ## Success Criteria

  Each task is complete when:
  1. All tests pass (including new tests)
  2. Documentation is updated
  3. Code follows project patterns
  4. API maintains backwards compatibility
  5. Performance impact is acceptable (<10% slowdown)