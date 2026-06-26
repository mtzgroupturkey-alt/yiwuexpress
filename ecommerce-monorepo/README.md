# YIWU EXPRESS - Global Trade & Logistics Platform

> Leading B2B international trade platform connecting China to the world. Specializing in international shipping, customs clearance, and market sourcing from Yiwu.

## 🌟 Overview

YIWU EXPRESS is a comprehensive B2B logistics and e-commerce platform built with modern technologies to facilitate international trade between China and target markets including Russia, Belarus, Turkmenistan, Afghanistan, Kazakhstan, Uzbekistan, Tajikistan, and Kyrgyzstan.

### Key Features

- 🌍 **Multi-Country Support** - 8 target countries with localized shipping, customs, and payment configuration
- 📦 **E-Commerce Platform** - Complete product catalog with international shipping compliance
- 🚚 **Logistics Services** - Air freight, sea freight, customs brokerage, warehousing, and sourcing
- 🏢 **B2B Wholesale** - 12-state wholesale inquiry workflow with quote management
- 📱 **Mobile App** - React Native mobile application for iOS and Android
- 🔐 **Role-Based Access** - Admin, staff, and customer roles with granular permissions
- 📊 **Order Management** - 20+ status workflow with complete tracking history
- 🧾 **Customs Documentation** - Automated customs document generation
- 💳 **Multiple Payment Methods** - Bank transfer, crypto, PayPal, Stripe support

---

## 🏗️ Architecture

### Monorepo Structure

```
ecommerce-monorepo/
├── web/                    # Next.js 14 web application
│   ├── app/               # App Router pages and API routes
│   ├── prisma/            # Database schema and migrations
│   ├── public/            # Static assets
│   └── package.json
├── mobile/                # React Native Expo mobile app
│   ├── src/              # Mobile app source code
│   ├── assets/           # Mobile assets
│   └── package.json
├── docker/               # Docker configuration
│   └── docker-compose.yml # PostgreSQL container
└── README.md
```

### Tech Stack

**Backend:**
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

**Frontend:**
- React 18
- Tailwind CSS
- Lucide Icons
- React Query

**Mobile:**
- React Native
- Expo
- React Native Paper
- TypeScript

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for PostgreSQL)
- Git

### Automated Setup (Recommended)

Run the Phase 1 setup script:

```bash
# Windows
setup-phase1.bat

# This will:
# 1. Check Docker
# 2. Start PostgreSQL
# 3. Install dependencies
# 4. Generate Prisma Client
# 5. Push schema to database
# 6. Seed database with sample data
```

### Manual Setup

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/yiwuexpress.git
cd yiwuexpress/ecommerce-monorepo
```

#### 2. Start PostgreSQL

```bash
cd docker
docker-compose up -d
```

#### 3. Setup Web Application

```bash
cd ../web
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

#### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3001

#### 5. Setup Mobile Application (Optional)

```bash
cd ../mobile
npm install
npm start
```

Scan QR code with Expo Go app

---

## 🔐 Default Credentials

After seeding, use these credentials to log in:

**Admin Account:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

**Customer Account:**
- Email: `user@example.com`
- Password: `password123`

⚠️ **Important:** Change these credentials in production!

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Most endpoints require JWT authentication. Include the token in headers:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### Countries & Shipping

```http
GET /api/countries
GET /api/countries/:code
POST /api/shipping/calculate
```

#### Products & Categories

```http
GET /api/products?category=kitchenware&page=1&limit=20
GET /api/products/:slug
POST /api/products (Admin)
GET /api/categories
```

#### Orders

```http
GET /api/orders?userId=xxx
POST /api/orders
GET /api/orders/:id
PUT /api/orders/:id/status (Admin)
```

#### Cart

```http
GET /api/cart?userId=xxx
POST /api/cart
PUT /api/cart/:itemId
DELETE /api/cart/:itemId
```

#### Wholesale

```http
GET /api/wholesale
POST /api/wholesale
GET /api/wholesale/:id
POST /api/wholesale/:id/quote (Admin)
PUT /api/wholesale/:id/status (Admin)
```

#### Services & Quotes (Existing)

```http
GET /api/services
POST /api/quotes
GET /api/shipments/:trackingNumber
```

For complete API documentation, see `docs/API.md`

---

## 🗄️ Database Schema

### Core Models

- **User** - User accounts with roles and permissions
- **Country** - Country configuration (8 target countries)
- **ShippingRate** - Shipping rates per country/carrier
- **Category** - Product categories
- **Product** - Products with compliance fields (HS codes, weight, etc.)
- **Order** - Orders with 20+ status workflow
- **OrderItem** - Order line items
- **Cart** - Shopping cart
- **WholesaleInquiry** - B2B wholesale inquiries
- **Service** - Logistics services
- **Quote** - Service quotes
- **Shipment** - Shipment tracking

### Key Features

- 20+ order statuses with workflow validation
- Complete tracking history (JSON timeline)
- Product compliance fields for international shipping
- Country-specific customs rules
- Wholesale 12-state workflow
- Exception handling

---

## 📱 Mobile App

### Features

- Product browsing and search
- Shopping cart
- Order placement
- Order tracking
- Wholesale inquiries
- User profile management
- Multi-language support

### Running Mobile App

```bash
cd mobile
npm start
```

Scan QR code with:
- **iOS:** Expo Go app from App Store
- **Android:** Expo Go app from Play Store

---

## 🛠️ Development

### Database Management

**Prisma Studio** - Visual database browser
```bash
cd web
npx prisma studio
```
Visit: http://localhost:5555

**Generate Prisma Client** after schema changes
```bash
npx prisma generate
```

**Push schema changes**
```bash
npx prisma db push
```

**Create migration**
```bash
npx prisma migrate dev --name migration_name
```

**Re-seed database**
```bash
npm run db:seed
```

### Environment Variables

Create `web/.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
HOSTNAME=localhost

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
```

### Scripts

**Web Application:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

**Mobile Application:**
```bash
npm start            # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run on web
```

---

## 📋 Implementation Phases

### ✅ Phase 1: Database & Core Enhancements (COMPLETE)
- PostgreSQL migration
- Country configuration system
- Product compliance fields
- Order system with 20+ statuses
- Shopping cart
- Wholesale B2B inquiry system

### 🚧 Phase 2: Order Workflow & Exception Handling (IN PROGRESS)
- Exception handlers for 12+ scenarios
- Email notifications
- Payment failure workflows
- Customs hold management
- Return and refund workflows

### 📅 Phase 3: Wholesale B2B System
- Admin wholesale dashboard
- Proforma invoice generation
- Payment verification
- Order conversion

### 📅 Phase 4: Customs Document Generation
- Commercial invoice
- Packing list
- Certificate of Origin
- Bill of Lading
- PDF generation and storage

### 📅 Phase 5: Complete Mobile App
- All 20+ screens
- Complete shopping flow
- Order tracking
- Profile management

### 📅 Phase 6: Admin Panel Completion
- Complete admin dashboard
- Analytics and reports
- Bulk operations
- User management

### 📅 Phase 7: Payment Integration
- Stripe integration
- PayPal integration
- Crypto payments (USDT)
- Payment webhooks

### 📅 Phase 8: Real-Time Logistics Integration
- DHL API integration
- EMS tracking
- FedEx integration
- Carrier webhooks

### 📅 Phase 9: Analytics & Reporting
- Sales analytics
- Customer analytics
- Logistics analytics
- Report generation

### 📅 Phase 10: Security & Performance
- Security hardening
- Rate limiting
- Caching (Redis)
- Performance optimization

### 📅 Phase 11: Deployment & Operations
- Production deployment
- CI/CD pipeline
- Monitoring and alerts
- Documentation

For detailed implementation status, see `PHASE_1_COMPLETE.md`

---

## 🧪 Testing

### Manual Testing

1. **Test Countries API:**
```bash
curl http://localhost:3001/api/countries
```

2. **Test Shipping Calculator:**
```bash
curl -X POST http://localhost:3001/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"RU","weightKg":10,"serviceType":"express"}'
```

3. **Test Product API:**
```bash
curl http://localhost:3001/api/products?featured=true
```

### Automated Tests

```bash
# Coming in Phase 10
npm test
```

---

## 🌍 Supported Countries

| Country | Code | Currency | Shipping Methods | Payment Methods |
|---------|------|----------|------------------|-----------------|
| 🇷🇺 Russia | RU | RUB (₽) | Standard, Express, Sea | Bank Transfer, Crypto |
| 🇧🇾 Belarus | BY | BYN (Br) | Standard, Express, Sea | Bank Transfer, Crypto |
| 🇹🇲 Turkmenistan | TM | TMT (T) | Standard, Express | Bank Transfer |
| 🇦🇫 Afghanistan | AF | USD ($) | Standard, Express | Bank Transfer |
| 🇰🇿 Kazakhstan | KZ | KZT (₸) | Standard, Express, Sea | Bank Transfer, Crypto |
| 🇺🇿 Uzbekistan | UZ | UZS (so'm) | Standard, Express | Bank Transfer |
| 🇹🇯 Tajikistan | TJ | TJS (ЅМ) | Standard, Express | Bank Transfer |
| 🇰🇬 Kyrgyzstan | KG | KGS (с) | Standard, Express | Bank Transfer |

---

## 📖 Documentation

- `MIGRATION_GUIDE.md` - Database migration instructions
- `PHASE_1_COMPLETE.md` - Phase 1 implementation summary
- `DATABASE_SETUP.md` - Database setup guide
- `docs/API.md` - Complete API documentation (coming soon)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Team

- **Development Team:** YIWU EXPRESS Engineering
- **Contact:** info@yiwuexpress.com
- **Website:** https://yiwuexpress.com

---

## 🆘 Support

For support and questions:
- 📧 Email: info@yiwuexpress.com
- 📞 Phone: +86 579 8555 1234
- 🌐 Website: https://yiwuexpress.com

---

## 🗺️ Roadmap

- [x] Phase 1: Core database and models
- [ ] Phase 2: Order workflow and exceptions
- [ ] Phase 3: Wholesale B2B system
- [ ] Phase 4: Customs documentation
- [ ] Phase 5: Mobile app completion
- [ ] Phase 6: Admin panel
- [ ] Phase 7: Payment integration
- [ ] Phase 8: Logistics integration
- [ ] Phase 9: Analytics
- [ ] Phase 10: Security & performance
- [ ] Phase 11: Production deployment

---

**Built with ❤️ in Yiwu, China**
