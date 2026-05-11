# Project File Directory Reference

## Root Configuration Files
- `package.json` - Monorepo root with workspace scripts
- `pnpm-workspace.yaml` - pnpm workspaces configuration
- `tsconfig.json` - Base TypeScript configuration with path aliases
- `.eslintrc.json` - ESLint configuration
- `.prettierrc.json` - Prettier formatting config
- `.gitignore` - Git ignore rules
- `README.md` - Main project documentation
- `PHASE_1_GUIDE.md` - Phase 1 implementation guide

## Frontend App: `apps/web/`

### Configuration
- `package.json` - Frontend dependencies (Next.js, React, Zustand, Tailwind)
- `tsconfig.json` - Frontend TypeScript config with path aliases
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.eslintrc.json` - Frontend ESLint config

### Mock Data
- `src/mocks/auth.ts` - Mock authentication service and user data

### State Management
- `src/stores/authStore.ts` - Zustand auth store with login/register/logout

### Utilities & Validation
- `src/lib/validation.ts` - Form validation functions

### Components - Common
- `src/components/common/Toast.tsx` - Toast notification system
- `src/components/common/Input.tsx` - Reusable form input component

### Components - Layouts (TBD)
- `src/components/layouts/` - App layout wrapper (coming)

### Features - Auth
- `src/features/auth/components/LoginForm.tsx` - Login form component
- `src/features/auth/components/RegisterForm.tsx` - Register form component

### Styles
- `src/styles/globals.css` - Global styles with Tailwind

### App Routes
- `app/layout.tsx` - Root layout with ToastProvider
- `app/(public)/layout.tsx` - Public routes layout
- `app/(public)/page.tsx` - Landing page
- `app/(public)/login/page.tsx` - Login page
- `app/(public)/register/page.tsx` - Register page
- `app/(protected)/layout.tsx` - Protected routes auth guard
- `app/(protected)/onboarding/page.tsx` - Onboarding page
- `app/(protected)/home/page.tsx` - Home/feed placeholder
- `app/(admin)/layout.tsx` - Admin layout (prepared, empty)

### Environment
- `.env.example` - Frontend environment variables template

## Backend App: `apps/api/`

### Configuration
- `package.json` - Backend dependencies (Express, MongoDB, Socket.IO)
- `tsconfig.json` - Backend TypeScript config
- `.eslintrc.json` - Backend ESLint config
- `jest.config.js` - Jest testing configuration

### Source Code
- `src/app.ts` - Express app setup with middleware
- `src/server.ts` - Server entry point with Socket.IO
- `src/config/` - Database and config (TBD)
- `src/middleware/` - Custom middleware (TBD)
- `src/routes/` - API routes (TBD)
- `src/controllers/` - Request handlers (TBD)
- `src/services/` - Business logic (TBD)
- `src/models/` - MongoDB models (TBD)
- `src/utils/` - Utility functions (TBD)
- `src/socket/` - Socket.IO handlers (TBD)

### Environment
- `.env.example` - Backend environment variables template

## Shared Packages

### shared-types: `packages/shared-types/`
- `package.json` - Package config
- `tsconfig.json` - TypeScript config
- `src/index.ts` - All TypeScript interfaces
  - User types
  - Tweet/Comment types
  - Notification types
  - Message types
  - Bookmark types
  - Trend types
  - Report types
  - API request/response types
  - Error types

### shared-utils: `packages/shared-utils/`
- `package.json` - Package config
- `tsconfig.json` - TypeScript config
- `src/index.ts` - All utility functions
  - Validation utilities
  - Date formatting
  - String utilities
  - Array utilities
  - Object utilities
  - Constants

### ui: `packages/ui/`
- `package.json` - UI package config with Storybook
- `tsconfig.json` - TypeScript config
- `src/components/atoms/Button/` - Button component
  - `Button.tsx` - Button component
  - `Button.css` - Button styles
  - `index.ts` - Export
- `src/styles/globals.css` - Design tokens and global styles
- `src/index.ts` - Package exports

### api-client: `packages/api-client/`
- `package.json` - API client package config
- `tsconfig.json` - TypeScript config
- `src/client.ts` - Axios-based API client
- `src/index.ts` - Package exports

## Key Architectural Patterns

### File Structure Per Feature (e.g., auth)
```
src/features/{feature}/
├── components/
│   ├── ComponentName.tsx
│   └── index.ts
├── hooks/
│   └── useFeature.ts
├── services/
│   └── featureService.ts
├── store/
│   └── featureStore.ts
├── types/
│   └── index.ts
└── index.ts
```

### Store Pattern (Zustand)
```typescript
const useStore = create<State>()(
  devtools(
    persist((set) => ({
      // state
      action: () => set(...)
    }))
  )
);
```

### Component Pattern
```typescript
export interface ComponentProps {
  prop1: string;
  prop2?: boolean;
}

export const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ prop1, prop2 }, ref) => {
    return <div ref={ref}>{prop1}</div>;
  }
);
Component.displayName = 'Component';
```

## Documentation Files
- `README.md` - Main project README
- `PHASE_1_GUIDE.md` - Detailed Phase 1 guide
- This file - File directory reference

---

**Total files created: ~50+ configuration, component, and utility files**
**Lines of code: ~2000+ (excluding dependencies)**
