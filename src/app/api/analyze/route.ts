import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, email } = body;

    // Validate input
    if (!url || !email) {
      return NextResponse.json(
        { error: 'URL and email are required' },
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
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Implement analysis logic
    const analysisResult = {
      url: validatedUrl.toString(),
      email,
      pageLoadSpeed: { score: 0, metrics: {} },
      fontUsage: { score: 0, fonts: [], issues: [] },
      imageOptimization: { score: 0, images: [], issues: [] },
      ctaAnalysis: { score: 0, ctas: [], issues: [] },
      whitespaceAssessment: { score: 0, issues: [] },
      socialProof: { score: 0, elements: [], issues: [] },
      overallScore: 0,
      status: 'pending'
    };

    // Store in database
    const { data, error } = await supabase
      .from('landing_page_analyses')
      .insert(analysisResult)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to store analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: data.id,
      message: 'Analysis started. Results will be emailed to you shortly.'
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}