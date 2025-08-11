import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  console.log('🏆 API /top-performers endpoint called');
  
  try {
    // Fetch top 5 analyses with highest overall_score
    const { data: topPerformers, error } = await supabaseAdmin
      .from('analyses')
      .select(`
        id,
        url,
        url_title,
        overall_score,
        screenshot_url,
        created_at
      `)
      .eq('status', 'completed')
      .not('overall_score', 'is', null)
      .order('overall_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch top performers from database' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${topPerformers?.length || 0} top performing pages`);

    return NextResponse.json({
      topPerformers: topPerformers || []
    });

  } catch (error) {
    console.error('❌ Error in top-performers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 