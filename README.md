# Analysis Consistency and Rigor Initiative

This folder organizes the documentation for improving the analysis system: current behavior, findings, implementation plan, roadmap, and handoff-ready tasks.

- See `PRD.md` and `CLAUDE.md` (root) for product and technical background.
- See `database-schema-design.md` (root) for the enhanced schema design.

## Contents
- Current State: `./current-state.md`
- Roadmap: `./roadmap.md`
- Tasks (handoff-ready): `./tasks.md`
- Checklists: `./checklists/grades-deprecation.md`

## Goals
- Make results across modules consistent, informative, and reproducible
- Improve rigor and reliability while reducing runtime and flakiness
- Document a clear, phased path with actionable tasks

## Quick Links
- Backend orchestrator: `src/app/api/analyze/route.ts`
- Analysis modules: `src/lib/*` (page speed, fonts, images, CTA, whitespace, social)
- Types: `src/types/` (database and planned analysis types)
- Screenshot: `src/lib/screenshot-storage.ts`
- Metadata: `src/lib/page-metadata.ts` 