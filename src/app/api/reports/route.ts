import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('📊 API /reports endpoint called');
  
  try {
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : null;

    console.log(`📊 Fetching reports: limit=${limit}, offset=${offset}, sortBy=${sortBy}, sortOrder=${sortOrder}`);

    // Build the query
    let query = supabaseAdmin
      .from('analyses')
      .select(`
        id,
        url,
        url_title,
        overall_score,
        screenshot_url,
        created_at,
        status
      `)
      .eq('status', 'completed')
      .not('overall_score', 'is', null)
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Add score filter if provided
    if (minScore !== null) {
      query = query.gte('overall_score', minScore);
    }

    const { data: analyses, error: dbError } = await query;

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch reports from database' },
        { status: 500 }
      );
    }

    if (!analyses) {
      console.log('📊 No analyses found');
      return NextResponse.json({
        reports: [],
        total: 0,
        offset,
        limit
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .not('overall_score', 'is', null);

    if (countError) {
      console.warn('⚠️ Failed to get total count:', countError);
    }

    // Process the results to ensure we have good data
    const processedReports = analyses.map(analysis => ({
      id: analysis.id,
      url: analysis.url,
      url_title: analysis.url_title || extractDomainFromUrl(analysis.url),
      overall_score: analysis.overall_score || 0,
      screenshot_url: analysis.screenshot_url,
      created_at: analysis.created_at,
      status: analysis.status
    }));

    console.log(`✅ Successfully fetched ${processedReports.length} reports`);

    return NextResponse.json({
      reports: processedReports,
      total: count || processedReports.length,
      offset,
      limit,
      hasMore: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('💥 Reports API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract domain from URL for fallback titles
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}