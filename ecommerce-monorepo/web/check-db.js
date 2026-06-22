const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  console.log('=== SystemSettings Table ===');
  const systemSettings = await prisma.systemSettings.findMany();
  console.log('Count:', systemSettings.length);
  if (systemSettings.length > 0) {
    console.log('Data:', JSON.stringify(systemSettings[0], null, 2));
  } else {
    console.log('No records found');
  }
  
  console.log('\n=== CompanyInfo Table ===');
  const companyInfo = await prisma.companyInfo.findMany();
  console.log('Count:', companyInfo.length);
  if (companyInfo.length > 0) {
    console.log('Data:', JSON.stringify(companyInfo, null, 2));
  } else {
    console.log('No records found');
  }
  
  console.log('\n=== User Table ===');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, companyName: true }
  });
  console.log('Users:', users.length);
  users.forEach(user => console.log('- ' + user.email + ' (' + (user.companyName || 'No company') + ')'));
  
  await prisma.$disconnect();
}

checkTables().catch(console.error);