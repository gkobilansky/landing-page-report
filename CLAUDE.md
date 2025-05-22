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
1. Page Load Speed (Lighthouse metrics)
2. Font Usage (max 2-3 families)
3. Image Optimization (formats, sizes)
4. Clear Single CTA Above Fold
5. Whitespace and Clutter Assessment
6. Social Proof Detection

### Database Schema
- **Table**: `landing_page_analyses`
- **Primary Key**: UUID with auto-generation
- **Analysis Fields**: JSONB fields for each of the 6 criteria
- **Features**: Timestamps, RLS policies, indexes for performance

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
  - ✅ API route for URL analysis (`/api/analyze`)
  - ✅ Base analysis engine structure (`src/lib/analyzer.ts`)
  - 🚧 Individual criteria implementation:
    1. ⏳ Page Load Speed analysis (Lighthouse integration)
    2. ⏳ Font Usage analysis (max 2-3 families detection)
    3. ⏳ Image Optimization analysis (format, alt text, size)
    4. ⏳ Clear Single CTA Above Fold analysis
    5. ⏳ Whitespace and Clutter Assessment
    6. ⏳ Social Proof Detection (testimonials, reviews, trust badges)
  - ⏳ Database integration for storing results
  - ⏳ Analysis engine integration with API route

## Deployment Configuration

### Production Environment
- **Target**: Subdomain of lansky.tech (e.g., analyzer.lansky.tech)
- **Platform**: Vercel (recommended for Next.js)
- **Database**: Supabase (production instance)
- **Email Service**: Resend or SendGrid for report delivery