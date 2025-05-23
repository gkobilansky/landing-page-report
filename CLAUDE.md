# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a landing page analyzer project built as a lead magnet for lansky.tech. Users submit URLs for analysis against 6 key criteria and receive detailed reports via email.

## Technology Stack

- **Frontend/Backend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend/SendGrid
- **Analysis Tools**: Puppeteer, Google Lighthouse
- **Hosting**: Vercel (recommended)

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase CLI (for database management)

### Installation
```bash
npm install
```

### Database Setup
```bash
# Start local Supabase (in separate terminal)
supabase start

# Apply database migrations
supabase migration up
```

### Development Commands
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Environment Setup
1. Copy `.env.local.example` to `.env.local`
2. Environment variables are pre-configured for local development
3. For production, update Supabase URLs and keys accordingly

### Vercel Deployment Setup
1. The project includes a `vercel.json` configuration for optimal serverless deployment
2. Puppeteer configuration automatically handles Vercel's serverless environment
3. Uses `@sparticuz/chromium` for serverless-compatible Chrome binary
4. If experiencing shared library issues, the application gracefully falls back with user-friendly error messages

## Development Workflow

### Best Practices
- Use TDD approach when building new features
- Update docs after finishing a task

## Architecture Notes

### Project Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── tool/               # Analysis tool pages
│   └── api/                # API routes
├── components/             # Reusable components
├── lib/                    # Utilities and configurations
└── types/                  # TypeScript type definitions
```

### Analysis Criteria (6 key areas)
1. ✅ **Page Load Speed** - Production ready with Lighthouse integration and Puppeteer fallback
2. ✅ **Font Usage** - Production ready with CSS parsing and font-family detection
3. ✅ **Image Optimization** - Production ready with format, sizing, and accessibility analysis
4. ✅ **CTA Analysis** - Production ready with smart detection and scoring
5. ✅ **Whitespace and Clutter Assessment** - Production ready with grid-based analysis
6. ✅ **Social Proof Detection** - Production ready with comprehensive element detection

### Database Schema
- **Table**: `landing_page_analyses`
- **Primary Key**: UUID with auto-generation
- **Analysis Fields**: JSONB fields for each of the 6 criteria
- **Features**: Timestamps, RLS policies, indexes for performance

## Technical Implementation Summary

### Completed Analysis Modules

#### 1. Font Analysis (`src/lib/font-analysis.ts`)
- **Purpose**: Evaluate font family usage for performance and consistency
- **Algorithm**: CSS parsing with font-family detection and stack handling
- **Scoring**: 100pts (≤2 families), 85pts (3 families), penalized for excess
- **Test Coverage**: 14 test cases including real-world font stacks

#### 2. Image Optimization (`src/lib/image-optimization.ts`) 
- **Purpose**: Assess image format, sizing, and accessibility compliance
- **Algorithm**: Multi-factor scoring (format 40%, alt-text 35%, sizing 25%)
- **Features**: Modern format detection, oversized image flagging, accessibility audit
- **Test Coverage**: 12 test cases with edge case handling

#### 3. CTA Analysis (`src/lib/cta-analysis.ts`)
- **Purpose**: Identify and evaluate call-to-action effectiveness
- **Algorithm**: Puppeteer-based element detection with smart filtering and deduplication
- **Features**: Price CTA prioritization, action word analysis, context awareness
- **Real-world validation**: GMB.io test case with 198→31 CTA noise reduction
- **Test Coverage**: 14 comprehensive test cases including customer name filtering

#### 4. Page Speed Analysis (`src/lib/page-speed-analysis.ts`)
- **Purpose**: Comprehensive Core Web Vitals and performance analysis
- **Algorithm**: Smart fallback system - Lighthouse first, then Puppeteer-based analysis
- **Core Metrics**: LCP, FCP, CLS, TBT with native browser Performance APIs
- **Scoring**: 0-100 scale with letter grades (A-F) and performance boost for excellent metrics
- **Real-World Performance**: Successfully tested with GMB.io (95/100, Grade A)
- **Fallback System**: Puppeteer-based analyzer when Lighthouse fails
- **Server-Side Compatibility**: Handles Next.js environment constraints gracefully

#### 5. Whitespace Assessment (`src/lib/whitespace-assessment.ts`)
- **Purpose**: Evaluate layout density and spacing quality
- **Algorithm**: Grid-based element density analysis per section (3x4 grid system)
- **Features**: Spacing analysis, line height assessment, clutter detection
- **Scoring**: Multi-factor scoring: density (40%), spacing (35%), whitespace ratio (25%)

#### 6. Social Proof Detection (`src/lib/social-proof-analysis.ts`)
- **Purpose**: Identify and evaluate social proof elements for credibility
- **Algorithm**: Puppeteer-based detection with comprehensive element classification
- **Features**: Testimonials, reviews, ratings, trust badges, customer counts, certifications
- **Scoring**: Multi-factor scoring based on element types, positioning, and credibility indicators
- **Test Coverage**: 12 comprehensive test cases covering all social proof types

### API Architecture (`src/app/api/analyze/route.ts`)
- **Endpoint**: `POST /api/analyze`
- **Parameters**: `url` (required), `component` (optional for selective testing)
- **Response**: JSON with individual module scores and overall analysis
- **Features**: Component-based testing, robust URL validation, error handling, progress logging
- **URL Validation**: Enhanced validation requires proper domain extensions, rejects incomplete URLs

### Frontend Components
- **Main Page** (`src/app/page.tsx`): URL input and results display with proper API response handling
- **AnalysisResults** (`src/components/AnalysisResults.tsx`): Comprehensive results display with score badges
- **UrlInput** (`src/components/UrlInput.tsx`): Enhanced URL validation and submission form with domain extension requirements

## Current Status

✅ **Complete**: Full analysis functionality with frontend integration
- All 6 analysis modules implemented and tested
- API endpoint working with component-based testing
- Frontend properly displaying analysis results
- Enhanced URL validation preventing incomplete URLs
- Comprehensive test coverage across all modules
- Robust error handling and fallback systems

### Recent Updates Applied
- ✅ Enhanced URL validation (client & server-side) - rejects incomplete URLs like "https://stripe"
- ✅ Added comprehensive test coverage for URL validation scenarios
- ✅ Fixed Lighthouse dynamic import error in Next.js environment
- ✅ Resolved API response structure mismatch (wrapped vs direct analysis data)
- ✅ Updated CTA field mapping (isAboveFold, actionStrength display)
- ✅ Corrected page speed metrics display units (ms instead of seconds)
- ✅ Social proof detection module completed with full functionality

## API Usage Examples

### Component-Based Testing
```bash
# Test only page speed analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "speed"}'

# Test all components (default)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test invalid URL (will be rejected)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe"}'
```

### Real-World Testing Results
- **GMB.io Analysis**: 95/100 (Grade A) - LCP: 924ms, FCP: 332ms, CLS: 0
- **Performance**: ~3-8 seconds for full analysis on typical landing pages
- **Reliability**: Robust fallback system ensures analysis completion even when Lighthouse fails

## Next Steps
- Improve individual analysis modules based on real-world testing feedback
- Add database storage for analysis results  
- Consider email report generation functionality
- Enhance scoring algorithms and recommendation quality

## Development Notes
- Assume server is already running