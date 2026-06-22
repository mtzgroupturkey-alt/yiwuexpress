# 🌍 YIWU EXPRESS - E-Commerce Monorepo

> Global Trade & Logistics Platform connecting Yiwu, China to the world

## 🚀 Quick Start (First Time Setup)

### Step 1: Install Dependencies
```bash
# Backend
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm install

# Mobile
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npm install
```

### Step 2: Setup Database
```bash
# Double-click this file (EASIEST):
FIX-DATABASE.bat

# OR manually:
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run db:generate
npm run db:push
npm run db:seed
```

### Step 3: Start Servers
```bash
# Double-click this file:
QUICK-START.bat
```

**That's it!** Two terminal windows will open automatically.

---

## 📱 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3001 | Next.js API server |
| Mobile App (Web) | http://localhost:8081 | Expo development |
| API Test | http://localhost:3001/api/services | Test API endpoint |
| Prisma Studio | http://localhost:5555 | Database GUI |

---

## 🔐 Test Credentials

After running `FIX-DATABASE.bat`, use these credentials:

**Admin Account:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

**Customer Account:**
- Email: `user@example.com`
- Password: `password123`

---

## 📂 Project Structure

```
ecommerce-monorepo/
├── web/                    # Next.js Backend + Admin Panel
│   ├── app/               # Next.js 14 App Router
│   ├── prisma/            # Database schema & migrations
│   ├── components/        # React components
│   ├── lib/               # Utilities (auth, db, etc.)
│   ├── .env.local         # Environment variables
│   └── server.js          # Custom server with port validation
│
├── mobile/                # React Native Expo App
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── config/       # Configuration (API endpoints)
│   │   ├── components/   # React Native components
│   │   └── screens/      # App screens
│   ├── .env              # Expo environment variables
│   └── App.tsx           # Entry point
│
├── docker/               # Docker configuration (optional)
├── FIX-DATABASE.bat      # Database setup script
├── QUICK-START.bat       # Start both servers
├── CHECK-PORTS.bat       # Check port availability
└── README.md            # This file
```

---

## ⚙️ Configuration

### Static Ports (Never Change)
- **Backend:** Port 3001
- **Mobile:** Port 8081

### Environment Files

**Backend (`web/.env.local`):**
```env
PORT=3001
HOSTNAME=localhost
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
```

**Mobile (`mobile/.env`):**
```env
EXPO_PUBLIC_API_PORT=3001
EXPO_PORT=8081
```

---

## 🛠️ Available Scripts

### Backend (web/)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio GUI
```

### Mobile (mobile/)
```bash
npm start            # Start Expo dev server
npm run android      # Start Android emulator
npm run ios          # Start iOS simulator
npm run web          # Start web version
```

---

## 🔧 Troubleshooting

### ⚠️ Common Issues

#### 1. "500 Internal Server Error" on Login
**Solution:** Database not initialized
```bash
# Run this:
FIX-DATABASE.bat
```

#### 2. "EPERM: operation not permitted"
**Solution:** Files locked by Node process
1. Stop all terminals (Ctrl+C)
2. Close VS Code
3. Run: `taskkill /F /IM node.exe`
4. Run `FIX-DATABASE.bat` again

#### 3. "Port already in use"
**Solution:** Check and kill the process
```bash
# Run this:
CHECK-PORTS.bat

# OR manually:
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

#### 4. CORS Errors
**Solution:** Start backend BEFORE mobile
1. Start backend: `cd web && npm run dev`
2. Wait for "Ready on http://localhost:3001"
3. Start mobile: `cd mobile && npm start`

**📖 For more issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [SETUP-AND-START.md](SETUP-AND-START.md) | Complete setup guide |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Comprehensive troubleshooting |
| [PORT-CONFIG.md](PORT-CONFIG.md) | Port configuration details |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Database setup details |

---

## 🗄️ Database

**Type:** SQLite (Development)  
**Location:** `web/prisma/dev.db`

**Models:**
- User (Authentication & Profiles)
- Service (Logistics Services)
- Quote (Price Requests)
- Shipment (Tracking)
- CompanyInfo (Company Profiles)
- SystemSettings (App Configuration)

**View Database:**
```bash
cd web
npm run db:studio
# Opens at http://localhost:5555
```

---

## 🌟 Features

### Backend (Next.js)
- ✅ RESTful API
- ✅ JWT Authentication
- ✅ Prisma ORM (SQLite)
- ✅ CORS configured for mobile
- ✅ Static port (3001)
- ✅ TypeScript
- ✅ Zod validation
- ✅ bcrypt password hashing

### Mobile (React Native Expo)
- ✅ Cross-platform (iOS, Android, Web)
- ✅ Expo Router navigation
- ✅ TypeScript
- ✅ Centralized API configuration
- ✅ Static port (8081)
- ✅ Authentication flow
- ✅ Service browsing

---

## 🔒 Security Notes

**⚠️ DEVELOPMENT ONLY:**
- Default JWT_SECRET should be changed in production
- CORS allows all origins (*) - restrict in production
- SQLite database - use PostgreSQL in production
- Test credentials are public - remove in production

**Production Checklist:**
- [ ] Change JWT_SECRET to a strong random value
- [ ] Restrict CORS to specific domains
- [ ] Migrate to PostgreSQL
- [ ] Remove test accounts
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Add logging and monitoring

---

## 🚀 Deployment

### Backend
```bash
cd web
npm run build
npm run start
```

### Mobile
```bash
cd mobile
expo build:android  # For Android
expo build:ios      # For iOS
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

**Having issues?**
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Verify ports with `CHECK-PORTS.bat`
3. Try `FIX-DATABASE.bat`
4. Restart with `QUICK-START.bat`

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🏢 About YIWU EXPRESS

YIWU EXPRESS is a leading logistics and trade services provider specializing in:
- 🚢 International Shipping (Air & Sea)
- 📦 Customs Clearance
- 🏭 Warehouse Management
- 🔍 Yiwu Market Sourcing
- 🚚 Door-to-Door Delivery

**Connecting Yiwu, China to the World** 🌏

---

**Made with ❤️ for global trade**
