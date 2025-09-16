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
14. **NEW:** Home/App header displays centralized app name constant (see Story 1.4)

### Story 1.4: Home screen shows app name as "Biblion 1.0"

As a user,
I want the home screen/header to display the correct app name "Biblion 1.0",
so that branding is consistent and I know I’m using the current version.

Acceptance Criteria:

1. Primary header on the home screen displays title "Biblion 1.0".
2. App name sourced from a single configuration constant to avoid duplication.
3. Title uses existing Material UI typography/theming matching spacing and color rules.
4. Name appears consistently in the header bar and browser/page title where applicable.
5. Unit tests verify rendered text and configuration source.
6. Update screenshots/docs to reflect the new name with Figma reference.