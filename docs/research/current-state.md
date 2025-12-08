# Current State

This summarizes how the analysis works today, based on the code in `src/app/api/analyze/route.ts` and `src/lib/*`.

## High-level flow
1. POST `POST /api/analyze`
   - Parse body: `{ url, component?, email?, forceRescan?, forceBrowserless? }`
   - Validate URL (protocol http/https, hostname contains a dot)
   - Extract page metadata via `extractPageMetadata()` (title, description, schema JSON-LD)
   - Create/find `users` record; create `analyses` record in `processing` state
   - Cache check (24h by URL, independent of user); return cached record if fresh
   - Capture full-page screenshot and update `analyses.screenshot_url`
   - Lazily create a shared Puppeteer browser (honors `forceBrowserless`) and reuse it across all module runs; close it before responding, even on errors
   - Run modules (serially in current route): page speed, fonts, images, CTA, whitespace, social
   - Compute overall weighted score
   - Update `analyses` with per-module results and overall score; set `status=completed`
   - Respond with analysis payload + `analysisId`, `fromCache`

2. Screenshot `POST /api/screenshot` captures and stores a full-page image in Vercel Blob.

## Modules
- Page Speed (`src/lib/page-speed-analysis.ts`)
  - Puppeteer-based performance sampling (`page-speed-puppeteer.ts`)
  - Metrics approximations: LCP, FCP, CLS, TBT, size, resource count
  - Converts to marketing-friendly metrics; returns `score`, `issues`, `recommendations`, `loadTime`
- Fonts (`src/lib/font-analysis.ts`)
  - Counts unique `font-family` declarations; classifies system vs web fonts
  - Returns `score`, `fontFamilies`, counts, `issues`, `recommendations`
- Images (`src/lib/image-optimization.ts`)
  - Extracts `<img>` info; evaluates format, alt text, sizing; returns weighted `score`, counts, `issues`, `recommendations`
  - If no images: returns `score=100` plus a recommendation to consider adding images
- CTA (`src/lib/cta-analysis.ts`)
  - Detects actionable elements; deduplicates; selects primary CTA; evaluates above-fold, action strength, visibility
  - Returns `score`, `ctas[]`, `primaryCTA`, `issues`, `recommendations`
- Whitespace (`src/lib/whitespace-assessment.ts`)
  - Grid-based density + spacing analysis + screenshot pixel whitespace
  - Returns `score`, `metrics`, `issues`, `recommendations`, `loadTime`
- Social Proof (`src/lib/social-proof-analysis.ts`)
  - Detects testimonials, reviews, trust badges, logos, counts; dedupes; returns `score`, `elements[]`, `summary`, `issues`, `recommendations`

## Scoring
- Weights (in route): speed 0.25, CTA 0.25, social 0.20, whitespace 0.15, images 0.10, fonts 0.05
- Overall score = weighted average over available module scores (based on defined `score` fields)

## Component-based runs
- Request can specify `component`. The route checks for names: `speed|pageSpeed`, `font`, `image`, `cta`, `whitespace|spacing`, `social|socialProof`.
- Note: docs reference `fonts` and `images`, but the route expects singular for these checks.

## Caching
- 24-hour cache by URL (latest completed analysis reused unless `forceRescan`)
- If cached record lacks screenshot, a new screenshot is captured and the record is updated

## Database writes (selected)
- `analyses`: `page_speed_analysis`, `font_analysis`, `image_analysis`, `cta_analysis`, `whitespace_analysis`, `social_proof_analysis`, `overall_score`, `screenshot_url`, timestamps
- `schema_data` is stored from `extractPageMetadata()`

## Known constraints
- Modules run sequentially in `route.ts`; a shared Puppeteer instance reduces launch overhead but analysis is still serialized
- Mixed result contracts across modules (time/confidence not uniform)
- Component filter names mismatched vs docs
- Heuristics uncalibrated (e.g., whitespace pixel threshold, CLS/TBT approximations)
