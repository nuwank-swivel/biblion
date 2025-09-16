# Epic 1 - foundation-authentication-setup.md


## Epic Goal

Establish project infrastructure, Firebase integration, and Google SSO authentication to enable secure user access and basic app functionality.

### Story 1.1: Project Setup and Firebase Configuration

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

### Story 1.2: Google SSO Authentication

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

### Story 1.3: Basic App Shell and Navigation

As a user,
I want to see a clean, functional three-column note-taking interface after logging in,
so that I can navigate between notebooks, browse notes, and access creation functionality.

Acceptance Criteria:

1. Create three-column layout: Notebooks sidebar (left), Notes list (middle), Note editor (right)
2. Implement responsive navigation with collapsible sidebars for mobile
3. Add user profile section in header with logout option
4. Create placeholder pages for notebooks, settings, and help
5. Implement basic routing between main sections
6. Add loading states and error boundaries
7. Create consistent layout components (buttons, inputs, modals)
8. Implement Material UI theming system with light theme
9. Add keyboard shortcuts for navigation
10. Ensure mobile-responsive design with drawer navigation
11. **NEW:** Implement "Add Notebook" and "Add Notes" buttons with yellow styling matching Figma design
12. **NEW:** Create modal dialog infrastructure for notebook and note creation
13. **NEW:** Add modal overlay and positioning system for consistent UX

### Story 1.4: Home Screen Title Shows "Biblion 1.0"

As a user,
I want the home screen to show the versioned app name "Biblion 1.0",
so that I can immediately confirm which version of the app I am using.

Acceptance Criteria:

1. The home screen title displays the exact text: "Biblion 1.0".
2. Typography, size, weight, and alignment follow the Figma reference.
3. No other copy is changed; scope limited to the home screen title.
4. Change is purely presentational; no functional behavior is altered.
5. Title remains responsive and does not wrap on standard desktop widths.
6. Tests assert the presence of "Biblion 1.0" on the home route.