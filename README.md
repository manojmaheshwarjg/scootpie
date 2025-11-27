# Scootpie - AI Personal Shopping Assistant

Your AI-powered personal shopping assistant with virtual try-on capabilities. Discover fashion items, see how they look on you, and build complete outfits with AI-powered styling.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory and add your API keys:

```bash
DATABASE_URL=your_neon_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

#### Get Your API Keys:
- **Neon Database**: https://neon.tech (Free tier available) - PostgreSQL database
- **Clerk Auth**: https://clerk.com (Free tier available) - Authentication
- **Gemini API**: https://ai.google.dev - AI for virtual try-on and chat

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

### Core Features (Implemented)

- **Swipe Mode**: Tinder-style product discovery with drag gestures and swipe controls
  - Search for fashion items by description
  - Swipe right to like, left to pass, up to favorite
  - Real-time product recommendations
  - Fixed navigation header
- **Virtual Try-On**: AI-powered virtual try-on using Gemini API
  - Upload up to 5 photos for try-on
  - Generate try-on images on demand
  - View products on yourself before buying
  - Cached try-on results for faster loading
- **Collections**: Organize favorite items into collections
  - Default "Likes" collection
  - Create custom collections
  - View try-on images in collections
  - Remove items from collections
  - View product details and external links
- **AI Chat**: Conversational styling assistant
  - Build complete outfits by adding multiple items
  - Natural language product requests
  - Context-aware recommendations
  - Multi-item outfit building
  - Conversation history
  - Product cards inline with chat
- **AI Personal Stylist**: Guided styling recommendations powered by LLMs
  - Understands your size, preferences, and past swipes
  - Generates curated outfits and complementary pieces
  - Explains why items work together and suggests alternatives
- **Profile & Settings**: Manage your account
  - Upload and manage photos (max 5)
  - Set primary photo for try-ons
  - Gender preferences (required for try-on)
  - Size preferences (top, bottom, shoes)
  - Budget range settings
  - Account management with Clerk
- **Onboarding Flow**: Smooth first-time user experience
  - Photo upload with validation
  - Style preferences setup
  - Gender selection (required)
  - Guided setup process

### Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5.9.3
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.1.16
- **Animation**: Framer Motion 12.23.24
- **Auth**: Clerk 6.34.1
- **Database**: Neon (PostgreSQL with Drizzle ORM)
- **ORM**: Drizzle ORM 0.44.7
- **State Management**: Zustand 5.0.8
- **Server State**: TanStack Query (React Query) 5.90.6
- **AI**: Google Gemini API 1.28.0
- **Icons**: Lucide React 0.552.0
- **Image Processing**: Sharp 0.33.5

## Project Structure

```
scootpie/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── onboarding/    # User onboarding flow
│   │   │   ├── sign-in/       # Sign in page
│   │   │   └── sign-up/       # Sign up page
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # AI chat endpoints
│   │   │   ├── collections/   # Collections management
│   │   │   ├── products/      # Product data
│   │   │   ├── search/        # Product search
│   │   │   ├── swipes/        # Swipe tracking
│   │   │   ├── tryon/         # Virtual try-on
│   │   │   ├── upload/        # File upload
│   │   │   └── user/          # User profile management
│   │   ├── chat/              # Chat page
│   │   ├── collections/       # Collections page
│   │   ├── profile/           # Profile page
│   │   ├── swipe/             # Swipe discovery page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── Navigation.tsx     # Sidebar navigation
│   │   ├── PhotoSearchCombined.tsx  # Photo upload & search
│   │   ├── swipe/            # Swipe components
│   │   └── ui/               # UI component library
│   ├── lib/                   # Utilities and database
│   │   ├── db/               # Database schema and client
│   │   └── utils.ts          # Helper functions
│   ├── services/             # External service integrations
│   ├── store/                # Zustand state management
│   └── types/                # TypeScript type definitions
├── scripts/                  # Utility scripts
└── public/                   # Static assets
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database scripts
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database with test data
npm run db:check     # Check database connection
```

## Design System

### Color Palette
- **Primary**: Purple gradient (#8B5CF6 to #7C3AED)
- **Background**: White with subtle gray gradients
- **Cards**: White with subtle borders (#E8E8E6)
- **Text**: Dark gray (#1A1A1A) for headings, medium gray (#5A5A5A) for body
- **Accents**: Purple (#8B5CF6) for interactive elements

### Typography
- **Headings**: Serif font (DM Serif Display) for elegant titles
- **Body**: Sans-serif font (Inter) for readability
- **UI Elements**: Clean, modern sans-serif

### Key UX Patterns
- **Fixed Navigation**: Sticky headers on all pages
- **Swipe Gestures**: Drag and swipe for product discovery
- **Bottom Navigation**: Mobile-friendly bottom nav bar
- **Smooth Animations**: Framer Motion for transitions
- **Empty States**: Clear CTAs and helpful messages
- **Loading States**: Skeleton loaders and spinners
- **Responsive Design**: Mobile-first approach with desktop sidebar

## Database Schema

### Core Tables
- **users**: User accounts and preferences
- **photos**: User uploaded photos for try-on
- **products**: Product catalog
- **swipes**: User swipe interactions
- **collections**: User collections
- **collection_items**: Items in collections
- **conversations**: Chat conversations
- **messages**: Chat messages
- **tryon_cache**: Cached try-on images

## Security

- All routes protected with Clerk authentication
- API routes require authenticated users
- Environment variables for sensitive data
- Type-safe database queries with Drizzle ORM
- Input validation on all forms
- Secure file upload handling
- CORS protection

## Performance

- Image optimization with Next.js Image component
- Lazy loading for images and components
- Code splitting with Next.js
- React Query caching for API responses
- Optimistic UI updates
- Database query optimization
- Try-on image caching

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Notes

### Current Implementation Status
- ✅ User authentication with Clerk
- ✅ Photo upload and management
- ✅ Product search and discovery
- ✅ Swipe interface with gestures
- ✅ Virtual try-on with Gemini API
- ✅ Collections management
- ✅ AI chat with outfit building
- ✅ User profile and preferences
- ✅ Onboarding flow
- ✅ Responsive design (mobile & desktop)
- ✅ Fixed navigation headers
- ⏳ Feed mode (planned)
- ⏳ Advanced product filtering (planned)
- ⏳ Social sharing (planned)

### Architecture Patterns
- **Server Components**: Used for data fetching and static content
- **Client Components**: Used for interactivity and state management
- **API Routes**: Next.js API routes for backend logic
- **Server Actions**: For form submissions and mutations
- **Middleware**: Clerk middleware for route protection

## Contributing

This is a private project. For questions or support, please reach out to the development team.

## License

All rights reserved.

---

Built with Next.js 16, TypeScript, React 19, and Tailwind CSS 4
