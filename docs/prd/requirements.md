# Requirements

## Functional Requirements

FR1: The system shall provide Google SSO authentication allowing users to sign in with their Google account

FR2: The system shall enable users to browse and select Google Drive folders for note storage
FR2.1: The system shall persist the selected Google Drive folderId in Firestore under `users/{uid}.selectedFolder`
FR2.2: The system shall cache the selected folder locally for fast startup and reconcile with Firestore on launch

FR3: The system shall provide real-time bidirectional sync between the application and selected Google Drive folders

FR4: The system shall implement conflict resolution for simultaneous edits between the application and Google Drive

FR5: The system shall display background sync status indicators to inform users of sync progress
FR5.1: The system shall show the currently selected folder name/breadcrumb sourced from Firestore (display-only)

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

## Non-Functional Requirements

NFR1: The system shall maintain 99.5% sync reliability with Google Drive

NFR2: The system shall respond to user interactions within 200ms for optimal user experience

NFR3: The system shall support offline functionality with seamless sync on reconnection

NFR4: The system shall implement secure OAuth 2.0 authentication with Google via Firebase Authentication
NFR4.1: The system shall restrict Firestore access using security rules to allow users to read/write only their own `users/{uid}` document

NFR5: The system shall handle concurrent user sessions without data corruption

NFR6: The system shall provide responsive design for desktop and tablet viewports

NFR7: The system shall maintain data integrity during sync conflicts

NFR8: The system shall implement proper error handling and user feedback for sync failures

NFR9: The system shall optimize Google Drive API usage to stay within rate limits

NFR10: The system shall provide clear visual indicators for sync status and errors
