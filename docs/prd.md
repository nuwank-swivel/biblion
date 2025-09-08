# Smart Note-Taking Platform Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable Google SSO authentication for seamless user onboarding
- Provide basic note-taking functionality with rich text editing
- Implement real-time Google Drive sync for data storage
- Deliver AI-powered writing assistance (grammar, spell check, rewriting)
- Create intuitive notebook and page management system
- Ensure reliable auto-save and version control

### Background Context

The current note-taking landscape lacks seamless integration with existing cloud storage solutions, forcing users to choose between powerful note-taking features and their preferred storage ecosystem. This Phase 1 MVP addresses this core pain point by leveraging Google Drive as the data layer, eliminating backend complexity while providing essential AI-enhanced writing capabilities. Users can maintain their existing Google Drive workflows while gaining intelligent note-taking features, creating immediate value without infrastructure overhead. The focus is on establishing core functionality that validates the value proposition before expanding to advanced features.

### Change Log

| Date       | Version | Description                             | Author   |
| ---------- | ------- | --------------------------------------- | -------- |
| 2025-09-19 | 1.0     | Initial PRD creation from Phase 1 brief | PM Agent |

## Requirements

### Functional Requirements

FR1: The system shall provide Google SSO authentication allowing users to sign in with their Google account

FR2: The system shall enable users to browse and select Google Drive folders for note storage

FR3: The system shall provide real-time bidirectional sync between the application and selected Google Drive folders

FR4: The system shall implement conflict resolution for simultaneous edits between the application and Google Drive

FR5: The system shall display background sync status indicators to inform users of sync progress

FR6: The system shall allow users to create and organize notebooks with hierarchical structure

FR7: The system shall support infinite nested pages and sub-pages within notebooks

FR8: The system shall provide drag-and-drop functionality for page reordering

FR9: The system shall offer quick page navigation and search capabilities

FR10: The system shall provide a rich text editor with essential formatting tools (bold, italic, underline, strikethrough)

FR11: The system shall support font size and family selection

FR12: The system shall provide text and highlight color options

FR13: The system shall support bulleted and numbered lists

FR14: The system shall provide basic paragraph formatting options

FR15: The system shall implement real-time auto-save every 2 seconds

FR16: The system shall maintain version history with restore points

FR17: The system shall provide offline draft protection

FR18: The system shall include a page recovery system for lost content

FR19: The system shall integrate with Gemini/ChatGPT APIs for AI writing assistance

FR20: The system shall provide grammar and spell check functionality

FR21: The system shall offer AI-powered rewriting suggestions

FR22: The system shall provide one-click text improvement options

### Non-Functional Requirements

NFR1: The system shall maintain 99.5% sync reliability with Google Drive

NFR2: The system shall respond to user interactions within 200ms for optimal user experience

NFR3: The system shall support offline functionality with seamless sync on reconnection

NFR4: The system shall implement secure OAuth 2.0 authentication with Google via Firebase Authentication

NFR5: The system shall handle concurrent user sessions without data corruption

NFR6: The system shall provide responsive design for desktop and tablet viewports

NFR7: The system shall maintain data integrity during sync conflicts

NFR8: The system shall implement proper error handling and user feedback for sync failures

NFR9: The system shall optimize Google Drive API usage to stay within rate limits

NFR10: The system shall provide clear visual indicators for sync status and errors

## User Interface Design Goals

### Overall UX Vision

Create an intuitive, distraction-free note-taking experience that feels native to web browsers while seamlessly integrating with Google Drive workflows. The interface should prioritize content creation with AI assistance readily available but not intrusive. Users should feel confident their work is automatically saved and synced, with clear visual feedback about system status.

### Key Interaction Paradigms

- Progressive disclosure: Start simple with basic note-taking, reveal advanced features as users become comfortable
- Contextual AI assistance: AI suggestions appear contextually without disrupting writing flow
- Drag-and-drop organization: Intuitive notebook and page management through direct manipulation
- Real-time feedback: Immediate visual confirmation of sync status, auto-save, and AI processing
- Keyboard-first design: Power users can navigate and format without mouse interaction

### Core Screens and Views

- Authentication Screen: Clean Google SSO login with clear value proposition
- Drive Folder Selection: Simple folder picker with preview of existing notes
- Notebook Dashboard: Hierarchical view of notebooks with quick access to recent pages
- Note Editor: Full-screen writing interface with formatting toolbar and AI suggestions
- Settings Page: User preferences for sync behavior, AI settings, and display options
- Sync Status Panel: Persistent indicator showing sync status and any issues

### Accessibility

WCAG AA

### Branding

Clean, modern design with a focus on readability and minimal cognitive load. Use Google's Material Design principles where appropriate to maintain familiarity with Google Drive integration. Color scheme should be professional yet approachable, with clear visual hierarchy.

### Target Device and Platforms

Web Responsive (desktop and tablet primary; mobile optimized for light edits)

## Technical Assumptions

### Repository Structure

Monorepo

### Service Architecture

Client-side SPA leveraging Firebase + Google services. No custom backend.

- Firebase Authentication for Google SSO
- Firestore for real-time note metadata and content synchronization
- Google Drive API for user-owned file storage/backup
- Local browser storage (IndexedDB) for offline functionality and sync queue

### Testing Requirements

Unit + Integration Testing (components, Firestore, Auth, Drive API, offline; cross-browser)

### Additional Technical Assumptions and Requests

- Framework: React + TypeScript; Build: Vite
- State: Redux Toolkit or Zustand
- Styling: Tailwind CSS or CSS-in-JS
- Deployment: Firebase Hosting (CDN-backed)
- Security: Firebase Security Rules; OAuth scopes least-privilege; keys via Firebase config
- Performance: Lazy loading, virtual scrolling; real-time listeners with backpressure
- Monitoring: Firebase Analytics & Performance; Sentry for client errors

## Epic List

- Epic 1: Foundation & Authentication Setup — Establish project infrastructure, Firebase integration, and Google SSO authentication
- Epic 2: Core Note-Taking Infrastructure — Implement editor, notebook/page management, autosave/versioning with Firestore
- Epic 3: Google Drive Integration & Sync — Bidirectional sync with Drive, offline, and conflict resolution
- Epic 4: AI Writing Assistance — Grammar/spell check and one-click rewrite via Gemini/OpenAI

## Epic 1 Foundation & Authentication Setup

### Epic Goal

Establish project infrastructure, Firebase integration, and Google SSO authentication to enable secure user access and basic app functionality.

#### Story 1.1: Project Setup and Firebase Configuration

As a developer,
I want to set up the React TypeScript project with Firebase configuration,
so that I have a solid foundation for building the note-taking application.

Acceptance Criteria:

1. Create React TypeScript project with Vite build tool
2. Install and configure Firebase SDK with Authentication and Firestore
3. Set up Firebase project with Google Authentication provider enabled
4. Configure environment variables for Firebase API keys
5. Create basic project structure with components, services, and utilities folders
6. Implement Firebase initialization and configuration
7. Set up basic routing structure for authentication flow
8. Create development environment with hot reloading
9. Implement basic error handling and loading states
10. Set up TypeScript configuration with strict mode

#### Story 1.2: Google SSO Authentication

As a user,
I want to sign in with my Google account,
so that I can securely access the note-taking application.

Acceptance Criteria:

1. Implement Firebase Authentication with Google provider
2. Create login page with Google sign-in button
3. Handle authentication state changes and user session management
4. Implement logout functionality
5. Create protected routes that require authentication
6. Display user profile information (name, email, avatar)
7. Handle authentication errors and display user-friendly messages
8. Implement automatic token refresh
9. Store user authentication state in Redux/Zustand
10. Create loading states for authentication process

#### Story 1.3: Basic App Shell and Navigation

As a user,
I want to see a clean, functional app interface after logging in,
so that I can navigate and understand the application structure.

Acceptance Criteria:

1. Create main app shell with header, sidebar, and content area
2. Implement responsive navigation sidebar
3. Add user profile section in header with logout option
4. Create placeholder pages for notebooks, settings, and help
5. Implement basic routing between main sections
6. Add loading states and error boundaries
7. Create consistent layout components (buttons, inputs, modals)
8. Implement basic theming and styling system
9. Add keyboard shortcuts for navigation
10. Ensure mobile-responsive design

## Epic 2 Core Note-Taking Infrastructure

### Epic Goal

Implement the fundamental note-taking capabilities including rich text editor, notebook/page management, and basic data persistence through Firestore.

#### Story 2.1: Notebook and Page Management System

As a user,
I want to create and organize notebooks with hierarchical pages,
so that I can structure my notes in a logical, organized manner.

Acceptance Criteria:

1. Create notebook creation and deletion functionality
2. Implement hierarchical page structure within notebooks
3. Add drag-and-drop page reordering within notebooks
4. Create page creation, editing, and deletion functionality
5. Implement infinite nested sub-pages support
6. Add notebook and page renaming capabilities
7. Create visual hierarchy display with indentation and icons
8. Implement quick page navigation with search
9. Add notebook and page metadata (creation date, last modified)
10. Store notebook and page structure in Firestore

#### Story 2.2: Rich Text Editor Implementation

As a user,
I want to format my text with essential formatting options,
so that I can create well-structured and visually appealing notes.

Acceptance Criteria:

1. Implement rich text editor with basic formatting (bold, italic, underline, strikethrough)
2. Add font size and family selection options
3. Implement text and highlight color pickers
4. Add bulleted and numbered list functionality
5. Create paragraph formatting options (alignment, spacing)
6. Implement text selection and formatting preservation
7. Add keyboard shortcuts for common formatting actions
8. Create formatting toolbar with intuitive icons
9. Implement undo/redo functionality
10. Ensure consistent formatting across different devices

#### Story 2.3: Real-time Auto-save and Version Control

As a user,
I want my notes to be automatically saved and have version history,
so that I never lose my work and can recover previous versions.

Acceptance Criteria:

1. Implement real-time auto-save every 2 seconds
2. Create version history system with restore points
3. Add visual indicators for save status (saving, saved, error)
4. Implement offline draft protection with local storage
5. Create page recovery system for lost content
6. Add conflict resolution for simultaneous edits
7. Implement version comparison and diff viewing
8. Create manual save trigger for immediate saving
9. Add version history cleanup for old versions
10. Store version data in Firestore with proper indexing

#### Story 2.4: Firestore Data Integration

As a user,
I want my notes to be automatically synchronized across devices,
so that I can access my work from anywhere.

Acceptance Criteria:

1. Implement Firestore data models for notebooks, pages, and content
2. Create real-time listeners for data synchronization
3. Implement offline data persistence with Firebase offline support
4. Add data validation and error handling for Firestore operations
5. Create efficient data queries for notebook and page retrieval
6. Implement data security rules for user data protection
7. Add data migration and cleanup utilities
8. Create data backup and restore functionality
9. Implement data compression for large content
10. Add performance monitoring for data operations

## Epic 3 Google Drive Integration & Sync

### Epic Goal

Enable seamless integration with Google Drive for file storage, real-time sync, conflict resolution, and offline functionality.

#### Story 3.1: Google Drive API Integration

As a user,
I want to connect my Google Drive account and select folders for note storage,
so that my notes are backed up to my personal Google Drive.

Acceptance Criteria:

1. Implement Google Drive API v3 integration with proper authentication
2. Create folder selection interface for choosing Google Drive storage location
3. Add Google Drive authentication flow with proper scopes
4. Implement folder browsing and selection functionality
5. Create folder permission validation and error handling
6. Add Google Drive quota monitoring and warnings
7. Implement file creation and update operations in Google Drive
8. Create Google Drive file metadata management
9. Add Google Drive API rate limiting and retry logic
10. Implement Google Drive file conflict detection

#### Story 3.2: Bidirectional Sync System

As a user,
I want my notes to automatically sync between the app and Google Drive,
so that I can access my work from any device and maintain data consistency.

Acceptance Criteria:

1. Implement real-time sync from Firestore to Google Drive
2. Create background sync process with status indicators
3. Add sync queue management for offline operations
4. Implement conflict resolution for simultaneous edits
5. Create sync status dashboard with progress indicators
6. Add manual sync trigger for immediate synchronization
7. Implement sync error handling and retry mechanisms
8. Create sync history and audit logging
9. Add sync performance monitoring and optimization
10. Implement data integrity validation during sync

#### Story 3.3: Offline Functionality and Conflict Resolution

As a user,
I want to work offline and have my changes sync when I reconnect,
so that I can be productive even without internet connectivity.

Acceptance Criteria:

1. Implement offline mode detection and user notification
2. Create offline data storage using IndexedDB and Firebase offline persistence
3. Add offline sync queue for pending operations
4. Implement conflict resolution interface for user decision-making
5. Create offline indicator and sync status display
6. Add automatic sync on reconnection with conflict detection
7. Implement data merge strategies for different conflict types
8. Create offline data validation and integrity checks
9. Add offline storage cleanup and optimization
10. Implement offline error handling and user guidance

#### Story 3.4: Google Drive File Management

As a user,
I want to manage my note files in Google Drive,
so that I can organize and access them through standard Google Drive interface.

Acceptance Criteria:

1. Implement Google Drive file naming and organization system
2. Create file metadata synchronization between app and Google Drive
3. Add Google Drive file versioning and history
4. Implement file sharing and permission management
5. Create Google Drive search integration for finding notes
6. Add file export functionality to various formats (PDF, Markdown)
7. Implement file import from Google Drive to app
8. Create file cleanup and archiving functionality
9. Add Google Drive storage analytics and usage tracking
10. Implement file security and access control

## Epic 4 AI Writing Assistance

### Epic Goal

Deliver essential, privacy-conscious AI assistance for grammar, spell check, and one-click rewriting directly in the editor using client-side calls to providers (Gemini/OpenAI) via Firebase-configured API keys. Keep UX contextual and non-intrusive.

#### Story 4.1: AI Provider Integration (Gemini/OpenAI)

As a user,
I want AI features powered by trusted providers,
so that I can improve my writing with minimal setup.

Acceptance Criteria:

1. Integrate Gemini and OpenAI SDKs with client-side usage via env-config.
2. Add provider selection in Settings with fallback logic.
3. Securely load API keys from Firebase Remote Config or environment.
4. Implement request timeouts and exponential backoff.
5. Mask/strip PII toggles before sending content (configurable).
6. Handle quota/rate-limit errors with user-friendly messages.
7. Log anonymized errors to Firebase Performance/Analytics.
8. Add a small usage meter (optional) in Settings.

#### Story 4.2: Grammar and Spell Check

As a user,
I want inline grammar and spell check suggestions,
so that I can quickly fix issues without leaving the editor.

Acceptance Criteria:

1. Add “Check grammar” action in editor toolbar and Cmd/Ctrl+G shortcut.
2. Underline issues inline; show suggestion popover on click.
3. Accept, reject, and accept-all actions supported.
4. Batch-check current selection or full page.
5. Handle large content by chunking with stable cursor mapping.
6. Offline: queue request and notify when online is required.
7. Respect privacy toggle (skip sending content if disabled).
8. Provide minimal latency feedback (spinner, progress).
9. Persist last-run timestamp per page.
10. No destructive edits without explicit user action.

#### Story 4.3: One-Click Rewrite and Improve

As a user,
I want one-click rewriting suggestions,
so that I can improve clarity, tone, and concision quickly.

Acceptance Criteria:

1. Provide “Improve” button and right-click “Rewrite with AI”.
2. Presets: Concise, Formal, Friendly, Neutral (minimal set).
3. Preview diff before apply; Accept/Reject actions.
4. Support selection-only or entire paragraph scope.
5. Preserve formatting (bold, lists) after rewrite.
6. Add retry with a different preset if first result is poor.
7. Respect token/size limits with chunking.
8. Show small tokens/time estimate in the UI hint.
9. Fail gracefully with clear messaging; never lose original text.
10. Track accepted vs rejected suggestion count (for success metrics).

#### Story 4.4: Contextual Hints and Non-Intrusive UX

As a user,
I want AI help that’s available but not distracting,
so that my writing flow isn’t interrupted.

Acceptance Criteria:

1. Collapse AI toolbar group by default; expand on demand.
2. Show subtle inline chips for suggestions, never modal by default.
3. Keyboard-first flows for accept/reject (e.g., Enter/Esc).
4. Do not auto-run AI; user explicitly triggers checks.
5. Respect global “AI Assistance Off” toggle.
6. Provide quick undo for any AI-applied change.
7. Keep editor performance smooth (<16ms frame on interactions).
8. Accessibility: suggestions are screen-reader friendly.

#### Story 4.5: Privacy & Data Controls

As a user,
I want clear privacy controls,
so that I can choose what content is shared with AI providers.

Acceptance Criteria:

1. Settings include: “Send full text”, “Mask emails/URLs”, “Don’t send content”.
2. Explain implications inline with short tooltips.
3. Default to masking sensitive patterns when enabled.
4. Never store AI responses longer than needed to render.
5. Log only anonymized metrics.
6. Provide “Delete temporary AI data now” action.

## Next Steps

### UX Expert Prompt

Design a minimal, distraction-free note editor and navigation for a web-only MVP that integrates Google SSO, Firestore sync, and Google Drive folder selection. Prioritize accessibility (WCAG AA), keyboard-first flows, and clear sync status indicators. Use progressive disclosure for advanced features and ensure a non-intrusive AI assistance UX.

### Architect Prompt

Draft a React + TypeScript SPA using Vite, Firebase Auth (Google), Firestore (offline enabled), and Google Drive API. Define data models for notebooks/pages, real-time listeners, autosave/versioning, and a bidirectional Drive sync process (with queue and conflict resolution). Plan Firebase Security Rules and minimal Hosting deployment. No custom backend.
