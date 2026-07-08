# Technology Stack

## Architecture

**Monorepo Structure** (ecommerce-monorepo):
```
ecommerce-monorepo/
├── web/           # Next.js web application
├── mobile/        # React Native (Expo) app
├── docker/        # Docker Compose for local development
└── .kiro/         # Spec and config files
```

## Web Stack (Next.js)

**Framework & Runtime**
- Next.js 14.2.19 (App Router)
- Node.js (development and production)
- TypeScript 5.x
- React 18

**Styling & UI**
- Tailwind CSS 3.3.0
- Framer Motion (animations)
- Lucide React (icons)
- React Hot Toast (notifications)
- Radix UI (select components)

**Data & State**
- Prisma 6.0.0 (ORM)
- PostgreSQL (database)
- Zustand (state management)
- React Query / TanStack Query (data fetching)

**Form & Validation**
- React Hook Form
- Zod (schema validation)

**Payments & Auth**
- Stripe integration
- PayPal integration
- JWT (jose library)
- bcryptjs (password hashing)
- Nodemailer (email)

**Graphics & 3D**
- GSAP (animations)
- Cobe (3D globe)
- OGL (WebGL rendering)

**PDF & File Handling**
- PDFKit (PDF generation)
- File upload to public/uploads

## Mobile Stack (React Native)

**Framework & Runtime**
- Expo 52.0.0
- React Native 0.76.9
- React 18.3.1
- TypeScript 5.x

**Navigation & UI**
- Expo Router (file-based routing)
- React Native Paper (UI components)
- Lucide React Native (icons)
- React Native Reanimated (animations)
- React Native SVG (vector graphics)

**State & Data**
- Zustand (state management)
- React Query (data fetching)
- Async Storage (local persistence)

**HTTP Client**
- Axios

**Notifications**
- Expo Notifications

## Database

**PostgreSQL**
- Version: PostgreSQL 12+ (recommended)
- ORM: Prisma 6.0.0
- Seed scripts for development data

## Server Setup

**Development Server**
- Custom Express wrapper around Next.js (server.js)
- Port: 3001 (default, configurable)
- Supports proxy routing for API endpoints

**Production Deployment**
- Node.js with custom server
- Environment: production
- Domain: dromkok.com (production), localhost (dev)

## Common Build & Development Commands

### Web Development
```bash
# Install dependencies
npm install

# Development server (port 3001)
npm run dev

# Build for production
npm run build

# Production server
npm run start

# Linting
npm run lint

# Database commands
npm run db:generate      # Generate Prisma client
npm run db:push          # Sync schema to database
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed sample data
npm run db:seed:all      # Seed all sample data
npm run db:seed:products # Seed product data
```

### Mobile Development
```bash
# Install dependencies
npm install

# Start dev server (port 8081)
npm run start

# Build for Android
npm run android

# Build for iOS
npm run ios

# Build for web (port 8081)
npm run web
```

### Docker
```bash
# Run entire stack in Docker
docker-compose up

# Development databases and services
docker-compose -f docker-compose.yml up
```

## Port Configuration

| Service | Port | Environment |
|---------|------|-------------|
| Web App | 3001 | dev/prod |
| Mobile Expo | 8081 | dev |
| Database (local) | 5432 | local |
| Prisma Studio | 5555 | dev (on demand) |

## Environment Configuration

- **Local**: `.env.local` - Development environment
- **Production**: `.env.production` - Production environment
- **Template**: `.env.example` - Configuration template

Critical env variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing key (64+ chars)
- `NEXT_PUBLIC_API_URL`: API endpoint URL
- `STRIPE_SECRET_KEY` / `PAYPAL_CLIENT_ID`: Payment gateway keys

## Build System

**Next.js Build**
- Command: `npm run build`
- Output: `.next/` directory
- Optimization: Server-side rendering, static generation

**Prisma Migrations**
- Auto migration on `db:push` (development)
- Manual migrations in production recommended

## Code Quality

- TypeScript strict mode enabled
- ESLint with Next.js config
- Tailwind CSS linting via PostCSS
- No Prettier configured (manual formatting)

## Performance Considerations

- Image optimization via Next.js Image component
- Framer Motion for smooth animations
- React Query for efficient data fetching
- Zustand for lightweight state management
- Tailwind CSS for optimized bundle size
