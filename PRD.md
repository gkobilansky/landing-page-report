# Product Requirements Document: Landing Page Report Lead Magnet

**Version:** 1.0
**Date:** May 22, 2025
**Author:** AI Assistant (Gemini) for lansky.tech
**Status:** Proposed

## 1. Overview

The "Landing Page Report" is an online tool designed to serve as a lead magnet for lansky.tech. Users can submit any URL, and the tool will analyze the corresponding landing page against a predefined set of best-practice criteria. Upon completion of the analysis, the user will receive an email notification with a link to a detailed report.

## 2. Goals

* **Primary:** Generate qualified leads (email addresses) for lansky.tech.
* Provide genuine value to users by offering actionable insights into their landing page's effectiveness.
* Position lansky.tech as a knowledgeable resource in landing page optimization and web best practices.
* Drive traffic to the lansky.tech website.

## 3. Target Audience

* Marketers and marketing teams.
* Entrepreneurs and startup founders.
* Small to medium-sized business owners.
* Web designers and developers looking to validate their work.
* Anyone responsible for a website's conversion rates who wants a quick, automated audit.

## 4. User Flow

1.  **Visit Tool Page:** User navigates to `lansky.tech/tool`.
2.  **Enter URL:** User inputs the URL of the landing page they want to analyze into a form field.
3.  **Submit URL & Request Email:**
    * Upon URL submission, the form updates to prompt the user for their email address with a message like, "Analysis started! Let me know where to send the report."
    * The system initiates the analysis process in the background.
4.  **Submit Email:** User enters their email address and submits.
5.  **Confirmation (Optional):** A brief on-page message confirms that the report will be sent to their email once ready.
6.  **Email Notification:** Once the analysis is complete, the user receives an email containing:
    * A thank you message.
    * A unique link to their personalized report (e.g., `lansky.tech/tool/report-[reportId]`).
7.  **View Report:** User clicks the link in the email and views the detailed landing page report on the lansky.tech website.

## 5. Key Features & Analysis Criteria

The tool will generate a "Landing Page Report" that checks the submitted URL for the following:

### 5.1. Page Load Speed
* **Description:** Assesses how quickly the page content loads and becomes interactive.
* **Analysis Method:** Programmatic use of Google Lighthouse, focusing on metrics like Speed Index, First Contentful Paint (FCP), or Time to Interactive (TTI).
* **Success Criteria:** Page loads/becomes interactive in **2.5 seconds or less**.

### 5.2. Font Usage
* **Description:** Checks the number of different font families used on the page.
* **Analysis Method:** Use Puppeteer to navigate the page, compute styles for visible elements, and count unique `font-family` declarations.
* **Success Criteria:** A maximum of **2-3 unique font families** are used.

### 5.3. Image Optimization
* **Description:** Ensures images use web-friendly formats and are not excessively large in file size or dimensions relative to their display size.
* **Analysis Method:**
    * Use Puppeteer to identify all `<img>` tags and CSS background images.
    * Check file extensions for web-friendly formats (JPEG, PNG, WebP, SVG, GIF).
    * Fetch image headers for `Content-Length` (file size).
    * Compare `naturalWidth`/`naturalHeight` with rendered `width`/`height` (considering `devicePixelRatio`).
* **Success Criteria:**
    * All significant images use web-friendly formats.
    * No critical images exceed a predefined file size threshold (e.g., 500KB-1MB, TBD).
    * Images are appropriately sized for their display containers (not drastically oversized).

### 5.4. Clear, Single Call-to-Action (CTA) Above the Fold
* **Description:** Verifies the presence of a clear and singular primary CTA visible without scrolling on both desktop and mobile views.
* **Analysis Method:**
    * Use Puppeteer to render the page in both desktop and mobile viewports.
    * Identify potential CTA elements (buttons, specific links) using selectors and common CTA keywords.
    * Check if identified CTAs are within the viewport (`isIntersectingViewport()`).
    * Count distinct primary CTAs above the fold.
* **Success Criteria:** One clear, primary CTA is visible above the fold on both desktop and mobile viewports.

### 5.5. Whitespace and Clutter
* **Description:** Assesses if the page has enough whitespace to avoid a cluttered feel, making content digestible.
* **Analysis Method (Heuristic-based):**
    * Use Puppeteer.
    * Potential approaches: element density analysis per grid section, average margin/padding around key elements, ensuring adequate line-height for text blocks.
    * Focus on negative space around headlines, CTAs, and between major content blocks.
* **Success Criteria:** The page layout does not trigger "cluttered" flags based on the chosen heuristic (e.g., sufficient spacing around critical elements).

### 5.6. Social Proof
* **Description:** Checks for the presence of elements that build trust and credibility, such as testimonials, customer logos, or reviews.
* **Analysis Method (Heuristic-based):**
    * Use Puppeteer to scan page HTML content.
    * Search for keywords (e.g., "testimonial," "review," "clients," "trusted by").
    * Look for common CSS class names or IDs related to social proof sections.
    * Identify structural patterns (e.g., rows of logos, blocks of quoted text with images).
* **Success Criteria:** Presence of at least one recognized form of social proof.

## 6. Report Delivery

* **Email Notification:** An automated email will be sent to the user once the analysis is complete, containing a unique link to their report.
* **Web-Based Report Page:** The report will be a dynamically generated page on `lansky.tech` (e.g., `lansky.tech/tool/report-[reportId]`), presenting the findings for each of the 6 criteria in a clear, easy-to-understand format. Each section should ideally indicate a pass/fail or provide a qualitative score, along with brief details.

## 7. Technical Design & Architecture

* **Frontend:** Next.js (for `lansky.tech/tool` and `lansky.tech/tool/report-[reportId]`)
* **Backend:** Next.js API Routes for handling form submissions and triggering analysis.
    * `POST /api/analyze/request`: Receives URL, creates a job, returns `reportId`, triggers background analysis.
    * `POST /api/analyze/subscribe_email`: Receives `reportId` and `email`, updates the job record.
    * Analysis Worker: A background process/function (potentially an async part of an API route or a separate, invokable function if longer execution times are needed).
* **Database:** Supabase (PostgreSQL)
    * **Table:** `landing_page_analyses`
        * `id`: UUID, primary key (used as `reportId`)
        * `url`: TEXT, not null (the URL submitted by the user)
        * `email`: TEXT, nullable (user's email for notification)
        * `status`: TEXT, not null (e.g., 'pending', 'processing', 'completed', 'failed')
        * `analysis_result`: JSONB, nullable (stores the structured results for all 6 criteria)
        * `error_message`: TEXT, nullable (stores any error messages if analysis fails)
        * `submitted_at`: TIMESTAMPZ, default `now()`
        * `completed_at`: TIMESTAMPZ, nullable
* **Analysis Tools:**
    * [Google Lighthouse](https://developers.google.com/web/tools/lighthouse) (via `lighthouse` npm package) for page load speed.
    * [Puppeteer](https://pptr.dev/) (headless Chrome automation) for font count, image analysis, CTA detection, whitespace (heuristic), and social proof (heuristic).
* **Email Service:** A transactional email provider like Resend, SendGrid, or Mailgun (integrated via their Node.js SDK).
* **Hosting:** Platform capable of running Next.js and Node.js backend functions (e.g., Vercel, Netlify, AWS Amplify, self-hosted Node server).

## 8. Non-Functional Requirements

* **Usability:** The tool interface must be simple, intuitive, and require minimal user effort.
* **Performance (Tool Itself):** Initial URL submission and email capture should be fast. Analysis time will vary but should be communicated if expected to be long.
* **Reliability:** Robust error handling for invalid URLs or pages that break the analysis tools. The system should gracefully handle failures and potentially notify the user if a report cannot be generated.
* **Scalability (Initial):** The architecture should handle a moderate concurrent load. Background job processing is key to preventing timeouts on web requests.

## 9. Success Metrics

* **Lead Generation:**
    * Number of unique URLs submitted for analysis.
    * Number of email addresses captured.
    * Conversion rate (submissions to emails captured).
* **Engagement:**
    * Number of reports successfully generated and viewed (clicks on email links).
    * Bounce rate on the tool page / report page.
* **Tool Performance:**
    * Average analysis completion time.
    * Analysis success rate (vs. failures).
* **Qualitative:** User feedback (if a feedback mechanism is implemented).

## 10. Future Considerations (Out of Scope for V1)

* User accounts to save and compare past reports.
* More detailed and prescriptive recommendations for each analysis point.
* Visual indicators on screenshots (e.g., highlighting the CTA above the fold).
* Analysis of additional on-page SEO elements (meta tags, heading structure).
* Analysis of mobile usability beyond just CTA (e.g., tap target sizes).
* Option to schedule recurring analyses.
* Integration with other marketing tools or CRMs.
* A tiered offering with more advanced features for subscribed users.