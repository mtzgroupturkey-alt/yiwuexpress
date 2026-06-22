import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding permission roles...')

  // Admin Role - Full access
  const adminRole = await prisma.permissionRole.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      isSystem: true,
      permissions: {
        create: [
          { resource: 'dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'services', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'quotes', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'quotes_view', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'quotes_approve', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'shipments', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'shipments_tracking', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'settings_company', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'settings_general', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'settings_email', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'permissions', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'backup', canView: true, canCreate: true, canEdit: true, canDelete: true },
        ]
      }
    }
  })

  // Manager Role - Most access except permissions
  const managerRole = await prisma.permissionRole.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Manage users, services, quotes, and shipments',
      isSystem: true,
      permissions: {
        create: [
          { resource: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'users', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'services', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'quotes', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'quotes_view', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'quotes_approve', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { resource: 'shipments', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'shipments_tracking', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'settings', canView: true, canCreate: false, canEdit: true, canDelete: false },
          { resource: 'settings_company', canView: true, canCreate: false, canEdit: true, canDelete: false },
          { resource: 'settings_general', canView: true, canCreate: false, canEdit: true, canDelete: false },
          { resource: 'settings_email', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'permissions', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'backup', canView: true, canCreate: true, canEdit: false, canDelete: false },
        ]
      }
    }
  })

  // Staff Role - Limited create/edit access
  const staffRole = await prisma.permissionRole.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      name: 'Staff',
      description: 'Handle quotes and shipments, view other sections',
      isSystem: true,
      permissions: {
        create: [
          { resource: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'users', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'services', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'quotes', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'quotes_view', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'quotes_approve', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'shipments', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'shipments_tracking', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { resource: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings_company', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings_general', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings_email', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'permissions', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'backup', canView: false, canCreate: false, canEdit: false, canDelete: false },
        ]
      }
    }
  })

  // Viewer Role - Read-only access
  const viewerRole = await prisma.permissionRole.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access to most sections',
      isSystem: false,
      permissions: {
        create: [
          { resource: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'users', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'services', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'quotes', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'quotes_view', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'quotes_approve', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'shipments', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'shipments_tracking', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings_company', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings_general', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'settings_email', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'permissions', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { resource: 'backup', canView: false, canCreate: false, canEdit: false, canDelete: false },
        ]
      }
    }
  })

  console.log('✅ Permission roles created:', {
    admin: adminRole.id,
    manager: managerRole.id,
    staff: staffRole.id,
    viewer: viewerRole.id
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
