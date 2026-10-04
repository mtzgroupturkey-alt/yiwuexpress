const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupAdmin() {
    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'GlobalTrade#2026!Secure';
    const adminPasswordHash = await bcrypt.hash(defaultPassword, 10);
    const adminEmails = ['admin@dromkok.com', 'admin@test.com'];

    for (const email of adminEmails) {
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        // IMPORTANT: Do NOT reset existing admin password on routine deployment!
        // Only ensure role and active status are preserved.
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: 'ADMIN',
            isActive: true,
          },
        });
        console.log(`✅ Admin user verified: ${email} (Existing password preserved)`);
      } else {
        const created = await prisma.user.create({
          data: {
            email,
            password: adminPasswordHash,
            name: 'Global Trade Admin',
            companyName: 'Global Trade',
            businessType: 'logistics_provider',
            role: 'ADMIN',
            country: 'China',
            phone: '+86 579 8555 1234',
            isActive: true,
            isVerified: true,
          },
        });
        console.log(`✅ Admin user initialized: ${email} (ID: ${created.id})`);
      }
    }
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()