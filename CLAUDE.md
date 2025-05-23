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
1. Page Load Speed (Lighthouse metrics) - *In development*
2. **Font Usage** - ✅ *Production ready*
   - Perfect score (100) for ≤2 font families
   - Good score (85) for 3 font families  
   - Penalized (-20 per additional family) for >3 families
   - Correctly handles CSS font stacks as single families
3. **Image Optimization** - ✅ *Production ready*
   - Modern format scoring (WebP/AVIF vs legacy)
   - Alt text validation for accessibility
   - Image sizing analysis (oversized detection)
4. **CTA Analysis** - ✅ *Production ready*
   - Smart pattern detection (.cta-button, checkout URLs)
   - Price-based prioritization with action word analysis
   - Above-fold positioning and context awareness
   - Intelligent noise filtering (customer names, navigation)
5. Whitespace and Clutter Assessment - *In development*
6. Social Proof Detection - *In development*

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
- **Testing Support**: Dual-mode function accepts both URLs and HTML strings for testing

#### 4. Page Speed Analysis (`src/lib/page-speed-analysis.ts`) - ✅ *Production ready*
- **Purpose**: Comprehensive Core Web Vitals and performance analysis
- **Algorithm**: Smart fallback system - Lighthouse first, then Puppeteer-based analysis
- **Core Metrics**: LCP, FCP, CLS, TBT with native browser Performance APIs
- **Scoring**: 0-100 scale with letter grades (A-F) and performance boost for excellent metrics
- **Real-World Performance**: Successfully tested with GMB.io (95/100, Grade A)
- **Fallback System**: Puppeteer-based analyzer (`src/lib/page-speed-puppeteer.ts`) when Lighthouse fails
- **Server-Side Compatibility**: Handles Next.js environment constraints gracefully
- **Test Coverage**: 9 comprehensive test cases plus live API validation

### API Architecture (`src/app/api/analyze/route.ts`)
- **Endpoint**: `POST /api/analyze`
- **Parameters**: `url` (required), `component` (optional: 'speed'|'pageSpeed'|'cta'|'font'|'image'|'all')
- **Response**: JSON with individual module scores and overall analysis
- **Features**: Component-based testing, error handling, progress logging

## Current Status

✅ **Task 1 Complete**: Next.js project structure with TypeScript
- Next.js 15 with App Router
- TypeScript configuration
- Tailwind CSS setup
- ESLint configuration
- Build system verified

✅ **Task 2 Complete**: Supabase database configuration
- Local Supabase environment running
- `landing_page_analyses` table created with full schema
- Supabase client configuration (`src/lib/supabase.ts`)
- TypeScript types defined (`src/types/database.ts`)
- Environment variables configured for local development

🚧 **Task 3 In Progress**: Core analysis functionality implementation
- **Deployment Target**: Subdomain of lansky.tech
- **Current Goal**: Implement the 6-criteria analysis engine with individual components
- **Analysis Engine Status**:
  - ✅ API route for URL analysis (`/api/analyze`) - URL-only, no email required, component-based testing
  - ✅ Base analysis engine structure (`src/lib/analyzer.ts`)
  - 🚧 Individual criteria implementation:
    1. ✅ **Page Load Speed analysis** - Fully implemented with Lighthouse integration
       - Comprehensive Core Web Vitals analysis (LCP, FCP, CLS, TBT, Speed Index)
       - Letter grade scoring (A-F) with performance boost for excellent metrics
       - Detailed recommendations based on industry-standard thresholds
       - Mobile/desktop throttling support with graceful error handling
       - Dynamic Lighthouse import for Next.js compatibility
       - Component testing via API with `{"component": "speed"}` or `{"component": "pageSpeed"}`
    2. ✅ **Font Usage analysis** - Fully implemented with correct logic
       - Detects unique font-family declarations (not individual fonts in stacks)
       - Scores: ≤2 families = 100pts, 3 families = 85pts, >3 penalized
       - Comprehensive test coverage with real-world examples
       - Progress logging for debugging
    3. ✅ **Image Optimization analysis** - Fully implemented with comprehensive scoring
       - Modern format detection (WebP/AVIF vs JPG/PNG) - 40% weight
       - Alt text validation with accessibility focus - 35% weight
       - Image sizing analysis (detects >2000px oversized images) - 25% weight
       - Handles decorative images and edge cases properly
       - Comprehensive test coverage with real-world scenarios
       - Detailed format breakdown and sizing analytics
    4. ✅ **CTA Analysis** - Production-ready with sophisticated detection and scoring
       - Smart CTA detection using class patterns (.cta-button, checkout URLs)
       - Price-based CTA prioritization ($150, $195 patterns)
       - Action word strength analysis (strong/medium/weak classification)
       - Above-the-fold positioning with viewport simulation
       - Context awareness (hero, header, footer placement)
       - Intelligent deduplication to reduce noise (198→31 unique CTAs)
       - Customer name filtering (removes "John R.", "Maxwell", etc.)
       - Mobile optimization detection
       - Comprehensive test suite with 14 test cases including real-world validation
       - Successfully detects GMB.io target CTA: "$150 – Build Your Physical Autonomy"
    5. ⏳ Whitespace and Clutter Assessment
    6. ⏳ Social Proof Detection (testimonials, reviews, trust badges)
  - ✅ Font analysis integration with API route
  - ✅ Image optimization integration with API route
  - ✅ CTA analysis integration with API route (component testing with `{"component": "cta"}`)
  - ⏳ Database integration for storing results (optional for basic analysis)

## Development Workflow & API Usage

### Component-Based Testing
The API supports selective analysis for faster development and debugging:

```bash
# Test only page speed analysis (Core Web Vitals)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "speed"}'

# Test only CTA analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "cta"}'

# Test only font analysis  
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "font"}'

# Test only image optimization
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "image"}'

# Run all components (default)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Real-World Testing Results
- **GMB.io CTA Analysis**: Successfully detects "$150 – Build Your Physical Autonomy" 
- **Noise Reduction**: 198 raw CTAs → 31 relevant CTAs after filtering
- **GMB.io Page Speed**: 95/100 (Grade A) - LCP: 940ms, FCP: 420ms, CLS: 0
- **Performance**: ~3-8 seconds for full analysis on typical landing pages

## Future Improvements & Ideas

### Planned Enhancements
1. **LLM CTA Validation**: Run detected CTAs through a lightweight LLM (e.g., OpenAI GPT-3.5) to double-check relevance and eliminate false positives
2. **Advanced Whitespace Analysis**: Implement visual density algorithms and whitespace ratio calculations
3. **Enhanced Social Proof Detection**: ML-based testimonial and trust signal recognition
4. **Database Storage**: Optional result persistence for analytics and comparison
5. **Performance Monitoring**: Add historical tracking and Core Web Vitals trending

### Technical Debt
- Add comprehensive error handling for edge cases
- Implement rate limiting for production API
- Add result caching for repeated analysis
- Optimize Puppeteer resource usage and browser instance management

## Deployment Configuration

### Production Environment
- **Target**: Subdomain of lansky.tech (e.g., analyzer.lansky.tech)
- **Platform**: Vercel (recommended for Next.js)
- **Database**: Supabase (production instance)
- **Email Service**: Resend or SendGrid for report delivery