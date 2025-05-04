# Echo Markets Onboarding Guide

Welcome to the Echo Markets project! This guide will help you get set up, understand the project structure, and start contributing quickly.

## 1. Prerequisites
- Node.js (v18+ recommended)
- pnpm (preferred) or npm/yarn
- Git
- Chrome (for extension development/testing)

## 2. Setup
```sh
# Clone the repository
git clone https://github.com/echo-markets/echo-markets.git
cd echo-markets

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## 3. Project Structure
- `/app` – Routing and page-level logic
- `/components` – Feature modules and shared UI
- `/contexts` – React context providers
- `/hooks` – Custom hooks
- `/lib` – Utilities and helpers
- `/styles` – Global and theme styles
- `/public` – Static assets
- `/docs` – Documentation

## 4. Key Concepts
- **Feature Modules:** Each major feature (news feed, leaderboard, trading, simulation, etc.) is a self-contained React component/module.
- **Shared UI:** Common UI elements are in `/components/ui/`.
- **Context:** App-wide state is managed with React context in `/contexts/`.
- **Utilities:** API, formatting, and helper functions live in `/lib/`.

## 5. Running Tests
```sh
# Run all tests
pnpm test
```

## 6. Linting & Formatting
```sh
# Check and fix lint errors
pnpm lint
```

## 7. Contributing
- Read `CONTRIBUTING.md` for guidelines.
- Open a PR for all changes.
- Use clear, descriptive commit messages.

## 8. Support
For help, contact the project maintainer or open an issue on GitHub.
