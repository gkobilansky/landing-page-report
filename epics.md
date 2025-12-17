# Landing Page Report Redesign - Epic Breakdown

**Author:** Lance Key
**Date:** 2025-12-15
**Updated:** 2025-12-16
**Project Level:** Feature Enhancement
**Target Scale:** Single Product Improvement

---

## Implementation Status

| Epic | Title | Status |
|------|-------|--------|
| 1 | Priority-First Hero Experience | ✅ Complete |
| 2 | Smart Section Collapsing | ✅ Complete |
| 3 | Actionable Fix List | ✅ Complete |
| 4 | Sticky Navigation & Polish | ✅ Complete |
| 5 | Consolidated Issue+Fix Display | ✅ Complete |

---

## Overview

This document provides the complete epic and story breakdown for the Landing Page Report redesign, transforming the current "wall of data" report into an actionable, prioritized experience that guides users to high-impact improvements.

### Research Foundation

This plan incorporates insights from:
- **Competitor Analysis:** [PageSpeed Insights](https://developers.google.com/web/tools/lighthouse/), [GTmetrix](https://gtmetrix.com/blog/everything-you-need-to-know-about-the-new-gtmetrix-report-powered-by-lighthouse/), Lighthouse 2025 updates
- **UX Best Practices:** [Dashboard Design Principles 2025](https://www.uxpin.com/studio/blog/dashboard-design-principles/), [Cognitive Design Guidelines](https://uxmag.com/articles/four-cognitive-design-guidelines-for-effective-information-dashboards), [Data Visualization Psychology](https://www.toptal.com/designers/data-visualization/data-visualization-psychology)

### Key Research Insights Applied

1. **Inverted Pyramid Approach:** Most critical insights at top, drill-down for details (GTmetrix, PageSpeed Insights pattern)
2. **Consolidated Audits:** Group related issues into cohesive insights (Lighthouse 2025 "Insights" model)
3. **3-5 Second Rule:** User must understand the key takeaway within 5 seconds
4. **Progressive Disclosure:** Collapse low-priority sections, expand on demand
5. **Reduce Cognitive Load:** Limit to 3-5 essential focus areas, use visual hierarchy

### Epics Summary

| Epic | Title | User Value |
|------|-------|------------|
| 1 | Priority-First Hero Experience | Users immediately see their #1 priority fix and overall verdict |
| 2 | Smart Section Collapsing | Users focus on problem areas; passing sections stay out of the way |
| 3 | Actionable Fix List | Users get a prioritized to-do list with top 3 fixes |
| 4 | Sticky Navigation & Polish | Users navigate long reports efficiently with persistent context |
| 5 | Consolidated Issue+Fix Display | Users see each problem paired directly with its solution |

---

## Functional Requirements Inventory

Based on the expert review and research, the following functional requirements define the redesign scope:

| FR ID | Requirement | Priority |
|-------|-------------|----------|
| FR1 | Display single-word verdict with semantic color next to overall score | High |
| FR2 | Generate and display "One Big Thing" priority insight message | High |
| FR3 | Identify lowest-scoring section with High-impact issues automatically | High |
| FR4 | Make ScoreBar component sticky during scroll | High |
| FR5 | Collapse sections scoring >85 to a "Passed" summary row | High |
| FR6 | Allow expanding collapsed sections to view full details | High |
| FR7 | Transform Executive Summary into prioritized fix list (top 3) | High |
| FR8 | Show section name, score, and single most actionable recommendation per fix | High |
| FR9 | Display severity indicator (Critical/High/Medium) for each fix | Medium |
| FR10 | Maintain category theme colors for visual grouping | Medium |
| FR11 | Make score badges more prominent with semantic colors | Medium |
| FR12 | Add visual indicators (checkmarks/exclamation marks) to ScoreBar items | Medium |
| FR13 | Preserve jump-to-section functionality with sticky nav | Medium |
| FR14 | Ensure mobile responsiveness for all new components | High |
| FR15 | Maintain existing accordion behavior for issues/recommendations | Medium |
| FR16 | Consolidate issues with their fixes inline (problem → solution pairs) | High |

---

## FR Coverage Map

```
Epic 1 (Priority-First Hero):       FR1, FR2, FR3          ✅ Complete
Epic 2 (Smart Collapsing):          FR5, FR6, FR10, FR11   ✅ Complete
Epic 3 (Actionable Fix List):       FR7, FR8, FR9, FR15    ✅ Complete
Epic 4 (Sticky Nav & Polish):       FR4, FR12, FR13, FR14  ✅ Complete
Epic 5 (Consolidated Issue+Fix):    FR16                   ✅ Complete
```

---

## Epic 1: Priority-First Hero Experience

**Goal:** Transform the report header from passive data display to an immediate call-to-action that tells users exactly what to fix first.

**User Value:** Users landing on their report immediately understand: (1) their overall status in plain language, (2) the single most impactful thing they should fix. No scrolling or cognitive work required.

**FRs Covered:** FR1, FR2, FR3

---

### Story 1.1: Add Verdict Badge to Overall Score ✅

As a **report viewer**,
I want to see a single-word verdict (Critical/Fair/Strong/Excellent) next to my numeric score,
So that I immediately understand my overall status without interpreting numbers.

**Acceptance Criteria:**

**Given** a completed analysis with an overall score
**When** the report page loads
**Then** a verdict badge appears next to the numeric score

**And** the verdict follows this mapping:
- Score 0-49: "Critical" with red background (`bg-red-500`)
- Score 50-69: "Fair" with amber/yellow background (`bg-amber-500`)
- Score 70-84: "Good" with green background (`bg-green-500`)
- Score 85-100: "Excellent" with emerald background (`bg-emerald-500`)

**And** the badge uses white text for contrast
**And** the badge appears on the same line as the `/100` score
**And** the badge is visible on both mobile and desktop layouts

**Prerequisites:** None

**Technical Notes:**
- Modify `src/app/reports/[id]/page.tsx` lines 250-254 (score display section)
- Create utility function `getVerdict(score: number): { text: string, colorClass: string }`
- Use Tailwind classes consistent with existing ScoreBadge component (`src/components/ui/ScoreBadge.tsx`)
- Badge should be a `<span>` with `px-3 py-1 rounded-full text-sm font-semibold` styling

**Test Cases:**
- Score of 35 displays "Critical" with red background
- Score of 60 displays "Fair" with amber background
- Score of 75 displays "Good" with green background
- Score of 92 displays "Excellent" with emerald background
- Edge cases: 0, 49, 50, 69, 70, 84, 85, 100

---

### Story 1.2: Create Priority Insight Generator ✅

As a **developer**,
I want a utility function that analyzes all section scores and issues to determine the #1 priority,
So that the report can display an actionable insight message.

**Acceptance Criteria:**

**Given** analysis data with scores for all 6 sections
**When** `generatePriorityInsight(analysisResult)` is called
**Then** it returns an object with:
- `sectionName`: The name of the lowest-scoring section with High-impact issues
- `sectionScore`: The numeric score of that section
- `primaryIssue`: The first High-impact issue from that section (or first issue if no High-impact)
- `impactLevel`: 'Critical' | 'High' | 'Medium'

**And** if multiple sections are tied for lowest score, prioritize by weight order: CTA (25%), Speed (25%), Social (20%), Whitespace (15%), Images (10%), Fonts (5%)

**And** if a section has score <50, its impactLevel is 'Critical'
**And** if a section has score 50-69, its impactLevel is 'High'
**And** if a section has score 70-84, its impactLevel is 'Medium'

**Prerequisites:** None

**Technical Notes:**
- Create new file: `src/lib/priority-insight.ts`
- Import types from existing `src/components/AnalysisResults.tsx` (AnalysisResult interface)
- Leverage existing `impact-analyzer.ts` for categorizing issues
- Section weight order defined in `src/components/AnalysisResults.tsx` comments (lines 136-165)
- Export interface `PriorityInsight { sectionName, sectionScore, primaryIssue, impactLevel }`

**Test Cases:**
- Analysis with Social Proof at 25 returns Social as priority with Critical level
- Analysis with tied scores returns higher-weight section first
- Analysis with all sections >85 returns lowest scoring section with Medium level
- Analysis with missing sections handles gracefully
- Empty issues array returns generic message about the section score

---

### Story 1.3: Display Priority Insight in Hero Section ✅

As a **report viewer**,
I want to see a prominent message telling me my #1 priority fix,
So that I know exactly what to work on first without reading the entire report.

**Acceptance Criteria:**

**Given** a completed analysis displayed on the report page
**When** the hero section renders
**Then** a Priority Insight component appears below the score/verdict

**And** the insight displays in the format:
`"[Verdict]. Your [metric] is [excellent/good/concerning], but **[Section Name]** needs attention. [Primary Issue]."`

**And** the section name is bold and links to that section (smooth scroll)
**And** the insight has appropriate severity styling:
- Critical: Left border red, light red background tint
- High: Left border amber, light amber background tint
- Medium: Left border blue, light blue background tint

**And** if overall score is ≥85, the message is:
`"Excellent work! Your landing page performs well across all areas. Minor improvements available below."`

**Prerequisites:** Story 1.1, Story 1.2

**Technical Notes:**
- Create new component: `src/components/PriorityInsight.tsx`
- Add to `src/app/reports/[id]/page.tsx` after score display (around line 270)
- Use `generatePriorityInsight()` from Story 1.2
- Implement smooth scroll using same pattern as ScoreBar (`document.getElementById().scrollIntoView()`)
- Style with Tailwind: `border-l-4`, `pl-4`, `py-3`, background with `/10` opacity

**Test Cases:**
- Low-scoring report shows Critical-styled insight
- High-scoring report (≥85) shows congratulatory message
- Clicking section name scrolls to that section
- Component handles missing analysis sections gracefully
- Mobile layout remains readable

---

## Epic 2: Smart Section Collapsing

**Goal:** Reduce visual noise by auto-collapsing sections that are performing well, allowing users to focus on problem areas.

**User Value:** Users no longer scroll past 500 pixels of "you're doing great" content to find what needs fixing. High-performing sections get out of the way while remaining accessible.

**FRs Covered:** FR5, FR6, FR10, FR11

---

### Story 2.1: Create CollapsibleSection Wrapper Component ✅

As a **developer**,
I want a wrapper component that can render section content in collapsed or expanded states,
So that analysis sections can be conditionally minimized based on score.

**Acceptance Criteria:**

**Given** a CollapsibleSection component with props: `title`, `score`, `icon`, `colorTheme`, `isCollapsed`, `children`
**When** `isCollapsed` is true
**Then** a compact summary row displays with:
- Section icon and title
- Score badge (color-coded)
- Green checkmark icon indicating "Passed"
- "Expand" button/chevron

**And** when user clicks the expand button
**Then** `onToggle` callback is fired with the new state

**When** `isCollapsed` is false
**Then** the full `children` content renders normally

**And** the collapsed row maintains the section's category color theme (bgClass, borderClass)
**And** transition animation (150ms) smooths the expand/collapse

**Prerequisites:** None

**Technical Notes:**
- Create new component: `src/components/CollapsibleSection.tsx`
- Use existing `categoryConfig` pattern from section components
- Use `useState` for local toggle if uncontrolled, or accept `isCollapsed` + `onToggle` for controlled
- Collapsed row height: approximately 60-72px
- Use `framer-motion` if available, or CSS transitions with `max-height` technique
- Chevron icon: rotate 180deg when expanded

**Test Cases:**
- Collapsed state shows summary row only
- Clicking expand shows full content
- Clicking collapse hides content, shows summary
- Transition animates smoothly
- Keyboard accessible (Enter/Space to toggle)

---

### Story 2.2: Integrate Collapsible Behavior into AnalysisResults ✅

As a **report viewer**,
I want sections scoring above 85 to be collapsed by default,
So that I can focus on sections that need improvement.

**Acceptance Criteria:**

**Given** a section with score ≥85
**When** the report loads
**Then** that section renders in collapsed state showing summary row

**Given** a section with score <85
**When** the report loads
**Then** that section renders fully expanded

**And** collapsed sections show:
- Section icon (from categoryConfig)
- Section title
- Score badge with green color
- Green checkmark + "Passed" text
- Expand chevron

**And** the user can expand any collapsed section to see full details
**And** the collapse threshold of 85 is configurable via constant

**Prerequisites:** Story 2.1

**Technical Notes:**
- Modify `src/components/AnalysisResults.tsx` to wrap each section with CollapsibleSection
- Pass score to determine initial collapsed state: `isCollapsed={score >= COLLAPSE_THRESHOLD}`
- Define `const COLLAPSE_THRESHOLD = 85` at top of file
- Preserve section IDs for scroll-to functionality (`id="cta-section"` etc.)
- Ensure collapsed sections still have their scroll anchor

**Test Cases:**
- Section scoring 90 loads collapsed
- Section scoring 60 loads expanded
- Section scoring exactly 85 loads collapsed (edge case)
- All 6 sections can independently expand/collapse
- Scroll-to-section still works for collapsed sections

---

### Story 2.3: Enhance Score Badge Visual Prominence ✅

As a **report viewer**,
I want score badges to be more visually prominent with clearer color coding,
So that I can quickly scan section health at a glance.

**Acceptance Criteria:**

**Given** a ScoreBadge component
**When** it renders
**Then** the badge size is increased from current to:
- Font size: `text-lg` (from current smaller size)
- Padding: `px-3 py-1.5`
- Min-width: 60px for consistent sizing

**And** color coding uses semantic colors:
- Score ≥90: Emerald green (`bg-emerald-500`)
- Score 70-89: Yellow (`bg-yellow-500`)
- Score 50-69: Orange (`bg-orange-500`)
- Score <50: Red (`bg-red-500`)

**And** text color is white for all badges
**And** badges in section headers are clearly visible against section backgrounds

**Prerequisites:** None

**Technical Notes:**
- Modify `src/components/ui/ScoreBadge.tsx`
- Update `getScoreColor()` function with new color mapping
- Current implementation at lines 3-7 uses green ≥90, yellow ≥60, red <60
- Ensure contrast ratio meets WCAG AA (4.5:1 for normal text)
- Update any tests that assert on specific colors

**Test Cases:**
- Score 95 renders emerald green
- Score 75 renders yellow
- Score 55 renders orange
- Score 40 renders red
- Badge has sufficient contrast on all section backgrounds
- Badge remains readable on collapsed section rows

---

## Epic 3: Actionable Fix List

**Goal:** Replace the generic Executive Summary with a prioritized list of the top 3 fixes, each with clear context and severity.

**User Value:** Users see a curated "to-do list" of their most impactful improvements immediately after the hero section, eliminating the need to hunt through all sections to find what matters.

**FRs Covered:** FR7, FR8, FR9, FR15

---

### Story 3.1: Create Priority Fix List Data Aggregator ✅

As a **developer**,
I want a function that extracts the top 3 prioritized fixes across all analysis sections,
So that the UI can display a curated action list.

**Acceptance Criteria:**

**Given** complete analysis data with all 6 sections
**When** `getTopPriorityFixes(analysisResult, limit = 3)` is called
**Then** it returns an array of fix objects, each containing:
- `sectionName`: Name of the section
- `sectionId`: DOM ID for scroll target (e.g., 'cta-section')
- `sectionScore`: Numeric score
- `sectionIcon`: Emoji icon for the section
- `recommendation`: The single most actionable recommendation text
- `severity`: 'Critical' | 'High' | 'Medium'

**And** fixes are prioritized by:
1. Lowest section score first
2. Sections with High-impact issues before Medium/Low
3. Section weight as tiebreaker (CTA > Speed > Social > Whitespace > Images > Fonts)

**And** each section appears at most once in the list
**And** sections scoring ≥85 are excluded from the list
**And** returns empty array if all sections score ≥85

**Prerequisites:** Story 1.2 (shares similar logic)

**Technical Notes:**
- Create function in `src/lib/priority-insight.ts` (extend existing file)
- Export interface `PriorityFix { sectionName, sectionId, sectionScore, sectionIcon, recommendation, severity }`
- Section config mapping: use same structure as `ScoreBar.tsx` lines 58-65
- Recommendation selection: use first item from `categorizeContent().recommendations` where impact is High, else first available
- Import `categorizeContent` from existing `src/lib/impact-analyzer.ts`

**Test Cases:**
- Returns exactly 3 fixes when 3+ sections score <85
- Returns fewer fixes when fewer sections need improvement
- Returns empty array when all sections ≥85
- Correct severity mapping based on score thresholds
- Recommendations come from the correct section
- Tie-breaking by section weight works correctly

---

### Story 3.2: Create PriorityFixList Component ✅

As a **report viewer**,
I want to see my top 3 priority fixes displayed as actionable cards,
So that I have a clear to-do list for improving my landing page.

**Acceptance Criteria:**

**Given** analysis data with sections scoring below 85
**When** the PriorityFixList component renders
**Then** up to 3 fix cards display in a horizontal row (desktop) or vertical stack (mobile)

**And** each fix card shows:
- Section icon (emoji)
- Section name as clickable link (scrolls to section)
- Score badge (color-coded by severity)
- Severity indicator badge (Critical/High/Medium with matching color)
- The recommendation text (truncated to 2 lines with ellipsis if needed)

**And** cards have visual hierarchy:
- First card (highest priority) has subtle emphasis (slightly larger or border highlight)
- Consistent spacing between cards
- Clean hover state indicating clickability

**Given** all sections score ≥85
**When** the component renders
**Then** a success message displays: "Great job! Your landing page is performing well across all areas."

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create new component: `src/components/PriorityFixList.tsx`
- Use CSS Grid: `grid-cols-1 md:grid-cols-3 gap-4`
- Card styling: Use existing card pattern (`bg-gray-800/50 border border-gray-700 rounded-lg p-4`)
- Severity badge: Reuse `ImpactBadge` component pattern from `AccordionSection.tsx`
- Smooth scroll on click: `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Truncation: `line-clamp-2` Tailwind utility

**Test Cases:**
- Displays 3 cards when 3+ sections need work
- Displays 2 cards when only 2 sections need work
- Displays success message when all sections pass
- Clicking section name scrolls to correct section
- Cards are responsive (stack on mobile)
- Truncation works for long recommendations

---

### Story 3.3: Replace Executive Summary with Priority Fix List ✅

As a **report viewer**,
I want the Executive Summary section to show my prioritized fixes instead of generic explanatory text,
So that the prime real estate provides immediate value.

**Acceptance Criteria:**

**Given** the report page loads
**When** the Executive Summary section renders
**Then** it displays:
- Section title: "Priority Fixes" (instead of "Executive Summary")
- The PriorityFixList component with top 3 fixes
- The existing ScoreBar component below the fixes
- The "How we get your score" link remains accessible

**And** the introductory paragraph is shortened to one line:
`"Focus on these high-impact improvements to boost your conversion rate."`

**And** the email signup prompt moves below the ScoreBar
**And** the overall card styling and spacing remains consistent with current design

**Prerequisites:** Story 3.2

**Technical Notes:**
- Modify `src/app/reports/[id]/page.tsx` lines 274-319 (Executive Summary section)
- Replace `<h2>Executive Summary</h2>` with `<h2>Priority Fixes</h2>`
- Remove the multi-line paragraph (lines 288-290)
- Insert `<PriorityFixList analysisResult={analysisResult} />` before ScoreBar
- Keep ScoreBar placement for jump navigation
- Preserve AlgorithmModalButton placement

**Test Cases:**
- Section title reads "Priority Fixes"
- PriorityFixList displays above ScoreBar
- ScoreBar still functions for navigation
- "How we get your score" modal still accessible
- Email signup still functions
- Mobile layout remains clean

---

## Epic 4: Sticky Navigation & Polish

**Goal:** Add persistent navigation and visual polish to improve the experience of navigating long reports.

**User Value:** Users always know their overall score and can jump to any section without scrolling back to top. Visual indicators make the ScoreBar more scannable.

**FRs Covered:** FR4, FR12, FR13, FR14

---

### Story 4.1: Make ScoreBar Sticky ✅

As a **report viewer**,
I want the ScoreBar to stick to the top of the viewport when I scroll,
So that I can always navigate to different sections and see my scores.

**Acceptance Criteria:**

**Given** I am viewing a report page
**When** I scroll down past the hero section
**Then** the ScoreBar sticks to the top of the viewport

**And** the sticky ScoreBar has:
- Solid background (not transparent) for readability
- Subtle shadow to indicate elevation
- Same horizontal centering as when inline
- Z-index ensuring it appears above section content

**And** when I scroll back to the top
**Then** the ScoreBar returns to its natural position in the document flow

**And** the sticky behavior works correctly on mobile devices

**Prerequisites:** None

**Technical Notes:**
- Modify `src/components/ScoreBar.tsx`
- Add wrapper div with `sticky top-0 z-40`
- Add background: `bg-[var(--color-bg-main)]` or `bg-gray-900`
- Add shadow: `shadow-lg` when sticky (may need JS to detect scroll position, or just always show shadow)
- Padding adjustment: ensure sticky version has appropriate padding (`py-3`)
- Test on iOS Safari (known sticky position quirks)

**Test Cases:**
- ScoreBar sticks when scrolled past its natural position
- ScoreBar has solid background (content doesn't show through)
- Click navigation still works when sticky
- Scrolling back up releases sticky positioning
- Works on mobile Safari and Chrome
- No content jump when ScoreBar becomes sticky

---

### Story 4.2: Add Status Indicators to ScoreBar Items ✅

As a **report viewer**,
I want each ScoreBar item to show a visual indicator of pass/fail status,
So that I can scan the bar to quickly identify problem areas.

**Acceptance Criteria:**

**Given** a ScoreBar rendering with section scores
**When** a section scores ≥85
**Then** a green checkmark icon (✓) appears next to the score

**When** a section scores <70
**Then** a red exclamation icon (!) appears next to the score

**When** a section scores 70-84
**Then** a yellow dot icon (●) appears next to the score

**And** the icons are sized appropriately (12-14px)
**And** the icons don't interfere with the existing score color coding
**And** icons have appropriate aria-labels for accessibility

**Prerequisites:** None

**Technical Notes:**
- Modify `src/components/ScoreBar.tsx`, specifically the `ScoreItem` component (lines 12-47)
- Add icon next to or below the score number
- Use inline SVG or Unicode characters:
  - Checkmark: ✓ or `<CheckIcon />`
  - Exclamation: ⚠ or custom SVG
  - Dot: ●
- Colors: `text-green-400`, `text-red-400`, `text-yellow-400`
- Add aria-label: "Passing", "Needs attention", "Needs improvement"

**Test Cases:**
- Score 90 shows green checkmark
- Score 75 shows yellow dot
- Score 50 shows red exclamation
- Score 85 shows green checkmark (edge case)
- Score 70 shows yellow dot (edge case)
- Icons visible on both mobile and desktop
- Screen reader announces status

---

### Story 4.3: Mobile Responsiveness Audit and Fixes ✅

As a **mobile user**,
I want all new redesign components to work well on my phone,
So that I can review my report on any device.

**Acceptance Criteria:**

**Given** a viewport width <768px
**When** viewing the report
**Then** all new components are usable and readable:

**PriorityInsight (Story 1.3):**
- Text wraps appropriately
- Section link is tappable (min 44px touch target)
- Border and background visible

**CollapsibleSection (Story 2.1):**
- Expand/collapse button is easily tappable
- Collapsed row content doesn't overflow
- Transition smooth on mobile

**PriorityFixList (Story 3.2):**
- Cards stack vertically
- Full-width cards on mobile
- Text readable without horizontal scroll

**Sticky ScoreBar (Story 4.1):**
- Items wrap to 2 rows if needed
- Touch targets adequate
- No horizontal overflow

**And** no horizontal scrolling occurs on the report page
**And** all interactive elements have minimum 44x44px touch targets

**Prerequisites:** Stories 1.3, 2.1, 2.2, 3.2, 4.1

**Technical Notes:**
- This is an audit/fix story - review each new component
- Use Chrome DevTools device emulation
- Test breakpoints: 320px (small phone), 375px (iPhone), 768px (tablet)
- Fix any overflow issues with `overflow-hidden` or responsive width classes
- Ensure touch targets with `min-h-[44px] min-w-[44px]`
- Check `globals.css` for any mobile-specific overrides needed

**Test Cases:**
- iPhone SE (320px width) - no horizontal scroll
- iPhone 14 (390px width) - all components usable
- iPad (768px width) - layout transitions smoothly
- All buttons/links tappable without zooming
- Text readable without zooming (min 16px)

---

### Story 4.4: Add Overall Score to Sticky ScoreBar ✅

As a **report viewer**,
I want to see my overall score in the sticky navigation,
So that I always have context about my landing page's total performance.

**Acceptance Criteria:**

**Given** the ScoreBar is in sticky mode
**When** viewing the sticky bar
**Then** the overall score and verdict appear at the left side of the bar

**And** the overall score display shows:
- Numeric score (e.g., "72/100")
- Verdict badge (from Story 1.1)
- Smaller sizing than hero version to fit in bar

**And** clicking the overall score scrolls to top of page
**And** the section score items shift right to accommodate
**And** on mobile, overall score may appear above section scores if space is limited

**Prerequisites:** Story 1.1, Story 4.1

**Technical Notes:**
- Modify `src/components/ScoreBar.tsx`
- Add new prop: `overallScore: number`
- Pass from `src/app/reports/[id]/page.tsx`
- Layout: Flexbox with overall score as first item, `justify-between` or similar
- Overall score styling: Smaller than hero (`text-xl` instead of `text-3xl`)
- Verdict badge: Reuse `getVerdict()` utility from Story 1.1
- Scroll to top: `window.scrollTo({ top: 0, behavior: 'smooth' })`

**Test Cases:**
- Overall score appears in sticky bar
- Verdict badge matches hero section
- Click scrolls to page top
- Layout doesn't break with overall score added
- Mobile layout accommodates overall score
- Score updates if page data changes

---

## Epic 5: Consolidated Issue+Fix Display

**Goal:** Transform the separate "Issues" and "Recommendations" accordions into consolidated problem→solution pairs that show the fix directly alongside each issue.

**User Value:** Users no longer need to mentally connect issues to recommendations by looking back and forth between separate lists. Each problem is immediately paired with its actionable solution, reducing cognitive load and making the report feel like a consultant's advice.

**FRs Covered:** FR16

**Design Rationale:**
Current state (bad UX):
```
Issues Accordion:
- Issue 1
- Issue 2
- Issue 3

Recommendations Accordion:
- Recommendation 1
- Recommendation 2
- Recommendation 3
```

Target state (good UX):
```
Problem → Solution pairs:
- Issue 1 → Fix: Recommendation 1
- Issue 2 → Fix: Recommendation 2
- Issue 3 → Fix: Recommendation 3
```

---

### Story 5.1: Create Issue-Fix Pairing Utility

As a **developer**,
I want a utility function that intelligently pairs issues with their related recommendations,
So that each problem can be displayed alongside its solution.

**Acceptance Criteria:**

**Given** arrays of issues and recommendations from a section
**When** `pairIssuesWithFixes(issues, recommendations)` is called
**Then** it returns an array of paired objects:
- `issue`: The issue text
- `fix`: The most relevant recommendation (or null if no match)
- `impact`: The impact level of the issue (High/Medium/Low)

**And** pairing uses keyword matching to find the most relevant recommendation for each issue
**And** recommendations can be reused if they apply to multiple issues
**And** orphan recommendations (not matched to any issue) are included with `issue: null`
**And** the function handles edge cases: empty arrays, more issues than recommendations, etc.

**Prerequisites:** None

**Technical Notes:**
- Create new file: `src/lib/issue-fix-pairer.ts`
- Use keyword extraction from issue text to find matching recommendations
- Consider using the existing `categorizeContent()` from `impact-analyzer.ts` for impact levels
- Return type: `Array<{ issue: string | null; fix: string | null; impact: ImpactLevel }>`

**Test Cases:**
- Issue "No CTA above fold" pairs with recommendation "Add prominent CTA above fold"
- Issue with no matching recommendation gets `fix: null`
- Recommendation with no matching issue appears with `issue: null`
- Empty issues array returns empty array
- Impact levels are correctly assigned

---

### Story 5.2: Create IssueWithFix Component

As a **developer**,
I want a component that displays an issue paired with its fix in a single visual unit,
So that users see problems and solutions together.

**Acceptance Criteria:**

**Given** an issue-fix pair object
**When** the IssueWithFix component renders
**Then** it displays:
- The issue text with an issue icon (⚠️) and red/amber styling
- An arrow or "→" connector
- The fix text with a fix icon (💡) and blue/green styling
- Impact badge (High/Medium/Low)

**And** if `fix` is null, show "No specific fix identified" in muted text
**And** if `issue` is null (orphan recommendation), show as a standalone recommendation
**And** the component is compact but readable
**And** long text truncates with "show more" expansion

**Prerequisites:** Story 5.1

**Technical Notes:**
- Create new component: `src/components/IssueWithFix.tsx`
- Use flexbox for horizontal layout on desktop, stack on mobile
- Arrow connector: `→` character or small SVG arrow
- Styling: Issue side uses red/amber tones, Fix side uses blue/green tones
- Expand/collapse for long text using local state

**Test Cases:**
- Renders issue and fix side by side
- Handles missing fix gracefully
- Handles orphan recommendation gracefully
- Long text truncates and expands on click
- Mobile layout stacks vertically

---

### Story 5.3: Replace Accordion Sections with Consolidated Display

As a **report viewer**,
I want to see issues and fixes paired together in each section,
So that I immediately know how to fix each problem without searching.

**Acceptance Criteria:**

**Given** a section with issues and recommendations
**When** the section renders
**Then** instead of separate Issues/Recommendations accordions:
- A single "Issues & Fixes" area displays
- Each issue is paired with its corresponding fix
- Items are sorted by impact (High first)
- The area is collapsible (default expanded for High impact items)

**And** the section header still shows the score badge and section title
**And** high-impact pairs are visually emphasized
**And** the existing section metrics/details remain unchanged

**Prerequisites:** Story 5.1, Story 5.2

**Technical Notes:**
- Modify each section component: `CTASection.tsx`, `SocialProofSection.tsx`, etc.
- Replace the dual `AccordionSection` pattern with `IssueWithFix` list
- Keep `AccordionSection` for grouping by impact level if needed
- Preserve existing section-specific content (metrics, charts, etc.)

**Test Cases:**
- CTA section shows paired issues/fixes
- All 6 section types updated consistently
- High-impact items appear first
- Section metrics/details still display
- Collapse/expand works for the issues area

---

## FR Coverage Matrix

| FR ID | Requirement | Covered By |
|-------|-------------|------------|
| FR1 | Verdict badge with semantic color | Story 1.1 |
| FR2 | "One Big Thing" priority insight | Story 1.3 |
| FR3 | Auto-identify lowest scoring section | Story 1.2 |
| FR4 | Sticky ScoreBar | Story 4.1 |
| FR5 | Collapse sections >85 | Story 2.2 |
| FR6 | Expand collapsed sections | Story 2.1, 2.2 |
| FR7 | Executive Summary → Fix List | Story 3.3 |
| FR8 | Show recommendation per fix | Story 3.1, 3.2 |
| FR9 | Severity indicators | Story 3.1, 3.2 |
| FR10 | Maintain category theme colors | Story 2.1, 2.3 |
| FR11 | Prominent score badges | Story 2.3 |
| FR12 | Status indicators in ScoreBar | Story 4.2 |
| FR13 | Jump-to-section with sticky nav | Story 4.1, 4.4 |
| FR14 | Mobile responsiveness | Story 4.3 |
| FR15 | Preserve accordion behavior | Story 3.3 (preserved, not modified) |
| FR16 | Consolidated issue+fix display | Story 5.1, 5.2, 5.3 |

---

## Summary

This epic breakdown transforms the Landing Page Report from a passive data display into an actionable consulting experience.

**Total Epics:** 5
**Total Stories:** 15
**Completed:** 15/15 stories (All Epics Complete)

**Key Deliverables by Epic:**

1. **Epic 1 (3 stories):** ✅ Users see verdict + priority message immediately
2. **Epic 2 (3 stories):** ✅ Passing sections collapse, scores are prominent
3. **Epic 3 (3 stories):** ✅ Top 3 fixes displayed as actionable to-do list
4. **Epic 4 (4 stories):** ✅ Sticky navigation with status indicators
5. **Epic 5 (3 stories):** ✅ Issues paired directly with their fixes

**Design Principles Applied:**
- Inverted pyramid: Most critical info at top
- 5-second rule: Key takeaway visible immediately
- Progressive disclosure: Details available on demand
- Reduced cognitive load: Focus on 3 priorities, not 6 sections
- Problem→Solution pairing: Each issue shows its fix inline

**Files Created (Epics 1-4):**
- `src/lib/priority-insight.ts` ✅
- `src/lib/verdict.ts` ✅
- `src/components/PriorityInsight.tsx` ✅
- `src/components/CollapsibleSection.tsx` ✅
- `src/components/PriorityFixList.tsx` ✅

**Files Modified (Epics 1-4):**
- `src/app/reports/[id]/page.tsx` ✅
- `src/components/ScoreBar.tsx` ✅
- `src/components/ui/ScoreBadge.tsx` ✅
- `src/components/AnalysisResults.tsx` ✅
- `src/components/analysis/*.tsx` (all 6 section components) ✅

**Files Created (Epic 5):**
- `src/lib/issue-fix-pairer.ts` ✅
- `src/components/IssueWithFix.tsx` ✅

**Files Modified (Epic 5):**
- `src/components/analysis/CTASection.tsx` ✅
- `src/components/analysis/SocialProofSection.tsx` ✅
- `src/components/analysis/PageSpeedSection.tsx` ✅
- `src/components/analysis/ImageOptimizationSection.tsx` ✅
- `src/components/analysis/WhitespaceSection.tsx` ✅
- `src/components/analysis/FontUsageSection.tsx` ✅
