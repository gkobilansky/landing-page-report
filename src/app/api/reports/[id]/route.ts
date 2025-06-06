import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Fetch the specific analysis by ID
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .select(`
        id,
        url,
        url_title,
        overall_score,
        grade,
        screenshot_url,
        created_at,
        status,
        page_speed_analysis,
        font_analysis,
        image_analysis,
        cta_analysis,
        whitespace_analysis,
        social_proof_analysis
      `)
      .eq('id', id)
      .eq('status', 'completed')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}