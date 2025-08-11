# Roadmap

This roadmap separates what exists today from planned improvements. For background see `PRD.md` and `CLAUDE.md`.

## Current (as-is)
- Modules: page speed, fonts, images, CTA, whitespace, social proof
- API: `POST /api/analyze` orchestrates modules sequentially, writes to Supabase
- Screenshot capture via Vercel Blob; metadata extraction with JSON-LD parsing
- Weights hard-coded in API route; overall grade uses page speed's grade
- 24h caching by URL; screenshot captured on demand for cache records without one

## Near-term (Phase 1–2)
- Align component names; compute overall only from executed/applicable modules
- Single-browser session; run modules in parallel where safe
- Remove letter grades; normalize outputs (score, loadTime)
- Harden error handling; consistent fallbacks

## Mid-term (Phase 3–4)
- Rigor: evidence objects, confidence scoring, improved heuristics (CTA/social/whitespace)
- Page speed: better approximations; optional Lighthouse/PSI fallback
- Storage: issue taxonomy in JSONB (code, severity, targets), per-module config/version/confidence

## Long-term (Phase 5+)
- Industry-specific weights and detection; mobile-first deep dives
- Advanced modules from PRD (value proposition clarity, psychological triggers, forms, mobile conversion, copy effectiveness)
- A/B recommendations and benchmarking; analytics dashboard based on issue taxonomy

## Milestones
- M1: Consistency fixes merged; tests pass; docs updated
- M2: Single-browser orchestration; parallelized modules; speed improvements
- M3: Evidence-rich outputs and confidence; storage schema extended
- M4: Lighthouse integration path; industry profiles 