---
date: 2025-11-29T09:22:29-05:00
researcher: Codex
git_commit: 3c9822126eb4a79102aacf884a77f35c681d4556
branch: main
repository: landing-page-report
topic: "Improve recommendation language, UI, and actionability"
tags: [research, recommendations, ui, copywriting]
status: complete
last_updated: 2025-11-29
last_updated_by: Codex
---

# Research: Improve recommendation language, UI, and actionability

**Date**: 2025-11-29T09:22:29-05:00  
**Researcher**: Codex  
**Git Commit**: 3c9822126eb4a79102aacf884a77f35c681d4556  
**Branch**: main  
**Repository**: landing-page-report

## Research Question
Improve the language, UI, and approach to recommendations so they are specific to the problem, action-oriented, and simpler. Catalog the current recommendation approach to plan a holistic improvement.

## Summary
- Recommendations are string arrays emitted per module with no per-element linkage, severity, or implementation steps; API passes them through unchanged (except marketing copy for speed) to the UI.
- Impact/priority in the UI is derived from a keyword map, not from module signals, and the accordion list renders plain text without context, order, or “start here” guidance.
- Module copy is generic and often motivational (e.g., “Excellent performance!”, “Consider adding blur placeholders”), lacking concrete targets, owners, or how-to steps.
- Existing research docs already call for more specific CTA recommendations and priority planning, but the current implementation hasn’t integrated that guidance.

## Detailed Findings

### Generation & Flow
- API orchestrator runs each module and forwards `issues`/`recommendations` arrays directly to the response; no normalization or prioritization layer exists (src/app/api/analyze/route.ts:394-507).
- Impact grouping for UI relies solely on keyword-based categorization (src/lib/impact-analyzer.ts:13-76), not on module-derived severity or confidence.

### Module Recommendation Style
- **Page speed**: Technical recs are converted to marketing phrasing like “Optimize images to load faster” or “Great job!”; still broad and not tied to specific assets (src/lib/page-speed-analysis.ts:83-170, src/lib/page-speed-puppeteer.ts:237-303).
- **CTA**: Outputs high-level copy such as “Add a prominent primary CTA” or “Use stronger action words,” without pointing to the actual CTA instance or concrete adjustments (src/lib/cta-analysis.ts:579-645).
- **Images**: Lists generalized steps (“Convert JPG/PNG…”, “Add srcset and sizes…”, “Consider adding blur placeholders”) without naming which images need work (src/lib/image-optimization.ts:378-435).
- **Whitespace**: Uses fixed pixel targets and percentage thresholds; recommendations remain abstract (“Increase margins around headlines…”, “Significantly increase whitespace…”) with no section references (src/lib/whitespace-assessment.ts:1033-1118).
- **Social proof**: Presence/variety-based guidance like “Add testimonials” or “Place social proof in the hero section,” not connected to specific elements or credibility signals (src/lib/social-proof-analysis.ts:760-865).
- **Fonts**: Simple rules of thumb (“Limit web fonts to 1-2”, “Use font weights…”) plus congratulatory messages, no detection of loading strategy or variable fonts (src/lib/font-analysis.ts:134-199).

### UI Presentation
- AnalysisResults renders per-module sections; each section groups text by inferred impact using the keyword map and shows them in accordions (e.g., src/components/analysis/PageSpeedSection.tsx:31-63, AccordionSection.tsx:1-78).
- There is no cross-module prioritization, no “quick wins,” and no linkage from recommendations to screenshots or DOM locations.
- Copy is displayed verbatim; no simplification, templating, or deduplication beyond the keyword impact sort.

### Language Patterns & Gaps
- Mix of marketing cheerleading (“Great job!”, “Excellent whitespace usage!”) and vague directives; little specificity about where, how much, or how to fix.
- No formatting for steps, owners, or effort; zero estimates of impact or time.
- Lacks industry/device context, severity, and confidence; uses the same phrasing regardless of detection certainty.

## Code References
- src/app/api/analyze/route.ts:394-507 — Modules run and raw recommendation arrays forwarded.
- src/lib/impact-analyzer.ts:13-76 — Keyword-based High/Medium/Low impact classification.
- src/lib/page-speed-analysis.ts:83-170; src/lib/page-speed-puppeteer.ts:237-303 — Marketing conversions and broad speed recommendations.
- src/lib/cta-analysis.ts:579-645 — CTA scoring and generic recommendation strings.
- src/lib/image-optimization.ts:378-435 — Image recommendations detached from specific assets.
- src/lib/whitespace-assessment.ts:1033-1118 — Threshold-driven whitespace recommendations with fixed pixel guidance.
- src/lib/social-proof-analysis.ts:760-865 — Variety/placement-based social proof recommendations.
- src/lib/font-analysis.ts:134-199 — Basic font usage recommendations and positive affirmations.
- src/components/analysis/PageSpeedSection.tsx:31-63; src/components/AccordionSection.tsx:1-78 — UI grouping and rendering of recommendations.

## Architecture Insights
- Recommendations are plain strings attached to module results with no shared schema for priority, scope, affected element(s), or fix steps.
- Impact sorting is heuristic (keyword match) rather than module-driven severity; modules do not emit impact/confidence metadata.
- UI is read-only text: no anchors into the page/screenshot, no bundling by theme (e.g., “Performance”), and no action plan view.
- Marketing-language conversion is only applied to page-speed; other modules surface raw heuristic strings.

## Historical Context (docs/)
- docs/research/cta-refactor.md — Calls for mapping CTA issues to prescriptive, instance-specific recommendations and adding tests.
- docs/research/future-improvements.md — Suggests prioritized “quick wins,” visual evidence, and benchmarked guidance to make recommendations more actionable.
- docs/research/tasks.md — Broad task list noting the need for dynamic thresholds, multi-language support, and confidence scoring across modules.

## Related Research
- docs/research/current-state.md — High-level flow of modules and outputs.
- docs/research/module-analysis.md — Prior critique of naive thresholds and generic recommendations across modules.

## Open Questions
- Should each recommendation carry structured metadata (affected element/screenshot region, severity, effort, expected impact) to drive UI prioritization?
- How should we order and surface “start here” items across modules (e.g., per severity vs per conversion impact)?
- Do we want templated, shorter copy per module with variables (element label, location, measured metric) to enforce specificity?
- Should marketing “good job” messages be removed or moved to a separate “what’s working” section to keep the main list action-only?
