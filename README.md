# Yiwu Express - E-commerce Platform -MTZ GROUP

A comprehensive e-commerce platform consisting of a web application and mobile app for logistics and shipping services.

## Project Structure

This is a monorepo containing:

- **Web Application** (`ecommerce-monorepo/web/`) - Next.js web platform
- **Mobile Application** (`ecommerce-monorepo/mobile/`) - React Native/Expo mobile app
- **Database** - Shared database setup and configuration

## Features

### Web Platform
- User authentication and registration
- Service management
- Quote requests and calculations
- Shipment tracking
- Admin dashboard
- Company settings management

### Mobile App
- Cross-platform React Native app (iOS/Android)
- User-friendly interface for services
- Quote requests
- Shipment tracking
- Profile management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- For mobile development: Expo CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abbasbalkhi2010/yiwuexpress.git
cd yiwuexpress
```

2. Install dependencies for web application:
```bash
cd ecommerce-monorepo/web
npm install
```

3. Install dependencies for mobile application:
```bash
cd ../mobile
npm install
```

### Development

#### Web Application
```bash
cd ecommerce-monorepo/web
npm run dev
```

#### Mobile Application
```bash
cd ecommerce-monorepo/mobile
npm start
# or
npx expo start
```

## Tech Stack

### Web
- **Framework**: Next.js 14
- **Database**: Prisma ORM
- **Authentication**: JWT
- **UI**: React, Tailwind CSS
- **API**: Next.js API Routes

### Mobile
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **UI**: React Native components
- **State Management**: React hooks

## Database Setup

Refer to `ecommerce-monorepo/DATABASE_SETUP.md` for detailed database configuration instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact [Your Email] or create an issue in this repository.