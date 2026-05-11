# Quick Start Guide

## Installation

### 1. Navigate to Project
```bash
cd c:\Users\steph\Documents\builds\social-media
```

### 2. Install Dependencies
```bash
npm install
```

## Running the Application

### Start Frontend (Next.js Dev Server)
```bash
npm run dev:web
```
- Frontend runs on: **http://localhost:3000**
- Hot reload enabled
- Auto-compile on file changes

### Start Backend (Node.js Server)
```bash
npm run dev:api
```
- Backend runs on: **http://localhost:3001**
- Health check: `http://localhost:3001/api/health`

### Start Both Simultaneously
```bash
npm run dev
```
- Runs both frontend and backend in parallel
- Both in watch mode for development

## Testing Phase 1

### Scenario 1: Try Demo Login
1. Go to `http://localhost:3000`
2. Click "Sign In"
3. Click "Demo Login" button
4. Should see success toast and redirect to home page

### Scenario 2: Create New Account
1. Go to `http://localhost:3000`
2. Click "Sign Up"
3. Fill in form:
   - Display Name: "Your Name"
   - Username: "yourname"
   - Email: "your@email.com"
   - Password: "Test@1234"
   - Confirm Password: "Test@1234"
4. Should see success toast and redirect to onboarding
5. Click follow on some users, then "Complete"
6. Should arrive at home page

### Scenario 3: Test Form Validation
1. Try to register with weak password
2. Try to use existing email (demo@example.com)
3. Try to use username > 15 characters
4. All should show error messages

### Scenario 4: Test Persistence
1. Log in
2. Refresh page (Ctrl+R)
3. Should still be logged in
4. Close browser and reopen
5. Data persists in localStorage

## Building for Production

```bash
npm run build
```

This builds:
- Frontend: `apps/web/.next/`
- Backend: `apps/api/dist/`
- All packages compiled

## Testing

```bash
npm run test
npm run test:web
npm run test:api
```

## Linting & Formatting

```bash
npm run lint
npm run format
npm run format:check
npm run type-check
```

## Project Structure Quick Reference

```
apps/web/                    # Frontend (Next.js)
├── app/                     # Routes
│   ├── (public)/           # Landing, Login, Register
│   ├── (protected)/        # Home, Onboarding
│   └── (admin)/            # Admin dashboard
├── src/
│   ├── mocks/              # Mock data
│   ├── stores/             # Zustand stores
│   ├── features/           # Feature modules
│   ├── components/         # Reusable components
│   └── lib/                # Utilities
└── package.json

apps/api/                    # Backend (Node.js)
├── src/
│   ├── app.ts              # Express app
│   ├── server.ts           # Server entry point
│   ├── routes/             # API routes (TBD)
│   ├── models/             # MongoDB models (TBD)
│   └── services/           # Business logic (TBD)
└── package.json

packages/                    # Shared code
├── shared-types/           # TypeScript interfaces
├── shared-utils/           # Utilities
├── ui/                     # Design system
└── api-client/             # API client
```

## Demo Credentials

```
Email: demo@example.com
Password: Demo@1234
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:web` | Start only frontend |
| `npm run dev:api` | Start only backend |
| `npm run build` | Build for production |
| `npm run test` | Run all tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is already in use:
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# For macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Dependencies Not Installing
```bash
npm cache clean --force
npm install
```

### TypeScript Errors
```bash
npm run type-check
```

### Hot Reload Not Working
- Try stopping and restarting: `Ctrl+C` then `npm run dev`
- Check that you're editing files in `apps/web/src/` or `app/`

## Next Steps

After testing Phase 1:
1. Review `PHASE_1_GUIDE.md` for detailed feature descriptions
2. Check `FILES_REFERENCE.md` for file organization
3. Read `PHASE_1_COMPLETE.md` for implementation summary
4. Start Phase 2 when ready (Feed system)

## Need Help?

- Check `README.md` for project overview
- See `PHASE_1_GUIDE.md` for Phase 1 details
- Review memory files in session notes
- Check code comments in components

---

**Happy coding! Phase 1 is ready to explore. 🚀**
