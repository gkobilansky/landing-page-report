'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnalysisResults from '@/components/AnalysisResults';
import { supabaseAdmin } from '@/lib/supabase';

interface AnalysisData {
  id: string;
  url: string;
  url_title?: string;
  status: string;
  overall_score?: number;
  page_speed_analysis?: any;
  font_analysis?: any;
  image_analysis?: any;
  cta_analysis?: any;
  whitespace_analysis?: any;
  social_proof_analysis?: any;
  screenshot_url?: string;
  created_at: string;
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analysisId = searchParams.get('id');
    
    if (!analysisId) {
      setError('No analysis ID provided');
      setLoading(false);
      return;
    }

    fetchAnalysis(analysisId);
  }, [searchParams]);

  const fetchAnalysis = async (analysisId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        setError('Report not found');
        return;
      }

      if (!data) {
        setError('Report not found');
        return;
      }

      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysisForDisplay = (rawAnalysis: AnalysisData) => {
    return {
      url: rawAnalysis.url,
      pageLoadSpeed: rawAnalysis.page_speed_analysis || { score: 0, grade: 'F', metrics: {}, recommendations: [] },
      fontUsage: rawAnalysis.font_analysis || { score: 0, fontFamilies: [], recommendations: [] },
      imageOptimization: rawAnalysis.image_analysis || { score: 0, totalImages: 0, recommendations: [] },
      ctaAnalysis: rawAnalysis.cta_analysis || { score: 0, ctas: [], recommendations: [] },
      whitespaceAssessment: rawAnalysis.whitespace_analysis || { score: 0, grade: 'F', metrics: {}, recommendations: [] },
      socialProof: rawAnalysis.social_proof_analysis || { score: 0, elements: [], summary: {}, recommendations: [] },
      overallScore: rawAnalysis.overall_score || 0,
      status: rawAnalysis.status,
      screenshotUrl: rawAnalysis.screenshot_url || null
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFCC00] mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-4">Loading Report...</h1>
            <p className="text-gray-400">Please wait while we fetch your Landing Page Report.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h1 className="text-3xl font-bold mb-4">Report Not Found</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[#FFCC00] text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              ← Analyze Another Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">No Report Found</h1>
            <p className="text-gray-400 mb-8">The requested Landing Page Report could not be found.</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[#FFCC00] text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              ← Analyze Another Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (analysis.status === 'processing' || analysis.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse text-yellow-500 text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Report in Progress</h1>
            <p className="text-gray-400 mb-8">
              Your report is still processing. This usually takes 45 seconds to 1 minute.
            </p>
            <button
              onClick={() => fetchAnalysis(analysis.id)}
              className="inline-flex items-center px-6 py-3 bg-[#FFCC00] text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors mr-4"
            >
              🔄 Refresh
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (analysis.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-6">❌</div>
            <h1 className="text-3xl font-bold mb-4">Report Failed</h1>
            <p className="text-gray-400 mb-8">
              Unfortunately, the analysis failed to complete. Please try running a new report.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[#FFCC00] text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              ← Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedAnalysis = formatAnalysisForDisplay(analysis);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{analysis.url_title || 'Landing Page'} Report</h1>
          <p className="text-xl text-gray-300 mb-2">
            Analysis for: <span className="text-[#FFCC00]">{analysis.url}</span>
          </p>
          <p className="text-sm text-gray-400">
            Generated on {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Analysis Results */}
        <AnalysisResults 
          result={formattedAnalysis} 
          analysisId={analysis.id}
        />

        {/* Footer Actions */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Analyze Another Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFCC00] mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-4">Loading Report...</h1>
            <p className="text-gray-400">Please wait while we fetch your analysis report.</p>
          </div>
        </div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}