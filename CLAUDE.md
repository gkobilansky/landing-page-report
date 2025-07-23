# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Landing Page Report project. Users submit URLs for analysis against 6 key criteria and receive detailed reports via email.

Check the quality of your vibe coded landing page and make sure your visitors convert to users. The Landing Page Report provides improvements recommendations. 

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
2. **Browser Service**: Uses Browserless.io for reliable Chrome browser access in production
3. **Environment Variables Required**:
   - `BLESS_KEY`: Browserless.io API key (add to Vercel environment variables)
4. **Local Development**: Automatically uses local Chrome installation
5. **Reliable Deployment**: No Chromium dependency issues on serverless platforms

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
- **Metadata Fields**: `url_title`, `url_description`, `schema_data` (JSON-LD schema.org data)
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

### Page Metadata Extraction (`src/lib/page-metadata.ts`)
- **Purpose**: Extract page title, meta description, and schema.org JSON-LD data
- **Algorithm**: Puppeteer-based extraction with JSON-LD parsing for organization/website data
- **Features**: Supports Organization and WebSite schema types, graceful fallbacks for malformed data
- **Schema Priority**: Organization schema prioritized over WebSite schema
- **Output**: Title, description, URL, and structured schema data for enhanced reporting
- **Test Coverage**: 15 comprehensive test cases including error handling and real-world scenarios

### API Architecture

#### Main Analysis Endpoint (`src/app/api/analyze/route.ts`)
- **Endpoint**: `POST /api/analyze`
- **Parameters**: 
  - `url` (required): The URL to analyze
  - `component` (optional): Selective testing for specific modules (`speed`, `fonts`, `images`, `cta`, `whitespace`, `social`)
  - `forceRescan` (optional): Boolean to bypass 24-hour cache and force fresh analysis
- **Response**: JSON with individual module scores, overall analysis, page metadata (title, description, schema), and screenshot URL
- **Features**: Component-based testing, robust URL validation, error handling, progress logging, 24-hour caching, screenshot capture
- **URL Validation**: Enhanced validation requires proper domain extensions, rejects incomplete URLs
- **Caching**: Results cached for 24 hours per URL - use `forceRescan: true` to bypass

#### Screenshot Endpoint (`src/app/api/screenshot/route.ts`)
- **Endpoint**: `POST /api/screenshot`
- **Parameters**:
  - `url` (required): The URL to capture
- **Response**: JSON with screenshot URL and metadata
- **Features**: Fast screenshot capture, Vercel Blob storage, full-page screenshots
- **Storage**: Screenshots stored in Vercel Blob with public access
- **Format**: PNG format, 1920x1080 viewport, full-page capture

#### Reports Gallery (`src/app/reports/page.tsx`)
- **Endpoint**: `/reports` - Gallery view of all completed analyses
- **Features**: Responsive grid layout, score badges, statistics dashboard
- **Report Cards**: Screenshots (with elegant fallbacks), page titles, URLs, dates, grades
- **API Integration**: Uses `/api/reports` endpoint for data fetching
- **Navigation**: Accessible via "View All Reports" in main header
- **Error Handling**: Loading states, error states, empty states
- **Screenshot Fallbacks**: Beautiful placeholder when screenshots unavailable

### Frontend Components
- **Main Page** (`src/app/page.tsx`): URL input and results display with proper API response handling
- **AnalysisResults** (`src/components/AnalysisResults.tsx`): Comprehensive results display with score badges
- **UrlInput** (`src/components/UrlInput.tsx`): Enhanced URL validation and submission form with domain extension requirements
- **Individual Reports** (`src/app/reports/[id]/page.tsx`): Enhanced with schema.org data for branded report titles (e.g., "Stripe Landing Page Report")

## Current Status

✅ **Complete**: Full analysis functionality with frontend integration
- All 6 analysis modules implemented and tested
- API endpoint working with component-based testing
- Frontend properly displaying analysis results
- Enhanced URL validation preventing incomplete URLs
- Comprehensive test coverage across all modules
- Robust error handling and fallback systems
- **Reports Gallery Page** - Browse all completed analyses with thumbnails and scores

### Recent Updates Applied
- ✅ Enhanced URL validation (client & server-side) - rejects incomplete URLs like "https://stripe"
- ✅ Added comprehensive test coverage for URL validation scenarios
- ✅ Fixed Lighthouse dynamic import error in Next.js environment
- ✅ Resolved API response structure mismatch (wrapped vs direct analysis data)
- ✅ Updated CTA field mapping (isAboveFold, actionStrength display)
- ✅ Corrected page speed metrics display units (ms instead of seconds)
- ✅ Social proof detection module completed with full functionality
- ✅ **Schema.org JSON-LD Integration** - Enhanced page metadata extraction with organization/website data
- ✅ **Branded Report Titles** - Individual reports now use organization names from schema data (e.g., "Stripe Landing Page Report")
- ✅ **Database Schema Enhancement** - Added `schema_data` JSONB field with GIN indexing
- ✅ **Comprehensive Test Coverage** - Updated all tests for schema functionality including error handling

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

# Force rescan (bypass 24-hour cache)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "forceRescan": true}'

# Force rescan with component testing
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "whitespace", "forceRescan": true}'

# Capture screenshot only (for quick preview)
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Real-World Testing Results
- **GMB.io Analysis**: 95/100 (Grade A) - LCP: 924ms, FCP: 332ms, CLS: 0
- **Performance**: ~3-8 seconds for full analysis on typical landing pages
- **Reliability**: Robust fallback system ensures analysis completion even when Lighthouse fails

## Next Steps

### Phase 1: Core Enhancement (High Impact)
✅ Add database storage for analysis results  
✅ Consider email report generation functionality
✅ Enhance scoring algorithms and recommendation quality

### Phase 2: Advanced Analysis Modules (Based on Research Insights)

#### New Critical Analysis Areas
1. **Value Proposition Clarity Analysis** - The #1 conversion principle
   - Headline clarity scoring using NLP
   - Above-the-fold benefit vs feature language ratio
   - Time-to-comprehension analysis
   - Unique value proposition detection and strength scoring

2. **Psychological Trigger Detection** - Research shows massive conversion lifts
   - Countdown timer detection and effectiveness scoring
   - Scarcity language analysis ("Only X left", "Limited time")
   - Authority signals (awards, certifications, expert endorsements)
   - Reciprocity elements (free tools, valuable content)

3. **Form Optimization Analysis** - Critical conversion point
   - Form field count and complexity analysis
   - Progressive disclosure detection
   - Mobile form usability scoring
   - Trust signals near forms (security badges, privacy policies)

4. **Mobile-First Conversion Analysis** - 27% improvement potential identified
   - Mobile CTA accessibility (thumb-friendly zones)
   - Mobile-specific conversion barriers
   - Touch target sizing and spacing
   - Mobile checkout flow analysis

#### Enhanced Existing Modules
5. **Advanced CTA Psychology Analysis**
   - Color psychology scoring (contrast, emotional impact)
   - Action word strength analysis ("Get" vs "Download" vs "Start Free Trial")
   - Fitts' Law compliance (size, distance from attention points)
   - Multiple CTA strategy evaluation (primary vs secondary actions)

6. **Intelligent Social Proof Quality Scoring**
   - Recency analysis (fresh testimonials score higher)
   - Specificity scoring (detailed vs generic testimonials)
   - Visual social proof effectiveness (faces, logos, numbers)
   - Placement optimization analysis

7. **Conversion-Focused Image Analysis**
   - Lifestyle vs product imagery ratio
   - Emotional resonance scoring using AI vision models
   - Hero image conversion effectiveness
   - Product visualization quality for e-commerce

### Phase 3: Advanced Intelligence Features

8. **Industry-Specific Scoring Models**
   - Dynamic scoring weights based on detected industry
   - SaaS-specific metrics (demo requests, trial conversions)
   - E-commerce-specific metrics (cart analysis, checkout flow)

9. **AI-Powered Copy Effectiveness Analysis**
   - Benefit vs feature language analysis
   - Emotional vs rational appeal balance
   - Reading level and clarity scoring
   - Persuasion technique detection (social proof, authority, etc.)

10. **Conversion Probability Prediction Engine**
    - Machine learning model trained on conversion data
    - Weighted scoring based on impact research
    - Confidence intervals and improvement recommendations

11. **Competitive Intelligence Integration**
    - Compare against industry benchmarks
    - Identify best practices from top performers
    - Gap analysis against market leaders

12. **A/B Test Recommendation Engine**
    - Prioritized test suggestions based on potential impact
    - Specific copy/design variations to test
    - Expected improvement ranges based on research data

### Phase 4: User Experience Enhancements

13. **Visual Heatmap Predictions**
    - Predict user attention patterns using design principles
    - Identify missed opportunities in prime real estate
    - Suggest optimal element placement

14. **Conversion Funnel Analysis**
    - Multi-page journey analysis
    - Drop-off point identification
    - Cross-page consistency scoring

15. **Real-Time Improvement Previews**
    - Show before/after mockups of suggested changes
    - Visual recommendations with design examples
    - Impact estimation for each suggested improvement

### Research Foundation
These enhancements are based on analysis of high-performing landing pages and industry research showing specific tactics that drive 18-277% conversion improvements. The goal is to transform the analyzer from a technical audit tool into a comprehensive conversion optimization consultant.

## Development Notes
- Assume server is already running

### Puppeteer Configuration
**IMPORTANT**: Always use the `createPuppeteerBrowser()` function from `src/lib/puppeteer-config.ts` instead of directly importing Puppeteer. This ensures:
- Consistent browser configuration across all analysis modules
- Proper handling of production vs development environments
- Centralized browser settings and error handling
- When writing tests, mock `../puppeteer-config` module, not the raw `puppeteer` module

```typescript
// ✅ Correct - Use puppeteer-config
import { createPuppeteerBrowser } from './puppeteer-config';

// ❌ Incorrect - Don't use direct puppeteer import
import puppeteer from 'puppeteer';
```