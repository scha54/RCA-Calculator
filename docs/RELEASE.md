# Release verification

## Automated gates

Run `npm ci` with Node 24/npm 11, run `npm run audit`, install Playwright Chromium, then run `npm run check`. CI performs the same unit tests, TypeScript/build validation, release-integrity and process-lifecycle checks, initial-JavaScript budget, production-browser checks and high/critical vulnerability gate; it retains the exact tested artifact. Test failures block the CI job. Branch protection must be configured in the hosting service if CI is to block merges.

## Before publishing a release

1. Review the hand-derived calculation references and methodology against the intended use. Obtain domain review of production factors, displacement, overlap and uncertainty assumptions before making externally assured claims.
2. Verify the intended browsers and hosting subpath using a staging deployment. Current automated browser coverage is Chromium; Firefox, Safari, screen readers and real mobile devices require additional verification.
3. Manually inspect a printed report/PDF, long scenario names and source notes, and a workbook opened in the spreadsheet applications used by recipients. Automated tests validate workbook values and print visibility; they do not guarantee every printer or spreadsheet renderer's layout.
4. Check the project dependencies against the organisation's dependency policy. The high/critical audit gate is automated; the moderate ExcelJS/UUID advisory is inventoried in `TWELVE_FACTOR.md`. There is no automated package-update or publishing integration in this repository.
5. Deploy `dist/` to a static HTTPS host, verify asset loading and clipboard behavior, and retain a previous build for rollback. No credentials, cloud resources or deployment targets are configured by this change.

## Data and compatibility

Scenario version 1 remains readable. Optional `baselineConfidence` and `outcomes` fields extend the format; old scenarios default baseline confidence to medium and extended modules to unassessed. New blank assessments contain neutral intervention values and no inherited notes. Preset assumptions require fresh confirmation. Stored valid assessments survive adjacent malformed records; automatic saving pauses until the user elects to replace damaged storage. Users should keep JSON backups; no server-side account sync or recovery service exists.

## Performance

Results and Excel export are loaded on demand. The build fails if initial static JavaScript exceeds 450,000 bytes. ExcelJS remains a large deferred dependency and its Vite warning is visible. Do not increase the budget or suppress size warnings to mask a regression.

See [the operations runbook](OPERATIONS.md) for same-artifact promotion, Vercel verification, portable process configuration, structured logs, backups and rollback.
