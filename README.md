# Landing Page Report

Check the quality of your vibe coded landing page and make sure your visitors convert to users. The Landing Page Report provides improvement recommendations.

## Project Overview

This is the Landing Page Report project. Users submit URLs for analysis against 6 key criteria and receive detailed reports via email.

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

## API Usage

### Main Analysis Endpoint
```bash
# Analyze a landing page
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Force rescan (bypass 24-hour cache)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "forceRescan": true}'

# Test specific component only
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "component": "speed"}'
```

Available components: `speed`, `fonts`, `images`, `cta`, `whitespace`, `social`

### Screenshot Endpoint
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Analysis Criteria (6 key areas)

1. **Page Load Speed** - Core Web Vitals and performance analysis
2. **Font Usage** - Font family optimization and consistency
3. **Image Optimization** - Format, sizing, and accessibility analysis
4. **CTA Analysis** - Call-to-action detection and scoring
5. **Whitespace and Clutter Assessment** - Layout density analysis
6. **Social Proof Detection** - Credibility elements identification

## Architecture

### Project Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── reports/            # Report pages
│   └── api/                # API routes
├── components/             # Reusable components
├── lib/                    # Utilities and configurations
└── types/                  # TypeScript type definitions
```

### Key Files
- **Analysis orchestrator**: `src/app/api/analyze/route.ts`
- **Analysis modules**: `src/lib/*-analysis.ts`
- **Screenshot service**: `src/lib/screenshot-storage.ts`
- **Metadata extraction**: `src/lib/page-metadata.ts`
- **Database schema**: `src/types/database.ts`

## Development Notes

### Puppeteer Configuration
Always use `createPuppeteerBrowser()` from `src/lib/puppeteer-config.ts` for consistent browser configuration across environments.

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Deployment

The project is optimized for Vercel deployment with serverless functions. Key environment variables for production:

- `BLESS_KEY`: Browserless.io API key for reliable Chrome browser access
- Supabase URLs and keys
- Resend API key for email functionality

For more detailed technical documentation, see `CLAUDE.md`.