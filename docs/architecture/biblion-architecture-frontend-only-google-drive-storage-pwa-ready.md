# Biblion Architecture (Frontend-only, Google Drive storage, PWA-ready)

## Goals

- Minimal backend: deliver as a static frontend; no server state.
- Each user’s data stored in their own Google Drive via OAuth2 + Drive API.
- Roadmap to PWA: offline-first, installable, background sync.

## High-level Overview

- UI: React + TypeScript (Vite) app delivered via CDN. (Optionally Next.js static export if SSG/ISR is desired.)
- Auth: Firebase Authentication (Google provider, PKCE under the hood) requesting Drive App Data scope; obtain Google OAuth access token for Drive calls.
- Storage: Google Drive App Data Folder + optional user-selected folder; files as JSON.
- Sync: Client maintains local cache (IndexedDB) and syncs with Google Drive.
- No backend: use Google APIs directly from client; optional future edge functions for value-add.
- User config: persist the selected Google Drive `folderId` in Firestore under `users/{uid}` for cross-device access.

## Tech stack (React + TypeScript)

- React with TypeScript for type-safe UI and domain models
- Vite as the bundler/dev server for fast HMR and simple static output
- React Router for SPA routing
- Material UI as the UI component library with theming
- Firebase Authentication for Google Sign-In and token handling
- Zod for runtime validation of persisted JSON
- idb for ergonomic IndexedDB access
- Workbox for service worker and caching strategies
- Sentry (optional) for client-side error monitoring
- Firebase Hosting (optional) for static deploys and easy HTTPS

## Library versions (recommended pins)

- react: 18.2.0
- react-dom: 18.2.0
- typescript: 5.4.5
- vite: 5.2.0
- @vitejs/plugin-react: 4.2.0
- react-router-dom: 6.26.2
- firebase: 10.12.2
- @mui/material: 5.15.20
- @mui/icons-material: 5.15.20
- @emotion/react: 11.11.4
- @emotion/styled: 11.11.5
- zod: 3.22.4
- idb: 8.0.0
- workbox-window: 7.0.0
- workbox-build: 7.0.0
- @sentry/react: 7.114.0
- @sentry/tracing: 7.114.0
- eslint: 8.57.0
- @typescript-eslint/parser: 7.5.0
- @typescript-eslint/eslint-plugin: 7.5.0
- firebase-tools (dev, optional): 13.0.0

## Project folder structure

```
/ (repo root)
  /docs
    architecture.md
    prd.md
  /src
    /app
      App.tsx
      main.tsx
      routes.tsx
      theme.ts (MUI theme)
      index.css
    /components
      ui/ (reusable MUI-based components)
      layout/
    /features
      auth/ (Firebase Auth glue, provider, hooks)
      data/ (repositories, Drive adapter, zod schemas)
      sync/ (queues, change polling, conflict handling)
      pwa/ (service worker registration, helpers)
    /lib
      idb.ts (IndexedDB helpers)
      http.ts (fetch with bearer token)
      logger.ts
    /pages (if using file-based routing approach)
    /assets
  /public
    index.html
    manifest.webmanifest
    icons/ (PWA icons)
    robots.txt
  /config
    firebase.json (if hosting)
    .firebaserc (if hosting)
  package.json
  tsconfig.json
  vite.config.ts
  .eslintrc.cjs
```

## Firebase integration

- Use Firebase Authentication with the Google provider and request the Drive App Data scope so the OAuth access token can be used directly with the Drive API.
- Sign-in flow (client-only):
  - Initialize Firebase app and Auth.
  - Configure `GoogleAuthProvider`:
    - `provider.addScope('https://www.googleapis.com/auth/drive.appdata')`
    - (optional) `provider.addScope('https://www.googleapis.com/auth/drive.file')` for user-visible files
  - Use `signInWithPopup` (or `signInWithRedirect` for iOS/Safari).
  - Extract OAuth access token: `GoogleAuthProvider.credentialFromResult(result)?.accessToken`
  - Use that access token in `Authorization: Bearer <token>` when calling Drive API.
- App Check (optional): Web Recaptcha Enterprise for protecting API usage proxies or future endpoints.
- Hosting (optional): Firebase Hosting to serve the SPA and provide HTTP/2 + HTTPS by default.
- Firestore (scoped, minimal): used to store per-user configuration only (e.g., selected Drive `folderId`, display name, breadcrumb, updatedAt). Notes content remains in Drive.

User config document shape (Firestore):

```
users/{uid} => {
  selectedFolder: {
    id: string,           // Drive folderId (canonical)
    name?: string,        // display-only
    breadcrumb?: string[],
    updatedAt: Timestamp,
  }
}
```

## Components

- App Shell: routing, layout, error boundaries.
- Data Layer: repository that abstracts IndexedDB cache + Drive API adapter.
- Auth Module: token acquisition/refresh, scope management, sign-in/out UI.
- Sync Engine: two-way sync, conflict detection (E-Tag / revisionId), backoff, retries.
- Models: typed schemas (Zod/TypeScript) for documents/collections.
- UI Components: list/detail editors, search, filters.
- PWA Layer: service worker, cache strategies, background sync, notifications.
- User Config: Firestore adapter to read/write `users/{uid}.selectedFolder`; local cache for fast boot and reconciliation.

## Data Model (example)

- Document: { id, title, content, tags[], updatedAt, version }
- Stored as JSON files per doc under Drive appDataFolder; index file for lookups.
- File naming: `${id}.json`; index: `index.json` mapping ids to metadata.

## Storage Strategy

- Primary: IndexedDB for fast local reads/writes.
- Source of truth: Google Drive revisions.
- On launch: hydrate from IndexedDB; then reconcile with Drive (delta via changes.list).
- Conflict resolution: last-writer-wins with revisionId guard; surface conflicts in UI.

## Authentication & Authorization

- Identity: Firebase Authentication (Google provider).
- Scopes: `https://www.googleapis.com/auth/drive.appdata` (and optionally `drive.file`).
- Access token: retrieved via `GoogleAuthProvider.credentialFromResult(result)?.accessToken` after sign-in.
- Token storage: memory; refresh by re-auth or silent refresh via Firebase session when possible.

## Sync Flow

1. User edits -> write to IndexedDB immediately.
2. Queue mutation with local op id.
3. Attempt upload to Drive; use `If-Match` on revisionId.
4. On success, update local revisionId and clear queue entry.
5. Periodically poll Drive changes API for remote edits; merge/apply.
6. Background sync via service worker when online.

## PWA Plan

- Manifest: name, icons, display standalone, theme/background colors.
- Service Worker: Workbox; strategies
  - HTML shell: NetworkFirst
  - Static assets: StaleWhileRevalidate
  - API (Google): NetworkOnly with background sync for mutations
  - IndexedDB persisted for app data
- Offline UX: skeleton screens, queued actions, conflict banners.

## Security & Privacy

- Least-privilege scopes; store only user’s documents in appDataFolder.
- No central server; no cross-user data access.
- Use Content Security Policy and OAuth best practices.
- Use Firebase project-level security rules only if/when adding Firebase storage/DB later.

## Observability (client-side)

- Lightweight analytics (privacy-first), error reporting (Sentry) with PII scrubbing.
- In-app diagnostics view for sync status and last errors.

## CI/CD

- Pipeline: GitHub Actions runs on pull requests and `main` pushes/tags.
- Stages: install + cache → lint → type-check → test → build → (optional) PWA/Lighthouse audit → deploy.
- Environments: preview deploys on PRs; production deploy on `main` (or semver tag).
- Required checks: ESLint, TypeScript, unit tests, build success, bundle-size threshold.
- Secrets: store deployment tokens as repository secrets; limit to environment scopes.

Minimal CI example (`.github/workflows/ci.yml`):

```
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run typecheck --if-present
      - run: npm test --if-present -- --ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: dist
          path: dist
```

Deploy options (pick one):

- Firebase Hosting

  - Preview: deploy on PR using channel previews; comment URL on PR.
  - Production: deploy on `main` after CI passes.
  - Secrets: `FIREBASE_TOKEN` (or use `setup-firebase` with service account), optional `SENTRY_AUTH_TOKEN` for release tracking.
  - Minimal deploy step:
    - `uses: FirebaseExtended/action-hosting-deploy@v0` with `channelId: preview` on PRs; no `channelId` on `main`.

- Cloudflare Pages
  - Preview: automatic preview on PR.
  - Production: on `main`.
  - Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`.
  - Minimal deploy step:
    - `uses: cloudflare/pages-action@v1` with `projectName`, `accountId`, `apiToken`.

Governance & quality gates

- Protect `main` with required status checks (lint, typecheck, tests, build, optional lighthouse).
- Bundle size budget via `size-limit` or `rollup-plugin-visualizer` thresholds in CI.
- Release management: tag `vX.Y.Z` to cut a release; CI can create a GitHub Release and upload build artifacts.
- Rollback: keep previous deploys; use Firebase Hosting release history or Cloudflare Pages deployments to revert.

## Risks & Mitigations

- Drive API quotas: cache aggressively; exponential backoff.
- Token expiry: re-auth via Firebase Auth; handle missing/expired Drive token by prompting sign-in.
- Conflicts: expose resolution UI for edge cases.

## Future Extensions

- Optional backend or Cloud Functions for full-text search or share links (kept minimal).
- Collaboration via Drive file comments or future realtime provider.
- Migrate to full PWA with install prompts and offline-first by default.
