# Project Structure

## Root Workspace

```
yiwuexpress/
├── ecommerce-monorepo/        # Main monorepo (web + mobile)
├── dromkok.com_nginx/         # Nginx SSL configuration for dromkok.com
├── .kiro/                      # Kiro specs and steering files
│   ├── settings/              # Kiro configuration
│   └── steering/              # This directory - AI guidance
├── .claude/                   # Claude Code agent definitions
├── .codex/                    # Codex integrations
├── .cursor/                   # Cursor IDE rules
├── .opencode/                 # OpenCode configurations
├── .git/                      # Git repository
└── package.json               # Root workspace package.json
```

## Monorepo Structure

```
ecommerce-monorepo/
├── web/                       # Next.js web application
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── styles/                # Global styles
│   ├── public/                # Static assets & uploads
│   ├── prisma/                # Database schema & migrations
│   │   ├── schema.prisma      # Prisma schema definition
│   │   ├── migrations/        # Database migrations
│   │   └── seed*.ts           # Seed scripts for sample data
│   ├── scripts/               # Build and utility scripts
│   ├── docs/                  # API documentation
│   ├── coverage/              # Test coverage reports
│   ├── .next/                 # Next.js build output
│   ├── node_modules/          # Dependencies (not in git)
│   ├── package.json           # Web-specific dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tailwind.config.ts     # Tailwind CSS config
│   ├── next.config.js         # Next.js configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── middleware.ts          # Next.js middleware (auth, routing)
│   ├── server.js              # Custom Express server wrapper
│   └── .env.example           # Environment template
│
├── mobile/                    # React Native (Expo) app
│   ├── app/                   # Expo Router file-based routing
│   ├── src/                   # TypeScript source code
│   ├── components/            # React Native components
│   ├── assets/                # Images, fonts, media
│   ├── scripts/               # Asset generation scripts
│   ├── node_modules/          # Dependencies (not in git)
│   ├── package.json           # Mobile-specific dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── app.json               # Expo configuration
│   ├── babel.config.js        # Babel configuration
│   ├── App.tsx                # Entry point
│   ├── .env                   # Mobile environment config
│   └── .expo/                 # Expo cache and state
│
├── docker/                    # Docker setup
│   └── docker-compose.yml     # Docker Compose configuration
│
├── .kiro/                     # Kiro workspace config
│   ├── specs/                 # Feature specifications
│   ├── settings/              # Kiro settings
│   └── skills/                # Reusable skill modules
│
├── .git/                      # Git repository
├── .gitignore                 # Git ignore rules
├── .env.production            # Production environment template
├── vercel.json                # Vercel deployment config
└── README.md                  # Project readme
```

## Web Application Structure (app/)

```
web/app/
├── (auth)/                    # Auth layout group
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── layout.tsx             # Auth layout
│
├── (dashboard)/               # Dashboard layout group
│   ├── dashboard/             # User dashboard
│   ├── orders/                # Order history
│   ├── wishlist/              # Saved items
│   ├── profile/               # User profile settings
│   └── layout.tsx             # Dashboard layout
│
├── admin/                     # Admin panel
│   ├── products/              # Product management
│   ├── categories/            # Category management
│   ├── currencies/            # Currency configuration
│   ├── orders/                # Order management
│   └── dashboard/             # Admin dashboard
│
├── api/                       # API routes
│   ├── auth/                  # Authentication endpoints
│   ├── products/              # Product endpoints
│   ├── categories/            # Category endpoints
│   ├── cart/                  # Cart endpoints
│   ├── orders/                # Order endpoints
│   ├── users/                 # User endpoints
│   └── uploads/               # File upload endpoints
│
├── shop/                      # Public shopping pages
│   ├── page.tsx               # Shop page (products listing)
│   ├── [id]/                  # Product detail page
│   └── category/              # Category browsing
│
├── layout.tsx                 # Root layout
├── page.tsx                   # Homepage
├── globals.css                # Global styles
└── not-found.tsx              # 404 page
```

## Key Directories Explained

### `components/`
Reusable React components organized by feature:
- Header, Navigation, Footer
- Product cards and listings
- Forms and modals
- Authentication UI
- Admin components

### `lib/`
Utility functions and helpers:
- API client setup
- Validation functions
- Type definitions
- Authentication helpers
- Database query builders

### `hooks/`
Custom React hooks:
- useAuth - Authentication state
- useCart - Cart management
- useProducts - Product queries
- useCurrency - Currency formatting
- useUser - User preferences

### `prisma/`
Database layer:
- `schema.prisma` - Database schema (users, products, orders, etc.)
- `seed*.ts` - Sample data generators
- `migrations/` - Schema history

### `public/`
Static files and uploads:
- `uploads/` - User-uploaded images
- `logos/` - Brand assets
- `backgrounds/` - UI backgrounds
- Robots.txt, sitemap.xml

## Database Schema (Key Models)

```
- User (authentication, profile)
- Product (catalog items)
- Category (product categories)
- ProductAttribute (size, color, etc.)
- Cart (shopping cart items)
- Order (purchase records)
- Currency (multi-currency support)
- HeroSlide (homepage promotions)
- Wishlist (saved items)
```

## Environment & Configuration

**Local Development**
- `.env.local` - Local database and API URLs
- `localhost:3001` - Web app
- `localhost:8081` - Mobile app

**Production**
- `.env.production` - Production database and API URLs
- `dromkok.com` - Production domain
- PostgreSQL on production server

## Important Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Route protection, auth verification |
| `server.js` | Custom Next.js server wrapper |
| `next.config.js` | Next.js optimization and plugins |
| `tailwind.config.ts` | Design tokens and theme |
| `tsconfig.json` | TypeScript compiler options |
| `prisma/schema.prisma` | Database schema definition |
| `.env.example` | Configuration template |
| `vercel.json` | Vercel deployment settings |

## Git Structure

```
yiwuexpress/                  # Main repository
└── ecommerce-monorepo/       # Nested subrepository
```

Note: The monorepo is a separate git repository nested within the main workspace.

## Common Development Workflows

### Adding a New Page
1. Create folder in `web/app/[name]/`
2. Add `page.tsx` (Next.js page)
3. Add `layout.tsx` if custom layout needed
4. Import existing components from `components/`

### Adding an API Endpoint
1. Create folder in `web/app/api/[route]/`
2. Create `route.ts` with GET, POST, PUT, DELETE handlers
3. Use Prisma for database access

### Modifying Database Schema
1. Update `prisma/schema.prisma`
2. Run `npm run db:push` (development) or create migration
3. Run seed scripts if needed: `npm run db:seed`

### Mobile Development
1. Work in `mobile/app/` and `mobile/src/`
2. Run `npm run start` in mobile directory
3. Scan QR code with Expo Go app
4. Use same backend API endpoints (web backend serves both)

### Deployment Workflow
1. Test locally with production env vars
2. Build: `npm run build`
3. Deploy to production server or Vercel
4. Update DNS/nginx if needed
