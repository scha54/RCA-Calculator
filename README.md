# RCA Calculator

A browser-based Rapid Circularity Assessment for estimating annual virgin textile savings, comparing up to three scenarios, and exploring additional environmental and worker outcomes. React 19, TypeScript, Vite, Vitest and Playwright.

## Develop

Use Node 24 (`.nvmrc`) and npm 11 (recorded manager: npm 11.9.0). No backend, database, credentials, or application environment variables are needed.

```sh
npm ci
npm run dev
```

The development server binds to loopback by default. Scenario data stays in browser local storage. JSON downloads are the portable backup; clearing browser data removes local assessments. If some saved records are invalid, valid records are retained and automatic saving pauses so the original data is not overwritten. The UI explicitly offers replacement of invalid storage.

Start a blank assessment for a neutral model: all activity and intervention inputs start at their minimum, with a 0.3 kg garment weight retained as an editable convenience. No example notes or care checklist answers are copied. Presets contain illustrative assumptions, not measured project evidence.

Review inputs, choose confidence, and document any additional outcome modules under **Life cycle**. After editing assumptions, confirm substitution under **Slowing** and rebound under **Systems**. Calculations remain visible as drafts; Excel, Markdown and print reports require both confirmations and sources for enabled additional modules. JSON draft backup remains available. Edits to model inputs invalidate confirmations.

## Validate

```sh
npm test                  # engine, validation, reference arithmetic, JSON/XLSX tests
npm run build             # strict TypeScript check and production build
npm run check:bundle      # enforce 450 kB initial JavaScript budget
npm run check:release     # verify the immutable build and per-file checksums
npm run test:ops          # serving, security headers, lifecycle and integrity
npm run audit             # fail on high/critical dependency findings
npx playwright install --with-deps chromium
npm run test:e2e          # production-browser workflows, mobile and accessibility
# or run all checks after installing the browser:
npm run check
```

Playwright uses `/usr/bin/chromium` when present, otherwise its installed Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to select another executable. Browser tests use the read-only production server and its security headers on port 4173. Failed runs retain traces in ignored `test-results/`. CI runs these checks on Node 24; it is configured in `.github/workflows/ci.yml`.

Tests independently exercise each material formula, overlap factors, conservative/quadrature aggregation, confidence selection, zero sensitivity inputs, report gating, malformed data, additional outcome arithmetic, negative impacts, interval propagation, XLSX content, imports, persistence, scenario management, mobile overflow, and serious/critical accessibility violations. Automated accessibility tests do not substitute for a human keyboard or screen-reader review.

## Production

```sh
npm ci
npm run build
npm start                  # portable read-only production server (PORT defaults to 3000)
# npm run preview remains a local Vite inspection tool only.
```

Deploy the contents of `dist/` to a static HTTPS host; this project does not require a server runtime. Relative asset URLs support subdirectory hosting. Configure cache invalidation for `index.html` and long-lived immutable caching for hashed assets. HTTPS enables clipboard access; clipboard denial shows an actionable error. Vercel defaults and security/caching headers are declared in `vercel.json`. A build emits a checksummed `release.json`, CI retains the tested artifact, and `npm start` verifies and serves it without rebuilding. No deployment or publication happens automatically in this repository.

The initial JavaScript is constrained by a build-time budget. Results/charts, comparison, report UI, and Excel generation load on demand. ExcelJS still produces a large (~947 kB before gzip) deferred chunk; Vite's size warning is retained rather than suppressed. The workbook library downloads only when Excel is requested.

Print uses a dedicated report layout on A4, hides application controls, and uses black text on white. Extended assessments may span multiple pages; there is no single-page guarantee. JSON exports preserve inputs; workbooks include numeric results, confidence, model assumptions, source notes, unassessed modules, and extended outcomes.

See the [Twelve-Factor assessment](docs/TWELVE_FACTOR.md) and [operations runbook](docs/OPERATIONS.md) for architecture findings, runtime configuration, logging, rollback and the residual moderate dependency advisory.

See [methodology and boundaries](docs/METHODOLOGY.md) and [release verification](docs/RELEASE.md). This is a screening calculator, not a certified life cycle assessment or an independently audited scientific model.
