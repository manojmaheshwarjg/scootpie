# Vesaki - AI Personal Shopping Assistant

Your AI-powered personal shopping assistant with virtual try-on capabilities.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
DATABASE_URL=your_neon_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
GEMINI_API_KEY=your_gemini_key
```

#### Get Your API Keys:
- **Neon Database**: https://neon.tech (Free tier available)
- **Clerk Auth**: https://clerk.com (Free tier available)
- **Gemini API**: https://ai.google.dev

### 3. Push Database Schema
```bash
npm run db:push
```

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Features

### Core Features
- **Swipe Mode**: Tinder-style product discovery with gesture controls
- **Virtual Try-On**: AI-powered try-on with Gemini API
- **Collections**: Organize favorite items into custom collections
- **Feed**: Pinterest-style grid with trending, new, and curated items
- **AI Chat**: Conversational styling assistant
- **Profile**: Manage photos, preferences, and settings

### Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Auth**: Clerk
- **Database**: Neon (PostgreSQL + pgvector)
- **ORM**: Drizzle
- **State**: Zustand + React Query
- **AI**: Gemini API + Anthropic Claude

## Project Structure

```
src/
├── app/              # Pages and API routes
├── components/       # Reusable UI components
├── lib/              # Database, utilities, mock data
├── services/         # External service integrations
├── store/            # State management
└── types/            # TypeScript type definitions
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Development

The app uses:
- App Router for routing
- Server Components where possible
- Client Components for interactivity
- API Routes for backend logic
- Clerk for authentication
- Mock data for initial development

## Documentation

- [Full Build Summary](./FINAL_BUILD_SUMMARY.md)
- [Build Status](./BUILD_STATUS.md)
- [Original PRD](./vesaki-prd.md)

## Design

### Color Palette
- Primary: Pink to Purple gradient
- Background: Soft pink/purple/blue gradients
- Cards: White with subtle shadows
- Accents: Pink (#E1174D) and Purple (#9C27B0)

### Key UX Patterns
- Swipe gestures for product discovery
- Bottom navigation for mobile
- Floating action buttons
- Smooth animations and transitions
- Empty states with clear CTAs

## Security

- All routes protected with Clerk middleware
- API routes require authentication
- Environment variables for secrets
- Type-safe database queries
- Input validation on all forms

## Performance

- Image optimization with Next.js Image
- Lazy loading
- Code splitting
- React Query caching
- Optimistic UI updates

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

All rights reserved.

## Contact

For questions or support, please reach out to the development team.

---

Built with Next.js, TypeScript, and Tailwind CSS
