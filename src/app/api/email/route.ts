import { NextRequest, NextResponse } from 'next/server';
import { sendReportEmail } from '@/lib/email-service';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('📧 API /email endpoint called');
  
  try {
    console.log('📥 Parsing request body...');
    const body = await request.json();
    const { email, analysisId } = body;
    
    console.log(`📧 Email: ${email || 'not provided'}`);
    console.log(`🆔 Analysis ID: ${analysisId || 'not provided'}`);

    // Validate required parameters
    if (!email || !email.trim()) {
      console.log('❌ Email validation failed: missing email');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!analysisId || !analysisId.trim()) {
      console.log('❌ Analysis ID validation failed: missing analysis ID');
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('❌ Email validation failed: invalid format');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Fetch analysis from database
    console.log('💾 Fetching analysis from database...');
    const { data: analysis, error: dbError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', analysisId.trim())
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      if (dbError.code === 'PGRST116' || dbError.message === 'Analysis not found') {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    if (!analysis) {
      console.log('❌ Analysis not found');
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Check if analysis is complete
    if (analysis.status !== 'completed') {
      console.log(`❌ Analysis not complete: status is ${analysis.status}`);
      return NextResponse.json(
        { error: 'Analysis is not yet complete' },
        { status: 400 }
      );
    }

    // Create or update user record with email
    let userId = analysis.user_id;
    
    console.log('👤 Managing user record for email...');
    try {
      // First, check if a user with this email already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (existingUser) {
        // User exists, use their ID
        userId = existingUser.id;
        console.log('✅ Found existing user:', userId);
        
        // Update the analysis to point to the correct user
        await supabaseAdmin
          .from('analyses')
          .update({ user_id: userId })
          .eq('id', analysisId);
      } else {
        // Create new user
        console.log('➕ Creating new user...');
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({ 
            email: email.trim(),
            marketing_consent: true,
            lead_source: 'landing_page_analyzer'
          })
          .select('id')
          .single();

        if (userError) {
          console.warn('⚠️ Failed to create user record:', userError);
          // Continue with analysis user_id, don't fail the email
        } else {
          userId = newUser.id;
          console.log('✅ Created new user:', userId);
          
          // Update the analysis to point to the new user
          await supabaseAdmin
            .from('analyses')
            .update({ user_id: userId })
            .eq('id', analysisId);
        }
      }
    } catch (userError) {
      console.warn('⚠️ Failed to manage user record:', userError);
      // Don't fail the request if user management fails
    }

    // Generate report URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL || 'app.lansky.tech'}`
      : 'http://localhost:3000';
    const reportUrl = `${baseUrl}/report?id=${analysisId}`;

    console.log(`🔗 Report URL: ${reportUrl}`);

    // Format analysis data for email
    const emailAnalysisData = {
      id: analysis.id,
      url: analysis.url,
      overallScore: analysis.overall_score || 0,
      grade: analysis.page_speed_analysis?.grade || 'N/A',
      pageSpeed: analysis.page_speed_analysis,
      fonts: analysis.font_analysis,
      images: analysis.image_analysis,
      cta: analysis.cta_analysis,
      whitespace: analysis.whitespace_analysis,
      socialProof: analysis.social_proof_analysis,
      screenshotUrl: analysis.screenshot_url,
      createdAt: analysis.created_at
    };

    // Send email
    console.log('📧 Sending email...');
    const emailResult = await sendReportEmail(
      email.trim(),
      emailAnalysisData,
      reportUrl
    );

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error);
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    console.log(`✅ Email sent successfully: ${emailResult.emailId}`);

    return NextResponse.json({
      success: true,
      message: 'Report sent successfully to your email!',
      emailId: emailResult.emailId
    });

  } catch (error) {
    console.error('💥 Email API error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError || error.message === 'Invalid JSON') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}