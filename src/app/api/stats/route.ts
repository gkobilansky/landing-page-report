import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching analysis count:', error)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    return NextResponse.json({
      totalAnalyses: count || 0
    })
  } catch (error) {
    console.error('Error in stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}