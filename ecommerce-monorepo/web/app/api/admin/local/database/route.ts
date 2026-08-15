export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { syncPrismaSchema, generatePrismaClient, seedDatabase, openPrismaStudio, exportDatabase } from '@/lib/deploy/local';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    let result: any;

    switch (action) {
      case 'sync':
        result = await syncPrismaSchema();
        break;

      case 'generate':
        result = await generatePrismaClient();
        break;

      case 'seed':
        result = await seedDatabase();
        break;

      case 'studio':
        result = await openPrismaStudio();
        break;

      case 'export':
        result = await exportDatabase();
        break;

      case 'tables':
        // Get all tables
        const tables = await prisma.$queryRaw`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          ORDER BY tablename;
        `;
        result = tables;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
