import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeFontUsage } from '@/lib/font-analysis';
import { analyzeImageOptimization } from '@/lib/image-optimization';
import { analyzeCTA } from '@/lib/cta-analysis';
import { analyzePageSpeed } from '@/lib/page-speed-analysis';
import { analyzeWhitespace } from '@/lib/whitespace-assessment';
import { analyzeSocialProof } from '@/lib/social-proof-analysis';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  console.log('🔥 API /analyze endpoint called')
  
  try {
    console.log('📥 Parsing request body...')
    const body = await request.json();
    const { url, component } = body; // Add component parameter for selective testing
    console.log(`📋 Received URL: ${url}`)
    console.log(`🎯 Component filter: ${component || 'all'}`)

    // Validate input
    if (!url) {
      console.log('❌ URL validation failed: missing URL')
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      // Check protocol
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      // Check hostname exists and is not empty
      if (!validatedUrl.hostname || validatedUrl.hostname.trim() === '') {
        throw new Error('Invalid hostname');
      }
      // Check hostname contains at least one dot (domain.tld)
      if (!validatedUrl.hostname.includes('.')) {
        throw new Error('Invalid hostname format');
      }
      // Check hostname doesn't end with just a dot
      if (validatedUrl.hostname.endsWith('.')) {
        throw new Error('Invalid hostname format');
      }
      console.log(`✅ URL validation passed: ${validatedUrl.toString()}`)
    } catch (error) {
      console.log(`❌ URL validation failed: ${error instanceof Error ? error.message : 'invalid format'}`)
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a complete URL with a valid domain.' },
        { status: 400 }
      );
    }

    // Initialize results object
    let analysisResult: any = {
      url: validatedUrl.toString(),
      pageLoadSpeed: { 
        score: 0, 
        grade: 'F',
        metrics: { lcp: 0, fcp: 0, cls: 0, tbt: 0, si: 0 },
        lighthouseScore: 0,
        issues: [],
        recommendations: [],
        loadTime: 0
      },
      fontUsage: { score: 0, fontFamilies: [], fontCount: 0, systemFontCount: 0, webFontCount: 0, issues: [], recommendations: [] },
      imageOptimization: { score: 0, totalImages: 0, modernFormats: 0, withAltText: 0, appropriatelySized: 0, issues: [], recommendations: [], details: {} },
      ctaAnalysis: { score: 0, ctas: [], issues: [], recommendations: [] },
      whitespaceAssessment: { 
        score: 0, 
        grade: 'F',
        metrics: {
          whitespaceRatio: 0,
          elementDensityPerSection: {
            gridSections: 0,
            maxDensity: 0,
            averageDensity: 0,
            totalElements: 0
          },
          spacingAnalysis: {
            headlineSpacing: { adequate: false },
            ctaSpacing: { adequate: false },
            contentBlockSpacing: { adequate: false },
            lineHeight: { adequate: false }
          },
          clutterScore: 0,
          hasAdequateSpacing: false
        },
        issues: [],
        recommendations: [],
        loadTime: 0
      },
      socialProof: { 
        score: 0, 
        elements: [], 
        summary: {
          totalElements: 0,
          aboveFoldElements: 0,
          testimonials: 0,
          reviews: 0,
          ratings: 0,
          trustBadges: 0,
          customerCounts: 0,
          socialMedia: 0,
          certifications: 0,
          partnerships: 0,
          caseStudies: 0,
          newsMentions: 0
        },
        issues: [], 
        recommendations: [] 
      },
      overallScore: 0,
      status: 'completed'
    };

    const scores: number[] = [];

    // Component-based analysis
    const shouldRun = (componentName: string) => !component || component === 'all' || component === componentName;

    if (shouldRun('speed') || shouldRun('pageSpeed')) {
      console.log('🔄 Starting page speed analysis...')
      try {
        const pageSpeedResult = await analyzePageSpeed(validatedUrl.toString());
        analysisResult.pageLoadSpeed = {
          score: pageSpeedResult.score,
          grade: pageSpeedResult.grade,
          metrics: pageSpeedResult.metrics,
          lighthouseScore: pageSpeedResult.lighthouseScore,
          issues: pageSpeedResult.issues,
          recommendations: pageSpeedResult.recommendations,
          loadTime: pageSpeedResult.loadTime
        };
        scores.push(pageSpeedResult.score);
        console.log(`✅ Page speed analysis complete: Score ${pageSpeedResult.score}, Grade ${pageSpeedResult.grade}`);
      } catch (error) {
        console.error('❌ Page speed analysis failed:', error);
        analysisResult.pageLoadSpeed = {
          score: 0,
          grade: 'F',
          metrics: { lcp: 0, fcp: 0, cls: 0, tbt: 0, si: 0 },
          lighthouseScore: 0,
          issues: ['Page speed analysis failed due to error'],
          recommendations: [],
          loadTime: 0
        };
      }
    }

    if (shouldRun('font')) {
      console.log('🔄 Starting font usage analysis...')
      const fontUsageResult = await analyzeFontUsage(validatedUrl.toString());
      analysisResult.fontUsage = {
        score: fontUsageResult.score,
        fontFamilies: fontUsageResult.fontFamilies,
        fontCount: fontUsageResult.fontCount,
        systemFontCount: fontUsageResult.systemFontCount,
        webFontCount: fontUsageResult.webFontCount,
        issues: fontUsageResult.issues,
        recommendations: fontUsageResult.recommendations
      };
      scores.push(fontUsageResult.score);
    }

    if (shouldRun('image')) {
      console.log('🔄 Starting image optimization analysis...')
      const imageOptimizationResult = await analyzeImageOptimization(validatedUrl.toString());
      analysisResult.imageOptimization = {
        score: imageOptimizationResult.score,
        totalImages: imageOptimizationResult.totalImages,
        modernFormats: imageOptimizationResult.modernFormats,
        withAltText: imageOptimizationResult.withAltText,
        appropriatelySized: imageOptimizationResult.appropriatelySized,
        issues: imageOptimizationResult.issues,
        recommendations: imageOptimizationResult.recommendations,
        details: imageOptimizationResult.details
      };
      scores.push(imageOptimizationResult.score);
    }

    if (shouldRun('cta')) {
      console.log('🔄 Starting CTA analysis...')
      
      try {
        console.log('🎯 Running CTA analysis...');
        const ctaResult = await analyzeCTA(validatedUrl.toString());
        console.log(`✅ CTA analysis complete: ${ctaResult.ctas.length} CTAs found, score: ${ctaResult.score}`);
        
        analysisResult.ctaAnalysis = {
          score: ctaResult.score,
          ctas: ctaResult.ctas.map(cta => ({
            text: cta.text,
            type: cta.type,
            isAboveFold: cta.isAboveFold,
            actionStrength: cta.actionStrength,
            urgency: cta.urgency,
            visibility: cta.visibility,
            context: cta.context
          })),
          primaryCTA: ctaResult.primaryCTA ? {
            text: ctaResult.primaryCTA.text,
            type: ctaResult.primaryCTA.type,
            actionStrength: ctaResult.primaryCTA.actionStrength,
            visibility: ctaResult.primaryCTA.visibility,
            context: ctaResult.primaryCTA.context
          } : undefined,
          issues: ctaResult.issues,
          recommendations: ctaResult.recommendations
        };
        scores.push(ctaResult.score);
      } catch (error) {
        console.error('❌ CTA analysis failed:', error);
        analysisResult.ctaAnalysis = {
          score: 0,
          ctas: [],
          issues: ['CTA analysis failed due to error'],
          recommendations: []
        };
      }
    }

    if (shouldRun('whitespace') || shouldRun('spacing')) {
      console.log('🔄 Starting whitespace assessment...')
      try {
        const whitespaceResult = await analyzeWhitespace(validatedUrl.toString());
        analysisResult.whitespaceAssessment = {
          score: whitespaceResult.score,
          grade: whitespaceResult.grade,
          metrics: {
            whitespaceRatio: whitespaceResult.metrics.whitespaceRatio,
            elementDensityPerSection: {
              gridSections: whitespaceResult.metrics.elementDensityPerSection.gridSections,
              maxDensity: whitespaceResult.metrics.elementDensityPerSection.maxDensity,
              averageDensity: whitespaceResult.metrics.elementDensityPerSection.averageDensity,
              totalElements: whitespaceResult.metrics.elementDensityPerSection.totalElements
            },
            spacingAnalysis: {
              headlineSpacing: { adequate: whitespaceResult.metrics.spacingAnalysis.headlineSpacing.adequate },
              ctaSpacing: { adequate: whitespaceResult.metrics.spacingAnalysis.ctaSpacing.adequate },
              contentBlockSpacing: { adequate: whitespaceResult.metrics.spacingAnalysis.contentBlockSpacing.adequate },
              lineHeight: { adequate: whitespaceResult.metrics.spacingAnalysis.lineHeight.adequate }
            },
            clutterScore: whitespaceResult.metrics.clutterScore,
            hasAdequateSpacing: whitespaceResult.metrics.hasAdequateSpacing
          },
          issues: whitespaceResult.issues,
          recommendations: whitespaceResult.recommendations,
          loadTime: whitespaceResult.loadTime
        };
        scores.push(whitespaceResult.score);
        console.log(`✅ Whitespace assessment complete: Score ${whitespaceResult.score}, Grade ${whitespaceResult.grade}`);
      } catch (error) {
        console.error('❌ Whitespace assessment failed:', error);
        analysisResult.whitespaceAssessment = {
          score: 0,
          grade: 'F',
          metrics: {
            whitespaceRatio: 0,
            elementDensityPerSection: {
              gridSections: 0,
              maxDensity: 0,
              averageDensity: 0,
              totalElements: 0
            },
            spacingAnalysis: {
              headlineSpacing: { adequate: false },
              ctaSpacing: { adequate: false },
              contentBlockSpacing: { adequate: false },
              lineHeight: { adequate: false }
            },
            clutterScore: 100,
            hasAdequateSpacing: false
          },
          issues: ['Whitespace assessment failed due to error'],
          recommendations: [],
          loadTime: 0
        };
      }
    }

    if (shouldRun('social') || shouldRun('socialProof')) {
      console.log('🔄 Starting social proof analysis...')
      try {
        const socialProofResult = await analyzeSocialProof(validatedUrl.toString());
        analysisResult.socialProof = {
          score: socialProofResult.score,
          elements: socialProofResult.elements.map(element => ({
            type: element.type,
            text: element.text,
            score: element.score,
            isAboveFold: element.isAboveFold,
            hasImage: element.hasImage,
            hasName: element.hasName,
            hasCompany: element.hasCompany,
            hasRating: element.hasRating,
            credibilityScore: element.credibilityScore,
            visibility: element.visibility,
            context: element.context
          })),
          summary: socialProofResult.summary,
          issues: socialProofResult.issues,
          recommendations: socialProofResult.recommendations
        };
        scores.push(socialProofResult.score);
        console.log(`✅ Social proof analysis complete: ${socialProofResult.elements.length} elements found, score: ${socialProofResult.score}`);
      } catch (error) {
        console.error('❌ Social proof analysis failed:', error);
        analysisResult.socialProof = {
          score: 0,
          elements: [],
          summary: {
            totalElements: 0,
            aboveFoldElements: 0,
            testimonials: 0,
            reviews: 0,
            ratings: 0,
            trustBadges: 0,
            customerCounts: 0,
            socialMedia: 0,
            certifications: 0,
            partnerships: 0,
            caseStudies: 0,
            newsMentions: 0
          },
          issues: ['Social proof analysis failed due to error'],
          recommendations: []
        };
      }
    }

    console.log('📊 Building analysis result object...')
    analysisResult.overallScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    console.log(`🎉 Analysis complete! Overall score: ${analysisResult.overallScore}/100`)
    console.log('📤 Sending response to client...')
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      message: 'Analysis completed successfully.'
    });

  } catch (error) {
    console.error('💥 Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}