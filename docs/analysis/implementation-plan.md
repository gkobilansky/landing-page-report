# Implementation Plan

Phased approach to improve consistency, informativeness, rigor, and performance.

## Phase 1: Consistency and correctness
- Standardize component names and selective runs
  - Accept canonical names: `speed`, `fonts`, `images`, `cta`, `whitespace`, `social` (map synonyms)
  - For selective runs, compute overall score from executed modules only; omit or flag overallScore when single-component
- Remove letter grades across system
  - Remove grade fields from API responses and UI; stop writing `grade` to DB (set null/omit)
  - Prefer numeric scores; if needed later, map in presentation-only without persisting
- Normalize module contracts to a shared shape (interim)
  - Ensure each module returns: `score`, `issues[]`, `recommendations[]`, `loadTime`
  - Treat “N/A” modules (e.g., no images) as `applicable=false` with `score: null` and exclude from weights
- ✅ Harden error handling
  - Wrap every module in try/catch; on failure return zero score, error issue, and `confidence=0` later

Acceptance criteria:
- Component-only requests don’t include non-executed modules in weights
- Grades removed from API responses/UI; DB no longer written for `grade`
- All modules include `loadTime` in outputs
- No module failure crashes the route; a clear error issue is returned

## Phase 2: Performance and orchestration
- Single-browser session; pass `page` to modules
- Parallelize module execution where safe; run desktop + mobile for CTA/social proof (configurable)
- Reuse captured screenshot for whitespace and for evidence crops

Acceptance criteria:
- Analysis runtime reduced significantly; fewer Browserless/local launches
- Desktop/mobile configuration surfaced in response and stored in DB
- Whitespace uses provided screenshot (no duplicate capture)

## Phase 3: Rigor and explainability
- Page speed: improve approximations; optional Lighthouse/PSI fallback when key available
- CTA/social: add evidence structures (selector, bbox, text), better above-fold via IntersectionObserver, Fitts’ Law heuristics
- Images: mark N/A; add checks for `width/height` attrs, `loading=lazy`, `srcset/sizes`
- Whitespace: auto-calibrate pixel threshold using luminance sampling; cross-check DOM and visual estimates
- Add `confidence` (0–1) per module based on signals (timeouts, visibility coverage, consistency)

Acceptance criteria:
- Responses include evidence objects where applicable and `confidence`
- Thresholds and reasons are visible in metrics/details

## Phase 4: Storage and analytics
- Persist per-module: `version`, `config`, `time_ms`, `confidence`, normalized `issues` with `code`, `severity`, `message`, `targets`, `rationale`
- Add JSONB indexes for issues; add `algorithm_version` and `module_config` footprint

Acceptance criteria:
- DB records support querying issues by code/severity and aggregations
- Runs are reproducible given stored config

## Phase 5: Documentation and tests
- Update docs (this folder) continuously; ensure docs match canonical component names and behavior
- Unit tests for component mapping, weighting logic, and grading
- E2E tests on fixture pages for CTA/social/whitespace regressions

Acceptance criteria:
- Green test suite covering new logic; docs up-to-date with implementation 