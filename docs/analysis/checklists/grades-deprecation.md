# Grades Deprecation Checklist

Goal: Remove letter grades (A–F) across the system in favor of numeric scores only.

Scope
- Backend: API responses, module outputs, DB writes
- Frontend: UI rendering and any derived letter-grade logic
- Database: schema usage and migrations plan
- Tests & docs

Pre-flight
- Align on decision with FE/BE and data stakeholders
- Confirm no external API consumers depend on `grade`

Step-by-step

1) Inventory and search
- Search for usage of `grade` in codebase
  - API: `src/app/api/analyze/route.ts`
  - Modules: `src/lib/page-speed-analysis.ts`, `src/lib/whitespace-assessment.ts`
  - UI: `src/components/AnalysisResults.tsx` (e.g., `getScoreGrade`, any grade display)
  - Types: `src/types/database.ts`, any shared analysis types
  - Migrations: `supabase/migrations/*` where `grade` appears
  - Tests: `src/**/__tests__/**`

2) Backend changes
- API route `src/app/api/analyze/route.ts`
  - Remove reading/writing of `grade` in the DB update
  - Remove `grade` from the API response payload, both overall and per-module (if present)
- Modules
  - `src/lib/page-speed-analysis.ts`: drop `grade` from the result type and return value
  - `src/lib/whitespace-assessment.ts`: drop `grade` from the result type and return value
  - Ensure all modules still return `score` and `loadTime` (keep metrics/issues/recommendations intact)
- Types
  - Update shared types to remove `grade` from module result shapes

3) Frontend changes
- `src/components/AnalysisResults.tsx`
  - Remove `getScoreGrade` utility and any letter-grade presentation
  - Keep color/visual mapping based on numeric `score`
  - Ensure no component expects a `grade` field from API

4) Database
- Writes: Stop writing `grade` in `analyses` records immediately
- Migration strategy
  - Step 1: Keep `grade` column for one or two releases (backward compatibility)
  - Step 2: Add a migration to drop `grade` column once all code and data paths are verified (optional)
- Types
  - Update `src/types/database.ts` to mark `grade` as deprecated/optional or remove once column is dropped

5) Tests
- Update unit/E2E tests to remove expectations for `grade`
- Adjust fixtures/snapshots accordingly

6) Documentation
- Update `docs/analysis/*` to reflect removal of letter grades
- Add note in changelog/release notes: "Removed letter grade fields from API/UI; use numeric scores"

7) Verification
- Local and staging checks
  - API responses do not include `grade` fields
  - DB writes omit `grade`
  - UI renders correctly with numeric scores only
- Monitor errors/logs after deploy (API/UI) for any regressions

8) Rollback plan
- Since the `grade` column remains initially, rollback is simple:
  - Revert code changes to previous commit
  - No schema rollback needed if the column wasn’t dropped yet
- If the column was dropped already, keep a reversible migration ready

Done criteria
- No `grade` field in API responses or UI
- No code path writes `grade` to DB
- Tests green; docs updated
- Optional: `grade` column removed in DB after a safe window 