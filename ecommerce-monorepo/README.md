# YIWU EXPRESS 🚚🌏

**Global Trade & Logistics Platform from Yiwu, China**

A complete B2B logistics and international trade platform connecting businesses worldwide with professional shipping, customs clearance, warehousing, and sourcing services from Yiwu, China.

## 🏗️ Architecture

- **Frontend (Web)**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Frontend (Mobile)**: React Native with Expo, TypeScript  
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **State Management**: TanStack Query (React Query)
- **Form Validation**: React Hook Form + Zod
- **Containerization**: Docker Compose for PostgreSQL

## 🎯 Core Services

### Logistics Services
1. **Air Freight** - Fast international air shipping
2. **Sea Freight** - Cost-effective ocean shipping
3. **Customs Clearance** - Professional import/export documentation
4. **Warehousing** - Secure storage and inventory management
5. **Sourcing Services** - Product sourcing from Yiwu market
6. **Door-to-Door Delivery** - Complete logistics solutions

### Platform Features
- **Quote Request System** - Instant B2B service quotations
- **Shipment Tracking** - Real-time tracking updates
- **Document Management** - Digital customs paperwork
- **Company Profiles** - B2B business networking
- **Service Calculator** - Automated cost estimation
- **Multi-language Support** - Global business communication

## 📁 Project Structure

```
yiwu-express/
├── web/                 # Next.js web application
│   ├── app/            # App Router pages and API routes
│   ├── components/     # React components
│   ├── lib/           # Utilities, auth, validation
│   ├── prisma/        # Prisma schema and migrations
│   └── public/        # Static assets (logo, favicon)
├── mobile/            # React Native mobile app
│   ├── src/
│   │   ├── api/      # API client
│   │   ├── components/# React Native components
│   │   └── screens/  # App screens
│   └── assets/       # Images, icons
└── docker/           # Docker configuration
    └── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### 1. Setup Database

```bash
# Start PostgreSQL with Docker
cd docker
docker-compose up -d
```

### 2. Setup Web Application

```bash
# Navigate to web directory
cd ../web

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your configuration:
# DATABASE_URL="postgresql://user:password@localhost:5432/yiwu_express_db"
# JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Setup Prisma
npx prisma generate
npx prisma db push

# Run database seed (optional)
npx prisma db seed

# Start development server
npm run dev
```

### 3. Setup Mobile Application

```bash
# Navigate to mobile directory
cd ../mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Follow Expo instructions to run on device or emulator
```

## 🎨 Brand Identity

- **Primary Color**: `#1a3a5c` (Deep Navy Blue - trust, international trade)
- **Secondary Color**: `#c9a84c` (Gold - quality, premium service)  
- **Accent Color**: `#e74c3c` (Red - speed, express services)
- **Font Family**: Inter (professional, modern)
- **Tagline**: "Global Trade Solutions from Yiwu, China"

## 📊 Database Schema

```prisma
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  password    String
  name        String?
  companyName String?
  businessType String?
  taxId       String?
  role        String       @default("USER")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  quotes     Quote[]
  shipments  Shipment[]
  company    CompanyInfo?
}

model Service {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  duration    String?  // e.g., "3-5 days"
  coverage    String?  // e.g., "Global, Asia-Pacific"
  type        String   // shipping/customs/warehousing/sourcing
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  quotes     Quote[]
  shipments  Shipment[]
}

model Quote {
  id         String   @id @default(cuid())
  userId     String
  serviceId  String
  weight     Float?
  dimensions String?
  origin     String?
  destination String?
  price      Float
  validUntil DateTime
  status     String   @default("PENDING")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id])
}

model Shipment {
  id                String   @id @default(cuid())
  trackingNumber    String   @unique
  userId            String
  serviceId         String
  origin            String
  destination       String
  status            String   @default("PREPARING")
  estimatedDelivery DateTime
  actualDelivery    DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id])
}

model CompanyInfo {
  id           String   @id @default(cuid())
  userId       String   @unique
  name         String
  address      String
  phone        String
  email        String
  licenseNumber String?
  taxId        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Business registration
- `POST /api/auth/login` - Business login

### Services
- `GET /api/services` - List logistics services
- `GET /api/services/[id]` - Get service details

### Quotes (B2B Quotations)
- `GET /api/quotes` - Get business quotes
- `POST /api/quotes` - Create new quote request
- `GET /api/quotes/calculate` - Calculate shipping costs

### Shipments
- `GET /api/shipments` - Get business shipments
- `GET /api/shipments/track/[trackingNumber]` - Track shipment

### Company Info
- `GET /api/company` - Get company profile
- `POST /api/company` - Update company profile

## 📱 Mobile Application Features

### Navigation Tabs
1. **Home** - Platform overview and services
2. **Services** - Browse logistics services
3. **Track** - Shipment tracking
4. **Quotes** - B2B quote requests
5. **Profile** - Business profile and settings

### Screens
- **HomeScreen** - Platform introduction and quick actions
- **ServiceDetailScreen** - Logistics service details
- **QuoteRequestScreen** - B2B quote submission
- **ShipmentTrackingScreen** - Real-time shipment tracking
- **ProfileScreen** - Business account management

## 🛠️ Development Commands

### Web Application
```bash
# Development
npm run dev

# Build for production
npm run build
npm start

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database with logistics data

# Linting
npm run lint
```

### Mobile Application
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

## 🔒 Security Features

- Business-grade JWT authentication
- Password hashing with bcrypt
- API route protection with middleware
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- Environment variable configuration
- CORS configuration for secure API access

## 📈 Business Features

### For International Businesses
- Instant shipping cost calculations
- Customs documentation assistance
- Real-time shipment tracking
- Digital paperwork management
- Multi-currency support
- Global coverage mapping

### For YIWU EXPRESS Operations
- Service management dashboard
- Quote request processing
- Shipment status updates
- Customer relationship management
- Billing and invoicing system
- Analytics and reporting

## 🌍 Global Network

### Coverage Areas
- **Asia**: China, Vietnam, Thailand, Malaysia, Singapore
- **Europe**: Germany, UK, France, Italy, Spain
- **Americas**: USA, Canada, Mexico, Brazil
- **Middle East**: UAE, Saudi Arabia, Qatar
- **Africa**: South Africa, Nigeria, Kenya

### Yiwu Headquarters
- **Address**: Yiwu International Trade City, Zhejiang, China
- **Phone**: +86 579 8555 1234
- **Email**: info@yiwuexpress.com
- **Business Hours**: 08:00 - 18:00 (GMT+8)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs yiwu-express-db

# Reset database (development only)
npx prisma migrate reset
```

### Mobile Connection Issues
1. Ensure web app is running (`npm run dev`)
2. Update API URL in mobile with your local IP
3. Check firewall settings
4. Ensure devices are on same network

### Prisma Issues
```bash
# Reset Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset --force
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Yiwu International Trade Market
- Global logistics partners
- International trade communities
- Open-source contributors

## 📞 Support

For issues and feature requests, please contact:
- **Email**: support@yiwuexpress.com
- **Phone**: +86 579 8555 5678
- **Address**: Yiwu International Trade City, Zhejiang, China

---

**YIWU EXPRESS - Connecting Global Businesses from the World's Largest Small Commodities Market** 🚚🌏

*Global Trade Solutions from Yiwu, China*