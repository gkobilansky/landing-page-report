# CTA Analysis Refactor Plan

Goal: Make CTA identification and analysis more accurate, DRY, and maintainable by unifying candidate detection, improving feature extraction, clarifying heuristics, and strengthening tests.

Scope: Refactor `src/lib/cta-analysis.ts` and `src/lib/cta-dictionary.ts` plus related types/tests, without changing public API shapes returned by the analyze endpoint (unless noted under breaking changes).

## Key Objectives
- Unify candidate selection and classification into a single pipeline inside `page.evaluate`.
- Separate concepts: action strength vs incentives vs urgency.
- Add destination and state features (e.g., `href`, `disabled`, `aria-*`, `tabindex`).
- Improve context detection, visibility heuristics, and mobile readiness checks.
- Make dictionary checks token/word-boundary aware and data‑driven.
- Keep logic DRY with shared helpers and consistent filtering across passes.
- Strengthen tests and provide clear acceptance criteria for each change.

## Deliverables
- Updated `cta-analysis.ts` with a single, DRY evaluation/classification pipeline.
- Updated `cta-dictionary.ts` with improved categories and boundary-aware checks.
- Extended `CTAElement` type with destination/state fields.
- Revised scoring and dedupe logic.
- Tests for dictionary utils and CTA extraction/classification.
- Documented recommendations mapping and migration notes.

## Ground Rules
- TypeScript strict, keep `@/*` imports.
- No real network/IO in tests; use mocks/fixtures.
- Avoid feature creep; keep unrelated changes out of scope.
- Preserve current exported function names unless noted.

---

## Task Breakdown (hand-off ready)

Each task lists: Description, Steps, Acceptance Criteria (AC), and Dependencies (Deps).

### Task 1: Baseline & Safety Net
- Description: Capture current behavior and ensure a safe refactor landing.
- Steps:
  - Run `npm run lint && npm run type-check && npm test` to confirm green.
  - Create 3–5 HTML fixtures representing common patterns (hero primary+secondary, form submit, nav-heavy, ghost buttons).
  - Add a simple snapshot test recording the current number and rough shape of CTAs per fixture (to compare deltas intentionally).
- AC:
  - Tests pass and baseline snapshots are committed.
- Deps: None.

### Task 2: Extend Types (`CTAElement`)
- Description: Add destination/state fields needed by scoring and filtering.
- Steps:
  - Update `CTAElement` to include:
    - `href?: string`, `role?: string`, `disabled?: boolean`, `ariaDisabled?: boolean`, `tabIndex?: number | null`, `target?: string | null`, `rel?: string | null`.
    - Optionally `containerSelector?: string` for debugability.
  - Ensure serialization from `page.evaluate` includes these fields.
- AC:
  - Type-check passes; updated type used end-to-end.
- Deps: Task 1.

### Task 3: Dictionary Overhaul & Matching Utilities
- Description: Reorganize dictionary categories and make matching boundary-aware.
- Steps:
  - Split categories:
    - ACTION_VERBS (strong/medium/weak), INCENTIVES, URGENCY, NAVIGATION_WORDS/PHRASES, PRIMARY_CTA_PHRASES, PRIMARY_CTA_CLASSES.
  - Implement a boundary-aware matcher (e.g., build regex with `\b` for single words; phrase-safe matching for multi-words).
  - Remove treating “free/trial” as action words; keep in INCENTIVES.
  - Expand phrases: “Talk to sales”, “Schedule a demo”, “View plans”, “Get a quote”, “Book a call”, “Start for free”.
- AC:
  - New helpers exported; unit tests cover word-boundary and phrase cases.
- Deps: Task 1.

### Task 4: Unified Candidate Collection & Classification
- Description: Replace dual-pass queries with a single consolidated pipeline.
- Steps:
  - In `page.evaluate`, collect candidates with a consolidated selector: `a[href], button, input[type="submit"], [role="button"]`.
  - For each element, extract features once: text (normalized), href, rect, computed style, attributes, context.
  - Apply consistent filters (names, logos, navigation, decorative) exactly once.
  - Classify `type` via a `classifyCTA(element, features)` function.
  - Remove the secondary “additionalClickableElements” pass.
- AC:
  - Only one pass builds CTAs; code duplication removed; tests pass.
- Deps: Tasks 2–3.

### Task 5: Context Detection Refinement
- Description: Reduce false hero classification; improve header/footer/sidebar detection.
- Steps:
  - Mark ‘hero’ when inside hero-like containers OR near-top container with h1/h2 + supporting copy.
  - Default body CTAs to ‘content’; do not promote to ‘hero’ based solely on Y position.
  - Keep explicit header/footer/nav detections as-is but harden selectors (common class substrings: `nav`, `menu`, `header`, `footer`).
- AC:
  - Fixtures classify hero vs content more accurately; unit tests reflect rules.
- Deps: Task 4.

### Task 6: Visibility & Mobile Heuristics
- Description: Strengthen visibility score and realistic mobile readiness.
- Steps:
  - Replace `parseInt(computedStyle.padding)` with per-side paddings and min tap target via `rect`.
  - Consider border presence, font-weight, text-transform, and background/border for ghost buttons.
  - Above-the-fold: use midpoint rule `rect.top + rect.height/2 <= viewport.height`.
  - Mobile: compute using `rect` thresholds regardless of viewport; optionally add a second mobile viewport pass behind a flag.
- AC:
  - Visibility buckets stable across fixtures; mobile AC: ≥44x44 and font-size ≥16px reported correctly.
- Deps: Task 4.

### Task 7: Action Strength, Urgency, Incentives Separation
- Description: Make semantics precise and non-overlapping.
- Steps:
  - Action strength: verbs only.
  - Urgency: time/availability only (e.g., now, today, ends, expires, limited).
  - Incentives: free, trial, demo, no credit card.
  - Update analysis functions and tests.
- AC:
  - No incentive words counted as urgency; tests pass.
- Deps: Task 3.

### Task 8: Primary CTA Selection & Scoring Rewrite
- Description: Score based on features rather than selector bias.
- Steps:
  - Factors: hero/content context, above-the-fold, visual prominence, action strength, incentives (bonus), urgency (small bonus), destination intent (`href` contains signup/checkout/cart/demo/pricing/quote), and disabled states (penalty).
  - Detect paired hero CTAs and prefer the more prominent/strong-verb as primary; mark the sibling as secondary.
  - Remove `cta.text.includes('checkout'|'purchase'|'cart')` misuse; use `href` and text phrases instead.
- AC:
  - Primary selection matches expectations in fixtures; scoring function unit tested.
- Deps: Tasks 2, 4–7.

### Task 9: Dedupe & Instance Preference
- Description: Smarter textual dedupe and choose the most prominent instance.
- Steps:
  - Normalize text (lowercase, collapse spaces, strip punctuation).
  - Use a simple similarity metric (e.g., Jaccard or normalized Levenshtein threshold) to group.
  - When duplicates exist, keep the instance with higher prominence (visibility score, above-fold, hero context).
- AC:
  - “Get started” vs “Get started – it’s free” dedupes sensibly; tests cover it.
- Deps: Task 6.

### Task 10: Consistent Navigation/Logo Filtering
- Description: Apply the same filters to all candidates.
- Steps:
  - Ensure navigation/brand/decorative filters run in the unified pipeline for every element.
  - Expand navigation words to include common header items (pricing, features, solutions) unless styled as buttons in hero/content.
- AC:
  - “Learn more” and “Pricing” in header nav do not count; styled hero buttons can still pass.
- Deps: Task 3, 4.

### Task 11: Recommendations Mapping
- Description: Make recommendations specific and actionable per CTA.
- Steps:
  - Map detected issues to prescriptive recommendations (e.g., low visibility → increase padding ≥12px, min-height ≥40px, contrast ≥4.5:1).
  - Attach recommendations to specific CTA instances (by text + context + position).
- AC:
  - Output includes targeted recommendations; unit tests cover mapping.
- Deps: Tasks 6–8.

### Task 12: Error Handling & Performance
- Description: Hardening and guardrails.
- Steps:
  - Keep `try/catch` around `page.evaluate`; limit per-page candidates to a safe maximum (e.g., 300) to avoid pathological DOMs.
  - Ensure browser/page always closes (finally blocks); keep regex serialization logic for patterns.
  - Add minimal logging breadcrumbs; avoid noisy console in production path.
- AC:
  - Graceful failure returns empty result with issue noted; no resource leaks in errors.
- Deps: Task 4.

### Task 13: Tests & Fixtures
- Description: Build confidence via targeted tests.
- Steps:
  - Unit tests for dictionary matchers and scoring.
  - JSDOM tests for classification given HTML fixtures (no Puppeteer needed for most cases).
  - If needed, one integration test using mocked Puppeteer page/evaluate to ensure serialization works.
- AC:
  - `npm test` green with coverage over modified code paths; fixtures stored under `src/lib/__tests__/fixtures/`.
- Deps: Tasks 1–11.

### Task 14: Docs & Migration Notes
- Description: Update docs and call out changes.
- Steps:
  - Document new fields on `CTAElement` and scoring rules in `docs/analysis/module-analysis.md`.
  - Note breaking changes (if any) and how UI consumers should adapt.
- AC:
  - Docs updated; reviewers can understand new logic quickly.
- Deps: Tasks 2, 8.

---

## Suggested PR Sequence
1) Task 1–3: Baseline, Types, Dictionary utilities.
2) Task 4–6: Unified pipeline, context, visibility/mobile.
3) Task 7–8: Semantics separation and scoring.
4) Task 9–11: Dedupe, filtering consistency, recommendations.
5) Task 12–14: Hardening, tests, docs.

## Validation Checklist (per PR)
- `npm run lint && npm run type-check && npm test` passes.
- Added/updated tests for changed logic.
- Manual check against fixtures: primary/secondary classification looks sensible.
- No regressions in API shape unless explicitly approved.

## Risks & Mitigations
- Over-filtering legitimate CTAs: Keep fixtures diverse and iterate thresholds conservatively.
- Locale variance: Keep dictionary extensible; limit to English for now.
- Visual heuristics brittleness: Prefer simple, explainable signals; avoid overly complex contrast calc unless needed.

## Out of Scope (for this refactor)
- Non-English dictionaries and locale detection.
- Full color contrast computation against computed backgrounds.
- Heuristic tuning via ML/telemetry.

## Notes for a Fresh Agent Session
- Start with Task 1 to capture baseline behavior and fixtures.
- Work task-by-task; do not mix unrelated changes across PRs.
- Ask for sample real-world pages to add as fixtures if available.
- Keep helpers pure and small; prefer data-driven lists over ad-hoc conditionals.

