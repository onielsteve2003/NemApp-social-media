# Social Media - Production MERN Stack

A portfolio-grade Twitter/X clone built with production-level architecture and best practices.

## 📋 Project Status

### ✅ Phase 1: Authentication (COMPLETED)
- Landing page with features showcase
- Login and registration with form validation
- Onboarding flow with follow suggestions
- Authentication state management with Zustand
- Mock data system for development
- Toast notifications for user feedback

### 🚀 Upcoming Phases
- **Phase 2:** Core Feed (tweets, composer, infinite scroll)
- **Phase 3:** Profiles (follow, user profiles)
- **Phase 4:** Discovery (search, trends, explore)
- **Phase 5:** Social features (notifications, bookmarks, messages)
- **Phase 6:** Settings & theme
- **Phase 7:** Admin dashboard
- **Phase 8:** Polish & deployment

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, MongoDB, Socket.IO
- **Monorepo:** pnpm workspaces
- **Testing:** Vitest (frontend), Jest (backend)
- **Design System:** Storybook

### Project Structure
```
social-media/
├── apps/
│   ├── web/                 # Next.js frontend + admin
│   └── api/                 # Node.js/Express backend
├── packages/
│   ├── shared-types/        # TypeScript interfaces
│   ├── shared-utils/        # Validation, formatting
│   ├── ui/                  # Design system & components
│   └── api-client/          # Shared API client
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development

**Frontend:**
```bash
npm run dev:web
```
Open [http://localhost:3000](http://localhost:3000)

**Backend:**
```bash
npm run dev:api
```
Server runs on [http://localhost:3001](http://localhost:3001)

**Both:**
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testing
```bash
npm run test
npm run test:web
npm run test:api
```

## 📱 Demo Credentials

```
Email: demo@example.com
Password: Demo@1234
```

## 🎯 Features

### Phase 1: Authentication ✅
- [x] Landing page
- [x] User registration
- [x] Email/password login
- [x] Onboarding flow
- [x] Demo account
- [x] Form validation
- [x] Toast notifications

### Phase 2: Core Feed (Coming Soon)
- [ ] Tweet composer (280 char limit)
- [ ] Home feed with infinite scroll
- [ ] Tweet cards (like, retweet, reply, bookmark, share)
- [ ] Tweet detail page
- [ ] Like counter with animations
- [ ] Optimistic updates

### Phase 3: Profiles
- [ ] User profiles
- [ ] Follow/unfollow
- [ ] Follower/following lists
- [ ] Profile stats
- [ ] Edit profile

### Phase 4: Discovery
- [ ] Search functionality
- [ ] Trending topics
- [ ] Global trends
- [ ] Country-specific trends
- [ ] Explore page

### Phase 5: Social Features
- [ ] Notifications center
- [ ] Direct messaging
- [ ] Bookmarks
- [ ] Mention notifications
- [ ] Follow notifications

### Phase 6: Settings & Theme
- [ ] Account settings
- [ ] Privacy settings
- [ ] Dark/light mode toggle
- [ ] Notification preferences
- [ ] Blocked users

### Phase 7: Admin Dashboard
- [ ] Dashboard analytics
- [ ] User management
- [ ] Content moderation
- [ ] Reports management
- [ ] Trend management

## 📊 Database Schema

**Implemented in Backend:**
- Users (with follow relationships)
- Tweets
- Comments
- Likes
- Notifications
- Messages & Conversations
- Bookmarks
- Trends
- Reports

## 🔐 Authentication

Current implementation uses mock authentication. Production implementation will use:
- JWT tokens with refresh tokens
- bcrypt password hashing
- Redis token blacklist
- Rate limiting

## 🎨 Design System

Custom UI components built with TypeScript and CSS:
- Button (variants: primary, secondary, ghost, danger)
- Input (with validation feedback)
- Toast notifications
- Card, Modal, Dropdown (coming)
- Avatar, Badge (coming)

Fully responsive with Tailwind CSS.

## 📚 Development Workflow

### Adding a Feature
1. Create feature folder in `features/`
2. Structure: `components/`, `hooks/`, `services/`, `store/`, `types/`
3. Create mock data in `mocks/` if needed
4. Implement UI components first
5. Connect to store
6. Add validation
7. Write tests
8. Update progress

### Code Style
- ESLint configured for TypeScript/React
- Prettier for formatting
- Strict TypeScript mode
- Naming conventions: camelCase for variables, PascalCase for components

## 📝 Notes

This is a frontend-first development approach:
1. Build complete UI with mock data
2. Test all interactions
3. Then integrate real backend API
4. Finally add database persistence

All data currently stored in localStorage during demo phase.

## 📄 License

MIT

---

**Built with ❤️ for portfolio**
