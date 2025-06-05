import { NextRequest, NextResponse } from 'next/server';
import { analyzeFontUsage } from '@/lib/font-analysis';
import { analyzeImageOptimization } from '@/lib/image-optimization';
import { analyzeCTA } from '@/lib/cta-analysis';
import { analyzePageSpeed } from '@/lib/page-speed-analysis';
import { analyzeWhitespace } from '@/lib/whitespace-assessment';
import { analyzeSocialProof } from '@/lib/social-proof-analysis';
import { supabaseAdmin } from '@/lib/supabase';
import { captureAndStoreScreenshot } from '@/lib/screenshot-storage';

export async function POST(request: NextRequest) {
  console.log('🔥 API /analyze endpoint called')
  
  const startTime = Date.now();
  let analysisId: string | null = null;
  
  try {
    console.log('📥 Parsing request body...')
    const body = await request.json();
    const { url, component, email, forceRescan = false, forceBrowserless = false } = body; // Add email parameter for database storage
    console.log(`📋 Received URL: ${url}`)
    console.log(`🎯 Component filter: ${component || 'all'}`)
    console.log(`📧 Email: ${email || 'anonymous request'}`)
    console.log(`🔄 Force rescan: ${forceRescan}`)
    console.log(`🌐 Force Browserless: ${forceBrowserless}`)

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

    // Create or find user and analysis record in database
    console.log('💾 Creating user and analysis record in database...')
    try {
      let userId: string;
      
      if (email) {
        // Handle registered user
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          userId = existingUser.id;
          console.log(`✅ Found existing user: ${userId}`);
        } else {
          const { data: newUser, error: userError } = await supabaseAdmin
            .from('users')
            .insert({
              email: email,
              marketing_consent: true
            })
            .select('id')
            .single();

          if (userError) {
            console.error('❌ Failed to create user:', userError);
            return NextResponse.json(
              { error: 'Failed to create user record' },
              { status: 500 }
            );
          }

          userId = newUser.id;
          console.log(`✅ Created new user: ${userId}`);
        }
      } else {
        // Handle anonymous user - use or create system user
        const systemEmail = 'system.anonymous@lansky.tech';
        const { data: systemUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', systemEmail)
          .single();

        if (systemUser) {
          userId = systemUser.id;
          console.log(`✅ Using system anonymous user: ${userId}`);
        } else {
          const { data: newSystemUser, error: systemUserError } = await supabaseAdmin
            .from('users')
            .insert({
              email: systemEmail,
              marketing_consent: false,
              first_name: 'Anonymous',
              last_name: 'User',
              lead_score: 0
            })
            .select('id')
            .single();

          if (systemUserError) {
            console.error('❌ Failed to create system user:', systemUserError);
            return NextResponse.json(
              { error: 'Failed to create system user record' },
              { status: 500 }
            );
          }

          userId = newSystemUser.id;
          console.log(`✅ Created system anonymous user: ${userId}`);
        }
      }

      // Option 2: Check for cacheable analysis (only return cache if recent AND not forced)
      const { data: existingAnalyses } = await supabaseAdmin
        .from('analyses')
        .select('id, status, created_at')
        .eq('url', validatedUrl.toString())
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('🔍 Existing analyses:', existingAnalyses);

      const existingAnalysis = existingAnalyses?.[0];
      const shouldUseCache = existingAnalysis && 
        !forceRescan && 
        existingAnalysis.status === 'completed' &&
        (Date.now() - new Date(existingAnalysis.created_at).getTime()) < (24 * 60 * 60 * 1000);

      if (shouldUseCache) {
        const analysisAge = Date.now() - new Date(existingAnalysis.created_at).getTime();
        console.log(`✅ Using cached analysis: ${existingAnalysis.id}, Age: ${Math.round(analysisAge / 1000)}s`);
        
        const { data: existingData, error: fetchError } = await supabaseAdmin
          .from('analyses')
          .select('*')
          .eq('id', existingAnalysis.id)
          .single();
        
        if (existingData) {
          let screenshotUrl = existingData.screenshot_url;
          
          // If cached analysis doesn't have a screenshot, capture one now
          if (!screenshotUrl) {
            try {
              console.log('📸 Cached analysis missing screenshot, capturing now...');
              const screenshotResult = await captureAndStoreScreenshot(validatedUrl.toString(), {
                fullPage: true,
                format: 'png',
                quality: 80,
                viewport: { width: 1920, height: 1080 },
                puppeteer: { forceBrowserless }
              });
              screenshotUrl = screenshotResult.blobUrl;
              console.log(`✅ Screenshot captured for cached analysis: ${screenshotUrl}`);
              
              // Update the cached analysis with the screenshot
              await supabaseAdmin
                .from('analyses')
                .update({ screenshot_url: screenshotUrl })
                .eq('id', existingData.id);
            } catch (error) {
              console.error('⚠️ Failed to capture screenshot for cached analysis:', error);
              screenshotUrl = null;
            }
          }
          
          return NextResponse.json({
            success: true,
            analysis: {
              url: existingData.url,
              pageLoadSpeed: existingData.page_speed_analysis,
              fontUsage: existingData.font_analysis,
              imageOptimization: existingData.image_analysis,
              ctaAnalysis: existingData.cta_analysis,
              whitespaceAssessment: existingData.whitespace_analysis,
              socialProof: existingData.social_proof_analysis,
              overallScore: existingData.overall_score,
              status: existingData.status,
              screenshotUrl: screenshotUrl
            },
            analysisId: existingData.id,
            fromCache: true,
            message: 'Returning cached analysis from within 24 hours.'
          });
        }
      }

      // Create new analysis record (Option 2: Always create new for forced refresh or old/missing analysis)
      console.log(`🆕 Creating new analysis record for URL: ${validatedUrl.toString()}`);
      console.log(`📝 Reason: ${forceRescan ? 'Force rescan requested' : existingAnalysis ? 'Analysis too old or failed' : 'No existing analysis'}`);
      
      const { data: analysisRecord, error: insertError } = await supabaseAdmin
        .from('analyses')
        .insert({
          user_id: userId,
          url: validatedUrl.toString(),
          status: 'processing',
          algorithm_version: '1.0.0',
          lighthouse_available: true, // Will be updated based on actual availability
          retry_count: 0,
          is_baseline: false, // Only first analysis is baseline
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create analysis record:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize analysis record' },
          { status: 500 }
        );
      }

      analysisId = analysisRecord.id;
      console.log(`✅ New analysis record created with ID: ${analysisId}`);
    } catch (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
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

    // Capture screenshot early for visual analysis and user feedback
    let screenshotResult = null;
    try {
      console.log('📸 Capturing page screenshot for analysis...');
      screenshotResult = await captureAndStoreScreenshot(validatedUrl.toString(), {
        fullPage: true,
        format: 'png',
        quality: 80,
        viewport: { width: 1920, height: 1080 },
        puppeteer: { forceBrowserless }
      });
      console.log(`✅ Screenshot captured and stored: ${screenshotResult.blobUrl}`);
      
      // Store screenshot URL in analysis record
      if (analysisId) {
        await supabaseAdmin
          .from('analyses')
          .update({ 
            screenshot_url: screenshotResult.blobUrl
          })
          .eq('id', analysisId);
      }
    } catch (error) {
      console.error('⚠️ Screenshot capture failed, continuing with analysis:', error);
      // Don't fail the entire analysis if screenshot fails
    }

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
          metrics: {
            loadTime: 0,
            performanceGrade: 'F',
            speedDescription: 'Unable to measure',
            relativeTo: 'Analysis unavailable'
          },
          issues: ['Page speed analysis failed due to error'],
          recommendations: [],
          loadTime: 0
        };
      }
    }

    if (shouldRun('font')) {
      console.log('🔄 Starting font usage analysis...')
      const fontUsageResult = await analyzeFontUsage(validatedUrl.toString(), {
        puppeteer: { forceBrowserless }
      });
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
      const imageOptimizationResult = await analyzeImageOptimization(validatedUrl.toString(), {
        puppeteer: { forceBrowserless }
      });
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
        const ctaResult = await analyzeCTA(validatedUrl.toString(), {
          puppeteer: { forceBrowserless }
        });
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
        const whitespaceResult = await analyzeWhitespace(validatedUrl.toString(), {
          screenshotUrl: screenshotResult?.blobUrl, // Use the captured screenshot
          puppeteer: { forceBrowserless }
        });
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
        const socialProofResult = await analyzeSocialProof(validatedUrl.toString(), {
          puppeteer: { forceBrowserless }
        });
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
    // Calculate weighted overall score based on conversion impact
    const weights = {
      speed: 0.25,        // Highest - page speed directly impacts conversions
      cta: 0.25,          // Highest - CTA effectiveness is critical for conversions  
      socialProof: 0.20,  // High - builds trust and credibility
      whitespace: 0.15,   // Medium - affects user experience and readability
      images: 0.10,       // Lower - optimization is important but less conversion-critical
      fonts: 0.05        // Lowest - mainly affects polish and professionalism
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    if (analysisResult.pageSpeed?.score !== undefined) {
      weightedSum += analysisResult.pageSpeed.score * weights.speed;
      totalWeight += weights.speed;
    }
    if (analysisResult.ctaAnalysis?.score !== undefined) {
      weightedSum += analysisResult.ctaAnalysis.score * weights.cta;
      totalWeight += weights.cta;
    }
    if (analysisResult.socialProof?.score !== undefined) {
      weightedSum += analysisResult.socialProof.score * weights.socialProof;
      totalWeight += weights.socialProof;
    }
    if (analysisResult.whitespace?.score !== undefined) {
      weightedSum += analysisResult.whitespace.score * weights.whitespace;
      totalWeight += weights.whitespace;
    }
    if (analysisResult.images?.score !== undefined) {
      weightedSum += analysisResult.images.score * weights.images;
      totalWeight += weights.images;
    }
    if (analysisResult.fonts?.score !== undefined) {
      weightedSum += analysisResult.fonts.score * weights.fonts;
      totalWeight += weights.fonts;
    }
    
    analysisResult.overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Update database record with final results
    if (analysisId) {
      console.log('💾 Updating analysis record with results...')
      const analysisTimeMs = Date.now() - startTime;
      
      try {
        const { error: updateError } = await supabaseAdmin
          .from('analyses')
          .update({
            status: 'completed',
            page_speed_analysis: analysisResult.pageLoadSpeed,
            font_analysis: analysisResult.fontUsage,
            image_analysis: analysisResult.imageOptimization,
            cta_analysis: analysisResult.ctaAnalysis,
            whitespace_analysis: analysisResult.whitespaceAssessment,
            social_proof_analysis: analysisResult.socialProof,
            overall_score: analysisResult.overallScore,
            grade: analysisResult.pageLoadSpeed.grade || 'F',
            analysis_duration_ms: analysisTimeMs,
            completed_at: new Date().toISOString()
          })
          .eq('id', analysisId);

        if (updateError) {
          console.error('❌ Failed to update analysis record:', updateError);
        } else {
          console.log(`✅ Analysis record updated successfully (${analysisTimeMs}ms)`);
        }
      } catch (error) {
        console.error('❌ Database update error:', error);
      }
    }

    console.log(`🎉 Analysis complete! Overall score: ${analysisResult.overallScore}/100`)
    console.log('📤 Sending response to client...')
    
    return NextResponse.json({
      success: true,
      analysis: {
        ...analysisResult,
        screenshotUrl: screenshotResult?.blobUrl || null
      },
      analysisId,
      fromCache: false,
      message: 'Analysis completed successfully.'
    });

  } catch (error) {
    console.error('💥 Analysis API error:', error);
    
    // Update database record with error status
    if (analysisId) {
      try {
        const analysisTimeMs = Date.now() - startTime;
        await supabaseAdmin
          .from('analyses')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error occurred',
            analysis_duration_ms: analysisTimeMs,
            completed_at: new Date().toISOString()
          })
          .eq('id', analysisId);
        console.log('💾 Analysis record updated with error status');
      } catch (dbError) {
        console.error('❌ Failed to update error status in database:', dbError);
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}