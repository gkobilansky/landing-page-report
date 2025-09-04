# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes (`app/api/*`).
- `src/components`: UI components (`analysis/*`, `ui/*`).
- `src/lib`: Analysis modules (page speed, fonts, images, CTA, whitespace, social), utilities, and orchestrators.
- `src/types`: Shared TypeScript types (e.g., database).
- `public`: Static assets. `supabase/`: local config and SQL.
- `__mocks__`: Jest mocks (e.g., `canvas`, `jimp`).

## Build, Test, and Development Commands
- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Production build.
- `npm start`: Run the built app locally.
- `npm run lint`: Lint with Next.js ESLint config.
- `npm run type-check`: TypeScript compile-time checks.
- `npm test`: Run Jest tests (jsdom env).
- `npm run test:coverage`: Generate coverage report to `coverage/`.
 - Supabase (local): `supabase start` then `supabase migration up` (see `CLAUDE.md`).

## Coding Style & Naming Conventions
- **Language**: TypeScript (strict). Use `@/*` imports per `tsconfig.json`.
- **Linting**: ESLint `next/core-web-vitals`. Fix issues before PRs.
- **Components**: PascalCase files (e.g., `ScoreBar.tsx`).
- **Lib modules**: kebab-case (e.g., `page-speed-analysis.ts`).
- **Tests**: mirror source path in `__tests__` or `*.test.ts(x)` next to files.
- **Styling**: Tailwind CSS (see `src/app/globals.css`). Prefer utility classes over ad‑hoc CSS.

## Testing Guidelines
- **Frameworks**: Jest + Testing Library.
- **Patterns**: `**/__tests__/**/*.(ts|tsx|js)` and `**/*.(test|spec).(ts|tsx|js)`.
- **Coverage**: Collected from `src/**/*.{ts,tsx}`; output in `coverage/`.
- **Mocks**: Heavy/native deps mocked via `__mocks__` and `moduleNameMapper`. Avoid real network/IO in unit tests.
- **Examples**: `src/app/api/analyze/__tests__/route.test.ts` and `src/components/__tests__/AnalysisResults.test.tsx`.
 - **Practice**: Prefer TDD for new features (see `CLAUDE.md` Best Practices).

## Commit & Pull Request Guidelines
- **Commits**: Imperative, scoped, and concise (≤72 chars). Prefer Conventional Commits when possible (e.g., `feat:`, `fix:`, `chore:`) as seen in history (`feat: implement adaptive threshold...`).
- **PRs**: Include a clear description, linked issues, and screenshots/recordings for UI changes. Note new env vars or migrations. Ensure CI essentials pass locally: `npm run lint && npm run type-check && npm test`.

## Security & Configuration Tips
- Use `.env.local` (see `.env.local.example`). Do not commit secrets. Common keys: Supabase, Resend, Vercel Blob.
 - Production browsing uses Browserless; set `BLESS_KEY` on Vercel (see `vercel.json` and `CLAUDE.md`).
 - Puppeteer and image libs are mocked in tests; keep tests deterministic. For data writes or external calls, add server-side guards and input validation.

## Architecture Notes
- Orchestrator: `src/app/api/analyze/route.ts` calls analysis modules in `src/lib/*` and stores screenshots/metadata.
- API: `POST /api/analyze` with `url`, optional `component` (`speed|fonts|images|cta|whitespace|social`), and `forceRescan` to bypass 24‑hour cache. `POST /api/screenshot` captures screenshots.
- UI: pages under `src/app`, composed from `src/components/*` with Tailwind.

## Key References
- `CLAUDE.md`: End‑to‑end overview, local setup, deployment, and module summaries.
- `docs/analysis/current-state.md`: Flow, caching, DB writes, constraints.
- `docs/analysis/module-analysis.md`: Detailed module behavior and improvement areas.
- `docs/analysis/tasks.md`: Handoff‑ready tasks and priorities.
 - `README.md`: Quick links to core modules and docs.
