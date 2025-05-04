# Echo Markets Architecture Overview

## Overview
Echo Markets is a modular, extensible React (Next.js) application with a focus on real-time formatting, user experience, and performance.

## Key Architectural Decisions
- **Feature Modules:** Each major feature is a self-contained module in `/components`.
- **Shared UI:** Reusable UI elements in `/components/ui`.
- **Context Providers:** App-wide state handled via React context in `/contexts`.
- **Utilities:** Common helpers in `/lib`.
- **Styling:** Tailwind CSS for utility-first styling, with support for dark/light mode.
- **Testing:** Jest and React Testing Library for unit/integration tests; Cypress/Playwright for e2e.

## Data Flow
- State flows from context providers down to feature modules and UI components.
- Utilities and hooks are used for API calls, formatting, and side effects.

## Extensibility
- Add new features as modules in `/components`.
- Extend shared UI in `/components/ui`.
- Add new contexts or hooks as needed.

## Deployment
- Uses Next.js for SSR and static export.
- CI/CD recommended for PR validation and deployment.
