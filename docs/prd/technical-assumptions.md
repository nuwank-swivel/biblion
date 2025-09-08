# Technical Assumptions

## Repository Structure

Monorepo

## Service Architecture

Client-side SPA leveraging Firebase + Google services. No custom backend.

- Firebase Authentication for Google SSO
- Firestore for real-time note metadata and content synchronization
- Google Drive API for user-owned file storage/backup
- Local browser storage (IndexedDB) for offline functionality and sync queue

## Testing Requirements

Unit + Integration Testing (components, Firestore, Auth, Drive API, offline; cross-browser)

## Additional Technical Assumptions and Requests

- Framework: React + TypeScript; Build: Vite
- State: Redux Toolkit or Zustand
- Styling: Tailwind CSS or CSS-in-JS
- Deployment: Firebase Hosting (CDN-backed)
- Security: Firebase Security Rules; OAuth scopes least-privilege; keys via Firebase config
- Performance: Lazy loading, virtual scrolling; real-time listeners with backpressure
- Monitoring: Firebase Analytics & Performance; Sentry for client errors
