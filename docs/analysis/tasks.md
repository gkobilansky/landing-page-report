# Tasks (Handoff-Ready)

Concise, actionable tasks grouped by phase. Each task has acceptance criteria.

## Phase 1: Consistency and correctness
- Task: Remove letter grade usage across API/UI/DB writes
  - Change: Remove `grade` fields from module outputs and overall; stop writing `grade` to DB; update UI to show numeric scores only; update tests
  - Acceptance: `grade` absent in API responses; UI not expecting grades; DB writes omit or nullify `grade`; tests updated
- Task: Normalize component names in API
  - Change: Map canonical names `speed|fonts|images|cta|whitespace|social` and synonyms to the checks in `src/app/api/analyze/route.ts`
  - Acceptance: Unknown component returns 400; selective run executes only requested module(s)
- Task: Overall score computation for selective runs
  - Change: Only include executed/applicable modules in weight sum; omit overallScore when a single component is run (or return with flag `partial=true`)
  - Acceptance: Unit tests cover selective runs; weighted average excludes NA modules
- Task: Standardize module outputs (interim)
  - Change: Ensure each module returns `loadTime`; remove `grade` from outputs; images return `applicable=false` if `totalImages===0` and `score=null`
  - Acceptance: Response schema includes these fields; tests updated
- Task: Harden error handling
  - Change: Wrap `analyzeFontUsage` and others in try/catch in route; on error, set zero score and add error to `issues`
  - Acceptance: API doesn’t fail on single module error; error is visible in output

## Phase 2: Performance and orchestration
- Task: Single Puppeteer session in route
  - Change: Initialize one browser/page; pass `page` to modules that can accept it (add overloads)
  - Acceptance: Fewer concurrent browser instances; runtime decreases in local tests
- Task: Parallel execution
  - Change: Run independent modules in `Promise.all`; sequence only where necessary
  - Acceptance: No race conditions; same outputs; runtime reduced
- Task: Desktop + mobile view for CTA/social
  - Change: Add mobile viewport pass; union results; add `device` markers in evidence
  - Acceptance: Mobile-only CTAs/social are detected; output reflects device
- Task: Reuse screenshot
  - Change: Pass captured screenshot URL to whitespace; avoid double captures
  - Acceptance: Only one screenshot per run

## Phase 3: Rigor and explainability
- Task: Evidence structures for CTA/social
  - Change: Include selector, bbox, text snippet; optional cropped image (derived from screenshot)
  - Acceptance: Evidence present for at least top elements; UI can display
- Task: Confidence scoring
  - Change: Compute per-module confidence (0–1) based on coverage/timeouts/retries; include in outputs
  - Acceptance: Confidence present; low-confidence paths documented
- Task: Whitespace threshold calibration
  - Change: Sample luminance; set threshold adaptively; expose chosen threshold
  - Acceptance: Dark-theme pages no longer flagged as cluttered incorrectly
- Task: Image rigor
  - Change: Check `width/height` attrs, `loading`, `srcset/sizes`; include in issues/recommendations
  - Acceptance: Tests cover these flags

## Phase 4: Storage and analytics
- Task: Persist per-module config/version/confidence/time_ms
  - Change: Extend `analyses` JSONB structures; store `module_version`, `config`, `confidence`, `time_ms`
  - Acceptance: Data visible in DB; migration added; indexes updated
- Task: Issue taxonomy
  - Change: Structure issues as `{ code, severity, message, targets, rationale }`; add GIN index
  - Acceptance: Queries by `code`/`severity` are performant; sample analytics query documented

## Phase 5: Docs and tests
- Task: Update docs to reflect canonical component names and behaviors
  - Change: Keep `docs/analysis/*` current; link from README
  - Acceptance: Docs describe current system accurately
- Task: Add unit/E2E tests
  - Change: Tests for mapping, weighting, grading; fixtures for CTA/social/whitespace
  - Acceptance: Green CI; coverage includes new logic 