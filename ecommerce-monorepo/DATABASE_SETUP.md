# Database Setup Instructions - YIWU EXPRESS 🗄️

Follow these steps to set up and seed the PostgreSQL database for the YIWU EXPRESS platform.

## Prerequisites
- Docker and Docker Compose installed.
- Node.js 18+ and npm installed.

---

## Steps

### 1. Spin up PostgreSQL Container
Navigate to the `docker/` directory and run Docker Compose:
```bash
cd docker
docker-compose up -d
```
This runs a PostgreSQL instance on port `5432` with a database named `ecommerce` (as configured in the environment variables).

### 2. Configure Environment Variables
Copy the `.env.example` file in the `web/` directory to `.env.local`:
```bash
cd ../web
cp .env.example .env.local
```
Ensure your `web/.env.local` contains the following connection string:
```env
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"
```

### 3. Generate Prisma Client & Migrate Schema
Run the following commands within the `web/` directory:
```bash
# Generate type-safe Prisma client
npx prisma generate

# Sync schema definitions and create tables
npx prisma db push
```

### 4. Seed the Database
Populate your database with default YIWU EXPRESS services, sample quotes, and test shipments:
```bash
npm run db:seed
```

---

## Verifying the Database
You can explore the seeded tables using Prisma Studio:
```bash
npx prisma studio
```
This will open an interactive web browser interface at `http://localhost:5555`.
