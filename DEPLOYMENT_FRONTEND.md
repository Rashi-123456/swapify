# Swapify Frontend Deployment Guide

## Files

index.html
style.css
script.js

## Backend

Update BACKEND_BASE_URL in script.js with the deployed backend URL.

Example

https://swapify-backend.onrender.com

## Scan / Device-Info Logging (Task 3)

Every scan sends the barcode plus basic device info (device type, screen
size, browser, OS) to the backend for Dhruv's real-world experiment
logging. This is configured in script.js as:

```
const LOGGING_ENDPOINT_PATH = '/activity';
const LOGGING_URL = BACKEND_BASE_URL + LOGGING_ENDPOINT_PATH;
```

It defaults to the existing `/activity` activity-logging endpoint
(`action_type: 'scan'`, with device info in `metadata`), so it works
against the current backend with no changes. If Dhruv ships a separate,
dedicated logging endpoint for this experiment, update
`LOGGING_ENDPOINT_PATH` (or `LOGGING_URL` directly, if it lives on a
different host) — nothing else needs to change.

Logging is fire-and-forget and wrapped in try/catch end-to-end
(`getDeviceInfo()` and `logScanEvent()` in script.js): if the logging
request fails or the endpoint is unreachable, the product scan still
completes normally and the failure is silently swallowed.

## Deployment

Upload all frontend files to any static hosting service.

Examples

- GitHub Pages
- Netlify
- Vercel

Ensure backend CORS allows the frontend domain.

## UI Refinement Pass (Fallback UI, Scorecard, Animations)

This round matched the app's visuals to the `swapify-fallback-sharecard-challenge.html`
design reference:

- **Smart fallback UI** (`showProductNotFound()` in script.js): redesigned to a
  circular icon + title/subtitle + barcode chip, a primary "Try scanning again"
  button and secondary "Upload photo of label (OCR)" button, quiet text links
  for "Search by name" and "Report missing product" (`pnfReportMissing()`,
  best-effort POST to `LOGGING_URL`, always confirms locally via a toast even
  if the network call fails), and a "similar products we do have" trending
  list pulled from the loaded CSV catalogue (`buildPnfSimilarHTML()`).
- **Score card**: the score dial (`.score-badge` / `buildScoreHeroHTML()`) is
  a white circular dial with a grade-colored ring, animated 0→score count-up,
  and a small grade pill — sized and ordered (`order:-1`) to be the first
  thing visible on the product page. Grade colors were simplified to a clean
  green/amber/red palette matching the reference (`score-a`…`score-f`).
- **Score breakdown table**: rebuilt as a solid-bordered card with a proper
  rectangular outline (`.score-breakdown-card`), zebra-striped rows instead
  of dashed dividers, and a highlighted final-score row.
- **Animations**: score dial zoom-in + ring/number count-up, staggered
  card-unfold for recent scans / recommendations / alternatives / category
  cards / similar-products, page fade transitions, and hover-lift / active
  press-scale on cards and buttons — all in the "Animations & Micro-interactions"
  section near the end of style.css. Respects `prefers-reduced-motion`.
- **Shareable score card** (`#shareCardPreview`): restyled to the reference's
  dark teal gradient with a lime accent blob and a white circular dial,
  replacing the previous off-brand blue gradient.