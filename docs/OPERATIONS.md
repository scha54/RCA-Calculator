# Production operations

## Build and release

Use Node 24 and npm 11 (recorded manager: npm 11.9.0). Install build tools with `npm ci --include=dev`, run `npm run audit`, then `npm run check`. The resulting `dist/` is the release artifact. `release.json` records the app version, Git revision, dirty status where observable, content-derived artifact ID, and checksums of all other artifact files. Builds made from uncommitted changes are explicitly marked dirty when local Git metadata is available.

`npm run check:release` verifies all files, detects additions/deletions/changes, and rejects symlinks. The checker accepts another directory with `node scripts/verify-release.mjs /path/to/release`. The manifest supports integrity verification and release identification; it is not a signature or substitute for trusted CI/artifact storage. Keep `vercel.json` alongside the artifact when applying policy on another hosting service.

CI builds and tests once, then retains the tested directory as `rca-static-release-<commit>`. Protect the default branch with the validation check in repository settings. Build/release/run are separate: never run `vite build`, install dependencies, or mutate files inside a live serving process.

## Vercel

Import this repository with Node 24. `vercel.json` declares the Vite preset, `npm ci --include=dev`, `npm run build`, `dist` output and response headers. No secrets, database or app environment variables are required. Vercel supplies `VERCEL_GIT_COMMIT_SHA` to identify Git builds. For a different build system, optional `RELEASE_REVISION` must be a full Git SHA; it is public metadata, not a credential.

Validate a preview deployment before promoting that same immutable deployment to production. Avoid rebuilding during promotion. After promotion verify:

1. HTTPS homepage loads, including dynamically loaded result charts and Excel generation.
2. `/release.json` reports the expected revision/artifact ID. The homepage revalidates, hashed `/assets/` files have immutable caching, and CSP, nosniff and framing headers match `vercel.json`.
3. A representative assessment, JSON restore, XLSX download, print and clipboard operation work in the live origin. localStorage is origin-specific; preview/staging and production do not share browser data.
4. Access logs/metrics, uptime monitoring, deployment permissions and rollback retention are configured on the Vercel project. These settings are not established by saving files in this repository. Use `/release.json` as the Vercel readiness probe; the custom `/healthz` endpoint exists only on the portable server.

No Vercel credentials or deployment have been created by this work. Project-level overrides can supersede repository defaults; confirm live responses rather than assuming configuration has propagated.

## Portable Node serving

After building/verifying the artifact:

```sh
PORT=3000 HOST=0.0.0.0 npm start
```

The Node 24 process verifies and serves `dist/` without writing application state. It uses only Node standard-library modules; application `node_modules` is not needed after building. Keep `scripts/serve.mjs`, `scripts/verify-release.mjs`, `vercel.json`, `package.json` and `dist/` at their repository-relative locations when packaging it. No shell init, working directory or database migration is required for HTTP serving. Run it behind a managed HTTPS reverse proxy rather than exposing plain HTTP to end users.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Integer 0–65535; zero requests an ephemeral port for operational tests. |
| `HOST` | `0.0.0.0` | Bind address; use `127.0.0.1` behind a local reverse proxy. |
| `SHUTDOWN_TIMEOUT_MS` | `10000` | Drain grace period, 1–60000 ms. |

`GET /healthz` is healthy only after artifact verification and server startup. A SIGTERM/SIGINT stops acceptance and drains connections. If the configured grace period expires, remaining connections are closed and the process exits unsuccessfully. The supervisor should restart failures and route traffic only after health succeeds. For a process supervisor or container entrypoint, invoke `node scripts/serve.mjs` directly so signals reach the serving process without an npm/shell wrapper. Each instance can use the same immutable directory; it does not store or share user sessions.

Every event is a JSON line on stdout. Request logs include a generated request ID, route class, method class, status, duration and artifact ID; they omit URLs, queries, bodies, IP addresses and scenario data. Pipe stdout to the host log system and configure access, retention, alerts for 5xx/startup/shutdown failures and uptime externally. Browser errors are sanitized local console events with revision/version, not automatically delivered remote telemetry.

## Recovery and rollback

- A render or lazy-load failure displays a recovery screen. Reload obtains the current document; saved browser data is not cleared. Download saved assessments before changing browser data. That recovery file is the raw stored array (including invalid records if present), not a single-scenario export. Preserve it, inspect it locally, and extract individual valid scenario objects for normal JSON import. Never paste confidential assessments into public issue trackers.
- Run `npm run validate:scenario -- /path/to/scenario-or-archive.json` locally to validate a single record or saved array with the application model. It reports only counts/invalid record indices and returns nonzero on invalid data. It does not write to the file or upload it.
- Roll back by promoting a retained, previously verified Vercel deployment or switching the portable server to the previous immutable artifact. Verify its checksum manifest and health/release metadata. Do not overwrite a running artifact directory. Preserve browser JSON backups before introducing a future incompatible scenario format.
- Keep old hashed assets/deployments available for the host's supported retention period so existing tabs can still load their original dynamic chunks. The app handles a missing chunk with recovery, but cannot keep an expired deployment alive.

## Model assurance and data durability

This remains a local screening calculator. An operationally healthy deployment is not a scientifically certified LCA. Obtain appropriate domain review before publishing assured environmental claims. Browser storage can be cleared or unavailable and provides no account or cross-device guarantee. Use the JSON backup workflow, and design an authenticated backing service separately if durable shared storage becomes a product requirement.

See `docs/TWELVE_FACTOR.md` for the architecture assessment and the residual moderate ExcelJS/UUID advisory. Never add secrets to a `VITE_*` variable: frontend build configuration is public to visitors.
